package com.smarthospital;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarthospital.dto.*;
import com.smarthospital.model.enums.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class HospitalStructureManagementTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String cleanerToken;

    @BeforeEach
    void setupTokens() throws Exception {
        // Register or login admin
        LoginRequest adminLogin = new LoginRequest("admin@hospital.com", "Admin@123456");
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andReturn();

        if (adminResult.getResponse().getStatus() == 200) {
            adminToken = objectMapper.readTree(adminResult.getResponse().getContentAsString())
                    .path("data").path("token").asText();
        } else {
            RegisterRequest adminReg = new RegisterRequest(
                    "EMP-TEST-ADM", "admin.struct@hospital.com", "AdminPass@123",
                    "Super", "Admin", "Management", RoleCode.ADMIN, "1234"
            );
            MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(adminReg)))
                    .andExpect(status().isCreated())
                    .andReturn();
            adminToken = objectMapper.readTree(regResult.getResponse().getContentAsString())
                    .path("data").path("token").asText();
        }

        // Register cleaning staff
        RegisterRequest cleanerReg = new RegisterRequest(
                "EMP-CLN-STRUCT", "cleaner.struct@hospital.com", "CleanPass@123",
                "Bob", "Cleaner", "Hygiene", RoleCode.CLEANING_STAFF, "5678"
        );
        MvcResult cleanerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cleanerReg)))
                .andReturn();

        if (cleanerResult.getResponse().getStatus() == 201) {
            cleanerToken = objectMapper.readTree(cleanerResult.getResponse().getContentAsString())
                    .path("data").path("token").asText();
        } else {
            LoginRequest cleanerLogin = new LoginRequest("cleaner.struct@hospital.com", "CleanPass@123");
            MvcResult clnLoginRes = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(cleanerLogin)))
                    .andExpect(status().isOk())
                    .andReturn();
            cleanerToken = objectMapper.readTree(clnLoginRes.getResponse().getContentAsString())
                    .path("data").path("token").asText();
        }
    }

    @Test
    @DisplayName("Complete Hospital Structure CRUD: Hospital -> Building -> Floor -> Ward -> Room -> Bed")
    void testCompleteHospitalStructureCRUD() throws Exception {
        // ---------------------------------------------------------------------
        // 1. CREATE HOSPITAL
        // ---------------------------------------------------------------------
        HospitalRequest hospReq = new HospitalRequest();
        hospReq.setHospitalCode("HOSP-APOLLO-01");
        hospReq.setName("Apollo Central Multi-Specialty Hospital");
        hospReq.setLicenseNumber("LIC-MED-2026-999");
        hospReq.setAddressLine1("21 Greams Lane, Thousand Lights");
        hospReq.setCity("Chennai");
        hospReq.setState("Tamil Nadu");
        hospReq.setPostalCode("600006");
        hospReq.setContactEmail("contact@apollo-central.org");
        hospReq.setContactPhone("+91-44-28290200");

        MvcResult hospResult = mockMvc.perform(post("/api/hospitals")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(hospReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.hospitalId").isNotEmpty())
                .andExpect(jsonPath("$.data.hospitalCode").value("HOSP-APOLLO-01"))
                .andReturn();

        Integer hospitalId = objectMapper.readTree(hospResult.getResponse().getContentAsString())
                .path("data").path("hospitalId").asInt();

        // ---------------------------------------------------------------------
        // 2. CREATE BUILDING
        // ---------------------------------------------------------------------
        BuildingRequest bldReq = new BuildingRequest();
        bldReq.setHospitalId(hospitalId);
        bldReq.setBuildingCode("BLD-CRITICAL-CARE");
        bldReq.setName("Critical Care & Trauma Wing");
        bldReq.setTotalFloors(6);

        MvcResult bldResult = mockMvc.perform(post("/api/buildings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bldReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.buildingId").isNotEmpty())
                .andExpect(jsonPath("$.data.buildingCode").value("BLD-CRITICAL-CARE"))
                .andReturn();

        Integer buildingId = objectMapper.readTree(bldResult.getResponse().getContentAsString())
                .path("data").path("buildingId").asInt();

        // ---------------------------------------------------------------------
        // 3. CREATE FLOOR
        // ---------------------------------------------------------------------
        FloorRequest flrReq = new FloorRequest();
        flrReq.setBuildingId(buildingId);
        flrReq.setFloorNumber(3);
        flrReq.setFloorCode("FLR-03");
        flrReq.setFloorName("Level 3 Intensive Care & Surgical Recovery");

        MvcResult flrResult = mockMvc.perform(post("/api/floors")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(flrReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.floorId").isNotEmpty())
                .andExpect(jsonPath("$.data.floorNumber").value(3))
                .andReturn();

        Integer floorId = objectMapper.readTree(flrResult.getResponse().getContentAsString())
                .path("data").path("floorId").asInt();

        // ---------------------------------------------------------------------
        // 4. CREATE WARD
        // ---------------------------------------------------------------------
        WardRequest wardReq = new WardRequest();
        wardReq.setFloorId(floorId);
        wardReq.setWardCode("WRD-ICU-03");
        wardReq.setName("Coronary Intensive Care Unit");
        wardReq.setWardType(WardType.ICU);
        wardReq.setHygieneTargetScore(new BigDecimal("98.50"));
        wardReq.setCurrentHygieneScore(new BigDecimal("99.00"));

        MvcResult wardResult = mockMvc.perform(post("/api/wards")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wardReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.wardId").isNotEmpty())
                .andExpect(jsonPath("$.data.wardCode").value("WRD-ICU-03"))
                .andExpect(jsonPath("$.data.wardType").value("ICU"))
                .andReturn();

        Integer wardId = objectMapper.readTree(wardResult.getResponse().getContentAsString())
                .path("data").path("wardId").asInt();

        // ---------------------------------------------------------------------
        // 5. CREATE ROOM
        // ---------------------------------------------------------------------
        RoomRequest roomReq = new RoomRequest();
        roomReq.setWardId(wardId);
        roomReq.setRoomNumber("ICU-301");
        roomReq.setRoomType(RoomType.ISOLATION_ROOM);
        roomReq.setQrCodeIdentifier("QR-ROOM-ICU301-APOLLO");
        roomReq.setAirflowType(AirflowType.NEGATIVE_PRESSURE);
        roomReq.setReadinessStatus(ReadinessStatus.READY_FOR_USE);

        MvcResult roomResult = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.roomId").isNotEmpty())
                .andExpect(jsonPath("$.data.roomNumber").value("ICU-301"))
                .andExpect(jsonPath("$.data.airflowType").value("NEGATIVE_PRESSURE"))
                .andReturn();

        Long roomId = objectMapper.readTree(roomResult.getResponse().getContentAsString())
                .path("data").path("roomId").asLong();

        // ---------------------------------------------------------------------
        // 6. CREATE BED
        // ---------------------------------------------------------------------
        BedRequest bedReq = new BedRequest();
        bedReq.setRoomId(roomId);
        bedReq.setBedNumber("BED-ICU-301-A");
        bedReq.setQrCodeIdentifier("QR-BED-ICU301A-APOLLO");
        bedReq.setBedType(BedType.ICU_ELECTRIC);
        bedReq.setOperationalStatus(OperationalStatus.VACANT_CLEAN);

        MvcResult bedResult = mockMvc.perform(post("/api/beds")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bedReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.bedId").isNotEmpty())
                .andExpect(jsonPath("$.data.bedNumber").value("BED-ICU-301-A"))
                .andExpect(jsonPath("$.data.operationalStatus").value("VACANT_CLEAN"))
                .andReturn();

        Long bedId = objectMapper.readTree(bedResult.getResponse().getContentAsString())
                .path("data").path("bedId").asLong();

        // ---------------------------------------------------------------------
        // 7. READ & SEARCH OPERATIONS
        // ---------------------------------------------------------------------
        mockMvc.perform(get("/api/hospitals?city=Chennai")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].city").value("Chennai"));

        mockMvc.perform(get("/api/buildings?hospitalId=" + hospitalId)
                        .header("Authorization", "Bearer " + cleanerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].buildingCode").value("BLD-CRITICAL-CARE"));

        mockMvc.perform(get("/api/floors?buildingId=" + buildingId)
                        .header("Authorization", "Bearer " + cleanerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].floorNumber").value(3));

        mockMvc.perform(get("/api/wards?floorId=" + floorId)
                        .header("Authorization", "Bearer " + cleanerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].wardCode").value("WRD-ICU-03"));

        mockMvc.perform(get("/api/rooms?wardId=" + wardId + "&readinessStatus=READY_FOR_USE")
                        .header("Authorization", "Bearer " + cleanerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].roomNumber").value("ICU-301"));

        mockMvc.perform(get("/api/beds?roomId=" + roomId + "&operationalStatus=VACANT_CLEAN")
                        .header("Authorization", "Bearer " + cleanerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].bedNumber").value("BED-ICU-301-A"));

        // ---------------------------------------------------------------------
        // 8. STATUS MANAGEMENT
        // ---------------------------------------------------------------------
        // Update Room readiness status to DISINFECTION_IN_PROGRESS
        mockMvc.perform(patch("/api/rooms/" + roomId + "/readiness-status")
                        .header("Authorization", "Bearer " + cleanerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("readinessStatus", "DISINFECTION_IN_PROGRESS"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.readinessStatus").value("DISINFECTION_IN_PROGRESS"));

        // Update Bed operational status to OCCUPIED
        mockMvc.perform(patch("/api/beds/" + bedId + "/operational-status")
                        .header("Authorization", "Bearer " + cleanerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("operationalStatus", "OCCUPIED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.operationalStatus").value("OCCUPIED"));

        // Update Ward hygiene score
        mockMvc.perform(patch("/api/wards/" + wardId + "/hygiene-score")
                        .header("Authorization", "Bearer " + cleanerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("score", 96.75))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentHygieneScore").value(96.75));

        // ---------------------------------------------------------------------
        // 9. RELATIONAL INTEGRITY CHECKS
        // ---------------------------------------------------------------------
        // Occupied bed cannot be deleted
        mockMvc.perform(delete("/api/beds/" + bedId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        // Room cannot be deleted while containing beds
        mockMvc.perform(delete("/api/rooms/" + roomId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        // Ward cannot be deleted while containing rooms
        mockMvc.perform(delete("/api/wards/" + wardId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        // Transition bed back to VACANT_CLEAN and delete
        mockMvc.perform(patch("/api/beds/" + bedId + "/operational-status")
                        .header("Authorization", "Bearer " + cleanerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("operationalStatus", "VACANT_CLEAN"))))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/beds/" + bedId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Now room can be safely deleted
        mockMvc.perform(delete("/api/rooms/" + roomId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Administrator complete hospital structure provisioning via /api/hospitals/structure")
    void testAdministratorCompleteHospitalStructureProvisioning() throws Exception {
        HospitalRequest hosp = new HospitalRequest();
        hosp.setHospitalCode("HOSP-MAX-01");
        hosp.setName("Max Super Specialty Hospital");
        hosp.setLicenseNumber("LIC-MAX-2026-777");
        hosp.setAddressLine1("1 Press Enclave Road");
        hosp.setCity("New Delhi");
        hosp.setState("Delhi");
        hosp.setPostalCode("110017");

        HospitalStructureRequest structReq = new HospitalStructureRequest();
        structReq.setHospital(hosp);

        HospitalStructureRequest.BuildingItemRequest bld = new HospitalStructureRequest.BuildingItemRequest();
        bld.setBuildingCode("BLD-NORTH");
        bld.setName("North Tower Oncology");
        bld.setTotalFloors(4);

        HospitalStructureRequest.FloorItemRequest flr = new HospitalStructureRequest.FloorItemRequest();
        flr.setFloorNumber(1);
        flr.setFloorCode("FLR-01");
        flr.setFloorName("Oncology Day Care");

        HospitalStructureRequest.WardItemRequest wrd = new HospitalStructureRequest.WardItemRequest();
        wrd.setWardCode("WRD-ONCO-01");
        wrd.setName("Chemotherapy Infusion Suite");
        wrd.setWardType(WardType.GENERAL_WARD);

        HospitalStructureRequest.RoomItemRequest rm = new HospitalStructureRequest.RoomItemRequest();
        rm.setRoomNumber("ONCO-101");
        rm.setRoomType(RoomType.PATIENT_ROOM);
        rm.setQrCodeIdentifier("QR-ONCO-101-MAX");
        rm.setAirflowType(AirflowType.POSITIVE_PRESSURE);

        HospitalStructureRequest.BedItemRequest bed1 = new HospitalStructureRequest.BedItemRequest();
        bed1.setBedNumber("BED-ONCO-101-1");
        bed1.setQrCodeIdentifier("QR-BED-ONCO1-MAX");
        bed1.setBedType(BedType.STANDARD_INPATIENT);

        rm.setBeds(Collections.singletonList(bed1));
        wrd.setRooms(Collections.singletonList(rm));
        flr.setWards(Collections.singletonList(wrd));
        bld.setFloors(Collections.singletonList(flr));
        structReq.setBuildings(Collections.singletonList(bld));

        // Execute Administrator Provisioning
        MvcResult result = mockMvc.perform(post("/api/hospitals/structure")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(structReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.hospital.hospitalCode").value("HOSP-MAX-01"))
                .andExpect(jsonPath("$.data.buildings[0].building.buildingCode").value("BLD-NORTH"))
                .andExpect(jsonPath("$.data.buildings[0].floors[0].floor.floorNumber").value(1))
                .andExpect(jsonPath("$.data.buildings[0].floors[0].wards[0].ward.wardCode").value("WRD-ONCO-01"))
                .andExpect(jsonPath("$.data.buildings[0].floors[0].wards[0].rooms[0].room.roomNumber").value("ONCO-101"))
                .andExpect(jsonPath("$.data.buildings[0].floors[0].wards[0].rooms[0].beds[0].bedNumber").value("BED-ONCO-101-1"))
                .andReturn();

        Integer hospitalId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("hospital").path("hospitalId").asInt();

        // Verify Full Structure Tree API
        mockMvc.perform(get("/api/hospitals/" + hospitalId + "/tree")
                        .header("Authorization", "Bearer " + cleanerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hospital.hospitalCode").value("HOSP-MAX-01"))
                .andExpect(jsonPath("$.data.buildings[0].floors[0].wards[0].rooms[0].beds").isArray());
    }

    @Test
    @DisplayName("Role authorization: Non-admin cannot create hospital or building (403 Forbidden)")
    void testNonAdminCannotCreateHospital() throws Exception {
        HospitalRequest hospReq = new HospitalRequest();
        hospReq.setHospitalCode("HOSP-FORBID-01");
        hospReq.setName("Unauthorized Hospital Attempt");
        hospReq.setLicenseNumber("LIC-FORBID-01");
        hospReq.setAddressLine1("Street 1");
        hospReq.setCity("Delhi");
        hospReq.setState("Delhi");
        hospReq.setPostalCode("110001");

        mockMvc.perform(post("/api/hospitals")
                        .header("Authorization", "Bearer " + cleanerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(hospReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
