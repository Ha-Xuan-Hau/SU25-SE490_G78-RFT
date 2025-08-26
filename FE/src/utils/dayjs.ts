// utils/dayjs.ts
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

// Set default timezone
dayjs.tz.setDefault(VN_TIMEZONE);

export default dayjs;
export type { Dayjs } from "dayjs";
export const VN_TZ = VN_TIMEZONE;
