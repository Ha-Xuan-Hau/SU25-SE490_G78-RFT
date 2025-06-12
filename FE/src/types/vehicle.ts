export interface Vehicle {
  id: string;
  licensePlate: string;
  vehicleTypes: string;
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
  vehicleTypes?: string;
  brand?: string;
  seats?: number;
  minRating?: number;
  homeDelivery?: boolean;
  mortgageFree?: boolean;
  hasDiscount?: boolean;
}
