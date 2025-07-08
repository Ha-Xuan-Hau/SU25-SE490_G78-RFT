/**
 * ===============================
 * LOCALDATETIME MIGRATION NOTES
 * ===============================
 *
 * Backend has migrated from Instant (UTC) to LocalDateTime (Vietnam time).
 *
 * CHANGES MADE:
 * 1. Backend now sends time as "yyyy-MM-dd'T'HH:mm:ss" format (Vietnam time)
 * 2. Frontend updated to:
 *    - Send time to backend in "yyyy-MM-dd'T'HH:mm:ss" format (using formatTimeForBackend helper)
 *    - Parse time from backend as local Vietnam time (not UTC)
 *    - Use parseBackendTime() helper to ensure consistent parsing
 *
 * FILES UPDATED:
 * - booking/[id].tsx: Changed to use formatTimeForBackend() helper
 * - vehicles/[id]/index.tsx: Updated comment and booking slot parsing
 * - booking.utils.ts: Added parseBackendTime() and formatTimeForBackend() helpers
 * - booking.api.js: Updated JSDoc comments
 *
 * IMPORTANT: No more UTC conversion needed - everything is Vietnam local time!
 */

import dayjs, { Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(duration);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * Helper function to parse time from backend LocalDateTime
 * Backend can send LocalDateTime as:
 * 1. String: "yyyy-MM-dd'T'HH:mm:ss" (Vietnam time)
 * 2. Array: [year, month, day, hour, minute] (Vietnam time)
 */
export const parseBackendTime = (
  timeData: string | number[] | Dayjs
): Dayjs => {
  if (dayjs.isDayjs(timeData)) {
    return timeData;
  }

  if (Array.isArray(timeData)) {
    // Handle array format: [year, month, day, hour, minute]
    // Note: JavaScript month is 0-based, but backend sends 1-based month
    const [year, month, day, hour, minute] = timeData;
    return dayjs()
      .year(year)
      .month(month - 1)
      .date(day)
      .hour(hour)
      .minute(minute)
      .second(0)
      .millisecond(0);
  }

  // Handle string format: "yyyy-MM-dd'T'HH:mm:ss"
  return dayjs(timeData);
};

/**
 * Helper function to format time to send to backend
 * Backend expects LocalDateTime in format "yyyy-MM-dd'T'HH:mm:ss" (Vietnam time)
 */
export const formatTimeForBackend = (time: Dayjs): string => {
  // Format as ISO LocalDateTime without timezone (backend treats as Vietnam time)
  return time.format("YYYY-MM-DDTHH:mm:ss");
};

// Constants
export const OPERATING_HOURS = {
  START: 7, // 7:00 AM
  END: 20, // 8:00 PM
  STEP_MINUTES: 30,
};

export const PRICING_RULES = {
  HOURLY_THRESHOLD: 8, // <= 8 giờ tính theo giờ
  DAILY_THRESHOLD: 24, // > 8 giờ nhưng <= 24 giờ = 1 ngày
};

// Buffer time rules theo loại xe
export const BUFFER_TIME_RULES = {
  CAR: {
    type: "FULL_DAY" as const, // Cả ngày không được đặt
    description: "Xe bận trong thời gian này",
  },
  MOTORBIKE: {
    type: "HOURS" as const,
    hours: 5, // 5 tiếng buffer
    description: "Phải cách nhau ít nhất 5 tiếng giữa các chuyến",
  },
  BICYCLE: {
    type: "HOURS" as const,
    hours: 5, // 5 tiếng buffer
    description: "Phải cách nhau ít nhất 5 tiếng giữa các chuyến",
  },
} as const;

// Interface cho booking đã có từ backend
export interface ExistingBooking {
  id: number;
  startDate: string | number[] | Dayjs; // Hỗ trợ string, array, hoặc Dayjs
  endDate: string | number[] | Dayjs; // Hỗ trợ string, array, hoặc Dayjs
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

// Interface cho vehicle type
export type VehicleType = "CAR" | "MOTORBIKE" | "BICYCLE";

/**
 * Tính toán thời gian thuê và loại tính giá
 */
export interface RentalCalculation {
  totalHours: number;
  totalMinutes: number;
  isHourlyRate: boolean;
  billingDays: number;
  billingHours: number;
  billingMinutes: number;
  priceType: "hourly" | "daily";
}

export const calculateRentalDuration = (
  startDate: Dayjs,
  endDate: Dayjs
): RentalCalculation => {
  // Tính tổng thời gian thuê
  const totalDuration = dayjs.duration(endDate.diff(startDate));
  const totalHours = totalDuration.asHours();
  const totalMinutes = totalDuration.asMinutes();

  let result: RentalCalculation;

  if (totalHours <= PRICING_RULES.HOURLY_THRESHOLD) {
    // Tính theo giờ + phút
    const hours = Math.floor(totalHours);
    const minutes = Math.round(totalMinutes % 60);

    result = {
      totalHours,
      totalMinutes,
      isHourlyRate: true,
      billingDays: 0,
      billingHours: hours,
      billingMinutes: minutes,
      priceType: "hourly",
    };
  } else {
    // Tính theo ngày
    let billingDays: number;

    if (totalHours <= PRICING_RULES.DAILY_THRESHOLD) {
      // <= 24 giờ = 1 ngày
      billingDays = 1;
    } else {
      // > 24 giờ = làm tròn lên ngày
      billingDays = Math.ceil(totalHours / 24);
    }

    result = {
      totalHours,
      totalMinutes,
      isHourlyRate: false,
      billingDays,
      billingHours: 0,
      billingMinutes: 0,
      priceType: "daily",
    };
  }

  return result;
};

/**
 * Tính giá tiền dựa trên thời gian thuê
 */
export const calculateRentalPrice = (
  calculation: RentalCalculation,
  hourlyRate: number,
  dailyRate: number
): number => {
  if (calculation.isHourlyRate) {
    // Tính theo giờ + phút
    const hourPrice = calculation.billingHours * hourlyRate;
    const minutePrice = (calculation.billingMinutes / 60) * hourlyRate;
    return hourPrice + minutePrice;
  } else {
    // Tính theo ngày
    return calculation.billingDays * dailyRate;
  }
};

/**
 * Format hiển thị thời gian thuê
 */
export const formatRentalDuration = (
  calculation: RentalCalculation
): string => {
  if (calculation.isHourlyRate) {
    if (calculation.billingMinutes > 0) {
      return `${calculation.billingHours} giờ ${calculation.billingMinutes} phút`;
    }
    return `${calculation.billingHours} giờ`;
  } else {
    return `${calculation.billingDays} ngày`;
  }
};

/**
 * Kiểm tra xung đột buffer time cho loại xe
 */
export const checkBufferTimeConflict = (
  vehicleType: VehicleType,
  newStartDate: Dayjs,
  newEndDate: Dayjs,
  existingBookings: ExistingBooking[]
): {
  hasConflict: boolean;
  conflictBookings: ExistingBooking[];
  message?: string;
} => {
  const conflictBookings: ExistingBooking[] = [];

  // Lọc ra các booking đang active (không bị cancelled)
  const activeBookings = existingBookings.filter(
    (booking) => booking.status !== "CANCELLED"
  );

  const bufferRule = BUFFER_TIME_RULES[vehicleType];

  for (const booking of activeBookings) {
    const bookingStart = parseBackendTime(booking.startDate);
    const bookingEnd = parseBackendTime(booking.endDate);

    console.log("Debug - Processing booking:", {
      originalStart: booking.startDate,
      originalEnd: booking.endDate,
      parsedStart: bookingStart.format("YYYY-MM-DD HH:mm"),
      parsedEnd: bookingEnd.format("YYYY-MM-DD HH:mm"),
    });

    // Kiểm tra overlap trực tiếp
    const hasDirectOverlap =
      newStartDate.isBefore(bookingEnd) && newEndDate.isAfter(bookingStart);

    if (hasDirectOverlap) {
      conflictBookings.push(booking);
      continue;
    }

    // Kiểm tra buffer time theo loại xe
    if (bufferRule.type === "FULL_DAY") {
      // Với xe hơi: ngày trả xe không được đặt
      const returnDate = bookingEnd.format("YYYY-MM-DD");
      const newBookingDates = [];

      let currentDate = newStartDate.startOf("day");
      while (currentDate.isSameOrBefore(newEndDate.endOf("day"))) {
        newBookingDates.push(currentDate.format("YYYY-MM-DD"));
        currentDate = currentDate.add(1, "day");
      }

      if (newBookingDates.includes(returnDate)) {
        conflictBookings.push(booking);
      }
    } else if (bufferRule.type === "HOURS" && "hours" in bufferRule) {
      // Với xe máy/xe đạp: cần khoảng cách 5 giờ
      const bufferHours = bufferRule.hours;

      // Kiểm tra khoảng cách từ end của booking cũ đến start của booking mới
      const timeFromEnd = newStartDate.diff(bookingEnd, "hour", true);
      // Kiểm tra khoảng cách từ end của booking mới đến start của booking cũ
      const timeFromStart = bookingStart.diff(newEndDate, "hour", true);

      if (timeFromEnd >= 0 && timeFromEnd < bufferHours) {
        conflictBookings.push(booking);
      } else if (timeFromStart >= 0 && timeFromStart < bufferHours) {
        conflictBookings.push(booking);
      }
    }
  }

  let message = "";
  if (conflictBookings.length > 0) {
    if (bufferRule.type === "FULL_DAY") {
      message = "Không khả dụng";
    } else if ("hours" in bufferRule) {
      message = `Phải cách nhau ít nhất ${bufferRule.hours} giờ giữa các chuyến thuê`;
    }
  }

  return {
    hasConflict: conflictBookings.length > 0,
    conflictBookings,
    message,
  };
};

/**
 * Kiểm tra xem một ngày có bị disable không
 */
export const isDateDisabled = (
  date: Dayjs,
  vehicleType: VehicleType,
  existingBookings: ExistingBooking[]
): boolean => {
  const today = dayjs().startOf("day");
  const dateStr = date.format("YYYY-MM-DD");

  // Disable ngày trong quá khứ
  if (date.isBefore(today)) {
    return true;
  }

  // Kiểm tra theo loại xe
  if (vehicleType === "CAR") {
    // Với xe hơi: kiểm tra xem có booking nào trong ngày này không
    const activeBookings = existingBookings.filter(
      (booking) => booking.status !== "CANCELLED"
    );

    for (const booking of activeBookings) {
      const startDate = parseBackendTime(booking.startDate);
      const endDate = parseBackendTime(booking.endDate);

      // Kiểm tra xem ngày có nằm trong khoảng booking không
      let currentDate = startDate.startOf("day");
      while (currentDate.isSameOrBefore(endDate.endOf("day"))) {
        if (currentDate.format("YYYY-MM-DD") === dateStr) {
          return true;
        }
        currentDate = currentDate.add(1, "day");
      }
    }
  }

  // Xe máy/xe đạp: không disable ngày, chỉ disable giờ
  return false;
};

/**
 * Tạo disabledTime function cho RangePicker
 */
export const createDisabledTimeFunction = (
  vehicleType: VehicleType,
  existingBookings: ExistingBooking[]
): ((current: Dayjs | null) => {
  disabledHours: () => number[];
  disabledMinutes: (selectedHour: number) => number[];
}) => {
  return (current: Dayjs | null) => {
    if (!current) {
      return {
        disabledHours: () => [],
        disabledMinutes: () => [],
      };
    }

    const today = dayjs();
    const isToday = current.isSame(today, "day");
    const currentHour = today.hour();
    const disabledHours: number[] = [];

    // Base disabled hours (ngoài giờ hoạt động)
    const baseDisabled = [
      ...Array.from({ length: OPERATING_HOURS.START }, (_, i) => i), // 0-6
      ...Array.from(
        { length: 24 - (OPERATING_HOURS.END + 1) },
        (_, i) => OPERATING_HOURS.END + 1 + i // 21-23
      ),
    ];
    disabledHours.push(...baseDisabled);

    // Disable past hours for today
    if (isToday) {
      for (let h = 0; h <= currentHour; h++) {
        if (!disabledHours.includes(h)) {
          disabledHours.push(h);
        }
      }
    }

    // Kiểm tra booking conflicts
    const activeBookings = existingBookings.filter(
      (booking) => booking.status !== "CANCELLED"
    );

    if (vehicleType === "CAR") {
      // Với xe hơi: nếu ngày bị disable thì disable tất cả giờ hoạt động
      if (isDateDisabled(current, vehicleType, existingBookings)) {
        for (let h = OPERATING_HOURS.START; h <= OPERATING_HOURS.END; h++) {
          if (!disabledHours.includes(h)) {
            disabledHours.push(h);
          }
        }
      }
    } else {
      // Với xe máy/xe đạp: disable theo buffer time
      const selectedDateStr = current.format("YYYY-MM-DD");
      const bufferHours = BUFFER_TIME_RULES[vehicleType].hours || 5;

      for (const booking of activeBookings) {
        const bookingStart = parseBackendTime(booking.startDate);
        const bookingEnd = parseBackendTime(booking.endDate);

        // Nếu booking end trong ngày được chọn, block từ start của ngày đến end + buffer
        if (bookingEnd.format("YYYY-MM-DD") === selectedDateStr) {
          const blockEnd = bookingEnd.add(bufferHours, "hour");
          let currentTime = current.hour(OPERATING_HOURS.START).minute(0);
          while (currentTime.isSameOrBefore(blockEnd)) {
            const hour = currentTime.hour();
            if (!disabledHours.includes(hour)) {
              disabledHours.push(hour);
            }
            currentTime = currentTime.add(1, "hour");
          }
        }

        // Nếu booking start trong ngày được chọn, block từ start - buffer đến end của ngày
        if (bookingStart.format("YYYY-MM-DD") === selectedDateStr) {
          const blockStart = bookingStart.subtract(bufferHours, "hour");
          let currentTime = blockStart;
          const endOfDay = current.hour(OPERATING_HOURS.END).minute(59);
          while (currentTime.isSameOrBefore(endOfDay)) {
            const hour = currentTime.hour();
            if (!disabledHours.includes(hour)) {
              disabledHours.push(hour);
            }
            currentTime = currentTime.add(1, "hour");
          }
        }
      }
    }

    return {
      disabledHours: () => disabledHours.sort((a, b) => a - b),
      disabledMinutes: (selectedHour: number) => {
        // Base: chỉ cho phép :00 và :30
        const allowedMinutes = [0, 30];
        const baseDisabledMinutes = Array.from(
          { length: 60 },
          (_, i) => i
        ).filter((minute) => !allowedMinutes.includes(minute));

        // Disable past minutes for current hour of today
        if (isToday && selectedHour === currentHour) {
          const currentMinute = today.minute();
          for (let m = 0; m <= currentMinute; m++) {
            if (!baseDisabledMinutes.includes(m)) {
              baseDisabledMinutes.push(m);
            }
          }
        }

        // Với xe hơi: nếu giờ bị disable thì disable tất cả phút
        if (disabledHours.includes(selectedHour)) {
          return Array.from({ length: 60 }, (_, i) => i);
        }

        return baseDisabledMinutes.sort((a, b) => a - b);
      },
    };
  };
};
