CREATE DATABASE IF NOT EXISTS `demo_rent2` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `demo_rent2`;

-- Table structure for table `users`
CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` nvarchar(100) DEFAULT NULL,
  `profile_picture` text,
  `date_of_birth` date DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` nvarchar(255) NOT NULL,
  `status` enum('ACTIVE','INACTIVE','TEMP_BANNED') DEFAULT 'ACTIVE',
  `role` enum('USER', 'PROVIDER' ,'STAFF','ADMIN') DEFAULT 'USER',
  `open_time` datetime DEFAULT NULL,
  `close_time` datetime DEFAULT NULL,
  `delivery_radius` INT DEFAULT NULL, -- km
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_register_vehicle` (
	`id` varchar(255) NOT NULL,
    `user_id` varchar(255) NOT NULL,
    `vehicle_type` varchar(50) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `user_register_vehicle_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `brands`
CREATE TABLE `brands` (
  `id` varchar(255) NOT NULL,
  `name` nvarchar(100) DEFAULT NULL,
  `vehicle_type` enum('CAR','MOTORBIKE') DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `models`
CREATE TABLE `models` (
  `id` varchar(255) NOT NULL,
  `name` nvarchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `penalties` (
  `id` varchar(225) NOT NULL,
  `penalty_type` ENUM('PERCENT', 'FIXED') NOT NULL,
  `penalty_value` decimal(10,2) DEFAULT NULL,
  `min_cancel_hour` int,
  `description` text,
  `user_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `penalties_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `vehicles`
CREATE TABLE `vehicles` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `brand_id` varchar(255) DEFAULT NULL,
  `model_id` varchar(255) DEFAULT NULL,
  `penalty_id` varchar(225) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `vehicle_type` enum('CAR','MOTORBIKE', 'BICYCLE') DEFAULT NULL,
  `vehicle_features` text,
  `vehicle_images` text,
  `have_driver` enum('YES', 'NO') DEFAULT 'NO',
  `insurance_status` enum('YES','NO') DEFAULT 'NO',
  `ship_to_address` enum('YES','NO') DEFAULT 'NO',
  `number_seat` int DEFAULT NULL,
  `year_manufacture` int DEFAULT NULL,
  `transmission` enum('MANUAL','AUTOMATIC') DEFAULT NULL,
  `fuel_type` enum('GASOLINE','ELECTRIC') DEFAULT NULL,
  `description` text,
  `number_vehicle` int DEFAULT 1,
  `cost_per_day` decimal(10,2) DEFAULT NULL,
  `status` enum('PENDING','AVAILABLE','UNAVAILABLE', 'SUSPENDED') DEFAULT 'PENDING',
  `thumb` text,
  `total_ratings` int DEFAULT '0',
  `likes` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `brand_id` (`brand_id`),
  KEY `model_id` (`model_id`),
  KEY `penalty_id` (`penalty_id`),
  CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `vehicles_ibfk_2` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `vehicles_ibfk_3` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`),
  CONSTRAINT `vehicles_ibfk_4` FOREIGN KEY (`penalty_id`) REFERENCES `penalties` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `extra_fee_rule
CREATE TABLE `extra_fee_rule` (
    `id` varchar(255) NOT NULL PRIMARY KEY COMMENT 'Khóa chính, UUID',
    `vehicle_id` CHAR(36) NOT NULL COMMENT 'Khóa ngoại đến bảng vehicle (xe áp dụng phụ phí)',

    -- Phí giới hạn & phụ phí
    `max_km_per_day` INT DEFAULT 0 COMMENT 'Giới hạn số km cho thuê mỗi ngày',
    `fee_per_extra_km` INT DEFAULT 0 COMMENT 'Phí (VNĐ) cho mỗi km vượt quá',
    `allowed_hour_late` INT DEFAULT 0 COMMENT 'Số giờ cho phép trả trễ',
    `fee_per_extra_hour` INT DEFAULT 0 COMMENT 'Phí (VNĐ) cho mỗi giờ trễ',

    -- Phí vệ sinh và khử mùi
    `cleaning_fee` INT DEFAULT 0 COMMENT 'Phí vệ sinh nếu xe bẩn',
    `smell_removal_fee` INT DEFAULT 0 COMMENT 'Phí khử mùi nếu xe bị ám mùi',

    -- Phí sạc pin (xe điện)
    `battery_charge_fee_per_percent` INT DEFAULT 0 COMMENT 'Phí (VNĐ) cho mỗi 1% pin cần sạc',
    `apply_battery_charge_fee` BOOLEAN DEFAULT FALSE COMMENT 'TRUE nếu là xe điện, cần tính phí sạc',

    -- Phí tài xế
    `driver_fee_per_day` INT DEFAULT 0 COMMENT 'Phí thuê tài xế mỗi ngày (nếu có)',
    `has_driver_option` BOOLEAN DEFAULT FALSE COMMENT 'TRUE nếu xe có hỗ trợ tài xế',

    -- Giá thuê theo giờ
    `driver_fee_per_hour` INT DEFAULT 0 COMMENT 'Giá thuê theo giờ (nếu có)',
    `has_hourly_rental` BOOLEAN DEFAULT FALSE COMMENT 'TRUE nếu xe có thể thuê theo giờ',

    -- Ràng buộc
    CONSTRAINT `fk_extra_fee_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`)
);

-- Table structure for table `driver_licenses`
CREATE TABLE `driver_licenses` (
  `id` varchar(225) NOT NULL,
  `user_id` varchar(225) DEFAULT NULL,
  `license_number` nvarchar(50) DEFAULT NULL,
  `class` nvarchar(20) DEFAULT NULL,
  `status` enum('VALID','EXPIRED') DEFAULT 'VALID',
  `image` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `driver_licenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `coupons`
CREATE TABLE `coupons` (
  `id` varchar(225) NOT NULL,
  `name` nvarchar(100) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT NULL,
  `description` text,
  `time_expired` datetime DEFAULT NULL,
  `status` enum('VALID','EXPIRED') DEFAULT 'VALID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `used_coupons`
CREATE TABLE `used_coupons` (
  `id` varchar(225) NOT NULL,
  `user_id` varchar(225) NOT NULL,
  `coupon_id` varchar(225) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `coupon_id` (`coupon_id`),
  CONSTRAINT `used_coupons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `used_coupons_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `bookings`
CREATE TABLE `bookings` (
  `id` varchar(225) NOT NULL,
  `user_id` varchar(225) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` text,
  `time_booking_start` datetime DEFAULT NULL,
  `time_booking_end` datetime DEFAULT NULL,
  `code_transaction` varchar(100) DEFAULT NULL,
  `time_transaction` datetime DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `status` enum('UNPAID','PENDING','CONFIRMED','CANCELLED','DELIVERED','RECEIVED_BY_CUSTOMER','RETURNED','COMPLETED') DEFAULT 'UNPAID',
  `penalty_type` ENUM('PERCENT', 'FIXED') NOT NULL,
  `penalty_value` decimal(10,2) DEFAULT NULL,
  `min_cancel_hour` int,
  `coupon_id` varchar(225) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `coupon_id` (`coupon_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `booking_details` (
  `id` varchar(225) NOT NULL,
  `booking_id` varchar(225) NOT NULL,
  `vehicle_id` varchar(225) NOT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `driver_fee` decimal(10,2) DEFAULT NULL, -- 💡 Phí thuê tài xế cho xe này (nếu có)
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `booking_details_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_details_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `user_report` (
    `id` varchar(255) NOT NULL,
    `reporter_id` varchar(255) NOT NULL,      -- Người thực hiện report
    `reported_id` varchar(255) NOT NULL, -- id(có thể là id người dùng, id xe) bị report
    `type` VARCHAR(50) NOT NULL,        -- Loại report (spam, lừa đảo, ngôn từ kích động,...)
    `reason` TEXT NOT NULL,             -- Mô tả lý do chi tiết
    `evidence_url` text,                       -- URL cho ảnh/video bằng chứng nếu có
    `booking_id` varchar(225) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
	
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
) COMMENT = 'Lưu các lần người dùng bị report, phân loại theo type';


-- Table structure for table `contracts`
CREATE TABLE `contracts` (
  `id` varchar(225) NOT NULL,
  `booking_id` varchar(225) DEFAULT NULL,
  `user_id` varchar(225) DEFAULT NULL,
  `image` text,
  `status` enum('PROCESSING', 'RENTING', 'FINISHED','CANCELLED') DEFAULT 'PROCESSING',
  `cost_settlement` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `contracts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `final_contracts`
CREATE TABLE `final_contracts` (
  `id` varchar(225) NOT NULL,
  `contract_id` varchar(225) DEFAULT NULL,
  `user_id` varchar(225) DEFAULT NULL,
  `image` text,
  `time_finish` datetime DEFAULT NULL,
  `cost_settlement` decimal(10,2) DEFAULT NULL,
  `note` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `contract_id` (`contract_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `final_contracts_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`),
  CONSTRAINT `final_contracts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `ratings`
CREATE TABLE `ratings` (
  `id` varchar(225) NOT NULL,
  `user_id` varchar(225) DEFAULT NULL,
  `vehicle_id` varchar(225) DEFAULT NULL,
  `booking_id` varchar(225) DEFAULT NULL,
  `comment` text,
  `star` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
  CONSTRAINT `ratings_ibfk_3` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `ratings_chk_1` CHECK ((`star` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `booked_time_slots`
CREATE TABLE `booked_time_slots` (
  `id` varchar(225) NOT NULL,
  `vehicle_id` varchar(225) DEFAULT NULL,
  `time_from` datetime DEFAULT NULL,
  `time_to` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `booked_time_slots_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `wallet`
CREATE TABLE `wallets` (
  `id` varchar(225) NOT NULL,
  `user_id` varchar(225) DEFAULT NULL,
  `balance` decimal(18,2) DEFAULT 0,
  `bank_account_number` VARCHAR(50),
  `bank_account_name` VARCHAR(100),
  `bank_account_type` VARCHAR(30),
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `wallet_transactions` (
  `id` varchar(225) NOT NULL,
  `wallet_id` varchar(225) DEFAULT NULL,
  `amount` decimal(18,2) DEFAULT 0,
  `status` enum('PENDING','PROCESSING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  `user_id` varchar(225) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wallet_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  KEY `wallet_id` (`user_id`),
  CONSTRAINT `wallet_transactions_ibfk_2` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `wallet`
CREATE TABLE `notifications` (
  `id` varchar(255) NOT NULL,
  `type` enum('BOOKING', 'REPORT', 'SYSTEM') NOT NULL,
  `message` text NOT NULL,
  `is_read` boolean DEFAULT FALSE,
  `is_deleted` boolean DEFAULT FALSE,
  `receiver_id` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Sample data for demo_rent2 database
USE demo_rent2;

-- Insert sample users
INSERT INTO `users` (`id`, `email`, `password`, `full_name`, `profile_picture`, `date_of_birth`, `phone`, `address`, `status`, `role`, `open_time`, `close_time`, `delivery_radius`, `created_at`, `updated_at`) VALUES
-- Provider 1 (Car rental)
('user_005', 'hauvs789@gmail.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Nguyễn Văn An', 'https://example.com/avatar1.jpg', '1985-03-15', '0912345678', '123 Đường Lê Lợi, Quận 1, TP.HCM', 'ACTIVE', 'ADMIN', NULL, NULL, NULL, '2024-01-15 09:30:00', '2025-07-01 14:20:00'),
-- Provider 1 (Car rental)
('user_001', 'provider.cars@gmail.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Nguyễn Văn An', 'https://example.com/avatar1.jpg', '1985-03-15', '0912345678', '123 Đường Lê Lợi, Quận 1, TP.HCM', 'ACTIVE', 'PROVIDER','2024-01-15 00:00:00' ,'2024-01-15 20:30:00' , 10, '2024-01-15 09:30:00', '2025-07-01 14:20:00'),
-- Provider 2 (Motorbike + Bicycle rental)
('user_002', 'provider.bikes@gmail.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Trần Thị Bình', 'https://example.com/avatar2.jpg', '1990-07-22', '0987654321', '456 Đường Nguyễn Huệ, Quận 3, TP.HCM', 'ACTIVE', 'PROVIDER', '2024-01-15 00:00:00' ,'2024-01-15 20:30:00', 5, '2024-02-20 10:45:00', '2025-07-02 16:30:00'),
-- Regular user
('user_003', 'customer@gmail.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Lê Văn Cường', 'https://example.com/avatar3.jpg', '1995-12-10', '0901234567', '789 Đường Võ Văn Tần, Quận 5, TP.HCM', 'ACTIVE', 'USER', NULL, NULL, NULL, '2024-05-10 13:15:00', '2025-07-03 11:45:00'),
('user_004', 'customer2@gmail.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Lê Xuân Hường', 'https://example.com/avatar3.jpg', '1995-12-10', '0901234567', '789 Đường Võ Văn Tần, Quận 5, TP.HCM', 'ACTIVE', 'USER', NULL, NULL, NULL, '2024-05-10 13:15:00', '2025-07-03 11:45:00');
-- Insert user vehicle registrations
INSERT INTO `user_register_vehicle` (`id`, `user_id`, `vehicle_type`) VALUES
('reg_001', 'user_001', 'CAR'),
('reg_002', 'user_002', 'MOTORBIKE'),
('reg_003', 'user_002', 'BICYCLE');

-- Insert brands (updated with surveyed data)
INSERT INTO `brands` (`id`, `name`, `vehicle_type`, `created_at`, `updated_at`) VALUES
-- Car brands
('brand-001', 'Toyota', 'CAR', '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('brand-002', 'Honda', 'CAR', '2024-01-01 08:15:00', '2024-01-01 08:15:00'),
('brand-003', 'Hyundai', 'CAR', '2024-01-01 08:30:00', '2024-01-01 08:30:00'),
('brand-004', 'Kia', 'CAR', '2024-01-01 08:45:00', '2024-01-01 08:45:00'),
('brand-005', 'Mazda', 'CAR', '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
('brand-006', 'Ford', 'CAR', '2024-01-01 09:15:00', '2024-01-01 09:15:00'),
('brand-007', 'Vinfast', 'CAR', '2024-01-01 09:30:00', '2024-01-01 09:30:00'),
('brand-008', 'BMW', 'CAR', '2024-01-01 09:45:00', '2024-01-01 09:45:00'),
('brand-009', 'Mercedes', 'CAR', '2024-01-01 10:00:00', '2024-01-01 10:00:00'),
('brand-010', 'Audi', 'CAR', '2024-01-01 10:15:00', '2024-01-01 10:15:00'),
('brand-011', 'Acura', 'CAR', '2024-01-01 10:30:00', '2024-01-01 10:30:00'),
('brand-012', 'Baic', 'CAR', '2024-01-01 10:45:00', '2024-01-01 10:45:00'),
('brand-013', 'BYD', 'CAR', '2024-01-01 11:00:00', '2024-01-01 11:00:00'),
('brand-014', 'Chevrolet', 'CAR', '2024-01-01 11:15:00', '2024-01-01 11:15:00'),
('brand-015', 'Daewoo', 'CAR', '2024-01-01 11:30:00', '2024-01-01 11:30:00'),
('brand-016', 'Isuzu', 'CAR', '2024-01-01 11:45:00', '2024-01-01 11:45:00'),
('brand-017', 'Land Rover', 'CAR', '2024-01-01 12:00:00', '2024-01-01 12:00:00'),
('brand-018', 'Lexus', 'CAR', '2024-01-01 12:15:00', '2024-01-01 12:15:00'),
('brand-019', 'Mitsubishi', 'CAR', '2024-01-01 12:30:00', '2024-01-01 12:30:00'),
('brand-020', 'Morris Garages', 'CAR', '2024-01-01 12:45:00', '2024-01-01 12:45:00'),
('brand-021', 'Nissan', 'CAR', '2024-01-01 13:00:00', '2024-01-01 13:00:00'),
('brand-022', 'Peugeot', 'CAR', '2024-01-01 13:15:00', '2024-01-01 13:15:00'),
('brand-023', 'Renault', 'CAR', '2024-01-01 13:30:00', '2024-01-01 13:30:00'),
('brand-024', 'Subaru', 'CAR', '2024-01-01 13:45:00', '2024-01-01 13:45:00'),
('brand-025', 'Suzuki', 'CAR', '2024-01-01 14:00:00', '2024-01-01 14:00:00'),
('brand-026', 'Volkswagen', 'CAR', '2024-01-01 14:15:00', '2024-01-01 14:15:00'),
('brand-027', 'Wuling', 'CAR', '2024-01-01 14:30:00', '2024-01-01 14:30:00'),
('brand-028', 'Zotye', 'CAR', '2024-01-01 14:45:00', '2024-01-01 14:45:00'),
-- Motorbike brands
('brand-101', 'Honda', 'MOTORBIKE', '2024-01-01 15:00:00', '2024-01-01 15:00:00'),
('brand-102', 'Yamaha', 'MOTORBIKE', '2024-01-01 15:15:00', '2024-01-01 15:15:00'),
('brand-103', 'Suzuki', 'MOTORBIKE', '2024-01-01 15:30:00', '2024-01-01 15:30:00'),
('brand-104', 'Piaggio', 'MOTORBIKE', '2024-01-01 15:45:00', '2024-01-01 15:45:00'),
('brand-105', 'Vespa', 'MOTORBIKE', '2024-01-01 16:00:00', '2024-01-01 16:00:00'),
('brand-106', 'SYM', 'MOTORBIKE', '2024-01-01 16:15:00', '2024-01-01 16:15:00'),
('brand-107', 'VinFast', 'MOTORBIKE', '2024-01-01 16:30:00', '2024-01-01 16:30:00'),
('brand-108', 'Kymco', 'MOTORBIKE', '2024-01-01 16:45:00', '2024-01-01 16:45:00'),
('brand-109', 'Ducati', 'MOTORBIKE', '2024-01-01 17:00:00', '2024-01-01 17:00:00'),
('brand-110', 'BMW Motorrad', 'MOTORBIKE', '2024-01-01 17:15:00', '2024-01-01 17:15:00'),
('brand-111', 'Harley-Davidson', 'MOTORBIKE', '2024-01-01 17:30:00', '2024-01-01 17:30:00'),
('brand-112', 'Triumph', 'MOTORBIKE', '2024-01-01 17:45:00', '2024-01-01 17:45:00'),
('brand-113', 'Royal Enfield', 'MOTORBIKE', '2024-01-01 18:00:00', '2024-01-01 18:00:00'),
('brand-114', 'Kawasaki', 'MOTORBIKE', '2024-01-01 18:15:00', '2024-01-01 18:15:00');

-- Insert models (updated with surveyed data, for cars only)
INSERT INTO `models` (`id`, `name`, `created_at`, `updated_at`) VALUES
('model-001', '4 chỗ (Mini)', '2024-01-01 10:00:00', '2024-01-01 10:00:00'),
('model-002', '4 chỗ (Sedan)', '2024-01-01 10:05:00', '2024-01-01 10:05:00'),
('model-003', '5 chỗ (CUV Gầm cao)', '2024-01-01 10:10:00', '2024-01-01 10:10:00'),
('model-004', '7 chỗ (SUV gầm cao)', '2024-01-01 10:15:00', '2024-01-01 10:15:00'),
('model-005', '7 chỗ (MPV gầm thấp)', '2024-01-01 10:20:00', '2024-01-01 10:20:00'),
('model-006', 'Bán tải', '2024-01-01 10:25:00', '2024-01-01 10:25:00'),
('model-007', 'Minivan', '2024-01-01 10:30:00', '2024-01-01 10:30:00');

-- Insert penalties for providers
INSERT INTO `penalties` (`id`, `penalty_type`, `penalty_value`, `min_cancel_hour`, `description`, `user_id`) VALUES
('penalty_001', 'PERCENT', 10.00, 24, 'Phạt 10% nếu hủy trong vòng 24 giờ', 'user_001'),
('penalty_002', 'FIXED', 50000.00, 12, 'Phạt 50,000 VNĐ nếu hủy trong vòng 12 giờ', 'user_002');

-- Insert wallets for all users
INSERT INTO `wallets` (`id`, `user_id`, `balance`, `bank_account_number`, `bank_account_name`, `bank_account_type`, `created_at`, `updated_at`) VALUES
('wallet_001', 'user_001', 5000000.00, '1234567890', 'NGUYEN VAN AN', 'VIETCOMBANK', '2024-01-15 10:00:00', '2025-07-06 15:30:00'),
('wallet_002', 'user_002', 3000000.00, '0987654321', 'TRAN THI BINH', 'TECHCOMBANK', '2024-02-20 11:00:00', '2025-07-06 16:45:00'),
('wallet_003', 'user_003', 1500000.00, '1122334455', 'LE VAN CUONG', 'BIDV', '2024-05-10 14:00:00', '2025-07-06 12:20:00');

-- Insert driver licenses
INSERT INTO `driver_licenses` (`id`, `user_id`, `license_number`, `class`, `status`, `image`, `created_at`, `updated_at`) VALUES
('license_001', 'user_001', 'B1-12345678', 'B1', 'VALID', 'https://example.com/license1.jpg', '2024-01-15 14:30:00', '2025-01-15 14:30:00'),
('license_002', 'user_002', 'A1-87654321', 'A1', 'VALID', 'https://example.com/license2.jpg', '2024-02-20 15:45:00', '2025-02-20 15:45:00'),
('license_003', 'user_003', 'B2-11223344', 'B2', 'VALID', 'https://example.com/license3.jpg', '2024-05-10 16:20:00', '2025-05-10 16:20:00');

-- Insert vehicles for Provider 1 (10 cars, updated with new brand_id, model_id, and vehicle_images)
INSERT INTO vehicles (id, user_id, brand_id, model_id, penalty_id, license_plate, vehicle_type, vehicle_features, vehicle_images, have_driver, insurance_status, ship_to_address, number_seat, year_manufacture, transmission, fuel_type, description, number_vehicle, cost_per_day, status, thumb, total_ratings, likes, created_at, updated_at) VALUES
('vehicle_001', 'user_001', 'brand-001', 'model-002', 'penalty_001', '51A-12345', 'CAR', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 5, 2020, 'AUTOMATIC', 'GASOLINE', 'Toyota Camry 2020, xe sedan sang trọng, tiết kiệm nhiên liệu', 1, 800000.00, 'AVAILABLE', 'Toyota Camry 2020', 15, 8, '2024-01-16 09:00:00', '2025-07-05 10:15:00'),
('vehicle_002', 'user_001', 'brand-001', 'model-002', 'penalty_001', '51A-12346', 'CAR', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 5, 2019, 'MANUAL', 'GASOLINE', 'Toyota Vios 2019, xe sedan tiết kiệm, phù hợp gia đình', 1, 600000.00, 'AVAILABLE', 'Toyota Vios 2019', 12, 5, '2024-01-16 09:30:00', '2025-07-05 11:20:00'),
('vehicle_003', 'user_001', 'brand-002', 'model-002', 'penalty_001', '51A-12347', 'CAR', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 5, 2021, 'AUTOMATIC', 'GASOLINE', 'Honda Civic 2021, xe sedan thể thao, động cơ mạnh mẽ', 1, 750000.00, 'AVAILABLE', 'Honda Civic 2021', 20, 12, '2024-01-16 10:00:00', '2025-07-05 14:30:00'),
('vehicle_004', 'user_001', 'brand-002', 'model-002', 'penalty_001', '51A-12348', 'CAR', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 5, 2020, 'AUTOMATIC', 'GASOLINE', 'Honda City 2020, xe sedan compact, dễ lái', 1, 650000.00, 'AVAILABLE', 'Honda Civic 2020', 8, 3, '2024-01-16 10:30:00', '2025-07-05 15:45:00'),
('vehicle_005', 'user_001', 'brand-003', 'model-002', 'penalty_001', '51A-12349', 'CAR', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 5, 2021, 'AUTOMATIC', 'GASOLINE', 'Hyundai Elantra 2021, xe sedan thiết kế hiện đại', 1, 700000.00, 'AVAILABLE', 'Hyundai Elantra 2021', 10, 6, '2024-01-16 11:00:00', '2025-07-05 16:10:00'),
('vehicle_006', 'user_001', 'brand-003', 'model-002', 'penalty_001', '51A-12350', 'CAR', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 5, 2019, 'MANUAL', 'GASOLINE', 'Hyundai Accent 2019, xe sedan nhỏ gọn, tiết kiệm', 1, 550000.00, 'AVAILABLE', 'Hyundai Accent 2019', 7, 2, '2024-01-16 11:30:00', '2025-07-05 17:20:00'),
('vehicle_007', 'user_001', 'brand-005', 'model-004', 'penalty_001', '51A-12351', 'CAR', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 7, 2020, 'AUTOMATIC', 'GASOLINE', 'Mazda CX-5 2020, SUV 7 chỗ, mạnh mẽ', 1, 900000.00, 'AVAILABLE', 'Mazda CX-5 2020', 18, 10, '2024-01-16 12:00:00', '2025-07-05 18:30:00'),
('vehicle_008', 'user_001', 'brand-005', 'model-002', 'penalty_001', '51A-12352', 'CAR', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 5, 2021, 'AUTOMATIC', 'GASOLINE', 'Mazda3 2021, xe sedan cao cấp', 1, 750000.00, 'AVAILABLE', 'Mazda3 2021', 14, 7, '2024-01-16 12:30:00', '2025-07-05 19:15:00'),
('vehicle_009', 'user_001', 'brand-001', 'model-002', 'penalty_001', '51A-12353', 'CAR', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'YES', 'YES', 'YES', 5, 2022, 'AUTOMATIC', 'GASOLINE', 'Toyota Camry 2022, xe sedan có tài xế, dịch vụ VIP', 1, 1200000.00, 'AVAILABLE', 'Toyota Camry 2022', 25, 15, '2024-01-16 13:00:00', '2025-07-05 20:45:00'),
('vehicle_010', 'user_001', 'brand-002', 'model-002', 'penalty_001', '51A-12354', 'CAR', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 5, 2022, 'AUTOMATIC', 'GASOLINE', 'Honda Civic 2022, xe sedan phiên bản mới nhất', 1, 800000.00, 'AVAILABLE', 'Honda Civic 2022', 22, 11, '2024-01-16 13:30:00', '2025-07-05 21:20:00'),
-- Insert vehicles for Provider 2 (15 motorbikes + 5 bicycles, updated with new brand_id, model_id = NULL for motorbikes, and vehicle_images)
('vehicle_011', 'user_002', 'brand-101', NULL, 'penalty_002', '51B1-12345', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2020, 'AUTOMATIC', 'GASOLINE', 'Honda Wave 2020, xe số tiết kiệm', 1, 150000.00, 'AVAILABLE', 'Honda Wave 2020', 5, 2, '2025-07-07 02:18:00', '2025-07-07 02:18:00'),
('vehicle_012', 'user_002', 'brand-101', NULL, 'penalty_002', '51B1-12346', 'MOTORBIKE', 'Phanh ABS, Đèn LED, Cốp xe', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2021, 'AUTOMATIC', 'GASOLINE', 'Honda Air Blade 2021, xe ga hiện đại', 1, 200000.00, 'AVAILABLE', 'Honda Air Blade 2021', 8, 4, '2025-07-07 02:19:00', '2025-07-07 02:19:00'),
('vehicle_013', 'user_002', 'brand-102', NULL, 'penalty_002', '51B1-12347', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2020, 'MANUAL', 'GASOLINE', 'Yamaha Exciter 2020, xe côn tay mạnh mẽ', 1, 180000.00, 'AVAILABLE', 'Yamaha Exciter 2020', 12, 6, '2025-07-07 02:20:00', '2025-07-07 02:20:00'),
('vehicle_014', 'user_002', 'brand-102', NULL, 'penalty_002', '51B1-12348', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2019, 'AUTOMATIC', 'GASOLINE', 'Yamaha Jupiter 2019, xe ga tiết kiệm', 1, 160000.00, 'AVAILABLE', 'Yamaha Jupiter 2019', 6, 3, '2025-07-07 02:21:00', '2025-07-07 02:21:00'),
('vehicle_015', 'user_002', 'brand-103', NULL, 'penalty_002', '51B1-12349', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2021, 'MANUAL', 'GASOLINE', 'Suzuki Raider 2021, xe côn tay thể thao', 1, 170000.00, 'AVAILABLE', 'Suzuki Raider 2021', 9, 5, '2025-07-07 02:22:00', '2025-07-07 02:22:00'),
('vehicle_016', 'user_002', 'brand-103', NULL, 'penalty_002', '51B1-12350', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2020, 'MANUAL', 'GASOLINE', 'Suzuki Satria 2020, xe thể thao', 1, 190000.00, 'AVAILABLE', 'Suzuki Satria 2020', 11, 7, '2025-07-07 02:23:00', '2025-07-07 02:23:00'),
('vehicle_017', 'user_002', 'brand-106', NULL, 'penalty_002', '51B1-12351', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2021, 'AUTOMATIC', 'GASOLINE', 'SYM Attila 2021, xe ga cao cấp', 1, 210000.00, 'AVAILABLE', 'SYM Attila 2021', 7, 3, '2025-07-07 02:24:00', '2025-07-07 02:24:00'),
('vehicle_018', 'user_002', 'brand-106', NULL, 'penalty_002', '51B1-12352', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2020, 'AUTOMATIC', 'GASOLINE', 'SYM Galaxy 2020, xe ga đẹp', 1, 180000.00, 'AVAILABLE', 'SYM Galaxy 2020', 4, 2, '2025-07-07 02:25:00', '2025-07-07 02:25:00'),
('vehicle_019', 'user_002', 'brand-101', NULL, 'penalty_002', '51B1-12353', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2021, 'AUTOMATIC', 'GASOLINE', 'Honda Wave 2021, xe số mới', 1, 160000.00, 'AVAILABLE', 'Honda Wave 2021', 6, 4, '2025-07-07 02:26:00', '2025-07-07 02:26:00'),
('vehicle_020', 'user_002', 'brand-101', NULL, 'penalty_002', '51B1-12354', 'MOTORBIKE', 'Phanh ABS, Đèn LED, Cốp xe', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2022, 'AUTOMATIC', 'GASOLINE', 'Honda Air Blade 2022, phiên bản mới', 1, 220000.00, 'AVAILABLE', 'Honda Air Blade 2022', 10, 6, '2025-07-07 02:27:00', '2025-07-07 02:27:00'),
('vehicle_021', 'user_002', 'brand-102', NULL, 'penalty_002', '51B1-12355', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2021, 'MANUAL', 'GASOLINE', 'Yamaha Exciter 2021, xe côn tay', 1, 190000.00, 'AVAILABLE', 'Yamaha Exciter 2021', 13, 8, '2025-07-07 02:28:00', '2025-07-07 02:28:00'),
('vehicle_022', 'user_002', 'brand-102', NULL, 'penalty_002', '51B1-12356', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2020, 'AUTOMATIC', 'GASOLINE', 'Yamaha Jupiter 2020, xe ga đẹp', 1, 170000.00, 'AVAILABLE', 'Yamaha Jupiter 2020', 5, 2, '2025-07-07 02:29:00', '2025-07-07 02:29:00'),
('vehicle_023', 'user_002', 'brand-103', NULL, 'penalty_002', '51B1-12357', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2022, 'MANUAL', 'GASOLINE', 'Suzuki Raider 2022, xe mới', 1, 180000.00, 'AVAILABLE', 'Suzuki Raider 2022', 8, 5, '2025-07-07 02:30:00', '2025-07-07 02:30:00'),
('vehicle_024', 'user_002', 'brand-103', NULL, 'penalty_002', '51B1-12358', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2021, 'MANUAL', 'GASOLINE', 'Suzuki Satria 2021, xe thể thao', 1, 200000.00, 'AVAILABLE', 'Suzuki Satria 2021', 12, 7, '2025-07-07 02:31:00', '2025-07-07 02:31:00'),
('vehicle_025', 'user_002', 'brand-106', NULL, 'penalty_002', '51B1-12359', 'MOTORBIKE', 'Phanh ABS, Đèn LED', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'YES', 'YES', 2, 2022, 'AUTOMATIC', 'GASOLINE', 'SYM Attila 2022, xe ga mới', 1, 230000.00, 'AVAILABLE', 'SYM Attila 2022', 9, 4, '2025-07-07 02:32:00', '2025-07-07 02:32:00'),
('vehicle_026', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE', 'Xe đạp thể thao, 21 tốc độ', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'NO', 'YES', 1, 2021, NULL, NULL, 'Xe đạp thể thao cao cấp, phù hợp tập thể dục', 1, 80000.00, 'AVAILABLE', 'Xe đạp thể thao', 3, 1, '2025-07-07 02:33:00', '2025-07-07 02:33:00'),
('vehicle_027', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE', 'Xe đạp touring, 24 tốc độ', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'NO', 'YES', 1, 2020, NULL, NULL, 'Xe đạp touring, thích hợp đi phượt', 1, 90000.00, 'AVAILABLE', 'Xe đạp touring', 4, 2, '2025-07-07 02:34:00', '2025-07-07 02:34:00'),
('vehicle_028', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE', 'Xe đạp địa hình, phanh đĩa', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'NO', 'YES', 1, 2021, NULL, NULL, 'Xe đạp địa hình chuyên dụng', 1, 100000.00, 'AVAILABLE', 'Xe đạp địa hình', 5, 3, '2025-07-07 02:35:00', '2025-07-07 02:35:00'),
('vehicle_029', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE', 'Xe đạp thành phố, có giỏ', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'NO', 'YES', 1, 2020, NULL, NULL, 'Xe đạp thành phố, tiện lợi mua sắm', 1, 70000.00, 'AVAILABLE', 'Xe đạp thành phố', 2, 1, '2025-07-07 02:36:00', '2025-07-07 02:36:00'),
('vehicle_030', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE', 'Xe đạp gấp, tiện lợi', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'NO', 'YES', 1, 2021, NULL, NULL, 'Xe đạp gấp, dễ dàng mang theo', 1, 85000.00, 'AVAILABLE', 'Xe đạp gấp', 6, 4, '2025-07-07 02:37:00', '2025-07-07 02:37:00');



-- Insert extra fee rules
INSERT INTO `extra_fee_rule` (
    `id`, `vehicle_id`, `max_km_per_day`, `fee_per_extra_km`, 
    `allowed_hour_late`, `fee_per_extra_hour`, `cleaning_fee`, 
    `smell_removal_fee`, `battery_charge_fee_per_percent`, 
    `apply_battery_charge_fee`, `driver_fee_per_day`, 
    `has_driver_option`, `driver_fee_per_hour`, `has_hourly_rental`
) VALUES
-- Phụ phí cho xe ô tô (vehicle_001: Toyota Camry 2020)
('efr_001', 'vehicle_001', 300, 5000, 2, 50000, 100000, 150000, 0, FALSE, 300000, TRUE, 100000, TRUE),
-- Phụ phí cho xe ô tô (vehicle_002: Toyota Vios 2019)
('efr_002', 'vehicle_002', 300, 4000, 2, 40000, 80000, 120000, 0, FALSE, 250000, FALSE, 80000, TRUE),
-- Phụ phí cho xe ô tô (vehicle_003: Honda Civic 2021)
('efr_003', 'vehicle_003', 300, 5000, 2, 50000, 100000, 150000, 0, FALSE, 300000, TRUE, 100000, TRUE),
-- Phụ phí cho xe ô tô (vehicle_004: Honda City 2020)
('efr_004', 'vehicle_004', 300, 4000, 2, 40000, 80000, 120000, 0, FALSE, 250000, FALSE, 80000, TRUE),
-- Phụ phí cho xe ô tô (vehicle_005: Hyundai Elantra 2021)
('efr_005', 'vehicle_005', 300, 4500, 2, 45000, 90000, 130000, 0, FALSE, 280000, TRUE, 90000, TRUE),
-- Phụ phí cho xe ô tô (vehicle_006: Hyundai Accent 2019)
('efr_006', 'vehicle_006', 300, 4000, 2, 40000, 80000, 120000, 0, FALSE, 250000, FALSE, 80000, TRUE),
-- Phụ phí cho xe ô tô (vehicle_007: Mazda CX-5 2020)
('efr_007', 'vehicle_007', 400, 6000, 3, 60000, 120000, 180000, 0, FALSE, 350000, TRUE, 120000, TRUE),
-- Phụ phí cho xe ô tô (vehicle_008: Mazda3 2021)
('efr_008', 'vehicle_008', 300, 4500, 2, 45000, 90000, 130000, 0, FALSE, 280000, TRUE, 90000, TRUE),
-- Phụ phí cho xe ô tô (vehicle_009: Toyota Camry 2022)
('efr_009', 'vehicle_009', 300, 5000, 2, 50000, 100000, 150000, 0, FALSE, 300000, TRUE, 100000, TRUE),
-- Phụ phí cho xe ô tô (vehicle_010: Honda Civic 2022)
('efr_010', 'vehicle_010', 300, 5000, 2, 50000, 100000, 150000, 0, FALSE, 300000, TRUE, 100000, TRUE),
-- Phụ phí cho xe máy (vehicle_011: Honda Wave 2020) - Không có phí tài xế
('efr_011', 'vehicle_011', 0, 0, 0, 0, 0, 0, 0, FALSE, 0, FALSE, 20000, TRUE),
-- Phụ phí cho xe máy (vehicle_012: Honda Air Blade 2021) - Có phí tài xế
('efr_012', 'vehicle_012', 0, 0, 0, 0, 0, 0, 0, FALSE, 150000, TRUE, 25000, TRUE),
-- Phụ phí cho xe máy (vehicle_013: Yamaha Exciter 2020) - Có phí tài xế
('efr_013', 'vehicle_013', 0, 0, 0, 0, 0, 0, 0, FALSE, 150000, TRUE, 22000, TRUE),
-- Phụ phí cho xe máy (vehicle_014: Yamaha Jupiter 2019) - Không có phí tài xế
('efr_014', 'vehicle_014', 0, 0, 0, 0, 0, 0, 0, FALSE, 0, FALSE, 20000, TRUE),
-- Phụ phí cho xe máy (vehicle_015: Suzuki Raider 2021) - Không có phí tài xế
('efr_015', 'vehicle_015', 0, 0, 0, 0, 0, 0, 0, FALSE, 0, FALSE, 21000, TRUE),
-- Phụ phí cho xe máy (vehicle_016: Suzuki Satria 2020) - Có phí tài xế
('efr_016', 'vehicle_016', 0, 0, 0, 0, 0, 0, 0, FALSE, 150000, TRUE, 23000, TRUE),
-- Phụ phí cho xe máy (vehicle_017: SYM Attila 2021) - Có phí tài xế
('efr_017', 'vehicle_017', 0, 0, 0, 0, 0, 0, 0, FALSE, 150000, TRUE, 25000, TRUE),
-- Phụ phí cho xe máy (vehicle_018: SYM Galaxy 2020) - Không có phí tài xế
('efr_018', 'vehicle_018', 0, 0, 0, 0, 0, 0, 0, FALSE, 0, FALSE, 22000, TRUE),
-- Phụ phí cho xe máy (vehicle_019: Honda Wave 2021) - Không có phí tài xế
('efr_019', 'vehicle_019', 0, 0, 0, 0, 0, 0, 0, FALSE, 0, FALSE, 20000, TRUE),
-- Phụ phí cho xe máy (vehicle_020: Honda Air Blade 2022) - Có phí tài xế
('efr_020', 'vehicle_020', 0, 0, 0, 0, 0, 0, 0, FALSE, 150000, TRUE, 25000, TRUE),
-- Phụ phí cho xe máy (vehicle_021: Yamaha Exciter 2021) - Có phí tài xế
('efr_021', 'vehicle_021', 0, 0, 0, 0, 0, 0, 0, FALSE, 150000, TRUE, 22000, TRUE),
-- Phụ phí cho xe máy (vehicle_022: Yamaha Jupiter 2020) - Không có phí tài xế
('efr_022', 'vehicle_022', 0, 0, 0, 0, 0, 0, 0, FALSE, 0, FALSE, 20000, TRUE),
-- Phụ phí cho xe máy (vehicle_023: Suzuki Raider 2022) - Không có phí tài xế
('efr_023', 'vehicle_023', 0, 0, 0, 0, 0, 0, 0, FALSE, 0, FALSE, 21000, TRUE),
-- Phụ phí cho xe máy (vehicle_024: Suzuki Satria 2021) - Có phí tài xế
('efr_024', 'vehicle_024', 0, 0, 0, 0, 0, 0, 0, FALSE, 150000, TRUE, 23000, TRUE),
-- Phụ phí cho xe máy (vehicle_025: SYM Attila 2022) - Có phí tài xế
('efr_025', 'vehicle_025', 0, 0, 0, 0, 0, 0, 0, FALSE, 150000, TRUE, 25000, TRUE);
-- Insert some sample coupons (removed duplicate coupon_003)
INSERT INTO `coupons` (`id`, `name`, `discount`, `description`, `time_expired`, `status`, `created_at`, `updated_at`) VALUES
('coupon_001', 'WELCOME10', 10.00, 'Giảm 10% cho khách hàng mới', '2025-12-31 23:59:59', 'VALID', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
('coupon_002', 'SUMMER20', 20.00, 'Giảm 20% dịp hè', '2025-08-31 23:59:59', 'VALID', '2024-06-01 00:00:00', '2024-06-01 00:00:00'),
('coupon_003', 'WEEKEND15', 15.00, 'Giảm 15% cuối tuần', '2025-07-31 23:59:59', 'VALID', '2024-07-01 00:00:00', '2024-07-01 00:00:00');


-- Insert sample notifications
INSERT INTO `notifications` (`id`, `type`, `message`, `is_read`, `is_deleted`, `receiver_id`, `created_at`, `updated_at`) VALUES
('notif_003', 'SYSTEM', 'Hệ thống sẽ bảo trì vào 2025-07-15 từ 1:00 AM đến 3:00 AM.', FALSE, FALSE, 'user_001', '2025-07-07 02:40:00', '2025-07-07 02:40:00'),
('notif_004', 'REPORT', 'Báo cáo của bạn về user_004 đã được gửi đi.', FALSE, FALSE, 'user_003', '2025-07-07 02:41:00', '2025-07-07 02:41:00');


INSERT INTO vehicles (
    id, user_id, brand_id, model_id, penalty_id, license_plate, vehicle_type, vehicle_features, vehicle_images,
    have_driver, insurance_status, ship_to_address, number_seat, year_manufacture, transmission, fuel_type,
    description, number_vehicle, cost_per_day, status, thumb, total_ratings, likes, created_at, updated_at
) VALUES
('e75c1194-778e-4dfd-8860-b93fc06f8f07', 'user_002', 'brand-101', NULL, 'penalty_002', '29C2-03675', 'MOTORBIKE',
 'GPS Tracking, Digital Dashboard, GPS',
 '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754283399/k5l9hb1mlirlyjsljxmn.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754283402/jyyfoissabvrtflky7i1.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754283405/su2tnhxulhsfnet5qfzk.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754283440/ncdr7abnczoopuea2yfa.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754283659/lyok5wkj0npua253q5q6.jpg"]', NULL,
 'YES', 'YES', '2', 1998, 'MANUAL', 'GASOLINE',
 'Winner 150 V1 đời 2019 – xe kiểng chính chủ biển số TP
 
 Chiếc Winner 150 phiên bản V1 đời 2019 màu đỏ trắng đen, odo 15.000 km, xe đẹp chuẩn kiểng, chính chủ biển số thành phố 143.89 – bao công chứng sang tên.
 
 Trang bị nổi bật:
 
 Phuộc trước LCM, phuộc sau RL – êm ái, ổn định
 
 Mâm 3 đao CNC – độc đáo, nổi bật
 
 Heo dầu Frando pas CNC, dây dầu bấm, đĩa X1R – phanh an toàn, chất lượng cao
 
 Tay thắng Brembo 1.1, càng số X1R – tăng cảm giác lái thể thao
 
 Gắp Exciter 150, nhông sên dĩa mới thay – đảm bảo vận hành ổn định
 
 Tem 3 lớp còn mới tinh – xe đẹp như mới
 
 Vài con ốc Salaya tạo điểm nhấn
 
 Tình trạng:
 Xe máy êm, chạy ngon, ngoại hình chỉn chu. Bao test thỏa mái. Thích hợp cho anh em đam mê xe côn tay kiểng – cá tính – độc chất.',
 1, 60000.00, 'AVAILABLE', 'WAVE THÁI 1998 BSTP', 0, 0, '2025-08-04 12:01:06', '2025-08-04 14:06:55'),

('dcb1e353-7422-4f03-a336-cfa0cb4f7767', 'user_002', 'brand-101', NULL, 'penalty_002', '29D1-143.89', 'MOTORBIKE',
 'GPS, LED Lights, Storage Box, ABS Braking, GPS Tracking',
 '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754281105/sli9tcgc2ngwus5wqfqy.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754281109/jddtm4qhdhke0dch13qy.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754281112/rxr0knemcpub6kinzzyj.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754281114/u4zrxhzdxq86domfu3dj.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754281162/xwpuehen7b8ctqialvsy.jpg"]', NULL,
 'YES', 'YES', '2', 2019, 'AUTOMATIC', 'GASOLINE',
 'Winner 150 V1 đời 2019 – xe kiểng chính chủ biển số TP
 
 Chiếc Winner 150 phiên bản V1 đời 2019 màu đỏ trắng đen, odo 15.000 km, xe đẹp chuẩn kiểng, chính chủ biển số thành phố 143.89 – bao công chứng sang tên.
 
 Trang bị nổi bật:
 
 Phuộc trước LCM, phuộc sau RL – êm ái, ổn định
 
 Mâm 3 đao CNC – độc đáo, nổi bật
 
 Heo dầu Frando pas CNC, dây dầu bấm, đĩa X1R – phanh an toàn, chất lượng cao
 
 Tay thắng Brembo 1.1, càng số X1R – tăng cảm giác lái thể thao
 
 Gắp Exciter 150, nhông sên dĩa mới thay – đảm bảo vận hành ổn định
 
 Tem 3 lớp còn mới tinh – xe đẹp như mới
 
 Vài con ốc Salaya tạo điểm nhấn
 
 Tình trạng:
 Xe máy êm, chạy ngon, ngoại hình chỉn chu. Bao test thỏa mái. Thích hợp cho anh em đam mê xe côn tay kiểng – cá tính – độc chất.',
 1, 120000.00, 'AVAILABLE', 'Winner 150 V1 Đời 2019', 0, 0, '2025-08-04 11:21:36', '2025-08-04 14:06:56'),

('d941d1e7-500e-4e0d-911f-81389967d82b', 'user_002', 'brand-101', NULL, 'penalty_002', '59HA-09351', 'MOTORBIKE',
 'Steering Lock, Passenger Footrest, Front Wheel Lock, Auto Side Stand, Fuel-saving System, Comfort Seat, Storage Box',
 '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754294918/zdh2nntdosyjizqcgnvk.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294921/krsm4qzbg734dvnm0ahb.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294923/tlmxb7zwttbqm3idn34n.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294925/xvur686sgaartcexjchj.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754295132/nbymp3qzy8rhqrerbbz5.jpg"]', NULL,
 'YES', 'YES', '2', 2017, 'AUTOMATIC', 'GASOLINE',
 'Honda Air Blade màu đỏ đen nổi bật, kiểu dáng thể thao sẽ là người bạn đồng hành tuyệt vời cho hành trình của bạn!
 
 Ưu điểm nổi bật:
 
 Động cơ 125cc mạnh mẽ – bốc – tiết kiệm xăng
 
 Thiết kế khí động học, gầm cao dễ leo dốc – cực kỳ phù hợp cho địa hình đô thị và ven biển
 
 Phanh đĩa an toàn – thắng ăn chắc, yên xe êm ái
 
 Cốp rộng rãi, đựng vali nhỏ, balo, nón bảo hiểm thoải mái
 
 Xe mới – sạch – chạy cực mượt, giao nhận tận nơi
 
 Rất phù hợp cho du khách nước ngoài, cặp đôi, nhóm bạn cần di chuyển chủ động
 
 Phù hợp với hành trình:
 
 Khám phá các điểm du lịch nổi tiếng trong nội thành và ngoại ô
 
 Đi biển, đi núi nhẹ, tham quan chùa chiền, di tích…
 
 Di chuyển tự do mà không bị phụ thuộc vào taxi hay grab',
 1, 140000.00, 'AVAILABLE', 'Air Blade 110 2010 Fi', 0, 0, '2025-08-04 15:12:16', '2025-08-04 15:18:25'),
 
 ('bae3f223-6972-42d4-a7bc-4ba735de4771', 'user_002', 'brand-101', NULL, 'penalty_002', '29N1-38733', 'MOTORBIKE',
 'GPS, Passenger Footrest, Front Wheel Lock, Steering Lock, Auto Side Stand, Fuel-saving System, Comfort Seat, Traction Control, GPS Tracking, Anti-theft Alarm',
 '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754293833/ecktagemg9mbhbdtgunk.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754293835/ullkwwfwuzgvwudwwhyo.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754293838/zwd7ov5ujuigtk2561gf.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754293841/jqc9ip4n8vqfsfrlxe0u.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754293896/qhho6baytwxq7cucgube.jpg"]', NULL,
 'YES', 'YES', '2', 2016, 'AUTOMATIC', 'GASOLINE',
 'Bạn đang tìm một chiếc xe nhỏ gọn – mạnh mẽ – cá tính để rong ruổi thành phố hay vi vu cuối tuần?
 Chiếc Honda MSX 125 này chính là lựa chọn không thể bỏ qua!
 
 Điểm nổi bật:
 
 Pô độ thể thao – tiếng nổ uy lực, phấn khích mỗi lần vít ga
 
 Phuộc trước hành trình ngược (USD) – êm ái, đậm chất "naked bike"
 
 Kiểu dáng gọn nhẹ – dễ luồn lách, đỗ xe linh hoạt
 
 Động cơ 125cc mạnh mẽ, tiết kiệm nhiên liệu
 
 Phanh đĩa trước & sau – an toàn, phản hồi nhanh
 
 Phù hợp cho:
 
 Đi phố, đi chơi cuối tuần, hoặc du lịch ngắn ngày
 
 Người mới chạy côn tay muốn thử cảm giác thể thao
 
 Chụp ảnh, quay vlog, trải nghiệm phong cách “cool ngầu” không đụng hàng',
 1, 170000.00, 'AVAILABLE', 'XE MÁY THỊNH PHÁT - HONDA MSX 125 ĐEN BIỂN HÀ NỘI', 0, 0, '2025-08-04 14:51:46', '2025-08-04 14:54:04'),

('9e569071-ccb3-41a1-9a7a-13c0d6d88a18', 'user_002', 'brand-101', NULL, 'penalty_002', '26L3-45531', 'MOTORBIKE',
 'GPS, Storage Box, Comfort Seat, Front Wheel Lock, Steering Lock, Fuel-saving System',
 '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754294340/ibmiftoydip2j3htndiz.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294343/vbta6romrmf03ymirvvw.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294345/aonqbc6aeilupvur5qxe.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294347/vuiphyoovn0g3wetea79.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294482/uovjvwaxia84vh4lhlbj.jpg"]', NULL,
 'YES', 'YES', '2', 2000, 'MANUAL', 'GASOLINE',
 'Động cơ 110cc mạnh mẽ, bốc, máy nổ êm như ru
 
 Số nhẹ, vào êm, rất thích hợp cho cả nam và nữ
 
 Rất tiết kiệm xăng – chỉ khoảng 1.5L/100km
 
 Dàn áo nguyên zin, sơn xanh đậm cổ điển
 
 Ống pô và vành inox sáng bóng, xe được chăm kỹ
 
 Có giỏ giữa tiện lợi, yên rộng ngồi thoải mái
 
 Máy móc còn chất – đề phát ăn liền
 
 Phù hợp cho:
 
 Sinh viên, người lao động, người cần xe đi lại đơn giản
 
 Chạy xe giao hàng, đi tỉnh, đi chợ, đi làm
 
 Người yêu thích xe số cổ, muốn trải nghiệm chất riêng của Honda đời đầu',
 1, 80000.00, 'AVAILABLE', 'HONDA FUTURE 2000', 0, 0, '2025-08-04 15:01:27', '2025-08-04 15:18:25'),

('8c5cfe48-39b5-4fab-806e-63e0b7843e62', 'user_002', 'brand-102', NULL, 'penalty_002', '59Z1_11592', 'MOTORBIKE',
 'GPS, Comfort Seat, Traction Control, Front Wheel Lock, Steering Lock, Fuel-saving System',
 '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754294705/xuotxzfgydgc7ykvhhcz.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294709/dite3ip85ud11bgpoj5a.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294711/ylsfjdxylq7ycncos8l0.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294714/owcliwzuhs1e4r6zsusa.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294858/imxvd1auftdhbl7l6ivb.jpg"]', NULL,
 'YES', 'YES', '2', 2013, 'MANUAL', 'GASOLINE',
 'Động cơ 115cc, phun xăng điện tử Fi – chạy êm, cực kỳ tiết kiệm
 
 Lên dàn tem thể thao cực ngầu, xe nhìn chất và khỏe
 
 Dàn áo nguyên vẹn, không bể vỡ, đầu đèn sáng rõ
 
 Vành đúc chắc chắn – phanh đĩa trước an toàn
 
 Yên xe êm, tay lái nhẹ, dễ điều khiển cả cho người mới
 
 Xe thường dùng để đi phượt nhẹ, rất cơ động',
 1, 110000.00, 'AVAILABLE', 'Yamaha Sirius', 0, 0, '2025-08-04 15:07:44', '2025-08-04 15:18:25'),

('70745813-3bf7-4870-850f-0527fae3ccf7', 'user_002', 'brand-102', NULL, 'penalty_002', '16H8-17792', 'MOTORBIKE',
 'Storage Box, Comfort Seat, Traction Control, Steering Lock, Auto Side Stand, Passenger Footrest, Fuel-saving System',
 '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754295214/srhkv4x4tithfwa7sf7z.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754295216/dwbzwtbu3isakcnhgzfx.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754295218/cpueidywtonuvldky6bw.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754295220/e2quwyplavkk1ehwcnzt.jpg"]', NULL,
 'YES', 'YES', '2', 2016, 'MANUAL', 'GASOLINE',
 'Bạn cần một chiếc xe côn tay mạnh mẽ – thiết kế thể thao – cực chất để chinh phục những cung đường du lịch? Chiếc Exciter 150 bản giới hạn – màu đen nhám full tem cực ngầu là lựa chọn không thể hoàn hảo hơn! Điểm nổi bật: Động cơ 150cc 5 số, chạy bốc, vọt, vượt dốc cực khỏe Kiểu dáng khí động học – phong cách “tiểu phân khối lớn”, thu hút mọi ánh nhìn Phanh đĩa trước sau – an toàn khi phanh gấp Yên thể thao thoải mái, bám đường tốt, thích hợp đi xa Xe đã gắn thêm dây bảo vệ đầu điện, bảo trì kỹ, chạy ổn định Bình xăng lớn, tiết kiệm nhiên liệu, đi xa không lo dừng đổ liên tục Phù hợp cho: Khách du lịch thích trải nghiệm cảm giác lái mạnh mẽ, thể thao Chuyến đi phượt, khám phá các cung đường đèo, biển, ngoại ô Người đam mê côn tay, mê tốc độ nhưng vẫn muốn tiết kiệm chi phí thuê xe
',
 2, 100000.00, 'AVAILABLE', 'Yamaha Exciter 150', 0, 0, '2025-08-04 15:16:26', '2025-08-04 15:18:25'),
 
 ('5388723d-b42d-4532-b05d-2ba397f14ae1', 'user_002', 'brand-101', NULL, 'penalty_002', '29D1_111.55', 'MOTORBIKE',
 'GPS, LED Lights, Storage Box, GPS Tracking',
 '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754281402/lcpkfv3ktaaiswiasbiw.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754281405/euhmblawew7tuikmhx7x.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754281407/jcengtfml2m8powopxn2.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754281409/krvd9lak10qhpigicvhu.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754281492/emyhhchraxjp0axbhr1q.jpg"]', NULL,
 'YES', 'YES', '2', 2022, 'AUTOMATIC', 'GASOLINE',
 'Vario 150 – Xe tay ga nhập khẩu Indonesia đời 2022, màu vàng cát (nâu đen) nổi bật
 
 Chiếc Vario 150 nhập khẩu chính chủ biển số 66 – màu vàng cát phối nâu đen cực độc lạ, là lựa chọn lý tưởng cho khách hàng cần một chiếc xe tay ga cá tính, vận hành mượt và tiết kiệm.
 
 Thông tin nổi bật:
 
 Xe đời 2022, máy zin nguyên bản – vận hành êm ái, bốc
 
 Màu sơn vàng cát phối nâu đen độc đáo, sạch đẹp, nổi bật khi di chuyển
 
 Ốc tán sáng bóng – ngoại hình xe chỉn chu, thu hút
 
 Biển số chính chủ 66 – giấy tờ hợp lệ, hỗ trợ giao nhận tận nơi
 
 Phù hợp cho khách thuê dài ngày, đi phượt nhẹ, dạo phố hoặc công tác
 
 Cam kết:
 Máy móc êm – xe đã kiểm tra kỹ trước khi giao. Bao test, bao xăng, hỗ trợ thuê giao tận nơi nếu cần.',
 1, 130000.00, 'AVAILABLE', 'Vario 150 đời 2022', 0, 0, '2025-08-04 11:25:52', '2025-08-04 14:06:55'),

('495789a2-a482-43b8-83d3-ad52fce5c833', 'user_002', 'brand-101', NULL, 'penalty_002', '59NA-22434', 'MOTORBIKE',
 'Fuel-saving System, Steering Lock, Front Wheel Lock, Passenger Footrest, Comfort Seat, Storage Box, LED Lights',
 '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754294528/x8ihbjz49cfj9vomawyq.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294530/at04qxmhffvalibotzim.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294532/zzbkjjzaehrampuljrog.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294535/vwneewahyljf6mfmoe43.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294585/dutic3jggiczpwdpbmoe.jpg"]', NULL,
 'YES', 'YES', '2', 2021, 'AUTOMATIC', 'GASOLINE',
 'Honda LEAD – Xe tay ga tiện lợi, sang trọng cho mọi hành trình!
 
 Bạn đang tìm một chiếc tay ga rộng rãi – bền bỉ – tiết kiệm?
 Chiếc Honda LEAD màu xám bạc thời trang sẽ là người bạn đồng hành lý tưởng cho mọi nhu cầu đi lại hằng ngày!
 
 Thông tin nổi bật:
 
 Động cơ 125cc mạnh mẽ, vận hành êm ái, tiết kiệm nhiên liệu
 
 Cốp siêu rộng – chứa được 2 nón bảo hiểm và nhiều đồ cá nhân
 
 Khóa thông minh Smartkey chống trộm – tiện lợi và an toàn
 
 Thiết kế thân xe nữ tính, sang trọng, phù hợp cả nam và nữ
 
 Dễ lái, lên ga nhẹ, rất thích hợp cho chị em hoặc người lớn tuổi
 
 Màu xám bạc trung tính – không trầy xước – như mới
 
 Phù hợp cho:
 
 Đi làm, đi học, đi chợ, hoặc đi chơi xa
 
 Người cần xe ga cốp lớn – tiện lợi để mang theo nhiều đồ
 
 Khách du lịch, công tác cần thuê xe lịch sự, dễ sử dụng
',
 1, 150000.00, 'AVAILABLE', 'Honda LEAD (màu xám bạc)', 0, 0, '2025-08-04 15:04:11', '2025-08-04 15:18:25'),

('2187f5f4-c3bf-42de-a63d-3ccaefaf76fe', 'user_002', 'brand-101', NULL, 'penalty_002', '59f2-44696', 'MOTORBIKE',
 'Fuel-saving System, Steering Lock, Front Wheel Lock, Passenger Footrest, Comfort Seat, GPS, LED Lights, Storage Box',
 '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754294149/hi3rq5emjotvrtjqbpaa.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294152/ilc6d5xtvza299agsnq3.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294154/cbotpntp7bcliqnetcpu.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294183/z9vg5irhknojtpioxvuw.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294265/d1xkrlsvn9jn2hbos0vh.jpg"]', NULL,
 'YES', 'YES', '2', 2022, 'AUTOMATIC', 'GASOLINE',
 'Bạn đang tìm một chiếc xe tay ga vừa mạnh mẽ – êm ái – sang trọng?
 
 Chiếc Honda SH 160cc bản cao cấp, màu đen nhám cực ngầu, sẽ khiến bạn nổi bật trên mọi cung đường!
 
 Thông tin nổi bật:
 
 Động cơ 160cc eSP+ mới nhất – tăng tốc mượt mà, vận hành mạnh mẽ nhưng tiết kiệm xăng
 
 Phuộc sau Ohlins vàng nổi bật – nâng tầm đẳng cấp và êm ái khi đi phố lẫn xa
 
 Thiết kế thời thượng, form xe chuẩn châu Âu, thu hút ánh nhìn mọi nơi
 
 Cốp xe siêu rộng – đựng được nón bảo hiểm, áo mưa và cả laptop
 
 Khóa Smartkey chống trộm, mở xe tiện lợi chỉ bằng một nút bấm
 
 Sàn để chân rộng rãi, phù hợp cả nam và nữ
 
 Phù hợp cho:
 
 Di chuyển trong thành phố một cách lịch thiệp và thoải mái
 
 Khách du lịch, doanh nhân cần xe cao cấp để đi lại
 
 Chụp ảnh, quay video, đi sự kiện hoặc đơn giản là thưởng thức trải nghiệm đỉnh cao từ SH
',
 1, 200000.00, 'AVAILABLE', 'Honda SH 160cc', 0, 0, '2025-08-04 14:58:12', '2025-08-04 15:18:25'),

('20a70c4b-02f3-4973-9d16-9ecdf218db07', 'user_002', 'brand-102', NULL, 'penalty_002', '16M1-17538', 'MOTORBIKE',
 'Storage Box, Comfort Seat, Traction Control, Steering Lock, Auto Side Stand, Passenger Footrest, Fuel-saving System',
 '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754295214/srhkv4x4tithfwa7sf7z.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754295216/dwbzwtbu3isakcnhgzfx.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754295218/cpueidywtonuvldky6bw.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754295220/e2quwyplavkk1ehwcnzt.jpg"]', NULL,
 'YES', 'YES', '2', 2016, 'MANUAL', 'GASOLINE',
 'Bạn cần một chiếc xe côn tay mạnh mẽ – thiết kế thể thao – cực chất để chinh phục những cung đường du lịch?
 
 Chiếc Exciter 150 bản giới hạn – màu đen nhám full tem cực ngầu là lựa chọn không thể hoàn hảo hơn!
 
 Điểm nổi bật:
 
 Động cơ 150cc 5 số, chạy bốc, vọt, vượt dốc cực khỏe
 
 Kiểu dáng khí động học – phong cách “tiểu phân khối lớn”, thu hút mọi ánh nhìn
 
 Phanh đĩa trước sau – an toàn khi phanh gấp
 
 Yên thể thao thoải mái, bám đường tốt, thích hợp đi xa
 
 Xe đã gắn thêm dây bảo vệ đầu điện, bảo trì kỹ, chạy ổn định
 
 Bình xăng lớn, tiết kiệm nhiên liệu, đi xa không lo dừng đổ liên tục
 
 Phù hợp cho:
 
 Khách du lịch thích trải nghiệm cảm giác lái mạnh mẽ, thể thao
 
 Chuyến đi phượt, khám phá các cung đường đèo, biển, ngoại ô
 
 Người đam mê côn tay, mê tốc độ nhưng vẫn muốn tiết kiệm chi phí thuê xe
',
 2, 100000.00, 'AVAILABLE', 'Yamaha Exciter 150', 0, 0, '2025-08-04 15:16:26', '2025-08-04 15:18:25');
 
 
 
 
 
 
 
 INSERT INTO vehicles (id, user_id, brand_id, model_id, penalty_id, license_plate, vehicle_type, vehicle_features, vehicle_images, have_driver, insurance_status, ship_to_address, number_seat, year_manufacture, transmission, fuel_type, description, number_vehicle, cost_per_day, status, thumb, total_ratings, likes, created_at, updated_at) VALUES
(
  'veh-20250804-0001', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE',
  'Anti-theft Lock, Disc Brake, Spare Tire, Mini Pump',
  '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754297069/kceazyphsfsjzuuxkuuz.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754297073/rchjkhvmeydi2czgxhns.jpg"]',
  NULL, 'NO', 'NO', 2, 2020, NULL, NULL,
  'Loại xe: Fixed Gear (xe đạp 1 tốc độ, không phanh truyền thống)\nKhung sườn: Sắt sơn đen nhám – kiểu dáng thể thao, tối giản\nVành xe:\nVành trước: Màu đen\nVành sau: Màu xanh lá nổi bật – tạo điểm nhấn cá tính\nYên xe: Đệm thể thao cơ bản\nTay lái: Ghi đông ngang, bọc cao su chống trượt\nBàn đạp: Nhựa cứng màu xanh\nPhanh: Không trang bị phanh – theo đúng phong cách xe fixed gear (lưu ý người thuê cần biết điều khiển loại xe này)',
  1, 120000.00, 'AVAILABLE',
  'Xe Đạp Fixed Gear Custom – Thiết Kế Tối Giản, Phong Cách Trẻ Trung',
  0, 0, '2025-08-04 15:43:02', '2025-08-04 15:43:55'
),
(
  'veh-20250804-0002', 'user_002', 'brand-105', NULL, 'penalty_002', NULL, 'BICYCLE',
  'Disc Brake, Spare Tire, Mini Pump',
  '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754282178/bnzabdck9ht4d1iezfrj.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754282181/omuriihne1hac1idf4lj.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754282184/ntsu25vazkcumv2si6da.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754282185/ouzxr7zp2gzrkuyt1of6.jpg"]',
  NULL, 'NO', 'NO', 2, 2019, 'AUTOMATIC', 'ELECTRIC',
  'Thương hiệu: FSTBIKE\nModel khung: PRADO-920 / PRADO-YCU\nLoại xe: Xe đạp địa hình (Mountain Bike)\nKích thước bánh: 26 inch\nSố cấp độ (Líp): 3 đĩa trước x 7 líp sau = 21 tốc độ',
  4, 120000.00, 'AVAILABLE',
  'Xe đạp địa hình FST BIKE', 0, 0,
  '2025-08-04 11:34:03', '2025-08-04 12:31:17'
),
(
  'veh-20250804-0003', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE',
  'Rear Rack, Basket, Spare Tire, Mini Pump, Disc Brake',
  '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754296529/zlllej0xstmf8ajlpldo.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754296536/ujkkplfsbvw1ooxxoe6q.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754296540/tgk05lof4torbxxny809.jpg"]',
  NULL, 'NO', 'NO', 2, 2020, NULL, NULL,
'Thương hiệu: Yamaha\nDòng xe: CITY\nLoại xe: Xe đạp trợ lực điện\nĐộng cơ: Yamaha hỗ trợ lực đạp – tiết kiệm sức, vận hành êm ái\nPin: Lithium-ion, tích hợp khóa an toàn và hiển thị mức pin\nKhung sườn: Thép sơn tĩnh điện màu nâu cà phê – thiết kế thanh lịch, phù hợp cả nam lẫn nữ\nBộ điều khiển: Nút chỉnh tốc độ hỗ trợ ngay trên tay lái\nTay lái: Cong nhẹ, giúp ngồi thẳng lưng – không mỏi vai gáy\nYên xe: Êm ái, điều chỉnh linh hoạt\nPhanh: Phanh cơ trước sau',
  1, 150000.00, 'PENDING',
  'Xe đạp hỗ trợ lực ', 0, 0,
  '2025-08-04 15:34:24', '2025-08-04 15:34:24'
),
(
  'veh-20250804-0004', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE',
  'Anti-theft Lock, Bell, Disc Brake, Spare Tire, Mini Pump',
  '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754295578/a9vmbj9hxsrpnzsdpe2n.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754295589/dxrwtinzgjevjthxhjux.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754295591/yt36sgwsliityc7ujsoj.jpg"]',
  NULL, 'NO', 'NO', 2, 2023, NULL, NULL,
  'Thương hiệu: JIPAI\nDòng xe: POWER\nLoại xe: Xe đạp địa hình (Mountain Bike)\nKhung sườn: Hợp kim chắc chắn, kiểu dáng thể thao mạnh mẽ\nKích thước bánh: 26 inch – phù hợp cho người cao từ 1m55 trở lên\nBộ chuyển động: 3 đĩa trước × 7 líp sau – tổng 21 tốc độ\nPhuộc: Phuộc nhún trước – giảm xóc tốt khi đi đường gồ ghề\nPhanh: Phanh đĩa trước & sau – an toàn trên mọi địa hình\nYên xe: Bọc nệm thể thao, thoải mái khi di chuyển xa\nTay lái: Trang bị thêm gương chiếu hậu',
  1, 110000.00, 'AVAILABLE',
  'Xe đạp thể thao JIPI thương hiệu Nhật', 0, 0,
  '2025-08-04 15:21:12', '2025-08-04 15:44:05'
),
(
  'veh-20250804-0005', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE',
  'Anti-theft Lock, Disc Brake, Mini Pump',
  '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754283947/ubpb8ptcuwxam5p3gmqv.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754283950/nyjwkpsalsuh9ivvl0vh.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754283952/ijv6vsmfnhcwcsxxet9f.jpg"]',
  NULL, 'NO', 'NO', 2, 2020, NULL, NULL,
  'Thương hiệu: GIANT\nDòng xe: ESCAPE\nLoại xe: Xe đạp thành phố (City Bike / Hybrid)\nKhung sườn: Hợp kim nhôm Aluxx nhẹ, bền chắc\nChuyển động: Shimano Altus\nTốc độ: 3 đĩa trước x 8 líp sau (24 tốc độ) – sang số mượt mà, phù hợp cả đạp thể dục lẫn di chuyển đường dài\nPhanh: Phanh V-brake truyền thống – hiệu quả cao và dễ bảo trì\nVành xe: Kích thước 700C – giúp xe lướt nhanh, tối ưu sức lực\nYên xe: Êm ái, dễ điều chỉnh chiều cao',
  1, 110000.00, 'AVAILABLE',
  'Xe Đạp Địa Hình MTB GIANT ATX 610', 0, 0,
'2025-08-04 12:06:50', '2025-08-04 12:26:08'
),
(
  'veh-20250804-0006', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE',
  'LED Lights, Anti-theft Lock, Bell, Disc Brake, Spare Tire, Mini Pump',
  '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754296798/b89dl507zt1tgamag3qm.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754296806/qwzxqpdlblbzqmlugpcy.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754296810/s6rhibuwokw9egxaueya.jpg"]',
  NULL, 'NO', 'NO', 2, 2018, NULL, NULL,
  'Thương hiệu: Rover (thiết kế Anh, sản xuất Nhật)\nLoại xe: City bike / xe đạp đường phố phong cách cổ điển\nKhung sườn:\nChất liệu: Khung nhôm nhẹ, chắc chắn\nPhuộc trước: Thép chịu lực\nKích thước khung:\nChiều cao đứng (cọc đứng): 53cm\nChiều ngang (top tube): 54cm\nBộ chuyển động:\nTay đề Shimano Revoshift 1x6\nHệ thống 6 líp sau – sang số mượt, phù hợp đường bằng hoặc leo dốc nhẹ\nPhanh: Phanh càng (V-brake), dễ bảo trì\nTay lái: Được giữ nguyên bản, có chuông\nYên: Đệm thể thao thoải mái\nBánh xe: 700C, tốc độ nhẹ và nhanh',
  1, 120000.00, 'PENDING',
  'Xe Đạp Nhật Rover – Khung Nhôm Nhẹ, Tay Đề Shimano, Phong Cách Cổ Điển Anh Quốc', 0, 0,
  '2025-08-04 15:38:29', '2025-08-04 15:38:29'
),
(
  'veh-20250804-0007', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE',
  'Bell, Disc Brake, Spare Tire, Mini Pump, Anti-theft Lock',
  '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754294954/frwjyfmww8ppkqdei0yy.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294956/cz7xd7p1udqjkzkwcbnf.jpg"]',
  NULL, 'NO', 'NO', 2, 2021, NULL, NULL,
  'Thương hiệu: GIANT\nDòng xe: AIRWAY 4.0\nLoại xe: Xe đạp gấp mini\nKích thước bánh: 20 inch\nThiết kế: Gấp gọn dễ dàng – tiện mang theo khi đi du lịch, đi tàu, cất cốp xe ô tô\nƯu điểm nổi bật:\nSiêu gọn – gấp lại chỉ mất vài thao tác\nPhù hợp cho người đi làm, sinh viên, người thuê nhà nhỏ\nCó thể chở thêm người hoặc đồ đạc nhẹ phía sau',
  1, 100000.00, 'PENDING',
  'Xe đạp gấp GIANT bánh 20inch', 0, 0,
  '2025-08-04 15:10:39', '2025-08-04 15:10:39'
),
(
  'veh-20250804-0008', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE',
  'LED Lights, Disc Brake, Spare Tire, Mini Pump, Anti-theft Lock',
  '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754294068/d7jvowcrugzs1uhyfioa.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294070/butnfpnpargerstrpyow.jpg"]',
  NULL, 'NO', 'NO', 2, 2022, NULL, NULL,
'Thương hiệu: GIANT\nDòng xe: ESCAPE\nLoại xe: Xe đạp thành phố (City Bike / Hybrid)\nKhung sườn: Hợp kim nhôm Aluxx nhẹ, bền chắc\nChuyển động: Shimano Altus\nTốc độ: 3 đĩa trước x 8 líp sau (24 tốc độ) – sang số mượt mà, phù hợp cả đạp thể dục lẫn di chuyển đường dài\nPhanh: Phanh V-brake truyền thống – hiệu quả cao và dễ bảo trì\nVành xe: Kích thước 700C – giúp xe lướt nhanh, tối ưu sức lực\nYên xe: Êm ái, dễ điều chỉnh chiều cao',
  1, 120000.00, 'PENDING',
  'Xe đạp Giant Fastroad Adv 1 Cacbon', 0, 0,
  '2025-08-04 14:53:08', '2025-08-04 14:53:08'
),
(
  'veh-20250804-0009', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE',
  'Anti-theft Lock, Rear Rack, Bell, Spare Tire, Mini Pump',
  '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754294320/qfmrgqxswu8wjowdxl63.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294330/goodw7eiaevvvlon2zi7.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754294335/njnzmyxj9dxhkqzrqei4.jpg"]',
  NULL, 'NO', 'NO', 2, 2018, NULL, NULL,
  'Thương hiệu: PRISMA\nLoại xe: Xe đạp phổ thông (xe đạp đi học, đi chợ, đi làm nhẹ nhàng)\nKhung sườn: Thép chắc chắn, thiết kế đơn giản và dễ sử dụng\nBộ truyền động: 1 đĩa trước – 6 líp sau\nTay lái: Cao, cong nhẹ – dễ điều khiển và thoải mái\nYên xe: Đệm êm, có thể điều chỉnh độ cao\nPhanh: Phanh cơ trước sau',
  1, 70000.00, 'AVAILABLE',
  'Xe đạp Asama', 0, 0,
  '2025-08-04 14:58:12', '2025-08-04 15:44:16'
),
(
  'veh-20250804-0010', 'user_002', NULL, NULL, 'penalty_002', NULL, 'BICYCLE',
  'Anti-theft Lock, Basket, Rear Rack, Bell, Disc Brake, Mini Pump, LED Lights',
  '["http://res.cloudinary.com/dcakldjvc/image/upload/v1754296151/cfcapbksjccfypfhw043.jpg","http://res.cloudinary.com/dcakldjvc/image/upload/v1754296158/ep9qldsdnuw0crlxpb2a.jpg"]',
  NULL, 'NO', 'NO', 2, 2021, NULL, NULL,
  'Thương hiệu: Yamaha\nModel: PAS (Power Assist System)\nLoại xe: Xe đạp trợ lực điện\nĐộng cơ: Yamaha chính hãng – vận hành êm, tiết kiệm điện\nPin: Lithium-ion 24V – thời lượng sử dụng dài, có hiển thị mức pin\nKhung sườn: Hợp kim nhôm nhẹ, bền, chống rỉ sét\nBộ chuyển động: Shimano – sang số mượt, bền bỉ\nTay lái: Cao, thiết kế cong nhẹ – phù hợp cho người lớn tuổi\nPhanh: Phanh cơ trước sau\nYên xe: Mềm, dễ điều chỉnh độ cao',
  1, 150000.00, 'PENDING',
  'Xe đạp trợ lực Yamaha', 0, 0,
  '2025-08-04 15:29:35', '2025-08-04 15:29:35'
);


INSERT INTO vehicles (
    id, user_id, brand_id, model_id, penalty_id, license_plate, vehicle_type,
    vehicle_features, vehicle_images, have_driver, insurance_status,
    ship_to_address, number_seat, year_manufacture, transmission, fuel_type,
    description, number_vehicle, cost_per_day, status, thumb,
    total_ratings, likes, created_at, updated_at
) VALUES('6660e134-aeb0-441e-bdee-27b14c5a131f','user_001','brand-007','model-003','penalty_001','51K-584.13','CAR','GPS, Bluetooth, Air Conditioning, Leather Seats, Backup Camera, Remote Start, Blind Spot Monitor, USB Port, DVD Screen','[\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328504/atdifh88pxnnwfbzcpd4.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328513/pd6frcwut22aklvjreps.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328517/budnzceiewqpchfrdrsh.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328520/lds467v6xzdvideds8jx.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328573/d8u2mwaspfvotczykqqb.jpg\"]','NO','YES','NO',5,2022,'AUTOMATIC','ELECTRIC','Sử dụng xe đúng mục đích.\n◦ Không sử dụng xe thuê vào mục đích phi pháp, trái pháp luật.\n◦ Không sử dụng xe thuê để cầm cố, thế chấp.\n◦ Không hút thuốc, nhả kẹo cao su, xả rác trong xe.\n◦ Không chở hàng quốc cấm dễ cháy nổ.\n◦ Không chở hoa quả, thực phẩm nặng mùi trong xe.\n◦ Khi trả xe, nếu xe bẩn hoặc có mùi trong xe, khách hàng vui lòng vệ sinh xe sạch sẽ hoặc gửi phụ thu phí vệ sinh xe.\nTrân trọng cảm ơn, chúc quý khách hàng có những chuyến đi tuyệt vời !',1,589000.00,'AVAILABLE','VINFAST FADIL ',0,0,'2025-08-05 00:30:35','2025-08-05 00:55:58'),
('9852cdc9-39c6-43e5-9793-d66de3a61adc','user_001','brand-003','model-003','penalty_001','83A-121.08','CAR','GPS, Bluetooth, Air Conditioning, Backup Camera, Back Camera, DVD Screen, USB Port, Safety Airbag','[\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328703/n0qq7g2jzmxqq9yabp0n.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328718/oirizuvbh7kq675bwdp0.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328728/iz9grwyaotnqyl7kk6ne.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328738/c1ddvufiyau7c5ail4yd.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328854/wxqw5qlthf52ypem6a6u.jpg\"]','YES','YES','YES',5,2021,'MANUAL','GASOLINE','Ngoài các ưu đãi về giá MICARRO còn hổ trợ thêm cho Quý Khách hàng các Chính sách như sau:\n* Hoàn Tiền đổ xăng dư.\n* Miễn phí vượt dưới 1h.\n* Miễn phí vượt dưới 10Km.\n- Sử dụng miễn phí: Nước, Đồ ăn vặt, Khăn giấy có trong gói MICAR KIT khi thuê xe\n- Hyundai I10 là mẫu xe hạng A. Với thiết kế nhỏ gọn, linh hoạt và tiết kiệm nhiên liệu, i10 là một sự lựa chọn lý tưởng cho những ai cần một chiếc xe dễ dàng di chuyển trong đô thị, đặc biệt là trong những khu vực có mật độ giao thông cao. Hyundai i10 sở hữu một không gian nội thất thông minh, dù nhỏ gọn nhưng vẫn đủ rộng rãi cho 4 hành khách và có khoang hành lý khá tiện dụng cho nhu cầu di chuyển hàng ngày. Xe được trang bị các tính năng cơ bản nhưng hiện đại như màn hình giải trí cảm ứng, kết nối Bluetooth, điều hòa, hệ thống âm thanh,động cơ xăng nhỏ gọn, hiệu suất tiết kiệm nhiên liệu ấn tượng và khả năng vận hành linh hoạt. Đây là chiếc xe lý tưởng cho những người tìm kiếm một phương tiện di chuyển tiết kiệm chi phí, dễ dàng đậu xe và bảo trì, trong khi vẫn đảm bảo sự tiện nghi và an toàn.',1,388000.00,'AVAILABLE','HYUNDAI I10',0,0,'2025-08-05 00:34:16','2025-08-05 00:55:58'),
('a0b00e06-c560-4516-bd90-a6360577f8fa','user_001','brand-005','model-002','penalty_001','51K-878.10','CAR','GPS, Bluetooth, Air Conditioning, Parking Sensors, Backup Camera, Remote Start','[\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754280775/e3zfxcifue4jakckp5bp.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754280788/yzaldlx4rzpytgoaxqi3.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754280789/pgcse5q8fumedxwgezwp.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754280791/pfq76ugsnmyva1bbcmq1.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754279570/nqk3beciz1bgv1yhpr5n.jpg\"]','YES','YES','YES',5,2024,'AUTOMATIC','GASOLINE','- Ngoài các ưu đãi về giá MICARRO còn hổ trợ thêm cho Quý Khách hàng các Chính sách như sau:\n* Hoàn Tiền đổ xăng dư.\n* Miễn phí vượt dưới 1h.\n* Miễn phí vượt dưới 10Km.aâb\n- Sử dụng miễn phí: Nước, Đồ ăn vặt, Khăn giấy có trong gói MICAR KIT khi thuê xe\n- Mazda 2 là một dòng xe sedan hạng B . Xe được thiết kế thể thao và hiện đại, với các đường nét sắc sảo và động cơ mạnh mẽ. Mazda 2  có nhiều phiên bản và trang bị khác nhau, từ phiên bản cơ bản đến phiên bản cao cấp với nhiều tính năng tiện ích và công nghệ hiện đại. Xe có khả năng vận hành linh hoạt, êm ái và tiết kiệm nhiên liệu, là một lựa chọn phổ biến trong phân khúc xe nhỏ hạng trung.aaaaaabbbb',1,450000.00,'AVAILABLE','MAZDA 2 2024',0,0,'2025-08-04 11:03:56','2025-08-04 15:10:58'),
('a434c5f8-f854-43c5-a5a0-92862ceebd3d','user_001','brand-005','model-003','penalty_001','51L-916.72','CAR','GPS, Bluetooth, Air Conditioning, DVD Screen, USB Port, Back Camera, ABS Braking','[\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328919/fgvgs3vilo3ootebimnh.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328929/dqre6wgvxsq5obj3ojov.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328934/gufvbrbirgftjdsxsd6y.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328938/awxwtftscepfa1v4slxt.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329023/jcmigd41mb10w8ucpd80.jpg\"]','NO','YES','NO',5,2015,'AUTOMATIC','GASOLINE','Ngoài các ưu đãi về giá, RFT còn hỗ trợ thêm cho Quý Khách hàng các Chính sách như sau:\n• Hoàn tiền đổ xăng dư.\n• Miễn phí vượt dưới 1 giờ.\n• Miễn phí vượt dưới 10Km.\n• Sử dụng miễn phí: Nước, Đồ ăn vặt, Khăn giấy c\n- Mazda 6 là dòng sedan hạng D cao cấp, nổi bật với thiết kế sang trọng, lịch lãm và đậm chất thể thao. Xe sở hữu ngôn ngữ thiết kế KODO đặc trưng của Mazda, mang đến cảm giác năng động và cuốn hút từ mọi góc nhìn. Xe là lựa chọn lý tưởng cho cả nhu cầu công việc lẫn những chuyến đi xa thoải mái, đáp ứng tốt cả về hiệu năng lẫn trải nghiệm sang trọng cho người dùng.',1,730000.00,'AVAILABLE','MAZDA 6 Luxury ',0,0,'2025-08-05 00:37:40','2025-08-05 00:55:58'),
('ac75dac2-41d0-46fd-87cd-7b17b6ac1b80','user_001','brand-019','model-004','penalty_001','30H-086.38','CAR','GPS, Bluetooth, Air Conditioning, Leather Seats, Backup Camera, Sunroof, Safety Airbag, DVD Screen','[\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329759/gv50wipbmliza0jukjca.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329763/fm96jp8mrd3v0bntauwj.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329766/pmlqpwznusob8obe2qqg.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329777/qqlrhx2mvw8ka4tppjtj.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329760/jkbebe4uz4r6pewcscpf.jpg\"]','NO','YES','NO',7,2024,'AUTOMATIC','GASOLINE','Xe gia đình, ít đi nên đăng cho quý anh chị em thuê. một phần hỗ trợ chi phí cho gia đình. mong quý ACE ủng hộ\nTrang bị xe:\nCam hành trình 70Mai\nLoa trầm giải trí\nBi gầm siêu sáng đảm bảo an toàn\nPhim cách nhiệt Lumax của mỹ chống nóng\nĐiều hoà mát lạnh, thơm tho\nXe luôn đc giữ gìn vệ sinh, thảm da sạch',1,1005000.00,'AVAILABLE','MITSUBISHI XPANDER',0,0,'2025-08-05 00:51:14','2025-08-05 00:55:58'),
('b694ee49-d67b-42ac-9d84-704a22f95a58','user_001','brand-007','model-001','penalty_001','51L-579.60','CAR','Speed Alert, Safety Airbag, DVD Screen, USB Port, GPS, Bluetooth, Air Conditioning, Backup Camera','[\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328129/v5noofmu8zmw0dbhcwkf.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328130/p6zzflit8tn7udxcodzp.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328131/k2zgdfzhv0aouc36jobp.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328132/gxrixx5blvdjqfwfosgu.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754328310/fmto8o6zfw3xnt7v09b2.jpg\"]','YES','YES','YES',4,2024,'AUTOMATIC','ELECTRIC','Xe đã cập nhật phần mềm 3A 1.9.5 và đôn ghế tài cao hơn\nXe mới gắn cóp trước 80l bảo vệ pin và thanh sắt chắn phía sau đảm bảo an toàn cho quý khách. Nước suối miễn phí.\nXe đã tráng keo 4 bánh xe(bao cán đinh luôn)\nXe mới đẹp, hiện đại, vận hành êm ái.\nRữa xe miễn phí cho khách. \nGửi xe máy tại nhà miễn phí cho khách.\nCó đầy đủ cammera gương hành trình tích hợp camera lùi, cảm biến lùi.\nHệ thống ADAS thông minh cảnh báo xung quanh, lệch đường...\nDán film cách nhiệt loại 3m tốt nhất bảo vệ da và có thêm màn che nắng.\nXe đi tiết kiệm nhiên liệu, máy lạnh mát rượi.\nĐược gửi xe ôtô miễn phí không quá 5tiếng hoặc trước 22h tại hệ thống Vingroup\nCó ghế trẻ em dưới 10tuổi. \nCó bình chữa cháy, búa phá kính,dù che mưa.\nCó VETC thu phí không dừng.\nCó bảo hiểm thân võ và pin',1,530000.00,'AVAILABLE','VINFAST VF3 ',0,0,'2025-08-05 00:25:12','2025-08-05 00:55:58'),
('ba615d2e-e81f-4965-86f3-bd1b08c13ebd','user_001','brand-001','model-002','penalty_001','51L-594.49','CAR','GPS, Bluetooth, Air Conditioning, Safety Airbag, USB Port, DVD Screen, Sunroof, Leather Seats','[\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329110/pon4l0i9smcozecbssxk.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329127/zba9bu4eyiefpi6vlcwx.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329132/qo6dnamu4nwl0j4epbhm.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329137/a5z0hvtpcyydlcode1dz.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329112/qsuigbecwhayimh6zd9h.jpg\"]','NO','YES','NO',5,2023,'AUTOMATIC','GASOLINE','Ngoài các ưu đãi về giá RFT còn hổ trợ thêm cho Quý Khách hàng các Chính sách như sau:\n* Hoàn Tiền đổ xăng dư.\n* Miễn phí vượt dưới 1h.\n* Miễn phí vượt dưới 10Km.\n- Sử dụng miễn phí: Nước, Đồ ăn vặt, Khăn giấy \n- Toyota Vios là một dòng xe sedan hạng B. Xe được thiết kế hiện đại, sang trọng và có kích thước nhỏ gọn phù hợp với việc di chuyển trong thành phố. Vios được trang bị động cơ mạnh mẽ, tiết kiệm nhiên liệu và có khả năng vận hành ổn định. Đặc biệt, nội thất xe được thiết kế tiện nghi và thoải mái, mang lại sự thoải mái cho người lái và hành khách',1,672000.00,'AVAILABLE','TOYOTA VIOS',0,0,'2025-08-05 00:40:51','2025-08-05 00:55:58'),
('c23d90ef-0bfb-4a39-a386-3aaa574287e4','user_001','brand-007','model-004','penalty_001','17B-024.49','CAR','GPS, Bluetooth, Air Conditioning, Leather Seats, Parking Sensors, Backup Camera, Sunroof, Speed Alert, Safety Airbag, DVD Screen, USB Port, Cruise Control','[\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329916/yfpkkibi2texskqkxkmu.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329935/enggc3by4bu7wdw2zvdv.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329939/faxvvyh2cgvinjcd7w3y.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329945/fsokrggtfag8r48zga9r.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329918/cfqbpsoyk8tiiuxvjuxi.jpg\"]','NO','YES','YES',7,2024,'AUTOMATIC','ELECTRIC','Quy định khác:\n◦ Sử dụng xe đúng mục đích.\n◦ Không sử dụng xe thuê vào mục đích phi pháp, trái pháp luật.\n◦ Không sử dụng xe thuê để cầm cố, thế chấp.\n◦ Không hút thuốc, nhả kẹo cao su, xả rác trong xe.\n◦ Không chở hoa quả, thực phẩm nặng mùi trong xe.\n◦ Khi trả xe, nếu xe bẩn hoặc có mùi trong xe, khách hàng vui lòng vệ sinh xe sạch sẽ hoặc gửi phụ thu phí vệ sinh xe.\nTrân trọng cảm ơn, chúc quý khách hàng có những chuyến đi tuyệt vời !',1,876000.00,'AVAILABLE','VINFAST VF6 ECO',0,0,'2025-08-05 00:53:44','2025-08-05 00:55:58'),
('e43a972a-4d5d-476b-b587-917ada6475bf','user_001','brand-019','model-005','penalty_001','18A-178.65','CAR','GPS, Bluetooth, Air Conditioning, Safety Airbag, DVD Screen, USB Port, Back Camera','[\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329566/igruaow3lwny9ndv8dz6.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329571/ad3wrm2njfzpbwmlp99n.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329574/tq6nublffirdafw7ton3.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329584/jurdreluuxhdbcmjijzx.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329560/y9f9qwdfwwltpwwegw9r.jpg\"]','NO','YES','NO',7,2019,'MANUAL','GASOLINE',' Sử dụng xe đúng mục đích.\n◦ Không sử dụng xe thuê vào mục đích phi pháp, trái pháp luật.\n◦ Không sử dụng xe thuê để cầm cố, thế chấp.\n◦ Không hút thuốc, nhả kẹo cao su, xả rác trong xe.\n◦ Không chở hàng quốc cấm dễ cháy nổ.\n◦ Không chở hoa quả, thực phẩm nặng mùi trong xe.\n◦ Khi trả xe, nếu xe bẩn hoặc có mùi trong xe, khách hàng vui lòng vệ sinh xe sạch sẽ hoặc gửi phụ thu phí vệ sinh xe.\nTrân trọng cảm ơn, chúc quý khách hàng có những chuyến đi tuyệt vời !',1,1148000.00,'AVAILABLE','MITSUBISHI XPANDER',0,0,'2025-08-05 00:48:12','2025-08-05 00:55:58'),
('f96d82b0-30a9-4498-87b4-ff992cc0cc93','user_001','brand-007','model-003','penalty_001','98B-017.06','CAR','GPS, Air Conditioning, Bluetooth, Leather Seats, Backup Camera, Sunroof, Back Camera, USB Port, ABS Braking, Cruise Control, Safety Airbag, DVD Screen','[\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329381/h5ich3vhf60yrsyugdty.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329386/hgjze56xj7ntkw3akyan.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329392/bgultuj8aaxs6qwrjmgw.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329398/iao5dl6dd5gnnoxvredb.jpg\",\"http://res.cloudinary.com/dcakldjvc/image/upload/v1754329381/esriweedfcf69h4f3o5v.jpg\"]','NO','YES','NO',5,2024,'AUTOMATIC','ELECTRIC','◦ Sử dụng xe đúng mục đích.\n◦ Không sử dụng xe thuê vào mục đích phi pháp, trái pháp luật.\n◦ Không sử dụng xe thuê để cầm cố, thế chấp.\n◦ Không hút thuốc, nhả kẹo cao su, xả rác trong xe.\n◦ Không chở hoa quả, thực phẩm nặng mùi trong xe.\n◦ Khi trả xe, nếu xe bẩn hoặc có mùi trong xe, khách hàng vui lòng vệ sinh xe sạch sẽ hoặc gửi phụ thu phí vệ sinh xe.\nTrân trọng cảm ơn, chúc quý khách hàng có những chuyến đi tuyệt vời !',1,1620000.00,'AVAILABLE','VINFAST VF7 PLUS',0,0,'2025-08-05 00:45:10','2025-08-05 00:55:58');