export interface User {
  id: string;
  name?: string;
  fullName?: string; // Added for profile display
  phone?: string;
  email?: string;
  role?: string;
  profilePicture?: string;
  address?: string; // Added for address display
  dateOfBirth?: number[]; // Added for DOB formatting
  status?: string; // Added for status display
  createdAt?: string | number; // Added for timestamp formatting
  updatedAt?: string | number; // Added for timestamp formatting
}
