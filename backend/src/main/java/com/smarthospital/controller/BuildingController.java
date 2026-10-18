package com.smarthospital.controller;

import com.smarthospital.dto.ApiResponse;
import com.smarthospital.dto.BuildingRequest;
import com.smarthospital.dto.BuildingResponse;
import com.smarthospital.dto.StatusUpdateRequest;
import com.smarthospital.service.BuildingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buildings")
public class BuildingController {

    private final BuildingService buildingService;

    public BuildingController(BuildingService buildingService) {
        this.buildingService = buildingService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<BuildingResponse>> create(@Valid @RequestBody BuildingRequest request) {
        BuildingResponse response = buildingService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Building created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<BuildingResponse>>> getAll(
            @RequestParam(required = false) Integer hospitalId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        List<BuildingResponse> list = buildingService.getAll(hospitalId, keyword, status);
        return ResponseEntity.ok(ApiResponse.success("Buildings retrieved successfully", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<BuildingResponse>> getById(@PathVariable Integer id) {
        BuildingResponse response = buildingService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Building retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<BuildingResponse>> update(
            @PathVariable Integer id,
            @Valid @RequestBody BuildingRequest request) {
        BuildingResponse response = buildingService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Building updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<BuildingResponse>> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody StatusUpdateRequest request) {
        BuildingResponse response = buildingService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Building status updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
        buildingService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Building deleted successfully", null));
    }
}
