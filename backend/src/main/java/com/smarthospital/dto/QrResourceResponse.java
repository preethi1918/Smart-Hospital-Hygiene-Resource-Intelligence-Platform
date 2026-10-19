package com.smarthospital.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class QrResourceResponse {

    private String resourceType; // ROOM, BED, LINEN, EQUIPMENT, WASTE_BIN
    private Long resourceId;
    private String qrCodeIdentifier; // e.g. BED-204, LINEN-1024, ROOM-204, EQUIP-501, BIN-ICU-01
    private String resourceName;
    private String location;
    private String wardName;
    private String status;
    private String subType;
    private String lastActivityDate;
    private Map<String, Object> details;
    private LocalDateTime updatedAt;

    public QrResourceResponse() {}

    public QrResourceResponse(String resourceType, Long resourceId, String qrCodeIdentifier,
                              String resourceName, String location, String wardName,
                              String status, String subType, String lastActivityDate,
                              Map<String, Object> details, LocalDateTime updatedAt) {
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.qrCodeIdentifier = qrCodeIdentifier;
        this.resourceName = resourceName;
        this.location = location;
        this.wardName = wardName;
        this.status = status;
        this.subType = subType;
        this.lastActivityDate = lastActivityDate;
        this.details = details;
        this.updatedAt = updatedAt;
    }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public Long getResourceId() { return resourceId; }
    public void setResourceId(Long resourceId) { this.resourceId = resourceId; }

    public String getQrCodeIdentifier() { return qrCodeIdentifier; }
    public void setQrCodeIdentifier(String qrCodeIdentifier) { this.qrCodeIdentifier = qrCodeIdentifier; }

    public String getResourceName() { return resourceName; }
    public void setResourceName(String resourceName) { this.resourceName = resourceName; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getWardName() { return wardName; }
    public void setWardName(String wardName) { this.wardName = wardName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSubType() { return subType; }
    public void setSubType(String subType) { this.subType = subType; }

    public String getLastActivityDate() { return lastActivityDate; }
    public void setLastActivityDate(String lastActivityDate) { this.lastActivityDate = lastActivityDate; }

    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
