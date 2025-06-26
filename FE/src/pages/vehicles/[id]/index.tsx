"use client";

// --- Imports ---
// Hooks
import useLocalStorage from "@/hooks/useLocalStorage";
import React, { useState, useEffect, useMemo } from "react";
import { useDatesState } from "@/recoils/dates.state";
import { useUserState } from "@/recoils/user.state";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";

// API
import { getVehicleById, getBookedSlotById } from "@/apis/vehicle.api";

// Components
import { DateRangePicker } from "@/components/antd";
import { Icon } from "@iconify/react";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthPopup } from "@/components/AuthPopup";

// Types and Utils
import { VehicleFeature } from "@/types/vehicle";
import { Comment as VehicleComment } from "@/types/vehicle";
import { formatCurrency } from "@/lib/format-currency";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import moment from "moment";
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
  const [bookedTimeSlots, setBookedTimeSlots] = useState<any[]>([]);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [pickupDateTime, setPickupDateTime] = useState<string>("");
  const [returnDateTime, setReturnDateTime] = useState<string>("");
  const [rentalDurationDays, setRentalDurationDays] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Modal state
  // const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalCheckOpen, setIsModalCheckOpen] = useState(false);
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);

  // Comments pagination state
  const [currentCommentPage, setCurrentCommentPage] = useState<number>(1);
  const commentsPerPage = 5;

  // --- Dates handling ---
  const updateDates = (value: RangeValue) => {
    // Kiểm tra rõ ràng trước khi cập nhật
    if (value === null) {
      setDates(null as any);
    } else if (Array.isArray(value) && value.length === 2) {
      setDates(value as any);
    } else {
      // Xử lý trường hợp không hợp lệ
      setDates(null as any);
    }
  };

  // --- Modal handlers ---
  // const handleOk = () => {
  //   setIsModalOpen(false);
  // };

  // const handleCancel = () => {
  //   setIsModalOpen(false);
  // };

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
  }, [id]);
  // --- Effects ---
  // Calculate price based on selected dates
  useEffect(() => {
    if (pickupDateTime && returnDateTime && vehicle?.costPerDay) {
      const pickupDate = new Date(pickupDateTime);
      const returnDate = new Date(returnDateTime);

      // Validate dates
      if (returnDate <= pickupDate) {
        setRentalDurationDays(1);
        setTotalPrice(vehicle.costPerDay);
        return;
      }

      // Calculate rental duration (round up)
      const diffTime = Math.abs(returnDate.getTime() - pickupDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setRentalDurationDays(diffDays || 1);
      setTotalPrice((diffDays || 1) * vehicle.costPerDay);
    } else if (vehicle?.costPerDay) {
      // Default price if no dates selected
      setTotalPrice(vehicle.costPerDay);
    }
  }, [pickupDateTime, returnDateTime, vehicle?.costPerDay]);

  // Fetch booked time slots
  useEffect(() => {
    if (bookedTimeSlots.length > 0) {
      console.log("Booked time slots:", bookedTimeSlots);

      // Hiển thị cụ thể các ngày đã được đặt để debug
      const bookedRanges = bookedTimeSlots.map((slot) => {
        const startDate = dayjs(slot.timeFrom).format("YYYY-MM-DD");
        const endDate = dayjs(slot.timeTo).format("YYYY-MM-DD");
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
      } else {
        // Nếu có đủ điều kiện thì redirect đến trang booking
        router.push(`/booking/${vehicle?.id}`);
      }
    }
  }, [user, isAuthPopupOpen]);

  // Format dates for DateRangePicker
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
  const basePrice = unitPrice * rentalDurationDays;

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

  // Booking handlers
  // Booking handlers
  const handleRent = () => {
    if (!pickupDateTime || !returnDateTime) {
      message.error("Vui lòng chọn thời gian thuê xe!");
      return;
    }

    if (user === null) {
      // Thay vì mở modal cũ
      // setIsModalOpen(true);

      // Mở AuthPopup trực tiếp
      setIsAuthPopupOpen(true);
    } else if (user?.result?.driverLicenses === undefined) {
      setIsModalCheckOpen(true);
    } else {
      if (validationMessage === "Khoảng ngày đã được thuê.") {
        message.error("Khoảng ngày đã được thuê. Vui lòng chọn ngày khác!");
      } else {
        router.push(`/booking/${vehicle?.id}`);
      }
    }
  };

  // Date validation
  function isDateBooked(
    startDate: moment.Moment,
    endDate: moment.Moment
  ): boolean {
    for (const slot of bookedTimeSlots) {
      const bookedStart = moment(slot.timeFrom);
      const bookedEnd = moment(slot.timeTo);

      // Kiểm tra chồng chéo: nếu thời gian bắt đầu < thời gian kết thúc đã đặt
      // VÀ thời gian kết thúc > thời gian bắt đầu đã đặt
      const hasOverlap =
        startDate.isBefore(bookedEnd) && endDate.isAfter(bookedStart);

      if (hasOverlap) {
        console.log("Phát hiện chồng chéo:", {
          newBooking: [startDate.format(), endDate.format()],
          existingBooking: [bookedStart.format(), bookedEnd.format()],
        });
        return true;
      }
    }
    return false;
  }

  // DatePicker handlers
  const handleDateChange: RangePickerProps["onChange"] = (values) => {
    if (values && values[0] && values[1]) {
      const [startDate, endDate] = values;

      // Update pickup and return times
      setPickupDateTime(startDate.format("YYYY-MM-DDTHH:mm"));
      setReturnDateTime(endDate.format("YYYY-MM-DDTHH:mm"));

      // Vẫn giữ lại logic kiểm tra chồng chéo dự phòng
      const momentStartDate = moment.utc(startDate.valueOf());
      const momentEndDate = moment.utc(endDate.valueOf());

      if (isDateBooked(momentStartDate, momentEndDate)) {
        setValidationMessage("Khoảng ngày đã được thuê.");
      } else {
        setValidationMessage("");
      }
    } else {
      // Reset values if no dates selected
      setPickupDateTime("");
      setReturnDateTime("");
    }

    // Update Recoil state
    updateDates(values);
  };

  const disabledRangeTime: RangePickerProps["disabledTime"] = (
    current,
    type
  ) => {
    if (!current) return {};

    const currentDate = dayjs();
    const isToday = current.isSame(currentDate, "day");
    const currentHour = currentDate.hour();

    // Mặc định giờ không khả dụng (sáng sớm và tối muộn)
    const defaultDisabledHours = [
      0, 1, 2, 3, 4, 5, 6, 17, 18, 19, 20, 21, 22, 23,
    ];

    // Nếu là ngày hôm nay, thêm các giờ đã qua vào danh sách giờ bị disable
    if (isToday) {
      // Thời điểm hiện tại + 1 giờ (buffer time để có thời gian chuẩn bị)
      const disabledPastHours = Array.from(
        { length: currentHour + 1 },
        (_, i) => i
      );

      // Gộp với danh sách giờ mặc định bị disable
      const todayDisabledHours = [
        ...new Set([...defaultDisabledHours, ...disabledPastHours]),
      ];

      if (type === "start") {
        return {
          disabledHours: () => todayDisabledHours,
          disabledMinutes: (selectedHour) => {
            // Nếu giờ được chọn là giờ hiện tại, disable những phút đã qua
            if (selectedHour === currentHour + 1) {
              return Array.from({ length: currentDate.minute() }, (_, i) => i);
            }
            return [];
          },
        };
      }
    }

    // Kiểm tra giờ đã được đặt
    const bookedHoursForDate = bookedTimeSlots
      .filter((slot) => {
        const slotStart = dayjs(slot.timeFrom);
        const slotEnd = dayjs(slot.timeTo);
        return (
          current.isSame(slotStart, "day") || current.isSame(slotEnd, "day")
        );
      })
      .map((slot) => {
        const slotStart = dayjs(slot.timeFrom);
        const slotEnd = dayjs(slot.timeTo);

        if (current.isSame(slotStart, "day")) {
          // Nếu là ngày bắt đầu của slot, disable từ giờ bắt đầu trở đi
          return Array.from(
            { length: 24 - slotStart.hour() },
            (_, i) => slotStart.hour() + i
          );
        } else if (current.isSame(slotEnd, "day")) {
          // Nếu là ngày kết thúc của slot, disable từ đầu ngày đến giờ kết thúc
          return Array.from({ length: slotEnd.hour() + 1 }, (_, i) => i);
        }

        return [];
      })
      .flat();

    const disabledBookedHours = [
      ...new Set([...defaultDisabledHours, ...bookedHoursForDate]),
    ];

    return {
      disabledHours: () => disabledBookedHours,
    };
  };

  const disabledDate = (current: Dayjs | null): boolean => {
    if (!current) return false;

    const today = dayjs().startOf("day");
    // Chỉ disable các ngày trong quá khứ
    const isPastDate = current.isBefore(today);

    // Kiểm tra xem ngày có trong khoảng đã đặt không
    const isBookedDate = bookedTimeSlots.some((slot) => {
      const bookedStart = dayjs(slot.timeFrom).startOf("day");
      const bookedEnd = dayjs(slot.timeTo).startOf("day");

      // Nếu ngày hiện tại nằm trong khoảng từ ngày bắt đầu đến ngày kết thúc
      return (
        current.isSameOrAfter(bookedStart, "day") &&
        current.isSameOrBefore(bookedEnd, "day")
      );
    });

    // Trả về true để disable nếu là ngày quá khứ hoặc đã có đặt xe
    return isPastDate || isBookedDate;
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
                    {vehicle?.transmission}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon={"mdi:car-seat"} width={24} height={24} />
                  <p className="text-xl font-normal text-black dark:text-white">
                    {vehicle?.numberSeat} Ghế ngồi
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon={"mdi:fuel"} width={24} height={24} />
                  <p className="text-xl font-normal text-black dark:text-white">
                    {vehicle?.fuelType}
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
                        {feature.name}
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
                      <span>GPLX (đối chiếu) & Passport (giữ lại)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="mt-10">
              <h2 className="font-medium text-2xl">Điều khoản</h2>
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
              <h2 className="font-medium text-2xl">Chính sách hủy chuyến</h2>
              <div className="mt-4 text-lg">
                Miễn phí hủy chuyến trong vòng 1 giờ sau khi đặt cọc
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
                              <img
                                src={comment.userImage}
                                alt={`${comment.userName}'s avatar`}
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
                      minuteStep: 10,
                    }}
                    format="DD-MM-YYYY HH:mm"
                    disabledTime={disabledRangeTime}
                    disabledDate={disabledDate}
                    className="w-full"
                    onChange={handleDateChange}
                    value={formattedDates}
                  />
                  {validationMessage && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationMessage}
                    </p>
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
                    <span className="text-base">Đơn giá</span>
                    <span className="text-base font-medium">
                      {formatCurrency(unitPrice)}
                    </span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-base">Thời gian thuê</span>
                    <span className="text-base font-medium">
                      x{rentalDurationDays} ngày
                    </span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-base">Giá cơ bản</span>
                    <span className="text-base font-medium">
                      {formatCurrency(basePrice)}
                    </span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />

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
                <Button
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white text-lg py-3 rounded-lg font-semibold"
                  onClick={handleRent}
                >
                  Đặt xe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <Modal
        title="Bạn cần đăng nhập để thuê xe"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          setIsAuthPopupOpen(true); // Mở AuthPopup khi đóng modal này
        }}
        footer={false}
      >
        <div className="flex flex-col items-center gap-4">
          <p className="text-center">Vui lòng đăng nhập để tiếp tục thuê xe</p>
          <AntButton
            type="primary"
            className="mt-2"
            onClick={() => {
              setIsModalOpen(false); // Đóng modal hiện tại
              setIsAuthPopupOpen(true); // Mở AuthPopup
            }}
          >
            Đăng nhập ngay
          </AntButton>
        </div>
      </Modal> */}

      {/* Auth Popup */}
      <AuthPopup
        isOpen={isAuthPopupOpen}
        onClose={() => setIsAuthPopupOpen(false)}
        initialMode="login"
      />

      {/* Driver license verification modal */}
      <Modal
        title="Bạn cần xác thực giấy phái lái xe để thuê xe"
        open={isModalCheckOpen}
        onOk={handleOk1}
        onCancel={handleCancel1}
        footer={false}
      >
        <Link href="/profile ">
          <AntButton type="primary" className="mt-5">
            Trang cá nhân
          </AntButton>
        </Link>
      </Modal>
    </section>
  );
}
