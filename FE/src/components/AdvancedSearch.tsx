// "use client";

// import type React from "react";
// import { useState, useEffect } from "react";
// import type { Dispatch, SetStateAction } from "react";
// import { X } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Slider } from "@/components/ui/Slider";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Checkbox } from "@/components/ui/checkbox";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { formatCurrency } from "@/lib/format-currency";
// import type { VehicleFilters, Vehicle } from "@/types/vehicle";
// import { searchVehicles } from "@/apis/vehicle.api";
// import { toast } from "react-toastify";

// interface AdvanceSearchComponentProps {
//   isOpen: boolean;
//   onClose: () => void;
//   filters: VehicleFilters;
//   setFilters: Dispatch<SetStateAction<VehicleFilters>>;
//   onApplyFilters: (
//     vehicles: Vehicle[],
//     isLoading: boolean,
//     error: string | null
//   ) => void;
// }

// // Danh sách các tính năng xe
// const vehicleFeaturesList = [
//   "Bản đồ",
//   "Bluetooth",
//   "Camera 360",
//   "Camera cập lề",
//   "Camera hành trình",
//   "Camera lùi",
//   "Cảm biến áp suất lốp",
//   "Cảm biến va chạm",
//   "Cảnh báo tốc độ",
//   "Cửa sổ trời",
//   "Định vị GPS",
//   "Ghế trẻ em",
//   "Khe cắm USB",
//   "Lốp dự phòng",
//   "Màn hình DVD",
//   "Nắp thùng xe bán tải",
//   "ETC",
//   "Túi khí an toàn",
// ];

// const AdvanceSearchComponent: React.FC<AdvanceSearchComponentProps> = ({
//   isOpen,
//   onClose,
//   filters,
//   setFilters,
//   onApplyFilters,
// }) => {
//   // State tạm thời cho các bộ lọc trong modal, chỉ áp dụng khi nhấn "Áp dụng"
//   const [tempFilters, setTempFilters] = useState<VehicleFilters>(filters);

//   useEffect(() => {
//     // Đồng bộ tempFilters với filters khi modal mở hoặc filters thay đổi từ bên ngoài
//     setTempFilters(filters);
//   }, [filters, isOpen]);

//   const handleTempFilterChange = (key: keyof VehicleFilters, value: any) => {
//     setTempFilters((prev) => ({ ...prev, [key]: value }));
//   };

//   //   const handleFeatureChange = (feature: string, checked: boolean) => {
//   //     setTempFilters((prev) => {
//   //       const currentFeatures = prev.selectedFeatures || [];
//   //       if (checked) {
//   //         return { ...prev, selectedFeatures: [...currentFeatures, feature] };
//   //       } else {
//   //         return {
//   //           ...prev,
//   //           selectedFeatures: currentFeatures.filter((f) => f !== feature),
//   //         };
//   //       }
//   //     });
//   //   };

//   const resetSlider = (
//     minKey: keyof VehicleFilters,
//     maxKey: keyof VehicleFilters,
//     defaultMin: number,
//     defaultMax: number
//   ) => {
//     handleTempFilterChange(minKey, defaultMin);
//     handleTempFilterChange(maxKey, defaultMax);
//   };

//   const handleApply = async () => {
//     setFilters(tempFilters); // Cập nhật filters chính
//     onClose(); // Đóng modal

//     onApplyFilters([], true, null); // Bắt đầu tải, xóa dữ liệu cũ, đặt isLoading = true
//     const requestBody: any = {};

