"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

// Icons removed for cleaner UI
import {
  Button,
  Form,
  Input,
  Radio,
  DatePicker,
  message,
  Spin,
  Divider,
  Modal,
} from "antd";
import Image from "next/image";
import dayjs, { Dayjs } from "dayjs";
import { RangePickerProps } from "antd/es/date-picker";

import {
  calculateRentalDuration,
  calculateRentalPrice,
  formatRentalDuration,
  formatTimeForBackend,
  RentalCalculation,
  checkBufferTimeConflict,
  createDisabledTimeFunction,
  isDateDisabled,
  VehicleType,
  ExistingBooking,
  BUFFER_TIME_RULES,
} from "@/utils/booking.utils";

// Import component Coupon
import Coupon from "@/components/Coupon";
import { coupon as CouponType } from "@/types/coupon";

// Import API services
import { getVehicleById, getBookedSlotById } from "@/apis/vehicle.api";
import {
  createBooking,
  payWithWallet,
  createVNPayPayment,
  checkAvailability,
} from "@/apis/booking.api";
import { Vehicle } from "@/types/vehicle";
import { User } from "@/types/user";

import { useUserValue } from "@/recoils/user.state";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Interface cho booking response
interface BookingResponse {
  id: string;
  totalCost: number;
  status: string;
  paymentMethod?: string;
  paymentUrl?: string;
  message?: string;
}

interface CreateBookingResponse {
  success: boolean;
  data?: {
    id: string;
    vehicleId: string;
    totalCost: number;
    status: string;
    timeBookingStart: string;
    timeBookingEnd: string;
    couponId?: string;
    discountAmount?: number;
    message?: string;
  };
  error?: string;
  isConflict?: boolean;
  statusCode?: number;
}

interface PaymentResponse {
  success: boolean;
  data?: {
    bookingId: string;
    status?: string;
    paymentMethod: string;
    paymentStatus: string;
    paymentUrl?: string;
    message: string;
  };
  error?: string;
}

interface AvailabilityCheckResponse {
  success: boolean;
  data?: {
    available: boolean;
    message: string;
  };
  error?: string;
}

