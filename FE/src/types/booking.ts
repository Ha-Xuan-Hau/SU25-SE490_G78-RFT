export interface BookingDetail {
  id: string;
  user: {
    id: string;
    fullName: string;
    profilePicture?: string;
    dateOfBirth?: string;
    phone?: string;
    address?: string;
  };
  vehicles: Array<{
    id: string;
    user: {
      id: string;
      fullName: string;
      profilePicture?: string;
      dateOfBirth?: string;
      phone?: string;
      address?: string;
    };
    licensePlate: string;
    vehicleTypes: string;
    thumb: string;
    costPerDay: number;
    status: string;
  }>;
  timeBookingStart: number[];
  timeBookingEnd: number[];
  phoneNumber: string;
  address: string;
  codeTransaction: string;
  totalCost: number;
  status: string;
  penaltyType: string;
  penaltyValue: number;
  minCancelHour: number;
  note: string;
  createdAt: number[];
  updatedAt: number[];
  driverFee?: number;
  returnedAt?: number[];
}

export interface BookingResponseDTO {
  id: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profilePicture?: string;
  };
  vehicles: Array<{
    id: string;
    vehicleThumb: string;
    vehicleLicensePlate: string;
  }>;
  timeBookingStart: string | number | number[];
  timeBookingEnd: string | number | number[];
  phoneNumber: string;
  address: string;
  codeTransaction: string;
  timeTransaction: string | number | number[];
  totalCost: number;
  status: string;
  penaltyType: string;
  penaltyValue: number;
  minCancelHour: number;
  couponId?: string;
  createdAt: string | number | number[];
  updatedAt: string | number | number[];
  note?: string;
  priceType?: string;
  rentalDuration?: string;
  discountAmount?: number;
  driverFee?: number;
  returnedAt?: string | number | number[];
}
