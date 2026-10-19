package com.smarthospital.config;

import com.smarthospital.model.*;
import com.smarthospital.model.enums.*;
import com.smarthospital.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final LinenRepository linenRepository;
    private final LinenHistoryRepository linenHistoryRepository;
    private final EquipmentRepository equipmentRepository;
    private final TaskRepository taskRepository;
    private final CleaningLogRepository cleaningLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final DataSource dataSource;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           WardRepository wardRepository,
                           RoomRepository roomRepository,
                           BedRepository bedRepository,
                           LinenRepository linenRepository,
                           LinenHistoryRepository linenHistoryRepository,
                           EquipmentRepository equipmentRepository,
                           TaskRepository taskRepository,
                           CleaningLogRepository cleaningLogRepository,
                           PasswordEncoder passwordEncoder,
                           DataSource dataSource) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.wardRepository = wardRepository;
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
        this.linenRepository = linenRepository;
        this.linenHistoryRepository = linenHistoryRepository;
        this.equipmentRepository = equipmentRepository;
        this.taskRepository = taskRepository;
        this.cleaningLogRepository = cleaningLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.dataSource = dataSource;
    }

    @Override
    @Transactional
    public void run(String... args) {
        fixLinenTypeColumn();
        fixTaskTypeColumn();
        fixCleaningLogsColumns();
        initializeRoles();
        initializeDefaultAdmin();
        initializeStructureAndBeds();
        initializeLinenItems();
        initializeEquipment();
        initializeCleaningTasks();
    }

    private void fixLinenTypeColumn() {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("ALTER TABLE linen ALTER COLUMN linen_type VARCHAR(50)");
            logger.info("Ensured linen.linen_type column is VARCHAR(50)");
        } catch (Exception e1) {
            try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
                stmt.execute("ALTER TABLE linen MODIFY COLUMN linen_type VARCHAR(50) NOT NULL");
                logger.info("Ensured linen.linen_type column is VARCHAR(50) (MySQL syntax)");
            } catch (Exception e2) {
                logger.debug("Linen type column alter info: {}", e2.getMessage());
            }
        }
    }

    private void fixTaskTypeColumn() {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("ALTER TABLE tasks ALTER COLUMN task_type VARCHAR(50)");
            logger.info("Ensured tasks.task_type column is VARCHAR(50)");
        } catch (Exception e1) {
            try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
                stmt.execute("ALTER TABLE tasks MODIFY COLUMN task_type VARCHAR(50) NOT NULL");
                logger.info("Ensured tasks.task_type column is VARCHAR(50) (MySQL syntax)");
            } catch (Exception e2) {
                logger.debug("Task type column alter info: {}", e2.getMessage());
            }
        }
    }

    private void fixCleaningLogsColumns() {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("ALTER TABLE cleaning_logs ALTER COLUMN room_id DROP NOT NULL");
            logger.info("Ensured cleaning_logs.room_id column is nullable (H2 DROP NOT NULL)");
        } catch (Exception ignored) {
            try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
                stmt.execute("ALTER TABLE cleaning_logs ALTER COLUMN room_id NULL");
                logger.info("Ensured cleaning_logs.room_id column is nullable (H2 ALTER COLUMN NULL)");
            } catch (Exception ignored2) {
                try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
                    stmt.execute("ALTER TABLE cleaning_logs MODIFY COLUMN room_id BIGINT NULL");
                    logger.info("Ensured cleaning_logs.room_id column is nullable (MySQL MODIFY)");
                } catch (Exception e) {
                    logger.debug("Cleaning logs room column alter info: {}", e.getMessage());
                }
            }
        }
    }

    private void initializeRoles() {
        for (RoleCode roleCode : RoleCode.values()) {
            if (roleRepository.findByRoleCode(roleCode).isEmpty()) {
                String roleName = roleCode.name().replace('_', ' ');
                String description = "Hospital system role for " + roleName;
                Role role = new Role(roleCode, roleName, description);
                roleRepository.save(role);
                logger.info("Initialized system role: {}", roleCode);
            }
        }
    }

    private void initializeDefaultAdmin() {
        String adminEmail = "admin@hospital.com";
        String adminEmployeeId = "EMP-ADM-001";

        if (userRepository.findByEmail(adminEmail).isEmpty() &&
                userRepository.findByEmployeeId(adminEmployeeId).isEmpty()) {

            Role adminRole = roleRepository.findByRoleCode(RoleCode.ADMIN).orElse(null);
            if (adminRole == null) {
                adminRole = roleRepository.save(new Role(RoleCode.ADMIN, "System Administrator", "Full Access"));
            }

            User admin = new User();
            admin.setEmployeeId(adminEmployeeId);
            admin.setEmail(adminEmail);
            admin.setPasswordHash(passwordEncoder.encode("Admin@123456"));
            admin.setFirstName("Hospital");
            admin.setLastName("Administrator");
            admin.setDepartment("Executive & IT Administration");
            admin.setPhoneNumber("+1-555-0100");
            admin.setRole(adminRole);
            admin.setStatus(UserStatus.ACTIVE);

            userRepository.save(admin);
            logger.info("Initialized default secure admin user: {}", adminEmail);
        }
    }

    private void initializeStructureAndBeds() {
        // Room 305 beds
        roomRepository.findById(1L).ifPresent(room -> {
            if (room.getQrCodeIdentifier() == null || room.getQrCodeIdentifier().trim().isEmpty()) {
                room.setQrCodeIdentifier("ROOM-305");
                roomRepository.save(room);
            }

            if (bedRepository.count() == 0) {
                Bed bed1 = new Bed();
                bed1.setRoom(room);
                bed1.setBedNumber("ICU-BED-305A");
                bed1.setQrCodeIdentifier("ICU-BED-305A");
                bed1.setBedType(BedType.ICU_ELECTRIC);
                bed1.setOperationalStatus(OperationalStatus.VACANT_CLEAN);
                bedRepository.save(bed1);

                Bed bed2 = new Bed();
                bed2.setRoom(room);
                bed2.setBedNumber("ICU-BED-305B");
                bed2.setQrCodeIdentifier("ICU-BED-305B");
                bed2.setBedType(BedType.ISOLATION_NEGATIVE);
                bed2.setOperationalStatus(OperationalStatus.OCCUPIED);
                bedRepository.save(bed2);
                logger.info("Initialized sample ICU beds in Room 305");
            }
        });

        // Initialize Room ROOM-204 and Bed BED-204 if missing (User prompt example)
        if (roomRepository.findByQrCodeIdentifier("ROOM-204").isEmpty()) {
            Ward ward = wardRepository.findAll().stream().findFirst().orElse(null);
            if (ward != null) {
                Room room204 = new Room();
                room204.setWard(ward);
                room204.setRoomNumber("204");
                room204.setRoomType(RoomType.PATIENT_ROOM);
                room204.setAirflowType(AirflowType.STANDARD_LAMINAR);
                room204.setReadinessStatus(ReadinessStatus.READY_FOR_USE);
                room204.setQrCodeIdentifier("ROOM-204");
                Room savedRoom = roomRepository.save(room204);

                Bed bed204 = new Bed();
                bed204.setRoom(savedRoom);
                bed204.setBedNumber("204");
                bed204.setBedType(BedType.STANDARD_INPATIENT);
                bed204.setOperationalStatus(OperationalStatus.VACANT_CLEAN);
                bed204.setQrCodeIdentifier("BED-204");
                bedRepository.save(bed204);
                logger.info("Initialized sample Room ROOM-204 and Bed BED-204");
            }
        }
    }

    private void initializeLinenItems() {
        if (linenRepository.findByLinenCode("LINEN-1024").isEmpty()) {
            Linen promptLinen = new Linen();
            promptLinen.setLinenCode("LINEN-1024");
            promptLinen.setRfidTagOrBarcode("LINEN-1024");
            promptLinen.setLinenType(LinenType.BEDSHEET);
            promptLinen.setStatus(LinenStatus.CLEAN);
            promptLinen.setCurrentLocation("Central Linen Supply Bay 1");
            promptLinen.setWashCycleCount(7);
            promptLinen.setMaxWashCycles(60);
            promptLinen.setIssueDate(LocalDate.now().minusMonths(2));
            promptLinen.setLastWashedDate(LocalDate.now().minusDays(1));
            promptLinen.setDamageStatus(DamageStatus.NONE);
            linenRepository.save(promptLinen);
            logger.info("Initialized sample prompt Linen LINEN-1024");
        }

        if (linenRepository.count() <= 1) {
            Bed bed1 = bedRepository.findAll().stream().findFirst().orElse(null);

            Linen l1 = new Linen();
            l1.setLinenCode("LIN-BS-101");
            l1.setLinenType(LinenType.BEDSHEET);
            l1.setStatus(LinenStatus.CLEAN);
            l1.setCurrentLocation("Central Linen Storage Bay 1");
            l1.setWashCycleCount(4);
            l1.setMaxWashCycles(60);
            l1.setIssueDate(LocalDate.now().minusMonths(3));
            l1.setLastWashedDate(LocalDate.now().minusDays(1));
            l1.setDamageStatus(DamageStatus.NONE);
            linenRepository.save(l1);

            Linen l2 = new Linen();
            l2.setLinenCode("LIN-BS-102");
            l2.setLinenType(LinenType.BEDSHEET);
            l2.setStatus(LinenStatus.IN_USE);
            if (bed1 != null) {
                l2.setAssignedBed(bed1);
                if (bed1.getRoom() != null && bed1.getRoom().getWard() != null) {
                    l2.setAssignedWard(bed1.getRoom().getWard());
                    l2.setCurrentLocation("Ward: " + bed1.getRoom().getWard().getName() + " - Bed: " + bed1.getBedNumber());
                }
            } else {
                l2.setCurrentLocation("ICU Room 305 - Bed A");
            }
            l2.setWashCycleCount(11);
            l2.setMaxWashCycles(60);
            l2.setIssueDate(LocalDate.now().minusMonths(2));
            l2.setLastWashedDate(LocalDate.now().minusDays(2));
            l2.setDamageStatus(DamageStatus.NONE);
            linenRepository.save(l2);

            Linen l3 = new Linen();
            l3.setLinenCode("LIN-PC-201");
            l3.setLinenType(LinenType.PILLOW_COVER);
            l3.setStatus(LinenStatus.CLEAN);
            l3.setCurrentLocation("Central Linen Storage Bay 2");
            l3.setWashCycleCount(6);
            l3.setMaxWashCycles(50);
            l3.setIssueDate(LocalDate.now().minusMonths(3));
            l3.setLastWashedDate(LocalDate.now().minusDays(1));
            l3.setDamageStatus(DamageStatus.NONE);
            linenRepository.save(l3);

            Linen l4 = new Linen();
            l4.setLinenCode("LIN-PC-202");
            l4.setLinenType(LinenType.PILLOW_COVER);
            l4.setStatus(LinenStatus.DUE_FOR_CHANGE);
            l4.setCurrentLocation("ICU Room 305 - Bed A");
            if (bed1 != null) l4.setAssignedBed(bed1);
            l4.setWashCycleCount(18);
            l4.setMaxWashCycles(50);
            l4.setIssueDate(LocalDate.now().minusMonths(4));
            l4.setLastWashedDate(LocalDate.now().minusDays(5));
            l4.setDamageStatus(DamageStatus.NONE);
            linenRepository.save(l4);

            Linen l5 = new Linen();
            l5.setLinenCode("LIN-BL-301");
            l5.setLinenType(LinenType.BLANKET);
            l5.setStatus(LinenStatus.IN_LAUNDRY);
            l5.setCurrentLocation("Hospital Laundry Facility - Decontamination Washer #3");
            l5.setWashCycleCount(22);
            l5.setMaxWashCycles(60);
            l5.setIssueDate(LocalDate.now().minusMonths(5));
            l5.setLastWashedDate(LocalDate.now().minusDays(7));
            l5.setDamageStatus(DamageStatus.NONE);
            linenRepository.save(l5);

            Linen l6 = new Linen();
            l6.setLinenCode("LIN-PG-401");
            l6.setLinenType(LinenType.PATIENT_GOWN);
            l6.setStatus(LinenStatus.CLEAN);
            l6.setCurrentLocation("Sterile Gown Dispenser Station 3");
            l6.setWashCycleCount(8);
            l6.setMaxWashCycles(45);
            l6.setIssueDate(LocalDate.now().minusMonths(2));
            l6.setLastWashedDate(LocalDate.now().minusDays(1));
            l6.setDamageStatus(DamageStatus.NONE);
            linenRepository.save(l6);

            Linen l7 = new Linen();
            l7.setLinenCode("LIN-PG-402");
            l7.setLinenType(LinenType.PATIENT_GOWN);
            l7.setStatus(LinenStatus.DAMAGED);
            l7.setCurrentLocation("Linen Inspection & Repair Bay");
            l7.setWashCycleCount(32);
            l7.setMaxWashCycles(45);
            l7.setIssueDate(LocalDate.now().minusMonths(6));
            l7.setLastWashedDate(LocalDate.now().minusDays(10));
            l7.setDamageStatus(DamageStatus.TORN);
            l7.setDamageNotes("Torn seam along left sleeve from heavy autoclave cycle");
            linenRepository.save(l7);

            Linen l8 = new Linen();
            l8.setLinenCode("LIN-OT-501");
            l8.setLinenType(LinenType.OTHER);
            l8.setStatus(LinenStatus.RETIRED);
            l8.setCurrentLocation("Decommissioned Asset Depot");
            l8.setWashCycleCount(60);
            l8.setMaxWashCycles(60);
            l8.setIssueDate(LocalDate.now().minusYears(1));
            l8.setLastWashedDate(LocalDate.now().minusMonths(1));
            l8.setDamageStatus(DamageStatus.MINOR_WEAR);
            l8.setDamageNotes("End of lifecycle reached: 60 wash cycles completed");
            linenRepository.save(l8);

            logger.info("Initialized sample linen assets across all types and statuses");
        }
    }

    private void initializeEquipment() {
        if (equipmentRepository.findByQrCodeIdentifier("EQUIP-501").isEmpty()) {
            Ward ward = wardRepository.findAll().stream().findFirst().orElse(null);
            Room room = roomRepository.findAll().stream().findFirst().orElse(null);

            Equipment eq1 = new Equipment();
            eq1.setName("Mobile Xenon UVC Decontamination Robot");
            eq1.setEquipmentCode("EQ-UVC-501");
            eq1.setSerialNumber("SN-UVC-8821");
            eq1.setCategory(EquipmentCategory.UVC_DISINFECTION_ROBOT);
            eq1.setQrCodeIdentifier("EQUIP-501");
            eq1.setOperationalStatus(OperationalStatus.AVAILABLE_STERILE);
            eq1.setCurrentWard(ward);
            eq1.setCurrentRoom(room);
            eq1.setLastMaintenanceDate(LocalDate.now().minusDays(12));
            eq1.setNextMaintenanceDue(LocalDate.now().plusMonths(3));
            equipmentRepository.save(eq1);

            Equipment eq2 = new Equipment();
            eq2.setName("Intelligent ICU Mechanical Ventilator");
            eq2.setEquipmentCode("EQ-VENT-502");
            eq2.setSerialNumber("SN-VENT-9014");
            eq2.setCategory(EquipmentCategory.VENTILATOR);
            eq2.setQrCodeIdentifier("EQUIP-502");
            eq2.setOperationalStatus(OperationalStatus.IN_USE);
            eq2.setCurrentWard(ward);
            eq2.setCurrentRoom(room);
            eq2.setLastMaintenanceDate(LocalDate.now().minusDays(25));
            eq2.setNextMaintenanceDue(LocalDate.now().plusMonths(2));
            equipmentRepository.save(eq2);

            Equipment eq3 = new Equipment();
            eq3.setName("Multiparameter Patient Vital Signs Monitor");
            eq3.setEquipmentCode("EQ-MON-503");
            eq3.setSerialNumber("SN-MON-3312");
            eq3.setCategory(EquipmentCategory.PATIENT_MONITOR);
            eq3.setQrCodeIdentifier("EQUIP-503");
            eq3.setOperationalStatus(OperationalStatus.AVAILABLE_STERILE);
            eq3.setCurrentWard(ward);
            eq3.setCurrentRoom(room);
            eq3.setLastMaintenanceDate(LocalDate.now().minusDays(5));
            eq3.setNextMaintenanceDue(LocalDate.now().plusMonths(6));
            equipmentRepository.save(eq3);

            logger.info("Initialized sample biomedical equipment items with QR codes");
        }
    }

    private void initializeCleaningTasks() {
        if (taskRepository.count() == 0) {
            User admin = userRepository.findByEmail("admin@hospital.com").orElse(null);
            Room room204 = roomRepository.findByQrCodeIdentifier("ROOM-204").orElse(null);
            Bed bed204 = bedRepository.findByQrCodeIdentifier("BED-204").orElse(null);

            // 1. ROOM Cleaning Task (COMPLETED)
            Task taskRoom = new Task();
            taskRoom.setTaskCode("TASK-CLN-101");
            taskRoom.setLocationName("Inpatient Room 204 (West Wing)");
            taskRoom.setLocationType(CleaningLocationType.ROOM);
            taskRoom.setTargetQrCode("ROOM-204");
            taskRoom.setTargetRoom(room204);
            taskRoom.setTaskType(TaskType.TERMINAL_ROOM_CLEAN);
            taskRoom.setPriority(TaskPriority.URGENT);
            taskRoom.setStatus(TaskStatus.COMPLETED);
            taskRoom.setAssignedStaffName("Nurse Sarah Jenkins (Sanitation Lead)");
            taskRoom.setCompletedByStaffName("Nurse Sarah Jenkins (Sanitation Lead)");
            taskRoom.setScheduledStartTime(LocalDateTime.now().minusHours(2));
            taskRoom.setActualStartTime(LocalDateTime.now().minusMinutes(110));
            taskRoom.setActualEndTime(LocalDateTime.now().minusMinutes(70));
            taskRoom.setSpecialInstructions("Perform full biohazard terminal clean post-patient discharge.");
            taskRoom.setNotes("Terminal clean completed with hospital-grade quaternary spray. All touch surfaces disinfected.");
            taskRoom.setAssignedBy(admin);
            taskRepository.save(taskRoom);

            CleaningLog log1 = new CleaningLog();
            log1.setTask(taskRoom);
            log1.setRoom(room204);
            log1.setLocationName(taskRoom.getLocationName());
            log1.setLocationType(CleaningLocationType.ROOM);
            log1.setPerformedBy(admin);
            log1.setPerformedByStaffName("Nurse Sarah Jenkins (Sanitation Lead)");
            log1.setCleaningMethod(CleaningMethod.SURFACE_CHEMICAL_WIPE);
            log1.setDisinfectantUsed("Hospital-Grade Quaternary Disinfectant (Virex II 256)");
            log1.setQrScannedToken("ROOM-204");
            log1.setHygieneScorePostClean(new BigDecimal("99.20"));
            log1.setStatus("COMPLETED");
            log1.setNotes("Room sanitized to surgical turnover grade. Ready for patient admission.");
            log1.setStartedAt(taskRoom.getActualStartTime());
            log1.setCompletedAt(taskRoom.getActualEndTime());
            cleaningLogRepository.save(log1);

            // 2. BED Cleaning Task (IN_PROGRESS)
            Task taskBed = new Task();
            taskBed.setTaskCode("TASK-CLN-102");
            taskBed.setLocationName("Bed B-204-A (Room 204)");
            taskBed.setLocationType(CleaningLocationType.BED);
            taskBed.setTargetQrCode("BED-204");
            taskBed.setTargetBed(bed204);
            taskBed.setTaskType(TaskType.BED_DISINFECTION);
            taskBed.setPriority(TaskPriority.URGENT);
            taskBed.setStatus(TaskStatus.IN_PROGRESS);
            taskBed.setAssignedStaffName("Robert Chang (Sterile Services)");
            taskBed.setScheduledStartTime(LocalDateTime.now().minusMinutes(45));
            taskBed.setActualStartTime(LocalDateTime.now().minusMinutes(30));
            taskBed.setSpecialInstructions("Strip soiled linen, apply antimicrobial mattress wrap, and disinfect side-rails.");
            taskBed.setNotes("Linen stripped. Currently applying bleach-free antimicrobial disinfectant to mattress envelope.");
            taskBed.setAssignedBy(admin);
            taskRepository.save(taskBed);

            // 3. TOILET Cleaning Task (OVERDUE)
            Task taskToilet = new Task();
            taskToilet.setTaskCode("TASK-CLN-103");
            taskToilet.setLocationName("Public Restroom Complex - Ward 2");
            taskToilet.setLocationType(CleaningLocationType.TOILET);
            taskToilet.setTargetQrCode("TOILET-W2-01");
            taskToilet.setTaskType(TaskType.TOILET_DEEP_CLEAN);
            taskToilet.setPriority(TaskPriority.STAT_EMERGENCY);
            taskToilet.setStatus(TaskStatus.OVERDUE);
            taskToilet.setAssignedStaffName("Maria Gonzalez (Hygiene Tech)");
            taskToilet.setScheduledStartTime(LocalDateTime.now().minusHours(3));
            taskToilet.setSpecialInstructions("Deep steam sterilization of ceramic fixtures and replenish antimicrobial soap.");
            taskToilet.setNotes("Scheduled hourly inspection missed. Needs urgent sanitation response.");
            taskToilet.setAssignedBy(admin);
            taskRepository.save(taskToilet);

            // 4. CORRIDOR Cleaning Task (COMPLETED)
            Task taskCorr = new Task();
            taskCorr.setTaskCode("TASK-CLN-104");
            taskCorr.setLocationName("Level 3 North Hallway Corridor");
            taskCorr.setLocationType(CleaningLocationType.CORRIDOR);
            taskCorr.setTargetQrCode("CORR-L3-N");
            taskCorr.setTaskType(TaskType.CORRIDOR_SANITY_MOP);
            taskCorr.setPriority(TaskPriority.ROUTINE);
            taskCorr.setStatus(TaskStatus.COMPLETED);
            taskCorr.setAssignedStaffName("David Miller (Environmental Operations)");
            taskCorr.setCompletedByStaffName("David Miller (Environmental Operations)");
            taskCorr.setScheduledStartTime(LocalDateTime.now().minusHours(4));
            taskCorr.setActualStartTime(LocalDateTime.now().minusHours(4));
            taskCorr.setActualEndTime(LocalDateTime.now().minusHours(3));
            taskCorr.setSpecialInstructions("Machine scrubbing and high-traction sanitizing wet mop.");
            taskCorr.setNotes("Passed high-efficiency floor scrubber with neutralized bio-disinfectant.");
            taskCorr.setAssignedBy(admin);
            taskRepository.save(taskCorr);

            CleaningLog log2 = new CleaningLog();
            log2.setTask(taskCorr);
            log2.setLocationName(taskCorr.getLocationName());
            log2.setLocationType(CleaningLocationType.CORRIDOR);
            log2.setPerformedBy(admin);
            log2.setPerformedByStaffName("David Miller (Environmental Operations)");
            log2.setCleaningMethod(CleaningMethod.STEAM_STERILIZATION);
            log2.setDisinfectantUsed("Peracetic Acid Solution (0.2%)");
            log2.setQrScannedToken("CORR-L3-N");
            log2.setHygieneScorePostClean(new BigDecimal("96.80"));
            log2.setStatus("COMPLETED");
            log2.setNotes("Corridor floor polished and sterilized. Floor friction coefficient compliant.");
            log2.setStartedAt(taskCorr.getActualStartTime());
            log2.setCompletedAt(taskCorr.getActualEndTime());
            cleaningLogRepository.save(log2);

            // 5. WAITING AREA Cleaning Task (VERIFIED)
            Task taskWait = new Task();
            taskWait.setTaskCode("TASK-CLN-105");
            taskWait.setLocationName("Emergency Reception Waiting Lounge");
            taskWait.setLocationType(CleaningLocationType.WAITING_AREA);
            taskWait.setTargetQrCode("WAIT-ER-01");
            taskWait.setTaskType(TaskType.WAITING_AREA_SANITATION);
            taskWait.setPriority(TaskPriority.URGENT);
            taskWait.setStatus(TaskStatus.VERIFIED);
            taskWait.setAssignedStaffName("Elena Rostova (Sanitation)");
            taskWait.setCompletedByStaffName("Elena Rostova (Sanitation)");
            taskWait.setVerifiedByStaffName("Dr. Vance (Chief Hygiene Officer)");
            taskWait.setScheduledStartTime(LocalDateTime.now().minusHours(5));
            taskWait.setActualStartTime(LocalDateTime.now().minusHours(5));
            taskWait.setActualEndTime(LocalDateTime.now().minusHours(4));
            taskWait.setSpecialInstructions("High-frequency touchpoint wipe-down and aerosol mist disinfection.");
            taskWait.setNotes("Misting and electrostatic spray complete. Verified compliant with hospital infection control standard.");
            taskWait.setAssignedBy(admin);
            taskRepository.save(taskWait);

            CleaningLog log3 = new CleaningLog();
            log3.setTask(taskWait);
            log3.setLocationName(taskWait.getLocationName());
            log3.setLocationType(CleaningLocationType.WAITING_AREA);
            log3.setPerformedBy(admin);
            log3.setPerformedByStaffName("Elena Rostova (Sanitation)");
            log3.setVerifiedByStaffName("Dr. Vance (Chief Hygiene Officer)");
            log3.setCleaningMethod(CleaningMethod.UVC_IRRADIATION);
            log3.setDisinfectantUsed("Hydrogen Peroxide Dry Fog Vapor + UV-C Mobile Lamp");
            log3.setQrScannedToken("WAIT-ER-01");
            log3.setHygieneScorePostClean(new BigDecimal("99.50"));
            log3.setStatus("COMPLETED");
            log3.setNotes("Complete airborne and surface microbial eradication certified.");
            log3.setStartedAt(taskWait.getActualStartTime());
            log3.setCompletedAt(taskWait.getActualEndTime());
            cleaningLogRepository.save(log3);

            // 6. HANDWASH STATION Cleaning Task (PENDING)
            Task taskHwash = new Task();
            taskHwash.setTaskCode("TASK-CLN-106");
            taskHwash.setLocationName("ICU Central Handwash Station #1");
            taskHwash.setLocationType(CleaningLocationType.HANDWASH_STATION);
            taskHwash.setTargetQrCode("HWASH-ICU-01");
            taskHwash.setTaskType(TaskType.HANDWASH_STATION_SERVICE);
            taskHwash.setPriority(TaskPriority.URGENT);
            taskHwash.setStatus(TaskStatus.PENDING);
            taskHwash.setAssignedStaffName("James Wilson (Sterile Tech)");
            taskHwash.setScheduledStartTime(LocalDateTime.now().plusHours(2));
            taskHwash.setSpecialInstructions("Inspect chlorhexidine refill cartridge, wipe faucet sensor, flush drains.");
            taskHwash.setNotes("Routine pre-shift hygiene check and refill scheduled.");
            taskHwash.setAssignedBy(admin);
            taskRepository.save(taskHwash);

            logger.info("Initialized sample cleaning tasks and audit logs across all 6 locations (Rooms, Beds, Toilets, Corridors, Waiting Areas, Handwash Stations)");
        }
    }
}
