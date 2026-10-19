package com.smarthospital.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class QrGenerateRequest {

    @NotBlank(message = "Resource type is required (ROOM, BED, LINEN, EQUIPMENT, WASTE_BIN)")
    private String resourceType;

    @NotNull(message = "Resource ID is required")
    private Long resourceId;

    private String qrCodeIdentifier; // Optional custom code; if null, auto-generated based on prefix

    private String reason;

    public QrGenerateRequest() {}

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public Long getResourceId() { return resourceId; }
    public void setResourceId(Long resourceId) { this.resourceId = resourceId; }

    public String getQrCodeIdentifier() { return qrCodeIdentifier; }
    public void setQrCodeIdentifier(String qrCodeIdentifier) { this.qrCodeIdentifier = qrCodeIdentifier; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
