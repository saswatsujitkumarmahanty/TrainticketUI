import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { TrainService } from '../../core/services/train.service';
import { BookingCreatedResult } from '../../core/models/booking.model';

interface TripInfo {
  trainId: number;
  classId: number;
  fromStationId: number;
  toStationId: number;
  journeyDate: string;
  trainNumber: string;
  trainName: string;
  trainType: string;
  arrivalTime: string;
  daysTaken: number;
  classCode: string;
  className: string;
  fare: number;
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
}

interface ReturnOption {
  trainId: number;
  trainNumber: string;
  trainName: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  status: string;
}

const MAX_PASSENGERS = 8;

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-booking',
  styleUrl: './booking.css',
  templateUrl: './booking.html',
})
export class Booking implements OnInit {
  trip: TripInfo | null = null;
  loading = false;
  errorMessage = '';
  results: BookingCreatedResult[] = [];
  bookedAsReturn = false;

  // return journey (same day, same class, same passengers)
  withReturn = false;
  returnLoading = false;
  returnMessage = '';
  returnOptions: ReturnOption[] = [];
  selectedReturnId: number | null = null;

  form!: ReturnType<FormBuilder['group']>;

  // unreserved (local train) ticket: just counts, no passenger names
  adults = 1;
  children = 0;

