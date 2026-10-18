-- ============================================================================
-- Smart Hospital Hygiene & Resource Intelligence Platform
-- Enterprise Relational Database Schema (MySQL 8.0+)
-- Architecture: 3NF Normalized Relational Design
-- Storage Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS smart_hospital_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE smart_hospital_db;

-- ----------------------------------------------------------------------------
-- Disable foreign key checks during schema creation/migration
-- ----------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in reverse dependency order if recreating
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS waste_logs;
DROP TABLE IF EXISTS maintenance_logs;
DROP TABLE IF EXISTS cleaning_logs;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS linen;
DROP TABLE IF EXISTS beds;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS wards;
DROP TABLE IF EXISTS floors;
DROP TABLE IF EXISTS buildings;
DROP TABLE IF EXISTS hospitals;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. ROLES TABLE
-- Defines authorization hierarchy & security access levels
-- ============================================================================
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique machine code e.g. ADMIN, CLEANING_STAFF',
    role_name VARCHAR(100) NOT NULL COMMENT 'Human-readable role designation',
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hospital staff roles and permission boundaries';

-- ============================================================================
-- 2. USERS TABLE
-- Hospital staff directory (Zero patient information, operational staff only)
-- ============================================================================
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE COMMENT 'Hospital operational badge/employee ID',
    role_id INT NOT NULL COMMENT 'Foreign key to staff role',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL COMMENT 'Argon2id/Bcrypt secure cryptographic hash',
    phone_number VARCHAR(25) NULL,
    department VARCHAR(100) NOT NULL COMMENT 'e.g. Infection Control, Housekeeping, Biomedical',
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) 
        REFERENCES roles (role_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_user_employee_id (employee_id),
    INDEX idx_user_email (email),
    INDEX idx_user_role_id (role_id),
    INDEX idx_user_status (status),
    INDEX idx_user_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Operational hospital personnel registry';

-- ============================================================================
-- 3. HOSPITALS TABLE
-- Multi-facility root entity
-- ============================================================================
CREATE TABLE hospitals (
    hospital_id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique facility identifier code',
    name VARCHAR(200) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    contact_email VARCHAR(150) NULL,
    contact_phone VARCHAR(25) NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_hospital_code (hospital_code),
    INDEX idx_hospital_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hospital physical healthcare facility entities';

-- ============================================================================
-- 4. BUILDINGS TABLE
-- Individual wings, blocks, and towers within a hospital campus
-- ============================================================================
CREATE TABLE buildings (
    building_id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    building_code VARCHAR(50) NOT NULL COMMENT 'Unique within hospital e.g. BLD-A, TOWER-SOUTH',
    name VARCHAR(150) NOT NULL,
    total_floors INT NOT NULL DEFAULT 1,
    status ENUM('ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_buildings_hospital FOREIGN KEY (hospital_id) 
        REFERENCES hospitals (hospital_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_hospital_building (hospital_id, building_code),
    INDEX idx_building_hospital_id (hospital_id),
    INDEX idx_building_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Physical architectural building towers';

-- ============================================================================
-- 5. FLOORS TABLE
-- Vertical spatial levels within a building
-- ============================================================================
CREATE TABLE floors (
    floor_id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    floor_number INT NOT NULL COMMENT 'e.g. -1 for Basement, 0 for Ground, 1 for Level 1',
    floor_code VARCHAR(50) NOT NULL COMMENT 'e.g. FLR-02, FLR-B1',
    floor_name VARCHAR(100) NOT NULL,
    status ENUM('ACTIVE', 'RESTRICTED', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_floors_building FOREIGN KEY (building_id) 
        REFERENCES buildings (building_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_building_floor (building_id, floor_number),
    INDEX idx_floor_building_id (building_id),
    INDEX idx_floor_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Building vertical floor levels';

-- ============================================================================
-- 6. WARDS TABLE
-- Clinical and operational departmental zones (e.g. OT, ICU, ER, General)
-- ============================================================================
CREATE TABLE wards (
    ward_id INT AUTO_INCREMENT PRIMARY KEY,
    floor_id INT NOT NULL,
    ward_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique zone code e.g. WRD-ICU-A',
    name VARCHAR(150) NOT NULL,
    ward_type ENUM(
        'ICU',
        'NICU',
        'OPERATION_THEATRE',
        'EMERGENCY_TRAUMA',
        'GENERAL_WARD',
        'ISOLATION',
        'LABORATORY',
        'PEDIATRIC'
    ) NOT NULL,
    hygiene_target_score DECIMAL(5,2) NOT NULL DEFAULT 95.00 COMMENT 'Target score percentage (0-100)',
    current_hygiene_score DECIMAL(5,2) NOT NULL DEFAULT 100.00 COMMENT 'Aggregated hygiene health rating',
    status ENUM('ACTIVE', 'QUARANTINED', 'CLEANING_IN_PROGRESS', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wards_floor FOREIGN KEY (floor_id) 
        REFERENCES floors (floor_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_ward_floor_id (floor_id),
    INDEX idx_ward_type (ward_type),
    INDEX idx_ward_status (status),
    INDEX idx_ward_hygiene_score (current_hygiene_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hospital wards and specialized clinical care zones';

-- ============================================================================
-- 7. ROOMS TABLE
-- Physical rooms with QR identifiers, pressure barriers & readiness states
-- ============================================================================
CREATE TABLE rooms (
    room_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ward_id INT NOT NULL,
    room_number VARCHAR(50) NOT NULL COMMENT 'Physical room identifier e.g. OT-1, ICU-104',
    room_type ENUM(
        'PATIENT_ROOM',
        'SURGICAL_SUITE',
        'ISOLATION_ROOM',
        'SCRUB_STATION',
        'NURSE_STATION',
        'DECONTAMINATION_BAY',
        'STORAGE'
    ) NOT NULL,
    qr_code_identifier VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique cryptographically verifiable QR payload',
    airflow_type ENUM(
        'POSITIVE_PRESSURE',
        'NEGATIVE_PRESSURE',
        'STANDARD_LAMINAR',
        'NATURAL'
    ) NOT NULL DEFAULT 'STANDARD_LAMINAR',
    readiness_status ENUM(
        'READY_FOR_USE',
        'OCCUPIED',
        'DIRTY_PENDING_CLEAN',
        'DISINFECTION_IN_PROGRESS',
        'MAINTENANCE_REQUIRED'
    ) NOT NULL DEFAULT 'READY_FOR_USE',
    last_cleaned_at TIMESTAMP NULL DEFAULT NULL,
    last_disinfected_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rooms_ward FOREIGN KEY (ward_id) 
        REFERENCES wards (ward_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_ward_room_number (ward_id, room_number),
    INDEX idx_room_ward_id (ward_id),
    INDEX idx_room_qr_code (qr_code_identifier),
    INDEX idx_room_readiness_status (readiness_status),
    INDEX idx_room_type (room_type),
    INDEX idx_room_last_cleaned (last_cleaned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Individual hospital rooms and sterilization chambers';

-- ============================================================================
-- 8. BEDS TABLE
-- Inpatient and ICU bed assets (Zero patient PII, operational tracking only)
-- ============================================================================
CREATE TABLE beds (
    bed_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    bed_number VARCHAR(50) NOT NULL COMMENT 'e.g. BED-01, BED-02A',
    qr_code_identifier VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique QR code adhered to bed frame',
    bed_type ENUM(
        'ICU_ELECTRIC',
        'ISOLATION_NEGATIVE',
        'STANDARD_INPATIENT',
        'NEONATAL_INCUBATOR',
        'EMERGENCY_TROLLEY'
    ) NOT NULL,
    operational_status ENUM(
        'VACANT_CLEAN',
        'OCCUPIED',
        'DIRTY_PENDING_STRIP',
        'MAINTENANCE_OUT_OF_SERVICE'
    ) NOT NULL DEFAULT 'VACANT_CLEAN',
    current_occupancy_reference VARCHAR(100) NULL COMMENT 'Anonymous operational encounter ID (Zero patient PII)',
    last_bedsheet_change_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_beds_room FOREIGN KEY (room_id) 
        REFERENCES rooms (room_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_room_bed_number (room_id, bed_number),
    INDEX idx_bed_room_id (room_id),
    INDEX idx_bed_qr_code (qr_code_identifier),
    INDEX idx_bed_operational_status (operational_status),
    INDEX idx_bed_type (bed_type),
    INDEX idx_bed_last_change (last_bedsheet_change_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hospital beds and clinical incubator units';

-- ============================================================================
-- 9. LINEN TABLE
-- Reusable linen assets tracked via RFID/Barcodes and wash cycles
-- ============================================================================
CREATE TABLE linen (
    linen_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rfid_tag_or_barcode VARCHAR(100) NOT NULL UNIQUE COMMENT 'RFID chip or sewn barcode identifier',
    linen_type ENUM(
        'BEDSHEET_ICU',
        'BEDSHEET_GENERAL',
        'PILLOW_COVER',
        'BLANKET_THERMAL',
        'SURGICAL_GOWN',
        'SURGICAL_DRAPE',
        'TOWEL'
    ) NOT NULL,
    assigned_bed_id BIGINT NULL,
    assigned_ward_id INT NULL,
    lifecycle_wash_count INT NOT NULL DEFAULT 0,
    max_recommended_wash_cycles INT NOT NULL DEFAULT 60,
    hygiene_state ENUM(
        'CLEAN_STERILIZED',
        'IN_USE',
        'SOILED_CONTAMINATED',
        'IN_LAUNDRY',
        'INSPECTION_PENDING',
        'DISCARDED'
    ) NOT NULL DEFAULT 'CLEAN_STERILIZED',
    last_washed_at TIMESTAMP NULL DEFAULT NULL,
    last_sterilized_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_linen_bed FOREIGN KEY (assigned_bed_id) 
        REFERENCES beds (bed_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_linen_ward FOREIGN KEY (assigned_ward_id) 
        REFERENCES wards (ward_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_linen_rfid (rfid_tag_or_barcode),
    INDEX idx_linen_assigned_bed (assigned_bed_id),
    INDEX idx_linen_assigned_ward (assigned_ward_id),
    INDEX idx_linen_hygiene_state (hygiene_state),
    INDEX idx_linen_type (linen_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reusable hospital linen tracking and laundry cycle management';

-- ============================================================================
-- 10. EQUIPMENT TABLE
-- Biomedical and disinfection equipment fleet
-- ============================================================================
CREATE TABLE equipment (
    equipment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    equipment_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Hospital asset tag e.g. EQ-VENT-01',
    serial_number VARCHAR(100) NOT NULL UNIQUE COMMENT 'OEM Serial Number',
    name VARCHAR(150) NOT NULL,
    category ENUM(
        'VENTILATOR',
        'INFUSION_PUMP',
        'UVC_DISINFECTION_ROBOT',
        'HEPA_MOBILE_FILTER',
        'DEFIBRILLATOR',
        'PATIENT_MONITOR',
        'SURGICAL_CAUTERY',
        'AUTOCLAVE'
    ) NOT NULL,
    current_ward_id INT NULL,
    current_room_id BIGINT NULL,
    qr_code_identifier VARCHAR(100) NOT NULL UNIQUE COMMENT 'Scannable equipment verification QR',
    operational_status ENUM(
        'AVAILABLE_STERILE',
        'IN_USE',
        'DIRTY_DECONTAMINATION_REQUIRED',
        'UNDER_MAINTENANCE',
        'CALIBRATION_OVERDUE',
        'DECOMMISSIONED'
    ) NOT NULL DEFAULT 'AVAILABLE_STERILE',
    last_maintenance_date DATE NULL DEFAULT NULL,
    next_maintenance_due DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipment_ward FOREIGN KEY (current_ward_id) 
        REFERENCES wards (ward_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_equipment_room FOREIGN KEY (current_room_id) 
        REFERENCES rooms (room_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_equipment_code (equipment_code),
    INDEX idx_equipment_category (category),
    INDEX idx_equipment_status (operational_status),
    INDEX idx_equipment_next_maintenance (next_maintenance_due),
    INDEX idx_equipment_current_ward (current_ward_id),
    INDEX idx_equipment_current_room (current_room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Biomedical life-support and disinfection equipment inventory';

-- ============================================================================
-- 11. INVENTORY TABLE
-- Consumables, disinfectants, PPE, and hygiene supplies
-- ============================================================================
CREATE TABLE inventory (
    item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Stock keeping unit e.g. INV-SAN-70-5L',
    item_name VARCHAR(150) NOT NULL,
    category ENUM(
        'HAND_HYGIENE',
        'SURFACE_DISINFECTANT',
        'PPE_KIT',
        'N95_RESPIRATOR',
        'NITRILE_GLOVES',
        'BIOHAZARD_LINER',
        'CLEANING_CHEMICAL',
        'STERILIZATION_WRAP'
    ) NOT NULL,
    ward_id INT NULL COMMENT 'NULL signifies Central Hospital Warehouse/Depot',
    current_stock INT NOT NULL DEFAULT 0,
    unit_of_measure VARCHAR(50) NOT NULL COMMENT 'Liters, Units, Boxes, Rolls',
    minimum_threshold INT NOT NULL DEFAULT 10 COMMENT 'Triggers reorder alert when stock falls below',
    reorder_quantity INT NOT NULL DEFAULT 50,
    status ENUM('ADEQUATE', 'LOW_STOCK', 'CRITICAL_DEPLETED', 'REORDER_PLACED') NOT NULL DEFAULT 'ADEQUATE',
    last_restocked_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_ward FOREIGN KEY (ward_id) 
        REFERENCES wards (ward_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_inventory_item_code (item_code),
    INDEX idx_inventory_category (category),
    INDEX idx_inventory_ward_id (ward_id),
    INDEX idx_inventory_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hygiene consumables and infection prevention stock levels';

-- ============================================================================
-- 12. TASKS TABLE
-- Operational task dispatching (cleaning, linen change, maintenance, waste)
-- ============================================================================
CREATE TABLE tasks (
    task_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Sequential task identifier e.g. TSK-20261018-001',
    task_type ENUM(
        'TERMINAL_ROOM_CLEAN',
        'ROUTINE_WARD_MOP',
        'BED_LINEN_CHANGE',
        'UVC_STERILIZATION_CYCLE',
        'BIO_WASTE_COLLECTION',
        'EQUIPMENT_MAINTENANCE',
        'DISPENSER_REFILL',
        'EMERGENCY_SPILL_RESPONSE'
    ) NOT NULL,
    priority ENUM('ROUTINE', 'URGENT', 'STAT_EMERGENCY') NOT NULL DEFAULT 'ROUTINE',
    assigned_to_user_id BIGINT NULL COMMENT 'Staff member executing the task',
    assigned_by_user_id BIGINT NOT NULL COMMENT 'Supervisor/Manager or system',
    target_ward_id INT NULL,
    target_room_id BIGINT NULL,
    target_bed_id BIGINT NULL,
    target_equipment_id BIGINT NULL,
    scheduled_start_time DATETIME NOT NULL,
    actual_start_time DATETIME NULL DEFAULT NULL,
    actual_end_time DATETIME NULL DEFAULT NULL,
    status ENUM(
        'PENDING',
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETED',
        'VERIFIED',
        'OVERDUE',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',
    special_instructions TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to_user_id) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_assigned_by FOREIGN KEY (assigned_by_user_id) 
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_ward FOREIGN KEY (target_ward_id) 
        REFERENCES wards (ward_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_room FOREIGN KEY (target_room_id) 
        REFERENCES rooms (room_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_bed FOREIGN KEY (target_bed_id) 
        REFERENCES beds (bed_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_equipment FOREIGN KEY (target_equipment_id) 
        REFERENCES equipment (equipment_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_task_code (task_code),
    INDEX idx_task_type (task_type),
    INDEX idx_task_priority (priority),
    INDEX idx_task_status (status),
    INDEX idx_task_assigned_to (assigned_to_user_id),
    INDEX idx_task_target_room (target_room_id),
    INDEX idx_task_target_ward (target_ward_id),
    INDEX idx_task_scheduled_start (scheduled_start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hospital hygiene and operational task assignments';

-- ============================================================================
-- 13. CLEANING_LOGS TABLE
-- Digital record of performed sanitation activities with QR verification
-- ============================================================================
CREATE TABLE cleaning_logs (
    cleaning_log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NULL,
    room_id BIGINT NOT NULL,
    bed_id BIGINT NULL,
    performed_by_user_id BIGINT NOT NULL,
    verified_by_user_id BIGINT NULL COMMENT 'Supervisor verification',
    cleaning_method ENUM(
        'SURFACE_CHEMICAL_WIPE',
        'TERMINAL_DECONTAMINATION',
        'UVC_IRRADIATION',
        'HYDROGEN_PEROXIDE_FOG',
        'STEAM_STERILIZATION'
    ) NOT NULL,
    disinfectant_used VARCHAR(150) NULL,
    qr_scanned_token VARCHAR(100) NOT NULL COMMENT 'Verification token scanned from physical room/bed QR',
    hygiene_score_post_clean DECIMAL(5,2) NULL COMMENT 'Microbial or checklist score after cleaning',
    status ENUM('SUBMITTED', 'APPROVED', 'REJECTED_RECLEAN_REQUIRED') NOT NULL DEFAULT 'SUBMITTED',
    notes TEXT NULL,
    started_at DATETIME NOT NULL,
    completed_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cleaning_logs_task FOREIGN KEY (task_id) 
        REFERENCES tasks (task_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cleaning_logs_room FOREIGN KEY (room_id) 
        REFERENCES rooms (room_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cleaning_logs_bed FOREIGN KEY (bed_id) 
        REFERENCES beds (bed_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cleaning_logs_performer FOREIGN KEY (performed_by_user_id) 
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cleaning_logs_verifier FOREIGN KEY (verified_by_user_id) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_cleaning_logs_task (task_id),
    INDEX idx_cleaning_logs_room (room_id),
    INDEX idx_cleaning_logs_bed (bed_id),
    INDEX idx_cleaning_logs_performer (performed_by_user_id),
    INDEX idx_cleaning_logs_status (status),
    INDEX idx_cleaning_logs_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audited sanitization and terminal cleaning execution logs';

-- ============================================================================
-- 14. MAINTENANCE_LOGS TABLE
-- Equipment preventive maintenance, repairs, and calibration records
-- ============================================================================
CREATE TABLE maintenance_logs (
    maintenance_log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NULL,
    equipment_id BIGINT NOT NULL,
    performed_by_user_id BIGINT NOT NULL,
    maintenance_type ENUM(
        'PREVENTIVE_PLANNED',
        'CORRECTIVE_BREAKDOWN',
        'CALIBRATION',
        'HEPA_FILTER_REPLACEMENT',
        'SAFETY_ELECTRICAL_INSPECTION'
    ) NOT NULL,
    parts_replaced TEXT NULL,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM(
        'IN_PROGRESS',
        'SUCCESSFUL_PASSED',
        'FAILED_REQUIRES_OEM',
        'PENDING_PARTS'
    ) NOT NULL DEFAULT 'SUCCESSFUL_PASSED',
    next_scheduled_date DATE NOT NULL,
    remarks TEXT NULL,
    performed_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_maintenance_logs_task FOREIGN KEY (task_id) 
        REFERENCES tasks (task_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_maintenance_logs_equipment FOREIGN KEY (equipment_id) 
        REFERENCES equipment (equipment_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_maintenance_logs_performer FOREIGN KEY (performed_by_user_id) 
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_maint_equipment (equipment_id),
    INDEX idx_maint_performer (performed_by_user_id),
    INDEX idx_maint_type (maintenance_type),
    INDEX idx_maint_status (status),
    INDEX idx_maint_performed_at (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Biomedical maintenance and calibration records';

-- ============================================================================
-- 15. WASTE_LOGS TABLE
-- Biomedical and hazardous waste disposal logs (Weight, category, manifest)
-- ============================================================================
CREATE TABLE waste_logs (
    waste_log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NULL,
    ward_id INT NOT NULL,
    room_id BIGINT NULL,
    collected_by_user_id BIGINT NOT NULL,
    waste_category ENUM(
        'YELLOW_INFECTIOUS',
        'RED_SHARPS_PLASTICS',
        'BLUE_GLASSWARE_METALLIC',
        'BLACK_GENERAL_NONHAZARDOUS',
        'PURPLE_CYTOTOXIC'
    ) NOT NULL,
    container_barcode_or_rfid VARCHAR(100) NOT NULL COMMENT 'Scanned bag/bin barcode',
    weight_kg DECIMAL(6,2) NOT NULL COMMENT 'Measured load cell weight in kilograms',
    fill_percentage INT NOT NULL COMMENT 'Optical bin level (0-100)',
    disposal_destination VARCHAR(150) NOT NULL COMMENT 'e.g. Central Autoclave, Authorized CBWTF Facility',
    hazard_status ENUM(
        'CONTAINED_SEALED',
        'SPILL_INCIDENT',
        'TRANSFER_COMPLETED',
        'INCINERATED'
    ) NOT NULL DEFAULT 'CONTAINED_SEALED',
    collected_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_waste_logs_task FOREIGN KEY (task_id) 
        REFERENCES tasks (task_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_waste_logs_ward FOREIGN KEY (ward_id) 
        REFERENCES wards (ward_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_waste_logs_room FOREIGN KEY (room_id) 
        REFERENCES rooms (room_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_waste_logs_collector FOREIGN KEY (collected_by_user_id) 
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_waste_ward (ward_id),
    INDEX idx_waste_room (room_id),
    INDEX idx_waste_category (waste_category),
    INDEX idx_waste_collector (collected_by_user_id),
    INDEX idx_waste_hazard_status (hazard_status),
    INDEX idx_waste_collected_at (collected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Biomedical hazardous waste collection manifests';

-- ============================================================================
-- 16. AUDIT_LOGS TABLE
-- Immutable security and compliance trail (Who, What, Where, When, Old/New)
-- ============================================================================
CREATE TABLE audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL COMMENT 'NULL indicates automated system/IoT event',
    action_type VARCHAR(100) NOT NULL COMMENT 'e.g. USER_LOGIN, TASK_COMPLETED, ROOM_STATUS_CHANGED',
    entity_type VARCHAR(50) NOT NULL COMMENT 'e.g. ROOM, BED, TASK, EQUIPMENT, INVENTORY, WASTE',
    entity_id VARCHAR(100) NOT NULL COMMENT 'Primary key of the affected entity',
    ip_address VARCHAR(45) NULL COMMENT 'IPv4 or IPv6 network address',
    user_agent VARCHAR(255) NULL,
    old_values JSON NULL COMMENT 'Previous state snapshot in JSON format',
    new_values JSON NULL COMMENT 'Updated state snapshot in JSON format',
    description VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action_type),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Immutable regulatory and compliance audit trail';

-- ============================================================================
-- INITIAL SEED DATA
-- Default roles, administrator, facility hierarchy, and baseline resources
-- ============================================================================

-- Roles
INSERT INTO roles (role_code, role_name, description) VALUES
('ADMIN', 'System Administrator', 'Full system access and facility configuration'),
('HOSPITAL_MANAGER', 'Hospital Operational Manager', 'Dashboard, analytics, ward overview, and reporting'),
('CLEANING_STAFF', 'Hygiene & Cleaning Staff', 'Cleaning task execution, QR scanning, and linen change'),
('MAINTENANCE_STAFF', 'Biomedical Maintenance Engineer', 'Equipment servicing, calibration, and repair logging'),
('STORE_MANAGER', 'Inventory Store Manager', 'Consumables, PPE, and chemical inventory logistics'),
('AUDITOR', 'Infection Control Auditor', 'Compliance auditing and regulatory report review');

-- Default Administrative & Operational Users
INSERT INTO users (employee_id, role_id, first_name, last_name, email, password_hash, department, status) VALUES
('EMP-ADM-001', 1, 'Preethi', 'R', 'admin@hospital-intelligence.org', '$2b$12$e80yqVb0vTKnJ0Wn.j1P0eX.P6y9sD9cM1b9yG6mB0s3a1b2c3d4e', 'Hospital Administration', 'ACTIVE'),
('EMP-MGR-002', 2, 'Karthik', 'S', 'karthik.mgr@hospital-intelligence.org', '$2b$12$e80yqVb0vTKnJ0Wn.j1P0eX.P6y9sD9cM1b9yG6mB0s3a1b2c3d4e', 'Operational Management', 'ACTIVE'),
('EMP-CLN-003', 3, 'Ravi', 'Kumar', 'ravi.clean@hospital-intelligence.org', '$2b$12$e80yqVb0vTKnJ0Wn.j1P0eX.P6y9sD9cM1b9yG6mB0s3a1b2c3d4e', 'Housekeeping & Hygiene', 'ACTIVE'),
('EMP-BIO-004', 4, 'Ananya', 'Menon', 'ananya.bio@hospital-intelligence.org', '$2b$12$e80yqVb0vTKnJ0Wn.j1P0eX.P6y9sD9cM1b9yG6mB0s3a1b2c3d4e', 'Biomedical Engineering', 'ACTIVE'),
('EMP-STR-005', 5, 'Manikandan', 'N', 'mani.store@hospital-intelligence.org', '$2b$12$e80yqVb0vTKnJ0Wn.j1P0eX.P6y9sD9cM1b9yG6mB0s3a1b2c3d4e', 'Central Depot & Stores', 'ACTIVE'),
('EMP-AUD-006', 6, 'Dr. Sarah', 'Venkatesh', 'sarah.audit@hospital-intelligence.org', '$2b$12$e80yqVb0vTKnJ0Wn.j1P0eX.P6y9sD9cM1b9yG6mB0s3a1b2c3d4e', 'Infection Control Unit', 'ACTIVE');

-- Hospital Entity
INSERT INTO hospitals (hospital_code, name, license_number, address_line1, city, state, postal_code, country, contact_email, contact_phone) VALUES
('HOSP-METRO-01', 'Smart Hospital Medical Center & Research Institute', 'LIC-MED-2026-8849', '100 Healthcare Boulevard, Tech City', 'Chennai', 'Tamil Nadu', '600001', 'India', 'info@hospital-intelligence.org', '+91-44-2819-0000');

-- Building
INSERT INTO buildings (hospital_id, building_code, name, total_floors, status) VALUES
(1, 'BLD-MAIN', 'Surgical & Critical Care Tower', 5, 'ACTIVE');

-- Floors
INSERT INTO floors (building_id, floor_number, floor_code, floor_name, status) VALUES
(1, 0, 'FLR-G', 'Ground Floor - Emergency & Trauma Center', 'ACTIVE'),
(1, 1, 'FLR-01', 'First Floor - Pathology & Diagnostic Labs', 'ACTIVE'),
(1, 2, 'FLR-02', 'Second Floor - Operating Theatre Complex', 'ACTIVE'),
(1, 3, 'FLR-03', 'Third Floor - Intensive Care Units (ICU & NICU)', 'ACTIVE'),
(1, 4, 'FLR-04', 'Fourth Floor - Inpatient Medical Wards', 'ACTIVE');

-- Wards
INSERT INTO wards (floor_id, ward_code, name, ward_type, hygiene_target_score, current_hygiene_score, status) VALUES
(3, 'WRD-OT-CMPLX', 'Operating Theatre Complex (OT 1 & 2)', 'OPERATION_THEATRE', 99.00, 98.40, 'ACTIVE'),
(4, 'WRD-ICU-W1', 'Intensive Care Unit (Wings A & B)', 'ICU', 95.00, 92.60, 'ACTIVE'),
(1, 'WRD-ER-TRAUMA', 'Emergency & Acute Trauma Bay', 'EMERGENCY_TRAUMA', 90.00, 84.10, 'ACTIVE'),
(4, 'WRD-NICU-01', 'Neonatal Intensive Care Unit (NICU)', 'NICU', 98.00, 97.80, 'ACTIVE'),
(5, 'WRD-MED-3A', 'Inpatient Medical Ward 3A', 'GENERAL_WARD', 92.00, 88.50, 'ACTIVE');

-- Sample Rooms
INSERT INTO rooms (ward_id, room_number, room_type, qr_code_identifier, airflow_type, readiness_status) VALUES
(1, 'OT-SUITE-1', 'SURGICAL_SUITE', 'QR-RM-OT-S1-9F83A', 'POSITIVE_PRESSURE', 'READY_FOR_USE'),
(1, 'OT-SUITE-2', 'SURGICAL_SUITE', 'QR-RM-OT-S2-88B1C', 'POSITIVE_PRESSURE', 'READY_FOR_USE'),
(2, 'ICU-BAY-01', 'PATIENT_ROOM', 'QR-RM-ICU-B1-77C2D', 'NEGATIVE_PRESSURE', 'OCCUPIED'),
(2, 'ICU-ISO-101', 'ISOLATION_ROOM', 'QR-RM-ICU-ISO1-33F4A', 'NEGATIVE_PRESSURE', 'READY_FOR_USE'),
(3, 'ER-RESUS-01', 'PATIENT_ROOM', 'QR-RM-ER-R1-44E2B', 'STANDARD_LAMINAR', 'OCCUPIED');

-- Sample Beds
INSERT INTO beds (room_id, bed_number, qr_code_identifier, bed_type, operational_status) VALUES
(3, 'BED-ICU-01A', 'QR-BED-ICU01A-K782', 'ICU_ELECTRIC', 'OCCUPIED'),
(3, 'BED-ICU-01B', 'QR-BED-ICU01B-P994', 'ICU_ELECTRIC', 'VACANT_CLEAN'),
(4, 'BED-ISO-101A', 'QR-BED-ISO101A-M112', 'ISOLATION_NEGATIVE', 'VACANT_CLEAN');

-- Sample Linen Assets
INSERT INTO linen (rfid_tag_or_barcode, linen_type, assigned_bed_id, assigned_ward_id, lifecycle_wash_count, hygiene_state) VALUES
('RFID-LN-883921', 'BEDSHEET_ICU', 1, 2, 14, 'IN_USE'),
('RFID-LN-883922', 'BEDSHEET_ICU', 2, 2, 8, 'CLEAN_STERILIZED'),
('RFID-LN-883923', 'SURGICAL_DRAPE', NULL, 1, 4, 'CLEAN_STERILIZED');

-- Sample Equipment Fleet
INSERT INTO equipment (equipment_code, serial_number, name, category, current_ward_id, current_room_id, qr_code_identifier, operational_status, next_maintenance_due) VALUES
('EQ-VENT-01', 'SN-HAM-C6-9921', 'Hamilton C6 Intensive Care Ventilator', 'VENTILATOR', 2, 3, 'QR-EQ-VENT01-A482', 'IN_USE', '2026-12-15'),
('EQ-UVC-01', 'SN-STER-BOT-004', 'SterilaTech Pulsed Xenon UV-C Robot', 'UVC_DISINFECTION_ROBOT', 1, 1, 'QR-EQ-UVC01-C918', 'AVAILABLE_STERILE', '2026-11-30'),
('EQ-HEPA-01', 'SN-MOB-H14-118', 'Mobile HEPA H14 Air Scrubber Unit', 'HEPA_MOBILE_FILTER', 2, 4, 'QR-EQ-HEPA01-D339', 'AVAILABLE_STERILE', '2027-01-15');

-- Sample Inventory Items
INSERT INTO inventory (item_code, item_name, category, ward_id, current_stock, unit_of_measure, minimum_threshold, reorder_quantity, status) VALUES
('INV-SAN-70-5L', 'Hospital-Grade 70% Isopropanol Hand Rub (5L)', 'HAND_HYGIENE', NULL, 480, 'Liters', 100, 300, 'ADEQUATE'),
('INV-PPE-KITA', 'Full-Body Certified Viral Barrier PPE Kit', 'PPE_KIT', NULL, 1450, 'Sets', 300, 1000, 'ADEQUATE'),
('INV-N95-SURG', 'N95 NIOSH Certified Fluid Resistant Respirator', 'N95_RESPIRATOR', NULL, 2800, 'Units', 500, 2000, 'ADEQUATE'),
('INV-BIN-YEL', 'Heavy-Duty Infectious Biohazard Liners (Yellow)', 'BIOHAZARD_LINER', NULL, 650, 'Rolls', 100, 500, 'ADEQUATE');

-- Sample Tasks
INSERT INTO tasks (task_code, task_type, priority, assigned_to_user_id, assigned_by_user_id, target_ward_id, target_room_id, scheduled_start_time, status) VALUES
('TSK-CLN-001', 'TERMINAL_ROOM_CLEAN', 'URGENT', 3, 2, 1, 1, '2026-10-18 20:30:00', 'IN_PROGRESS'),
('TSK-UVC-002', 'UVC_STERILIZATION_CYCLE', 'ROUTINE', 3, 2, 1, 2, '2026-10-18 21:00:00', 'ASSIGNED');
