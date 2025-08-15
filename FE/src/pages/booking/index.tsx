"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { debounce } from "lodash";

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
  Checkbox,
  AutoComplete,
} from "antd";
import Image from "next/image";
import dayjs, { Dayjs } from "dayjs";
import { RangePickerProps } from "antd/es/date-picker";
import { translateENtoVI } from "@/lib/viDictionary";
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
  parseBackendTime,
} from "@/utils/booking.utils";

// Import component Coupon
import Coupon from "@/components/Coupon";
import { coupon as CouponType } from "@/types/userCoupon";

// Import API services
import {
  getVehicleById,
  getBookedSlotById,
  getAvailableThumbQuantity,
  getAvailableThumbList,
} from "@/apis/vehicle.api";
import {
  createBooking,
  payWithWallet,
  createVNPayPayment,
  checkAvailability,
} from "@/apis/booking.api";
import { getUserWallet } from "@/apis/wallet.api";

import { Vehicle } from "@/types/vehicle";
import { User } from "@/types/user";

import { useUserValue } from "@/recoils/user.state";
import { showError } from "@/utils/toast.utils";

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
  // Support both single and multiple vehicle booking via vehicleId param
  const { vehicleId, id } = router.query;
  // Parse vehicleIds: can be string or comma-separated list
  let vehicleIds: string[] = [];
  if (vehicleId) {
    if (typeof vehicleId === "string") {
      vehicleIds = vehicleId
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    } else if (Array.isArray(vehicleId)) {
      vehicleIds = vehicleId;
    }
  } else if (id) {
    if (typeof id === "string") {
      vehicleIds = [id];
    } else if (Array.isArray(id)) {
      vehicleIds = id;
    }
  }
  // Quantity is always inferred from vehicleIds.length
  const [selectedQuantity, setSelectedQuantity] = useState(
    vehicleIds.length || 1
  );
  // State
  const [current, setCurrent] = useState<number>(0);
  // For single booking, use first vehicleId; for multi, use array
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [multiVehicles, setMultiVehicles] = useState<Vehicle[]>([]);
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
  const [availableQuantity, setAvailableQuantity] = useState(1);
  const [withDriver, setWithDriver] = useState<boolean>(false);

  //  Rental calculation states
  const [rentalCalculation, setRentalCalculation] =
    useState<RentalCalculation | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [selectedDates, setSelectedDates] = useState<[Dayjs, Dayjs] | null>(
    null
  );

  //  Buffer time states
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>(
    []
  );
  const [rawBookingSlotsFromAPI, setRawBookingSlotsFromAPI] = useState<
    unknown[]
  >([]);
  const [bufferConflictMessage, setBufferConflictMessage] =
    useState<string>("");
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);

  const [isVehicleSelectModalOpen, setIsVehicleSelectModalOpen] =
    useState(false);
  const [availableVehicleList, setAvailableVehicleList] = useState<Vehicle[]>(
    []
  );
  const [newSelectedVehicleIds, setNewSelectedVehicleIds] = useState<string[]>(
    []
  );
  const [availableQuantityForReselect, setAvailableQuantityForReselect] =
    useState(1);

  const [vehicleAvailabilityStatus, setVehicleAvailabilityStatus] = useState<{
    [key: string]: boolean;
  }>({});

  // State cho tính khoảng cách
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] =
    useState<boolean>(false);
  const [distanceError, setDistanceError] = useState<string>("");
  const [addressSuggestions, setAddressSuggestions] = useState<
    Array<{
      value: string;
      label: string;
      position: { lat: number; lng: number };
    }>
  >([]);
  const [addressInputValue, setAddressInputValue] = useState<string>("");
  const deliveryRadius = vehicle?.deliveryRadius ?? 0;

  const user = useUserValue() as User;

  // Reset coupon state when component first mounts (page reload)
  useEffect(() => {
    setAmountDiscount(0);
    setSelectedCoupon(null);
  }, []);

  // Tính hourly rate từ daily rate (daily rate / 12 giờ)
  useEffect(() => {
    if (vehicleIds.length === 1 && vehicle?.costPerDay) {
      setHourlyRate(Math.round(vehicle.costPerDay / 12));
    } else if (vehicleIds.length > 1 && multiVehicles.length > 0) {
      // Use the first vehicle's rate for multi-booking
      setHourlyRate(Math.round(multiVehicles[0].costPerDay / 12));
    }
  }, [vehicle?.costPerDay, multiVehicles, vehicleIds.join(",")]);

  // Fetch vehicle data and handle query params
  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!vehicleIds.length) return;
      setLoading(true);
      try {
        if (vehicleIds.length === 1) {
          const vehicleData = await getVehicleById(vehicleIds[0]);
          setVehicle(vehicleData);
          const bookings = await getBookedSlotById(vehicleIds[0]);
          setExistingBookings(bookings);
        } else {
          // Multi-vehicle booking
          const vehicles: Vehicle[] = [];
          let allBookings: ExistingBooking[] = [];
          for (const vid of vehicleIds) {
            const v = await getVehicleById(vid);
            vehicles.push(v);
            const bookings = await getBookedSlotById(vid);
            allBookings = allBookings.concat(bookings);
          }
          setMultiVehicles(vehicles);
          setExistingBookings(allBookings);
        }

        // Check for time parameters in URL
        const { pickupTime, returnTime } = router.query;
        if (pickupTime && returnTime) {
          const startDate = dayjs(pickupTime as string);
          const endDate = dayjs(returnTime as string);
          if (startDate.isValid() && endDate.isValid()) {
            setSelectedDates([startDate, endDate]);
            const calculation = calculateRentalDuration(startDate, endDate);
            setRentalCalculation(calculation);
            setTotalDays(
              calculation.isHourlyRate ? 1 : calculation.billingDays
            );
            // Kiểm tra buffer time conflict cho tất cả xe
            let hasConflict = false;
            let conflictMsg = "";
            if (vehicleIds.length === 1) {
              if (vehicle?.vehicleType) {
                const vehicleType =
                  vehicle.vehicleType.toUpperCase() as VehicleType;
                const conflictCheck = checkBufferTimeConflict(
                  vehicleType,
                  startDate,
                  endDate,
                  existingBookings
                );
                if (conflictCheck.hasConflict) {
                  hasConflict = true;
                  conflictMsg =
                    conflictCheck.message || "Có xung đột thời gian";
                }
              }
            } else {
              // Multi-vehicle: check all
              for (let i = 0; i < multiVehicles.length; i++) {
                const vData = multiVehicles[i];
                if (vData?.vehicleType) {
                  const vehicleType =
                    vData.vehicleType.toUpperCase() as VehicleType;
                  const conflictCheck = checkBufferTimeConflict(
                    vehicleType,
                    startDate,
                    endDate,
                    existingBookings.filter(
                      (b) => String(b.id) === String(vData.id)
                    )
                  );
                  if (conflictCheck.hasConflict) {
                    hasConflict = true;
                    conflictMsg =
                      conflictCheck.message || "Có xung đột thời gian";
                    break;
                  }
                }
              }
            }
            setBufferConflictMessage(hasConflict ? conflictMsg : "");
          }
        }
      } catch (error) {
        console.error("Error fetching vehicle details:", error);
        message.error("Không thể tải thông tin xe");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicleData();
  }, [
    vehicleIds.join(","),
    router.query,
    multiVehicles.length,
    vehicle?.vehicleType,
  ]);

  const fetchAvailableVehiclesForModal = async () => {
    try {
      if (!selectedDates?.[0] || !selectedDates?.[1]) {
        message.error("Vui lòng chọn thời gian thuê xe trước");
        return;
      }

      // Sử dụng vehicle đầu tiên hoặc từ multiVehicles
      const referenceVehicle =
        vehicle || (multiVehicles.length > 0 ? multiVehicles[0] : null);

      if (!referenceVehicle?.thumb || !referenceVehicle?.userId) {
        message.error("Không thể lấy thông tin xe để tìm xe tương tự");
        return;
      }

      // Kiểm tra loại xe - chỉ cho phép xe máy và xe đạp
      if (referenceVehicle.vehicleType.toUpperCase() === "CAR") {
        message.error(
          "Tính năng chọn nhiều xe chỉ áp dụng cho xe máy và xe đạp"
        );
        return;
      }

      const from = selectedDates[0].format("YYYY-MM-DDTHH:mm:ss");
      const to = selectedDates[1].format("YYYY-MM-DDTHH:mm:ss");

      // Lấy số lượng khả dụng
      const quantity = await getAvailableThumbQuantity({
        thumb: referenceVehicle.thumb,
        providerId: referenceVehicle.userId,
        from,
        to,
      });

      // Lấy danh sách xe khả dụng
      const vehicles = await getAvailableThumbList({
        thumb: referenceVehicle.thumb,
        providerId: referenceVehicle.userId,
        from,
        to,
      });

      setAvailableQuantityForReselect(quantity);
      setAvailableVehicleList(vehicles);

      // Pre-select current vehicles
      setNewSelectedVehicleIds(vehicleIds);

      setIsVehicleSelectModalOpen(true);
    } catch (error) {
      console.error("Error fetching available vehicles:", error);
      message.error("Không thể lấy danh sách xe khả dụng");
    }
  };

  const checkVehicleAvailabilityFromSlots = (
    vehicleId: string,
    startDate: Dayjs,
    endDate: Dayjs,
    bookedSlots: ExistingBooking[]
  ): boolean => {
    // Lấy booked slots cho xe này
    const vehicleBookedSlots = bookedSlots.filter(
      (slot) =>
        String(slot.id) === String(vehicleId) ||
        String(slot.id) === String(vehicleId) // Fallback nếu structure khác
    );

    // Nếu không có booked slots thì xe available
    if (vehicleBookedSlots.length === 0) return true;

    // Check conflict với từng booked slot
    for (const slot of vehicleBookedSlots) {
      const slotStart = parseBackendTime(slot.startDate);
      const slotEnd = parseBackendTime(slot.endDate);

      // Check overlap: new booking overlaps with existing slot
      const hasOverlap =
        startDate.isBefore(slotEnd) && endDate.isAfter(slotStart);

      if (hasOverlap) {
        return false; // Xe không available
      }
    }

    return true; // Xe available
  };

  // Function để check availability cho tất cả xe hiện tại
  const checkAllVehiclesAvailability = async () => {
    if (!selectedDates?.[0] || !selectedDates?.[1]) {
      setVehicleAvailabilityStatus({});
      return;
    }

    const startDate = selectedDates[0];
    const endDate = selectedDates[1];

    try {
      // Lấy booked slots cho tất cả xe
      const allBookedSlotsPromises = vehicleIds.map(async (vehicleId) => {
        try {
          const slots = await getBookedSlotById(vehicleId);
          return { vehicleId, slots };
        } catch (error) {
          console.error(
            `Error fetching booked slots for vehicle ${vehicleId}:`,
            error
          );
          return { vehicleId, slots: [] };
        }
      });

      const allBookedSlotsResults = await Promise.all(allBookedSlotsPromises);

      // Gộp tất cả booked slots
      const allBookedSlots: ExistingBooking[] = [];
      allBookedSlotsResults.forEach(({ slots }) => {
        allBookedSlots.push(...slots);
      });

      // Check availability cho từng xe
      const statusMap: { [key: string]: boolean } = {};
      vehicleIds.forEach((vehicleId) => {
        const isAvailable = checkVehicleAvailabilityFromSlots(
          vehicleId,
          startDate,
          endDate,
          allBookedSlots
        );
        statusMap[vehicleId] = isAvailable;
      });

      setVehicleAvailabilityStatus(statusMap);

      // Show warning nếu có xe unavailable
      const unavailableVehicles = Object.entries(statusMap).filter(
        ([_, isAvailable]) => !isAvailable
      );
      if (unavailableVehicles.length > 0) {
        message.warning(
          `Có ${unavailableVehicles.length} xe đã được đặt trong khoảng thời gian này. Vui lòng chọn lại xe hoặc thay đổi thời gian.`
        );
      }
    } catch (error) {
      console.error("Error checking vehicles availability:", error);
      // Fallback: mark all as available nếu có lỗi
      const statusMap: { [key: string]: boolean } = {};
      vehicleIds.forEach((vehicleId) => {
        statusMap[vehicleId] = true;
      });
      setVehicleAvailabilityStatus(statusMap);
    }
  };

  // Function để handle việc chọn lại xe
  const handleVehicleReselect = () => {
    if (newSelectedVehicleIds.length === 0) {
      message.error("Vui lòng chọn ít nhất một xe");
      return;
    }

    // Tạo URL mới với danh sách xe đã chọn
    const newVehicleIdsParam = newSelectedVehicleIds.join(",");
    const newBookingUrl = `/booking?vehicleId=${encodeURIComponent(
      newVehicleIdsParam
    )}&pickupTime=${encodeURIComponent(
      selectedDates?.[0]?.format("YYYY-MM-DD HH:mm") || ""
    )}&returnTime=${encodeURIComponent(
      selectedDates?.[1]?.format("YYYY-MM-DD HH:mm") || ""
    )}`;

    setIsVehicleSelectModalOpen(false);

    // Redirect to new URL
    window.location.href = newBookingUrl;
  };

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
        if (!user?.id) return;
        const wallet = await getUserWallet(user.id);
        setWalletBalance(wallet.balance || 0);
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
        setWalletBalance(0);
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
          // SỬA: Sử dụng vehicleIds từ URL params thay vì logic phức tạp
          let finalVehicleIds: string[] = [];

          if (vehicleIds.length > 0) {
            // Đã có vehicleIds từ URL params, sử dụng trực tiếp
            finalVehicleIds = vehicleIds.filter((id) => id && id.trim() !== ""); // Lọc bỏ null/empty
          } else {
            // Fallback: sử dụng id từ query params
            const singleId =
              typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
            if (singleId) {
              finalVehicleIds = [singleId];
            }
          }

          // Kiểm tra finalVehicleIds có hợp lệ không
          if (finalVehicleIds.length === 0) {
            message.error("Không tìm thấy thông tin xe để đặt");
            setSubmitting(false);
            return;
          }

          console.log("Final vehicle IDs for booking:", finalVehicleIds);

          // Double-check availability cho xe đầu tiên
          const firstVehicleId = finalVehicleIds[0];
          const lastMinuteCheck = (await checkAvailability(
            firstVehicleId,
            startTime,
            endTime
          )) as AvailabilityCheckResponse;

          if (!lastMinuteCheck.success || !lastMinuteCheck.data?.available) {
            throw new Error("CONFLICT: Xe vừa được đặt bởi người khác");
          }

          // Tính driver fee trước khi tạo booking request
          let calculatedDriverFee = 0;
          if (withDriver) {
            if (rentalCalculation?.isHourlyRate) {
              // Tính driver fee theo giờ
              if (
                vehicleIds.length === 1 &&
                vehicle?.extraFeeRule?.hasHourlyRental
              ) {
                const driverHourlyRate =
                  vehicle.extraFeeRule.driverFeePerHour || 0;
                calculatedDriverFee =
                  calculateRentalPrice(
                    rentalCalculation,
                    driverHourlyRate,
                    vehicle.extraFeeRule.driverFeePerDay || 0
                  ) * selectedQuantity;
              } else if (vehicleIds.length > 1 && multiVehicles.length > 0) {
                calculatedDriverFee = multiVehicles.reduce((sum, v) => {
                  if (v?.extraFeeRule?.hasHourlyRental) {
                    const driverHourlyRate =
                      v.extraFeeRule.driverFeePerHour || 0;
                    return (
                      sum +
                      calculateRentalPrice(
                        rentalCalculation,
                        driverHourlyRate,
                        v.extraFeeRule.driverFeePerDay || 0
                      )
                    );
                  }
                  return sum;
                }, 0);
              }
            } else {
              // Tính driver fee theo ngày
              if (vehicleIds.length === 1) {
                calculatedDriverFee =
                  totalDays *
                  (vehicle?.extraFeeRule?.driverFeePerDay || 0) *
                  selectedQuantity;
              } else if (vehicleIds.length > 1 && multiVehicles.length > 0) {
                calculatedDriverFee = multiVehicles.reduce(
                  (sum, v) =>
                    sum + totalDays * (v.extraFeeRule?.driverFeePerDay || 0),
                  0
                );
              }
            }
          }

          // Tạo booking request data
          const bookingRequestData = {
            vehicleIds: finalVehicleIds, // Sử dụng finalVehicleIds đã được validate
            timeBookingStart: formatTimeForBackend(selectedDates[0]),
            timeBookingEnd: formatTimeForBackend(selectedDates[1]),
            fullname: formValues.fullname || user?.fullName || "",
            phoneNumber: formValues.phone,
            address:
              costGetCar === 1
                ? formValues.address || ""
                : vehicle?.address ||
                  multiVehicles[0]?.address ||
                  "Nhận tại văn phòng",
            pickupMethod: costGetCar === 0 ? "office" : "delivery",
            couponId: selectedCoupon?.id || null,

            // Penalty info từ vehicle
            // penaltyType: (vehicle || multiVehicles[0])?.penaltyType,
            // penaltyValue: (vehicle || multiVehicles[0])?.penaltyValue,
            // minCancelHour: (vehicle || multiVehicles[0])?.minCancelHour,

            // Penalty info từ vehicle
            penaltyId: (vehicle || multiVehicles[0])?.penalty?.id,
            penaltyType: (vehicle || multiVehicles[0])?.penalty?.penaltyType,
            penaltyValue: (vehicle || multiVehicles[0])?.penalty?.penaltyValue,
            minCancelHour: (vehicle || multiVehicles[0])?.penalty
              ?.minCancelHour,

            driverFee: calculatedDriverFee,
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
              // message.destroy(); // Clear any previous messages
              // message.error({
              //   content:
              //     "❌ Xe đã được đặt bởi người khác! Vui lòng chọn thời gian khác.",
              //   duration: 5,
              //   style: { marginTop: "20vh" },
              // });
              showError(
                "Xe đã được đặt bởi người khác! Vui lòng chọn thời gian khác."
              );

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
        // Tạo link thanh toán VNPay, truyền thêm amount
        const paymentResponse = (await createVNPayPayment(
          bookingData.id,
          bookingData.totalCost
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

  // Function tính khoảng cách giao xe
  const calculateDeliveryDistance = async (customerAddress: string) => {
    if (!customerAddress || costGetCar !== 1) {
      setDeliveryDistance(null);
      setDistanceError("");
      return;
    }

    try {
      setIsCalculatingDistance(true);
      setDistanceError("");

      const officeAddress =
        vehicle?.address ||
        (multiVehicles.length > 0 && multiVehicles[0].address) ||
        "Thạch Hòa, Thạch Thất, Hà Nội";

      // Lấy tọa độ từ HERE Geocoding API
      const [officeCoords, customerCoords] = await Promise.all([
        fetch(
          `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
            officeAddress
          )}&apiKey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`
        ).then((res) => res.json()),
        fetch(
          `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
            customerAddress
          )}&apiKey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`
        ).then((res) => res.json()),
      ]);

      if (!officeCoords.items?.[0] || !customerCoords.items?.[0]) {
        setDistanceError(
          "Không thể xác định địa chỉ. Vui lòng nhập địa chỉ chi tiết hơn."
        );
        return;
      }

      const officeLat = officeCoords.items[0].position.lat;
      const officeLng = officeCoords.items[0].position.lng;
      const customerLat = customerCoords.items[0].position.lat;
      const customerLng = customerCoords.items[0].position.lng;

      // Tính khoảng cách thực tế qua HERE Routing API
      const routeResponse = await fetch(
        `https://router.hereapi.com/v8/routes?` +
          new URLSearchParams({
            transportMode: "car",
            origin: `${officeLat},${officeLng}`,
            destination: `${customerLat},${customerLng}`,
            return: "summary",
            apikey: process.env.NEXT_PUBLIC_HERE_API_KEY || "",
          }).toString()
      );

      const routeData = await routeResponse.json();

      if (routeData.routes?.[0]?.sections?.[0]?.summary?.length) {
        const distanceInKm =
          routeData.routes[0].sections[0].summary.length / 1000;
        setDeliveryDistance(distanceInKm);

        if (distanceInKm > deliveryRadius) {
          setDistanceError(
            `Khoảng cách giao xe ${distanceInKm.toFixed(
              1
            )}km. Chủ xe không hỗ trợ giao xe quá ${deliveryRadius}km.`
          );
        }
      } else {
        setDistanceError("Không thể tính khoảng cách. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      setDistanceError("Lỗi khi tính khoảng cách. Vui lòng thử lại.");
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  // Function lấy gợi ý địa chỉ
  const getAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(
          query
        )}&in=countryCode:VNM&apiKey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const suggestions = data.items.map((item: any) => ({
        value: item.address.label,
        label: item.address.label,
        position: item.position,
      }));

      setAddressSuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setAddressSuggestions([]);
    }
  };

  // Xử lý thay đổi thời gian
  const selectTimeSlots: RangePickerProps["onChange"] = async (value) => {
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

      // Kiểm tra buffer time conflict cho xe đầu tiên (reference vehicle)
      const referenceVehicle =
        vehicle || (multiVehicles.length > 0 ? multiVehicles[0] : null);
      if (referenceVehicle?.vehicleType) {
        const vehicleType =
          referenceVehicle.vehicleType.toUpperCase() as VehicleType;
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

      // Check availability cho tất cả xe hiện tại
      await checkAllVehiclesAvailability();

      console.log("Rental calculation:", calculation);
    } else {
      // Reset khi không có dates
      setSelectedDates(null);
      setVehicleAvailabilityStatus({});
      setBufferConflictMessage("");
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
  let costPerDay = 0;
  if (vehicleIds.length === 1 && vehicle?.costPerDay) {
    costPerDay = vehicle.costPerDay;
  } else if (vehicleIds.length > 1 && multiVehicles.length > 0) {
    // Tổng hợp giá cho nhiều xe (cộng từng xe)
    costPerDay = multiVehicles.reduce((sum, v) => sum + (v.costPerDay || 0), 0);
  }

  let subtotal = 0;
  if (rentalCalculation && hourlyRate > 0) {
    if (vehicleIds.length === 1) {
      const basePrice =
        calculateRentalPrice(rentalCalculation, hourlyRate, costPerDay) *
        selectedQuantity;
      // Add driver fee for hourly rental if applicable
      let driverFee = 0;
      if (
        withDriver &&
        vehicle?.extraFeeRule?.hasDriverOption &&
        vehicle?.extraFeeRule?.hasHourlyRental
      ) {
        const driverHourlyRate = vehicle.extraFeeRule.driverFeePerHour || 0;
        driverFee =
          calculateRentalPrice(
            rentalCalculation,
            driverHourlyRate,
            vehicle.extraFeeRule.driverFeePerDay || 0
          ) * selectedQuantity;
      }
      subtotal = basePrice + driverFee;
    } else if (vehicleIds.length > 1 && multiVehicles.length > 0) {
      // Tính tổng giá cho từng xe
      subtotal = multiVehicles.reduce((sum, v) => {
        const rate = Math.round((v.costPerDay || 0) / 12);
        const basePrice = calculateRentalPrice(
          rentalCalculation,
          rate,
          v.costPerDay || 0
        );
        // Add driver fee for multi-vehicle if applicable
        let driverFee = 0;
        if (
          withDriver &&
          v?.extraFeeRule?.hasDriverOption &&
          v?.extraFeeRule?.hasHourlyRental
        ) {
          const driverHourlyRate = v.extraFeeRule.driverFeePerHour || 0;
          driverFee = calculateRentalPrice(
            rentalCalculation,
            driverHourlyRate,
            v.extraFeeRule.driverFeePerDay || 0
          );
        }
        return sum + basePrice + driverFee;
      }, 0);
    }
  } else {
    if (vehicleIds.length === 1) {
      const basePrice = totalDays * costPerDay * selectedQuantity;
      // Add driver fee for daily rental if applicable
      let driverFee = 0;
      if (withDriver && vehicle?.extraFeeRule?.hasDriverOption) {
        driverFee =
          totalDays *
          (vehicle.extraFeeRule.driverFeePerDay || 0) *
          selectedQuantity;
      }
      subtotal = basePrice + driverFee;
    } else if (vehicleIds.length > 1 && multiVehicles.length > 0) {
      subtotal = multiVehicles.reduce((sum, v) => {
        const basePrice = totalDays * (v.costPerDay || 0);
        // Add driver fee for multi-vehicle if applicable
        let driverFee = 0;
        if (withDriver && v?.extraFeeRule?.hasDriverOption) {
          driverFee = totalDays * (v.extraFeeRule.driverFeePerDay || 0);
        }
        return sum + basePrice + driverFee;
      }, 0);
    }
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

  useEffect(() => {
    const fetchAvailableQuantity = async () => {
      if (!selectedDates?.[0] || !selectedDates?.[1]) {
        setAvailableQuantityForReselect(1);
        return;
      }

      // Chỉ fetch cho xe máy/xe đạp, không cho ô tô
      const referenceVehicle =
        vehicle || (multiVehicles.length > 0 ? multiVehicles[0] : null);

      if (!referenceVehicle?.vehicleType) {
        setAvailableQuantityForReselect(1);
        return;
      }

      // Kiểm tra loại xe - chỉ cho phép xe máy và xe đạp
      if (referenceVehicle.vehicleType.toUpperCase() === "CAR") {
        setAvailableQuantityForReselect(1);
        return;
      }

      if (referenceVehicle?.thumb && referenceVehicle?.userId) {
        try {
          const from = selectedDates[0].format("YYYY-MM-DDTHH:mm:ss");
          const to = selectedDates[1].format("YYYY-MM-DDTHH:mm:ss");

          const quantity = await getAvailableThumbQuantity({
            thumb: referenceVehicle.thumb,
            providerId: referenceVehicle.userId,
            from,
            to,
          });

          setAvailableQuantityForReselect(quantity);
        } catch (err) {
          console.error("Error fetching available quantity:", err);
          setAvailableQuantityForReselect(1);
        }
      } else {
        setAvailableQuantityForReselect(1);
      }
    };

    fetchAvailableQuantity();
  }, [selectedDates, vehicle, multiVehicles]);

  useEffect(() => {
    // Always sync selectedQuantity with vehicleIds.length
    setSelectedQuantity(vehicleIds.length || 1);
  }, [vehicleIds.join(",")]);

  // Prepare default date values
  const { pickupTime, returnTime } = router.query;
  const defaultStartDate: Dayjs | null = pickupTime
    ? dayjs(pickupTime as string)
    : null;
  const defaultEndDate: Dayjs | null = returnTime
    ? dayjs(returnTime as string)
    : null;

  // Tạo disabledTime và disabledDate functions sử dụng helper mới
  // Nếu nhiều xe, lấy open/closeTime của xe đầu tiên
  const openTime = vehicle?.openTime || (multiVehicles[0]?.openTime ?? "00:00");
  const closeTime =
    vehicle?.closeTime || (multiVehicles[0]?.closeTime ?? "00:00");

  const disabledRangeTime = useMemo(() => {
    if (vehicleIds.length === 1 && vehicle?.vehicleType) {
      const vehicleType = vehicle.vehicleType.toUpperCase() as VehicleType;
      return createDisabledTimeFunction(
        vehicleType,
        existingBookings,
        openTime,
        closeTime
      );
    } else if (vehicleIds.length > 1 && multiVehicles.length > 0) {
      // Nếu nhiều xe, gộp tất cả bookings lại, lấy loại xe đầu tiên
      const vehicleType =
        multiVehicles[0].vehicleType.toUpperCase() as VehicleType;
      return createDisabledTimeFunction(
        vehicleType,
        existingBookings,
        openTime,
        closeTime
      );
    }
    return createDisabledTimeFunction("CAR", [], openTime, closeTime);
  }, [
    vehicle?.vehicleType,
    multiVehicles,
    existingBookings,
    openTime,
    closeTime,
    vehicleIds.join(","),
  ]);

  const disabledDateFunction = useMemo(() => {
    return (current: Dayjs): boolean => {
      if (vehicleIds.length === 1 && vehicle?.vehicleType) {
        const vehicleType = vehicle.vehicleType.toUpperCase() as VehicleType;
        return isDateDisabled(current, vehicleType, existingBookings);
      } else if (vehicleIds.length > 1 && multiVehicles.length > 0) {
        const vehicleType =
          multiVehicles[0].vehicleType.toUpperCase() as VehicleType;
        return isDateDisabled(current, vehicleType, existingBookings);
      }
      return false;
    };
  }, [
    vehicle?.vehicleType,
    multiVehicles,
    existingBookings,
    vehicleIds.join(","),
  ]);

  // Debounced version để tránh gọi API quá nhiều
  const debouncedCalculateDistance = useMemo(
    () => debounce(calculateDeliveryDistance, 1000), // Giảm từ 5000ms xuống 1000ms
    [costGetCar, vehicle?.address, multiVehicles] // Thêm dependencies
  );

  // Debounced version
  const debouncedGetAddressSuggestions = useMemo(
    () => debounce(getAddressSuggestions, 500),
    []
  );

  // Reset địa chỉ khi thay đổi costGetCar
  useEffect(() => {
    if (costGetCar === 0) {
      setAddressInputValue("");
      setAddressSuggestions([]);
      setDeliveryDistance(null);
      setDistanceError("");
    }
  }, [costGetCar]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (debouncedCalculateDistance) {
        debouncedCalculateDistance.cancel();
      }
      if (debouncedGetAddressSuggestions) {
        debouncedGetAddressSuggestions.cancel();
      }
    };
  }, [debouncedCalculateDistance, debouncedGetAddressSuggestions]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải thông tin xe..." />
      </div>
    );
  }

  // Error state
  if (vehicleIds.length === 1 && !vehicle) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-xl mb-4 text-red-500">Không thể tải thông tin xe</p>
        <Link href="/vehicles">
          <Button type="primary">Quay lại trang tìm kiếm xe</Button>
        </Link>
      </div>
    );
  }
  if (vehicleIds.length > 1 && multiVehicles.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-xl mb-4 text-red-500">
          Không thể tải thông tin các xe
        </p>
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
                    Địa chỉ nhận xe
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Option 1: Nhận tại văn phòng - Luôn hiển thị */}
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      costGetCar === 0
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => {
                      setCostGetCar(0);
                      setDeliveryDistance(null);
                      setDistanceError("");
                      setAddressSuggestions([]); // Reset suggestions
                      setAddressInputValue(""); // Reset input value
                    }}
                  >
                    <div className="flex items-center mb-2">
                      <Radio checked={costGetCar === 0} />
                      <span className="ml-2 font-semibold text-gray-800 text-base">
                        Tôi muốn nhận xe tại văn phòng
                      </span>
                    </div>
                    <div className="text-gray-600 text-base">
                      {vehicle?.address ||
                        (multiVehicles.length > 0 &&
                          multiVehicles[0].address) ||
                        "Thạch Hòa, Thạch Thất, Hà Nội"}
                    </div>
                    <div className="text-green-600 font-semibold text-base mt-1">
                      Miễn phí
                    </div>
                  </div>

                  {/* Option 2: Giao xe - Chỉ hiển thị khi có shipToAddress = "YES" */}
                  {((vehicleIds.length === 1 &&
                    vehicle?.shipToAddress === "YES") ||
                    (vehicleIds.length > 1 &&
                      multiVehicles.length > 0 &&
                      multiVehicles[0].shipToAddress === "YES")) && (
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        costGetCar === 1
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                      onClick={() => {
                        setCostGetCar(1); // ĐÃ SỬA: Đổi từ 0 thành 1
                        // Cancel pending calculations
                        debouncedCalculateDistance.cancel();
                        debouncedGetAddressSuggestions.cancel();
                        // Reset all states
                        setDeliveryDistance(null);
                        setDistanceError("");
                        setAddressSuggestions([]);
                        setAddressInputValue("");
                        setIsCalculatingDistance(false);
                        // Clear form field
                        form.setFieldValue("address", "");
                      }}
                    >
                      <div className="flex items-center mb-2">
                        <Radio checked={costGetCar === 1} />
                        <span className="ml-2 font-semibold text-gray-800 text-base">
                          Tôi muốn xe được giao đến địa chỉ của tôi
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

                {/* Form nhập địa chỉ giao xe */}
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
                        <AutoComplete
                          value={addressInputValue}
                          options={addressSuggestions}
                          onSearch={(text) => {
                            setAddressInputValue(text);
                            debouncedGetAddressSuggestions(text);
                            // Reset states khi đang search
                            setDeliveryDistance(null);
                            setDistanceError("");
                          }}
                          onSelect={(value) => {
                            // Khi chọn từ gợi ý - tính ngay lập tức
                            setAddressInputValue(value);
                            form.setFieldsValue({ address: value });

                            // Cancel debounced và tính ngay
                            debouncedCalculateDistance.cancel();
                            calculateDeliveryDistance(value); // Gọi trực tiếp, không qua debounce
                          }}
                          onChange={(value) => {
                            setAddressInputValue(value);
                            form.setFieldsValue({ address: value });

                            if (!value || !value.trim()) {
                              // Clear nếu empty
                              debouncedCalculateDistance.cancel();
                              setDeliveryDistance(null);
                              setDistanceError("");
                              setIsCalculatingDistance(false);
                            } else {
                              // THÊM DÒNG NÀY: Debounce tính toán khi user đang gõ
                              debouncedCalculateDistance(value);
                            }
                          }}
                          onBlur={() => {
                            // Chỉ tính nếu chưa có kết quả và có giá trị
                            const currentValue = addressInputValue;
                            if (
                              currentValue &&
                              currentValue.trim() &&
                              deliveryDistance === null &&
                              !isCalculatingDistance
                            ) {
                              debouncedCalculateDistance.cancel();
                              calculateDeliveryDistance(currentValue);
                            }
                          }}
                        >
                          <TextArea
                            rows={3}
                            placeholder="Nhập địa chỉ giao xe chi tiết (số nhà, tên đường, phường/xã, quận/huyện, thành phố)"
                            className="resize-none text-base"
                          />
                        </AutoComplete>
                      </Form.Item>
                    </Form>

                    {/* Hiển thị trạng thái tính khoảng cách */}
                    {isCalculatingDistance && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-blue-600 text-sm flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Đang tính khoảng cách giao xe...</span>
                        </div>
                      </div>
                    )}

                    {/* Hiển thị kết quả khoảng cách */}
                    {deliveryDistance !== null &&
                      !isCalculatingDistance &&
                      deliveryDistance <= deliveryRadius && (
                        <div className="mt-3 p-3 rounded-lg border bg-green-50 border-green-200">
                          <div className="text-sm text-green-700">
                            <div className="font-medium">
                              Khoảng cách từ văn phòng:{" "}
                              {deliveryDistance.toFixed(1)}km
                            </div>
                            <div className="text-xs mt-1">
                              ✓ Hỗ trợ giao xe đến địa chỉ này
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Hiển thị lỗi */}
                    {distanceError && !isCalculatingDistance && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-red-700 text-sm">
                          <div className="font-medium flex items-start gap-2">
                            <span className="text-red-500">⚠️</span>
                            <span>{distanceError}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Thông tin xe */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Thông tin xe thuê
                    {vehicleIds.length > 1 && (
                      <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {vehicleIds.length} xe
                      </span>
                    )}
                  </h3>
                </div>

                {/* Driver Option - Chỉ hiển thị cho xe ô tô có hỗ trợ tài xế */}
                {((vehicleIds.length === 1 &&
                  vehicle?.vehicleType?.toUpperCase() === "CAR" &&
                  vehicle?.extraFeeRule?.hasDriverOption) ||
                  (vehicleIds.length > 1 &&
                    multiVehicles.length > 0 &&
                    multiVehicles[0]?.vehicleType?.toUpperCase() === "CAR" &&
                    multiVehicles[0]?.extraFeeRule?.hasDriverOption)) && (
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Dịch vụ tài xế
                      </h4>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Option 1: Tự lái */}
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          !withDriver
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => setWithDriver(false)}
                      >
                        <div className="flex items-center mb-2">
                          <Radio checked={!withDriver} />
                          <span className="ml-2 font-semibold text-gray-800 text-base">
                            Tự lái xe
                          </span>
                        </div>
                        <div className="text-gray-600 text-sm">
                          Bạn sẽ tự lái xe trong suốt thời gian thuê
                        </div>
                        <div className="text-green-600 font-semibold text-sm mt-1">
                          Không phụ phí
                        </div>
                      </div>

                      {/* Option 2: Có tài xế */}
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          withDriver
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => setWithDriver(true)}
                      >
                        <div className="flex items-center mb-2">
                          <Radio checked={withDriver} />
                          <span className="ml-2 font-semibold text-gray-800 text-base">
                            Thuê kèm tài xế
                          </span>
                        </div>
                        <div className="text-gray-600 text-sm">
                          Tài xế chuyên nghiệp sẽ lái xe cho bạn
                        </div>
                        <div className="text-orange-500 font-semibold text-sm mt-1">
                          {vehicleIds.length === 1 &&
                          vehicle?.extraFeeRule?.driverFeePerDay
                            ? `+${vehicle.extraFeeRule.driverFeePerDay.toLocaleString(
                                "vi-VN"
                              )}₫/ngày`
                            : multiVehicles.length > 0 &&
                              multiVehicles[0]?.extraFeeRule?.driverFeePerDay
                            ? `+${multiVehicles[0].extraFeeRule.driverFeePerDay.toLocaleString(
                                "vi-VN"
                              )}₫/ngày`
                            : "Có phụ phí"}
                          {((vehicleIds.length === 1 &&
                            vehicle?.extraFeeRule?.hasHourlyRental &&
                            vehicle?.extraFeeRule?.driverFeePerHour) ||
                            (multiVehicles.length > 0 &&
                              multiVehicles[0]?.extraFeeRule?.hasHourlyRental &&
                              multiVehicles[0]?.extraFeeRule
                                ?.driverFeePerHour)) && (
                            <div className="text-xs text-gray-500 mt-1">
                              Thuê theo giờ:{" "}
                              {vehicleIds.length === 1
                                ? vehicle?.extraFeeRule?.driverFeePerHour?.toLocaleString(
                                    "vi-VN"
                                  )
                                : multiVehicles[0]?.extraFeeRule?.driverFeePerHour?.toLocaleString(
                                    "vi-VN"
                                  )}
                              ₫/giờ
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {withDriver && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-600 text-lg">ℹ️</span>
                          <div className="text-yellow-800 text-sm">
                            <div className="font-medium">
                              Lưu ý khi thuê tài xế:
                            </div>
                            <ul className="mt-1 text-xs space-y-1 list-disc list-inside">
                              <li>Tài xế sẽ có mặt đúng giờ đã hẹn</li>
                              <li>
                                Chi phí xăng, phí đường bộ do khách hàng chi trả
                              </li>
                              <li>Tài xế sẽ đi cùng trong suốt chuyến đi</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-6 pb-4 border-b border-gray-200">
                  <RangePicker
                    showTime={{ format: "HH:mm", minuteStep: 30 }}
                    format="DD-MM-YYYY HH:mm"
                    onChange={selectTimeSlots}
                    disabledTime={disabledRangeTime}
                    disabledDate={disabledDateFunction}
                    size="large"
                    // value={selectedDates || [defaultStartDate, defaultEndDate]}
                    // value={
                    //   selectedDates ||
                    //   (defaultStartDate && defaultEndDate
                    //     ? [defaultStartDate, defaultEndDate]
                    //     : undefined)
                    // }
                    value={selectedDates}
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

                  {/* Sửa lại phần hiển thị thông tin số lượng xe khả dụng */}
                  {selectedDates?.[0] && selectedDates?.[1] && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            Số lượng xe khả dụng:
                          </span>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-sm font-bold text-blue-600">
                            {availableQuantityForReselect}
                          </span>
                          {/* Hiển thị loại xe */}
                          {(vehicle || multiVehicles[0]) && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {translateENtoVI(
                                (vehicle || multiVehicles[0])?.vehicleType || ""
                              )}
                            </span>
                          )}
                        </div>

                        {/* Chỉ hiển thị nút "Chọn lại xe" cho xe máy/xe đạp */}
                        {((vehicle &&
                          vehicle.vehicleType.toUpperCase() !== "CAR") ||
                          (multiVehicles.length > 0 &&
                            multiVehicles[0].vehicleType.toUpperCase() !==
                              "CAR")) &&
                          availableQuantityForReselect > 1 && (
                            <button
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              onClick={fetchAvailableVehiclesForModal}
                            >
                              Chọn lại xe
                            </button>
                          )}

                        {/* Thông báo cho ô tô */}
                        {((vehicle &&
                          vehicle.vehicleType.toUpperCase() === "CAR") ||
                          (multiVehicles.length > 0 &&
                            multiVehicles[0].vehicleType.toUpperCase() ===
                              "CAR")) && (
                          <span className="text-xs text-gray-500 italic">
                            Ô tô chỉ có thể đặt 1 xe
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Danh sách xe - Single vehicle */}
                {vehicleIds.length === 1 && vehicle && (
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
                        <span>{translateENtoVI(vehicle.transmission)}</span>
                        <span>{translateENtoVI(vehicle.fuelType)}</span>
                        <span>Biển số: {vehicle.licensePlate}</span>
                      </div>
                      <div className="text-xl font-bold text-primary">
                        {vehicle.costPerDay.toLocaleString("vi-VN")}₫/ngày
                      </div>
                    </div>
                  </div>
                )}

                {/* Danh sách xe - Multiple vehicles */}
                {vehicleIds.length > 1 && multiVehicles.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-3">
                      Danh sách {multiVehicles.length} xe đã chọn:
                    </div>

                    <div
                      className="space-y-4 overflow-y-auto pr-2"
                      style={{
                        maxHeight: "400px",
                        scrollbarWidth: "thin",
                        scrollbarColor: "#cbd5e1 #f1f5f9",
                      }}
                    >
                      {multiVehicles.map((vehicleItem, index) => {
                        const isAvailable =
                          vehicleAvailabilityStatus[vehicleItem.id] !== false;

                        return (
                          <div
                            key={vehicleItem.id}
                            className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg border transition-colors ${
                              isAvailable
                                ? "bg-gray-50 border-gray-200 hover:border-gray-300"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            {/* Số thứ tự */}
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm flex-shrink-0 self-start sm:self-center ${
                                isAvailable
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {index + 1}
                            </div>

                            {/* Hình ảnh xe */}
                            <div className="relative w-full sm:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={
                                  vehicleItem.vehicleImages?.length > 0
                                    ? vehicleItem.vehicleImages[0].imageUrl
                                    : "/images/demo1.png"
                                }
                                alt={`Vehicle ${index + 1}`}
                                layout="fill"
                                className={`object-cover ${
                                  !isAvailable ? "grayscale opacity-60" : ""
                                }`}
                                unoptimized
                              />
                              {!isAvailable && (
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                  <span className="text-white text-xs font-medium bg-red-500 px-2 py-1 rounded">
                                    Đã được đặt
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Thông tin xe */}
                            <div className="flex-1 space-y-2 min-w-0">
                              <h4
                                className={`font-semibold text-lg truncate ${
                                  isAvailable
                                    ? "text-gray-800"
                                    : "text-gray-500"
                                }`}
                              >
                                {vehicleItem.thumb} - {vehicleItem.modelName} (
                                {vehicleItem.yearManufacture})
                              </h4>

                              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                  {translateENtoVI(vehicleItem.transmission)}
                                </span>
                                <span className="flex items-center">
                                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                  {translateENtoVI(vehicleItem.fuelType)}
                                </span>
                                <span className="flex items-center">
                                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                  Biển số: {vehicleItem.licensePlate}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div
                                  className={`text-lg font-bold ${
                                    isAvailable
                                      ? "text-primary"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {vehicleItem.costPerDay.toLocaleString(
                                    "vi-VN"
                                  )}
                                  ₫/ngày
                                </div>

                                {/* Badge trạng thái */}
                                <div
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    isAvailable
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {isAvailable ? "Đã chọn" : "Đã được đặt"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Fallback khi không có xe */}
                {vehicleIds.length === 0 && (
                  <div className="flex-1 text-gray-500 text-base text-center py-8">
                    Không có thông tin xe
                  </div>
                )}
              </div>

              {/* Sửa lại Modal để có thông báo rõ ràng hơn */}
              <Modal
                title="Chọn xe khả dụng"
                open={isVehicleSelectModalOpen}
                onCancel={() => setIsVehicleSelectModalOpen(false)}
                footer={null}
                width={700}
                className="vehicle-select-modal"
              >
                <div className="flex flex-col gap-4">
                  {/* Thông báo về loại xe được hỗ trợ */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 text-2xl">ℹ️</span>
                      <span className="text-blue-800 text-sm font-medium">
                        Tính năng đặt nhiều xe chỉ áp dụng cho xe máy và xe đạp
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    Có {availableQuantityForReselect} xe{" "}
                    {translateENtoVI(
                      (vehicle || multiVehicles[0])?.vehicleType || ""
                    )}{" "}
                    khả dụng trong thời gian đã chọn. Vui lòng chọn xe bạn muốn
                    thuê:
                  </div>

                  {availableVehicleList.length > 0 ? (
                    <>
                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {availableVehicleList.map((vehicleItem, index) => (
                          <div
                            key={vehicleItem.id}
                            className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                              newSelectedVehicleIds.includes(vehicleItem.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => {
                              const isSelected = newSelectedVehicleIds.includes(
                                vehicleItem.id
                              );
                              if (isSelected) {
                                setNewSelectedVehicleIds((prev) =>
                                  prev.filter((id) => id !== vehicleItem.id)
                                );
                              } else {
                                setNewSelectedVehicleIds((prev) => [
                                  ...prev,
                                  vehicleItem.id,
                                ]);
                              }
                            }}
                          >
                            <Checkbox
                              checked={newSelectedVehicleIds.includes(
                                vehicleItem.id
                              )}
                              onChange={() => {}} // Handled by parent div click
                            />

                            {/* Hình ảnh xe */}
                            <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={
                                  vehicleItem.vehicleImages?.length > 0
                                    ? vehicleItem.vehicleImages[0].imageUrl
                                    : "/images/demo1.png"
                                }
                                alt={vehicleItem.thumb}
                                layout="fill"
                                className="object-cover"
                                unoptimized
                              />
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
                                  {vehicleItem.costPerDay?.toLocaleString(
                                    "vi-VN"
                                  )}
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
                            Đã chọn: {newSelectedVehicleIds.length} xe{" "}
                            {translateENtoVI(
                              (vehicle || multiVehicles[0])?.vehicleType || ""
                            )}
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            Tổng:{" "}
                            {availableVehicleList
                              .filter((v) =>
                                newSelectedVehicleIds.includes(v.id)
                              )
                              .reduce((sum, v) => sum + (v.costPerDay || 0), 0)
                              .toLocaleString("vi-VN")}
                            ₫/ngày
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <button
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            onClick={() => setIsVehicleSelectModalOpen(false)}
                          >
                            Hủy
                          </button>
                          <button
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            onClick={handleVehicleReselect}
                            disabled={newSelectedVehicleIds.length === 0}
                          >
                            Chọn {newSelectedVehicleIds.length} xe
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <span className="text-4xl mb-4 block">🚫</span>
                      <p>Không có xe khả dụng trong khoảng thời gian này.</p>
                    </div>
                  )}
                </div>
              </Modal>
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
                  {/* Thêm dòng số lượng xe đặt */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">
                      Số lượng xe đặt
                    </span>
                    <span className="font-semibold text-sm">
                      {vehicleIds.length} xe
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">
                      {rentalCalculation?.isHourlyRate
                        ? `Thuê theo giờ (${formatRentalDuration(
                            rentalCalculation
                          )})`
                        : `Thuê xe (${totalDays} ngày)`}
                    </span>
                    <span className="font-semibold text-sm">
                      {/* Tính base price không bao gồm driver fee */}
                      {(() => {
                        let basePrice = 0;
                        if (rentalCalculation && hourlyRate > 0) {
                          if (vehicleIds.length === 1) {
                            basePrice =
                              calculateRentalPrice(
                                rentalCalculation,
                                hourlyRate,
                                costPerDay
                              ) * selectedQuantity;
                          } else if (
                            vehicleIds.length > 1 &&
                            multiVehicles.length > 0
                          ) {
                            basePrice = multiVehicles.reduce((sum, v) => {
                              const rate = Math.round((v.costPerDay || 0) / 12);
                              return (
                                sum +
                                calculateRentalPrice(
                                  rentalCalculation,
                                  rate,
                                  v.costPerDay || 0
                                )
                              );
                            }, 0);
                          }
                        } else {
                          if (vehicleIds.length === 1) {
                            basePrice =
                              totalDays * costPerDay * selectedQuantity;
                          } else if (
                            vehicleIds.length > 1 &&
                            multiVehicles.length > 0
                          ) {
                            basePrice = multiVehicles.reduce(
                              (sum, v) => sum + totalDays * (v.costPerDay || 0),
                              0
                            );
                          }
                        }
                        return basePrice.toLocaleString("vi-VN");
                      })()}
                      ₫
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

                  {/* Driver fee - chỉ hiển thị khi chọn tài xế */}
                  {withDriver &&
                    ((vehicleIds.length === 1 &&
                      vehicle?.extraFeeRule?.hasDriverOption) ||
                      (vehicleIds.length > 1 &&
                        multiVehicles.length > 0 &&
                        multiVehicles[0]?.extraFeeRule?.hasDriverOption)) && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">
                          {rentalCalculation?.isHourlyRate
                            ? "Phí tài xế (theo giờ)"
                            : "Phí tài xế"}
                        </span>
                        <span className="font-semibold text-sm">
                          {(() => {
                            let driverFee = 0;
                            if (rentalCalculation?.isHourlyRate) {
                              if (
                                vehicleIds.length === 1 &&
                                vehicle?.extraFeeRule?.hasHourlyRental
                              ) {
                                const driverHourlyRate =
                                  vehicle.extraFeeRule.driverFeePerHour || 0;
                                driverFee =
                                  calculateRentalPrice(
                                    rentalCalculation,
                                    driverHourlyRate,
                                    vehicle.extraFeeRule.driverFeePerDay || 0
                                  ) * selectedQuantity;
                              } else if (
                                vehicleIds.length > 1 &&
                                multiVehicles.length > 0
                              ) {
                                driverFee = multiVehicles.reduce((sum, v) => {
                                  if (v?.extraFeeRule?.hasHourlyRental) {
                                    const driverHourlyRate =
                                      v.extraFeeRule.driverFeePerHour || 0;
                                    return (
                                      sum +
                                      calculateRentalPrice(
                                        rentalCalculation,
                                        driverHourlyRate,
                                        v.extraFeeRule.driverFeePerDay || 0
                                      )
                                    );
                                  }
                                  return sum;
                                }, 0);
                              }
                            } else {
                              if (vehicleIds.length === 1) {
                                driverFee =
                                  totalDays *
                                  (vehicle?.extraFeeRule?.driverFeePerDay ||
                                    0) *
                                  selectedQuantity;
                              } else if (
                                vehicleIds.length > 1 &&
                                multiVehicles.length > 0
                              ) {
                                driverFee = multiVehicles.reduce(
                                  (sum, v) =>
                                    sum +
                                    totalDays *
                                      (v.extraFeeRule?.driverFeePerDay || 0),
                                  0
                                );
                              }
                            }
                            return driverFee.toLocaleString("vi-VN");
                          })()}
                          ₫
                        </span>
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
                  disabled={
                    !!bufferConflictMessage ||
                    Object.values(vehicleAvailabilityStatus).some(
                      (available) => !available
                    ) ||
                    (costGetCar === 1 && isCalculatingDistance) || // Disable khi đang tính
                    (costGetCar === 1 &&
                      (!addressInputValue ||
                        addressInputValue.trim() === "")) || // Disable khi chưa nhập
                    (costGetCar === 1 &&
                      deliveryDistance === null &&
                      addressInputValue.trim() !== "") || // Disable khi đã nhập nhưng chưa tính xong
                    (costGetCar === 1 &&
                      deliveryDistance !== null &&
                      deliveryDistance > deliveryRadius) // Disable khi quá 10km
                  }
                >
                  {isCalculatingDistance && costGetCar === 1
                    ? "Đang kiểm tra khoảng cách..."
                    : costGetCar === 1 &&
                      (!addressInputValue || addressInputValue.trim() === "")
                    ? "Vui lòng nhập địa chỉ giao xe"
                    : costGetCar === 1 &&
                      deliveryDistance === null &&
                      addressInputValue.trim() !== ""
                    ? "Đang xác định khoảng cách..." // Đã nhập nhưng chưa có kết quả
                    : costGetCar === 1 &&
                      deliveryDistance !== null &&
                      deliveryDistance > deliveryRadius
                    ? `Không hỗ trợ giao xe quá ${deliveryRadius}km`
                    : Object.values(vehicleAvailabilityStatus).some(
                        (available) => !available
                      )
                    ? "Có xe đã được đặt"
                    : bufferConflictMessage
                    ? "Thời gian không khả dụng"
                    : "Đặt xe ngay"}
                </Button>

                {/* Hiển thị chi tiết lỗi bên dưới nút - chỉ khi có lỗi cụ thể */}
                {(bufferConflictMessage ||
                  (costGetCar === 1 &&
                    (!addressInputValue ||
                      addressInputValue.trim() === ""))) && (
                  <div className="text-sm text-red-500 text-center mt-2">
                    {bufferConflictMessage ||
                      (costGetCar === 1 &&
                      (!addressInputValue || addressInputValue.trim() === "")
                        ? "Vui lòng nhập địa chỉ giao xe để tiếp tục"
                        : "")}
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
                  Mã đặt xe:{" "}
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
                        {translateENtoVI(bookingData.status)}
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
                      <span className="text-gray-600">Mã đặt xe:</span>
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
                    Chúng tôi sẽ thông báo đến bạn trong thời gian sớm nhất để
                    xác nhận và hướng dẫn giao nhận xe.
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