// Component chính
const BookingPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // State
  const [current, setCurrent] = useState<number>(0);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [costGetCar, setCostGetCar] = useState<number>(0);
  const [totalDays, setTotalDays] = useState<number>(3);
  const [form] = Form.useForm();
  const [amountDiscount, setAmountDiscount] = useState<number>(0);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponType | null>(null);
  const [bookingData, setBookingData] = useState<BookingResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("VNPAY");
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // NEW: Rental calculation states
  const [rentalCalculation, setRentalCalculation] =
    useState<RentalCalculation | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [selectedDates, setSelectedDates] = useState<[Dayjs, Dayjs] | null>(
    null
  );

  // NEW: Buffer time states
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>(
    []
  );
  const [rawBookingSlotsFromAPI, setRawBookingSlotsFromAPI] = useState<
    unknown[]
  >([]);
  const [bufferConflictMessage, setBufferConflictMessage] =
    useState<string>("");
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);

  const user = useUserValue() as User;

  // Reset coupon state when component first mounts (page reload)
  useEffect(() => {
    setAmountDiscount(0);
    setSelectedCoupon(null);
  }, []);

  // Tính hourly rate từ daily rate (daily rate / 12 giờ)
  useEffect(() => {
    if (vehicle?.costPerDay) {
      setHourlyRate(Math.round(vehicle.costPerDay / 12));
    }
  }, [vehicle?.costPerDay]);

  // Fetch vehicle data and handle query params
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const vehicleData = await getVehicleById(id);
        setVehicle(vehicleData);

        // TODO: Fetch existing bookings for this vehicle
        const bookings = await getBookedSlotById(id);
        setExistingBookings(bookings);

        // Check for time parameters in URL
        const { pickupTime, returnTime } = router.query;
        console.log("URL query params:", { pickupTime, returnTime });

        if (pickupTime && returnTime) {
          const startDate = dayjs(pickupTime as string);
          const endDate = dayjs(returnTime as string);

          if (startDate.isValid() && endDate.isValid()) {
            setSelectedDates([startDate, endDate]);

            // Tính toán thời gian thuê
            const calculation = calculateRentalDuration(startDate, endDate);
            setRentalCalculation(calculation);
            setTotalDays(
              calculation.isHourlyRate ? 1 : calculation.billingDays
            );

            // Kiểm tra buffer time conflict nếu có vehicle type
            if (vehicleData?.vehicleType) {
              const vehicleType =
                vehicleData.vehicleType.toUpperCase() as VehicleType;
              const conflictCheck = checkBufferTimeConflict(
                vehicleType,
                startDate,
                endDate,
                // mockBookings
                bookings
              );

              if (conflictCheck.hasConflict) {
                setBufferConflictMessage(
                  conflictCheck.message || "Có xung đột thời gian"
                );
              } else {
                setBufferConflictMessage("");
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching vehicle details:", error);
        message.error("Không thể tải thông tin xe");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id, router.query]);

  // Reset coupon state when component mounts or when returning to step 0
  useEffect(() => {
    if (current === 0) {
      setAmountDiscount(0);
      setSelectedCoupon(null);
    }
  }, [current]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        // TODO: Implement API call to get wallet balance
        // const balance = await getWalletBalance();
        // setWalletBalance(balance);
        setWalletBalance(10000000); // Mock data
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
      }
    };

    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  // Tạo booking khi hoàn tất bước 2
  const handleCreateBooking = async () => {
    try {
      setSubmitting(true);
      const formValues = await form.validateFields();

      // Kiểm tra xem đã chọn thời gian chưa
      if (!selectedDates || !selectedDates[0] || !selectedDates[1]) {
        message.error("Vui lòng chọn thời gian thuê xe");
        setSubmitting(false);
        return;
      }

      // Kiểm tra buffer time conflict một lần nữa trước khi tạo booking
      if (vehicle?.vehicleType) {
        const vehicleType = vehicle.vehicleType.toUpperCase() as VehicleType;
        const conflictCheck = checkBufferTimeConflict(
          vehicleType,
          selectedDates[0],
          selectedDates[1],
          existingBookings
        );

        if (conflictCheck.hasConflict) {
          message.error(
            conflictCheck.message || "Có xung đột thời gian với booking khác"
          );
          setSubmitting(false);
          return;
        }
      }

      // Race condition protection với retries
      const maxRetries = 3;
      let retryCount = 0;

      const startTime = formatTimeForBackend(selectedDates[0]);
      const endTime = formatTimeForBackend(selectedDates[1]);

      while (retryCount < maxRetries) {
        try {
          // Double-check availability ngay trước khi tạo booking
          const lastMinuteCheck = (await checkAvailability(
            id as string,
            startTime,
            endTime
          )) as AvailabilityCheckResponse;

          if (!lastMinuteCheck.success || !lastMinuteCheck.data?.available) {
            throw new Error("CONFLICT: Xe vừa được đặt bởi người khác");
          }

          const bookingRequestData = {
            vehicleId: id,
            timeBookingStart: formatTimeForBackend(selectedDates[0]),
            timeBookingEnd: formatTimeForBackend(selectedDates[1]),
            fullname: formValues.fullname,
            phoneNumber: formValues.phone,
            address:
              costGetCar === 1
                ? formValues.address || ""
                : vehicle?.address || "Nhận tại văn phòng",
            pickupMethod: costGetCar === 0 ? "office" : "delivery",
            couponId: selectedCoupon?.id || null,

            // Penalty info từ vehicle
            penaltyType: vehicle?.penaltyType || "PERCENT",
            penaltyValue: vehicle?.penaltyValue || 10,
            minCancelHour: vehicle?.minCancelHour || 24,
          };

          console.log("Creating booking with data:", bookingRequestData);

          const response = (await createBooking(
            bookingRequestData
          )) as CreateBookingResponse;

          if (response.success && response.data) {
            setBookingData(response.data);
            message.success("Tạo đơn đặt xe thành công!");
            setCurrent(1);
            return; // Exit retry loop on success
          } else {
            // Check if it's a conflict error using the new isConflict flag
            if (response.isConflict || response.statusCode === 409) {
              throw new Error("CONFLICT: " + response.error);
            }
            message.error(response.error || "Có lỗi xảy ra khi tạo đơn đặt xe");
            return;
          }
        } catch (error: unknown) {
          retryCount++;

          // Handle conflict errors with retry
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorResponse = (
            error as {
              response?: { status?: number; data?: { message?: string } };
            }
          )?.response;

          const isConflictError =
            errorMessage?.includes("CONFLICT") ||
            errorResponse?.status === 409 ||
            errorMessage?.includes("đã được đặt") ||
            errorMessage?.includes("Xe đã được đặt trong khoảng thời gian này");

          if (isConflictError) {
            if (retryCount < maxRetries) {
              message.warning(
                `Xe vừa được đặt bởi người khác. Đang thử lại... (Lần ${retryCount}/${maxRetries})`,
                3
              );

              // Wait với exponential backoff (1s, 2s, 4s)
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1))
              );
              continue;
            } else {
              // Final failure after all retries
              message.destroy(); // Clear any previous messages
              message.error({
                content:
                  "❌ Xe đã được đặt bởi người khác! Vui lòng chọn thời gian khác.",
                duration: 5,
                style: { marginTop: "20vh" },
              });

              // Refresh existing bookings để user thấy slot mới bị chiếm
              try {
                const updatedBookings = await getBookedSlotById(id);
                setExistingBookings(updatedBookings);
                console.log(
                  "Updated bookings after conflict:",
                  updatedBookings
                );
              } catch (refreshError) {
                console.error("Error refreshing bookings:", refreshError);
              }

              setCurrent(0); // Back to time selection
              return;
            }
          } else {
            // Other errors
            console.error("Booking error:", error);
            message.error(
              errorResponse?.data?.message || "Có lỗi khi tạo booking"
            );
            return;
          }
        }
      }
    } finally {
      setSubmitting(false);
    }
  };
  // Xử lý thanh toán
  const handlePayment = async () => {
    try {
      setSubmitting(true);

      if (!bookingData) {
        message.error("Không tìm thấy thông tin đơn đặt xe");
        return;
      }

      if (paymentMethod === "WALLET") {
        // Kiểm tra số dư ví
        if (walletBalance < bookingData.totalCost) {
          message.error("Số dư ví không đủ để thanh toán");
          return;
        }

        // Thanh toán bằng ví
        const paymentResponse = (await payWithWallet(
          bookingData.id
        )) as PaymentResponse;

        if (paymentResponse.success) {
          message.success("Thanh toán ví thành công!");
          setCurrent(2); // Chuyển đến kết quả thành công
        } else {
          message.error(paymentResponse.error || "Lỗi thanh toán ví");
        }
      } else {
        // Tạo link thanh toán VNPay
        const paymentResponse = (await createVNPayPayment(
          bookingData.id
        )) as PaymentResponse;

        if (paymentResponse.success && paymentResponse.data?.paymentUrl) {
          message.info("Chuyển hướng đến VNPay...");
          // Redirect to VNPay
          window.location.href = paymentResponse.data.paymentUrl;
        } else {
          message.error(paymentResponse.error || "Lỗi tạo link thanh toán");
        }
      }
    } catch (error: unknown) {
      console.error("Lỗi khi thanh toán:", error);
      message.error("Lỗi trong quá trình thanh toán");
    } finally {
      setSubmitting(false);
    }
  };

  // NEW: Xử lý thay đổi thời gian
  const selectTimeSlots: RangePickerProps["onChange"] = (value) => {
    if (value && value[0] && value[1]) {
      const startDate = value[0] as Dayjs;
      const endDate = value[1] as Dayjs;

      // Lưu dates đã chọn
      setSelectedDates([startDate, endDate]);

      // Tính toán thời gian thuê mới
      const calculation = calculateRentalDuration(startDate, endDate);
      setRentalCalculation(calculation);

      // Legacy compatibility
      setTotalDays(calculation.isHourlyRate ? 1 : calculation.billingDays);

      // Kiểm tra buffer time conflict
      if (vehicle?.vehicleType) {
        const vehicleType = vehicle.vehicleType.toUpperCase() as VehicleType;
        const conflictCheck = checkBufferTimeConflict(
          vehicleType,
          startDate,
          endDate,
          existingBookings
        );

        if (conflictCheck.hasConflict) {
          setBufferConflictMessage(
            conflictCheck.message || "Có xung đột thời gian"
          );
          message.warning(
            conflictCheck.message || "Có xung đột thời gian với booking khác"
          );
        } else {
          setBufferConflictMessage("");
        }
      }

      console.log("Rental calculation:", calculation);
    }
  };

  // Xử lý coupon
  const handleApplyCoupon = (coupon: CouponType | null): void => {
    if (coupon) {
      setAmountDiscount(coupon.discount);
      setSelectedCoupon(coupon);
    } else {
      setAmountDiscount(0);
      setSelectedCoupon(null);
    }
  };

  // Tính toán giá tiền theo logic mới
  const costPerDay = vehicle?.costPerDay || 0;
  let subtotal = 0;

  if (rentalCalculation && hourlyRate > 0) {
    subtotal = calculateRentalPrice(rentalCalculation, hourlyRate, costPerDay);
  } else {
    subtotal = totalDays * costPerDay;
  }

  const deliveryFee = 0; // Miễn phí giao xe
  const discountAmount = (subtotal * amountDiscount) / 100;
  const totalAmount = subtotal + deliveryFee - discountAmount;

  // Update form when user data changes
  useEffect(() => {
    if (user && form) {
      form.setFieldsValue({
        fullname: user.fullName || "",
        phone: user.phone || "",
      });
    }
  }, [user, form]);

  // Prepare default date values
  const { pickupTime, returnTime } = router.query;
  const defaultStartDate: Dayjs = pickupTime
    ? dayjs(pickupTime as string)
    : dayjs().add(1, "day").hour(7).minute(0);
  const defaultEndDate: Dayjs = returnTime
    ? dayjs(returnTime as string)
    : dayjs().add(4, "day").hour(20).minute(0);

  // Tạo disabledTime và disabledDate functions sử dụng helper mới
  const disabledRangeTime = useMemo(() => {
    if (!vehicle?.vehicleType) {
      return createDisabledTimeFunction("CAR", []);
    }
    const vehicleType = vehicle.vehicleType.toUpperCase() as VehicleType;
    return createDisabledTimeFunction(vehicleType, existingBookings);
  }, [vehicle?.vehicleType, existingBookings]);

  const disabledDateFunction = useMemo(() => {
    return (current: Dayjs): boolean => {
      if (!current || !vehicle?.vehicleType) return false;

      const vehicleType = vehicle.vehicleType.toUpperCase() as VehicleType;
      return isDateDisabled(current, vehicleType, existingBookings);
    };
  }, [vehicle?.vehicleType, existingBookings]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải thông tin xe..." />
      </div>
    );
  }

  // Error state
  if (!vehicle) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-xl mb-4 text-red-500">Không thể tải thông tin xe</p>
        <Link href="/vehicles">
          <Button type="primary">Quay lại trang tìm kiếm xe</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Bước 1: Thông tin đặt xe */}
        {current === 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cột trái: Form thông tin */}
            <div className="lg:col-span-2 space-y-6">
              {/* Địa chỉ giao xe */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Địa chỉ giao xe
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      costGetCar === 0
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setCostGetCar(0)}
                  >
                    <div className="flex items-center mb-2">
                      <Radio checked={costGetCar === 0} />
                      <span className="ml-2 font-semibold text-gray-800 text-base">
                        Nhận tại văn phòng
                      </span>
                    </div>
                    <div className="text-gray-600 text-base">
                      {vehicle.address || "Thạch Hòa, Thạch Thất, Hà Nội"}
                    </div>
                    <div className="text-green-600 font-semibold text-base mt-1">
                      Miễn phí
                    </div>
                  </div>

                  {vehicle.shipToAddress && (
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        costGetCar === 1
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                      onClick={() => setCostGetCar(1)}
                    >
                      <div className="flex items-center mb-2">
                        <Radio checked={costGetCar === 1} />
                        <span className="ml-2 font-semibold text-gray-800 text-base">
                          Giao tận nơi
                        </span>
                      </div>
                      <div className="text-gray-600 text-base">
                        Giao xe đến địa chỉ của bạn
                      </div>
                      <div className="text-orange-500 font-semibold text-base mt-1">
                        Miễn phí
                      </div>
                    </div>
                  )}
                </div>

                {costGetCar === 1 && (
                  <div className="mt-4">
                    <Form form={form} layout="vertical">
                      <Form.Item
                        name="address"
                        label={
                          <span className="text-base font-medium">
                            Nhập địa chỉ giao xe mà bạn mong muốn
                          </span>
                        }
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập địa chỉ giao xe",
                          },
                        ]}
                      >
                        <TextArea
                          rows={3}
                          placeholder="Nhập địa chỉ giao xe chi tiết (số nhà, tên đường, phường/xã, quận/huyện, thành phố)"
                          className="resize-none text-base"
                        />
                      </Form.Item>
                    </Form>
                  </div>
                )}
              </div>

              {/* Thông tin xe */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Thông tin xe thuê
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden">
                    <Image
                      src={
                        vehicle.vehicleImages?.length > 0
                          ? vehicle.vehicleImages[0].imageUrl
                          : "/images/demo1.png"
                      }
                      alt="Vehicle"
                      layout="fill"
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-xl text-gray-800">
                      {vehicle.thumb} - {vehicle.modelName} (
                      {vehicle.yearManufacture})
                    </h4>
                    <div className="flex flex-wrap gap-4 text-base text-gray-600">
                      <span>{vehicle.transmission}</span>
                      <span>{vehicle.numberSeat} chỗ</span>
                      <span>{vehicle.fuelType || "Xăng"}</span>
                    </div>
                    <div className="text-2xl font-bold text-red-500">
                      {vehicle.costPerDay.toLocaleString("vi-VN")}₫/ngày
                    </div>
                  </div>
                </div>

                {/* Chọn thời gian */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <RangePicker
                    showTime={{ format: "HH:mm", minuteStep: 30 }}
                    format="DD-MM-YYYY HH:mm"
                    onChange={selectTimeSlots}
                    disabledTime={disabledRangeTime}
                    disabledDate={disabledDateFunction}
                    size="large"
                    value={selectedDates || [defaultStartDate, defaultEndDate]}
                    className="w-full"
                    placeholder={["Thời gian nhận xe", "Thời gian trả xe"]}
                  />

                  {bufferConflictMessage && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <div>
                          <div className="text-red-600 text-base font-medium">
                            {bufferConflictMessage}
                          </div>
                          {vehicle?.vehicleType && (
                            <div className="text-gray-600 text-sm mt-1">
                              {
                                BUFFER_TIME_RULES[
                                  vehicle.vehicleType.toUpperCase() as VehicleType
                                ]?.description
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {rentalCalculation && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-blue-800 text-sm">
                        <div className="font-medium">
                          Thời gian thuê:{" "}
                          {formatRentalDuration(rentalCalculation)}
                        </div>
                        {rentalCalculation.isHourlyRate && (
                          <div className="mt-1 text-xs">
                            Tính theo giờ: {hourlyRate.toLocaleString("vi-VN")}
                            ₫/giờ
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cột phải: Thông tin người đặt, Voucher và Tóm tắt đơn hàng */}
            <div className="lg:col-span-1 space-y-6">
              {/* Thông tin người đặt */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Thông tin người thuê xe
                  </h3>
                </div>

                <Form form={form} layout="vertical" size="large">
                  {/* Họ và tên - Read only */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 font-medium text-sm">
                          {user?.fullName || "Chưa cập nhật"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Số điện thoại - Editable */}
                  <Form.Item
                    name="phone"
                    label={
                      <span className="text-base font-medium">
                        Số điện thoại
                      </span>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại",
                      },
                      {
                        pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
                        message: "Số điện thoại không hợp lệ",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Nhập số điện thoại liên hệ"
                      className="h-12 text-base"
                    />
                  </Form.Item>

                  {/* Hidden field for fullname validation */}
                  <Form.Item
                    name="fullname"
                    hidden
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng cập nhật họ tên trong hồ sơ",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Form>

                {!user?.fullName && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-yellow-700 text-sm">
                      <div className="font-medium">
                        Chưa có thông tin họ tên
                      </div>
                      <div className="text-xs mt-1">
                        Vui lòng cập nhật họ tên trong hồ sơ cá nhân trước khi
                        đặt xe.
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Mã giảm giá */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Mã giảm giá
                  </h3>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <Coupon applyCoupon={handleApplyCoupon} />
                </div>

                {selectedCoupon && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-green-700 text-sm">
                      Đã áp dụng mã &quot;{selectedCoupon.name}&quot; - Giảm{" "}
                      {amountDiscount}%
                    </div>
                  </div>
                )}
              </div>

              {/* Tóm tắt đơn hàng */}
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Tóm tắt đơn hàng
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">
                      {rentalCalculation?.isHourlyRate
                        ? `Thuê theo giờ (${formatRentalDuration(
                            rentalCalculation
                          )})`
                        : `Thuê xe (${totalDays} ngày)`}
                    </span>
                    <span className="font-semibold text-sm">
                      {subtotal.toLocaleString("vi-VN")}₫
                    </span>
                  </div>

                  {rentalCalculation?.isHourlyRate && (
                    <div className="ml-4 space-y-1 text-sm text-gray-500">
                      {rentalCalculation.billingHours > 0 && (
                        <div>
                          • {rentalCalculation.billingHours} giờ ×{" "}
                          {hourlyRate.toLocaleString("vi-VN")}₫
                        </div>
                      )}
                      {rentalCalculation.billingMinutes > 0 && (
                        <div>
                          • {rentalCalculation.billingMinutes} phút ×{" "}
                          {Math.round(hourlyRate / 60).toLocaleString("vi-VN")}₫
                        </div>
                      )}
                    </div>
                  )}

                  {deliveryFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-base">
                        Phí giao xe
                      </span>
                      <span className="font-semibold text-base">
                        {deliveryFee.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-base">
                        Giảm giá ({amountDiscount}%)
                      </span>
                      <span className="font-semibold text-base">
                        -{discountAmount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  )}

                  <Divider className="my-4" />

                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold text-gray-800">
                      Tổng cộng
                    </span>
                    <span className="font-bold text-red-500 text-xl">
                      {totalAmount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  className="mt-6 h-12 bg-red-500 hover:bg-red-600 border-red-500 font-semibold"
                  onClick={handleCreateBooking}
                  loading={submitting}
                  disabled={!!bufferConflictMessage}
                >
                  Đặt xe ngay
                </Button>

                {bufferConflictMessage && (
                  <div className="text-sm text-red-500 text-center mt-2">
                    Vui lòng chọn thời gian khác
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bước 2: Thanh toán */}
        {current === 1 && bookingData && (
          <div className="max-w-7xl mx-auto">
            {/* Thông báo tạo booking thành công */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
              <div className="text-center">
                <div className="font-semibold text-green-800 text-2xl mb-2">
                  Đặt xe thành công!
                </div>
                <div className="text-green-600 text-lg">
                  Mã đơn hàng:{" "}
                  <span className="font-mono font-bold">#{bookingData.id}</span>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              {/* Thông tin đơn hàng và phương thức thanh toán */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      Chọn phương thức thanh toán
                    </h3>
                    <p className="text-gray-600 text-lg">
                      Vui lòng chọn phương thức thanh toán phù hợp
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* VNPay */}
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === "VNPAY"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                      onClick={() => setPaymentMethod("VNPAY")}
                    >
                      <div className="flex items-center mb-2">
                        <Radio checked={paymentMethod === "VNPAY"} />
                        <span className="ml-2 font-semibold text-gray-800 text-base">
                          Thanh toán qua VNPay
                        </span>
                      </div>
                      <div className="text-gray-600 text-base">
                        Thanh toán bằng thẻ ATM, Internet Banking, Ví điện tử
                      </div>
                      <div className="text-gray-600 font-medium text-base mt-1">
                        An toàn & nhanh chóng
                      </div>
                    </div>

                    {/* Ví RFT */}
                    <div
                      className={`p-4 border-2 rounded-lg transition-all ${
                        walletBalance < bookingData.totalCost
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                          : paymentMethod === "WALLET"
                          ? "border-blue-500 bg-blue-50 cursor-pointer"
                          : "border-gray-200 hover:border-blue-300 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (walletBalance < bookingData.totalCost) {
                          setShowWalletModal(true);
                          return;
                        }
                        setPaymentMethod("WALLET");
                      }}
                    >
                      <div className="flex items-center mb-2">
                        <Radio
                          checked={paymentMethod === "WALLET"}
                          disabled={walletBalance < bookingData.totalCost}
                        />
                        <span className="ml-2 font-semibold text-gray-800 text-base">
                          Thanh toán qua ví RFT
                        </span>
                      </div>
                      <div className="text-gray-600 text-base">
                        Số dư hiện tại:
                        <span className="font-semibold ml-1 text-gray-800">
                          {walletBalance.toLocaleString("vi-VN")}₫
                        </span>
                      </div>
                      {walletBalance >= bookingData.totalCost ? (
                        <div className="text-gray-600 font-medium text-base mt-1">
                          Thanh toán nhanh chóng
                        </div>
                      ) : (
                        <div className="text-gray-500 font-medium text-base mt-1">
                          Số dư không đủ để thanh toán
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tóm tắt thanh toán */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg p-8 sticky top-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">
                    Chi tiết thanh toán
                  </h3>

                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-lg">
                        Mã đơn hàng:
                      </span>
                      <span className="font-mono text-lg font-semibold text-gray-800">
                        #{bookingData.id}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-lg">Trạng thái:</span>
                      <span className="text-orange-600 font-semibold text-lg bg-orange-100 px-3 py-1 rounded-lg">
                        {bookingData.status}
                      </span>
                    </div>

                    <Divider className="my-6" />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 text-lg">
                        Tổng thanh toán
                      </span>
                      <span className="font-bold text-gray-800 text-xl">
                        {bookingData.totalCost.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Button
                      type="primary"
                      size="large"
                      block
                      className="h-14 bg-red-500 hover:bg-red-600 border-red-500 font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={handlePayment}
                      loading={submitting}
                      disabled={
                        paymentMethod === "WALLET" &&
                        walletBalance < bookingData.totalCost
                      }
                    >
                      {paymentMethod === "WALLET"
                        ? "Thanh toán từ ví RFT"
                        : "Thanh toán qua VNPay"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal số dư ví không đủ */}
            <Modal
              title={
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">
                    Số dư ví không đủ
                  </div>
                </div>
              }
              open={showWalletModal}
              onCancel={() => setShowWalletModal(false)}
              footer={[
                <Button
                  key="cancel"
                  size="large"
                  onClick={() => setShowWalletModal(false)}
                  className="mr-2"
                >
                  Đóng
                </Button>,
              ]}
              className="text-center"
              width={500}
            >
              <div className="py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-500 text-2xl font-bold">!</span>
                </div>
                <div className="text-lg text-gray-700 mb-4">
                  Số dư ví RFT của bạn không đủ để thanh toán đơn hàng này.
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Số dư hiện tại:</span>
                    <span className="font-bold text-red-500 text-lg">
                      {walletBalance.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">
                      Số tiền cần thanh toán:
                    </span>
                    <span className="font-bold text-gray-800 text-lg">
                      {bookingData.totalCost.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Số tiền thiếu:</span>
                      <span className="font-bold text-red-600 text-lg">
                        {(bookingData.totalCost - walletBalance).toLocaleString(
                          "vi-VN"
                        )}
                        ₫
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-gray-600">
                  Vui lòng chọn phương thức thanh toán khác hoặc nạp thêm tiền
                  vào ví.
                </div>
              </div>
            </Modal>
          </div>
        )}

        {/* Bước 3: Hoàn thành */}
        {current === 2 && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-500 text-2xl font-bold">✓</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Thanh toán thành công!
                </h2>
                <p className="text-gray-600">
                  Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi
                </p>
              </div>

              {bookingData && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã đơn hàng:</span>
                      <span className="font-mono font-semibold">
                        #{bookingData.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Tổng tiền đã thanh toán:
                      </span>
                      <span className="font-bold text-green-600 text-lg">
                        {bookingData.totalCost.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className="text-green-600 font-semibold">
                        Đã thanh toán
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-blue-800 text-sm">
                    Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác
                    nhận và hướng dẫn giao nhận xe.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/profile/booking-history">
                  <Button
                    type="primary"
                    size="large"
                    className="bg-blue-500 hover:bg-blue-600 border-blue-500"
                  >
                    Xem đơn hàng của tôi
                  </Button>
                </Link>
                <Link href="/vehicles">
                  <Button size="large">Tiếp tục thuê xe</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
