import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

// Export cả dayjs instance và type Dayjs
export default dayjs;
export type { Dayjs };
