-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: rightpolamright
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `customer_id` bigint NOT NULL,
  `label` varchar(80) NOT NULL,
  `address_line` varchar(500) NOT NULL,
  `city` varchar(120) NOT NULL,
  `state` varchar(120) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `favourite_route_destination` varchar(500) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_addresses_customer` (`customer_id`),
  CONSTRAINT `fk_addresses_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `designation` varchar(80) DEFAULT NULL,
  `department` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `ix_admins_id` (`id`),
  CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_user_id` bigint DEFAULT NULL,
  `actor_name` varchar(160) NOT NULL,
  `action` varchar(100) NOT NULL,
  `resource_type` varchar(80) NOT NULL,
  `resource_id` varchar(80) DEFAULT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `before_data` json DEFAULT NULL,
  `after_data` json DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_audit_user` (`actor_user_id`),
  KEY `idx_audit_resource_time` (`resource_type`,`resource_id`,`created_at`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_stops`
--

DROP TABLE IF EXISTS `booking_stops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_stops` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_id` bigint NOT NULL,
  `sequence_number` int NOT NULL,
  `stop_type` varchar(20) NOT NULL,
  `address` varchar(500) NOT NULL,
  `latitude` decimal(38,2) DEFAULT NULL,
  `longitude` decimal(38,2) DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `instructions` varchar(500) DEFAULT NULL,
  `arrival_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_booking_stop_sequence` (`booking_id`,`sequence_number`),
  CONSTRAINT `fk_booking_stop_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_stops`
--

LOCK TABLES `booking_stops` WRITE;
/*!40000 ALTER TABLE `booking_stops` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_stops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_number` varchar(40) NOT NULL,
  `customer_id` bigint NOT NULL,
  `driver_id` bigint DEFAULT NULL,
  `truck_id` bigint DEFAULT NULL,
  `pickup_address` varchar(500) NOT NULL,
  `pickup_city` varchar(120) NOT NULL,
  `pickup_latitude` decimal(38,2) DEFAULT NULL,
  `pickup_longitude` decimal(38,2) DEFAULT NULL,
  `drop_address` varchar(500) NOT NULL,
  `drop_city` varchar(120) NOT NULL,
  `drop_latitude` decimal(38,2) DEFAULT NULL,
  `drop_longitude` decimal(38,2) DEFAULT NULL,
  `load_type` varchar(80) NOT NULL,
  `load_weight_tons` decimal(8,2) NOT NULL,
  `vehicle_type` varchar(50) NOT NULL,
  `scheduled_pickup_at` timestamp NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'REQUESTED',
  `payment_status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `distance_km` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estimated_fare` decimal(12,2) NOT NULL DEFAULT '0.00',
  `final_fare` decimal(12,2) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `load_request_id` bigint DEFAULT NULL,
  `original_fare` decimal(12,2) DEFAULT NULL,
  `admin_adjustment` decimal(12,2) NOT NULL DEFAULT '0.00',
  `adjustment_reason` varchar(500) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_number` (`booking_number`),
  KEY `fk_bookings_truck` (`truck_id`),
  KEY `idx_bookings_status_date` (`status`,`scheduled_pickup_at`),
  KEY `idx_bookings_customer` (`customer_id`),
  KEY `idx_bookings_driver` (`driver_id`),
  KEY `fk_booking_load_request` (`load_request_id`),
  CONSTRAINT `fk_booking_load_request` FOREIGN KEY (`load_request_id`) REFERENCES `load_requests` (`id`),
  CONSTRAINT `fk_bookings_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_bookings_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `fk_bookings_truck` FOREIGN KEY (`truck_id`) REFERENCES `trucks` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,'BKG-1001',1,1,1,'Guindy','Chennai',NULL,NULL,'Koyambedu','Chennai',NULL,NULL,'FURNITURE',0.50,'TATA_ACE','2026-07-16 04:49:48','IN_TRANSIT','PENDING',18.00,1850.00,NULL,NULL,'2026-07-16 04:49:48','2026-07-16 04:49:48',0,1,NULL,0.00,NULL,0),(2,'BKG-1002',2,2,2,'Trichy','Trichy',NULL,NULL,'Chennai','Chennai',NULL,NULL,'TEXTILES',3.00,'14_FT','2026-07-16 04:49:48','COMPLETED','PAID',330.00,14500.00,NULL,NULL,'2026-07-16 04:49:48','2026-07-16 04:49:48',0,2,NULL,0.00,NULL,0);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `business_profiles`
--

DROP TABLE IF EXISTS `business_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `business_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `customer_id` bigint NOT NULL,
  `company_name` varchar(180) NOT NULL,
  `gst_number` varchar(30) DEFAULT NULL,
  `billing_email` varchar(160) DEFAULT NULL,
  `billing_address` varchar(500) DEFAULT NULL,
  `verification_status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_id` (`customer_id`),
  CONSTRAINT `fk_business_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `business_profiles`
--

LOCK TABLES `business_profiles` WRITE;
/*!40000 ALTER TABLE `business_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `business_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cost_management`
--

DROP TABLE IF EXISTS `cost_management`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cost_management` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `version_number` bigint NOT NULL,
  `base_fare` decimal(12,2) NOT NULL,
  `rate_per_kilometre` decimal(12,2) NOT NULL,
  `rate_per_kilogram` decimal(12,4) NOT NULL,
  `minimum_booking_amount` decimal(12,2) NOT NULL,
  `fuel_surcharge_percentage` decimal(6,2) NOT NULL DEFAULT '0.00',
  `toll_charge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `driver_bata` decimal(12,2) NOT NULL DEFAULT '0.00',
  `loading_charge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unloading_charge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `platform_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_gateway_fee_percentage` decimal(6,2) NOT NULL DEFAULT '0.00',
  `gst_percentage` decimal(6,2) NOT NULL DEFAULT '18.00',
  `normal_surge_multiplier` decimal(5,2) NOT NULL DEFAULT '1.00',
  `high_demand_surge_multiplier` decimal(5,2) NOT NULL DEFAULT '1.00',
  `peak_hour_surge_multiplier` decimal(5,2) NOT NULL DEFAULT '1.00',
  `weekend_surge_multiplier` decimal(5,2) NOT NULL DEFAULT '1.00',
  `rain_surge_multiplier` decimal(5,2) NOT NULL DEFAULT '1.00',
  `waiting_charge_per_hour` decimal(12,2) NOT NULL DEFAULT '0.00',
  `cancellation_charge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `effective_from` datetime(6) NOT NULL,
  `effective_to` datetime(6) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '0',
  `updated_by` bigint DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_management_version` (`version_number`),
  KEY `fk_cost_management_user` (`updated_by`),
  KEY `idx_cost_management_effective` (`active`,`effective_from`,`effective_to`),
  CONSTRAINT `fk_cost_management_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cost_management`
--

LOCK TABLES `cost_management` WRITE;
/*!40000 ALTER TABLE `cost_management` DISABLE KEYS */;
/*!40000 ALTER TABLE `cost_management` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cost_management_truck_rates`
--

DROP TABLE IF EXISTS `cost_management_truck_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cost_management_truck_rates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cost_management_id` bigint NOT NULL,
  `truck_type` varchar(60) NOT NULL,
  `base_fare` decimal(12,2) NOT NULL,
  `minimum_rate_per_kilometre` decimal(12,2) NOT NULL,
  `maximum_rate_per_kilometre` decimal(12,2) NOT NULL,
  `minimum_supported_weight` decimal(12,2) NOT NULL,
  `maximum_supported_weight` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_truck_rate_version` (`cost_management_id`,`truck_type`),
  CONSTRAINT `fk_truck_rate_cost` FOREIGN KEY (`cost_management_id`) REFERENCES `cost_management` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cost_management_truck_rates`
--

LOCK TABLES `cost_management_truck_rates` WRITE;
/*!40000 ALTER TABLE `cost_management_truck_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `cost_management_truck_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(40) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `discount_type` varchar(20) NOT NULL,
  `discount_value` decimal(12,2) NOT NULL,
  `maximum_discount` decimal(12,2) DEFAULT NULL,
  `minimum_booking_amount` decimal(12,2) DEFAULT NULL,
  `valid_from` timestamp NOT NULL,
  `valid_until` timestamp NOT NULL,
  `usage_limit` int DEFAULT NULL,
  `usage_count` int NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `customer_code` varchar(30) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `mobile_number` varchar(20) NOT NULL,
  `email` varchar(160) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `pincode` varchar(255) DEFAULT NULL,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(255) DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `total_bookings` int NOT NULL DEFAULT '0',
  `completed_bookings` int NOT NULL DEFAULT '0',
  `wallet_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `customer_type` varchar(30) DEFAULT 'Individual',
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_code` (`customer_code`),
  UNIQUE KEY `mobile_number` (`mobile_number`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_customers_status` (`status`),
  KEY `idx_customers_city` (`city`),
  CONSTRAINT `fk_customers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,2,'CUS-1001','Arun Customer','9000000001','arun@example.com',NULL,NULL,'Chennai','Tamil Nadu',NULL,NULL,NULL,NULL,0,0,0.00,'ACTIVE','2026-07-16 04:49:48','2026-07-16 04:49:48',0,'Individual'),(2,3,'CUS-1002','Meena Logistics','9000000002','meena@example.com',NULL,NULL,'Trichy','Tamil Nadu',NULL,NULL,NULL,NULL,0,0,0.00,'ACTIVE','2026-07-16 04:49:48','2026-07-16 04:49:48',0,'Individual'),(3,8,'CUS-8','Customer User','9000008001','customer@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0.00,'ACTIVE','2026-07-16 03:34:30','2026-07-16 03:34:30',0,'Individual'),(4,10,'CUS-10','Customer User','9000900001','customerr@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0.00,'ACTIVE','2026-07-22 01:31:11','2026-07-22 01:31:11',0,'Individual');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_tokens`
--

DROP TABLE IF EXISTS `device_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `device_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token` varchar(512) NOT NULL,
  `platform` varchar(30) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_device_token` (`token`),
  KEY `idx_device_tokens_user_active` (`user_id`,`active`),
  CONSTRAINT `fk_device_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_tokens`
--

LOCK TABLES `device_tokens` WRITE;
/*!40000 ALTER TABLE `device_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `device_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `owner_type` varchar(255) DEFAULT NULL,
  `owner_id` bigint NOT NULL,
  `document_type` varchar(255) DEFAULT NULL,
  `verification_status` varchar(255) DEFAULT NULL,
  `original_file_name` varchar(255) NOT NULL,
  `stored_file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `content_type` varchar(255) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_documents_owner` (`owner_type`,`owner_id`),
  KEY `idx_documents_status` (`verification_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_availability`
--

DROP TABLE IF EXISTS `driver_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_availability` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` bigint NOT NULL,
  `unavailable_date` date DEFAULT NULL,
  `reason` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_id` (`driver_id`),
  KEY `ix_driver_availability_id` (`id`),
  KEY `ix_driver_availability_unavailable_date` (`unavailable_date`),
  CONSTRAINT `driver_availability_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_availability`
--

LOCK TABLES `driver_availability` WRITE;
/*!40000 ALTER TABLE `driver_availability` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_availability_requests`
--

DROP TABLE IF EXISTS `driver_availability_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_availability_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `request_number` varchar(40) NOT NULL,
  `driver_id` bigint NOT NULL,
  `mode` varchar(30) NOT NULL,
  `start_location` varchar(255) DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `start_latitude` decimal(38,2) DEFAULT NULL,
  `start_longitude` decimal(38,2) DEFAULT NULL,
  `destination_latitude` decimal(38,2) DEFAULT NULL,
  `destination_longitude` decimal(38,2) DEFAULT NULL,
  `available_at` timestamp NOT NULL,
  `capacity_tons` decimal(38,2) DEFAULT NULL,
  `truck_type` varchar(255) DEFAULT NULL,
  `bid_amount` decimal(38,2) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_number` (`request_number`),
  KEY `idx_driver_availability_search` (`status`,`mode`,`available_at`),
  KEY `idx_driver_availability_driver` (`driver_id`,`created_at`),
  CONSTRAINT `fk_driver_availability_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_availability_requests`
--

LOCK TABLES `driver_availability_requests` WRITE;
/*!40000 ALTER TABLE `driver_availability_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_availability_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_availability_slots`
--

DROP TABLE IF EXISTS `driver_availability_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_availability_slots` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` bigint NOT NULL,
  `truck_id` bigint DEFAULT NULL,
  `available_from` date DEFAULT NULL,
  `available_to` date DEFAULT NULL,
  `available_from_time` varchar(10) DEFAULT NULL,
  `available_to_time` varchar(10) DEFAULT NULL,
  `from_location` varchar(120) DEFAULT NULL,
  `from_lat` float DEFAULT NULL,
  `from_lng` float DEFAULT NULL,
  `preferred_drop` varchar(120) DEFAULT NULL,
  `preferred_drop_lat` float DEFAULT NULL,
  `preferred_drop_lng` float DEFAULT NULL,
  `max_distance_km` float DEFAULT NULL,
  `trip_type` varchar(30) DEFAULT NULL,
  `total_capacity_ton` float DEFAULT NULL,
  `available_capacity_ton` float DEFAULT NULL,
  `notes` varchar(200) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `truck_id` (`truck_id`),
  KEY `ix_driver_availability_slots_driver_id` (`driver_id`),
  KEY `ix_driver_availability_slots_status` (`status`),
  KEY `ix_driver_availability_slots_id` (`id`),
  KEY `ix_driver_availability_slots_available_to` (`available_to`),
  KEY `ix_driver_availability_slots_is_active` (`is_active`),
  KEY `ix_driver_availability_slots_available_from` (`available_from`),
  CONSTRAINT `driver_availability_slots_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `driver_availability_slots_ibfk_2` FOREIGN KEY (`truck_id`) REFERENCES `trucks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_availability_slots`
--

LOCK TABLES `driver_availability_slots` WRITE;
/*!40000 ALTER TABLE `driver_availability_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_availability_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_documents`
--

DROP TABLE IF EXISTS `driver_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` bigint NOT NULL,
  `document_type` varchar(40) NOT NULL,
  `verification_status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `original_file_name` varchar(255) NOT NULL,
  `stored_file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `content_type` varchar(120) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_driver_document_type` (`driver_id`,`document_type`),
  CONSTRAINT `fk_driver_documents_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_documents`
--

LOCK TABLES `driver_documents` WRITE;
/*!40000 ALTER TABLE `driver_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_locations`
--

DROP TABLE IF EXISTS `driver_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_locations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `trip_id` bigint NOT NULL,
  `driver_id` bigint NOT NULL,
  `client_event_id` varchar(80) NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `accuracy_meters` decimal(8,2) DEFAULT NULL,
  `speed_kph` decimal(8,2) DEFAULT NULL,
  `heading_degrees` decimal(8,2) DEFAULT NULL,
  `recorded_at` timestamp NOT NULL,
  `received_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `offline_event` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_event_id` (`client_event_id`),
  KEY `fk_driver_location_driver` (`driver_id`),
  KEY `idx_driver_location_trip_time` (`trip_id`,`recorded_at`),
  CONSTRAINT `fk_driver_location_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `fk_driver_location_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_locations`
--

LOCK TABLES `driver_locations` WRITE;
/*!40000 ALTER TABLE `driver_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_matches`
--

DROP TABLE IF EXISTS `driver_matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_matches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_id` bigint NOT NULL,
  `driver_id` bigint NOT NULL,
  `truck_id` bigint NOT NULL,
  `truck_fit_score` decimal(6,2) NOT NULL,
  `eta_score` decimal(6,2) NOT NULL,
  `rating_score` decimal(6,2) NOT NULL,
  `availability_score` decimal(6,2) NOT NULL,
  `route_score` decimal(6,2) NOT NULL,
  `total_score` decimal(6,2) NOT NULL,
  `eta_minutes` int DEFAULT NULL,
  `route_deviation_km` decimal(10,2) DEFAULT NULL,
  `eligible` tinyint(1) NOT NULL DEFAULT '1',
  `warnings` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_driver_match` (`booking_id`,`driver_id`,`truck_id`),
  KEY `fk_driver_match_driver` (`driver_id`),
  KEY `fk_driver_match_truck` (`truck_id`),
  CONSTRAINT `fk_driver_match_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `fk_driver_match_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `fk_driver_match_truck` FOREIGN KEY (`truck_id`) REFERENCES `trucks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_matches`
--

LOCK TABLES `driver_matches` WRITE;
/*!40000 ALTER TABLE `driver_matches` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_offers`
--

DROP TABLE IF EXISTS `driver_offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_offers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_id` bigint NOT NULL,
  `driver_id` bigint NOT NULL,
  `offered_amount` decimal(12,2) NOT NULL,
  `counter_amount` decimal(12,2) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'OFFERED',
  `expires_at` timestamp NOT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_driver_offer_booking` (`booking_id`),
  KEY `fk_driver_offer_driver` (`driver_id`),
  KEY `idx_driver_offer_status_expiry` (`status`,`expires_at`),
  CONSTRAINT `fk_driver_offer_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `fk_driver_offer_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_offers`
--

LOCK TABLES `driver_offers` WRITE;
/*!40000 ALTER TABLE `driver_offers` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_ratings`
--

DROP TABLE IF EXISTS `driver_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_ratings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` bigint NOT NULL,
  `trip_id` bigint DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `rating` float NOT NULL,
  `comment` text,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_id` (`driver_id`),
  KEY `trip_id` (`trip_id`),
  KEY `customer_id` (`customer_id`),
  KEY `ix_driver_ratings_id` (`id`),
  CONSTRAINT `driver_ratings_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `driver_ratings_ibfk_2` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`),
  CONSTRAINT `driver_ratings_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_ratings`
--

LOCK TABLES `driver_ratings` WRITE;
/*!40000 ALTER TABLE `driver_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_settlements`
--

DROP TABLE IF EXISTS `driver_settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_settlements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `settlement_number` varchar(40) NOT NULL,
  `driver_id` bigint NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `gross_amount` decimal(12,2) NOT NULL,
  `platform_commission` decimal(12,2) NOT NULL,
  `deductions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_amount` decimal(12,2) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `provider_reference` varchar(120) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settlement_number` (`settlement_number`),
  KEY `fk_driver_settlement_driver` (`driver_id`),
  CONSTRAINT `fk_driver_settlement_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_settlements`
--

LOCK TABLES `driver_settlements` WRITE;
/*!40000 ALTER TABLE `driver_settlements` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_status_history`
--

DROP TABLE IF EXISTS `driver_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_status_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` bigint NOT NULL,
  `previous_status` varchar(30) DEFAULT NULL,
  `new_status` varchar(30) NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `changed_by` varchar(120) DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_driver_status_history_driver` (`driver_id`,`changed_at`),
  CONSTRAINT `fk_driver_status_history_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_status_history`
--

LOCK TABLES `driver_status_history` WRITE;
/*!40000 ALTER TABLE `driver_status_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drivers`
--

DROP TABLE IF EXISTS `drivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drivers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `driver_code` varchar(30) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `mobile_number` varchar(20) NOT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `city` varchar(120) DEFAULT NULL,
  `state` varchar(120) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `languages` varchar(120) DEFAULT NULL,
  `profile_image_url` varchar(500) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `account_verified` tinyint(1) NOT NULL DEFAULT '0',
  `joining_date` date DEFAULT NULL,
  `driving_license_no` varchar(50) DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `license_issue_date` date DEFAULT NULL,
  `license_valid_until` date DEFAULT NULL,
  `license_type` varchar(80) DEFAULT NULL,
  `bank_name` varchar(120) DEFAULT NULL,
  `account_number` varchar(40) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `account_holder_name` varchar(120) DEFAULT NULL,
  `emergency_contact_name` varchar(120) DEFAULT NULL,
  `emergency_contact_relationship` varchar(60) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `emergency_contact_address` varchar(500) DEFAULT NULL,
  `current_latitude` decimal(10,7) DEFAULT NULL,
  `current_longitude` decimal(10,7) DEFAULT NULL,
  `total_trips` int NOT NULL DEFAULT '0',
  `completed_trips` int NOT NULL DEFAULT '0',
  `cancelled_trips` int NOT NULL DEFAULT '0',
  `rating` double NOT NULL DEFAULT '0',
  `total_earnings` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `experience_years` float DEFAULT '0',
  `license_image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `driver_code` (`driver_code`),
  UNIQUE KEY `mobile_number` (`mobile_number`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_drivers_status` (`status`),
  KEY `idx_drivers_city_status` (`city`,`status`),
  CONSTRAINT `fk_drivers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drivers`
--

LOCK TABLES `drivers` WRITE;
/*!40000 ALTER TABLE `drivers` DISABLE KEYS */;
INSERT INTO `drivers` VALUES (1,4,'DRV-1001','Kumar Driver',NULL,NULL,'9000000011','kumar.driver@example.com',NULL,'Chennai','Tamil Nadu',NULL,NULL,NULL,'ACTIVE',1,'2026-07-16','TN-DL-1001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,4.8,0.00,'2026-07-16 04:49:48','2026-07-16 04:49:48',0,0,NULL),(2,5,'DRV-1002','Selvam Driver',NULL,NULL,'9000000012','selvam.driver@example.com',NULL,'Trichy','Tamil Nadu',NULL,NULL,NULL,'ACTIVE',1,'2026-07-16','TN-DL-1002',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,4.6,0.00,'2026-07-16 04:49:48','2026-07-16 04:49:48',0,0,NULL),(3,6,'DRV-1003','Ravi Driver',NULL,NULL,'9000000013','ravi.driver@example.com',NULL,'Salem','Tamil Nadu',NULL,NULL,NULL,'ACTIVE',1,'2026-07-16','TN-DL-1003',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,4.7,0.00,'2026-07-16 04:49:48','2026-07-16 04:49:48',0,0,NULL),(4,9,'DRV-9','Driver User',NULL,NULL,'9000000082','driver@example.com',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING_VERIFICATION',0,'2026-07-16',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0.00,'2026-07-16 03:35:14','2026-07-16 03:35:14',0,0,NULL),(5,11,'DRV-11','Driver User',NULL,NULL,'9000000009','driverr@example.com',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING_VERIFICATION',0,'2026-07-22',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0.00,'2026-07-22 01:32:05','2026-07-22 01:32:05',0,0,NULL);
/*!40000 ALTER TABLE `drivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fleet_owners`
--

DROP TABLE IF EXISTS `fleet_owners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fleet_owners` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `owner_code` varchar(30) NOT NULL,
  `business_name` varchar(180) NOT NULL,
  `gst_number` varchar(255) DEFAULT NULL,
  `pan_number` varchar(255) DEFAULT NULL,
  `bank_account_masked` varchar(255) DEFAULT NULL,
  `ifsc_code` varchar(255) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `owner_code` (`owner_code`),
  CONSTRAINT `fk_fleet_owner_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fleet_owners`
--

LOCK TABLES `fleet_owners` WRITE;
/*!40000 ALTER TABLE `fleet_owners` DISABLE KEYS */;
INSERT INTO `fleet_owners` VALUES (1,7,'FLEET-1001','South Freight Fleet','33ABCDE1234F1Z5',NULL,NULL,NULL,'ACTIVE','2026-07-16 04:49:48','2026-07-16 04:49:48');
/*!40000 ALTER TABLE `fleet_owners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fleets`
--

DROP TABLE IF EXISTS `fleets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fleets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fleet_owner_id` bigint NOT NULL,
  `fleet_code` varchar(30) NOT NULL,
  `name` varchar(160) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fleet_code` (`fleet_code`),
  KEY `fk_fleet_owner` (`fleet_owner_id`),
  CONSTRAINT `fk_fleet_owner` FOREIGN KEY (`fleet_owner_id`) REFERENCES `fleet_owners` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fleets`
--

LOCK TABLES `fleets` WRITE;
/*!40000 ALTER TABLE `fleets` DISABLE KEYS */;
INSERT INTO `fleets` VALUES (1,1,'FLT-1001','South Freight Primary Fleet','ACTIVE','2026-07-16 04:49:48','2026-07-16 04:49:48');
/*!40000 ALTER TABLE `fleets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flyway_schema_history`
--

DROP TABLE IF EXISTS `flyway_schema_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `description` varchar(200) NOT NULL,
  `type` varchar(20) NOT NULL,
  `script` varchar(1000) NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flyway_schema_history`
--

LOCK TABLES `flyway_schema_history` WRITE;
/*!40000 ALTER TABLE `flyway_schema_history` DISABLE KEYS */;
INSERT INTO `flyway_schema_history` VALUES (1,'1','truck booking platform schema','SQL','V1__truck_booking_platform_schema.sql',2049469251,'root','2026-07-16 04:49:38',5962,1),(2,'2','complete mvp domain','SQL','V2__complete_mvp_domain.sql',638871231,'root','2026-07-16 04:49:45',6596,1),(3,'3','pricing rule components','SQL','V3__pricing_rule_components.sql',1007721550,'root','2026-07-16 04:49:47',1904,1),(4,'4','proof of delivery evidence','SQL','V4__proof_of_delivery_evidence.sql',-1093690621,'root','2026-07-16 04:49:48',978,1),(5,'5','development seed data','SQL','V5__development_seed_data.sql',254521235,'root','2026-07-16 04:49:49',379,1),(6,'6','device tokens','SQL','V6__device_tokens.sql',-657458089,'root','2026-07-16 04:49:49',188,1),(7,'7','fix development seed passwords','SQL','V7__fix_development_seed_passwords.sql',111187521,'root','2026-07-16 04:49:49',18,1),(8,'8','driver availability requests','SQL','V8__driver_availability_requests.sql',130841489,'root','2026-07-16 09:02:14',297,1),(9,'9','automatic load matching','SQL','V9__automatic_load_matching.sql',-1197750576,'root','2026-07-21 05:38:37',881,1),(10,'10','production booking workflow','SQL','V10__production_booking_workflow.sql',-895994023,'root','2026-07-22 06:33:17',1261,1);
/*!40000 ALTER TABLE `flyway_schema_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incidents`
--

DROP TABLE IF EXISTS `incidents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incidents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_number` varchar(40) NOT NULL,
  `trip_id` bigint DEFAULT NULL,
  `reported_by_user_id` bigint DEFAULT NULL,
  `incident_type` varchar(40) NOT NULL,
  `priority` varchar(20) NOT NULL DEFAULT 'HIGH',
  `status` varchar(30) NOT NULL DEFAULT 'OPEN',
  `description` varchar(1500) NOT NULL,
  `latitude` decimal(38,2) DEFAULT NULL,
  `longitude` decimal(38,2) DEFAULT NULL,
  `evidence_urls` json DEFAULT NULL,
  `resolution` varchar(1500) DEFAULT NULL,
  `resolved_by` varchar(255) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `incident_number` (`incident_number`),
  KEY `fk_incident_trip` (`trip_id`),
  KEY `fk_incident_user` (`reported_by_user_id`),
  KEY `idx_incident_status_priority` (`status`,`priority`),
  CONSTRAINT `fk_incident_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`),
  CONSTRAINT `fk_incident_user` FOREIGN KEY (`reported_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incidents`
--

LOCK TABLES `incidents` WRITE;
/*!40000 ALTER TABLE `incidents` DISABLE KEYS */;
/*!40000 ALTER TABLE `incidents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(40) NOT NULL,
  `booking_id` bigint NOT NULL,
  `payment_id` bigint DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_gst_number` varchar(255) DEFAULT NULL,
  `subtotal` decimal(38,2) DEFAULT NULL,
  `gst_amount` decimal(38,2) DEFAULT NULL,
  `total_amount` decimal(38,2) DEFAULT NULL,
  `invoice_data` json NOT NULL,
  `issued_at` timestamp NOT NULL,
  `fuel_charge` float DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  UNIQUE KEY `booking_id` (`booking_id`),
  KEY `fk_invoice_payment` (`payment_id`),
  CONSTRAINT `fk_invoice_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `fk_invoice_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `load_matches`
--

DROP TABLE IF EXISTS `load_matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `load_matches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `load_request_id` bigint NOT NULL,
  `driver_id` bigint NOT NULL,
  `truck_id` bigint NOT NULL,
  `match_score` float DEFAULT NULL,
  `distance_km` float DEFAULT NULL,
  `estimated_fare` float DEFAULT NULL,
  `score_breakdown` text,
  `is_shortlisted` tinyint(1) DEFAULT NULL,
  `response_status` varchar(20) DEFAULT NULL,
  `responded_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `load_request_id` (`load_request_id`),
  KEY `driver_id` (`driver_id`),
  KEY `truck_id` (`truck_id`),
  KEY `ix_load_matches_response_status` (`response_status`),
  KEY `ix_load_matches_id` (`id`),
  CONSTRAINT `load_matches_ibfk_1` FOREIGN KEY (`load_request_id`) REFERENCES `load_requests` (`id`),
  CONSTRAINT `load_matches_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `load_matches_ibfk_3` FOREIGN KEY (`truck_id`) REFERENCES `trucks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `load_matches`
--

LOCK TABLES `load_matches` WRITE;
/*!40000 ALTER TABLE `load_matches` DISABLE KEYS */;
/*!40000 ALTER TABLE `load_matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `load_matching`
--

DROP TABLE IF EXISTS `load_matching`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `load_matching` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_id` bigint NOT NULL,
  `driver_id` bigint DEFAULT NULL,
  `truck_id` bigint DEFAULT NULL,
  `matching_mode` varchar(30) NOT NULL,
  `score` decimal(38,2) DEFAULT NULL,
  `eta_minutes` int DEFAULT NULL,
  `estimated_price` decimal(38,2) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'SUGGESTED',
  `activity_log` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `driver_availability_id` bigint DEFAULT NULL,
  `pickup_proximity_score` decimal(38,2) DEFAULT NULL,
  `route_compatibility_score` decimal(38,2) DEFAULT NULL,
  `truck_type_score` decimal(38,2) DEFAULT NULL,
  `capacity_score` decimal(38,2) DEFAULT NULL,
  `schedule_score` decimal(38,2) DEFAULT NULL,
  `driver_rating_score` decimal(38,2) DEFAULT NULL,
  `price_score` decimal(38,2) DEFAULT NULL,
  `pickup_distance_km` decimal(38,2) DEFAULT NULL,
  `driver_response` varchar(30) NOT NULL DEFAULT 'PENDING',
  `driver_bid_amount` decimal(38,2) DEFAULT NULL,
  `driver_notes` varchar(1000) DEFAULT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `notified_at` timestamp NULL DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_match_booking_availability` (`booking_id`,`driver_availability_id`),
  KEY `fk_matching_driver` (`driver_id`),
  KEY `fk_matching_truck` (`truck_id`),
  KEY `idx_matching_booking_status` (`booking_id`,`status`),
  KEY `fk_match_availability` (`driver_availability_id`),
  KEY `idx_match_score_created` (`score`,`created_at`),
  CONSTRAINT `fk_match_availability` FOREIGN KEY (`driver_availability_id`) REFERENCES `driver_availability_requests` (`id`),
  CONSTRAINT `fk_matching_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `fk_matching_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `fk_matching_truck` FOREIGN KEY (`truck_id`) REFERENCES `trucks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `load_matching`
--

LOCK TABLES `load_matching` WRITE;
/*!40000 ALTER TABLE `load_matching` DISABLE KEYS */;
/*!40000 ALTER TABLE `load_matching` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `load_pricing_snapshots`
--

DROP TABLE IF EXISTS `load_pricing_snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `load_pricing_snapshots` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `load_request_id` bigint NOT NULL,
  `base_fare` decimal(12,2) NOT NULL,
  `rate_per_kilometre` decimal(12,2) NOT NULL,
  `rate_per_kilogram` decimal(12,4) NOT NULL,
  `distance_charge` decimal(12,2) NOT NULL,
  `weight_charge` decimal(12,2) NOT NULL,
  `fuel_charge` decimal(12,2) NOT NULL,
  `toll_charge` decimal(12,2) NOT NULL,
  `driver_bata` decimal(12,2) NOT NULL,
  `loading_charge` decimal(12,2) NOT NULL,
  `unloading_charge` decimal(12,2) NOT NULL,
  `platform_fee` decimal(12,2) NOT NULL,
  `gst_amount` decimal(12,2) NOT NULL,
  `surge_multiplier` decimal(5,2) NOT NULL,
  `payment_gateway_fee` decimal(12,2) NOT NULL,
  `final_amount` decimal(12,2) NOT NULL,
  `advance_percentage` decimal(5,2) NOT NULL DEFAULT '20.00',
  `advance_amount` decimal(12,2) NOT NULL,
  `balance_amount` decimal(12,2) NOT NULL,
  `cost_management_version` bigint DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_load_pricing_snapshot` (`load_request_id`),
  KEY `fk_snapshot_cost` (`cost_management_version`),
  CONSTRAINT `fk_snapshot_cost` FOREIGN KEY (`cost_management_version`) REFERENCES `cost_management` (`version_number`),
  CONSTRAINT `fk_snapshot_load` FOREIGN KEY (`load_request_id`) REFERENCES `load_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `load_pricing_snapshots`
--

LOCK TABLES `load_pricing_snapshots` WRITE;
/*!40000 ALTER TABLE `load_pricing_snapshots` DISABLE KEYS */;
/*!40000 ALTER TABLE `load_pricing_snapshots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `load_requests`
--

DROP TABLE IF EXISTS `load_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `load_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `request_number` varchar(40) NOT NULL,
  `customer_id` bigint NOT NULL,
  `mode` varchar(30) NOT NULL DEFAULT 'BOOK_NOW',
  `pickup_address` varchar(500) NOT NULL,
  `pickup_latitude` decimal(38,2) DEFAULT NULL,
  `pickup_longitude` decimal(38,2) DEFAULT NULL,
  `drop_address` varchar(500) NOT NULL,
  `drop_latitude` decimal(38,2) DEFAULT NULL,
  `drop_longitude` decimal(38,2) DEFAULT NULL,
  `load_category` varchar(80) NOT NULL,
  `goods_description` varchar(1000) DEFAULT NULL,
  `weight_kg` decimal(12,2) NOT NULL,
  `length_cm` decimal(38,2) DEFAULT NULL,
  `width_cm` decimal(38,2) DEFAULT NULL,
  `height_cm` decimal(38,2) DEFAULT NULL,
  `item_count` int DEFAULT NULL,
  `image_url` varchar(700) DEFAULT NULL,
  `fragile` tinyint(1) NOT NULL DEFAULT '0',
  `hazardous` tinyint(1) NOT NULL DEFAULT '0',
  `loading_assistance` tinyint(1) NOT NULL DEFAULT '0',
  `unloading_assistance` tinyint(1) NOT NULL DEFAULT '0',
  `special_instructions` varchar(1000) DEFAULT NULL,
  `requested_truck_type` varchar(60) NOT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `preferred_destination` varchar(500) DEFAULT NULL,
  `route_deviation_limit_km` decimal(38,2) DEFAULT NULL,
  `remaining_capacity_kg` decimal(38,2) DEFAULT NULL,
  `bid_based` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(40) NOT NULL DEFAULT 'REQUESTED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `distance_km` decimal(38,2) DEFAULT NULL,
  `expected_delivery_at` timestamp NULL DEFAULT NULL,
  `estimated_price` decimal(38,2) DEFAULT NULL,
  `matching_step` varchar(40) DEFAULT NULL,
  `matching_message` varchar(500) DEFAULT NULL,
  `matches_found` int NOT NULL DEFAULT '0',
  `matching_started_at` timestamp NULL DEFAULT NULL,
  `matching_completed_at` timestamp NULL DEFAULT NULL,
  `workflow_status` varchar(30) DEFAULT 'LOAD_REQUESTED',
  `unit_price_per_km` float DEFAULT NULL,
  `price_breakdown` text,
  `load_image_url` varchar(255) DEFAULT NULL,
  `accepted_driver_id` int DEFAULT NULL,
  `accepted_truck_id` int DEFAULT NULL,
  `driver_accepted_at` datetime DEFAULT NULL,
  `admin_confirmed_at` datetime DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_number` (`request_number`),
  KEY `fk_load_request_customer` (`customer_id`),
  KEY `idx_load_request_status_mode` (`status`,`mode`),
  KEY `idx_load_request_status_pickup` (`status`,`scheduled_at`),
  CONSTRAINT `fk_load_request_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `load_requests`
--

LOCK TABLES `load_requests` WRITE;
/*!40000 ALTER TABLE `load_requests` DISABLE KEYS */;
INSERT INTO `load_requests` VALUES (1,'LOAD-1001',1,'BOOK_NOW','Guindy, Chennai',NULL,NULL,'Koyambedu, Chennai',NULL,NULL,'FURNITURE','Home furniture',500.00,NULL,NULL,NULL,NULL,NULL,0,0,0,0,NULL,'TATA_ACE',NULL,NULL,NULL,NULL,0,'SEARCHING_DRIVER','2026-07-16 04:49:48','2026-07-16 04:49:48',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'LOAD_REQUESTED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'LOAD-1002',2,'RETURN_LOAD','Trichy',NULL,NULL,'Chennai',NULL,NULL,'TEXTILES','Packed garments',3000.00,NULL,NULL,NULL,NULL,NULL,0,0,0,0,NULL,'14_FT',NULL,NULL,NULL,NULL,0,'DRIVER_ASSIGNED','2026-07-16 04:49:48','2026-07-16 04:49:48',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'LOAD_REQUESTED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `load_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `channel` varchar(30) NOT NULL,
  `title` varchar(160) NOT NULL,
  `message` varchar(1000) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'QUEUED',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `customer_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_status` (`user_id`,`status`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_challenges`
--

DROP TABLE IF EXISTS `otp_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_challenges` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `mobile_number` varchar(255) DEFAULT NULL,
  `role` varchar(30) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `attempts` int NOT NULL DEFAULT '0',
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otp_mobile_expiry` (`mobile_number`,`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_challenges`
--

LOCK TABLES `otp_challenges` WRITE;
/*!40000 ALTER TABLE `otp_challenges` DISABLE KEYS */;
INSERT INTO `otp_challenges` VALUES (1,'9000000001','CUSTOMER','$2a$10$YRqyMfSmjXqMMaLsPCbjpuse.ia1pFjfPj01eNfH9w83cA6BkKvsa','2026-07-22 01:38:34',0,NULL,'2026-07-22 01:33:34');
/*!40000 ALTER TABLE `otp_challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `fk_password_reset_user` (`user_id`),
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `payment_number` varchar(40) NOT NULL,
  `booking_id` bigint NOT NULL,
  `customer_id` bigint NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `method` varchar(40) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `transaction_reference` varchar(255) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `provider_order_id` varchar(160) DEFAULT NULL,
  `provider_payment_id` varchar(160) DEFAULT NULL,
  `payment_type` varchar(30) NOT NULL DEFAULT 'ADVANCE',
  `idempotency_key` varchar(160) DEFAULT NULL,
  `failure_reason` varchar(500) DEFAULT NULL,
  `gateway_response` json DEFAULT NULL,
  `updated_at_gateway` datetime(6) DEFAULT NULL,
  `provider_reference` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_number` (`payment_number`),
  UNIQUE KEY `uk_payment_provider_payment` (`provider_payment_id`),
  UNIQUE KEY `uk_payment_idempotency` (`idempotency_key`),
  KEY `fk_payments_customer` (`customer_id`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_booking` (`booking_id`),
  KEY `idx_payment_status_created` (`status`,`created_at`),
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `fk_payments_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_quotes`
--

DROP TABLE IF EXISTS `price_quotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_quotes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quote_number` varchar(40) NOT NULL,
  `load_request_id` bigint DEFAULT NULL,
  `booking_id` bigint DEFAULT NULL,
  `pricing_rule_id` bigint DEFAULT NULL,
  `base_fare` decimal(38,2) DEFAULT NULL,
  `distance_charge` decimal(38,2) DEFAULT NULL,
  `weight_charge` decimal(38,2) DEFAULT NULL,
  `toll_charge` decimal(38,2) DEFAULT NULL,
  `driver_bata` decimal(38,2) DEFAULT NULL,
  `loading_charge` decimal(38,2) DEFAULT NULL,
  `unloading_charge` decimal(38,2) DEFAULT NULL,
  `platform_fee` decimal(38,2) DEFAULT NULL,
  `surge_charge` decimal(38,2) DEFAULT NULL,
  `discount_amount` decimal(38,2) DEFAULT NULL,
  `taxable_amount` decimal(38,2) DEFAULT NULL,
  `gst_amount` decimal(38,2) DEFAULT NULL,
  `final_price` decimal(38,2) DEFAULT NULL,
  `calculation_snapshot` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quote_number` (`quote_number`),
  KEY `fk_quote_load_request` (`load_request_id`),
  KEY `fk_quote_booking` (`booking_id`),
  KEY `fk_quote_pricing_rule` (`pricing_rule_id`),
  CONSTRAINT `fk_quote_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `fk_quote_load_request` FOREIGN KEY (`load_request_id`) REFERENCES `load_requests` (`id`),
  CONSTRAINT `fk_quote_pricing_rule` FOREIGN KEY (`pricing_rule_id`) REFERENCES `pricing_rules` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_quotes`
--

LOCK TABLES `price_quotes` WRITE;
/*!40000 ALTER TABLE `price_quotes` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_quotes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pricing_rules`
--

DROP TABLE IF EXISTS `pricing_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(120) NOT NULL,
  `vehicle_type` varchar(50) NOT NULL,
  `min_distance_km` decimal(38,2) DEFAULT NULL,
  `max_distance_km` decimal(38,2) DEFAULT NULL,
  `min_weight_tons` decimal(38,2) DEFAULT NULL,
  `max_weight_tons` decimal(38,2) DEFAULT NULL,
  `base_rate` decimal(12,2) NOT NULL,
  `per_km_rate` decimal(12,2) NOT NULL,
  `per_ton_rate` decimal(12,2) NOT NULL,
  `surge_multiplier` decimal(38,2) DEFAULT NULL,
  `fuel_surcharge` decimal(38,2) DEFAULT NULL,
  `urgency_charge` decimal(38,2) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `minimum_booking_amount` decimal(38,2) DEFAULT NULL,
  `toll_charge` decimal(38,2) DEFAULT NULL,
  `driver_bata` decimal(38,2) DEFAULT NULL,
  `loading_charge` decimal(38,2) DEFAULT NULL,
  `unloading_charge` decimal(38,2) DEFAULT NULL,
  `platform_fee_percentage` decimal(38,2) DEFAULT NULL,
  `gst_percentage` decimal(38,2) DEFAULT NULL,
  `peak_surge_multiplier` decimal(38,2) DEFAULT NULL,
  `weekend_surge_multiplier` decimal(38,2) DEFAULT NULL,
  `rain_surge_multiplier` decimal(38,2) DEFAULT NULL,
  `demand_surge_multiplier` decimal(38,2) DEFAULT NULL,
  `fuel_charge_per_km` float DEFAULT '0',
  `rate_per_kg` float DEFAULT '0.3',
  PRIMARY KEY (`id`),
  KEY `idx_pricing_vehicle_active` (`vehicle_type`,`active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pricing_rules`
--

LOCK TABLES `pricing_rules` WRITE;
/*!40000 ALTER TABLE `pricing_rules` DISABLE KEYS */;
INSERT INTO `pricing_rules` VALUES (1,'Tata Ace Standard','TATA_ACE',0.00,NULL,0.00,NULL,600.00,18.00,120.00,1.00,0.00,0.00,1,'2026-07-16 04:49:48','2026-07-16 04:49:48',0,900.00,0.00,150.00,250.00,250.00,5.00,18.00,1.15,1.10,1.20,1.00,0,0.3),(2,'14 Feet Standard','14_FT',0.00,NULL,0.00,NULL,1500.00,35.00,250.00,1.00,0.00,0.00,1,'2026-07-16 04:49:48','2026-07-16 04:49:48',0,2500.00,0.00,300.00,500.00,500.00,5.00,18.00,1.15,1.10,1.20,1.00,0,0.3),(3,'22 Feet Standard','22_FT',0.00,NULL,0.00,NULL,3000.00,55.00,350.00,1.00,0.00,0.00,1,'2026-07-16 04:49:48','2026-07-16 04:49:48',0,5000.00,0.00,500.00,800.00,800.00,5.00,18.00,1.15,1.10,1.20,1.00,0,0.3);
/*!40000 ALTER TABLE `pricing_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proof_of_delivery`
--

DROP TABLE IF EXISTS `proof_of_delivery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proof_of_delivery` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_id` bigint NOT NULL,
  `receiver_name` varchar(120) NOT NULL,
  `receiver_mobile` varchar(255) DEFAULT NULL,
  `proof_image_url` varchar(255) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `delivered_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `before_loading_image_url` varchar(255) DEFAULT NULL,
  `after_loading_image_url` varchar(255) DEFAULT NULL,
  `delivery_image_url` varchar(255) DEFAULT NULL,
  `receiver_signature_url` varchar(255) DEFAULT NULL,
  `damage_or_shortage_report` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_id` (`booking_id`),
  CONSTRAINT `fk_pod_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proof_of_delivery`
--

LOCK TABLES `proof_of_delivery` WRITE;
/*!40000 ALTER TABLE `proof_of_delivery` DISABLE KEYS */;
/*!40000 ALTER TABLE `proof_of_delivery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ratings`
--

DROP TABLE IF EXISTS `ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ratings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_id` bigint NOT NULL,
  `customer_id` bigint NOT NULL,
  `driver_id` bigint NOT NULL,
  `score` int NOT NULL,
  `review` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rating_booking_customer` (`booking_id`,`customer_id`),
  KEY `fk_ratings_customer` (`customer_id`),
  KEY `fk_ratings_driver` (`driver_id`),
  CONSTRAINT `fk_ratings_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `fk_ratings_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_ratings_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `chk_ratings_score` CHECK ((`score` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ratings`
--

LOCK TABLES `ratings` WRITE;
/*!40000 ALTER TABLE `ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token_hash` char(64) NOT NULL,
  `token_family` char(36) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `revoked_at` datetime(6) DEFAULT NULL,
  `replaced_by_hash` char(64) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refresh_token_hash` (`token_hash`),
  KEY `idx_refresh_token_user_active` (`user_id`,`revoked_at`,`expires_at`),
  CONSTRAINT `fk_refresh_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refunds`
--

DROP TABLE IF EXISTS `refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refunds` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `refund_number` varchar(40) NOT NULL,
  `payment_id` bigint NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reason` varchar(500) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'REQUESTED',
  `provider_reference` varchar(255) DEFAULT NULL,
  `decided_by` varchar(255) DEFAULT NULL,
  `decided_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refund_number` (`refund_number`),
  KEY `fk_refund_payment` (`payment_id`),
  CONSTRAINT `fk_refund_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refunds`
--

LOCK TABLES `refunds` WRITE;
/*!40000 ALTER TABLE `refunds` DISABLE KEYS */;
/*!40000 ALTER TABLE `refunds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route_pricing`
--

DROP TABLE IF EXISTS `route_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_pricing` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `origin` varchar(80) DEFAULT NULL,
  `destination` varchar(80) DEFAULT NULL,
  `distance_km` float DEFAULT NULL,
  `toll_charge` float DEFAULT NULL,
  `demand_level` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_route_pricing_destination` (`destination`),
  KEY `ix_route_pricing_id` (`id`),
  KEY `ix_route_pricing_origin` (`origin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route_pricing`
--

LOCK TABLES `route_pricing` WRITE;
/*!40000 ALTER TABLE `route_pricing` DISABLE KEYS */;
/*!40000 ALTER TABLE `route_pricing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_locations`
--

DROP TABLE IF EXISTS `saved_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_locations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `customer_id` bigint NOT NULL,
  `label` varchar(80) NOT NULL,
  `address` varchar(500) NOT NULL,
  `city` varchar(120) NOT NULL,
  `latitude` decimal(38,2) DEFAULT NULL,
  `longitude` decimal(38,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_saved_locations_customer` (`customer_id`),
  CONSTRAINT `fk_saved_locations_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_locations`
--

LOCK TABLES `saved_locations` WRITE;
/*!40000 ALTER TABLE `saved_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settlements`
--

DROP TABLE IF EXISTS `settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settlements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` bigint NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `gross_amount` decimal(12,2) NOT NULL,
  `deductions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_amount` decimal(12,2) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_settlements_driver_status` (`driver_id`,`status`),
  CONSTRAINT `fk_settlements_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settlements`
--

LOCK TABLES `settlements` WRITE;
/*!40000 ALTER TABLE `settlements` DISABLE KEYS */;
/*!40000 ALTER TABLE `settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_tickets`
--

DROP TABLE IF EXISTS `support_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_tickets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(40) NOT NULL,
  `raised_by_user_id` bigint DEFAULT NULL,
  `booking_id` bigint DEFAULT NULL,
  `subject` varchar(160) NOT NULL,
  `description` varchar(1000) NOT NULL,
  `priority` varchar(30) NOT NULL DEFAULT 'MEDIUM',
  `status` varchar(30) NOT NULL DEFAULT 'OPEN',
  `assigned_to` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `fk_support_user` (`raised_by_user_id`),
  KEY `fk_support_booking` (`booking_id`),
  KEY `idx_support_status_priority` (`status`,`priority`),
  CONSTRAINT `fk_support_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `fk_support_user` FOREIGN KEY (`raised_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_tickets`
--

LOCK TABLES `support_tickets` WRITE;
/*!40000 ALTER TABLE `support_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trip_locations`
--

DROP TABLE IF EXISTS `trip_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trip_locations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `trip_id` bigint NOT NULL,
  `lat` float NOT NULL,
  `lng` float NOT NULL,
  `speed_kmph` float DEFAULT NULL,
  `recorded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `trip_id` (`trip_id`),
  KEY `ix_trip_locations_id` (`id`),
  CONSTRAINT `trip_locations_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trip_locations`
--

LOCK TABLES `trip_locations` WRITE;
/*!40000 ALTER TABLE `trip_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `trip_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trip_status_history`
--

DROP TABLE IF EXISTS `trip_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trip_status_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `trip_id` bigint NOT NULL,
  `previous_status` varchar(40) DEFAULT NULL,
  `status` varchar(40) NOT NULL,
  `changed_at` timestamp NOT NULL,
  `changed_by` varchar(120) NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `evidence_url` varchar(700) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_trip_history` (`trip_id`,`changed_at`),
  CONSTRAINT `fk_trip_history_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trip_status_history`
--

LOCK TABLES `trip_status_history` WRITE;
/*!40000 ALTER TABLE `trip_status_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `trip_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trips`
--

DROP TABLE IF EXISTS `trips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trips` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `trip_number` varchar(40) NOT NULL,
  `booking_id` bigint NOT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'REQUESTED',
  `pickup_otp_hash` varchar(255) DEFAULT NULL,
  `delivery_otp_hash` varchar(255) DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `delivery_photo_url` varchar(255) DEFAULT NULL,
  `delivery_signature_url` varchar(255) DEFAULT NULL,
  `delivery_confirmed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trip_number` (`trip_number`),
  UNIQUE KEY `booking_id` (`booking_id`),
  KEY `idx_trip_status` (`status`),
  CONSTRAINT `fk_trip_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trips`
--

LOCK TABLES `trips` WRITE;
/*!40000 ALTER TABLE `trips` DISABLE KEYS */;
INSERT INTO `trips` VALUES (1,'TRIP-1001',1,'IN_TRANSIT',NULL,NULL,'2026-07-16 04:49:49',NULL,NULL,0,NULL,NULL,NULL),(2,'TRIP-1002',2,'COMPLETED',NULL,NULL,'2026-07-15 04:49:49','2026-07-15 08:49:49','2026-07-15 09:49:49',0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `trips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `truck_documents`
--

DROP TABLE IF EXISTS `truck_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `truck_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `truck_id` bigint NOT NULL,
  `document_type` varchar(40) NOT NULL,
  `verification_status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `file_url` varchar(700) NOT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_truck_document_type` (`truck_id`,`document_type`),
  CONSTRAINT `fk_truck_document_truck` FOREIGN KEY (`truck_id`) REFERENCES `trucks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `truck_documents`
--

LOCK TABLES `truck_documents` WRITE;
/*!40000 ALTER TABLE `truck_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `truck_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trucks`
--

DROP TABLE IF EXISTS `trucks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trucks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `truck_code` varchar(30) NOT NULL,
  `vehicle_number` varchar(40) NOT NULL,
  `vehicle_type` varchar(50) NOT NULL,
  `capacity_tons` decimal(8,2) NOT NULL,
  `body_type` varchar(255) DEFAULT NULL,
  `ownership_type` varchar(30) NOT NULL,
  `owner_name` varchar(255) DEFAULT NULL,
  `assigned_driver_id` bigint DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'AVAILABLE',
  `insurance_expiry_date` date DEFAULT NULL,
  `fitness_expiry_date` date DEFAULT NULL,
  `rc_expiry_date` date DEFAULT NULL,
  `current_city` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `fleet_id` bigint DEFAULT NULL,
  `color` varchar(40) DEFAULT NULL,
  `truck_image_url` varchar(255) DEFAULT NULL,
  `rc_image_url` varchar(255) DEFAULT NULL,
  `insurance_image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `truck_code` (`truck_code`),
  UNIQUE KEY `vehicle_number` (`vehicle_number`),
  KEY `fk_trucks_driver` (`assigned_driver_id`),
  KEY `idx_trucks_status_type` (`status`,`vehicle_type`),
  KEY `idx_trucks_capacity` (`capacity_tons`),
  KEY `fk_truck_fleet` (`fleet_id`),
  CONSTRAINT `fk_truck_fleet` FOREIGN KEY (`fleet_id`) REFERENCES `fleets` (`id`),
  CONSTRAINT `fk_trucks_driver` FOREIGN KEY (`assigned_driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trucks`
--

LOCK TABLES `trucks` WRITE;
/*!40000 ALTER TABLE `trucks` DISABLE KEYS */;
INSERT INTO `trucks` VALUES (1,'TRK-1001','TN01AB1001','TATA_ACE',0.75,'CLOSED','PARTNER','South Freight Fleet',1,'AVAILABLE',NULL,NULL,NULL,'Chennai','2026-07-16 04:49:48','2026-07-16 04:49:48',0,1,NULL,NULL,NULL,NULL),(2,'TRK-1002','TN45CD1002','14_FT',4.50,'OPEN','PARTNER','South Freight Fleet',2,'AVAILABLE',NULL,NULL,NULL,'Trichy','2026-07-16 04:49:48','2026-07-16 04:49:48',0,1,NULL,NULL,NULL,NULL),(3,'TRK-1003','TN30EF1003','22_FT',12.00,'CONTAINER','PARTNER','South Freight Fleet',3,'AVAILABLE',NULL,NULL,NULL,'Salem','2026-07-16 04:49:48','2026-07-16 04:49:48',0,1,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `trucks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `full_name` varchar(120) NOT NULL,
  `email` varchar(160) DEFAULT NULL,
  `mobile_number` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(30) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `mobile_verified` tinyint(1) NOT NULL DEFAULT '0',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `name` varchar(120) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile_number` (`mobile_number`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role_status` (`role`,`status`),
  KEY `idx_users_search` (`full_name`,`mobile_number`,`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'RightPolamRight Super Admin','admin@rightpolamright.com','9000000000','$2a$10$QLoDwD2dsUf5JoSqDSBxWeMkrRR5nerYm2rIp2RKo8B4yEOaPtr7K','SUPER_ADMIN','ACTIVE',1,1,NULL,'2026-07-16 04:49:48','2026-07-16 04:49:49',0,NULL,NULL,1),(2,'Arun Customer','arun@example.com','9000000001','$2a$10$QLoDwD2dsUf5JoSqDSBxWeMkrRR5nerYm2rIp2RKo8B4yEOaPtr7K','CUSTOMER','ACTIVE',1,1,NULL,'2026-07-16 04:49:48','2026-07-16 04:49:49',0,NULL,NULL,1),(3,'Meena Logistics','meena@example.com','9000000002','$2a$10$QLoDwD2dsUf5JoSqDSBxWeMkrRR5nerYm2rIp2RKo8B4yEOaPtr7K','CUSTOMER','ACTIVE',1,1,NULL,'2026-07-16 04:49:48','2026-07-16 04:49:49',0,NULL,NULL,1),(4,'Kumar Driver','kumar.driver@example.com','9000000011','$2a$10$QLoDwD2dsUf5JoSqDSBxWeMkrRR5nerYm2rIp2RKo8B4yEOaPtr7K','DRIVER','ACTIVE',1,1,'2026-07-22 02:18:28','2026-07-16 04:49:48','2026-07-22 02:18:28',0,NULL,NULL,1),(5,'Selvam Driver','selvam.driver@example.com','9000000012','$2a$10$QLoDwD2dsUf5JoSqDSBxWeMkrRR5nerYm2rIp2RKo8B4yEOaPtr7K','DRIVER','ACTIVE',1,1,NULL,'2026-07-16 04:49:48','2026-07-16 04:49:49',0,NULL,NULL,1),(6,'Ravi Driver','ravi.driver@example.com','9000000013','$2a$10$QLoDwD2dsUf5JoSqDSBxWeMkrRR5nerYm2rIp2RKo8B4yEOaPtr7K','DRIVER','ACTIVE',1,1,NULL,'2026-07-16 04:49:48','2026-07-16 04:49:49',0,NULL,NULL,1),(7,'South Fleet Owner','fleet@example.com','9000000020','$2a$10$QLoDwD2dsUf5JoSqDSBxWeMkrRR5nerYm2rIp2RKo8B4yEOaPtr7K','FLEET_OWNER','ACTIVE',1,1,NULL,'2026-07-16 04:49:48','2026-07-16 04:49:49',0,NULL,NULL,1),(8,'Customer User','customer@example.com','9000008001','$2a$10$UqkdF5VNiQSdI7eUqfV5buCFjlldlMUf6q82B5WmcJjCgrl5.olrC','CUSTOMER','ACTIVE',0,0,NULL,'2026-07-16 03:34:30','2026-07-16 03:34:30',0,NULL,NULL,1),(9,'Driver User','driver@example.com','9000000082','$2a$10$tszo8zPxiyajV/W.9wfeWOdpPg/xUisQMIVxVetcWx5qnLVYs74bG','DRIVER','ACTIVE',0,0,NULL,'2026-07-16 03:35:13','2026-07-16 03:35:13',0,NULL,NULL,1),(10,'Customer User','customerr@example.com','9000900001','$2a$10$zYTDMbED8Vztc76M9/k4qOPvl3r6teORYxzF/UZ3VEYc0ZeOQyJpm','CUSTOMER','ACTIVE',0,0,NULL,'2026-07-22 01:31:11','2026-07-22 01:31:11',0,NULL,NULL,1),(11,'Driver User','driverr@example.com','9000000009','$2a$10$A7.NJRO9tKTDR1uJFt9gO.y1aLfHveql203vbJwB.ZcU1t30HG6TC','DRIVER','ACTIVE',0,0,NULL,'2026-07-22 01:32:05','2026-07-22 01:32:05',0,NULL,NULL,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'rightpolamright'
--

--
-- Dumping routines for database 'rightpolamright'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-17 14:32:56
