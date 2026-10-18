package com.smarthospital.controller;

import com.smarthospital.dto.ApiResponse;
import com.smarthospital.service.DatabaseHealthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final DatabaseHealthService databaseHealthService;

    @Autowired
    public HealthController(DatabaseHealthService databaseHealthService) {
        this.databaseHealthService = databaseHealthService;
    }

    /**
     * Standard Health Check Endpoint.
     * Expected Response: { "status": "UP" }
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> checkHealth() {
        return ResponseEntity.ok(Collections.singletonMap("status", "UP"));
    }

    /**
     * Diagnostic Database & Environment Connectivity Endpoint.
     */
    @GetMapping("/health/details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealthDetails() {
        Map<String, Object> details = databaseHealthService.getDatabaseDetails();
        return ResponseEntity.ok(ApiResponse.success("Database and platform telemetry status", details));
    }
}
