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
  createdAt: number[];
  updatedAt: number[];
  driverFee?: number;
  returnedAt?: number[];
}
