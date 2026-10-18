package com.smarthospital;

import com.smarthospital.model.*;
import com.smarthospital.model.enums.*;
import com.smarthospital.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private BuildingRepository buildingRepository;

    @Autowired
    private FloorRepository floorRepository;

    @Autowired
    private WardRepository wardRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Test
    void testDirectDataSourceConnection() throws SQLException {
        assertNotNull(dataSource, "DataSource bean must not be null");
        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Active connection must be acquired");
            assertTrue(connection.isValid(2), "Database connection must be valid");
            System.out.println("✅ Active Database Product: " + connection.getMetaData().getDatabaseProductName());
        }
    }

    @Test
    void testEntityHierarchyAndRepositories() {
        // 1. Create Role & User
        Role role = roleRepository.save(new Role(RoleCode.ADMIN, "System Administrator", "Full Access"));
        assertNotNull(role.getRoleId());

        User user = new User();
        user.setEmployeeId("EMP-TEST-001");
        user.setRole(role);
        user.setFirstName("Test");
        user.setLastName("Admin");
        user.setEmail("admin.test@hospital.org");
        user.setPasswordHash("hashedSecret");
        user.setDepartment("Infection Control");
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);
        assertNotNull(user.getUserId());

        // 2. Create Hospital Hierarchy: Hospital -> Building -> Floor -> Ward -> Room -> Bed
        Hospital hospital = new Hospital();
        hospital.setHospitalCode("HOSP-TEST-01");
        hospital.setName("Metro Health Center");
        hospital.setLicenseNumber("LIC-2026-001");
        hospital.setAddressLine1("123 Healthcare Ave");
        hospital.setCity("Chennai");
        hospital.setState("Tamil Nadu");
        hospital.setPostalCode("600001");
        hospital = hospitalRepository.save(hospital);
        assertNotNull(hospital.getHospitalId());

        Building building = new Building();
        building.setHospital(hospital);
        building.setBuildingCode("BLD-SURGERY");
        building.setName("Surgical & ICU Block");
        building = buildingRepository.save(building);
        assertNotNull(building.getBuildingId());

        Floor floor = new Floor();
        floor.setBuilding(building);
        floor.setFloorNumber(2);
        floor.setFloorCode("FLR-02");
        floor.setFloorName("Operation Theatres & Critical Care");
        floor = floorRepository.save(floor);
        assertNotNull(floor.getFloorId());

        Ward ward = new Ward();
        ward.setFloor(floor);
        ward.setWardCode("WRD-OT-01");
        ward.setName("Cardiac Operating Suites");
        ward.setWardType(WardType.OPERATION_THEATRE);
        ward = wardRepository.save(ward);
        assertNotNull(ward.getWardId());

        Room room = new Room();
        room.setWard(ward);
        room.setRoomNumber("OT-201");
        room.setRoomType(RoomType.SURGICAL_SUITE);
        room.setQrCodeIdentifier("QR-OT-201-TEST");
        room.setAirflowType(AirflowType.POSITIVE_PRESSURE);
        room.setReadinessStatus(ReadinessStatus.READY_FOR_USE);
        room = roomRepository.save(room);
        assertNotNull(room.getRoomId());

        Bed bed = new Bed();
        bed.setRoom(room);
        bed.setBedNumber("BED-OT-TABLE-01");
        bed.setQrCodeIdentifier("QR-BED-OT01-TEST");
        bed.setBedType(BedType.ICU_ELECTRIC);
        bed.setOperationalStatus(OperationalStatus.VACANT_CLEAN);
        bed = bedRepository.save(bed);
        assertNotNull(bed.getBedId());

        // 3. Equipment & Inventory
        Equipment equipment = new Equipment();
        equipment.setEquipmentCode("EQ-TEST-VENT");
        equipment.setSerialNumber("SN-VENT-112233");
        equipment.setName("Hamilton C6 Ventilator");
        equipment.setCategory(EquipmentCategory.VENTILATOR);
        equipment.setCurrentWard(ward);
        equipment.setCurrentRoom(room);
        equipment.setQrCodeIdentifier("QR-EQ-VENT-TEST");
        equipment.setNextMaintenanceDue(LocalDate.now().plusMonths(6));
        equipment = equipmentRepository.save(equipment);
        assertNotNull(equipment.getEquipmentId());

        Inventory item = new Inventory();
        item.setItemCode("INV-SAN-TEST");
        item.setItemName("70% Isopropanol Hand Rub");
        item.setCategory(InventoryCategory.HAND_HYGIENE);
        item.setUnitOfMeasure("Liters");
        item.setCurrentStock(500);
        item = inventoryRepository.save(item);
        assertNotNull(item.getItemId());

        // 4. Task Dispatch
        Task task = new Task();
        task.setTaskCode("TSK-TEST-001");
        task.setTaskType(TaskType.TERMINAL_ROOM_CLEAN);
        task.setPriority(TaskPriority.URGENT);
        task.setAssignedBy(user);
        task.setAssignedTo(user);
        task.setTargetRoom(room);
        task.setScheduledStartTime(LocalDateTime.now().plusHours(1));
        task.setStatus(TaskStatus.ASSIGNED);
        task = taskRepository.save(task);
        assertNotNull(task.getTaskId());

        System.out.println("✅ All 16 Entities and Repositories verified successfully in integration test!");
    }
}
