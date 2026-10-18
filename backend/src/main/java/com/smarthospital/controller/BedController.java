package com.smarthospital.controller;

import com.smarthospital.dto.ApiResponse;
import com.smarthospital.dto.BedRequest;
import com.smarthospital.dto.BedResponse;
import com.smarthospital.model.enums.BedType;
import com.smarthospital.model.enums.OperationalStatus;
import com.smarthospital.service.BedService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/beds")
public class BedController {

    private final BedService bedService;

    public BedController(BedService bedService) {
        this.bedService = bedService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<BedResponse>> create(@Valid @RequestBody BedRequest request) {
        BedResponse response = bedService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Bed created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<BedResponse>>> getAll(
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Integer wardId,
            @RequestParam(required = false) OperationalStatus operationalStatus,
            @RequestParam(required = false) BedType bedType,
            @RequestParam(required = false) String keyword) {
        List<BedResponse> list = bedService.getAll(roomId, wardId, operationalStatus, bedType, keyword);
        return ResponseEntity.ok(ApiResponse.success("Beds retrieved successfully", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<BedResponse>> getById(@PathVariable Long id) {
        BedResponse response = bedService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Bed retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<BedResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody BedRequest request) {
        BedResponse response = bedService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Bed updated successfully", response));
    }

    @PatchMapping("/{id}/operational-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<BedResponse>> updateOperationalStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String statusStr = payload.get("operationalStatus");
        if (statusStr == null) {
            statusStr = payload.get("status");
        }
        OperationalStatus status = OperationalStatus.valueOf(statusStr.trim().toUpperCase());
        BedResponse response = bedService.updateOperationalStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Bed operational status updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        bedService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Bed deleted successfully", null));
    }
}
