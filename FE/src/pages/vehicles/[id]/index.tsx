"use client";

// --- Imports ---
import { translateENtoVI } from "@/lib/viDictionary";
// Hooks
import React, { useState, useEffect, useMemo } from "react";
import { useDatesState } from "@/recoils/dates.state";
import { useUserState } from "@/recoils/user.state";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";

// API
import {
  getVehicleById,
  getBookedSlotById,
  getAvailableThumbQuantity,
  getAvailableThumbList,
} from "@/apis/vehicle.api";

// Components
import { DateRangePicker } from "@/components/antd";
import { Icon } from "@iconify/react";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Link from "next/link";
import { AuthPopup } from "@/components/AuthPopup";

import {
  calculateRentalDuration,
  calculateRentalPrice,
  formatRentalDuration,
  RentalCalculation,
  VehicleType,
  ExistingBooking,
  BUFFER_TIME_RULES,
  parseBackendTime,
  checkBufferTimeConflict,
  createDisabledTimeFunction,
  isDateDisabled,
} from "@/utils/booking.utils";

// Types and Utils
import { Vehicle, VehicleFeature } from "@/types/vehicle";
import { Comment as VehicleComment } from "@/types/vehicle";
import { formatCurrency } from "@/lib/format-currency";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { RangePickerProps } from "antd/es/date-picker";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Ant Design Components
import { Modal, message, Button as AntButton } from "antd";

// --- Type definitions ---
type RangeValue = [Dayjs | null, Dayjs | null] | null;

