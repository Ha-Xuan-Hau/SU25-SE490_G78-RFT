import duration from "dayjs/plugin/duration";

import dayjs, { type Dayjs, VN_TZ } from "@/utils/dayjs";

dayjs.extend(duration);

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
    const [year, month, day, hour, minute] = timeData;
    // Tạo string format và parse với VN timezone
    const dateString = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")} ${String(hour || 0).padStart(2, "0")}:${String(
      minute || 0
    ).padStart(2, "0")}:00`;
    return dayjs.tz(dateString, VN_TZ); // ✅ Parse với VN timezone
  }

  // Handle string format với VN timezone
  return dayjs.tz(timeData, VN_TZ); // ✅ Parse với VN timezone
};

/**
 * Helper function to format time to send to backend
 * Backend expects LocalDateTime in format "yyyy-MM-dd'T'HH:mm:ss" (Vietnam time)
 */
export const formatTimeForBackend = (time: Dayjs): string => {
  // Format as ISO LocalDateTime without timezone (backend treats as Vietnam time)
  return time.format("YYYY-MM-DDTHH:mm:ss");
};

/**
 * Helper function to parse time string from multiple formats
 * Supports: "HH:mm", "HH:mm:ss", "HH"
 */
const parseTimeString = (timeStr: string): { hour: number; minute: number } => {
  if (!timeStr) {
    return { hour: 0, minute: 0 };
  }

  // Remove any whitespace
  const cleanTime = timeStr.trim();

  // Split by colon
  const parts = cleanTime.split(":");

  const hour = parseInt(parts[0]) || 0;
  const minute = parts.length > 1 ? parseInt(parts[1]) || 0 : 0;

  // Validate ranges
  const validHour = Math.max(0, Math.min(23, hour));
  const validMinute = Math.max(0, Math.min(59, minute));

  return { hour: validHour, minute: validMinute };
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
    //description: "Phải cách nhau ít nhất 5 tiếng giữa các chuyến",
  },
  BICYCLE: {
    type: "HOURS" as const,
    hours: 5, // 5 tiếng buffer
    // description: "Phải cách nhau ít nhất 5 tiếng giữa các chuyến",
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
    const totalMinutesExact = Math.floor(totalDuration.asMinutes());
    const hours = Math.floor(totalMinutesExact / 60);
    const minutes = totalMinutesExact % 60; // Sẽ cho kết quả chính xác

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
  const directOverlapBookings: ExistingBooking[] = [];
  const bufferConflictBookings: ExistingBooking[] = [];

  const activeBookings = existingBookings.filter(
    (booking) => booking.status !== "CANCELLED"
  );

  const bufferRule = BUFFER_TIME_RULES[vehicleType];

  for (const booking of activeBookings) {
    const bookingStart = parseBackendTime(booking.startDate);
    const bookingEnd = parseBackendTime(booking.endDate);

    // Kiểm tra overlap trực tiếp
    const hasDirectOverlap =
      newStartDate.isBefore(bookingEnd) && newEndDate.isAfter(bookingStart);

    if (hasDirectOverlap) {
      directOverlapBookings.push(booking);
      conflictBookings.push(booking);
      continue;
    }

    // Kiểm tra buffer time cho xe máy/xe đạp
    if (bufferRule.type === "HOURS" && "hours" in bufferRule) {
      const bufferHours = bufferRule.hours;

      // CASE 1: New booking SAU existing booking
      const gapAfterExisting = newStartDate.diff(bookingEnd, "hour", true);

      // CASE 2: New booking TRƯỚC existing booking
      const gapBeforeExisting = bookingStart.diff(newEndDate, "hour", true);

      // Conflict nếu khoảng cách < 5h (ở cả 2 phía)
      if (
        (gapAfterExisting >= 0 && gapAfterExisting < bufferHours) ||
        (gapBeforeExisting >= 0 && gapBeforeExisting < bufferHours)
      ) {
        bufferConflictBookings.push(booking);
        conflictBookings.push(booking);
      }
    }
  }

  let message = "";
  if (conflictBookings.length > 0) {
    // Ưu tiên thông báo overlap trực tiếp
    if (directOverlapBookings.length > 0) {
      message = "Xe đã được đặt trong khoảng thời gian này";
    } else if (bufferConflictBookings.length > 0) {
      if (bufferRule.type === "HOURS" && "hours" in bufferRule) {
        message = `Phải cách nhau ít nhất ${bufferRule.hours} giờ giữa các chuyến thuê`;
      }
    } else if (bufferRule.type === "FULL_DAY") {
      message = "Xe không khả dụng trong ngày này";
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
 * Updated: Disable ngày cho xe máy/xe đạp khi TẤT CẢ 24 giờ đều bị chặn
 */
export const isDateDisabled = (
  date: Dayjs,
  vehicleType: VehicleType,
  existingBookings: ExistingBooking[],
  openTime: string,
  closeTime: string
): boolean => {
  const today = dayjs().startOf("day");
  const dateStr = date.format("YYYY-MM-DD");

  // Disable ngày trong quá khứ
  if (date.isBefore(today)) {
    return true;
  }

  // Lọc booking active
  const activeBookings = existingBookings.filter(
    (booking) => booking.status !== "CANCELLED"
  );

  // Với xe hơi: giữ nguyên logic cũ
  if (vehicleType === "CAR") {
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
    return false;
  }

  // Với xe máy/xe đạp: Chỉ disable khi TẤT CẢ 24 giờ đều bị chặn
  if (vehicleType === "MOTORBIKE" || vehicleType === "BICYCLE") {
    const bufferHours = BUFFER_TIME_RULES[vehicleType].hours || 5;

    // Parse giờ hoạt động với helper function
    const { hour: openHour, minute: openMinute } = parseTimeString(openTime);
    const { hour: closeHour, minute: closeMinute } = parseTimeString(closeTime);

    // Check if 24h operation
    const is24h =
      openHour === 0 &&
      openMinute === 0 &&
      closeHour === 0 &&
      closeMinute === 0;

    // Tạo array boolean cho 24 giờ - true = bị chặn, false = available
    const hourBlockStatus = new Array(24).fill(false);

    // Đánh dấu giờ ngoài giờ hoạt động là bị chặn (nếu không phải 24h)
    if (!is24h) {
      for (let hour = 0; hour < 24; hour++) {
        let isOutsideOperatingHours = false;

        if (
          closeHour > openHour ||
          (closeHour === openHour && closeMinute > openMinute)
        ) {
          // Giờ hoạt động trong cùng ngày (VD: 07:00 - 20:30)
          if (hour < openHour || hour > closeHour) {
            isOutsideOperatingHours = true;
          } else if (hour === closeHour && closeMinute < 60) {
            // Giờ cuối cùng nhưng đóng cửa trước khi hết giờ (ví dụ 20:30)
            // Chỉ block nếu closeMinute = 0 (đóng cửa lúc đầu giờ)
            if (closeMinute === 0) {
              isOutsideOperatingHours = true;
            }
          }
        } else {
          // Giờ hoạt động qua đêm (VD: 22:00 - 02:30)
          if (hour > closeHour && hour < openHour) {
            isOutsideOperatingHours = true;
          } else if (hour === closeHour && closeMinute === 0) {
            isOutsideOperatingHours = true;
          }
        }

        if (isOutsideOperatingHours) {
          hourBlockStatus[hour] = true;
        }
      }
    }

    // Đánh dấu giờ bị chặn bởi bookings
    for (const booking of activeBookings) {
      const bookingStart = parseBackendTime(booking.startDate);
      const bookingEnd = parseBackendTime(booking.endDate);

      // Tính thời gian chặn: từ (bookingStart - buffer) đến (bookingEnd + buffer)
      const blockStart = bookingStart.subtract(bufferHours, "hour"); // Thêm dòng này
      const blockEnd = bookingEnd.add(bufferHours, "hour");

      // Đánh dấu các giờ bị chặn trong ngày hiện tại
      for (let hour = 0; hour < 24; hour++) {
        const checkTime = date.hour(hour).minute(0).second(0);
        const checkTimeEnd = checkTime.add(1, "hour");

        // Kiểm tra overlap với khoảng bị chặn (đã bao gồm cả buffer 2 phía)
        if (
          (checkTime.isSameOrAfter(blockStart) &&
            checkTime.isBefore(blockEnd)) ||
          (checkTimeEnd.isAfter(blockStart) &&
            checkTimeEnd.isSameOrBefore(blockEnd)) ||
          (checkTime.isSameOrBefore(blockStart) &&
            checkTimeEnd.isSameOrAfter(blockEnd))
        ) {
          hourBlockStatus[hour] = true;
        }
      }
    }

    // Kiểm tra buffer time từ booking ngày hôm trước
    const previousDay = date.subtract(1, "day");
    for (const booking of activeBookings) {
      const bookingEnd = parseBackendTime(booking.endDate);

      // Nếu booking kết thúc vào ngày hôm trước
      if (
        bookingEnd.format("YYYY-MM-DD") === previousDay.format("YYYY-MM-DD")
      ) {
        const bufferEndTime = bookingEnd.add(bufferHours, "hour");

        // Nếu buffer time kéo sang ngày hiện tại
        if (bufferEndTime.isAfter(date.startOf("day"))) {
          // Đánh dấu các giờ bị ảnh hưởng
          const hoursAffected = Math.min(
            24,
            bufferEndTime.diff(date.startOf("day"), "hour", true)
          );
          for (let h = 0; h < Math.ceil(hoursAffected); h++) {
            hourBlockStatus[h] = true;
          }
        }
      }
    }

    // Debug log (có thể comment out trong production)
    const blockedCount = hourBlockStatus.filter((blocked) => blocked).length;
    if (blockedCount > 20) {
      // Chỉ log khi gần full
      console.log(`Date ${dateStr} - Blocked hours: ${blockedCount}/24`);
    }

    // CHỈ disable ngày khi TẤT CẢ 24 giờ đều bị chặn
    const allHoursBlocked = hourBlockStatus.every((blocked) => blocked);

    return allHoursBlocked;
  }

  // Xe máy/xe đạp: không disable ngày, chỉ disable giờ
  return false;
};

/**
 * Tạo disabledTime function cho RangePicker
 */
export const createDisabledTimeFunction = (
  vehicleType: VehicleType,
  existingBookings: ExistingBooking[],
  openTime: string,
  closeTime: string
): ((current: Dayjs | null) => {
  disabledHours: () => number[];
  disabledMinutes: (selectedHour: number) => number[];
}) => {
  // Parse time với helper function
  const { hour: openHour, minute: openMinute } = parseTimeString(openTime);
  const { hour: closeHour, minute: closeMinute } = parseTimeString(closeTime);

  const is24h =
    openHour === 0 && openMinute === 0 && closeHour === 0 && closeMinute === 0;

  // Cache parsed bookings để tối ưu performance
  const parsedBookings = existingBookings
    .filter((booking) => booking.status !== "CANCELLED")
    .map((booking) => ({
      ...booking,
      parsedStart: parseBackendTime(booking.startDate),
      parsedEnd: parseBackendTime(booking.endDate),
    }));

  return (current: Dayjs | null) => {
    if (!current) {
      return {
        disabledHours: () => [],
        disabledMinutes: () => [],
      };
    }

    const disabledHours: number[] = [];
    const today = dayjs();
    const isToday = current.isSame(today, "day");
    const currentHour = today.hour();
    const selectedDateStr = current.format("YYYY-MM-DD");

    // Disable past hours for today
    if (isToday) {
      for (let h = 0; h <= currentHour; h++) {
        disabledHours.push(h);
      }
    }

    if (is24h) {
      // Xử lý cho trường hợp hoạt động 24/7
      if (vehicleType === "CAR") {
        // Xe hơi: chặn toàn bộ ngày nếu có booking
        if (
          isDateDisabled(
            current,
            vehicleType,
            existingBookings,
            openTime,
            closeTime
          )
        ) {
          for (let h = 0; h < 24; h++) {
            if (!disabledHours.includes(h)) {
              disabledHours.push(h);
            }
          }
        }
      } else {
        // Xe máy/xe đạp: chặn từ (bookingStart - buffer) đến (bookingEnd + buffer)
        const bufferHours = BUFFER_TIME_RULES[vehicleType].hours || 5;

        for (const booking of parsedBookings) {
          const { parsedStart: bookingStart, parsedEnd: bookingEnd } = booking;

          // Chặn toàn bộ khoảng: (bookingStart - buffer) đến (bookingEnd + buffer)
          const blockStart = bookingStart.subtract(bufferHours, "hour"); // ✅ SỬA
          const blockEnd = bookingEnd.add(bufferHours, "hour");

          let currentTime = blockStart.clone();
          while (currentTime.isSameOrBefore(blockEnd)) {
            if (currentTime.format("YYYY-MM-DD") === selectedDateStr) {
              const hour = currentTime.hour();
              // Chỉ chặn trong giờ hoạt động
              if (
                !disabledHours.includes(hour) &&
                hour >= openHour &&
                hour <= closeHour
              ) {
                disabledHours.push(hour);
              }
            }
            currentTime = currentTime.add(1, "hour");
          }
        }
      }
    } else {
      // Xử lý cho trường hợp có giờ hoạt động cụ thể

      // Disable giờ ngoài giờ hoạt động
      for (let h = 0; h < 24; h++) {
        if (h < openHour || h > closeHour) {
          if (!disabledHours.includes(h)) {
            disabledHours.push(h);
          }
        }
      }

      if (vehicleType === "CAR") {
        // Xe hơi: chặn toàn bộ ngày nếu có booking
        if (
          isDateDisabled(
            current,
            vehicleType,
            existingBookings,
            openTime,
            closeTime
          )
        ) {
          for (let h = openHour; h <= closeHour; h++) {
            if (!disabledHours.includes(h)) {
              disabledHours.push(h);
            }
          }
        }
      } else {
        // Xe máy/xe đạp: chặn từ (bookingStart - buffer) đến (bookingEnd + buffer)
        const bufferHours = BUFFER_TIME_RULES[vehicleType].hours || 5;

        for (const booking of parsedBookings) {
          const { parsedStart: bookingStart, parsedEnd: bookingEnd } = booking;

          // Chặn toàn bộ khoảng: (bookingStart - buffer) đến (bookingEnd + buffer)
          const blockStart = bookingStart.subtract(bufferHours, "hour");
          const blockEnd = bookingEnd.add(bufferHours, "hour");

          let currentTime = blockStart.clone();
          while (currentTime.isSameOrBefore(blockEnd)) {
            if (currentTime.format("YYYY-MM-DD") === selectedDateStr) {
              const hour = currentTime.hour();
              // Chỉ chặn trong giờ hoạt động
              if (
                !disabledHours.includes(hour) &&
                hour >= openHour &&
                hour <= closeHour
              ) {
                disabledHours.push(hour);
              }
            }
            currentTime = currentTime.add(1, "hour");
          }
        }
      }
    }

    return {
      disabledHours: () => {
        const uniqueHours = [...new Set(disabledHours)].sort((a, b) => a - b);
        console.log(
          `Disabled hours for ${selectedDateStr} (${vehicleType}):`,
          uniqueHours
        );
        return uniqueHours;
      },
      disabledMinutes: (selectedHour: number) => {
        // Chỉ cho phép phút 0 và 30
        const allowedMinutes = [0, 30];
        const baseDisabledMinutes = Array.from(
          { length: 60 },
          (_, i) => i
        ).filter((minute) => !allowedMinutes.includes(minute));

        // Xử lý giới hạn phút cho giờ mở/đóng cửa (chỉ khi không phải 24h)
        if (!is24h) {
          // Nếu là giờ mở cửa, disable phút trước openMinute
          if (selectedHour === openHour && openMinute > 0) {
            const additionalDisabled = Array.from(
              { length: openMinute },
              (_, i) => i
            ).filter((minute) => !baseDisabledMinutes.includes(minute));
            return [
              ...new Set([...baseDisabledMinutes, ...additionalDisabled]),
            ].sort((a, b) => a - b);
          }

          // Nếu là giờ đóng cửa, disable phút sau closeMinute
          if (selectedHour === closeHour && closeMinute < 60) {
            const additionalDisabled = Array.from(
              { length: 60 - closeMinute },
              (_, i) => closeMinute + i
            ).filter((minute) => !baseDisabledMinutes.includes(minute));
            return [
              ...new Set([...baseDisabledMinutes, ...additionalDisabled]),
            ].sort((a, b) => a - b);
          }
        }

        return baseDisabledMinutes.sort((a, b) => a - b);
      },
    };
  };
};

/**
 * Helper function để kiểm tra và log chi tiết các giờ bị chặn (cho debugging)
 */
export const getBlockedHoursDetail = (
  date: Dayjs,
  vehicleType: VehicleType,
  existingBookings: ExistingBooking[],
  openTime: string = "00:00:00",
  closeTime: string = "00:00:00"
): {
  blockedHours: number[];
  availableHours: number[];
  totalBlocked: number;
  isFullyBlocked: boolean;
  details: string[];
} => {
  const blockedHours: number[] = [];
  const availableHours: number[] = [];
  const details: string[] = [];

  if (vehicleType === "MOTORBIKE" || vehicleType === "BICYCLE") {
    const bufferHours = BUFFER_TIME_RULES[vehicleType].hours || 5;
    const { hour: openHour, minute: openMinute } = parseTimeString(openTime);
    const { hour: closeHour, minute: closeMinute } = parseTimeString(closeTime);
    const is24h =
      openHour === 0 &&
      openMinute === 0 &&
      closeHour === 0 &&
      closeMinute === 0;

    const hourBlockStatus = new Array(24).fill(false);
    const blockReasons: { [key: number]: string[] } = {};

    // Initialize block reasons
    for (let i = 0; i < 24; i++) {
      blockReasons[i] = [];
    }

    // Mark non-operating hours
    if (!is24h) {
      for (let hour = 0; hour < 24; hour++) {
        if (closeHour > openHour) {
          if (hour < openHour || hour > closeHour) {
            hourBlockStatus[hour] = true;
            blockReasons[hour].push("Ngoài giờ hoạt động");
          }
        } else {
          if (hour >= closeHour && hour < openHour) {
            hourBlockStatus[hour] = true;
            blockReasons[hour].push("Ngoài giờ hoạt động");
          }
        }
      }
    }

    // Check bookings
    const activeBookings = existingBookings.filter(
      (b) => b.status !== "CANCELLED"
    );

    for (const booking of activeBookings) {
      const bookingStart = parseBackendTime(booking.startDate);
      const bookingEnd = parseBackendTime(booking.endDate);
      const blockStart = bookingStart.subtract(bufferHours, "hour");
      const blockEnd = bookingEnd.add(bufferHours, "hour");

      for (let hour = 0; hour < 24; hour++) {
        const checkTime = date.hour(hour).minute(0).second(0);

        // Kiểm tra buffer TRƯỚC booking
        if (
          checkTime.isSameOrAfter(blockStart) &&
          checkTime.isBefore(bookingStart)
        ) {
          hourBlockStatus[hour] = true;
          blockReasons[hour].push(`Buffer trước booking #${booking.id}`);
        }
        // Kiểm tra thời gian booking
        else if (
          checkTime.isSameOrAfter(bookingStart) &&
          checkTime.isBefore(bookingEnd)
        ) {
          hourBlockStatus[hour] = true;
          blockReasons[hour].push(`Booking #${booking.id}`);
        }
        // Kiểm tra buffer SAU booking
        else if (
          checkTime.isSameOrAfter(bookingEnd) &&
          checkTime.isBefore(blockEnd)
        ) {
          hourBlockStatus[hour] = true;
          blockReasons[hour].push(`Buffer sau booking #${booking.id}`);
        }
      }
    }

    // Collect results
    for (let hour = 0; hour < 24; hour++) {
      if (hourBlockStatus[hour]) {
        blockedHours.push(hour);
        if (blockReasons[hour].length > 0) {
          details.push(`${hour}h: ${blockReasons[hour].join(", ")}`);
        }
      } else {
        availableHours.push(hour);
      }
    }
  }

  return {
    blockedHours,
    availableHours,
    totalBlocked: blockedHours.length,
    isFullyBlocked: blockedHours.length === 24,
    details,
  };
};
