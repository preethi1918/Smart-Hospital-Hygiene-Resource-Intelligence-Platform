package com.smarthospital.dto;

import jakarta.validation.constraints.NotBlank;

public class CompleteTaskQrRequest {

    @NotBlank(message = "QR code identifier is required")
    private String qrCode;

    private Long taskId; // optional target task ID

    private String notes;

    private String disinfectantUsed;

    private String cleaningMethod;

    public CompleteTaskQrRequest() {}

    public CompleteTaskQrRequest(String qrCode, String notes) {
        this.qrCode = qrCode;
        this.notes = notes;
    }

    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getDisinfectantUsed() { return disinfectantUsed; }
    public void setDisinfectantUsed(String disinfectantUsed) { this.disinfectantUsed = disinfectantUsed; }

    public String getCleaningMethod() { return cleaningMethod; }
    public void setCleaningMethod(String cleaningMethod) { this.cleaningMethod = cleaningMethod; }
}
