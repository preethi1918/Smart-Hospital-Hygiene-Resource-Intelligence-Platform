package com.smarthospital.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class QrRegenerateRequest {

    @NotBlank(message = "Resource type is required (ROOM, BED, LINEN, EQUIPMENT, WASTE_BIN)")
    private String resourceType;

    @NotNull(message = "Resource ID is required")
    private Long resourceId;

    private String newQrCodeIdentifier; // Optional; if omitted, automatically generates refreshed sequence

    private String reason; // e.g. "Physical label damaged during autoclave cycle", "Lost barcode tag"

    public QrRegenerateRequest() {}

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public Long getResourceId() { return resourceId; }
    public void setResourceId(Long resourceId) { this.resourceId = resourceId; }

    public String getNewQrCodeIdentifier() { return newQrCodeIdentifier; }
    public void setNewQrCodeIdentifier(String newQrCodeIdentifier) { this.newQrCodeIdentifier = newQrCodeIdentifier; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
