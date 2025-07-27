// import { useEffect, useState } from "react";
// import { getUserVehicles } from "@/apis/user-vehicles.api";
// import VehicleCard from "@/components/Home/Vehicle/Card/Card";
// import { Vehicle } from "@/types/vehicle";

// // Define types for the seller and vehicle
// interface Seller {
//   profilePicture: string;
//   name: string;
// }

// // Define props for the ShopPage component
// interface ShopPageProps {
//   providerId: string;
// }

// const ShopPage: React.FC<ShopPageProps> = ({ providerId }) => {
//   const [vehicles, setVehicles] = useState<Vehicle[]>([]);
//   const [seller, setSeller] = useState<Seller | null>(null);
//   const [vehicleCount, setVehicleCount] = useState<number>(0);
//   const categories = ["Cars", "Motorbikes", "Bicycles"]; // Example categories

//   useEffect(() => {
//     const fetchSellerData = async () => {
//       const data = await getUserVehicles(0, 1); // Fetch the first page for seller's data
//       if (data.user) {
//         setSeller(data.user); // Adjust based on your API response
//         setVehicleCount(data.totalCount); // Adjust based on your API response
//       }
//     };

//     const fetchVehicles = async () => {
//       const data = await getUserVehicles(0, 10); // Fetch vehicles
//       setVehicles(data.content); // Adjust based on your API response
//     };

//     fetchSellerData();
//     fetchVehicles();
//   }, [providerId]);

//   return (
//     <div className="shop-page">
//       {/* Header Section */}
//       {seller && (
//         <div className="header flex items-center">
//           <img
//             src={seller.profilePicture}
//             alt={seller.name}
//             className="avatar"
//           />
//           <div>
//             <h2>{seller.name}</h2>
//             <p>{vehicleCount} vehicles available</p>
//           </div>
//         </div>
//       )}

//       {/* Category Section */}
//       <div className="categories mb-4">
//         {categories.map((category) => (
//           <button key={category} className="category-button mx-2">
//             {category}
//           </button>
//         ))}
//       </div>

//       {/* Vehicle Display Section */}
//       <div className="vehicle-display grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//         {vehicles.map((vehicle) => (
//           <VehicleCard key={vehicle.id} item={vehicle} />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ShopPage;
