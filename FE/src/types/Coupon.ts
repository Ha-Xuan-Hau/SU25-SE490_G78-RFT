export interface coupon {
  id: string;
  name: string;
  discount: number;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  timeExpired: string;
}

export interface couponRequest {
  name: string;
  discount: number;
  description: string;
  timeExpired: string;
}