  readonly maxPassengers = MAX_PASSENGERS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private bookings: BookingService,
    private trains: TrainService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      passengers: this.fb.array([this.buildPassenger()])
    });
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const trainId = Number(q.get('trainId'));
    const classId = Number(q.get('classId'));
    const fromStationId = Number(q.get('fromStationId'));
    const toStationId = Number(q.get('toStationId'));

    if (!trainId || !classId || !fromStationId || !toStationId || !q.get('journeyDate')) {
      this.router.navigate(['/train-search']);
      return;
    }

    this.trip = {
      trainId,
      classId,
      fromStationId,
      toStationId,
      journeyDate: q.get('journeyDate')!,
      trainNumber: q.get('trainNumber') ?? '',
      trainName: q.get('trainName') ?? '',
      trainType: q.get('trainType') ?? '',
      arrivalTime: q.get('arrivalTime') ?? '',
      daysTaken: Number(q.get('daysTaken') ?? 0),
      classCode: q.get('classCode') ?? '',
      className: q.get('className') ?? '',
      fare: Number(q.get('fare') ?? 0),
      fromCode: q.get('fromCode') ?? '',
      fromName: q.get('fromName') ?? '',
      toCode: q.get('toCode') ?? '',
      toName: q.get('toName') ?? ''
    };
  }

  get passengers(): FormArray {
    return this.form.get('passengers') as FormArray;
  }

  get isLocal(): boolean {
    return this.trip?.trainType === 'Local';
  }

  get totalPassengers(): number {
    return this.isLocal ? this.adults + this.children : this.passengers.length;
  }

  changeAdults(delta: number): void {
    const next = this.adults + delta;
    if (next < 1 || next + this.children > this.maxPassengers) return;
    this.adults = next;
  }

  changeChildren(delta: number): void {
    const next = this.children + delta;
    if (next < 0 || this.adults + next > this.maxPassengers) return;
    this.children = next;
  }

  // Local trains: RETURN is a single ticket (2x fare, valid same day on the opposite route),
  // so there is no return train to pick.
  setTicketType(isReturn: boolean): void {
    this.withReturn = isReturn;
    this.errorMessage = '';
  }

  // The API still expects a passenger list, so build one from the counts.
  private localPassengers() {
    const list: { name: string; age: number; gender: 'T' }[] = [];
    for (let i = 1; i <= this.adults; i++) list.push({ name: `Adult ${i}`, age: 30, gender: 'T' });
    for (let i = 1; i <= this.children; i++) list.push({ name: `Child ${i}`, age: 8, gender: 'T' });
    return list;
  }

  private buildPassenger() {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      age: [null, [Validators.required, Validators.min(1), Validators.max(120)]],
      gender: ['', [Validators.required]]
    });
  }

  addPassenger(): void {
    if (this.passengers.length < this.maxPassengers) {
      this.passengers.push(this.buildPassenger());
    }
  }

  removePassenger(index: number): void {
    if (this.passengers.length > 1) {
      this.passengers.removeAt(index);
    }
  }

  get selectedReturn(): ReturnOption | null {
    return this.returnOptions.find((o) => o.trainId === this.selectedReturnId) ?? null;
  }

  get totalFare(): number {
    if (this.isLocal) {
      return (this.trip?.fare ?? 0) * (this.withReturn ? 2 : 1) * this.totalPassengers;
    }
    const perPassenger = (this.trip?.fare ?? 0) + (this.withReturn ? (this.selectedReturn?.fare ?? 0) : 0);
    return perPassenger * this.totalPassengers;
  }

  toggleReturn(checked: boolean): void {
    this.withReturn = checked;
    this.returnOptions = [];
    this.selectedReturnId = null;
    this.returnMessage = '';
    this.errorMessage = '';
    if (checked) {
      this.loadReturnOptions();
    }
  }

  selectReturn(value: string): void {
    this.selectedReturnId = value ? Number(value) : null;
  }

  private loadReturnOptions(): void {
    if (!this.trip) return;
    const trip = this.trip;

    if (trip.daysTaken > 0) {
      this.returnMessage = 'This train arrives the next day, so a same-day return is not possible.';
      return;
    }

    this.returnLoading = true;
    this.trains.search(trip.toStationId, trip.fromStationId, trip.journeyDate).subscribe({
      next: (res) => {
        const options: ReturnOption[] = [];
        for (const t of res) {
          const cls = t.classes.find((c) => c.classId === trip.classId);
          if (!cls) continue;
          // the return train must leave after the outbound train has arrived
          if (trip.arrivalTime && t.departureTime <= trip.arrivalTime) continue;
          options.push({
            trainId: t.trainId,
            trainNumber: t.trainNumber,
            trainName: t.trainName,
            departureTime: t.departureTime,
            arrivalTime: t.arrivalTime,
            fare: cls.fare,
            status: cls.status
          });
        }
        this.returnOptions = options;
        this.returnMessage = options.length ? '' : 'No return trains found later the same day in this class.';
        this.returnLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.returnLoading = false;
        this.returnMessage = 'Could not load return trains. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  confirmBooking(): void {
    if (!this.trip) return;
    if (!this.isLocal && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const passengers = this.isLocal ? this.localPassengers() : this.passengers.value;
    if (!this.isLocal && this.withReturn && !this.selectedReturnId) {
      this.errorMessage = 'Choose a return train, or untick the return journey.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    if (!this.isLocal && this.withReturn && this.selectedReturnId) {
      this.bookings
        .createRoundTrip({
          classId: this.trip.classId,
          outboundTrainId: this.trip.trainId,
          returnTrainId: this.selectedReturnId,
          fromStationId: this.trip.fromStationId,
          toStationId: this.trip.toStationId,
          journeyDate: this.trip.journeyDate,
          passengers: passengers as any
        })
        .subscribe({
          next: (res) => {
            this.loading = false;
            this.results = res.bookings;
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loading = false;
            this.errorMessage = err?.error?.error || 'Could not complete the booking. Please try again.';
            this.cdr.markForCheck();
          }
        });
      return;
    }

    this.bookings
      .create({
        trainId: this.trip.trainId,
        classId: this.trip.classId,
        fromStationId: this.trip.fromStationId,
        toStationId: this.trip.toStationId,
        journeyDate: this.trip.journeyDate,
        isReturn: this.isLocal && this.withReturn,
        passengers: passengers as any
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.bookedAsReturn = this.isLocal && this.withReturn;
          this.results = [res];
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.error || 'Could not complete the booking. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }
}