"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import {
  CheckCircleOutlined,
  SolutionOutlined,
  PayCircleOutlined,
  SmileOutlined,
  LoadingOutlined,
  CreditCardOutlined,
  WalletOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Steps,
  Radio,
  Space,
  DatePicker,
  message,
  Spin,
  Card,
  Divider,
} from "antd";
import Image from "next/image";
import dayjs, { Dayjs } from "dayjs";
import { RangePickerProps } from "antd/es/date-picker";

import {
  calculateRentalDuration,
  calculateRentalPrice,
  formatRentalDuration,
  OPERATING_HOURS,
  RentalCalculation,
  checkBufferTimeConflict,
  getBlockedDates,
  getBlockedTimeRanges,
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
  const [validationMessage] = useState<string>("");
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
  const [bufferConflictMessage, setBufferConflictMessage] =
    useState<string>("");

  const user = useUserValue() as User;

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

        // Mock data for demonstration
        // const mockBookings: ExistingBooking[] = [
        //   {
        //     id: 1,
        //     startDate: dayjs().add(2, "day").hour(9).minute(0),
        //     endDate: dayjs().add(2, "day").hour(17).minute(0),
        //     status: "CONFIRMED",
        //   },
        //   {
        //     id: 2,
        //     startDate: dayjs().add(5, "day").hour(8).minute(0),
        //     endDate: dayjs().add(6, "day").hour(18).minute(0),
        //     status: "CONFIRMED",
        //   },
        // ];
        // setExistingBookings(mockBookings);

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

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        // TODO: Implement API call to get wallet balance
        // const balance = await getWalletBalance();
        // setWalletBalance(balance);
        setWalletBalance(1500000); // Mock data
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
      }
    };

    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  // Navigation functions
  const handleNext = (): void => {
    setCurrent(current + 1);
  };

  const handleBack = (): void => {
    setCurrent(current - 1);
  };

  // Tạo booking khi hoàn tất bước 2
  const handleCreateBooking = async () => {
    try {
      setSubmitting(true);
      const formValues = await form.validateFields();

      // Kiểm tra buffer time conflict một lần nữa trước khi tạo booking
      if (
        vehicle?.vehicleType &&
        formValues.date &&
        formValues.date[0] &&
        formValues.date[1]
      ) {
        const vehicleType = vehicle.vehicleType.toUpperCase() as VehicleType;
        const conflictCheck = checkBufferTimeConflict(
          vehicleType,
          formValues.date[0],
          formValues.date[1],
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

      const startTime = formValues.date[0].toISOString();
      const endTime = formValues.date[1].toISOString();

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
            startDate: formValues.date[0].format("YYYY-MM-DD HH:mm"),
            endDate: formValues.date[1].format("YYYY-MM-DD HH:mm"),
            fullname: formValues.fullname,
            phone: formValues.phone,
            address: formValues.address,
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
            setCurrent(2);
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
          setCurrent(3); // Chuyển đến kết quả thành công
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
      message.success(`Đã áp dụng mã giảm giá "${coupon.name}" thành công!`);
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

  const deliveryFee = costGetCar === 0 ? 0 : 50000;
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

  // NEW: disabledTime cho RangePicker - chỉ cho phép 7h-20h, bước nhảy 30 phút
  const disabledRangeTime: RangePickerProps["disabledTime"] = (current) => {
    const baseDisabled = {
      disabledHours: () => [
        // Disable 0-6h (trước 7h)
        ...Array.from({ length: OPERATING_HOURS.START }, (_, i) => i), // 0,1,2,3,4,5,6
        // Disable 21-23h (sau 20h)
        ...Array.from(
          { length: 24 - (OPERATING_HOURS.END + 1) },
          (_, i) => OPERATING_HOURS.END + 1 + i // 21,22,23
        ),
      ],
      disabledMinutes: () => {
        // Chỉ cho phép :00 và :30
        const allowedMinutes = [0, 30];
        return Array.from({ length: 60 }, (_, i) => i).filter(
          (minute) => !allowedMinutes.includes(minute)
        );
      },
    };

    // Thêm disabled time do buffer conflicts
    if (vehicle?.vehicleType && current) {
      const vehicleType = vehicle.vehicleType.toUpperCase() as VehicleType;
      const blockedRanges = getBlockedTimeRanges(
        vehicleType,
        current,
        existingBookings
      );

      if (blockedRanges.length > 0) {
        const blockedHours: number[] = [];
        const blockedMinutes: { [hour: number]: number[] } = {};

        for (const range of blockedRanges) {
          let currentTime = range.start;
          while (currentTime.isSameOrBefore(range.end)) {
            const hour = currentTime.hour();
            const minute = currentTime.minute();

            if (!blockedHours.includes(hour)) {
              blockedHours.push(hour);
            }

            if (!blockedMinutes[hour]) {
              blockedMinutes[hour] = [];
            }
            if (!blockedMinutes[hour].includes(minute)) {
              blockedMinutes[hour].push(minute);
            }

            currentTime = currentTime.add(30, "minute");
          }
        }

        return {
          disabledHours: () => [
            ...baseDisabled.disabledHours(),
            ...blockedHours,
          ],
          disabledMinutes: (selectedHour: number) => [
            ...baseDisabled.disabledMinutes(),
            ...(blockedMinutes[selectedHour] || []),
          ],
        };
      }
    }

    return baseDisabled;
  };

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
    <section className=" relative">
      <div className="mb-10 max-w-6xl mx-auto">
        {/* Steps header */}
        <div className="flex flex-col mt-10 items-center justify-center border rounded-sm shadow-md bg-slate-100 p-2 pb-4 sm:flex-row sm:px-5 lg:px-5 xl:px-12">
          <div className="flex w-full mt-4 py-2 text-xs sm:mt-0 sm:ml-auto sm:text-base">
            <Steps
              className="mt-5"
              current={current}
              items={[
                {
                  title: "Thông tin thuê xe",
                  icon: <SolutionOutlined />,
                },
                {
                  title: "Thông tin người đặt",
                  icon:
                    current === 1 && submitting ? (
                      <LoadingOutlined />
                    ) : (
                      <UserOutlined />
                    ),
                },
                {
                  title: "Phương thức thanh toán",
                  icon:
                    current === 2 && submitting ? (
                      <LoadingOutlined />
                    ) : (
                      <PayCircleOutlined />
                    ),
                },
                {
                  title: "Kết quả",
                  icon: <SmileOutlined />,
                },
              ]}
            />
          </div>
        </div>

        {/* Bước 1: Thông tin thuê xe */}
        {current === 0 && (
          <div className="grid sm:px- mt-3 lg:grid-cols-2 p-6 rounded-sm shadow-md bg-slate-100">
            <div className="px-10 pt-8">
              <p className="text-xl font-medium">Thông tin xe</p>
              <div className="mt-8 space-y-3 rounded-lg shadow-md border bg-white px-2 py-4 sm:px-6">
                <div className="flex flex-col rounded-lg bg-white sm:flex-row relative">
                  <div className="relative rounded-lg w-1/2 h-48">
                    <Image
                      alt="car"
                      src={
                        vehicle.vehicleImages &&
                        vehicle.vehicleImages.length > 0
                          ? vehicle.vehicleImages[0].imageUrl
                          : "/images/demo1.png"
                      }
                      layout="fill"
                      className="rounded-lg object-cover"
                      unoptimized={true}
                    />
                  </div>

                  <div className="flex w-full flex-col px-4 py-4">
                    <span className="font-semibold text-lg">
                      {vehicle.thumb} - {vehicle.modelName} (
                      {vehicle.yearManufacture})
                    </span>
                    <span className="float-right text-gray-400">
                      {vehicle.transmission} - {vehicle.numberSeat} chỗ
                    </span>
                    <p className="text-lg font-bold">
                      {vehicle.costPerDay.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                      /ngày
                    </p>
                    <p className="text-sm text-gray-500">
                      Giá theo giờ: {hourlyRate.toLocaleString("vi-VN")}₫/giờ
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-lg font-medium">Phương thức nhận xe</p>
              <form className="mt-5 mb-5 grid gap-6">
                <Radio.Group
                  onChange={(e) => setCostGetCar(e.target.value)}
                  value={costGetCar}
                >
                  <Space direction="vertical">
                    <Radio value={0}>
                      <div>
                        <div className="font-medium">Nhận tại văn phòng</div>
                        <div className="text-gray-500 text-sm">
                          {vehicle.address || "Thạch Hòa, Thạch Thất, Hà Nội"}
                        </div>
                        <div className="text-green-500 text-sm font-medium">
                          Miễn phí
                        </div>
                      </div>
                    </Radio>
                    {vehicle.shipToAddress && (
                      <Radio value={1}>
                        <div>
                          <div className="font-medium">Giao tận nơi</div>
                          <div className="text-gray-500 text-sm">
                            Giao xe đến địa chỉ của bạn
                          </div>
                          <div className="text-orange-500 text-sm font-medium">
                            +50,000₫
                          </div>
                        </div>
                      </Radio>
                    )}
                  </Space>
                </Radio.Group>
              </form>
            </div>

            <div className="mt-14 bg-gray-50 px-10 pt-4 lg:mt-5 rounded-md shadow-md">
              <p className="text-xl font-medium ">Chi tiết thuê xe</p>
              {/* <p className="text-gray-400">
                Thời gian thuê xe (7h-20h, bước nhảy 30 phút)
              </p>

              {vehicle?.vehicleType && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-700 text-sm font-medium">
                    📋 Quy định về thời gian thuê:
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    {
                      BUFFER_TIME_RULES[
                        vehicle.vehicleType.toUpperCase() as VehicleType
                      ]?.description
                    }
                  </p>
                </div>
              )} */}

              <Space direction="vertical" size={12}>
                <RangePicker
                  showTime={{
                    format: "HH:mm",
                    minuteStep: 30,
                  }}
                  format="DD-MM-YYYY HH:mm"
                  onChange={selectTimeSlots}
                  disabledTime={disabledRangeTime}
                  disabledDate={(current) => {
                    if (!vehicle?.vehicleType) return false;

                    const vehicleType =
                      vehicle.vehicleType.toUpperCase() as VehicleType;
                    const blockedDates = getBlockedDates(
                      vehicleType,
                      existingBookings
                    );
                    const currentDateStr = current.format("YYYY-MM-DD");

                    return blockedDates.includes(currentDateStr);
                  }}
                  size="large"
                  value={selectedDates || [defaultStartDate, defaultEndDate]}
                />
                {validationMessage && (
                  <p className="text-red-500">{validationMessage}</p>
                )}
                {bufferConflictMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
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
              </Space>

              {/* NEW: Hiển thị chi tiết thời gian thuê */}
              <div className="mt-4 space-y-2">
                <p className="text-gray-600">
                  Thời gian thuê:{" "}
                  <span className="font-medium">
                    {rentalCalculation
                      ? formatRentalDuration(rentalCalculation)
                      : `${totalDays} ngày`}
                  </span>
                </p>

                {rentalCalculation?.isHourlyRate ? (
                  <div className="space-y-1">
                    <p className="text-gray-600">
                      Giá theo giờ: {hourlyRate.toLocaleString("vi-VN")}₫/giờ
                    </p>
                    {rentalCalculation.billingHours > 0 && (
                      <p className="text-sm text-gray-500 ml-4">
                        • {rentalCalculation.billingHours} giờ ×{" "}
                        {hourlyRate.toLocaleString("vi-VN")}₫ ={" "}
                        {(
                          rentalCalculation.billingHours * hourlyRate
                        ).toLocaleString("vi-VN")}
                        ₫
                      </p>
                    )}
                    {rentalCalculation.billingMinutes > 0 && (
                      <p className="text-sm text-gray-500 ml-4">
                        • {rentalCalculation.billingMinutes} phút ×{" "}
                        {Math.round(hourlyRate / 60).toLocaleString("vi-VN")}₫ ={" "}
                        {Math.round(
                          (rentalCalculation.billingMinutes / 60) * hourlyRate
                        ).toLocaleString("vi-VN")}
                        ₫
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Giá thuê:{" "}
                    {vehicle.costPerDay.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}{" "}
                    × {totalDays} ngày
                  </p>
                )}

                {deliveryFee > 0 && (
                  <p className="text-gray-600">
                    Phí giao xe:{" "}
                    {deliveryFee.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </p>
                )}
              </div>

              {/* Mã giảm giá */}
              <div className="mt-4 mb-4">
                <p className="text-gray-600 font-medium">Mã giảm giá</p>
                <div className="border border-gray-200 rounded-md px-3 mt-2">
                  <Coupon applyCoupon={handleApplyCoupon} />
                </div>
                {amountDiscount > 0 && (
                  <p className="text-green-500 text-sm mt-1">
                    Giảm giá {amountDiscount}%: -
                    {discountAmount.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </p>
                )}
              </div>

              <Divider />
              <p className="text-lg font-bold">
                Tổng tiền:{" "}
                {totalAmount.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </p>

              <button
                onClick={handleNext}
                disabled={!!bufferConflictMessage}
                className={`mt-4 mb-2 w-full border-none rounded-md px-6 py-2 text-lg font-bold text-white cursor-pointer ${
                  bufferConflictMessage
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Bước 2: Thông tin người đặt */}
        {current === 1 && (
          <div className="mt-3 p-6 rounded-md shadow-md bg-slate-100">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Thông tin người đặt xe
              </h2>

              <Form
                form={form}
                layout="vertical"
                size="large"
                initialValues={{
                  fullname: user?.fullName || "",
                  phone: user?.phone || "",
                  date: selectedDates || [defaultStartDate, defaultEndDate],
                  address:
                    costGetCar === 0
                      ? vehicle.address || "Thạch Hòa, Thạch Thất, Hà Nội"
                      : "",
                }}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <Form.Item
                    name="fullname"
                    label="Họ và tên"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập họ và tên",
                      },
                    ]}
                  >
                    <Input readOnly className="bg-gray-100" />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại",
                      },
                      {
                        pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
                        message: "Vui lòng nhập số điện thoại hợp lệ",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </div>

                <Form.Item
                  name="address"
                  label={
                    costGetCar === 0 ? "Địa chỉ nhận xe" : "Địa chỉ giao xe"
                  }
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập địa chỉ",
                    },
                  ]}
                >
                  <TextArea
                    rows={3}
                    placeholder={
                      costGetCar === 0 ? "Địa chỉ nhận xe" : "Địa chỉ giao xe"
                    }
                  />
                </Form.Item>

                <Form.Item name="date" label="Thời gian thuê xe">
                  <RangePicker
                    showTime={{ format: "HH:mm" }}
                    format="DD-MM-YYYY HH:mm"
                    disabled
                    className="w-full"
                  />
                </Form.Item>

                {/* NEW: Tóm tắt đơn hàng với logic mới */}
                <Card className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Tóm tắt đơn hàng
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>
                        {rentalCalculation?.isHourlyRate ? (
                          <>
                            Thuê theo giờ (
                            {formatRentalDuration(rentalCalculation)}):
                          </>
                        ) : (
                          <>Thuê xe ({totalDays} ngày):</>
                        )}
                      </span>
                      <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                    </div>

                    {/* Hiển thị breakdown cho hourly rate */}
                    {rentalCalculation?.isHourlyRate && (
                      <div className="text-sm text-gray-500 ml-4 space-y-1">
                        {rentalCalculation.billingHours > 0 && (
                          <div>
                            • {rentalCalculation.billingHours} giờ ×{" "}
                            {hourlyRate.toLocaleString("vi-VN")}₫
                          </div>
                        )}
                        {rentalCalculation.billingMinutes > 0 && (
                          <div>
                            • {rentalCalculation.billingMinutes} phút ×{" "}
                            {Math.round(hourlyRate / 60).toLocaleString(
                              "vi-VN"
                            )}
                            ₫
                          </div>
                        )}
                      </div>
                    )}

                    {deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span>Phí giao xe:</span>
                        <span>{deliveryFee.toLocaleString("vi-VN")}₫</span>
                      </div>
                    )}

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá ({amountDiscount}%):</span>
                        <span>-{discountAmount.toLocaleString("vi-VN")}₫</span>
                      </div>
                    )}
                    <Divider className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng tiền:</span>
                      <span className="text-blue-600">
                        {totalAmount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-between mt-8">
                  <Button size="large" onClick={handleBack}>
                    Quay lại
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={submitting}
                    onClick={handleCreateBooking}
                  >
                    Đặt xe
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        )}

        {/* Bước 3: Chọn phương thức thanh toán */}
        {current === 2 && bookingData && (
          <div className="mt-3 p-6 rounded-md shadow-md bg-slate-100">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Chọn phương thức thanh toán
              </h2>

              <Card className="mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Thông tin đơn đặt xe
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Mã đơn hàng:</span>
                    <span className="font-mono">#{bookingData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trạng thái:</span>
                    <span className="text-orange-600 font-medium">
                      {bookingData.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Số tiền cần thanh toán:</span>
                    <span className="text-red-600">
                      {bookingData.totalCost.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>
              </Card>

              <div className="space-x-4 ">
                <h3 className="text-lg font-semibold">
                  Phương thức thanh toán
                </h3>
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full"
                >
                  <div className="space-y-3">
                    <Radio value="VNPAY" className="w-full">
                      <Card className="w-full h-15 cursor-pointer flex items-center ">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <CreditCardOutlined className="mr-3 text-blue-500 text-xl" />
                            <div className="flex flex-col justify-center h-12">
                              <div className="font-semibold">
                                Thanh toán qua VNPay
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Radio>

                    <Radio value="WALLET" className="w-full ">
                      <Card className="w-full h-15 cursor-pointer flex items-center ">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <WalletOutlined className="mr-3  text-xl" />
                            <div className="flex flex-col justify-center h-12">
                              <div className="font-semibold">
                                Thanh toán qua ví RFT
                              </div>
                              <div className="text-sm text-gray-500">
                                Số dư hiện tại:{" "}
                                <span
                                  className={`font-medium ${
                                    walletBalance >= bookingData.totalCost
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {walletBalance.toLocaleString("vi-VN")}₫
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Radio>
                  </div>
                </Radio.Group>

                {paymentMethod === "WALLET" &&
                  walletBalance < bookingData.totalCost && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-red-600 text-sm">
                        ⚠️ Số dư ví không đủ để thanh toán. Vui lòng nạp thêm
                        tiền hoặc chọn phương thức khác.
                      </p>
                    </div>
                  )}
              </div>

              <div className="flex justify-between mt-8">
                <Button size="large" onClick={handleBack}>
                  Quay lại
                </Button>
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  onClick={handlePayment}
                  disabled={
                    paymentMethod === "WALLET" &&
                    walletBalance < bookingData.totalCost
                  }
                >
                  {paymentMethod === "WALLET"
                    ? "Thanh toán"
                    : "Thanh toán qua VNPay"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bước 4: Kết quả */}
        {current === 3 && (
          <div className="flex justify-center items-start mt-5 text-gray-700">
            <div className="flex flex-col justify-center items-center mt-5 text-gray-700">
              <CheckCircleOutlined
                style={{ fontSize: "50px", color: "#22c12a" }}
              />
              <h1 className="text-3xl font-semibold my-6">
                Đặt xe thành công!
              </h1>
              {bookingData && (
                <div className="text-center mb-6">
                  <p className="mb-2">
                    Mã đơn hàng của bạn:{" "}
                    <span className="font-mono font-bold">
                      #{bookingData.id}
                    </span>
                  </p>
                  <p className="mb-2">
                    Tổng tiền:{" "}
                    <span className="font-bold text-green-600">
                      {bookingData.totalCost.toLocaleString("vi-VN")}₫
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn hàng.
                  </p>
                </div>
              )}
              <Space>
                <Link href="/profile/booking-history">
                  <Button type="primary" size="large">
                    Xem đơn của tôi
                  </Button>
                </Link>
                <Link href="/vehicles">
                  <Button size="large">Tiếp tục thuê xe</Button>
                </Link>
              </Space>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BookingPage;
