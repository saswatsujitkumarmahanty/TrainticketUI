export interface ClassAvailability {
  classId: number;
  classCode: string;
  className: string;
  fare: number;
  availableSeats: number;
  status: string; // "AVL 42" or "WL"
}
 
export interface TrainSearchResult {
  trainId: number;
  trainNumber: string;
  trainName: string;
  trainType: string;
  departureTime: string; 
  arrivalTime: string;   
  daysTaken: number;
  distanceKm: number;
  classes: ClassAvailability[];
}