//     // Ánh xạ các bộ lọc từ tempFilters sang requestBody cho API
//     if (tempFilters.vehicleType) {
//       requestBody.vehicleTypes = [tempFilters.vehicleType];
//     }
//     if (tempFilters.city) {
//       requestBody.addresses = [tempFilters.city];
//     }
//     if (tempFilters.hasDriver !== undefined) {
//       requestBody.haveDriver = tempFilters.hasDriver ? "YES" : "NO";
//     }
//     if (tempFilters.shipToAddress !== undefined) {
//       requestBody.shipToAddress = tempFilters.shipToAddress ? "YES" : "NO";
//     }
//     if (tempFilters.brand) {
//       requestBody.brandId = tempFilters.brand;
//     }
//     if (tempFilters.minSeats !== undefined) {
//       requestBody.numberSeat = tempFilters.minSeats; // Giả định API chỉ nhận 1 giá trị cho số chỗ
//     }
//     if (tempFilters.maxRating === 4) {
//       requestBody.ratingFiveStarsOnly = true;
//     } else {
//       requestBody.ratingFiveStarsOnly = false;
//     }

//     // Các trường mới từ bộ lọc nâng cao
//     if (tempFilters.minPrice !== undefined)
//       requestBody.costFrom = tempFilters.minPrice;
//     if (tempFilters.maxPrice !== undefined)
//       requestBody.costTo = tempFilters.maxPrice;

//     if (tempFilters.transmission && tempFilters.transmission !== "ALL") {
//       requestBody.transmission = tempFilters.transmission;
//     }
//     if (tempFilters.minMileage !== undefined)
//       requestBody.mileageFrom = tempFilters.minMileage;
//     if (tempFilters.maxMileage !== undefined)
//       requestBody.mileageTo = tempFilters.maxMileage;
//     // Giả định backend có trường cho khoảng cách, năm sản xuất, phí giao nhận, mức tiêu thụ nhiên liệu
//     // Bạn cần điều chỉnh tên trường API cho phù hợp
//     if (tempFilters.minDistance !== undefined)
//       requestBody.distanceFrom = tempFilters.minDistance;
//     if (tempFilters.maxDistance !== undefined)
//       requestBody.distanceTo = tempFilters.maxDistance;
//     if (tempFilters.minYear !== undefined)
//       requestBody.yearFrom = tempFilters.minYear;
//     if (tempFilters.maxYear !== undefined)
//       requestBody.yearTo = tempFilters.maxYear;
//     if (tempFilters.minDeliveryFee !== undefined)
//       requestBody.deliveryFeeFrom = tempFilters.minDeliveryFee;
//     if (tempFilters.maxDeliveryFee !== undefined)
//       requestBody.deliveryFeeTo = tempFilters.maxDeliveryFee;
//     if (tempFilters.fuelType && tempFilters.fuelType !== "ALL") {
//       requestBody.fuelType = tempFilters.fuelType;
//     }
//     if (tempFilters.minFuelConsumption !== undefined)
//       requestBody.fuelConsumptionFrom = tempFilters.minFuelConsumption;
//     if (tempFilters.maxFuelConsumption !== undefined)
//       requestBody.fuelConsumptionTo = tempFilters.maxFuelConsumption;
//     if (
//       tempFilters.selectedFeatures &&
//       tempFilters.selectedFeatures.length > 0
//     ) {
//       requestBody.features = tempFilters.selectedFeatures;
//     }
//     if (tempFilters.sortBy) {
//       requestBody.sortBy = tempFilters.sortBy;
//     }

//     requestBody.page = 0;
//     requestBody.size = 5;

//     console.log("Đang gửi bộ lọc nâng cao đến backend với body:", requestBody);

//     try {
//       const result = await searchVehicles({ body: requestBody });
//       const vehiclesArray = Array.isArray(result) ? result : [];
//       toast.success(
//         `Tìm kiếm thành công! Tìm thấy ${vehiclesArray.length} xe.`,
//         {
//           position: "top-right",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           progress: undefined,
//           theme: "light",
//         }
//       );
//       onApplyFilters(vehiclesArray, false, null);
//     } catch (error: any) {
//       console.error("Lỗi khi gửi bộ lọc nâng cao:", error);
//       const errorMessage = error.message || "Lỗi không xác định.";
//       toast.error(`Tìm kiếm thất bại: ${errorMessage}`, {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//         theme: "light",
//       });
//       onApplyFilters([], false, errorMessage);
//     }
//   };

