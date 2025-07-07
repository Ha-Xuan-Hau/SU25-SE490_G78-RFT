import dayjs, { Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(duration);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

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

// Interface cho booking đã có
export interface ExistingBooking {
  id: number;
  startDate: string | Dayjs;
  endDate: string | Dayjs;
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
 * Validate thời gian trong khung giờ hoạt động
 */
export const isTimeInOperatingHours = (time: Dayjs): boolean => {
  const hour = time.hour();
  return hour >= OPERATING_HOURS.START && hour < OPERATING_HOURS.END;
};

/**
 * Làm tròn thời gian theo bước 30 phút
 */
export const roundToNearestStep = (time: Dayjs): Dayjs => {
  const minutes = time.minute();
  const roundedMinutes =
    Math.round(minutes / OPERATING_HOURS.STEP_MINUTES) *
    OPERATING_HOURS.STEP_MINUTES;
  return time.minute(roundedMinutes).second(0).millisecond(0);
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
    const bookingStart = dayjs(booking.startDate);
    const bookingEnd = dayjs(booking.endDate);

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
 * Lấy các ngày bị block do buffer time
 */
export const getBlockedDates = (
  vehicleType: VehicleType,
  existingBookings: ExistingBooking[]
): string[] => {
  const blockedDates: string[] = [];

  const activeBookings = existingBookings.filter(
    (booking) => booking.status !== "CANCELLED"
  );

  if (vehicleType === "CAR") {
    // Với xe hơi: block ngày trả xe
    for (const booking of activeBookings) {
      const returnDate = dayjs(booking.endDate).format("YYYY-MM-DD");
      if (!blockedDates.includes(returnDate)) {
        blockedDates.push(returnDate);
      }
    }
  }

  return blockedDates;
};

/**
 * Lấy các khoảng thời gian bị block do buffer time cho xe máy/xe đạp
 */
export const getBlockedTimeRanges = (
  vehicleType: VehicleType,
  selectedDate: Dayjs,
  existingBookings: ExistingBooking[]
): { start: Dayjs; end: Dayjs }[] => {
  const blockedRanges: { start: Dayjs; end: Dayjs }[] = [];

  if (vehicleType !== "MOTORBIKE" && vehicleType !== "BICYCLE") {
    return blockedRanges;
  }

  const activeBookings = existingBookings.filter(
    (booking) => booking.status !== "CANCELLED"
  );

  const bufferHours = BUFFER_TIME_RULES[vehicleType].hours || 5;
  const selectedDateStr = selectedDate.format("YYYY-MM-DD");

  for (const booking of activeBookings) {
    const bookingStart = dayjs(booking.startDate);
    const bookingEnd = dayjs(booking.endDate);

    // Nếu booking end trong ngày được chọn, block từ start của ngày đến end + buffer
    if (bookingEnd.format("YYYY-MM-DD") === selectedDateStr) {
      const blockStart = selectedDate.hour(OPERATING_HOURS.START).minute(0);
      const blockEnd = bookingEnd.add(bufferHours, "hour");

      if (blockEnd.isAfter(blockStart)) {
        blockedRanges.push({ start: blockStart, end: blockEnd });
      }
    }

    // Nếu booking start trong ngày được chọn, block từ start - buffer đến end của ngày
    if (bookingStart.format("YYYY-MM-DD") === selectedDateStr) {
      const blockStart = bookingStart.subtract(bufferHours, "hour");
      // Sửa: cho phép chọn đến 20h, nên block end phải là sau 20h (20:59 hoặc 21:00)
      const blockEnd = selectedDate.hour(OPERATING_HOURS.END).minute(59);

      if (blockStart.isBefore(blockEnd)) {
        blockedRanges.push({ start: blockStart, end: blockEnd });
      }
    }
  }

  return blockedRanges;
};

/**
 * Kiểm tra xem một thời gian có bị block không
 */
export const isTimeBlocked = (
  time: Dayjs,
  blockedRanges: { start: Dayjs; end: Dayjs }[]
): boolean => {
  return blockedRanges.some(
    (range) => time.isSameOrAfter(range.start) && time.isSameOrBefore(range.end)
  );
};
