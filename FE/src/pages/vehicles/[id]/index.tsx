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
import { Vehicle, VehicleFeature, VehicleImage } from "@/types/vehicle";
import { Comment as VehicleComment } from "@/types/vehicle";
import { formatCurrency } from "@/lib/format-currency";
import { RangePickerProps } from "antd/es/date-picker";

import { format, parseISO, isValid } from "date-fns";

// Ant Design Components
import { Modal, message, Button as AntButton, Button } from "antd";
import ReportButton from "@/components/ReportComponent";
import dayjs, { Dayjs } from "dayjs";

import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

// --- Type definitions ---
type RangeValue = [Date | null, Date | null] | null;

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

  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  // Modal state
  const [isModalCheckOpen, setIsModalCheckOpen] = useState(false);
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);

  const [rentalCalculation, setRentalCalculation] =
    useState<RentalCalculation | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(0);

  // Buffer time state
  const [bufferConflictMessage, setBufferConflictMessage] =
    useState<string>("");

  // Comments pagination state
  const [currentCommentPage, setCurrentCommentPage] = useState<number>(1);
  const commentsPerPage = 5;

  // Multiple booking
  const [availableQuantity, setAvailableQuantity] = useState(1);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [showMultiBooking, setShowMultiBooking] = useState(false);
  const [isMultiModalOpen, setIsMultiModalOpen] = useState(false);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);

  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);

  // Reset dates khi component mount hoặc vehicle ID thay đổi
  useEffect(() => {
    // ALWAYS reset all date-related states when entering the page
    setPickupDateTime("");
    setReturnDateTime("");
    setDates([] as never[]);
    setValidationMessage("");
    setBufferConflictMessage("");
    setRentalCalculation(null);
    setTotalPrice(vehicle?.costPerDay || 0);
    setRentalDurationDays(1);
    setAvailableQuantity(1);
    setShowMultiBooking(false);
    setAvailableVehicles([]);
    setSelectedVehicleIds([]);

    // Don't read from URL params - force user to select dates
  }, [id]); // Only depend on id change

  // Hàm xử lý đặt nhiều xe
  const handleMultiBook = () => {
    if (user === null) {
      setIsMultiModalOpen(false);
      setIsAuthPopupOpen(true);
    } else {
      setIsMultiModalOpen(false);
      const vehicleIdsParam = selectedVehicleIds.join(",");
      const bookingUrl = `/booking?vehicleId=${encodeURIComponent(
        vehicleIdsParam
      )}&pickupTime=${encodeURIComponent(
        pickupDateTime
      )}&returnTime=${encodeURIComponent(returnDateTime)}`;
      window.location.href = bookingUrl;
    }
  };

  // --- Dates handling ---
  const updateDates = (value: RangeValue) => {
    if (value === null) {
      setDates([] as never[]);
    } else if (Array.isArray(value) && value.length === 2) {
      setDates(value as unknown as never[]);
    } else {
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

  useEffect(() => {
    if (vehicle?.costPerDay) {
      setHourlyRate(Math.round(vehicle.costPerDay / 12));
    }
  }, [vehicle?.costPerDay]);

  // Calculate price based on selected dates
  useEffect(() => {
    if (pickupDateTime && returnDateTime && vehicle?.costPerDay) {
      const startDate = parseISO(pickupDateTime.replace(" ", "T"));
      const endDate = parseISO(returnDateTime.replace(" ", "T"));

      if (endDate <= startDate) {
        setRentalDurationDays(1);
        setTotalPrice(vehicle.costPerDay);
        setRentalCalculation(null);
        return;
      }

      const calculation = calculateRentalDuration(startDate, endDate);
      setRentalCalculation(calculation);

      const price = calculateRentalPrice(
        calculation,
        hourlyRate,
        vehicle.costPerDay
      );
      setTotalPrice(price);

      setRentalDurationDays(
        calculation.isHourlyRate ? 1 : calculation.billingDays
      );
    } else if (vehicle?.costPerDay) {
      setTotalPrice(vehicle.costPerDay);
      setRentalCalculation(null);
    }
  }, [pickupDateTime, returnDateTime, vehicle?.costPerDay, hourlyRate]);

  // Fetch booked time slots
  useEffect(() => {
    if (bookedTimeSlots.length > 0) {
      console.log("Booked time slots:", bookedTimeSlots);

      const bookedRanges = bookedTimeSlots.map((slot) => {
        const startDate = format(
          parseBackendTime(slot.startDate),
          "yyyy-MM-dd"
        );
        const endDate = format(parseBackendTime(slot.endDate), "yyyy-MM-dd");
        return `${startDate} đến ${endDate}`;
      });

      console.log("Các khoảng ngày đã đặt:", bookedRanges);
    }
  }, [bookedTimeSlots]);

  // Thêm effect này để theo dõi thay đổi của user
  useEffect(() => {
    if (user && isAuthPopupOpen) {
      setIsAuthPopupOpen(false);

      if (
        vehicle?.vehicleType &&
        vehicle.vehicleType.toUpperCase() === "CAR" &&
        (!user?.validLicenses ||
          (Array.isArray(user.validLicenses) &&
            user.validLicenses.length === 0))
      ) {
        setIsModalCheckOpen(true);
      }
    }
  }, [
    user,
    isAuthPopupOpen,
    router,
    vehicle?.id,
    vehicle?.vehicleType,
    pickupDateTime,
    returnDateTime,
  ]);

  // Format dates for DateRangePicker
  const formattedDates = useMemo(() => {
    if (!dates || !Array.isArray(dates) || dates.length !== 2) {
      return null;
    }

    // Convert Date objects to Dayjs for Ant DatePicker
    const startDate = dates[0] ? dayjs(dates[0]) : null;
    const endDate = dates[1] ? dayjs(dates[1]) : null;

    if (!startDate?.isValid() || !endDate?.isValid()) {
      return null;
    }

    return [startDate, endDate] as [Dayjs, Dayjs];
  }, [dates]);

  // Tạo disabledTime và disabledDate functions
  const openTime = vehicle?.openTime || "00:00";
  const closeTime = vehicle?.closeTime || "00:00";

  const disabledRangeTime = useMemo(() => {
    if (!vehicle?.vehicleType)
      return (current: Dayjs | null) => {
        if (!current) {
          return {
            disabledHours: () => [],
            disabledMinutes: () => [],
          };
        }
        // Convert Dayjs to Date for our function
        const dateValue = current.toDate();
        return createDisabledTimeFunction(
          "CAR",
          [],
          openTime,
          closeTime
        )(dateValue);
      };

    return (current: Dayjs | null) => {
      if (!current) {
        return {
          disabledHours: () => [],
          disabledMinutes: () => [],
        };
      }
      // Convert Dayjs to Date for our function
      const dateValue = current.toDate();
      return createDisabledTimeFunction(
        vehicle.vehicleType.toUpperCase() as VehicleType,
        bookedTimeSlots,
        openTime,
        closeTime
      )(dateValue);
    };
  }, [vehicle?.vehicleType, bookedTimeSlots, openTime, closeTime]);

  const disabledDateFunction = useMemo(() => {
    return (current: Dayjs): boolean => {
      if (!current) return false;

      // Convert Dayjs to Date
      const currentDate = current.toDate();

      if (!vehicle?.vehicleType) return false;

      const vehicleType = vehicle.vehicleType.toUpperCase() as VehicleType;
      return isDateDisabled(
        currentDate,
        vehicleType,
        bookedTimeSlots,
        openTime,
        closeTime
      );
    };
  }, [vehicle?.vehicleType, bookedTimeSlots, openTime, closeTime]);

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
  const images = (vehicle.vehicleImages || []).slice(0, 4);
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
    if (vehicleType === "BICYCLE" || vehicleType === "MOTORBIKE") {
      return true;
    }

    if (!userLicenses || userLicenses.length === 0) {
      return false;
    }

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
    console.log("handleRent called");

    if (!pickupDateTime || !returnDateTime) {
      message.error("Vui lòng chọn thời gian thuê xe!");
      return;
    }

    const userLicenses = user?.validLicenses || user?.validLicenses;

    if (user === null) {
      setIsAuthPopupOpen(true);
    } else if (!userLicenses) {
      setIsModalCheckOpen(true);
    } else {
      const hasProperLicense = hasValidLicense(
        userLicenses,
        vehicle.vehicleType
      );

      if (!hasProperLicense) {
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
        console.log("Navigating to booking page with ID:", vehicle?.id);

        const bookingUrl = `/booking/?vehicleId=${
          vehicle?.id
        }&pickupTime=${encodeURIComponent(
          pickupDateTime || ""
        )}&returnTime=${encodeURIComponent(returnDateTime || "")}`;
        console.log("Booking URL:", bookingUrl);

        window.location.href = bookingUrl;
      }
    }
  };

  // DatePicker handlers
  const handleDateChange: RangePickerProps["onChange"] = async (values) => {
    if (values && values[0] && values[1]) {
      // Clean milliseconds khi convert từ Dayjs sang Date
      const startDate = values[0].toDate();
      startDate.setMilliseconds(0);
      startDate.setSeconds(0);

      const endDate = values[1].toDate();
      endDate.setMilliseconds(0);
      endDate.setSeconds(0);

      // Validate phút
      const startMinute = startDate.getMinutes();
      const endMinute = endDate.getMinutes();

      if (startMinute !== 0 && startMinute !== 30) {
        message.error("Giờ nhận xe phải chọn phút :00 hoặc :30");
        return;
      }

      if (endMinute !== 0 && endMinute !== 30) {
        message.error("Giờ trả xe phải chọn phút :00 hoặc :30");
        return;
      }

      // Thay thế isSame và isBefore của dayjs
      if (startDate.getTime() === endDate.getTime()) {
        message.error("Giờ nhận xe và giờ trả xe không được trùng nhau");
        return;
      }

      if (endDate < startDate) {
        message.error("Giờ trả xe phải sau giờ nhận xe");
        return;
      }

      // format dates
      setPickupDateTime(format(startDate, "yyyy-MM-dd HH:mm"));
      setReturnDateTime(format(endDate, "yyyy-MM-dd HH:mm"));

      // CHỈ gọi API lấy quantity cho xe máy và xe đạp, KHÔNG cho ô tô
      if (vehicle?.vehicleType && vehicle.vehicleType.toUpperCase() !== "CAR") {
        const thumb = vehicle?.thumb;
        const providerId = vehicle?.userId;
        const from = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
        const to = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");

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
          setAvailableVehicles([]);
        } catch (err) {
          setAvailableQuantity(1);
          setShowMultiBooking(false);
          setAvailableVehicles([]);
        }
      } else {
        setAvailableQuantity(1);
        setShowMultiBooking(false);
        setAvailableVehicles([]);
      }

      const calculation = calculateRentalDuration(startDate, endDate);
      setRentalCalculation(calculation);

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
      setPickupDateTime("");
      setReturnDateTime("");
      setBufferConflictMessage("");
      setValidationMessage("");
      setAvailableQuantity(1);
      setShowMultiBooking(false);
      setAvailableVehicles([]);
    }

    // Convert values to Date array for updateDates
    if (values && values[0] && values[1]) {
      updateDates([values[0].toDate(), values[1].toDate()]);
    } else {
      updateDates(null);
    }
  };

  // --- Render component ---
  return (
    <section className="pt-16 sm:pt-20 pb-10 sm:pb-20 relative">
      {/* Main container */}
      <div className="container mx-auto max-w-[1440px] px-4 sm:px-5 2xl:px-8">
        {/* Vehicle images gallery - Desktop */}
        <div className="hidden lg:grid grid-cols-12 mt-8 gap-2">
          {/* Main image - spans 8 columns */}
          <div className="col-span-8">
            {images.length > 0 && (
              <div
                className="cursor-pointer"
                onClick={() => {
                  setPreviewImageIndex(0);
                  setIsImagePreviewOpen(true);
                }}
              >
                <Image
                  src={images[0]?.imageUrl}
                  alt={`${vehicle.brandName} ${vehicle.modelName}`}
                  width={800}
                  height={500}
                  className="rounded-2xl w-full h-[500px] object-cover hover:opacity-90 transition-opacity"
                  unoptimized={true}
                />
              </div>
            )}
          </div>

          {/* Right side images - spans 4 columns */}
          <div className="col-span-4">
            <div className="grid grid-rows-3 gap-2 h-[500px]">
              {/* Second image */}
              {images.length > 1 && (
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setPreviewImageIndex(1);
                    setIsImagePreviewOpen(true);
                  }}
                >
                  <Image
                    src={images[1]?.imageUrl}
                    alt={`${vehicle.brandName} ${vehicle.modelName}`}
                    width={400}
                    height={160}
                    className="rounded-xl w-full h-full object-cover hover:opacity-90 transition-opacity"
                    unoptimized={true}
                  />
                </div>
              )}

              {/* Third image */}
              {images.length > 2 && (
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setPreviewImageIndex(2);
                    setIsImagePreviewOpen(true);
                  }}
                >
                  <Image
                    src={images[2]?.imageUrl}
                    alt={`${vehicle.brandName} ${vehicle.modelName}`}
                    width={400}
                    height={160}
                    className="rounded-xl w-full h-full object-cover hover:opacity-90 transition-opacity"
                    unoptimized={true}
                  />
                </div>
              )}

              {/* Fourth image - Không có overlay "+X ảnh" nữa vì chỉ có 4 ảnh */}
              {images.length > 3 && (
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setPreviewImageIndex(3);
                    setIsImagePreviewOpen(true);
                  }}
                >
                  <Image
                    src={images[3]?.imageUrl}
                    alt={`${vehicle.brandName} ${vehicle.modelName}`}
                    width={400}
                    height={160}
                    className="rounded-xl w-full h-full object-cover hover:opacity-90 transition-opacity"
                    unoptimized={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile carousel */}
        <div className="lg:hidden relative mt-4 sm:mt-8">
          {images.length > 0 && (
            <div className="relative h-[250px] sm:h-[350px] w-full">
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
                <Icon icon="mdi:chevron-left" width={20} height={20} />
              </button>

              <button
                onClick={goToNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                aria-label="Next image"
              >
                <Icon icon="mdi:chevron-right" width={20} height={20} />
              </button>

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1}/{images.length}
              </div>

              {/* View all images button */}
              <button
                onClick={() => {
                  setPreviewImageIndex(currentImageIndex);
                  setIsImagePreviewOpen(true);
                }}
                className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm hover:bg-black/70"
              >
                Xem tất cả
              </button>
            </div>
          )}
        </div>

        {/* Vehicle title and rating */}
        <div className="mt-6 sm:mt-10">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-semibold text-dark dark:text-white">
              {vehicle?.thumb}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <Icon
                icon="solar:star-linear"
                width={20}
                height={20}
                className="text-primary"
              />
              <p className="text-base sm:text-lg text-dark dark:text-white">
                {vehicle?.rating}
              </p>
              <Icon
                icon="ph:map-pin"
                width={20}
                height={20}
                className="text-dark/50 dark:text-white/50"
              />
              <p className="text-dark/50 dark:text-white/50 text-base sm:text-lg">
                {vehicle?.address}
              </p>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 mt-8 sm:mt-12">
          {/* Left column - Vehicle details */}
          <div className="lg:col-span-8">
            {/* Booking widget - Mobile (moved to top) */}
            {vehicle?.status === "AVAILABLE" ? (
              <div className="lg:hidden bg-primary/10 p-4 sm:p-6 rounded-2xl mb-6">
                {/* Date picker */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold uppercase text-gray-700 dark:text-gray-200 mb-4">
                    Thời gian thuê
                  </h3>

                  <div className="w-full">
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
                      allowClear={true}
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
                      </div>
                    )}
                  </div>
                </div>

                {/* Price details */}
                <div className="mt-6">
                  <h3 className="text-base sm:text-lg font-bold uppercase text-gray-700 dark:text-gray-200 mb-4">
                    Chi tiết giá
                  </h3>
                  <div className="space-y-3 text-gray-700 dark:text-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base">
                        {rentalCalculation?.isHourlyRate
                          ? "Giá theo giờ"
                          : "Giá theo ngày"}
                      </span>
                      <span className="text-sm sm:text-base font-medium">
                        {rentalCalculation?.isHourlyRate
                          ? `${hourlyRate.toLocaleString()}₫/giờ`
                          : `${formatCurrency(unitPrice)}/ngày`}
                      </span>
                    </div>
                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base">
                        Thời gian thuê
                      </span>
                      <span className="text-sm sm:text-base font-medium">
                        {rentalCalculation
                          ? formatRentalDuration(rentalCalculation)
                          : `${rentalDurationDays} ngày`}
                      </span>
                    </div>
                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base">
                        {rentalCalculation?.isHourlyRate
                          ? "Giá theo thời gian"
                          : "Giá cơ bản"}
                      </span>
                      <span className="text-sm sm:text-base font-medium">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>

                    {/* Hiển thị breakdown cho hourly rate */}
                    {rentalCalculation?.isHourlyRate && (
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-4 space-y-1">
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
                              (rentalCalculation.billingMinutes / 60) *
                                hourlyRate
                            ).toLocaleString()}
                            ₫
                          </div>
                        )}
                      </div>
                    )}

                    <hr className="border-gray-200 dark:border-gray-700" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg sm:text-xl font-bold">Tổng</span>
                      <span className="text-lg sm:text-xl font-bold text-primary">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Book button */}
                <div className="space-y-3 mt-6">
                  <button
                    className={`w-full text-base sm:text-lg py-3 rounded-lg font-semibold ${
                      bufferConflictMessage || validationMessage
                        ? "bg-gray-400 cursor-not-allowed text-gray-600"
                        : "bg-teal-500 hover:bg-teal-600 text-white"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("Book button clicked");

                      if (bufferConflictMessage || validationMessage) {
                        message.warning(
                          "Vui lòng chọn thời gian khác để tiếp tục"
                        );
                        return;
                      }

                      handleRent();
                    }}
                    disabled={!!(bufferConflictMessage || validationMessage)}
                    type="button"
                  >
                    Đặt xe
                  </button>
                </div>

                {/* Multi-booking button for mobile */}
                {availableQuantity > 1 &&
                  vehicle?.vehicleType &&
                  vehicle.vehicleType.toUpperCase() !== "CAR" && (
                    <div className="mt-4">
                      <button
                        className="w-full text-base sm:text-lg py-3 rounded-lg font-semibold bg-primary text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 flex items-center justify-center gap-2"
                        onClick={async () => {
                          setShowMultiBooking(true);
                          try {
                            const thumb = vehicle?.thumb;
                            const providerId = vehicle?.userId;
                            const from = pickupDateTime
                              ? format(
                                  parseISO(pickupDateTime.replace(" ", "T")),
                                  "yyyy-MM-dd'T'HH:mm:ss"
                                )
                              : "";
                            const to = returnDateTime
                              ? format(
                                  parseISO(returnDateTime.replace(" ", "T")),
                                  "yyyy-MM-dd'T'HH:mm:ss"
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
                        <span>Đặt nhiều xe</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 sm:px-3 py-1 text-sm sm:text-base font-bold text-primary ring-1 ring-inset ring-blue-200">
                          {availableQuantity}
                        </span>
                      </button>
                    </div>
                  )}
              </div>
            ) : (
              // Hiển thị thông báo xe không khả dụng cho mobile
              <div className="lg:hidden bg-gray-100 p-4 sm:p-6 rounded-2xl mb-6">
                <div className="text-center">
                  <Icon
                    icon="mdi:car-off"
                    className="mx-auto mb-3 text-gray-400"
                    width={48}
                    height={48}
                  />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Xe không khả dụng
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Xe này hiện không thể đặt. Vui lòng chọn xe khác hoặc liên
                    hệ chủ xe để biết thêm thông tin.
                  </p>
                </div>
              </div>
            )}

            {/* Vehicle features - Chỉ hiển thị khi không phải xe đạp */}
            {vehicle?.vehicleType !== "BICYCLE" && (
              <div className="py-6 sm:py-10 my-6 sm:my-10 border-t border-dark/10 dark:border-white/20 flex flex-col gap-6 sm:gap-10">
                <h3 className="text-2xl sm:text-3xl font-semibold">Đặc điểm</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 sm:flex sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon={"mdi:car-shift-pattern"}
                      width={20}
                      height={20}
                    />
                    <p className="text-base sm:text-xl font-normal text-black dark:text-white">
                      {vehicle?.transmission
                        ? translateENtoVI(vehicle.transmission)
                        : ""}
                    </p>
                  </div>
                  {vehicle?.numberSeat && (
                    <div className="flex items-center gap-2">
                      <Icon icon={"mdi:car-seat"} width={20} height={20} />
                      <p className="text-base sm:text-xl font-normal text-black dark:text-white">
                        {vehicle.numberSeat} Ghế ngồi
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon icon={"mdi:fuel"} width={20} height={20} />
                    <p className="text-base sm:text-xl font-normal text-black dark:text-white">
                      {vehicle?.fuelType
                        ? translateENtoVI(vehicle.fuelType)
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle description */}
            <div className="py-6 sm:py-10 my-6 sm:my-10 border-t border-dark/10 dark:border-white/20 flex flex-col gap-6 sm:gap-10">
              <h3 className="text-2xl sm:text-3xl font-semibold">Mô tả</h3>
              <div
                className="text-dark dark:text-white text-base sm:text-lg leading-relaxed"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {vehicle?.description}
              </div>
            </div>

            {/* Additional amenities */}
            <div className="py-6 sm:py-10 mt-6 sm:mt-10 border-t border-dark/5 dark:border-white/15">
              <h3 className="text-xl sm:text-2xl font-medium">
                Các tiện nghi khác
              </h3>

              {features && features.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mt-6 sm:mt-8 gap-4 sm:gap-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <p className="text-base sm:text-lg dark:text-white text-dark">
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
            <div className="py-6 sm:py-10 mt-6 sm:mt-10 border-t border-gray-200 dark:border-white/15">
              <div className="mt-6 sm:mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-medium">
                    Giấy tờ thuê xe
                  </h2>
                  <Button
                    type="link"
                    onClick={() => setDocumentsModalVisible(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Xem chi tiết
                  </Button>
                </div>

                <div className="bg-blue-50 border-transparent rounded-md p-4 border-solid border-l-4 border-l-blue-600 mt-4">
                  <h4 className="flex items-center gap-2 text-gray-800 m-0 font-medium text-lg sm:text-xl">
                    <InfoCircleOutlined className="text-blue-600" />
                    <span>Yêu cầu giấy tờ thuê xe</span>
                  </h4>
                  <div className="mt-4 text-sm sm:text-base text-gray-700">
                    <p className="mb-3">
                      <strong>Bắt buộc mang theo BẢN GỐC:</strong>
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircleOutlined className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Bằng lái xe (chủ xe đối chiếu & trả lại)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircleOutlined className="text-green-600 mt-1 flex-shrink-0" />
                        <span>
                          CCCD gắn chip HOẶC Passport (chủ xe giữ lại & trả khi
                          hoàn xe)
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-amber-700 bg-amber-50 p-2 rounded text-sm">
                      <ExclamationCircleOutlined className="mr-1" />
                      Thiếu giấy tờ sẽ không thể nhận xe
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="mt-6 sm:mt-10">
              <h2 className="font-medium text-xl sm:text-2xl">
                Quy định thuê xe của RFT
              </h2>
              <ul className="mt-4 text-base sm:text-lg space-y-2">
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
            <div className="mt-6 sm:mt-10">
              <h2 className="font-medium text-xl sm:text-2xl">
                Chính sách thuê xe
              </h2>
              <div className="mt-4 text-base sm:text-lg">
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
                  <div className="mt-2 text-sm sm:text-base">
                    <b>Chính sách hủy:</b> {vehicle.penalty.description}
                  </div>
                )}
              </div>
            </div>
            {user && (user.role === "USER" || user.role === "PROVIDER") && (
              <div className="lg:hidden mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Thông tin xe không chính xác?
                  </span>
                  <ReportButton
                    targetId={vehicle.id}
                    reportType="MISLEADING_LISTING"
                    buttonText="Báo cáo"
                    size="small"
                    type="text"
                  />
                </div>
              </div>
            )}

            {/* User reviews */}
            <div className="py-6 sm:py-10 my-6 sm:my-10 border-y border-dark/10 dark:border-white/20">
              <h3 className="text-xl sm:text-2xl font-medium mb-6">
                Đánh giá từ người dùng
              </h3>

              <div className="mt-6 sm:mt-8">
                {vehicleComments.length > 0 ? (
                  <>
                    <div className="space-y-4 sm:space-y-6">
                      {getPaginatedComments(
                        vehicleComments,
                        currentCommentPage,
                        commentsPerPage
                      ).map((comment, index) => (
                        <div
                          key={comment.userId}
                          className="flex items-start gap-3 sm:gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm"
                        >
                          {comment.userImage && (
                            <div className="flex-shrink-0">
                              <Image
                                src={comment.userImage}
                                alt={`${comment.userName}'s avatar`}
                                width={40}
                                height={40}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">
                                  {comment.userName}
                                </h4>
                                <div className="flex items-center gap-1">
                                  {/* Rating stars */}
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
                                      width={16}
                                      height={16}
                                    />
                                  ))}

                                  {/* Report button - ngay cạnh rating */}
                                  {user &&
                                    (user.role === "USER" ||
                                      user.role === "PROVIDER") && (
                                      <ReportButton
                                        targetId={comment.userId}
                                        reportTypes={["SPAM", "INAPPROPRIATE"]}
                                        showTypeSelector={true}
                                        buttonText=""
                                        size="small"
                                        type="text"
                                        icon={true}
                                      />
                                    )}
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-200 mt-1 text-sm sm:text-base">
                              {comment.comment}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination controls - giữ nguyên */}
                    {vehicleComments.length > commentsPerPage && (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                        <button
                          onClick={goToPrevCommentPage}
                          disabled={currentCommentPage === 1}
                          className={`w-full sm:w-auto px-4 py-2 rounded-md ${
                            currentCommentPage === 1
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                        >
                          Trang trước
                        </button>

                        <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          Trang {currentCommentPage} /{" "}
                          {Math.ceil(vehicleComments.length / commentsPerPage)}
                        </span>

                        <button
                          onClick={goToNextCommentPage}
                          disabled={
                            currentCommentPage >=
                            Math.ceil(vehicleComments.length / commentsPerPage)
                          }
                          className={`w-full sm:w-auto px-4 py-2 rounded-md ${
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
            {/* Bảng phụ phí phát sinh - Mobile */}
            {vehicle?.vehicleType === "CAR" && vehicle?.extraFeeRule && (
              <div className="lg:hidden mt-6 bg-white rounded-xl shadow p-4 sm:p-6 border border-gray-200">
                <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-700">
                  Phụ phí có thể phát sinh
                </h3>
                <ul className="space-y-4">
                  <li>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 text-sm sm:text-base">
                        Phí vượt giới hạn
                      </span>
                      <span className="text-primary font-bold text-sm sm:text-base">
                        {vehicle?.extraFeeRule?.feePerExtraKm?.toLocaleString() ||
                          "-"}
                        đ/km
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs sm:text-sm mt-1">
                      Phụ phí phát sinh nếu lộ trình di chuyển vượt quá{" "}
                      {vehicle?.extraFeeRule?.maxKmPerDay?.toLocaleString() ||
                        "-"}
                      km khi thuê xe 1 ngày
                    </div>
                  </li>
                  <li>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 text-sm sm:text-base">
                        Phí quá giờ
                      </span>
                      <span className="text-primary font-bold text-sm sm:text-base">
                        {vehicle?.extraFeeRule?.feePerExtraHour?.toLocaleString() ||
                          "-"}
                        đ/giờ
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs sm:text-sm mt-1">
                      Phụ phí phát sinh nếu hoàn trả xe trễ hơn{" "}
                      {vehicle?.extraFeeRule?.allowedHourLate?.toLocaleString() ||
                        "-"}{" "}
                      giờ. Trường hợp trễ quá số giờ này, phụ phí thêm 1 ngày
                      thuê
                    </div>
                  </li>
                  <li>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 text-sm sm:text-base">
                        Phí vệ sinh
                      </span>
                      <span className="text-primary font-bold text-sm sm:text-base">
                        {vehicle?.extraFeeRule?.cleaningFee?.toLocaleString() ||
                          "-"}
                        đ
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs sm:text-sm mt-1">
                      Phụ phí phát sinh khi xe hoàn trả không đảm bảo vệ sinh
                      (như vết bẩn, bụi, cát, sình lầy...)
                    </div>
                  </li>
                  <li>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 text-sm sm:text-base">
                        Phí khử mùi
                      </span>
                      <span className="text-primary font-bold text-sm sm:text-base">
                        {vehicle?.extraFeeRule?.smellRemovalFee?.toLocaleString() ||
                          "-"}
                        đ
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs sm:text-sm mt-1">
                      Phụ phí phát sinh khi xe hoàn trả bị ám mùi khó chịu (mùi
                      thuốc lá, thực phẩm nặng mùi...)
                    </div>
                  </li>

                  {/* Thêm phí sạc pin cho xe điện */}
                  {vehicle?.fuelType === "ELECTRIC" &&
                    vehicle?.extraFeeRule?.apply_batteryChargeFee && (
                      <li>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800 text-sm sm:text-base">
                            Phí sạc pin
                          </span>
                          <span className="text-primary font-bold text-sm sm:text-base">
                            {vehicle?.extraFeeRule?.batteryChargeFeePerPercent?.toLocaleString() ||
                              "-"}
                            đ/%
                          </span>
                        </div>
                        <div className="text-gray-600 text-xs sm:text-sm mt-1">
                          Khách thuê thanh toán phí sạc pin theo thực tế sử
                          dụng. Phí tính theo % pin đã sử dụng
                        </div>
                      </li>
                    )}
                </ul>
              </div>
            )}
          </div>

          {/* Right column - Booking widget (Desktop only) */}
          <div className="hidden lg:block lg:col-span-4">
            {vehicle?.status === "AVAILABLE" ? (
              <div className="bg-primary/10 p-10 rounded-2xl relative z-10 overflow-hidden top-6">
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

                    {/* Hiển thị breakdown cho hourly rate */}
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
                              (rentalCalculation.billingMinutes / 60) *
                                hourlyRate
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
                  <button
                    className={`w-full text-lg py-3 rounded-lg font-semibold ${
                      bufferConflictMessage || validationMessage
                        ? "bg-gray-400 cursor-not-allowed text-gray-600"
                        : "bg-teal-500 hover:bg-teal-600 text-white"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("Book button clicked");

                      if (bufferConflictMessage || validationMessage) {
                        message.warning(
                          "Vui lòng chọn thời gian khác để tiếp tục"
                        );
                        return;
                      }

                      handleRent();
                    }}
                    disabled={!!(bufferConflictMessage || validationMessage)}
                    type="button"
                  >
                    Đặt xe
                  </button>
                </div>

                {/* Multi-booking button */}
                {availableQuantity > 1 &&
                  vehicle?.vehicleType &&
                  vehicle.vehicleType.toUpperCase() !== "CAR" && (
                    <div className="mt-4">
                      <button
                        className="w-full text-lg py-3 rounded-lg font-semibold bg-primary text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 flex items-center justify-center gap-2"
                        onClick={async () => {
                          setShowMultiBooking(true);
                          try {
                            const thumb = vehicle?.thumb;
                            const providerId = vehicle?.userId;
                            const from = pickupDateTime
                              ? format(
                                  parseISO(pickupDateTime.replace(" ", "T")),
                                  "yyyy-MM-dd'T'HH:mm:ss"
                                )
                              : "";
                            const to = returnDateTime
                              ? format(
                                  parseISO(returnDateTime.replace(" ", "T")),
                                  "yyyy-MM-dd'T'HH:mm:ss"
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
                        <span>Đặt nhiều xe</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-base font-bold text-primary ring-1 ring-inset ring-blue-200">
                          {availableQuantity}
                        </span>
                      </button>
                    </div>
                  )}
              </div>
            ) : (
              // Hiển thị thông báo xe không khả dụng
              <div className="bg-gray-100 p-10 rounded-2xl relative z-10 overflow-hidden top-6">
                <div className="text-center">
                  <Icon
                    icon="mdi:car-off"
                    className="mx-auto mb-4 text-gray-400"
                    width={64}
                    height={64}
                  />
                  <h3 className="text-xl font-bold text-gray-700 mb-3">
                    Xe không khả dụng
                  </h3>
                  <p className="text-gray-600">
                    Xe này hiện không thể đặt. Vui lòng chọn xe khác hoặc liên
                    hệ chủ xe để biết thêm thông tin.
                  </p>
                </div>
              </div>
            )}

            {/* Bảng phụ phí phát sinh - Desktop */}
            {vehicle?.vehicleType === "CAR" && vehicle?.extraFeeRule && (
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
                      (như vết bẩn, bụi, cát, sình lầy...)
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

                  {/* Thêm phí sạc pin cho xe điện */}
                  {vehicle?.fuelType === "ELECTRIC" &&
                    vehicle?.extraFeeRule?.apply_batteryChargeFee && (
                      <li>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">
                            Phí sạc pin
                          </span>
                          <span className="text-primary font-bold">
                            {vehicle?.extraFeeRule?.batteryChargeFeePerPercent?.toLocaleString() ||
                              "-"}
                            đ/%
                          </span>
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          Khách thuê thanh toán phí sạc pin theo thực tế sử
                          dụng. Phí tính theo % pin đã sử dụng
                        </div>
                      </li>
                    )}
                </ul>
              </div>
            )}
            {/* Nút báo cáo thông tin sai lệch */}
            {user && (user.role === "USER" || user.role === "PROVIDER") && (
              <div className="mt-6 pt-4  border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Thông tin xe không chính xác?
                  </span>
                  <ReportButton
                    targetId={vehicle.id}
                    reportType="MISLEADING_LISTING"
                    buttonText="Báo cáo"
                    size="small"
                    type="text"
                  />
                </div>
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
            <li>Xe ô tô: Bằng lái loại B</li>
          </ul>
        </div>
        <Link href="/profile">
          <AntButton type="primary" className="mt-2">
            Cập nhật thông tin
          </AntButton>
        </Link>
      </Modal>

      {/* Multi-vehicle selection modal */}
      <Modal
        title="Chọn xe khả dụng"
        open={isMultiModalOpen}
        onCancel={() => setIsMultiModalOpen(false)}
        footer={null}
        width={700}
        className="vehicle-select-modal"
      >
        <div className="flex flex-col gap-4">
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
                      onChange={() => {}}
                      className="w-5 h-5 accent-blue-500"
                    />

                    <div className="relative w-16 sm:w-20 h-12 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
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
                            width={20}
                            height={20}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-gray-800 truncate">
                        {vehicleItem.thumb} - {vehicleItem.modelName} (
                        {vehicleItem.yearManufacture})
                      </h4>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                        {vehicleItem.vehicleType === "CAR" && (
                          <span>Biển số: {vehicleItem.licensePlate}</span>
                        )}
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

              <div className="border-t pt-4 mt-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 mb-4">
                  <span className="text-sm sm:text-base font-medium text-gray-700">
                    Đã chọn: {selectedVehicleIds.length} xe{" "}
                    {translateENtoVI(vehicle?.vehicleType || "")}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-blue-600">
                    Tổng:{" "}
                    {availableVehicles
                      .filter((v) => selectedVehicleIds.includes(v.id))
                      .reduce((sum, v) => sum + (v.costPerDay || 0), 0)
                      .toLocaleString("vi-VN")}
                    ₫/ngày
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
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

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-blue-600" />
            <span>Chi tiết yêu cầu giấy tờ thuê xe</span>
          </div>
        }
        open={documentsModalVisible}
        onCancel={() => setDocumentsModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setDocumentsModalVisible(false)}
          >
            Đã hiểu
          </Button>,
        ]}
        width={700}
        className="documents-modal"
      >
        <div className="py-4 space-y-6">
          {/* Trường hợp có CCCD gắn chip */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleOutlined className="text-green-600" />
              <h3 className="font-semibold text-gray-900 text-lg m-0">
                Bạn đã có CCCD gắn chip
              </h3>
            </div>

            <div className="space-y-3">
              <p className="text-gray-900 font-medium">
                Giấy tờ thuê xe bao gồm:
              </p>

              <div className="space-y-3 ml-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-900">Bằng lái xe</p>
                    <p className="text-sm text-gray-600">
                      Chủ xe đối chiếu bản gốc với thông tin BLX đã xác thực
                      trên web RTF & trả lại bạn
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-900">CCCD gắn chip</p>
                    <p className="text-sm text-gray-600">
                      Chủ xe đối chiếu bản gốc với thông tin cá nhân trên VNeID,
                      giữ lại và hoàn trả khi bạn trả xe
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trường hợp chưa có CCCD gắn chip */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <ExclamationCircleOutlined className="text-amber-600" />
              <h3 className="font-semibold text-gray-900 text-lg m-0">
                Bạn chưa có CCCD gắn chip
              </h3>
            </div>

            <div className="space-y-3">
              <p className="text-gray-900 font-medium">
                Giấy tờ thuê xe bao gồm:
              </p>

              <div className="space-y-3 ml-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-900">Bằng lái xe</p>
                    <p className="text-sm text-gray-600">
                      Chủ xe đối chiếu bản gốc với thông tin BLX đã xác thực
                      trên web RTF & trả lại bạn
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-900">Passport</p>
                    <p className="text-sm text-gray-600">
                      Chủ xe kiểm tra bản gốc, giữ lại và hoàn trả khi bạn trả
                      xe
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lưu ý quan trọng - giữ nguyên màu */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationCircleOutlined className="text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800 mb-2">
                  Lưu ý quan trọng:
                </h4>
                <ul className="space-y-1 text-sm text-red-700">
                  <li>
                    • Khách thuê vui lòng chuẩn bị đầy đủ{" "}
                    <strong>BẢN GỐC</strong> tất cả giấy tờ thuê xe
                  </li>
                  <li>• Giấy tờ phải còn hiệu lực và thông tin rõ ràng</li>
                  <li>• Thiếu hoặc không đúng giấy tờ sẽ không thể nhận xe</li>
                  <li>
                    • Thông tin trên giấy tờ phải khớp với thông tin đặt xe
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quy trình nhận xe */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <ClockCircleOutlined className="text-blue-600" />
              <h4 className="font-semibold text-gray-900 m-0">
                Quy trình nhận xe:
              </h4>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  1
                </span>
                <span>Chủ xe kiểm tra và đối chiếu giấy tờ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  2
                </span>
                <span>Bằng lái xe được trả lại ngay</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  3
                </span>
                <span>CCCD/Passport được giữ lại đến khi trả xe</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  4
                </span>
                <span>Kiểm tra xe và bàn giao</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        title={`Hình ảnh xe (${previewImageIndex + 1}/${Math.min(
          images.length,
          4
        )})`} // Hiển thị tối đa 4
        open={isImagePreviewOpen}
        onCancel={() => setIsImagePreviewOpen(false)}
        footer={null}
        width="90%"
        style={{ maxWidth: "1200px" }}
        centered
      >
        <div className="relative">
          {images.length > 0 && (
            <div className="relative h-[50vh] sm:h-[70vh] w-full">
              <Image
                src={images[previewImageIndex]?.imageUrl}
                alt={`Vehicle image ${previewImageIndex + 1}`}
                fill
                className="object-contain"
                unoptimized={true}
              />

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setPreviewImageIndex(
                        previewImageIndex === 0
                          ? images.length - 1
                          : previewImageIndex - 1
                      )
                    }
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full z-10"
                  >
                    <Icon icon="mdi:chevron-left" width={20} height={20} />
                  </button>

                  <button
                    onClick={() =>
                      setPreviewImageIndex(
                        previewImageIndex === images.length - 1
                          ? 0
                          : previewImageIndex + 1
                      )
                    }
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full z-10"
                  >
                    <Icon icon="mdi:chevron-right" width={20} height={20} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Thumbnail navigation */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((image: VehicleImage, index: number) => (
                <div
                  key={index}
                  className={`flex-shrink-0 cursor-pointer border-2 rounded-lg overflow-hidden ${
                    index === previewImageIndex
                      ? "border-blue-500"
                      : "border-gray-200"
                  }`}
                  onClick={() => setPreviewImageIndex(index)}
                >
                  <Image
                    src={image.imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    width={60}
                    height={45}
                    className="sm:w-20 sm:h-15 object-cover hover:opacity-80 transition-opacity"
                    unoptimized={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}
