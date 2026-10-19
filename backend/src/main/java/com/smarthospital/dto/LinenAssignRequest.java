package com.smarthospital.dto;

import jakarta.validation.constraints.Size;

public class LinenAssignRequest {

    private Long bedId;

    @Size(max = 150, message = "Location cannot exceed 150 characters")
    private String location;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    public LinenAssignRequest() {}

    public Long getBedId() { return bedId; }
    public void setBedId(Long bedId) { this.bedId = bedId; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
