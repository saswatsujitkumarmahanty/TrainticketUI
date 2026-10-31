import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { BookingDetails } from '../../../core/models/booking.model';

@Component({
  imports: [],
  selector: 'app-booking-detail',
  styleUrl: './booking-detail.css',
  templateUrl: './booking-detail.html',
})
export class BookingDetail implements OnInit {
  booking: BookingDetails | null = null;
  loading = true;
  errorMessage = '';
  cancelling = false;
  cancelMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const pnr = this.route.snapshot.paramMap.get('pnr')!;
    this.load(pnr);
  }

  private load(pnr: string): void {
    this.loading = true;
    this.bookingService.getByPnr(pnr).subscribe({
      next: (res) => {
        this.booking = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Booking not found.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  cancel(): void {
    if (!this.booking) return;
    this.cancelling = true;
    this.cancelMessage = '';
    this.bookingService.cancel(this.booking.pnr).subscribe({
      next: () => {
        this.cancelling = false;
        this.cancelMessage = 'Booking cancelled successfully.';
        this.cdr.markForCheck();
        this.load(this.booking!.pnr);
      },
      error: (err) => {
        this.cancelling = false;
        this.cancelMessage = err?.error?.error || 'Could not cancel this booking.';
        this.cdr.markForCheck();
      }
    });
  }
}