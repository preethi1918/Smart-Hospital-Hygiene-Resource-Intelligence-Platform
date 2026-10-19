package com.smarthospital.dto;

import com.smarthospital.model.enums.LinenStatus;

import java.time.LocalDateTime;

public class LinenHistoryResponse {

    private Long historyId;
    private Long linenId;
    private String linenCode;
    private String action;
    private LinenStatus previousStatus;
    private LinenStatus newStatus;
    private String previousLocation;
    private String newLocation;
    private String assignedBedNumber;
    private Integer washCycleCountAtEvent;
    private String performedBy;
    private String notes;
    private LocalDateTime recordedAt;

    public LinenHistoryResponse() {}

    public Long getHistoryId() { return historyId; }
    public void setHistoryId(Long historyId) { this.historyId = historyId; }

    public Long getLinenId() { return linenId; }
    public void setLinenId(Long linenId) { this.linenId = linenId; }

    public String getLinenCode() { return linenCode; }
    public void setLinenCode(String linenCode) { this.linenCode = linenCode; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public LinenStatus getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(LinenStatus previousStatus) { this.previousStatus = previousStatus; }

    public LinenStatus getNewStatus() { return newStatus; }
    public void setNewStatus(LinenStatus newStatus) { this.newStatus = newStatus; }

    public String getPreviousLocation() { return previousLocation; }
    public void setPreviousLocation(String previousLocation) { this.previousLocation = previousLocation; }

    public String getNewLocation() { return newLocation; }
    public void setNewLocation(String newLocation) { this.newLocation = newLocation; }

    public String getAssignedBedNumber() { return assignedBedNumber; }
    public void setAssignedBedNumber(String assignedBedNumber) { this.assignedBedNumber = assignedBedNumber; }

    public Integer getWashCycleCountAtEvent() { return washCycleCountAtEvent; }
    public void setWashCycleCountAtEvent(Integer washCycleCountAtEvent) { this.washCycleCountAtEvent = washCycleCountAtEvent; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
}
