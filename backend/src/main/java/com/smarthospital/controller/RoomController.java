package com.smarthospital.controller;

import com.smarthospital.dto.ApiResponse;
import com.smarthospital.dto.RoomRequest;
import com.smarthospital.dto.RoomResponse;
import com.smarthospital.model.enums.AirflowType;
import com.smarthospital.model.enums.ReadinessStatus;
import com.smarthospital.model.enums.RoomType;
import com.smarthospital.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<RoomResponse>> create(@Valid @RequestBody RoomRequest request) {
        RoomResponse response = roomService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Room created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getAll(
            @RequestParam(required = false) Integer wardId,
            @RequestParam(required = false) ReadinessStatus readinessStatus,
            @RequestParam(required = false) RoomType roomType,
            @RequestParam(required = false) AirflowType airflowType,
            @RequestParam(required = false) String keyword) {
        List<RoomResponse> list = roomService.getAll(wardId, readinessStatus, roomType, airflowType, keyword);
        return ResponseEntity.ok(ApiResponse.success("Rooms retrieved successfully", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<RoomResponse>> getById(@PathVariable Long id) {
        RoomResponse response = roomService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Room retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<RoomResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody RoomRequest request) {
        RoomResponse response = roomService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Room updated successfully", response));
    }

    @PatchMapping("/{id}/readiness-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF')")
    public ResponseEntity<ApiResponse<RoomResponse>> updateReadinessStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String statusStr = payload.get("readinessStatus");
        if (statusStr == null) {
            statusStr = payload.get("status");
        }
        ReadinessStatus status = ReadinessStatus.valueOf(statusStr.trim().toUpperCase());
        RoomResponse response = roomService.updateReadinessStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Room readiness status updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        roomService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Room deleted successfully", null));
    }
}
