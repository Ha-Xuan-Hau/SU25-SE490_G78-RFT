CREATE DATABASE IF NOT EXISTS `demo_rent` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `demo_rent`;

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
  `role` enum('USER','STAFF','ADMIN') DEFAULT 'USER',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `brands`
CREATE TABLE `brands` (
  `id` varchar(255) NOT NULL,
  `name` nvarchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `models`
CREATE TABLE `models` (
  `id` varchar(255) NOT NULL,
  `brand_id` varchar(255) DEFAULT NULL,
  `name` nvarchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `brand_id` (`brand_id`),
  CONSTRAINT `models_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `vehicles`
CREATE TABLE `vehicles` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `brand_id` varchar(255) DEFAULT NULL,
  `model_id` varchar(255) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `vehicle_types` varchar(50) DEFAULT NULL,
  `vehicle_features` text,
  `vehicle_image` text,
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
  CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `vehicles_ibfk_2` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `vehicles_ibfk_3` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`)
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
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
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
  `status` enum('PENDING','CONFIRMED','CANCELLED','COMPLETED') DEFAULT 'PENDING',
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
  `status` enum('DRAFT','FINISHED','CANCELLED') DEFAULT 'DRAFT',
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

-- Sample data for demo_rent database
USE demo_rent;

-- Insert sample users
INSERT INTO users (id, email, password, full_name, profile_picture, date_of_birth, phone, address, status, role) VALUES
('user-001', 'admin@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Nguyễn Văn Admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', '1990-01-15', '0901234567', '123 Đường Lê Lợi, Quận 1, TP.HCM', 'ACTIVE', 'ADMIN'),
('user-002', 'staff@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Trần Thị Staff', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', '1995-05-20', '0902345678', '456 Đường Nguyễn Huệ, Quận 1, TP.HCM', 'ACTIVE', 'STAFF'),
('user-003', 'john@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'John Smith', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '1988-03-10', '0903456789', '789 Đường Võ Văn Tần, Quận 3, TP.HCM', 'ACTIVE', 'USER'),
('user-004', 'maria@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Maria Garcia', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', '1992-07-25', '0904567890', '321 Đường Pasteur, Quận 1, TP.HCM', 'ACTIVE', 'USER'),
('user-005', 'david@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'David Brown', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '1985-12-08', '0905678901', '654 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', 'ACTIVE', 'USER'),
('user-006', 'anna@example.com', '$2a$10$MXEx0gn5RbPIJCvVFC0JPulYL08jqAWj3VSnRaJ08HyccxUheRB6e', 'Anna Johnson', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', '1993-09-12', '0906789012', '987 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM', 'ACTIVE', 'USER');

-- Insert sample brands
INSERT INTO brands (id, name) VALUES
('brand-001', 'Toyota'),
('brand-002', 'Honda'),
('brand-003', 'Hyundai'),
('brand-004', 'KIA'),
('brand-005', 'Mazda'),
('brand-006', 'Ford'),
('brand-007', 'Vinfast'),
('brand-008', 'BMW'),
('brand-009', 'Mercedes-Benz'),
('brand-010', 'Audi');

-- Insert sample models
INSERT INTO models (id, brand_id, name) VALUES
('model-001', 'brand-001', 'Camry'),
('model-002', 'brand-001', 'Corolla'),
('model-003', 'brand-001', 'Vios'),
('model-004', 'brand-002', 'Civic'),
('model-005', 'brand-002', 'City'),
('model-006', 'brand-002', 'Accord'),
('model-007', 'brand-003', 'Elantra'),
('model-008', 'brand-003', 'Tucson'),
('model-009', 'brand-004', 'Cerato'),
('model-010', 'brand-004', 'Seltos'),
('model-011', 'brand-005', 'CX-5'),
('model-012', 'brand-005', 'Mazda3'),
('model-013', 'brand-006', 'EcoSport'),
('model-014', 'brand-006', 'Everest'),
('model-015', 'brand-007', 'VF8'),
('model-016', 'brand-007', 'VF9'),
('model-017', 'brand-008', 'X3'),
('model-018', 'brand-008', '320i'),
('model-019', 'brand-009', 'C-Class'),
('model-020', 'brand-009', 'E-Class');

-- Insert sample vehicles
INSERT INTO vehicles (id, user_id, brand_id, model_id, license_plate, vehicle_types, vehicle_features, vehicle_image, insurance_status, ship_to_address, number_seat, year_manufacture, transmission, fuel_type, description, number_vehicle, cost_per_day, status, thumb, total_ratings, likes) VALUES
('vehicle-001', 'user-003', 'brand-001', 'model-001', '51A-12345', 'Car', 'GPS, Bluetooth, Air Conditioning, Leather Seats', '"[\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*\"]"', 'YES', 'YES', 5, 2022, 'AUTOMATIC', 'GASOLINE', 'Toyota Camry 2022 - Xe sang trọng, tiết kiệm nhiên liệu', 1, 800000.00, 'AVAILABLE', 'toyota23', 15, 25),
('vehicle-002', 'user-004', 'brand-002', 'model-004', '51B-67890', 'Car', 'GPS, Bluetooth, Air Conditioning', '"[\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*\"]"', 'YES', 'NO', 5, 2021, 'MANUAL', 'GASOLINE', 'Honda Civic 2021 - Xe thể thao, vận hành mượt mà', 1, 700000.00, 'AVAILABLE', 'toyota23', 12, 18),
('vehicle-003', 'user-005', 'brand-003', 'model-008', '51C-11111', 'Car', 'GPS, Bluetooth, Air Conditioning, Sunroof, 4WD', '"[\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*\"]"', 1, 1200000.00, 'AVAILABLE', 'toyota23', 8, 12),
('vehicle-004', 'user-006', 'brand-007', 'model-015', '51D-22222', 'Car', 'GPS, Bluetooth, Air Conditioning, Electric Charging', '"[\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*\"]"', 'YES', 'YES', 7, 2023, 'AUTOMATIC', 'ELECTRIC', 'VinFast VF8 2023 - SUV điện hiện đại, thân thiện môi trường', 1, 1500000.00, 'AVAILABLE', 'toyota23', 5, 😎,
('vehicle-005', 'user-003', 'brand-001', 'model-003', '51E-33333', 'Car', 'GPS, Bluetooth, Air Conditioning', '"[\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*\"]"', 'NO', 'NO', 5, 2020, 'MANUAL', 'GASOLINE', 'Toyota Vios 2020 - Xe kinh tế, phù hợp di chuyển trong thành phố', 2, 500000.00, 'AVAILABLE', 'toyota23', 20, 30),
('vehicle-006', 'user-004', 'brand-005', 'model-011', '51F-44444', 'Car', 'GPS, Bluetooth, Air Conditioning, Sunroof', '"[\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*\"]"', 'YES', 'YES', 5, 2022, 'AUTOMATIC', 'GASOLINE', 'Mazda CX-5 2022 - SUV sang trọng, thiết kế đẹp mắt', 1, 1000000.00, 'UNAVAILABLE', 'toyota23', 10, 15),
('vehicle-007', 'user-005', 'brand-008', 'model-018', '51G-55555', 'Car', 'GPS, Bluetooth, Air Conditioning, Leather Seats, Premium Sound', '"[\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*\",\"https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*\"]"', 'YES', 'NO', 5, 2023, 'AUTOMATIC', 'GASOLINE', 'BMW 320i 2023 - Xe sang hạng premium, trải nghiệm lái tuyệt vời', 1, 2000000.00, 'AVAILABLE', 'toyota23', 3, 5);

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
('contract-003', 'booking-003', 'user-005', 'https://example.com/contract3.pdf', 'DRAFT', 0.00),
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