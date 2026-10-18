package com.smarthospital.controller;

import com.smarthospital.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/operations")
public class HospitalOperationsController {

    // -------------------------------------------------------------------------
    // ADMIN Operations (Full Access)
    // -------------------------------------------------------------------------
    @GetMapping("/admin/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminOverview() {
        return ResponseEntity.ok(ApiResponse.success(
                "Admin overview access granted",
                Collections.singletonMap("module", "System Administration & Hospital Master Governance")
        ));
    }

    // -------------------------------------------------------------------------
    // CLEANING_STAFF: Cleaning and Linen Operations
    // -------------------------------------------------------------------------
    @GetMapping("/cleaning/tasks")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCleaningTasks() {
        return ResponseEntity.ok(ApiResponse.success(
                "Cleaning tasks retrieved successfully",
                Collections.singletonMap("activeCleaningTasksCount", 12)
        ));
    }

    @PostMapping("/cleaning/log")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> performCleaningLog(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cleaning log recorded successfully by cleaning personnel",
                Collections.singletonMap("logStatus", "RECORDED")
        ));
    }

    @PostMapping("/linen/dispatch")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dispatchLinen(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(
                "Linen dispatch processed successfully",
                Collections.singletonMap("dispatchStatus", "DISPATCHED")
        ));
    }

    // -------------------------------------------------------------------------
    // MAINTENANCE_STAFF: Equipment and Maintenance Operations
    // -------------------------------------------------------------------------
    @GetMapping("/equipment/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'MAINTENANCE_STAFF', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEquipmentStatus() {
        return ResponseEntity.ok(ApiResponse.success(
                "Equipment status retrieved successfully",
                Collections.singletonMap("operationalEquipmentCount", 45)
        ));
    }

    @PostMapping("/maintenance/schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE_STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> scheduleMaintenance(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(
                "Equipment maintenance scheduled successfully",
                Collections.singletonMap("maintenanceStatus", "SCHEDULED")
        ));
    }

    // -------------------------------------------------------------------------
    // STORE_MANAGER: Inventory Operations
    // -------------------------------------------------------------------------
    @GetMapping("/inventory/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInventoryStock() {
        return ResponseEntity.ok(ApiResponse.success(
                "Inventory stock level retrieved successfully",
                Collections.singletonMap("totalItemsInStock", 240)
        ));
    }

    @PostMapping("/inventory/restock")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> restockInventory(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(
                "Inventory restock executed successfully",
                Collections.singletonMap("restockStatus", "COMPLETED")
        ));
    }

    // -------------------------------------------------------------------------
    // AUDITOR: Read-Only Audit & Operational Logs
    // -------------------------------------------------------------------------
    @GetMapping("/audit/logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuditLogs() {
        return ResponseEntity.ok(ApiResponse.success(
                "Audit logs retrieved successfully for inspection",
                Collections.singletonMap("auditEntriesCount", 88)
        ));
    }

    // -------------------------------------------------------------------------
    // HOSPITAL_MANAGER: Hospital Governance & Management
    // -------------------------------------------------------------------------
    @GetMapping("/manager/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getManagerDashboard() {
        return ResponseEntity.ok(ApiResponse.success(
                "Hospital Manager dashboard retrieved successfully",
                Collections.singletonMap("hospitalWardOccupancyRate", "84.5%")
        ));
    }
}
