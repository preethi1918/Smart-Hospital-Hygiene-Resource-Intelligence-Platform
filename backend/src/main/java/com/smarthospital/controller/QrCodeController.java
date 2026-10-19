package com.smarthospital.controller;

import com.smarthospital.dto.ApiResponse;
import com.smarthospital.dto.QrGenerateRequest;
import com.smarthospital.dto.QrRegenerateRequest;
import com.smarthospital.dto.QrResourceResponse;
import com.smarthospital.service.QrCodeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/qr")
public class QrCodeController {

    private final QrCodeService qrCodeService;

    public QrCodeController(QrCodeService qrCodeService) {
        this.qrCodeService = qrCodeService;
    }

    @GetMapping("/resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<QrResourceResponse>>> getResources(
            @RequestParam(required = false, defaultValue = "ALL") String type,
            @RequestParam(required = false) String search) {
        List<QrResourceResponse> resources = qrCodeService.getAllResources(type, search);
        return ResponseEntity.ok(ApiResponse.success("Hospital QR resources retrieved successfully", resources));
    }

    @GetMapping("/lookup/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER', 'CLEANING_STAFF', 'MAINTENANCE_STAFF', 'STORE_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<QrResourceResponse>> lookup(@PathVariable String code) {
        QrResourceResponse resource = qrCodeService.lookupByQrCode(code);
        return ResponseEntity.ok(ApiResponse.success("Resource successfully identified via QR code", resource));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<QrResourceResponse>> generate(@Valid @RequestBody QrGenerateRequest request) {
        QrResourceResponse response = qrCodeService.generateQrCode(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Resource QR identifier generated successfully", response));
    }

    @PutMapping("/regenerate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_MANAGER')")
    public ResponseEntity<ApiResponse<QrResourceResponse>> regenerate(@Valid @RequestBody QrRegenerateRequest request) {
        QrResourceResponse response = qrCodeService.regenerateQrCode(request);
        return ResponseEntity.ok(ApiResponse.success("Resource QR identifier regenerated successfully", response));
    }
}
