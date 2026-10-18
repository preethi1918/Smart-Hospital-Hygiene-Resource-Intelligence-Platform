package com.smarthospital.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarthospital.dto.LoginRequest;
import com.smarthospital.dto.RegisterRequest;
import com.smarthospital.model.User;
import com.smarthospital.model.enums.RoleCode;
import com.smarthospital.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthenticationAndAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Helper method to register or obtain token
    private String registerAndGetToken(String employeeId, String email, String password, RoleCode roleCode) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                employeeId, email, password, "Test", "User", "General", roleCode, "+123456789"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String json = result.getResponse().getContentAsString();
        return objectMapper.readTree(json).path("data").path("token").asText();
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String json = result.getResponse().getContentAsString();
        return objectMapper.readTree(json).path("data").path("token").asText();
    }

    // -------------------------------------------------------------------------
    // 1. REGISTRATION TESTS
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Registration: Success with BCrypt hashed password (no plaintext)")
    void testRegisterSuccessAndPasswordHashed() throws Exception {
        String empId = "EMP-CLN-01";
        String email = "cleaner.one@hospital.org";
        String rawPassword = "CleanerPassword#2026";

        RegisterRequest request = new RegisterRequest(
                empId, email, rawPassword, "Jane", "Doe", "Hygiene Dept", RoleCode.CLEANING_STAFF, "12345"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.role").value("CLEANING_STAFF"))
                .andExpect(jsonPath("$.data.email").value(email));

        // CRITICAL CHECK: Verify password in database is NOT stored as plaintext
        User userInDb = userRepository.findByEmail(email).orElseThrow();
        assertNotEquals(rawPassword, userInDb.getPasswordHash(), "Password MUST NOT be stored in plaintext");
        assertTrue(userInDb.getPasswordHash().startsWith("$2a$") || userInDb.getPasswordHash().startsWith("$2b$"),
                "Password must be hashed with BCrypt");
        assertTrue(passwordEncoder.matches(rawPassword, userInDb.getPasswordHash()),
                "BCrypt encoder must verify against the stored hash");
    }

    @Test
    @DisplayName("Registration: Reject duplicate email")
    void testRegisterDuplicateEmailFails() throws Exception {
        String email = "duplicate.test@hospital.org";
        RegisterRequest first = new RegisterRequest("EMP-DUP-1", email, "pass1234", "A", "B", "Dept", RoleCode.CLEANING_STAFF, null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        RegisterRequest duplicate = new RegisterRequest("EMP-DUP-2", email, "pass1234", "C", "D", "Dept", RoleCode.STORE_MANAGER, null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @DisplayName("Registration: Reject duplicate employee ID")
    void testRegisterDuplicateEmployeeIdFails() throws Exception {
        String empId = "EMP-SAME-ID";
        RegisterRequest first = new RegisterRequest(empId, "user1@hospital.org", "pass1234", "A", "B", "Dept", RoleCode.MAINTENANCE_STAFF, null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        RegisterRequest duplicate = new RegisterRequest(empId, "user2@hospital.org", "pass1234", "C", "D", "Dept", RoleCode.STORE_MANAGER, null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    // -------------------------------------------------------------------------
    // 2. LOGIN TESTS
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Login: Success with valid credentials returning JWT")
    void testLoginSuccessReturnsJwt() throws Exception {
        String email = "login.test@hospital.org";
        String password = "ValidPassword@99";
        registerAndGetToken("EMP-LOGIN-01", email, password, RoleCode.STORE_MANAGER);

        LoginRequest loginRequest = new LoginRequest(email, password);
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.role").value("STORE_MANAGER"))
                .andExpect(jsonPath("$.data.email").value(email));
    }

    @Test
    @DisplayName("Login: Reject incorrect password with 401 Unauthorized")
    void testLoginBadPasswordFails() throws Exception {
        String email = "badpass.test@hospital.org";
        registerAndGetToken("EMP-BADPASS-01", email, "CorrectPassword1", RoleCode.MAINTENANCE_STAFF);

        LoginRequest badRequest = new LoginRequest(email, "WrongPasswordWrong");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    // -------------------------------------------------------------------------
    // 3. UNPROTECTED VS PROTECTED ENDPOINT ACCESS
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Security: Protected endpoint without JWT token returns 401 Unauthorized")
    void testProtectedEndpointWithoutTokenFails() throws Exception {
        mockMvc.perform(get("/api/operations/cleaning/tasks")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Security: Public health endpoint works without token")
    void testHealthEndpointPublic() throws Exception {
        mockMvc.perform(get("/api/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    // -------------------------------------------------------------------------
    // 4. ROLE-BASED AUTHORIZATION: CLEANING_STAFF
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Authorization: CLEANING_STAFF can access cleaning/linen, forbidden from maintenance")
    void testCleaningStaffPermissions() throws Exception {
        String token = registerAndGetToken("EMP-CLN-ROLE", "cln.role@hospital.org", "Pass12345", RoleCode.CLEANING_STAFF);

        // Allowed: GET cleaning tasks
        mockMvc.perform(get("/api/operations/cleaning/tasks")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Allowed: POST cleaning log
        mockMvc.perform(post("/api/operations/cleaning/log")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.logStatus").value("RECORDED"));

        // Allowed: POST linen dispatch
        mockMvc.perform(post("/api/operations/linen/dispatch")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.dispatchStatus").value("DISPATCHED"));

        // Forbidden: Maintenance schedule (403)
        mockMvc.perform(post("/api/operations/maintenance/schedule")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        // Forbidden: Admin overview (403)
        mockMvc.perform(get("/api/operations/admin/overview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    // -------------------------------------------------------------------------
    // 5. ROLE-BASED AUTHORIZATION: MAINTENANCE_STAFF
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Authorization: MAINTENANCE_STAFF can access equipment/maintenance, forbidden from inventory")
    void testMaintenanceStaffPermissions() throws Exception {
        String token = registerAndGetToken("EMP-MNT-ROLE", "mnt.role@hospital.org", "Pass12345", RoleCode.MAINTENANCE_STAFF);

        // Allowed: Equipment status
        mockMvc.perform(get("/api/operations/equipment/status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.operationalEquipmentCount").exists());

        // Allowed: Maintenance schedule
        mockMvc.perform(post("/api/operations/maintenance/schedule")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.maintenanceStatus").value("SCHEDULED"));

        // Forbidden: Cleaning log (403)
        mockMvc.perform(post("/api/operations/cleaning/log")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        // Forbidden: Inventory restock (403)
        mockMvc.perform(post("/api/operations/inventory/restock")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    // -------------------------------------------------------------------------
    // 6. ROLE-BASED AUTHORIZATION: STORE_MANAGER
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Authorization: STORE_MANAGER can access inventory, forbidden from cleaning operations")
    void testStoreManagerPermissions() throws Exception {
        String token = registerAndGetToken("EMP-STR-ROLE", "str.role@hospital.org", "Pass12345", RoleCode.STORE_MANAGER);

        // Allowed: Inventory stock
        mockMvc.perform(get("/api/operations/inventory/stock")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItemsInStock").exists());

        // Allowed: Inventory restock
        mockMvc.perform(post("/api/operations/inventory/restock")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.restockStatus").value("COMPLETED"));

        // Forbidden: Cleaning log (403)
        mockMvc.perform(post("/api/operations/cleaning/log")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    // -------------------------------------------------------------------------
    // 7. ROLE-BASED AUTHORIZATION: AUDITOR (READ-ONLY ACCESS)
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Authorization: AUDITOR has read-only access across operations, forbidden from write modifications")
    void testAuditorReadOnlyPermissions() throws Exception {
        String token = registerAndGetToken("EMP-AUD-ROLE", "aud.role@hospital.org", "Pass12345", RoleCode.AUDITOR);

        // Allowed READ: Cleaning tasks
        mockMvc.perform(get("/api/operations/cleaning/tasks")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Allowed READ: Equipment status
        mockMvc.perform(get("/api/operations/equipment/status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Allowed READ: Inventory stock
        mockMvc.perform(get("/api/operations/inventory/stock")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Allowed READ: Audit logs
        mockMvc.perform(get("/api/operations/audit/logs")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // FORBIDDEN WRITE: Cleaning log (403)
        mockMvc.perform(post("/api/operations/cleaning/log")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        // FORBIDDEN WRITE: Maintenance schedule (403)
        mockMvc.perform(post("/api/operations/maintenance/schedule")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        // FORBIDDEN WRITE: Inventory restock (403)
        mockMvc.perform(post("/api/operations/inventory/restock")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    // -------------------------------------------------------------------------
    // 8. ROLE-BASED AUTHORIZATION: ADMIN (FULL ACCESS)
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Authorization: ADMIN has full access across all operations")
    void testAdminFullAccessPermissions() throws Exception {
        String token = registerAndGetToken("EMP-ADM-FULL", "adm.full@hospital.org", "Pass12345", RoleCode.ADMIN);

        // Admin overview
        mockMvc.perform(get("/api/operations/admin/overview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Cleaning operations
        mockMvc.perform(post("/api/operations/cleaning/log")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());

        // Maintenance operations
        mockMvc.perform(post("/api/operations/maintenance/schedule")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());

        // Inventory operations
        mockMvc.perform(post("/api/operations/inventory/restock")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());

        // Audit logs
        mockMvc.perform(get("/api/operations/audit/logs")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