//   const handleClearFilters = () => {
//     setTempFilters({
//       vehicleType: undefined,
//       brand: undefined,
//       minSeats: undefined,
//       maxSeats: undefined,
//       maxRating: undefined,
//       shipToAddress: false,
//       hasDriver: false,
//       city: undefined,
//       district: undefined,
//       ward: undefined,
//       minPrice: 0,
//       maxPrice: 3000000,
//       sortBy: undefined,
//       transmission: "ALL",
//       minMileage: 0,
//       maxMileage: 500000,
//       minDistance: 0,
//       maxDistance: 100,
//       minYear: 1990,
//       maxYear: new Date().getFullYear(),
//       minDeliveryFee: 0,
//       maxDeliveryFee: 500000,
//       fuelType: "ALL",
//       minFuelConsumption: 0,
//       maxFuelConsumption: 20,
//       selectedFeatures: [],
//     });
//   };

//   const currentYear = new Date().getFullYear();

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-center text-2xl font-bold">
//             Bộ lọc nâng cao
//           </DialogTitle>
//           <Button
//             variant="ghost"
//             size="icon"
//             className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
//             onClick={onClose}
//           >
//             <X className="h-4 w-4" />
//             <span className="sr-only">Close</span>
//           </Button>
//         </DialogHeader>
//         <div className="grid gap-6 py-4 px-2">
//           {/* Sắp xếp */}
//           <div className="grid gap-2">
//             <h4 className="font-semibold text-lg">Sắp xếp</h4>
//             <Select
//               value={tempFilters.sortBy || ""}
//               onValueChange={(value) => handleTempFilterChange("sortBy", value)}
//             >
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Tối ưu" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="optimal">Tối ưu</SelectItem>
//                 <SelectItem value="newest">Mới nhất</SelectItem>
//                 <SelectItem value="price-asc">Giá thấp - cao</SelectItem>
//                 <SelectItem value="price-desc">Giá cao - thấp</SelectItem>
//                 <SelectItem value="rating">Đánh giá</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Mức giá */}
//           <div className="grid gap-2">
//             <h4 className="font-semibold text-lg">Mức giá</h4>
//             <div className="flex items-center justify-between text-sm">
//               <span>
//                 {tempFilters.minPrice === 0 && tempFilters.maxPrice === 3000000
//                   ? "Bất kì"
//                   : `${formatCurrency(
//                       tempFilters.minPrice || 0
//                     )} - ${formatCurrency(tempFilters.maxPrice || 3000000)}`}
//               </span>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => resetSlider("minPrice", "maxPrice", 0, 3000000)}
//               >
//                 Bất kì
//               </Button>
//             </div>
//             <Slider
//               min={0}
//               max={3000000}
//               step={50000}
//               value={[
//                 tempFilters.minPrice || 0,
//                 tempFilters.maxPrice || 3000000,
//               ]}
//               onValueChange={(value) => {
//                 handleTempFilterChange("minPrice", value[0]);
//                 handleTempFilterChange("maxPrice", value[1]);
//               }}
//             />
//           </div>

//           {/* Truyền động */}
//           <div className="grid gap-2">
//             <h4 className="font-semibold text-lg">Truyền động</h4>
//             <RadioGroup
//               value={tempFilters.transmission || "ALL"}
//               onValueChange={(value: "ALL" | "AUTO" | "MANUAL") =>
//                 handleTempFilterChange("transmission", value)
//               }
//               className="flex gap-4"
//             >
//               <div className="flex items-center space-x-2">
//                 <RadioGroupItem value="ALL" id="transmission-all" />
//                 <label htmlFor="transmission-all">Tất cả</label>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <RadioGroupItem value="AUTO" id="transmission-auto" />
//                 <label htmlFor="transmission-auto">Số tự động</label>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <RadioGroupItem value="MANUAL" id="transmission-manual" />
//                 <label htmlFor="transmission-manual">Số sàn</label>
//               </div>
//             </RadioGroup>
//           </div>

