export interface User {
  id: string;
  name?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  role?: string;
  profilePicture?: string;
  address?: string;
  dateOfBirth?: number[];
  status?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  validLicenses?: string[];
}
