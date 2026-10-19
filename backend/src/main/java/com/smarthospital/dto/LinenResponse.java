package com.smarthospital.dto;

import com.smarthospital.model.enums.DamageStatus;
import com.smarthospital.model.enums.LinenStatus;
import com.smarthospital.model.enums.LinenType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class LinenResponse {

    private Long linenId;
    private String linenCode;
    private LinenType linenType;
    private LinenStatus status;
    private String currentLocation;
    private Long assignedBedId;
    private String assignedBedNumber;
    private Long assignedRoomId;
    private String assignedRoomNumber;
    private Integer assignedWardId;
    private String assignedWardName;
    private LocalDate lastWashedDate;
    private Integer washCycleCount;
    private Integer maxWashCycles;
    private LocalDate issueDate;
    private DamageStatus damageStatus;
    private String damageNotes;
    private long historyCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LinenResponse() {}

    public Long getLinenId() { return linenId; }
    public void setLinenId(Long linenId) { this.linenId = linenId; }

    public String getLinenCode() { return linenCode; }
    public void setLinenCode(String linenCode) { this.linenCode = linenCode; }

    public LinenType getLinenType() { return linenType; }
    public void setLinenType(LinenType linenType) { this.linenType = linenType; }

    public LinenStatus getStatus() { return status; }
    public void setStatus(LinenStatus status) { this.status = status; }

    public String getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(String currentLocation) { this.currentLocation = currentLocation; }

    public Long getAssignedBedId() { return assignedBedId; }
    public void setAssignedBedId(Long assignedBedId) { this.assignedBedId = assignedBedId; }

    public String getAssignedBedNumber() { return assignedBedNumber; }
    public void setAssignedBedNumber(String assignedBedNumber) { this.assignedBedNumber = assignedBedNumber; }

    public Long getAssignedRoomId() { return assignedRoomId; }
    public void setAssignedRoomId(Long assignedRoomId) { this.assignedRoomId = assignedRoomId; }

    public String getAssignedRoomNumber() { return assignedRoomNumber; }
    public void setAssignedRoomNumber(String assignedRoomNumber) { this.assignedRoomNumber = assignedRoomNumber; }

    public Integer getAssignedWardId() { return assignedWardId; }
    public void setAssignedWardId(Integer assignedWardId) { this.assignedWardId = assignedWardId; }

    public String getAssignedWardName() { return assignedWardName; }
    public void setAssignedWardName(String assignedWardName) { this.assignedWardName = assignedWardName; }

    public LocalDate getLastWashedDate() { return lastWashedDate; }
    public void setLastWashedDate(LocalDate lastWashedDate) { this.lastWashedDate = lastWashedDate; }

    public Integer getWashCycleCount() { return washCycleCount; }
    public void setWashCycleCount(Integer washCycleCount) { this.washCycleCount = washCycleCount; }

    public Integer getMaxWashCycles() { return maxWashCycles; }
    public void setMaxWashCycles(Integer maxWashCycles) { this.maxWashCycles = maxWashCycles; }

    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }

    public DamageStatus getDamageStatus() { return damageStatus; }
    public void setDamageStatus(DamageStatus damageStatus) { this.damageStatus = damageStatus; }

    public String getDamageNotes() { return damageNotes; }
    public void setDamageNotes(String damageNotes) { this.damageNotes = damageNotes; }

    public long getHistoryCount() { return historyCount; }
    public void setHistoryCount(long historyCount) { this.historyCount = historyCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
