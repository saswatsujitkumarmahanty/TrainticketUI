export interface PassengerDto {
  name: string;
  age: number;
  gender: 'M' | 'F' | 'T' | '';
  coachCode?: string | null;
  seatNumber?: number | null;
  berthType?: string | null;
}
 
export interface CreateBookingRequest {
  trainId: number;
  classId: number;
  fromStationId: number;
  toStationId: number;
  journeyDate: string; 
  passengers: PassengerDto[];
}
 
export interface BookingCreatedResult {
  bookingId: number;
  pnr: string;
  totalFare: number;
  status: string;
  waitlistNumber?: number | null;
}
 
export interface BookingSummary {
  bookingId: number;
  pnr: string;
  status: string;
  waitlistNumber?: number | null;
  journeyDate: string;
  totalFare: number;
  bookedAt: string;
  trainNumber: string;
  trainName: string;
  classCode: string;
  className: string;
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
}
 
export interface BookingDetails extends BookingSummary {
  passengers: PassengerDto[];
}