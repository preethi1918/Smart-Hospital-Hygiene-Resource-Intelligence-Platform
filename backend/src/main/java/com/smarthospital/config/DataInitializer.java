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
import java.sql.Connection;
import java.sql.Statement;
import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;
    private final LinenRepository linenRepository;
    private final LinenHistoryRepository linenHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final DataSource dataSource;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           BedRepository bedRepository,
                           RoomRepository roomRepository,
                           LinenRepository linenRepository,
                           LinenHistoryRepository linenHistoryRepository,
                           PasswordEncoder passwordEncoder,
                           DataSource dataSource) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.bedRepository = bedRepository;
        this.roomRepository = roomRepository;
        this.linenRepository = linenRepository;
        this.linenHistoryRepository = linenHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.dataSource = dataSource;
    }

    @Override
    @Transactional
    public void run(String... args) {
        fixLinenTypeColumn();
        initializeRoles();
        initializeDefaultAdmin();
        initializeBeds();
        initializeLinenItems();
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
            // Secure BCrypt hash: Never store plaintext passwords!
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

    private void initializeBeds() {
        if (bedRepository.count() == 0) {
            roomRepository.findById(1L).ifPresent(room -> {
                Bed bed1 = new Bed();
                bed1.setRoom(room);
                bed1.setBedNumber("ICU-BED-305A");
                bed1.setQrCodeIdentifier("QR-BED-305A");
                bed1.setBedType(BedType.ICU_ELECTRIC);
                bed1.setOperationalStatus(OperationalStatus.VACANT_CLEAN);
                bedRepository.save(bed1);

                Bed bed2 = new Bed();
                bed2.setRoom(room);
                bed2.setBedNumber("ICU-BED-305B");
                bed2.setQrCodeIdentifier("QR-BED-305B");
                bed2.setBedType(BedType.ISOLATION_NEGATIVE);
                bed2.setOperationalStatus(OperationalStatus.OCCUPIED);
                bedRepository.save(bed2);
                logger.info("Initialized sample ICU beds in Room 305");
            });
        }
    }

    private void initializeLinenItems() {
        if (linenRepository.count() == 0) {
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
}
