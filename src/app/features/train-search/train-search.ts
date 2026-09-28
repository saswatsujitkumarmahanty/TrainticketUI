import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { StationService } from '../../core/services/station.service';
import { TrainService } from '../../core/services/train.service';
import { Station } from '../../core/models/station.model';
import { ClassAvailability, TrainSearchResult } from '../../core/models/train.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-train-search',
  styleUrl: './train-search.css',
  templateUrl: './train-search.html',
})
export class TrainSearch {
  private stationService = inject(StationService);
  private trainService = inject(TrainService);
  private router = inject(Router);

  fromTerm = '';
  toTerm = '';
  journeyDate = this.today();

  fromStation: Station | null = null;
  toStation: Station | null = null;

  fromResults: Station[] = [];
  toResults: Station[] = [];
  fromOpen = false;
  toOpen = false;

  private fromSearch$ = new Subject<string>();
  private toSearch$ = new Subject<string>();

  searching = false;
  searched = false;
  errorMessage = '';
  searchResults: TrainSearchResult[] = [];

  constructor() {
    this.fromSearch$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => this.stationService.search(term))
      )
      .subscribe({
        next: (stations) => (this.fromResults = stations),
        error: () => (this.fromResults = []),
      });

    this.toSearch$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => this.stationService.search(term))
      )
      .subscribe({
        next: (stations) => (this.toResults = stations),
        error: () => (this.toResults = []),
      });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  onFromInput(): void {
    this.fromStation = null;
    this.fromOpen = true;
    if (this.fromTerm.trim().length >= 2) {
      this.fromSearch$.next(this.fromTerm.trim());
    } else {
      this.fromResults = [];
    }
  }

  onToInput(): void {
    this.toStation = null;
    this.toOpen = true;
    if (this.toTerm.trim().length >= 2) {
      this.toSearch$.next(this.toTerm.trim());
    } else {
      this.toResults = [];
    }
  }

  pickFrom(station: Station): void {
    this.fromStation = station;
    this.fromTerm = `${station.name} (${station.code})`;
    this.fromResults = [];
    this.fromOpen = false;
  }

  pickTo(station: Station): void {
    this.toStation = station;
    this.toTerm = `${station.name} (${station.code})`;
    this.toResults = [];
    this.toOpen = false;
  }

  closeFrom(): void {
    setTimeout(() => (this.fromOpen = false), 150);
  }

  closeTo(): void {
    setTimeout(() => (this.toOpen = false), 150);
  }

  swapStations(): void {
    const st = this.fromStation;
    const term = this.fromTerm;
    this.fromStation = this.toStation;
    this.fromTerm = this.toTerm;
    this.toStation = st;
    this.toTerm = term;
  }

  get canSearch(): boolean {
    return !!this.fromStation && !!this.toStation && !!this.journeyDate && this.fromStation.stationId !== this.toStation.stationId;
  }

  onSearch(): void {
    this.errorMessage = '';
    if (!this.fromStation || !this.toStation) {
      this.errorMessage = 'Pick a valid station from the suggestions for both From and To.';
      return;
    }
    if (this.fromStation.stationId === this.toStation.stationId) {
      this.errorMessage = 'From and To stations must be different.';
      return;
    }

    this.searching = true;
    this.searched = false;
    this.trainService.search(this.fromStation.stationId, this.toStation.stationId, this.journeyDate).subscribe({
      next: (results) => {
        this.searching = false;
        this.searched = true;
        this.searchResults = results;
      },
      error: (err) => {
        this.searching = false;
        this.searched = true;
        this.searchResults = [];
        this.errorMessage = err?.error?.error || 'Could not search trains. Please try again.';
      },
    });
  }

  selectClass(train: TrainSearchResult, cls: ClassAvailability): void {
    if (!this.fromStation || !this.toStation) {
      return;
    }
    this.router.navigate(['/book'], {
      queryParams: {
        trainId: train.trainId,
        classId: cls.classId,
        fromStationId: this.fromStation.stationId,
        toStationId: this.toStation.stationId,
        journeyDate: this.journeyDate,
        trainNumber: train.trainNumber,
        trainName: train.trainName,
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
}