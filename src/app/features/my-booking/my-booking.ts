import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { BookingSummary } from '../../core/models/booking.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  selector: 'app-my-booking',
  styleUrl: './my-booking.css',
  templateUrl: './my-booking.html',
})
export class MyBooking implements OnInit {
  bookings: BookingSummary[] = [];
  loading = true;
  errorMessage = '';

  constructor(private bookingService: BookingService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.bookingService.getMine().subscribe({
      next: (res) => {
        this.bookings = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Could not load your bookings.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}