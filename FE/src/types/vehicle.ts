export interface Vehicle {
  id: string;
  licensePlate: string;
  vehicleType: string;
  vehicleFeatures: VehicleFeature[];
  description: string;
  costPerDay: number;
  status: string;
  thumb: string;
  numberSeat: number;
  yearManufacture: number;
  transmission: string;
  fuelType: string;
  brandName: string;
  modelName: string;
  vehicleImages: VehicleImage[];
  rating: number;
  address: string;
  comments?: Comment[];
  shipToAddress?: string; // "YES" or "NO"
  penaltyType?: string; // "PERCENT" or "FIXED"
  penaltyValue?: number; // Percentage or fixed amount
  minCancelHour?: number; // Minimum hours before cancellation allowed
  openTime?: string; // Opening time for the vehicle rental
  closeTime?: string; // Closing time for the vehicle rental
}

export interface VehicleFeature {
  name: string;
}

interface VehicleImage {
  imageUrl: string;
}

export interface Brand {
  id: string;
  brandName: string;
}

export interface VehicleFilters {
  vehicleType?: string;
  model?: string;
  maxRating?: number;
  shipToAddress?: boolean;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  fuelType?: string;
  hasDriver?: boolean;
  city?: string;
  district?: string;
  ward?: string;
  pickupDateTime?: string;
  returnDateTime?: string;
  feature?: string[];
}

export interface Comment {
  id?: string;
  userName: string;
  userImage?: string;
  comment: string;
  star: number;
  timestamp?: string;
}
