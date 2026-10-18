package com.smarthospital.controller;

import com.smarthospital.dto.ApiResponse;
import com.smarthospital.dto.FloorRequest;
import com.smarthospital.dto.FloorResponse;
import com.smarthospital.dto.StatusUpdateRequest;
import com.smarthospital.service.FloorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/floors")
public class FloorController {

    private final FloorService floorService;

    public FloorController(FloorService floorService) {
        this.floorService = floorService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<FloorResponse>> create(@Valid @RequestBody FloorRequest request) {
        FloorResponse response = floorService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Floor created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<FloorResponse>>> getAll(
            @RequestParam(required = false) Integer buildingId,
            @RequestParam(required = false) String status) {
        List<FloorResponse> list = floorService.getAll(buildingId, status);
        return ResponseEntity.ok(ApiResponse.success("Floors retrieved successfully", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<FloorResponse>> getById(@PathVariable Integer id) {
        FloorResponse response = floorService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Floor retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<FloorResponse>> update(
            @PathVariable Integer id,
            @Valid @RequestBody FloorRequest request) {
        FloorResponse response = floorService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Floor updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<FloorResponse>> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody StatusUpdateRequest request) {
        FloorResponse response = floorService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Floor status updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
        floorService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Floor deleted successfully", null));
    }
}
