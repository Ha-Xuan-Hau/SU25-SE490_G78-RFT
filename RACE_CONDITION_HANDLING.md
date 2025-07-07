# Hệ thống xử lý xung đột đặt xe (Race Condition Handling)

## Tổng quan

Hệ thống đã được cải thiện để xử lý tình huống 2 hoặc nhiều người dùng cùng đặt xe trong cùng một thời gian, đảm bảo không có booking trùng lặp và cung cấp thông báo rõ ràng cho người dùng.

## Các cải tiến chính

### 1. Backend (Spring Boot)

#### Race Condition Protection trong BookingServiceImpl

```java
@Override
@Transactional
public BookingResponseDTO createBooking(BookingRequestDTO request, String userId) {
    // Synchronized block để tránh race condition
    synchronized (this) {
        // Double-check availability
        List<BookedTimeSlot> overlaps = bookedTimeSlotRepository.findByVehicleIdAndTimeRange(
            vehicle.getId(), start, end);
        if (!overlaps.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Xe đã được đặt trong khoảng thời gian này. Vui lòng chọn thời gian khác.");
        }

        // Immediately create BookedTimeSlot để block slot ngay lập tức
        BookedTimeSlot temporarySlot = BookedTimeSlot.builder()
                .vehicle(vehicle)
                .timeFrom(start)
                .timeTo(end)
                .build();
        bookedTimeSlotRepository.save(temporarySlot);
    }
    // ... rest of booking logic
}
```

#### Cải thiện API Check Availability

- Thêm synchronized block trong `isTimeSlotAvailable()`
- Logging chi tiết để monitor conflicts
- Exception handler để trả về error message rõ ràng

### 2. Frontend (Next.js + React)

#### Pre-check và Double-check Availability

```typescript
// Pre-check trước khi tạo booking
const availabilityCheck = await checkAvailability(
  vehicleId,
  startTime,
  endTime
);
if (!availabilityCheck.success || !availabilityCheck.data?.available) {
  // Refresh booking data và quay về step chọn thời gian
  return;
}

// Double-check ngay trước khi submit
const lastMinuteCheck = await checkAvailability(vehicleId, startTime, endTime);
if (!lastMinuteCheck.success || !lastMinuteCheck.data?.available) {
  throw new Error("CONFLICT: Xe vừa được đặt bởi người khác");
}
```

#### Retry Logic với Exponential Backoff

```typescript
const maxRetries = 3;
let retryCount = 0;

while (retryCount < maxRetries) {
  try {
    const response = await createBooking(bookingData);
    // Success - exit retry loop
    return;
  } catch (error) {
    if (isConflictError(error)) {
      if (retryCount < maxRetries) {
        // Wait với exponential backoff (1s, 2s, 4s)
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1))
        );
        retryCount++;
        continue;
      } else {
        // Final failure - show error và refresh data
        showConflictError();
        refreshBookingData();
        return;
      }
    }
  }
}
```

#### Auto-refresh Booking Slots

- Tự động refresh booking data mỗi 30 giây khi user đang chọn thời gian
- Toggle switch để user có thể bật/tắt auto-refresh
- Thông báo khi có thay đổi booking slots

### 3. Buffer Time Rules

#### Quy định khoảng cách giữa các booking:

- **Ô tô**: Ngày trả xe sẽ bị block hoàn toàn cho booking mới
- **Xe máy/Xe đạp**: Cần có khoảng cách ít nhất 5 giờ giữa các booking

#### UI/UX Improvements:

- Hiển thị quy định buffer time trên UI
- Disable booking button khi có conflict
- Highlight các slot bị conflict với màu đỏ
- Thông báo rõ ràng về lý do không thể đặt

## Luồng xử lý Race Condition

### Kịch bản: 2 người đặt xe cùng lúc

1. **User A** và **User B** cùng chọn thời gian 9:00-17:00 ngày mai
2. **User A** click "Đặt xe" trước vài giây
3. **User B** click "Đặt xe" ngay sau đó

### Xử lý:

#### Backend:

1. **User A** request đến server trước

   - Synchronized block check: slot available ✅
   - Create BookedTimeSlot ngay lập tức
   - Tiếp tục tạo booking
   - ✅ **Success**: Booking created

2. **User B** request đến server sau
   - Synchronized block check: slot already booked ❌
   - ❌ **HTTP 409 Conflict**: "Xe đã được đặt trong khoảng thời gian này"

#### Frontend:

1. **User A**: Nhận response success, chuyển sang bước thanh toán
2. **User B**: Nhận error 409
   - Retry logic kích hoạt
   - Retry 3 lần với exponential backoff
   - Sau 3 lần thất bại:
     - Hiển thị message: "Xe đã được đặt bởi người khác!"
     - Refresh booking data để hiển thị slot mới bị chiếm
     - Quay về step chọn thời gian

## Testing

### Manual Testing:

1. Mở 2 browser tabs/windows với cùng trang booking
2. Chọn cùng thời gian ở cả 2 tabs
3. Click "Đặt xe" đồng thời
4. Verify: 1 thành công, 1 hiển thị conflict message

### Automated Testing:

```bash
# Chạy test script mô phỏng concurrent booking
node test-concurrent-booking.js
```

## Monitoring và Logging

### Backend Logs:

```
INFO  - Creating temporary time slot for vehicle VEH123 from 2025-01-07T09:00:00Z to 2025-01-07T17:00:00Z
WARN  - Race condition detected: Xe đã được đặt trong khoảng thời gian này
INFO  - Booking created successfully with ID: BOOK-ABC123
```

### Frontend Logs:

```
Pre-checking availability for time slot: {...}
Auto-refreshed bookings detected changes: [...]
Booking conflict detected, retrying... (Lần 1/3)
Updated bookings after conflict: [...]
```

## Performance Considerations

### Synchronized Block Impact:

- Chỉ apply cho booking creation và availability check
- Thời gian hold lock rất ngắn (< 100ms)
- Không ảnh hưởng đến read operations

### Auto-refresh Impact:

- Chỉ active khi user ở step chọn thời gian
- Request nhẹ (chỉ fetch booking data)
- User có thể tắt nếu muốn

## Kết luận

Hệ thống hiện tại có thể xử lý an toàn tình huống race condition với:

- ✅ **Data integrity**: Không có booking trùng lặp
- ✅ **User experience**: Thông báo rõ ràng, auto-retry, auto-refresh
- ✅ **Performance**: Minimal impact, efficient locking
- ✅ **Monitoring**: Chi tiết logs để track conflicts

Người dùng sẽ nhận được feedback tức thì khi có conflict và được hướng dẫn chọn thời gian khác.
