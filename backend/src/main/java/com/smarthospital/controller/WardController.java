package com.smarthospital.controller;

import com.smarthospital.dto.ApiResponse;
import com.smarthospital.dto.StatusUpdateRequest;
import com.smarthospital.dto.WardRequest;
import com.smarthospital.dto.WardResponse;
import com.smarthospital.model.enums.WardType;
import com.smarthospital.service.WardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wards")
public class WardController {

    private final WardService wardService;

    public WardController(WardService wardService) {
        this.wardService = wardService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<WardResponse>> create(@Valid @RequestBody WardRequest request) {
        WardResponse response = wardService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Ward created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<WardResponse>>> getAll(
            @RequestParam(required = false) Integer floorId,
            @RequestParam(required = false) WardType wardType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        List<WardResponse> list = wardService.getAll(floorId, wardType, status, keyword);
        return ResponseEntity.ok(ApiResponse.success("Wards retrieved successfully", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<WardResponse>> getById(@PathVariable Integer id) {
        WardResponse response = wardService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Ward retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<WardResponse>> update(
            @PathVariable Integer id,
            @Valid @RequestBody WardRequest request) {
        WardResponse response = wardService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Ward updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<WardResponse>> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody StatusUpdateRequest request) {
        WardResponse response = wardService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Ward status updated successfully", response));
    }

    @PatchMapping("/{id}/hygiene-score")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<WardResponse>> updateHygieneScore(
            @PathVariable Integer id,
            @RequestBody Map<String, BigDecimal> payload) {
        BigDecimal score = payload.get("currentHygieneScore");
        if (score == null) {
            score = payload.get("score");
        }
        WardResponse response = wardService.updateHygieneScore(id, score);
        return ResponseEntity.ok(ApiResponse.success("Ward hygiene score updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
        wardService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Ward deleted successfully", null));
    }
}
