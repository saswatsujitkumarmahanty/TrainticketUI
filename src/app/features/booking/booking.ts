import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { BookingCreatedResult } from '../../core/models/booking.model'

interface TripInfo {
  trainId: number;
  classId: number;
  fromStationId: number;
  toStationId: number;
  journeyDate: string;
  trainNumber: string;
  trainName: string;
  classCode: string;
  className: string;
  fare: number;
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
}

const MAX_PASSENGERS = 6;

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
  result: BookingCreatedResult | null = null;

  form!: ReturnType<FormBuilder['group']>;

  readonly maxPassengers = MAX_PASSENGERS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private bookings: BookingService,
    private cdr: ChangeDetectorRef
  ) 
  {
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
      this.router.navigate(['/search']);
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

  get totalFare(): number {
    return (this.trip?.fare ?? 0) * this.passengers.length;
  }

  confirmBooking(): void {
    if (!this.trip || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.bookings
      .create({
        trainId: this.trip.trainId,
        classId: this.trip.classId,
        fromStationId: this.trip.fromStationId,
        toStationId: this.trip.toStationId,
        journeyDate: this.trip.journeyDate,
        passengers: this.passengers.value
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.result = res;
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