package com.smarthospital.controller;

import com.smarthospital.dto.*;
import com.smarthospital.model.enums.CleaningLocationType;
import com.smarthospital.model.enums.TaskStatus;
import com.smarthospital.service.CleaningService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cleaning")
public class CleaningController {

    private final CleaningService cleaningService;

    public CleaningController(CleaningService cleaningService) {
        this.cleaningService = cleaningService;
    }

    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<CleaningTaskResponse>>> getAllTasks(
            @RequestParam(required = false) CleaningLocationType locationType,
            @RequestParam(required = false) TaskStatus status) {
        List<CleaningTaskResponse> tasks = cleaningService.getAllTasks(locationType, status);
        return ResponseEntity.ok(ApiResponse.success("Cleaning tasks retrieved successfully", tasks));
    }

    @GetMapping("/tasks/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'AUDITOR')")
    public ResponseEntity<ApiResponse<CleaningTaskResponse>> getTaskById(@PathVariable Long id) {
        CleaningTaskResponse task = cleaningService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.success("Cleaning task retrieved successfully", task));
    }

    @PostMapping("/tasks")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<CleaningTaskResponse>> createTask(@Valid @RequestBody CleaningTaskRequest request) {
        CleaningTaskResponse task = cleaningService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Cleaning task scheduled successfully", task));
    }

    @PutMapping("/tasks/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<CleaningTaskResponse>> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody CleaningTaskRequest request) {
        CleaningTaskResponse task = cleaningService.updateTask(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cleaning task updated successfully", task));
    }

    @PostMapping("/tasks/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<CleaningTaskResponse>> startTask(@PathVariable Long id) {
        CleaningTaskResponse task = cleaningService.startTask(id);
        return ResponseEntity.ok(ApiResponse.success("Cleaning task marked IN_PROGRESS", task));
    }

    @PostMapping("/tasks/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<CleaningTaskResponse>> completeTask(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : null;
        String disinfectant = body != null ? body.get("disinfectantUsed") : null;
        String method = body != null ? body.get("cleaningMethod") : null;
        CleaningTaskResponse task = cleaningService.completeTask(id, notes, disinfectant, method);
        return ResponseEntity.ok(ApiResponse.success("Cleaning task marked COMPLETED and logged to audit trail", task));
    }

    @PostMapping("/tasks/complete-qr")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<CleaningTaskResponse>> completeTaskViaQr(
            @Valid @RequestBody CompleteTaskQrRequest request) {
        CleaningTaskResponse task = cleaningService.completeTaskViaQr(request);
        return ResponseEntity.ok(ApiResponse.success("Cleaning task successfully completed via QR workflow", task));
    }

    @PostMapping("/tasks/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<CleaningTaskResponse>> verifyTask(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        String notes = body != null && body.get("notes") != null ? body.get("notes").toString() : null;
        BigDecimal rating = null;
        if (body != null && body.get("score") != null) {
            try {
                rating = new BigDecimal(body.get("score").toString());
            } catch (Exception ignored) {}
        }
        CleaningTaskResponse task = cleaningService.verifyTask(id, notes, rating);
        return ResponseEntity.ok(ApiResponse.success("Cleaning task verified and quality certified", task));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<CleaningLogResponse>>> getCleaningHistory(
            @RequestParam(required = false) CleaningLocationType locationType,
            @RequestParam(required = false) String qrCode) {
        List<CleaningLogResponse> history = cleaningService.getCleaningHistory(locationType, qrCode);
        return ResponseEntity.ok(ApiResponse.success("Cleaning history audit logs retrieved successfully", history));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'AUDITOR')")
    public ResponseEntity<ApiResponse<CleaningStatsResponse>> getCleaningStats() {
        CleaningStatsResponse stats = cleaningService.getCleaningStats();
        return ResponseEntity.ok(ApiResponse.success("Cleaning & Hygiene metrics retrieved successfully", stats));
    }
}
