package com.rft.rft_be.constants;

public class WebSocketEvents {
    // Notification Events
    public static final String NOTIFICATION = "NOTIFICATION";
    public static final String NOTIFICATION_READ = "NOTIFICATION_READ";

    // Data Events
    public static final String DATA_UPDATE = "DATA_UPDATE";
    public static final String DATA_CREATED = "DATA_CREATED";
    public static final String DATA_DELETED = "DATA_DELETED";

    // Status Events
    public static final String STATUS_CHANGE = "STATUS_CHANGE";

    // Booking Events
    public static final String BOOKING_UPDATE = "BOOKING_UPDATE";
    public static final String BOOKING_STATUS_CHANGE = "BOOKING_STATUS_CHANGE";

    // Vehicle Events
    public static final String VEHICLE_UPDATE = "VEHICLE_UPDATE";
    public static final String VEHICLE_LOCATION = "VEHICLE_LOCATION";

    // Payment Events
    public static final String PAYMENT_UPDATE = "PAYMENT_UPDATE";
    public static final String WALLET_UPDATE = "WALLET_UPDATE";

    // System Events
    public static final String SYSTEM_ALERT = "SYSTEM_ALERT";
    public static final String SYSTEM_MAINTENANCE = "SYSTEM_MAINTENANCE";

    // Thêm các events mới cho admin
    public static final String ADMIN_RELOAD_DASHBOARD = "ADMIN_RELOAD_DASHBOARD";
    public static final String ADMIN_RELOAD_VEHICLES_PENDING = "ADMIN_RELOAD_VEHICLES_PENDING";
    public static final String ADMIN_RELOAD_WITHDRAWAL_REQUESTS = "ADMIN_RELOAD_WITHDRAWAL_REQUESTS";
    public static final String ADMIN_RELOAD_REPORTS = "ADMIN_RELOAD_REPORTS";
    public static final String ADMIN_RELOAD_ALL = "ADMIN_RELOAD_ALL";
}
