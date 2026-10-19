package com.smarthospital.dto;

import com.smarthospital.model.enums.DamageStatus;
import com.smarthospital.model.enums.LinenStatus;
import com.smarthospital.model.enums.LinenType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class LinenRequest {

    @NotBlank(message = "Linen tracking identifier / code is required")
    @Size(max = 100, message = "Linen code cannot exceed 100 characters")
    private String linenCode;

    @NotNull(message = "Linen type is required (e.g. BEDSHEET, PILLOW_COVER, BLANKET, PATIENT_GOWN, OTHER)")
    private LinenType linenType;

    private LinenStatus status = LinenStatus.CLEAN;

    @Size(max = 150, message = "Location cannot exceed 150 characters")
    private String currentLocation = "Central Linen Storage";

    private Long assignedBedId;

    private Integer assignedWardId;

    private LocalDate lastWashedDate;

    @Min(value = 0, message = "Wash cycle count cannot be negative")
    private Integer washCycleCount = 0;

    @Min(value = 1, message = "Max wash cycles must be at least 1")
    private Integer maxWashCycles = 60;

    private LocalDate issueDate;

    private DamageStatus damageStatus = DamageStatus.NONE;

    @Size(max = 500, message = "Damage notes cannot exceed 500 characters")
    private String damageNotes;

    public LinenRequest() {}

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

    public Integer getAssignedWardId() { return assignedWardId; }
    public void setAssignedWardId(Integer assignedWardId) { this.assignedWardId = assignedWardId; }

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
}
