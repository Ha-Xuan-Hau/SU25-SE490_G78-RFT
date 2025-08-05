export enum VehicleType {
  CAR = "CAR",
  MOTORBIKE = "MOTORBIKE",
  BICYCLE = "BICYCLE",
}

export interface Vehicle {
  id: string;
  userId: string;
  userName: string;
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
  penaltyId?: string; // ID of the penalty rule
  penaltyType?: string; // "PERCENT" or "FIXED"
  penaltyValue?: number; // Percentage or fixed amount
  minCancelHour?: number; // Minimum hours before cancellation allowed
  openTime?: string; // Opening time for the vehicle rental
  closeTime?: string; // Closing time for the vehicle rental

  penalty?: {
    id: string;
    userId?: string | null;
    userName?: string | null;
    penaltyType: string;
    penaltyValue: number;
    minCancelHour: number;
    description?: string;
  };

  // maxKmPerDay?: number; // Maximum kilometers allowed per day
  // feePerExtraKm?: number; // Fee for extra kilometers beyond the limit
  // allowedHourLate?: number; // Allowed hours late for return
  // feePerExtraHour?: number; // Fee for extra hours beyond the allowed late time
  // cleaningFee?: number; // Fee for cleaning the vehicle after use
  // smellRemovalFee?: number; // Fee for removing odors from the vehicle

  // driverFeePerDay: number; // Fee for hiring a driver per day
  // hasDriverOption: boolean;
  // driverFeePerHour: number;
  // hasHourlyRental: boolean;
  extraFeeRule?: {
    maxKmPerDay?: number;
    feePerExtraKm?: number;
    allowedHourLate?: number;
    feePerExtraHour?: number;
    cleaningFee?: number;
    smellRemovalFee?: number;
    batteryChargeFeePerPercent?: number;
    apply_batteryChargeFee?: any;
    driverFeePerDay?: number;
    hasDriverOption?: boolean;
    driverFeePerHour?: number;
    hasHourlyRental?: boolean;
  };
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
  features?: string[];
  page?: number;
  size?: number;
}

export interface Comment {
  id?: string;
  userName: string;
  userImage?: string;
  comment: string;
  star: number;
  timestamp?: string;
}

interface VehicleRentUpdateDTO {
  brandId: string;
  penaltyId: string;
  licensePlate: string;
  vehicleType: string;
  vehicleFeatures: string; // Chuỗi thay vì mảng
  vehicleImages: VehicleImageDTO[];
  haveDriver: string;
  insuranceStatus: string;
  shipToAddress: string;
  numberSeat: number;
  yearManufacture: number;
  transmission: string;
  fuelType: string;
  description: string;
  numberVehicle: number;
  costPerDay: number;
  status: string;
  thumb: string;
}

interface VehicleImageDTO {
  imageUrl: string;
}
