package com.smarthospital.controller;

import com.smarthospital.dto.*;
import com.smarthospital.model.enums.DamageStatus;
import com.smarthospital.model.enums.LinenStatus;
import com.smarthospital.model.enums.LinenType;
import com.smarthospital.service.LinenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/linen")
public class LinenController {

    private final LinenService linenService;

    public LinenController(LinenService linenService) {
        this.linenService = linenService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<LinenResponse>> create(@Valid @RequestBody LinenRequest request) {
        LinenResponse response = linenService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Linen item registered successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<LinenResponse>>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) LinenType linenType,
            @RequestParam(required = false) LinenStatus status,
            @RequestParam(required = false) DamageStatus damageStatus,
            @RequestParam(required = false) Long bedId) {
        List<LinenResponse> list = linenService.getAll(keyword, linenType, status, damageStatus, bedId);
        return ResponseEntity.ok(ApiResponse.success("Linen items retrieved successfully", list));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<LinenStatsResponse>> getStats() {
        LinenStatsResponse stats = linenService.getStats();
        return ResponseEntity.ok(ApiResponse.success("Linen analytics statistics retrieved successfully", stats));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<LinenResponse>> getById(@PathVariable Long id) {
        LinenResponse response = linenService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Linen item retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<LinenResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody LinenRequest request) {
        LinenResponse response = linenService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Linen item updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<LinenResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody LinenStatusUpdateRequest request) {
        LinenResponse response = linenService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Linen status transitioned successfully", response));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<LinenResponse>> assignBed(
            @PathVariable Long id,
            @Valid @RequestBody LinenAssignRequest request) {
        LinenResponse response = linenService.assignBed(id, request);
        return ResponseEntity.ok(ApiResponse.success("Linen bed assignment updated successfully", response));
    }

    @PatchMapping("/{id}/wash")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<LinenResponse>> completeWash(
            @PathVariable Long id,
            @Valid @RequestBody LinenWashRequest request) {
        LinenResponse response = linenService.completeWash(id, request);
        return ResponseEntity.ok(ApiResponse.success("Linen wash cycle recorded successfully", response));
    }

    @PatchMapping("/{id}/damage")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<LinenResponse>> reportDamage(
            @PathVariable Long id,
            @Valid @RequestBody LinenDamageRequest request) {
        LinenResponse response = linenService.reportDamage(id, request);
        return ResponseEntity.ok(ApiResponse.success("Linen damage report recorded successfully", response));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<LinenHistoryResponse>>> getHistory(@PathVariable Long id) {
        List<LinenHistoryResponse> history = linenService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Linen lifecycle history retrieved successfully", history));
    }

    @PostMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<LinenHistoryResponse>> addHistoryNote(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String note = payload.get("note");
        String performedBy = payload.get("performedBy");
        LinenHistoryResponse history = linenService.addHistoryNote(id, note, performedBy);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("History note logged successfully", history));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        linenService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Linen record deleted successfully", null));
    }
}
