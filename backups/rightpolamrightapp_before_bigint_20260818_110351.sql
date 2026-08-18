-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: rightpolamrightapp
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
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `designation` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `ix_admins_id` (`id`),
  CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,1,'Super Admin','Operations');
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
  `action` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `before_json` text COLLATE utf8mb4_unicode_ci,
  `after_json` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `actor_user_id` (`actor_user_id`),
  KEY `ix_audit_logs_id` (`id`),
  KEY `ix_audit_logs_action` (`action`),
  KEY `ix_audit_logs_created_at` (`created_at`),
  KEY `ix_audit_logs_entity_type` (`entity_type`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
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
  `code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gst_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_customers_code` (`code`),
  KEY `ix_customers_phone` (`phone`),
  KEY `ix_customers_email` (`email`),
  KEY `ix_customers_id` (`id`),
  KEY `ix_customers_user_id` (`user_id`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `owner_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_id` int DEFAULT NULL,
  `doc_type` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `doc_number` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_documents_owner_id` (`owner_id`),
  KEY `ix_documents_id` (`id`),
  KEY `ix_documents_owner_type` (`owner_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  `reason` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_id` (`driver_id`),
  KEY `ix_driver_availability_unavailable_date` (`unavailable_date`),
  KEY `ix_driver_availability_id` (`id`),
  CONSTRAINT `driver_availability_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_availability`
--

LOCK TABLES `driver_availability` WRITE;
/*!40000 ALTER TABLE `driver_availability` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_availability` ENABLE KEYS */;
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
  `available_from_time` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `available_to_time` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_location` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_lat` float DEFAULT NULL,
  `from_lng` float DEFAULT NULL,
  `preferred_drop` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_drop_lat` float DEFAULT NULL,
  `preferred_drop_lng` float DEFAULT NULL,
  `max_distance_km` float DEFAULT NULL,
  `trip_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_capacity_ton` float DEFAULT NULL,
  `available_capacity_ton` float DEFAULT NULL,
  `notes` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `truck_id` (`truck_id`),
  KEY `ix_driver_availability_slots_available_from` (`available_from`),
  KEY `ix_driver_availability_slots_driver_id` (`driver_id`),
  KEY `ix_driver_availability_slots_status` (`status`),
  KEY `ix_driver_availability_slots_id` (`id`),
  KEY `ix_driver_availability_slots_available_to` (`available_to`),
  KEY `ix_driver_availability_slots_is_active` (`is_active`),
  CONSTRAINT `driver_availability_slots_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `driver_availability_slots_ibfk_2` FOREIGN KEY (`truck_id`) REFERENCES `trucks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_availability_slots`
--

LOCK TABLES `driver_availability_slots` WRITE;
/*!40000 ALTER TABLE `driver_availability_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_availability_slots` ENABLE KEYS */;
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
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_id` (`driver_id`),
  KEY `trip_id` (`trip_id`),
  KEY `customer_id` (`customer_id`),
  KEY `ix_driver_ratings_id` (`id`),
  CONSTRAINT `driver_ratings_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `driver_ratings_ibfk_2` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`),
  CONSTRAINT `driver_ratings_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_ratings`
--

LOCK TABLES `driver_ratings` WRITE;
/*!40000 ALTER TABLE `driver_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_ratings` ENABLE KEYS */;
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
  `code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_number` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_expiry` date DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kyc_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `current_location` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_lat` float DEFAULT NULL,
  `current_lng` float DEFAULT NULL,
  `location_updated_at` datetime DEFAULT NULL,
  `rating` float DEFAULT NULL,
  `total_trips` int DEFAULT NULL,
  `experience_years` float DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_drivers_code` (`code`),
  KEY `ix_drivers_user_id` (`user_id`),
  KEY `ix_drivers_phone` (`phone`),
  KEY `ix_drivers_id` (`id`),
  CONSTRAINT `drivers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drivers`
--

LOCK TABLES `drivers` WRITE;
/*!40000 ALTER TABLE `drivers` DISABLE KEYS */;
/*!40000 ALTER TABLE `drivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_id` bigint DEFAULT NULL,
  `trip_id` bigint DEFAULT NULL,
  `base_fare` float DEFAULT NULL,
  `distance_charge` float DEFAULT NULL,
  `weight_charge` float DEFAULT NULL,
  `fuel_charge` float DEFAULT NULL,
  `toll_charge` float DEFAULT NULL,
  `loading_charge` float DEFAULT NULL,
  `unloading_charge` float DEFAULT NULL,
  `driver_bata` float DEFAULT NULL,
  `platform_fee` float DEFAULT NULL,
  `gst` float DEFAULT NULL,
  `surge_amount` float DEFAULT NULL,
  `total_amount` float DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_invoices_code` (`code`),
  KEY `payment_id` (`payment_id`),
  KEY `trip_id` (`trip_id`),
  KEY `ix_invoices_id` (`id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`),
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  `score_breakdown` text COLLATE utf8mb4_unicode_ci,
  `is_shortlisted` tinyint(1) DEFAULT NULL,
  `response_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `responded_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `load_request_id` (`load_request_id`),
  KEY `driver_id` (`driver_id`),
  KEY `truck_id` (`truck_id`),
  KEY `ix_load_matches_id` (`id`),
  KEY `ix_load_matches_response_status` (`response_status`),
  CONSTRAINT `load_matches_ibfk_1` FOREIGN KEY (`load_request_id`) REFERENCES `load_requests` (`id`),
  CONSTRAINT `load_matches_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `load_matches_ibfk_3` FOREIGN KEY (`truck_id`) REFERENCES `trucks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `load_matches`
--

LOCK TABLES `load_matches` WRITE;
/*!40000 ALTER TABLE `load_matches` DISABLE KEYS */;
/*!40000 ALTER TABLE `load_matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `load_requests`
--

DROP TABLE IF EXISTS `load_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `load_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  `pickup_location` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pickup_lat` float DEFAULT NULL,
  `pickup_lng` float DEFAULT NULL,
  `drop_location` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `drop_lat` float DEFAULT NULL,
  `drop_lng` float DEFAULT NULL,
  `load_type` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `truck_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight_ton` float NOT NULL,
  `distance_km` float DEFAULT NULL,
  `required_date` date DEFAULT NULL,
  `required_time` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `contact_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `budget` float DEFAULT NULL,
  `special_instructions` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `workflow_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_fare` float DEFAULT NULL,
  `unit_price_per_km` float DEFAULT NULL,
  `price_breakdown` text COLLATE utf8mb4_unicode_ci,
  `load_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accepted_driver_id` bigint DEFAULT NULL,
  `accepted_truck_id` bigint DEFAULT NULL,
  `driver_accepted_at` datetime DEFAULT NULL,
  `admin_confirmed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_load_requests_code` (`code`),
  KEY `customer_id` (`customer_id`),
  KEY `accepted_driver_id` (`accepted_driver_id`),
  KEY `accepted_truck_id` (`accepted_truck_id`),
  KEY `ix_load_requests_status` (`status`),
  KEY `ix_load_requests_id` (`id`),
  KEY `ix_load_requests_truck_type` (`truck_type`),
  KEY `ix_load_requests_required_date` (`required_date`),
  KEY `ix_load_requests_workflow_status` (`workflow_status`),
  CONSTRAINT `load_requests_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `load_requests_ibfk_2` FOREIGN KEY (`accepted_driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `load_requests_ibfk_3` FOREIGN KEY (`accepted_truck_id`) REFERENCES `trucks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `load_requests`
--

LOCK TABLES `load_requests` WRITE;
/*!40000 ALTER TABLE `load_requests` DISABLE KEYS */;
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
  `type` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `reference_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `recipient_role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_id` bigint DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_id` (`driver_id`),
  KEY `customer_id` (`customer_id`),
  KEY `ix_notifications_type` (`type`),
  KEY `ix_notifications_is_read` (`is_read`),
  KEY `ix_notifications_created_at` (`created_at`),
  KEY `ix_notifications_id` (`id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trip_id` bigint DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `amount` float NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_mode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_reference` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_reference` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_payments_code` (`code`),
  KEY `trip_id` (`trip_id`),
  KEY `customer_id` (`customer_id`),
  KEY `ix_payments_transaction_reference` (`transaction_reference`),
  KEY `ix_payments_id` (`id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`),
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pricing_rules`
--

DROP TABLE IF EXISTS `pricing_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `truck_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `base_fare` float DEFAULT NULL,
  `rate_per_km` float DEFAULT NULL,
  `rate_per_ton` float DEFAULT NULL,
  `rate_per_kg` float DEFAULT NULL,
  `fuel_charge_per_km` float DEFAULT NULL,
  `loading_charge` float DEFAULT NULL,
  `unloading_charge` float DEFAULT NULL,
  `driver_bata` float DEFAULT NULL,
  `platform_fee_percent` float DEFAULT NULL,
  `gst_percent` float DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_pricing_rules_id` (`id`),
  KEY `ix_pricing_rules_truck_type` (`truck_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pricing_rules`
--

LOCK TABLES `pricing_rules` WRITE;
/*!40000 ALTER TABLE `pricing_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `pricing_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route_pricing`
--

DROP TABLE IF EXISTS `route_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_pricing` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `origin` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destination` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `distance_km` float DEFAULT NULL,
  `toll_charge` float DEFAULT NULL,
  `demand_level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_route_pricing_id` (`id`),
  KEY `ix_route_pricing_origin` (`origin`),
  KEY `ix_route_pricing_destination` (`destination`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route_pricing`
--

LOCK TABLES `route_pricing` WRITE;
/*!40000 ALTER TABLE `route_pricing` DISABLE KEYS */;
/*!40000 ALTER TABLE `route_pricing` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trip_locations`
--

LOCK TABLES `trip_locations` WRITE;
/*!40000 ALTER TABLE `trip_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `trip_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trips`
--

DROP TABLE IF EXISTS `trips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trips` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_request_id` bigint NOT NULL,
  `driver_id` bigint NOT NULL,
  `truck_id` bigint NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `offered_fare` float DEFAULT NULL,
  `advance_amount` float DEFAULT NULL,
  `message_to_driver` text COLLATE utf8mb4_unicode_ci,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `current_lat` float DEFAULT NULL,
  `current_lng` float DEFAULT NULL,
  `eta_minutes` int DEFAULT NULL,
  `delivery_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_signature_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_confirmed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_trips_code` (`code`),
  KEY `load_request_id` (`load_request_id`),
  KEY `driver_id` (`driver_id`),
  KEY `truck_id` (`truck_id`),
  KEY `ix_trips_status` (`status`),
  KEY `ix_trips_id` (`id`),
  CONSTRAINT `trips_ibfk_1` FOREIGN KEY (`load_request_id`) REFERENCES `load_requests` (`id`),
  CONSTRAINT `trips_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `trips_ibfk_3` FOREIGN KEY (`truck_id`) REFERENCES `trucks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trips`
--

LOCK TABLES `trips` WRITE;
/*!40000 ALTER TABLE `trips` DISABLE KEYS */;
/*!40000 ALTER TABLE `trips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trucks`
--

DROP TABLE IF EXISTS `trucks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trucks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `truck_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `truck_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `truck_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rc_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity_ton` float NOT NULL,
  `owner_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chassis_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engine_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_expiry` date DEFAULT NULL,
  `fitness_expiry` date DEFAULT NULL,
  `permit_expiry` date DEFAULT NULL,
  `pollution_expiry` date DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT NULL,
  `driver_id` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_trucks_truck_number` (`truck_number`),
  KEY `driver_id` (`driver_id`),
  KEY `ix_trucks_truck_type` (`truck_type`),
  KEY `ix_trucks_id` (`id`),
  CONSTRAINT `trucks_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trucks`
--

LOCK TABLES `trucks` WRITE;
/*!40000 ALTER TABLE `trucks` DISABLE KEYS */;
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
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified` tinyint(1) NOT NULL,
  `mobile_verified` tinyint(1) NOT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`),
  KEY `ix_users_id` (`id`),
  KEY `ix_users_mobile_number` (`mobile_number`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'RightPolamRight Admin','adminrightpolamright@gmail.com','6374862658','$2b$12$IcRv4bGvTbDEtlvm6PmkbeIOb3aY.74E3AETn2mcB6nydZ5DbD6Z2','admin','ACTIVE',0,0,NULL,'2026-08-18 05:31:37','2026-08-18 05:31:37',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'rightpolamrightapp'
--

--
-- Dumping routines for database 'rightpolamrightapp'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-18 11:03:52
