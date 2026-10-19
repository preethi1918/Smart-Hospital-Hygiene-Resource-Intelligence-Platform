package com.smarthospital.dto;

import jakarta.validation.constraints.NotBlank;

public class QrActionRequest {

    @NotBlank(message = "QR code identifier is required")
    private String qrCodeIdentifier;

    @NotBlank(message = "Action is required")
    private String action; // CLEAN_BED, CHANGE_LINEN, REPORT_ISSUE, COMPLETE_ROOM_CLEANING, START_DISINFECTION, SEND_TO_LAUNDRY, MARK_LINEN_CHANGED, RECORD_WASH

    private String notes;

    private String targetStatus;

    private Long relatedResourceId; // e.g. linenId when assigning to bed, or bedId

    public QrActionRequest() {}

    public QrActionRequest(String qrCodeIdentifier, String action, String notes, String targetStatus, Long relatedResourceId) {
        this.qrCodeIdentifier = qrCodeIdentifier;
        this.action = action;
        this.notes = notes;
        this.targetStatus = targetStatus;
        this.relatedResourceId = relatedResourceId;
    }

    public String getQrCodeIdentifier() { return qrCodeIdentifier; }
    public void setQrCodeIdentifier(String qrCodeIdentifier) { this.qrCodeIdentifier = qrCodeIdentifier; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getTargetStatus() { return targetStatus; }
    public void setTargetStatus(String targetStatus) { this.targetStatus = targetStatus; }

    public Long getRelatedResourceId() { return relatedResourceId; }
    public void setRelatedResourceId(Long relatedResourceId) { this.relatedResourceId = relatedResourceId; }
}
