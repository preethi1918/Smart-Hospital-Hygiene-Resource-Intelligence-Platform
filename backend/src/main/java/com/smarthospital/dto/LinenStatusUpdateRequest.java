package com.smarthospital.dto;

import com.smarthospital.model.enums.LinenStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class LinenStatusUpdateRequest {

    @NotNull(message = "Status is required (CLEAN, IN_USE, DUE_FOR_CHANGE, IN_LAUNDRY, DAMAGED, RETIRED)")
    private LinenStatus status;

    @Size(max = 150, message = "New location cannot exceed 150 characters")
    private String newLocation;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    public LinenStatusUpdateRequest() {}

    public LinenStatus getStatus() { return status; }
    public void setStatus(LinenStatus status) { this.status = status; }

    public String getNewLocation() { return newLocation; }
    public void setNewLocation(String newLocation) { this.newLocation = newLocation; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