// --- Main Component ---
export default function VehicleDetail() {
  // Router and URL params
  const router = useRouter();
  const { id } = router.query;

  // State for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // User state
  const [user] = useUserState();

  // DatePicker and booking state
  const [dates, setDates] = useDatesState();
  const [bookedTimeSlots, setBookedTimeSlots] = useState<ExistingBooking[]>([]);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [pickupDateTime, setPickupDateTime] = useState<string>("");
  const [returnDateTime, setReturnDateTime] = useState<string>("");
  const [rentalDurationDays, setRentalDurationDays] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Modal state
  // const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalCheckOpen, setIsModalCheckOpen] = useState(false);
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);

  const [rentalCalculation, setRentalCalculation] =
    useState<RentalCalculation | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(0);

  // NEW: Buffer time state
  const [bufferConflictMessage, setBufferConflictMessage] =
    useState<string>("");

  // Comments pagination state
  const [currentCommentPage, setCurrentCommentPage] = useState<number>(1);
  const commentsPerPage = 5;

  //multiple booking
  const [availableQuantity, setAvailableQuantity] = useState(1);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [showMultiBooking, setShowMultiBooking] = useState(false);
  const [isMultiModalOpen, setIsMultiModalOpen] = useState(false);
  // State cho chọn nhiều xe
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);

  // Hàm xử lý đặt nhiều xe
  const handleMultiBook = () => {
    // Chuyển sang trang booking, truyền danh sách id xe và thông tin thời gian, quantity
    setIsMultiModalOpen(false);
    // Tạo query param cho danh sách id xe
    const vehicleIdsParam = selectedVehicleIds.join(",");
    const bookingUrl = `/booking?vehicleId=${encodeURIComponent(
      vehicleIdsParam
    )}&pickupTime=${encodeURIComponent(
      pickupDateTime
    )}&returnTime=${encodeURIComponent(returnDateTime)}`;
    window.location.href = bookingUrl;
  };

  // --- Dates handling ---
  const updateDates = (value: RangeValue) => {
    // Kiểm tra rõ ràng trước khi cập nhật
    if (value === null) {
      setDates([] as never[]);
    } else if (Array.isArray(value) && value.length === 2) {
      setDates(value as unknown as never[]);
    } else {
      // Xử lý trường hợp không hợp lệ
      setDates([] as never[]);
    }
  };

  const handleOk1 = () => {
    setIsModalCheckOpen(false);
  };

  const handleCancel1 = () => {
    setIsModalCheckOpen(false);
  };

  // --- Data fetching ---
  const {
    data: vehicle,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleById(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    if (id) {
      const fetchBookedSlots = async () => {
        try {
          console.log("Fetching booked slots for vehicle ID:", id);
          const bookedSlots = await getBookedSlotById(id as string);
          console.log("Received booked slots:", bookedSlots);
          setBookedTimeSlots(bookedSlots);
        } catch (error) {
          console.error("Error fetching booked slots:", error);
        }
      };

      fetchBookedSlots();
    }
  }, [id, vehicle?.vehicleType]);
  // --- Effects ---

  useEffect(() => {
    if (vehicle?.costPerDay) {
      setHourlyRate(Math.round(vehicle.costPerDay / 12));
    }
  }, [vehicle?.costPerDay]);

  // Calculate price based on selected dates
  useEffect(() => {
    if (pickupDateTime && returnDateTime && vehicle?.costPerDay) {
      const startDate = dayjs(pickupDateTime);
      const endDate = dayjs(returnDateTime);

      // Validate dates
      if (endDate <= startDate) {
        setRentalDurationDays(1);
        setTotalPrice(vehicle.costPerDay);
        setRentalCalculation(null);
        return;
      }

      // Tính toán thời gian thuê
      const calculation = calculateRentalDuration(startDate, endDate);
      setRentalCalculation(calculation);

      // Tính giá
      const price = calculateRentalPrice(
        calculation,
        hourlyRate,
        vehicle.costPerDay
      );
      setTotalPrice(price);

      // Set legacy state cho compatibility
      setRentalDurationDays(
        calculation.isHourlyRate ? 1 : calculation.billingDays
      );
    } else if (vehicle?.costPerDay) {
      // Default price if no dates selected
      setTotalPrice(vehicle.costPerDay);
      setRentalCalculation(null);
    }
  }, [pickupDateTime, returnDateTime, vehicle?.costPerDay, hourlyRate]);

  // Fetch booked time slots
  useEffect(() => {
    if (bookedTimeSlots.length > 0) {
      console.log("Booked time slots:", bookedTimeSlots);

      // Hiển thị cụ thể các ngày đã được đặt để debug
      const bookedRanges = bookedTimeSlots.map((slot) => {
        const startDate = parseBackendTime(slot.startDate).format("YYYY-MM-DD");
        const endDate = parseBackendTime(slot.endDate).format("YYYY-MM-DD");
        return `${startDate} đến ${endDate}`;
      });

      console.log("Các khoảng ngày đã đặt:", bookedRanges);
    }
  }, [bookedTimeSlots]);

  // Thêm effect này để theo dõi thay đổi của user
  useEffect(() => {
    // Nếu người dùng đã đăng nhập và AuthPopup đang mở
    if (user && isAuthPopupOpen) {
      setIsAuthPopupOpen(false); // Đóng AuthPopup

      // Kiểm tra xem người dùng có giấy phép lái xe chưa
      if (user.result?.driverLicenses === undefined) {
        setIsModalCheckOpen(true);
      } else if (vehicle?.id) {
        // Nếu có đủ điều kiện thì redirect đến trang booking
        console.log(
          "Navigating from useEffect to booking page with vehicle ID:",
          vehicle.id
        );
        router.push({
          pathname: `/booking/${vehicle.id}`,
          query: {
            pickupTime: pickupDateTime,
            returnTime: returnDateTime,
          },
        });
      }
    }
  }, [
    user,
    isAuthPopupOpen,
    router,
    vehicle?.id,
    pickupDateTime,
    returnDateTime,
  ]);

  // Format dates for DateRangePicker
  const formattedDates = useMemo(() => {
    // If dates is null or undefined
    if (!dates) {
      return null;
    }

    // Kiểm tra có phải mảng không và cấu trúc cụ thể
    if (Array.isArray(dates)) {
      // Nếu là mảng rỗng, trả về null
      if (dates.length === 0) {
        return null;
      }

      // Nếu có đúng 2 phần tử
      if (dates.length === 2) {
        // Luôn chuyển đổi sang đối tượng dayjs mới
        const startDate = dates[0] ? dayjs(dates[0]) : null;
        const endDate = dates[1] ? dayjs(dates[1]) : null;

        return [startDate, endDate] as [Dayjs | null, Dayjs | null];
      }

      // Các trường hợp khác - ví dụ mảng có 1 phần tử
      return null;
    }

    // Mảng không hợp lệ
    return null;
  }, [dates]);

  // Tạo disabledTime và disabledDate functions sử dụng logic giống booking page
  const openTime = vehicle?.openTime || "00:00";
  const closeTime = vehicle?.closeTime || "00:00";

  const disabledRangeTime = useMemo(() => {
    if (!vehicle?.vehicleType)
      return createDisabledTimeFunction("CAR", [], openTime, closeTime);
    return createDisabledTimeFunction(
      vehicle.vehicleType.toUpperCase() as VehicleType,
      bookedTimeSlots,
      openTime,
      closeTime
    );
  }, [vehicle?.vehicleType, bookedTimeSlots, openTime, closeTime]);

  const disabledDateFunction = useMemo(() => {
    return (current: Dayjs): boolean => {
      if (!current || !vehicle?.vehicleType) return false;

      const vehicleType = vehicle.vehicleType.toUpperCase() as VehicleType;
      return isDateDisabled(current, vehicleType, bookedTimeSlots);
    };
  }, [vehicle?.vehicleType, bookedTimeSlots]);

  // --- Loading and error states ---
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorMessage message="Không thể tải thông tin xe" />;
  }

  if (!vehicle) {
    return <div className="text-center py-16">Không tìm thấy thông tin xe</div>;
  }

  // --- Data preparation ---
  const images = vehicle.vehicleImages || [];
  const vehicleComments: VehicleComment[] = (vehicle.userComments ||
    []) as VehicleComment[];
  const features: VehicleFeature[] = vehicle?.vehicleFeatures || [];
  const unitPrice = vehicle.costPerDay || 0;

  // --- Helper functions ---
  // Image carousel navigation
  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Comments pagination
  const getPaginatedComments = (
    comments: VehicleComment[],
    page: number,
    perPage: number
  ) => {
    const startIndex = (page - 1) * perPage;
    return comments.slice(startIndex, startIndex + perPage);
  };

  const goToNextCommentPage = () => {
    const totalPages = Math.ceil(
      (vehicleComments?.length || 0) / commentsPerPage
    );
    if (currentCommentPage < totalPages) {
      setCurrentCommentPage(currentCommentPage + 1);
    }
  };

  const goToPrevCommentPage = () => {
    if (currentCommentPage > 1) {
      setCurrentCommentPage(currentCommentPage - 1);
    }
  };

  const hasValidLicense = (
    userLicenses: string[] | undefined,
    vehicleType: string
  ): boolean => {
    // Xe đạp không yêu cầu bằng lái
    if (vehicleType === "BICYCLE" || vehicleType === "MOTORBIKE") {
      return true;
    }

    // Nếu user không có bằng lái nào
    if (!userLicenses || userLicenses.length === 0) {
      return false;
    }

    // Kiểm tra theo từng loại xe
    switch (vehicleType) {
      case "CAR":
        return userLicenses.some((license) => license === "B");
      default:
        return false;
    }
  };

  const getLicenseRequirement = (vehicleType: string): string => {
    switch (vehicleType) {
      case "CAR":
        return "bằng lái loại B";
      case "MOTORBIKE":
        return "không cần bằng lái";
      case "BICYCLE":
        return "không cần bằng lái";
      default:
        return "giấy phép phù hợp";
    }
  };

  // Booking handlers
  const handleRent = () => {
    // Add debug information
    console.log("handleRent called");

    if (!pickupDateTime || !returnDateTime) {
      message.error("Vui lòng chọn thời gian thuê xe!");
      return;
    }

    // Lấy validLicenses từ cả hai nơi có thể chứa nó
    const userLicenses = user?.validLicenses || user?.result?.validLicenses;

    if (user === null) {
      // Mở AuthPopup cho người dùng đăng nhập
      setIsAuthPopupOpen(true);
    } else if (!userLicenses) {
      // Người dùng chưa có thông tin giấy phép lái xe
      setIsModalCheckOpen(true);
    } else {
      // Kiểm tra tính phù hợp của bằng lái xe
      const hasProperLicense = hasValidLicense(
        userLicenses,
        vehicle.vehicleType
      );

      if (!hasProperLicense) {
        // Hiển thị thông báo nếu người dùng không có bằng lái phù hợp
        Modal.error({
          title: "Bạn không có giấy phép phù hợp",
          content: `Loại xe này yêu cầu ${getLicenseRequirement(
            vehicle.vehicleType
          )}`,
        });
        return;
      }

      if (validationMessage === "Khoảng ngày đã được thuê.") {
        message.error("Khoảng ngày đã được thuê. Vui lòng chọn ngày khác!");
      } else {
        // Prevent page reload by using e.preventDefault() if available
        // Use router.push with the complete object to ensure proper navigation
        console.log("Navigating to booking page with ID:", vehicle?.id);

        // Using Next.js router with pathname as string to avoid potential encoding issues
        const bookingUrl = `/booking/?vehicleId=${
          vehicle?.id
        }&pickupTime=${encodeURIComponent(
          pickupDateTime || ""
        )}&returnTime=${encodeURIComponent(returnDateTime || "")}`;
        console.log("Booking URL:", bookingUrl);

        // Use window.location for a hard navigation if router isn't working
        window.location.href = bookingUrl;
      }
    }
  };

  // DatePicker handlers
  const handleDateChange: RangePickerProps["onChange"] = async (values) => {
    if (values && values[0] && values[1]) {
      const startDate = values[0] as Dayjs;
      const endDate = values[1] as Dayjs;

      // Update pickup and return times - For URL params, use readable format
      setPickupDateTime(startDate.format("YYYY-MM-DD HH:mm"));
      setReturnDateTime(endDate.format("YYYY-MM-DD HH:mm"));

      // CHỈ gọi API lấy quantity cho xe máy và xe đạp, KHÔNG cho ô tô
      if (vehicle?.vehicleType && vehicle.vehicleType.toUpperCase() !== "CAR") {
        const thumb = vehicle?.thumb;
        const providerId = vehicle?.userId;
        const from = startDate.format("YYYY-MM-DDTHH:mm:ss");
        const to = endDate.format("YYYY-MM-DDTHH:mm:ss");

        try {
          const quantity = await getAvailableThumbQuantity({
            thumb,
            providerId,
            from,
            to,
          });
          setAvailableQuantity(quantity);
          setSelectedQuantity(1);
          setShowMultiBooking(quantity > 1);
          setAvailableVehicles([]); // reset danh sách xe khi đổi ngày
        } catch (err) {
          setAvailableQuantity(1);
          setShowMultiBooking(false);
          setAvailableVehicles([]);
        }
      } else {
        // Nếu là ô tô, reset về 1 xe và không cho phép đặt nhiều
        setAvailableQuantity(1);
        setShowMultiBooking(false);
        setAvailableVehicles([]);
      }

      // Tính toán thời gian thuê mới
      const calculation = calculateRentalDuration(startDate, endDate);
      setRentalCalculation(calculation);

      // Kiểm tra buffer time conflict giống booking page
      if (vehicle?.vehicleType) {
        const vehicleType = vehicle.vehicleType.toUpperCase() as VehicleType;
        const conflictCheck = checkBufferTimeConflict(
          vehicleType,
          startDate,
          endDate,
          bookedTimeSlots
        );

        if (conflictCheck.hasConflict) {
          setBufferConflictMessage(
            conflictCheck.message || "Có xung đột thời gian với booking khác"
          );
          setValidationMessage("");
        } else {
          setBufferConflictMessage("");
          setValidationMessage("");
        }
      } else {
        setBufferConflictMessage("");
        setValidationMessage("");
      }
    } else {
      // Reset values if no dates selected
      setPickupDateTime("");
      setReturnDateTime("");
      setBufferConflictMessage("");
      setValidationMessage("");
      setAvailableQuantity(1);
      setShowMultiBooking(false);
      setAvailableVehicles([]);
    }

    // Update Recoil state
    updateDates(values);
  };

  // --- Render component ---
  return (
    <section className="!pt-20 pb-20 relative">
      {/* Main container */}
      <div className="container mx-auto max-w-[1440px] px-5 2xl:px-8">
        {/* Vehicle images gallery */}
        <div className="grid grid-cols-12 mt-8 gap-8">
          {/* Main image */}
          <div className="lg:col-span-8 col-span-12 row-span-2 lg:block hidden">
            {images.length > 0 && (
              <div className="">
                <Image
                  src={images[0]?.imageUrl}
                  alt={`${vehicle.brandName} ${vehicle.modelName}`}
                  width={800}
                  height={600}
                  className="rounded-2xl w-full h-[600px] object-cover"
                  unoptimized={true}
                />
              </div>
            )}
          </div>

          {/* Secondary images */}
          <div className="lg:col-span-4 lg:block hidden">
            {images.length > 1 && (
              <Image
                src={images[1]?.imageUrl}
                alt={`${vehicle.brandName} ${vehicle.modelName}`}
                width={500}
                height={600}
                className="rounded-2xl w-full h-full object-cover"
                unoptimized={true}
              />
            )}
          </div>
          <div className="lg:col-span-2 col-span-6 lg:block hidden">
            {images.length > 2 && (
              <Image
                src={images[2]?.imageUrl}
                alt={`${vehicle.brandName} ${vehicle.modelName}`}
                width={400}
                height={500}
                className="rounded-2xl w-full h-full object-cover"
                unoptimized={true}
              />
            )}
          </div>
          <div className="lg:col-span-2 col-span-6 lg:block hidden">
            {images.length > 3 && (
              <Image
                src={images[3]?.imageUrl}
                alt={`${vehicle.brandName} ${vehicle.modelName}`}
                width={400}
                height={500}
                className="rounded-2xl w-full h-full object-cover"
                unoptimized={true}
              />
            )}
          </div>
        </div>

        {/* Mobile carousel */}
        <div className="lg:hidden relative mt-8">
          {images.length > 0 && (
            <div className="relative h-[350px] w-full">
              <Image
                src={
                  images[currentImageIndex]?.imageUrl ||
                  "/default-car-image.jpg"
                }
                alt={`Vehicle Image ${currentImageIndex + 1}`}
                fill
                className="rounded-xl object-cover"
                unoptimized={true}
              />

              {/* Navigation arrows */}
              <button
                onClick={goToPrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                aria-label="Previous image"
              >
                <Icon icon="mdi:chevron-left" width={24} height={24} />
              </button>

              <button
                onClick={goToNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                aria-label="Next image"
              >
                <Icon icon="mdi:chevron-right" width={24} height={24} />
              </button>

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1}/{images.length}
              </div>
            </div>
          )}
        </div>

        {/* Vehicle title and rating */}
        <div className="grid grid-cols-12 items-end gap-8 mt-10">
          <div className="lg:col-span-8 col-span-12">
            <h1 className="lg:text-5xl text-4xl font-semibold text-dark dark:text-white">
              {vehicle?.thumb}
            </h1>
            <div className="flex gap-2.5 mt-3">
              <Icon
                icon="solar:star-linear"
                width={24}
                height={24}
                className="text-primary"
              />
              <p className="text-lg text-dark dark:text-white">
                {vehicle?.rating}
              </p>
              <Icon
                icon="ph:map-pin"
                width={24}
                height={24}
                className="text-dark/50 dark:text-white/50"
              />
              <p className="text-dark/50 dark:text-white/50 text-lg">
                {vehicle?.address}
              </p>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-12 gap-10 mt-12">
          {/* Left column - Vehicle details */}
          <div className="lg:col-span-8 col-span-12">
            {/* Vehicle features */}
            <div className="py-10 my-10 border-y border-dark/10 dark:border-white/20 flex flex-col gap-10">
              <h3 className="text-3xl font-semibold">Đặc điểm</h3>
              <div className="flex justify-between ">
                <div className="flex items-center gap-1">
                  <Icon icon={"mdi:car-shift-pattern"} width={24} height={24} />
                  <p className="text-xl font-normal text-black dark:text-white">
                    {vehicle?.transmission
                      ? translateENtoVI(vehicle.transmission)
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon={"mdi:car-seat"} width={24} height={24} />
                  <p className="text-xl font-normal text-black dark:text-white">
                    {vehicle?.numberSeat
                      ? `${vehicle.numberSeat} Ghế ngồi`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon={"mdi:fuel"} width={24} height={24} />
                  <p className="text-xl font-normal text-black dark:text-white">
                    {vehicle?.fuelType ? translateENtoVI(vehicle.fuelType) : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle description */}
            <div className="flex flex-col gap-6">
              <h3 className="text-3xl font-semibold">Mô tả</h3>
              <p className="text-dark dark:text-white text-lg leading-relaxed">
                {vehicle?.description}
              </p>
            </div>

            {/* Additional amenities */}
            <div className="py-10 mt-10 border-t border-dark/5 dark:border-white/15">
              <h3 className="text-2xl font-medium">Các tiện nghi khác</h3>

              {features && features.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 mt-8 gap-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <p className="text-lg dark:text-white text-dark">
                        {feature.name ? translateENtoVI(feature.name) : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-dark/60 dark:text-white/60">
                  Không có tiện nghi được cung cấp
                </p>
              )}
            </div>

            {/* Required documents */}
            <div className="py-10 mt-10 border-t border-gray-200 dark:border-white/15">
              <div className="mt-10">
                <h2 className="text-2xl font-medium">Giấy tờ thuê xe</h2>
                <div className="bg-amber-100 border-transparent rounded-md p-4 border-solid border-l-4 border-l-amber-600 mt-4">
                  <h4 className="flex items-center gap-1 text-gray-800 m-0 font-medium text-xl">
                    <span>Chọn 1 trong 2 hình thức</span>
                  </h4>
                  <div className="mt-4 font-bold flex flex-col gap-3 text-base">
                    <div className="flex gap-2 items-center">
                      <span>GPLX & CCCD gắn chip (đối chiếu)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span>GPLX (đối chiếu) & Hộ chiếu (giữ lại)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="mt-10">
              <h2 className="font-medium text-2xl">Quy định thuê xe của RFT</h2>
              <ul className="mt-4 text-lg">
                <li>Sử dụng xe đúng mục đích.</li>
                <li>
                  Không sử dụng xe thuê vào mục đích phi pháp, trái pháp luật.
                </li>
                <li>Không sử dụng xe thuê để cầm cố, thế chấp.</li>
                <li>Không hút thuốc, nhả kẹo cao su, xả rác trong xe.</li>
                <li>Không chở hàng quốc cấm dễ cháy nổ.</li>
                <li>Không chở hoa quả, thực phẩm nặng mùi trong xe.</li>
              </ul>
            </div>

            {/* Cancellation policy */}
            <div className="mt-10">
              <h2 className="font-medium text-2xl">Chính sách thuê xe</h2>
              <div className="mt-4 text-lg">
                {/* Hiển thị khung giờ thuê */}
                {vehicle?.openTime === "00:00:00" &&
                vehicle?.closeTime === "00:00:00" ? (
                  <span>
                    Xe có thể thuê bất kỳ thời gian nào trong ngày (24/7).
                  </span>
                ) : (
                  <span>
                    Khách có thể thuê xe vào khung giờ từ{" "}
                    <b>{vehicle?.openTime?.slice(0, 5)}</b> đến{" "}
                    <b>{vehicle?.closeTime?.slice(0, 5)}</b> mỗi ngày.
                  </span>
                )}
                {/* Hiển thị penalty nếu có */}
                {vehicle?.penalty?.description && (
                  <div className="mt-2 text-base ">
                    <b>Chính sách hủy:</b> {vehicle.penalty.description}
                  </div>
                )}
              </div>
            </div>

            {/* User reviews */}
            <div className="py-10 my-10 border-y border-dark/10 dark:border-white/20">
              <h3 className="text-2xl font-medium mb-6">
                Đánh giá từ người dùng
              </h3>

              <div className="mt-8">
                {vehicleComments.length > 0 ? (
                  <>
                    <div className="space-y-6">
                      {getPaginatedComments(
                        vehicleComments,
                        currentCommentPage,
                        commentsPerPage
                      ).map((comment, index) => (
                        <div
                          key={comment.id || index}
                          className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm"
                        >
                          {comment.userImage && (
                            <div className="flex-shrink-0">
                              <Image
                                src={comment.userImage}
                                alt={`${comment.userName}'s avatar`}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                                  {comment.userName}
                                </h4>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Icon
                                      key={i}
                                      icon={
                                        i < comment.star
                                          ? "mdi:star"
                                          : "mdi:star-outline"
                                      }
                                      className={
                                        i < comment.star
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      }
                                      width={18}
                                      height={18}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-200 mt-1">
                              {comment.comment}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination controls */}
                    {vehicleComments.length > commentsPerPage && (
                      <div className="flex justify-between items-center mt-6">
                        <button
                          onClick={goToPrevCommentPage}
                          disabled={currentCommentPage === 1}
                          className={`px-4 py-2 rounded-md ${
                            currentCommentPage === 1
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                        >
                          Trang trước
                        </button>

                        <span className="text-gray-700 dark:text-gray-300">
                          Trang {currentCommentPage} /{" "}
                          {Math.ceil(vehicleComments.length / commentsPerPage)}
                        </span>

                        <button
                          onClick={goToNextCommentPage}
                          disabled={
                            currentCommentPage >=
                            Math.ceil(vehicleComments.length / commentsPerPage)
                          }
                          className={`px-4 py-2 rounded-md ${
                            currentCommentPage >=
                            Math.ceil(vehicleComments.length / commentsPerPage)
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                        >
                          Trang sau
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-dark/60 dark:text-white/60">
                    Chưa có đánh giá nào cho xe này.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Booking widget */}
          <div className="lg:col-span-4 col-span-12">
            <div className="bg-primary/10 p-10 rounded-2xl relative z-10 overflow-hidden">
              {/* Date picker */}
              <div>
                <h3 className="text-lg font-bold uppercase text-gray-700 dark:text-gray-200 mb-4">
                  Thời gian thuê
                </h3>

                <div className="mt-4 w-full">
                  <DateRangePicker
                    showTime={{
                      format: "HH:mm",
                      minuteStep: 30,
                    }}
                    format="DD-MM-YYYY HH:mm"
                    disabledTime={disabledRangeTime}
                    disabledDate={disabledDateFunction}
                    className="w-full"
                    onChange={handleDateChange}
                    value={formattedDates}
                    placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                  />
                  {validationMessage && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationMessage}
                    </p>
                  )}
                  {bufferConflictMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                      <p className="text-red-600 text-sm">
                        ⚠️ {bufferConflictMessage}
                      </p>
                      {vehicle?.vehicleType && (
                        <p className="text-gray-600 text-xs mt-1">
                          {
                            BUFFER_TIME_RULES[
                              vehicle.vehicleType.toUpperCase() as VehicleType
                            ]?.description
                          }
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* CHỈ hiển thị cho xe máy và xe đạp, KHÔNG cho ô tô */}
              {availableQuantity > 1 &&
                vehicle?.vehicleType &&
                vehicle.vehicleType.toUpperCase() !== "CAR" && (
                  <div className="mt-4 flex items-center justify-between border-t border-b py-4 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        Số lượng xe khả dụng:
                      </span>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-base font-bold text-primary ring-1 ring-inset ring-blue-200">
                        {availableQuantity}
                      </span>
                    </div>
                    <button
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                      onClick={async () => {
                        setShowMultiBooking(true);
                        // Gọi API lấy danh sách xe khả dụng
                        try {
                          const thumb = vehicle?.thumb;
                          const providerId = vehicle?.userId;
                          const from = pickupDateTime
                            ? dayjs(pickupDateTime, "YYYY-MM-DD HH:mm").format(
                                "YYYY-MM-DDTHH:mm:ss"
                              )
                            : "";
                          const to = returnDateTime
                            ? dayjs(returnDateTime, "YYYY-MM-DD HH:mm").format(
                                "YYYY-MM-DDTHH:mm:ss"
                              )
                            : "";
                          const vehicles = await getAvailableThumbList({
                            thumb,
                            providerId,
                            from,
                            to,
                          });
                          setAvailableVehicles(vehicles);
                          setIsMultiModalOpen(true);
                        } catch (err) {
                          setAvailableVehicles([]);
                          setIsMultiModalOpen(true);
                        }
                      }}
                    >
                      Xem thêm
                    </button>
                  </div>
                )}

              {/* Price details */}
              <div className="mt-6">
                <h3 className="text-lg font-bold uppercase text-gray-700 dark:text-gray-200 mb-4">
                  Chi tiết giá
                </h3>
                <div className="space-y-3 text-gray-700 dark:text-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-base">
                      {rentalCalculation?.isHourlyRate
                        ? "Giá theo giờ"
                        : "Giá theo ngày"}
                    </span>
                    <span className="text-base font-medium">
                      {rentalCalculation?.isHourlyRate
                        ? `${hourlyRate.toLocaleString()}₫/giờ`
                        : `${formatCurrency(unitPrice)}/ngày`}
                    </span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />

                  <div className="flex justify-between items-center">
                    <span className="text-base">Thời gian thuê</span>
                    <span className="text-base font-medium">
                      {rentalCalculation
                        ? formatRentalDuration(rentalCalculation)
                        : `${rentalDurationDays} ngày`}
                    </span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />

                  <div className="flex justify-between items-center">
                    <span className="text-base">
                      {rentalCalculation?.isHourlyRate
                        ? "Giá theo thời gian"
                        : "Giá cơ bản"}
                    </span>
                    <span className="text-base font-medium">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>

                  {/*  Hiển thị breakdown cho hourly rate */}
                  {rentalCalculation?.isHourlyRate && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 ml-4 space-y-1">
                      {rentalCalculation.billingHours > 0 && (
                        <div>
                          • {rentalCalculation.billingHours} giờ ×{" "}
                          {hourlyRate.toLocaleString()}₫ ={" "}
                          {(
                            rentalCalculation.billingHours * hourlyRate
                          ).toLocaleString()}
                          ₫
                        </div>
                      )}
                      {rentalCalculation.billingMinutes > 0 && (
                        <div>
                          • {rentalCalculation.billingMinutes} phút ×{" "}
                          {Math.round(hourlyRate / 60).toLocaleString()}₫ ={" "}
                          {Math.round(
                            (rentalCalculation.billingMinutes / 60) * hourlyRate
                          ).toLocaleString()}
                          ₫
                        </div>
                      )}
                    </div>
                  )}

                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xl font-bold">Tổng</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Book button */}
              <div className="space-y-3 mt-6">
                {/* Using a simple button since handleRent has the navigation logic */}
                <button
                  className={`w-full text-lg py-3 rounded-lg font-semibold ${
                    bufferConflictMessage || validationMessage
                      ? "bg-gray-400 cursor-not-allowed text-gray-600"
                      : "bg-teal-500 hover:bg-teal-600 text-white"
                  }`}
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default form submission behavior
                    console.log("Book button clicked");

                    // Check for conflicts before proceeding
                    if (bufferConflictMessage || validationMessage) {
                      message.warning(
                        "Vui lòng chọn thời gian khác để tiếp tục"
                      );
                      return;
                    }

                    handleRent();
                  }}
                  disabled={!!(bufferConflictMessage || validationMessage)}
                  type="button" // Explicitly set type to button to prevent form submission
                >
                  Đặt xe
                </button>
              </div>
            </div>

            {/* Bảng phụ phí phát sinh */}
            {vehicle?.vehicleType === "CAR" && (
              <div className="mt-8 bg-white rounded-xl shadow p-6 border border-gray-200">
                <h3 className="text-lg font-bold mb-4 text-gray-700">
                  Phụ phí có thể phát sinh
                </h3>
                <ul className="space-y-4">
                  <li>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">
                        Phí vượt giới hạn
                      </span>
                      <span className="text-primary font-bold">
                        {vehicle?.extraFeeRule?.feePerExtraKm?.toLocaleString() ||
                          "-"}
                        đ/km
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      Phụ phí phát sinh nếu lộ trình di chuyển vượt quá{" "}
                      {vehicle?.extraFeeRule?.maxKmPerDay?.toLocaleString() ||
                        "-"}
                      km khi thuê xe 1 ngày
                    </div>
                  </li>
                  <li>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">
                        Phí quá giờ
                      </span>
                      <span className="text-primary font-bold">
                        {vehicle?.extraFeeRule?.feePerExtraHour?.toLocaleString() ||
                          "-"}
                        đ/giờ
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      Phụ phí phát sinh nếu hoàn trả xe trễ hơn{" "}
                      {vehicle?.extraFeeRule?.allowedHourLate?.toLocaleString() ||
                        "-"}{" "}
                      giờ. Trường hợp trễ quá số giờ này, phụ phí thêm 1 ngày
                      thuê
                    </div>
                  </li>
                  <li>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">
                        Phí vệ sinh
                      </span>
                      <span className="text-primary font-bold">
                        {vehicle?.extraFeeRule?.cleaningFee?.toLocaleString() ||
                          "-"}
                        đ
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      Phụ phí phát sinh khi xe hoàn trả không đảm bảo vệ sinh
                      (như vết bẩn, bụi, cát, sinh lầy...)
                    </div>
                  </li>
                  <li>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">
                        Phí khử mùi
                      </span>
                      <span className="text-primary font-bold">
                        {vehicle?.extraFeeRule?.smellRemovalFee?.toLocaleString() ||
                          "-"}
                        đ
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      Phụ phí phát sinh khi xe hoàn trả bị ám mùi khó chịu (mùi
                      thuốc lá, thực phẩm nặng mùi...)
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Popup */}
      <AuthPopup
        isOpen={isAuthPopupOpen}
        onClose={() => setIsAuthPopupOpen(false)}
        initialMode="login"
      />

      {/* Driver license verification modal */}
      <Modal
        title="Thông tin giấy phép lái xe"
        open={isModalCheckOpen}
        onOk={handleOk1}
        onCancel={handleCancel1}
        footer={false}
      >
        <div className="py-3">
          <p className="mb-4">
            Bạn cần cập nhật thông tin giấy phép lái xe để thuê{" "}
            {vehicle.vehicleType === "CAR" ? "xe ô tô" : "xe"}.
          </p>
          <p className="font-medium mb-4">Yêu cầu giấy phép:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Xe ô tô: Bằng lái loại B2</li>
          </ul>
        </div>
        <Link href="/profile">
          <AntButton type="primary" className="mt-2">
            Cập nhật thông tin
          </AntButton>
        </Link>
      </Modal>
      {/* Sửa lại Modal để có thông báo rõ ràng hơn */}
      <Modal
        title="Chọn xe khả dụng"
        open={isMultiModalOpen}
        onCancel={() => setIsMultiModalOpen(false)}
        footer={null}
        width={700}
        className="vehicle-select-modal"
      >
        <div className="flex flex-col gap-4">
          {/* Thêm thông báo về loại xe được hỗ trợ */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
            <div className="flex items-center gap-2">
              <Icon
                icon="mdi:information"
                className="text-blue-600"
                width={20}
                height={20}
              />
              <span className="text-blue-800 text-sm font-medium">
                Tính năng đặt nhiều xe chỉ áp dụng cho xe máy và xe đạp
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            Có {availableQuantity} xe{" "}
            {translateENtoVI(vehicle?.vehicleType || "")} khả dụng trong thời
            gian đã chọn. Vui lòng chọn xe bạn muốn thuê:
          </div>

          {availableVehicles.length > 0 ? (
            <>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {availableVehicles.map((vehicleItem, index) => (
                  <div
                    key={vehicleItem.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedVehicleIds.includes(vehicleItem.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      const isSelected = selectedVehicleIds.includes(
                        vehicleItem.id
                      );
                      if (isSelected) {
                        setSelectedVehicleIds((prev) =>
                          prev.filter((id) => id !== vehicleItem.id)
                        );
                      } else {
                        setSelectedVehicleIds((prev) => [
                          ...prev,
                          vehicleItem.id,
                        ]);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVehicleIds.includes(vehicleItem.id)}
                      onChange={() => {}} // Handled by parent div click
                      className="w-5 h-5 accent-blue-500"
                    />

                    {/* Hình ảnh xe */}
                    <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {vehicleItem.vehicleImages &&
                      vehicleItem.vehicleImages.length > 0 ? (
                        <Image
                          src={vehicleItem.vehicleImages[0].imageUrl}
                          alt={vehicleItem.thumb}
                          layout="fill"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Icon
                            icon={
                              vehicle?.vehicleType === "MOTORBIKE"
                                ? "mdi:motorbike"
                                : vehicle?.vehicleType === "BICYCLE"
                                ? "mdi:bicycle"
                                : "mdi:car"
                            }
                            className="text-gray-400"
                            width={24}
                            height={24}
                          />
                        </div>
                      )}
                    </div>

                    {/* Thông tin xe */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base text-gray-800 truncate">
                        {vehicleItem.thumb} - {vehicleItem.modelName} (
                        {vehicleItem.yearManufacture})
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>Biển số: {vehicleItem.licensePlate}</span>
                        <span className="text-blue-600 font-medium">
                          {vehicleItem.costPerDay?.toLocaleString("vi-VN")}
                          ₫/ngày
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                          {translateENtoVI(vehicleItem.vehicleType)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Thông tin tổng hợp */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-base font-medium text-gray-700">
                    Đã chọn: {selectedVehicleIds.length} xe{" "}
                    {translateENtoVI(vehicle?.vehicleType || "")}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    Tổng:{" "}
                    {availableVehicles
                      .filter((v) => selectedVehicleIds.includes(v.id))
                      .reduce((sum, v) => sum + (v.costPerDay || 0), 0)
                      .toLocaleString("vi-VN")}
                    ₫/ngày
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    onClick={() => setIsMultiModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={handleMultiBook}
                    disabled={selectedVehicleIds.length === 0}
                  >
                    Đặt {selectedVehicleIds.length} xe
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Icon
                icon="mdi:car-off"
                className="mx-auto mb-4 text-gray-400"
                width={48}
                height={48}
              />
              <p>Không có xe khả dụng trong khoảng thời gian này.</p>
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}