//           {/* Giới hạn số km */}
//           <div className="grid gap-2">
//             <h4 className="font-semibold text-lg">Giới hạn số km</h4>
//             <div className="flex items-center justify-between text-sm">
//               <span>
//                 {tempFilters.minMileage === 0 &&
//                 tempFilters.maxMileage === 500000
//                   ? "Bất kì"
//                   : `${(tempFilters.minMileage || 0).toLocaleString()} - ${(
//                       tempFilters.maxMileage || 500000
//                     ).toLocaleString()} km`}
//               </span>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() =>
//                   resetSlider("minMileage", "maxMileage", 0, 500000)
//                 }
//               >
//                 Bất kì
//               </Button>
//             </div>
//             <Slider
//               min={0}
//               max={500000}
//               step={1000}
//               value={[
//                 tempFilters.minMileage || 0,
//                 tempFilters.maxMileage || 500000,
//               ]}
//               onValueChange={(value) => {
//                 handleTempFilterChange("minMileage", value[0]);
//                 handleTempFilterChange("maxMileage", value[1]);
//               }}
//             />
//           </div>

//           {/* Khoảng cách */}
//           <div className="grid gap-2">
//             <h4 className="font-semibold text-lg">Khoảng cách</h4>
//             <div className="flex items-center justify-between text-sm">
//               <span>
//                 {tempFilters.minDistance === 0 &&
//                 tempFilters.maxDistance === 100
//                   ? "Bất kì"
//                   : `${(tempFilters.minDistance || 0).toLocaleString()} - ${(
//                       tempFilters.maxDistance || 100
//                     ).toLocaleString()} km`}
//               </span>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() =>
//                   resetSlider("minDistance", "maxDistance", 0, 100)
//                 }
//               >
//                 Bất kì
//               </Button>
//             </div>
//             <Slider
//               min={0}
//               max={100}
//               step={1}
//               value={[
//                 tempFilters.minDistance || 0,
//                 tempFilters.maxDistance || 100,
//               ]}
//               onValueChange={(value) => {
//                 handleTempFilterChange("minDistance", value[0]);
//                 handleTempFilterChange("maxDistance", value[1]);
//               }}
//             />
//           </div>

//           {/* Số chỗ */}
//           <div className="grid gap-2">
//             <h4 className="font-semibold text-lg">Số chỗ</h4>
//             <div className="flex items-center justify-between text-sm">
//               <span>
//                 {tempFilters.minSeats === 4 && tempFilters.maxSeats === 16
//                   ? "Bất kì"
//                   : `${tempFilters.minSeats || 4} - ${
//                       tempFilters.maxSeats || 16
//                     } chỗ`}
//               </span>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => resetSlider("minSeats", "maxSeats", 4, 16)}
//               >
//                 Bất kì
//               </Button>
//             </div>
//             <Slider
//               min={4}
//               max={16}
//               step={1}
//               value={[tempFilters.minSeats || 4, tempFilters.maxSeats || 16]}
//               onValueChange={(value) => {
//                 handleTempFilterChange("minSeats", value[0]);
//                 handleTempFilterChange("maxSeats", value[1]);
//               }}
//             />
//           </div>

//           {/* Năm sản xuất */}
//           <div className="grid gap-2">
//             <h4 className="font-semibold text-lg">Năm sản xuất</h4>
//             <div className="flex items-center justify-between text-sm">
//               <span>
//                 {tempFilters.minYear === 1990 &&
//                 tempFilters.maxYear === currentYear
//                   ? "Bất kì"
//                   : `${tempFilters.minYear || 1990} - ${
//                       tempFilters.maxYear || currentYear
//                     }`}
//               </span>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() =>
//                   resetSlider("minYear", "maxYear", 1990, currentYear)
//                 }
//               >
//                 Bất kì
//               </Button>
//             </div>
//             <Slider
//               min={1990}
//               max={currentYear}
//               step={1}
//               value={[
//                 tempFilters.minYear || 1990,
//                 tempFilters.maxYear || currentYear,
//               ]}
//               onValueChange={(value) => {
//                 handleTempFilterChange("minYear", value[0]);
//                 handleTempFilterChange("maxYear", value[1]);
//               }}
//             />
//           </div>

