package com.smarthospital.controller;

import com.smarthospital.dto.*;
import com.smarthospital.service.HospitalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final HospitalService hospitalService;

    public HospitalController(HospitalService hospitalService) {
        this.hospitalService = hospitalService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<HospitalResponse>> create(@Valid @RequestBody HospitalRequest request) {
        HospitalResponse response = hospitalService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Hospital created successfully", response));
    }

    @PostMapping("/structure")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HospitalStructureResponse>> createCompleteStructure(
            @Valid @RequestBody HospitalStructureRequest request) {
        HospitalStructureResponse response = hospitalService.createCompleteStructure(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Complete hospital structure provisioned successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<HospitalResponse>>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String status) {
        List<HospitalResponse> list = hospitalService.getAll(keyword, city, status);
        return ResponseEntity.ok(ApiResponse.success("Hospitals retrieved successfully", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<HospitalResponse>> getById(@PathVariable Integer id) {
        HospitalResponse response = hospitalService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Hospital retrieved successfully", response));
    }

    @GetMapping("/{id}/tree")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<HospitalStructureResponse>> getHospitalTree(@PathVariable Integer id) {
        HospitalStructureResponse response = hospitalService.getHospitalTree(id);
        return ResponseEntity.ok(ApiResponse.success("Hospital structure tree retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<HospitalResponse>> update(
            @PathVariable Integer id,
            @Valid @RequestBody HospitalRequest request) {
        HospitalResponse response = hospitalService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Hospital updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<HospitalResponse>> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody StatusUpdateRequest request) {
        HospitalResponse response = hospitalService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Hospital status updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
        hospitalService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Hospital deleted successfully", null));
    }
}
