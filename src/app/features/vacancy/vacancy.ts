import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, forkJoin, map, of, switchMap } from 'rxjs';
import { StationService } from '../../core/services/station.service';
import { TrainService } from '../../core/services/train.service';
import { Station } from '../../core/models/station.model';
import { ClassAvailability, TrainSearchResult } from '../../core/models/train.model';

interface VacancyRow {
  date: string;
  train: TrainSearchResult | null; // null => train not running / no data that day
  classes: Record<string, ClassAvailability>;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-vacancy',
  styleUrl: './vacancy.css',
  templateUrl: './vacancy.html',
})
export class Vacancy {
  private stationService = inject(StationService);
  private trainService = inject(TrainService);
  private router = inject(Router);

  readonly daysToShow = 6;
  readonly classOptions = [
  { code: '', label: 'All Classes' },
  { code: 'FC', label: 'First Class (FC)' },
  { code: 'SC', label: 'Second Class (SC)' },
  { code: 'DV', label: 'Divyang (DV)' },
  { code: 'LG', label: 'Luggage (LG)' },
  ];
  
  trainNumber = '';
  classFilter = '';
  minDate = this.localDate(new Date());
  journeyDate = this.minDate;

  fromTerm = '';
  toTerm = '';
  fromStation: Station | null = null;
  toStation: Station | null = null;
  fromResults: Station[] = [];
  toResults: Station[] = [];
  fromOpen = false;
  toOpen = false;
  private fromSearch$ = new Subject<string>();
  private toSearch$ = new Subject<string>();

  loading = false;
  checked = false;
  errorMessage = '';
  rows: VacancyRow[] = [];
  trainInfo: TrainSearchResult | null = null;
  classCodes: string[] = [];

  constructor() {
    this.fromSearch$
      .pipe(debounceTime(250), distinctUntilChanged(), switchMap((t) => this.stationService.search(t)))
      .subscribe({ next: (s) => (this.fromResults = s), error: () => (this.fromResults = []) });
    this.toSearch$
      .pipe(debounceTime(250), distinctUntilChanged(), switchMap((t) => this.stationService.search(t)))
      .subscribe({ next: (s) => (this.toResults = s), error: () => (this.toResults = []) });
  }

  // ---- station pickers ----
  onFromInput(): void {
    this.fromStation = null;
    this.fromOpen = true;
    this.fromTerm.trim().length >= 2 ? this.fromSearch$.next(this.fromTerm.trim()) : (this.fromResults = []);
  }
  onToInput(): void {
    this.toStation = null;
    this.toOpen = true;
    this.toTerm.trim().length >= 2 ? this.toSearch$.next(this.toTerm.trim()) : (this.toResults = []);
  }
  pickFrom(s: Station): void {
    this.fromStation = s;
    this.fromTerm = `${s.name} (${s.code})`;
    this.fromResults = [];
    this.fromOpen = false;
  }
  pickTo(s: Station): void {
    this.toStation = s;
    this.toTerm = `${s.name} (${s.code})`;
    this.toResults = [];
    this.toOpen = false;
  }
  closeFrom(): void {
    setTimeout(() => (this.fromOpen = false), 150);
  }
  closeTo(): void {
    setTimeout(() => (this.toOpen = false), 150);
  }

  get canCheck(): boolean {
    return (
      !!this.trainNumber.trim() &&
      !!this.fromStation &&
      !!this.toStation &&
      this.fromStation.stationId !== this.toStation.stationId &&
      !!this.journeyDate
    );
  }

  get visibleCodes(): string[] {
    return this.classFilter ? this.classCodes.filter((c) => c === this.classFilter) : this.classCodes;
  }

  // ---- availability check: one call per day, IRCTC style ----
  onCheck(): void {
    this.errorMessage = '';
    if (!this.fromStation || !this.toStation) {
      this.errorMessage = 'Pick a valid station from the suggestions for both From and To.';
      return;
    }
    const from = this.fromStation.stationId;
    const to = this.toStation.stationId;
    const number = this.trainNumber.trim();
    const dates = Array.from({ length: this.daysToShow }, (_, i) => this.addDays(this.journeyDate, i));

    this.loading = true;
    this.checked = false;
    forkJoin(
      dates.map((date) =>
        this.trainService.getVacancy(number, from, to, date).pipe(
          map((train) => ({ date, train, error: '' })),
          catchError((err) => of({ date, train: null as TrainSearchResult | null, error: err?.error?.error || 'Unavailable' }))
        )
      )
    ).subscribe((results) => {
      this.loading = false;
      this.checked = true;
      const first = results.find((r) => r.train)?.train ?? null;
      this.trainInfo = first;
      if (!first) {
        this.rows = [];
        this.classCodes = [];
        this.errorMessage =
          results[0]?.error || `Train ${number} does not run between these stations on the selected dates.`;
        return;
      }
      this.classCodes = [...new Set(results.flatMap((r) => r.train?.classes.map((c) => c.classCode) ?? []))];
      this.rows = results.map((r) => ({
        date: r.date,
        train: r.train,
        classes: Object.fromEntries((r.train?.classes ?? []).map((c) => [c.classCode, c])),
      }));
    });
  }

  label(c: ClassAvailability): string {
    return c.availableSeats > 0 ? `AVAILABLE-${String(c.availableSeats).padStart(4, '0')}` : 'SOLD OUT';
  }

  book(row: VacancyRow, cls: ClassAvailability): void {
    if (!row.train || !this.fromStation || !this.toStation) return;
    this.router.navigate(['/book'], {
      queryParams: {
        trainId: row.train.trainId,
        classId: cls.classId,
        fromStationId: this.fromStation.stationId,
        toStationId: this.toStation.stationId,
        journeyDate: row.date,
        trainNumber: row.train.trainNumber,
        trainName: row.train.trainName,
        classCode: cls.classCode,
        className: cls.className,
        fare: cls.fare,
        fromCode: this.fromStation.code,
        fromName: this.fromStation.name,
        toCode: this.toStation.code,
        toName: this.toStation.name,
      },
    });
  }

  // local-date helpers (toISOString gives the wrong day in IST early morning)
  private localDate(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }
  private addDays(iso: string, n: number): string {
    const [y, m, d] = iso.split('-').map(Number);
    return this.localDate(new Date(y, m - 1, d + n));
  }
}