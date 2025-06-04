export type Vehicle = {
  name: string;
  slug: string;
  location: string;
  price: string;
  transmission: string;
  rate: number;
  seat: number;
  fuel: string;
  images: VehicleImage[];
};

interface VehicleImage {
  src: string;
}
