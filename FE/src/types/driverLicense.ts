export interface DriverLicense {
  id: string;
  userId: string;
  email: string;
  userName: string;
  licenseNumber: string;
  classField: string;
  status: "VALID" | "INVALID";
  image: string;
  createdAt: string;
  updatedAt: string;
}
