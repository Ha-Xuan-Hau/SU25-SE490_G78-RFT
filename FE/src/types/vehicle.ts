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
  totalRating: number;
  address: string;
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
  brand?: string;
  seats?: number;
  minRating?: number;
  shipToAddress?: boolean;
  hasDiscount?: boolean;
}