//           {/* Phí giao nhận xe */}
//           <div className="grid gap-2">
//             <h4 className="font-semibold text-lg">Phí giao nhận xe</h4>
//             <div className="flex items-center justify-between text-sm">
//               <span>
//                 {tempFilters.minDeliveryFee === 0 &&
//                 tempFilters.maxDeliveryFee === 500000
//                   ? "Bất kì"
//                   : `${formatCurrency(
//                       tempFilters.minDeliveryFee || 0
//                     )} - ${formatCurrency(
//                       tempFilters.maxDeliveryFee || 500000
//                     )}`}
//               </span>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() =>
//                   resetSlider("minDeliveryFee", "maxDeliveryFee", 0, 500000)
//                 }
//               >
//                 Bất kì
//               </Button>
//             </div>
//             <Slider
//               min={0}
//               max={500000}
//               step={10000}
//               value={[
//                 tempFilters.minDeliveryFee || 0,
//                 tempFilters.maxDeliveryFee || 500000,
//               ]}
//               onValueChange={(value) => {
//                 handleTempFilterChange("minDeliveryFee", value[0]);
//                 handleTempFilterChange("maxDeliveryFee", value[1]);
//               }}
//             />
//           </div>

//           {/* Nhiên liệu */}
//           <div className="grid gap-2">
//             <h4 className="font-semibold text-lg">Nhiên liệu</h4>
//             <RadioGroup
//               value={tempFilters.fuelType || "ALL"}
//               onValueChange={(
//                 value: "ALL" | "GASOLINE" | "DIESEL" | "ELECTRIC" | "HYBRID"
//               ) => handleTempFilterChange("fuelType", value)}
//               className="flex flex-wrap gap-4"
//             >
//               <div className="flex items-center space-x-2">
//                 <RadioGroupItem value="ALL" id="fuel-all" />
//                 <label htmlFor="fuel-all">Tất cả</label>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <RadioGroupItem value="GASOLINE" id="fuel-gasoline" />
//                 <label htmlFor="fuel-gasoline">Xăng</label>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <RadioGroupItem value="DIESEL" id="fuel-diesel" />
//                 <label htmlFor="fuel-diesel">Dầu diesel</label>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <RadioGroupItem value="ELECTRIC" id="fuel-electric" />
//                 <label htmlFor="fuel-electric">Điện</label>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <RadioGroupItem value="HYBRID" id="fuel-hybrid" />
//                 <label htmlFor="fuel-hybrid">Xăng & điện</label>
//               </div>
//             </RadioGroup>
//           </div>

//           {/* Tính năng */}
//           <div className="grid gap-2">
//             <h4 className="font-semibold text-lg">Tính năng</h4>
//             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
//               {vehicleFeaturesList.map((feature) => (
//                 <div key={feature} className="flex items-center space-x-2">
//                   <Checkbox
//                     id={`feature-${feature}`}
//                     checked={tempFilters.selectedFeatures?.includes(feature)}
//                     onCheckedChange={(checked) =>
//                       handleFeatureChange(feature, checked as boolean)
//                     }
//                   />
//                   <label
//                     htmlFor={`feature-${feature}`}
//                     className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//                   >
//                     {feature}
//                   </label>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//         <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 p-4">
//           <Button
//             variant="outline"
//             onClick={handleClearFilters}
//             className="w-full sm:w-auto"
//           >
//             Xóa bộ lọc
//           </Button>
//           <Button
//             type="submit"
//             onClick={handleApply}
//             className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white"
//           >
//             Áp dụng
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default AdvanceSearchComponent;
