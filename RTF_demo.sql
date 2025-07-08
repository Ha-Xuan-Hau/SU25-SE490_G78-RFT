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
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `role` enum('USER', 'PROVIDER' ,'STAFF','ADMIN') DEFAULT 'USER',
  `open_time` datetime DEFAULT NULL,
  `close_time` datetime DEFAULT NULL,
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
  `status` enum('AVAILABLE','UNAVAILABLE') DEFAULT 'AVAILABLE',
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
  `vehicle_id` varchar(225) DEFAULT NULL,
  `time_booking_start` datetime DEFAULT NULL,
  `time_booking_end` datetime DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` text,
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
  KEY `vehicle_id` (`vehicle_id`),
  KEY `coupon_id` (`coupon_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
  CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- Sample data for demo_rent2 database
USE demo_rent2;

-- Insert sample users
INSERT INTO `users` (`id`, `email`, `password`, `full_name`, `profile_picture`, `date_of_birth`, `phone`, `address`, `status`, `role`, `created_at`, `updated_at`) VALUES
-- Provider 1 (Car rental)
('user_005', 'hauvs789@gmail.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Nguyễn Văn An', 'https://example.com/avatar1.jpg', '1985-03-15', '0912345678', '123 Đường Lê Lợi, Quận 1, TP.HCM', 'ACTIVE', 'ADMIN', '2024-01-15 09:30:00', '2025-07-01 14:20:00'),
-- Provider 1 (Car rental)
('user_001', 'provider.cars@gmail.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Nguyễn Văn An', 'https://example.com/avatar1.jpg', '1985-03-15', '0912345678', '123 Đường Lê Lợi, Quận 1, TP.HCM', 'ACTIVE', 'PROVIDER', '2024-01-15 09:30:00', '2025-07-01 14:20:00'),
-- Provider 2 (Motorbike + Bicycle rental)
('user_002', 'provider.bikes@gmail.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Trần Thị Bình', 'https://example.com/avatar2.jpg', '1990-07-22', '0987654321', '456 Đường Nguyễn Huệ, Quận 3, TP.HCM', 'ACTIVE', 'PROVIDER', '2024-02-20 10:45:00', '2025-07-02 16:30:00'),
-- Regular user
('user_003', 'customer@gmail.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Lê Văn Cường', 'https://example.com/avatar3.jpg', '1995-12-10', '0901234567', '789 Đường Võ Văn Tần, Quận 5, TP.HCM', 'ACTIVE', 'USER', '2024-05-10 13:15:00', '2025-07-03 11:45:00'),
('user_004', 'customer2@gmail.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Lê Xuân Hường', 'https://example.com/avatar3.jpg', '1995-12-10', '0901234567', '789 Đường Võ Văn Tần, Quận 5, TP.HCM', 'ACTIVE', 'USER', '2024-05-10 13:15:00', '2025-07-03 11:45:00');
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
-- Insert some sample coupons (removed duplicate coupon_003)
INSERT INTO `coupons` (`id`, `name`, `discount`, `description`, `time_expired`, `status`, `created_at`, `updated_at`) VALUES
('coupon_001', 'WELCOME10', 10.00, 'Giảm 10% cho khách hàng mới', '2025-12-31 23:59:59', 'VALID', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
('coupon_002', 'SUMMER20', 20.00, 'Giảm 20% dịp hè', '2025-08-31 23:59:59', 'VALID', '2024-06-01 00:00:00', '2024-06-01 00:00:00'),
('coupon_003', 'WEEKEND15', 15.00, 'Giảm 15% cuối tuần', '2025-07-31 23:59:59', 'VALID', '2024-07-01 00:00:00', '2024-07-01 00:00:00');

-- Insert sample bookings
INSERT INTO `bookings` (`id`, `user_id`, `vehicle_id`, `time_booking_start`, `time_booking_end`, `phone_number`, `address`, `code_transaction`, `time_transaction`, `total_cost`, `status`, `penalty_type`, `penalty_value`, `min_cancel_hour`, `coupon_id`, `created_at`, `updated_at`) VALUES
('booking_001', 'user_003', 'vehicle_001', '2025-07-10 08:00:00', '2025-07-12 18:00:00', '0901234567', '789 Đường Võ Văn Tần, Quận 5, TP.HCM', 'TXN001', '2025-07-08 10:30:00', 1600000.00, 'CONFIRMED', 'PERCENT', 10.00, 24, 'coupon_001', '2025-07-07 02:38:00', '2025-07-07 02:38:00'),
('booking_002', 'user_003', 'vehicle_012', '2025-07-15 09:00:00', '2025-07-17 19:00:00', '0901234567', '789 Đường Võ Văn Tần, Quận 5, TP.HCM', 'TXN002', '2025-07-09 14:20:00', 400000.00, 'PENDING', 'FIXED', 50000.00, 12, NULL, '2025-07-07 02:39:00', '2025-07-07 02:39:00');

-- Insert sample contracts
INSERT INTO `contracts` (`id`, `booking_id`, `user_id`, `image`, `status`, `cost_settlement`, `created_at`, `updated_at`) VALUES
('contract_001', 'booking_001', 'user_003', 'https://example.com/contract1.jpg', 'PROCESSING', 1600000.00, '2025-07-07 02:40:00', '2025-07-07 02:40:00');

-- Insert sample ratings
INSERT INTO `ratings` (`id`, `user_id`, `vehicle_id`, `booking_id`, `comment`, `star`, `created_at`, `updated_at`) VALUES
('rating_001', 'user_003', 'vehicle_001', 'booking_001', 'Xe đẹp, chủ xe nhiệt tình, sẽ thuê lại', 5, '2025-07-07 02:41:00', '2025-07-07 02:41:00');

-- Insert booked time slots
INSERT INTO `booked_time_slots` (`id`, `vehicle_id`, `time_from`, `time_to`, `created_at`, `updated_at`) VALUES
('slot_001', 'vehicle_001', '2025-07-10 08:00:00', '2025-07-12 18:00:00', '2025-07-07 02:42:00', '2025-07-07 02:42:00'),
('slot_002', 'vehicle_012', '2025-07-15 09:00:00', '2025-07-17 19:00:00', '2025-07-07 02:43:00', '2025-07-07 02:43:00');

-- Insert wallet transactions
INSERT INTO `wallet_transactions` (`id`, `wallet_id`, `amount`, `status`, `user_id`, `created_at`, `updated_at`) VALUES
('trans_001', 'wallet_001', 1600000.00, 'APPROVED', 'user_001', '2025-07-07 02:44:00', '2025-07-07 02:44:00'),
('trans_002', 'wallet_002', 400000.00, 'PENDING', 'user_002', '2025-07-07 02:45:00', '2025-07-07 02:45:00'),
('trans_003', 'wallet_003', -1600000.00, 'APPROVED', 'user_003', '2025-07-07 02:46:00', '2025-07-07 02:46:00');

/*
-- Sample data for demo_rent database
USE demo_rent2;

-- Insert sample users
INSERT INTO users (id, email, password, full_name, profile_picture, date_of_birth, phone, address, status, role) VALUES
('user-001', 'admin@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Nguyễn Văn Admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', '1990-01-15', '0901234567', '123 Đường Lê Lợi, Quận 1, TP.HCM', 'ACTIVE', 'ADMIN'),
('user-002', 'staff@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Trần Thị Staff', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', '1995-05-20', '0902345678', '456 Đường Nguyễn Huệ, Quận 1, TP.HCM', 'ACTIVE', 'STAFF'),
('user-003', 'john@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'John Smith', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '1988-03-10', '0903456789', '789 Đường Võ Văn Tần, Quận 3, TP.HCM', 'ACTIVE', 'USER'),
('user-004', 'maria@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Maria Garcia', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', '1992-07-25', '0904567890', '321 Đường Pasteur, Quận 1, TP.HCM', 'ACTIVE', 'USER'),
('user-005', 'david@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'David Brown', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '1985-12-08', '0905678901', '654 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', 'ACTIVE', 'USER'),
('user-006', 'anna@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Anna Johnson', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', '1993-09-12', '0906789012', '987 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM', 'ACTIVE', 'USER');

-- Insert sample brands
INSERT INTO brands (id, name, vehicle_type) VALUES
('brand-001', 'Toyota', 'CAR'),
('brand-002', 'Honda', 'CAR'),
('brand-003', 'Hyundai', 'CAR'),
('brand-004', 'Kia', 'CAR'),
('brand-005', 'Mazda', 'CAR'),
('brand-006', 'Ford', 'CAR'),
('brand-007', 'Vinfast', 'CAR'),
('brand-008', 'BMW', 'CAR'),
('brand-009', 'Mercedes', 'CAR'),
('brand-010', 'Audi', 'CAR'),
('brand-011', 'Acura', 'CAR'),
('brand-012', 'Baic', 'CAR'),
('brand-013', 'BYD', 'CAR'),
('brand-014', 'Chevrolet', 'CAR'),
('brand-015', 'Daewoo', 'CAR'),
('brand-016', 'Isuzu', 'CAR'),
('brand-017', 'Land Rover', 'CAR'),
('brand-018', 'Lexus', 'CAR'),
('brand-019', 'Mitsubishi', 'CAR'),
('brand-020', 'Morris Garages', 'CAR'),
('brand-021', 'Nissan', 'CAR'),
('brand-022', 'Peugeot', 'CAR'),
('brand-023', 'Renault', 'CAR'),
('brand-024', 'Subaru', 'CAR'),
('brand-025', 'Suzuki', 'CAR'),
('brand-026', 'Volkswagen', 'CAR'),
('brand-027', 'Wuling', 'CAR'),
('brand-028', 'Zotye', 'CAR'),
('brand-101', 'Honda', 'MOTORBIKE'),
('brand-102', 'Yamaha', 'MOTORBIKE'),
('brand-103', 'Suzuki', 'MOTORBIKE'),
('brand-104', 'Piaggio', 'MOTORBIKE'),
('brand-105', 'Vespa', 'MOTORBIKE'),
('brand-106', 'SYM', 'MOTORBIKE'),
('brand-107', 'VinFast', 'MOTORBIKE'),
('brand-108', 'Kymco', 'MOTORBIKE'),
('brand-109', 'Ducati', 'MOTORBIKE'),
('brand-110', 'BMW Motorrad', 'MOTORBIKE'),
('brand-111', 'Harley-Davidson', 'MOTORBIKE'),
('brand-112', 'Triumph', 'MOTORBIKE'),
('brand-113', 'Royal Enfield', 'MOTORBIKE'),
('brand-114', 'Kawasaki', 'MOTORBIKE');

-- Insert sample models (without brand_id)
INSERT INTO models (id, name) VALUES
('model-001', '4 chỗ (Mini)'),
('model-002', '4 chỗ (Sedan)'),
('model-003', '5 chỗ (CUV Gầm cao)'),
('model-004', '7 chỗ (SUV gầm cao)'),
('model-005', '7 chỗ (MPV gầm thấp)'),
('model-006', 'Bán tải'),
('model-007', 'Minivan');

-- Insert sample vehicles
INSERT INTO vehicles (id, user_id, brand_id, model_id, license_plate, vehicle_type, vehicle_features, vehicle_images, insurance_status, ship_to_address, number_seat, year_manufacture, transmission, fuel_type, description, number_vehicle, cost_per_day, status, thumb, total_ratings, likes) VALUES
('vehicle-001', 'user-003', 'brand-001', 'model-001', '51A-12345', 'CAR', 'GPS, Bluetooth, Air Conditioning, Leather Seats', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'YES', 'YES', 5, 2022, 'AUTOMATIC', 'GASOLINE', 'Toyota Camry 2022 - Xe sang trọng, tiết kiệm nhiên liệu', 1, 800000.00, 'AVAILABLE', 'toyota23', 15, 25),
('vehicle-002', 'user-004', 'brand-002', 'model-002', '51B-67890', 'CAR', 'GPS, Bluetooth, Air Conditioning', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'YES', 'NO', 5, 2021, 'MANUAL', 'GASOLINE', 'Honda Civic 2021 - Xe thể thao, vận hành mượt mà', 1, 700000.00, 'AVAILABLE', 'toyota23', 12, 18),
('vehicle-003', 'user-005', 'brand-003', 'model-003', '51C-11111', 'CAR', 'GPS, Bluetooth, Air Conditioning, Sunroof, 4WD', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'YES', 'NO', 5, 2023, 'AUTOMATIC', 'GASOLINE', 'Hyundai Tucson 2023 - SUV mạnh mẽ, tiện nghi', 1, 1200000.00, 'AVAILABLE', 'toyota23', 8, 12),
('vehicle-004', 'user-006', 'brand-004', 'model-004', '51D-22222', 'CAR', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'YES', 'YES', 7, 2023, 'AUTOMATIC', 'ELECTRIC', 'VinFast VF8 2023 - SUV điện hiện đại, thân thiện môi trường', 1, 1500000.00, 'AVAILABLE', 'toyota23', 5, 6),
('vehicle-005', 'user-003', 'brand-002', 'model-002', '51E-33333', 'CAR', 'GPS, Bluetooth, Air Conditioning', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'NO', 'NO', 5, 2020, 'MANUAL', 'GASOLINE', 'Toyota Vios 2020 - Xe kinh tế, phù hợp di chuyển trong thành phố', 2, 500000.00, 'AVAILABLE', 'toyota23', 20, 30),
('vehicle-006', 'user-004', 'brand-004', 'model-004', '51F-44444', 'CAR', 'GPS, Bluetooth, Air Conditioning, Sunroof', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'YES', 'YES', 5, 2022, 'AUTOMATIC', 'GASOLINE', 'Mazda CX-5 2022 - SUV sang trọng, thiết kế đẹp mắt', 1, 1000000.00, 'UNAVAILABLE', 'toyota23', 10, 15),
('vehicle-007', 'user-005', 'brand-007', 'model-007', '51G-55555', 'CAR', 'GPS, Bluetooth, Air Conditioning, Leather Seats, Premium Sound', '["https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*","https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*"]', 'YES', 'NO', 5, 2023, 'AUTOMATIC', 'GASOLINE', 'BMW 320i 2023 - Xe sang hạng premium, trải nghiệm lái tuyệt vời', 1, 2000000.00, 'AVAILABLE', 'toyota23', 3, 5);
-- Insert sample driver licenses
INSERT INTO driver_licenses (id, user_id, license_number, class, status, image) VALUES
('license-001', 'user-003', 'B123456789', 'B2', 'VALID', 'https://example.com/license1.jpg'),
('license-002', 'user-004', 'B987654321', 'B2', 'VALID', 'https://example.com/license2.jpg'),
('license-003', 'user-005', 'B555666777', 'B2', 'VALID', 'https://example.com/license3.jpg'),
('license-004', 'user-006', 'B111222333', 'B2', 'EXPIRED', 'https://example.com/license4.jpg');

-- Insert sample coupons
INSERT INTO coupons (id, name, discount, description, time_expired) VALUES
('coupon-001', 'NEWUSER10', 10.00, 'Giảm 10% cho khách hàng mới', '2025-12-31 23:59:59'),
('coupon-002', 'SUMMER20', 20.00, 'Giảm 20% cho mùa hè', '2025-08-31 23:59:59'),
('coupon-003', 'WEEKEND15', 15.00, 'Giảm 15% cho thuê xe cuối tuần', '2025-07-31 23:59:59'),
('coupon-004', 'LONGTERM25', 25.00, 'Giảm 25% cho thuê dài hạn (từ 7 ngày)', '2025-12-31 23:59:59'),
('coupon-005', 'VIP30', 30.00, 'Giảm 30% cho khách hàng VIP', '2025-06-30 23:59:59');

-- Insert sample bookings
INSERT INTO bookings (id, user_id, vehicle_id, time_booking_start, time_booking_end, phone_number, address, code_transaction, time_transaction, total_cost, status, coupon_id) VALUES
('booking-001', 'user-003', 'vehicle-001', '2025-06-15 08:00:00', '2025-06-17 18:00:00', '0903456789', '789 Đường Võ Văn Tần, Quận 3, TP.HCM', 'TXN001', '2025-06-12 10:30:00', 1440000.00, 'CONFIRMED', 'coupon-001'),
('booking-002', 'user-004', 'vehicle-002', '2025-06-20 09:00:00', '2025-06-22 17:00:00', '0904567890', '321 Đường Pasteur, Quận 1, TP.HCM', 'TXN002', '2025-06-12 14:15:00', 1260000.00, 'CONFIRMED', 'coupon-002'),
('booking-003', 'user-005', 'vehicle-003', '2025-06-18 07:00:00', '2025-06-25 19:00:00', '0905678901', '654 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', 'TXN003', '2025-06-12 16:45:00', 7200000.00, 'PENDING', NULL),
('booking-004', 'user-006', 'vehicle-004', '2025-06-14 10:00:00', '2025-06-16 20:00:00', '0906789012', '987 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM', 'TXN004', '2025-06-12 11:20:00', 3600000.00, 'COMPLETED', 'coupon-003'),
('booking-005', 'user-003', 'vehicle-005', '2025-06-13 08:00:00', '2025-06-13 22:00:00', '0903456789', '789 Đường Võ Văn Tần, Quận 3, TP.HCM', 'TXN005', '2025-06-12 09:10:00', 500000.00, 'COMPLETED', NULL),
('booking-006', 'user-004', 'vehicle-006', '2025-06-10 06:00:00', '2025-06-12 18:00:00', '0904567890', '321 Đường Pasteur, Quận 1, TP.HCM', 'TXN006', '2025-06-09 15:30:00', 2000000.00, 'CANCELLED', NULL);

-- Insert sample contracts
INSERT INTO contracts (id, booking_id, user_id, image, status, cost_settlement) VALUES
('contract-001', 'booking-001', 'user-003', 'https://example.com/contract1.pdf', 'FINISHED', 1440000.00),
('contract-002', 'booking-002', 'user-004', 'https://example.com/contract2.pdf', 'FINISHED', 1260000.00),
('contract-003', 'booking-003', 'user-005', 'https://example.com/contract3.pdf', 'PROCESSING', 0.00),
('contract-004', 'booking-004', 'user-006', 'https://example.com/contract4.pdf', 'FINISHED', 3600000.00),
('contract-005', 'booking-005', 'user-003', 'https://example.com/contract5.pdf', 'FINISHED', 500000.00);

-- Insert sample final contracts
INSERT INTO final_contracts (id, contract_id, user_id, image, time_finish, cost_settlement, note) VALUES
('final-001', 'contract-004', 'user-006', 'https://example.com/final_contract1.pdf', '2025-06-16 20:30:00', 3600000.00, 'Xe trả đúng hẹn, không có hư hỏng'),
('final-002', 'contract-005', 'user-003', 'https://example.com/final_contract2.pdf', '2025-06-13 22:15:00', 500000.00, 'Xe trả sớm, tình trạng tốt'),
('final-003', 'contract-001', 'user-003', 'https://example.com/final_contract3.pdf', '2025-06-17 18:20:00', 1440000.00, 'Hoàn thành tốt, khách hàng hài lòng');

-- Insert sample ratings
INSERT INTO ratings (id, user_id, vehicle_id, booking_id, comment, star) VALUES
('rating-001', 'user-006', 'vehicle-004', 'booking-004', 'Xe rất tốt, sạch sẽ và tiết kiệm nhiên liệu. Sẽ thuê lại lần sau!', 5),
('rating-002', 'user-003', 'vehicle-005', 'booking-005', 'Xe ổn, giá hợp lý. Phù hợp cho di chuyển trong thành phố.', 4),
('rating-003', 'user-003', 'vehicle-001', 'booking-001', 'Toyota Camry rất êm ái và thoải mái. Dịch vụ tốt!', 5),
('rating-004', 'user-004', 'vehicle-002', 'booking-002', 'Honda Civic chạy khỏe, nhưng hơi ồn trên đường cao tốc.', 4),
('rating-005', 'user-005', 'vehicle-003', 'booking-003', 'SUV rộng rãi, phù hợp gia đình. Tuy nhiên giá hơi cao.', 4);

-- Insert sample booked time slots
INSERT INTO booked_time_slots (id, vehicle_id, time_from, time_to) VALUES
('slot-001', 'vehicle-001', '2025-06-15 08:00:00', '2025-06-17 18:00:00'),
('slot-002', 'vehicle-002', '2025-06-20 09:00:00', '2025-06-22 17:00:00'),
('slot-003', 'vehicle-003', '2025-06-18 07:00:00', '2025-06-25 19:00:00'),
('slot-004', 'vehicle-004', '2025-06-14 10:00:00', '2025-06-16 20:00:00'),
('slot-005', 'vehicle-005', '2025-06-13 08:00:00', '2025-06-13 22:00:00'),
('slot-006', 'vehicle-006', '2025-06-10 06:00:00', '2025-06-12 18:00:00'),
('slot-007', 'vehicle-001', '2025-06-28 10:00:00', '2025-06-30 16:00:00'),
('slot-008', 'vehicle-007', '2025-06-25 08:00:00', '2025-06-27 20:00:00');
*/