package com.smarthospital.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class FloorRequest {

    @NotNull(message = "Building ID is required")
    private Integer buildingId;

    @NotNull(message = "Floor number is required")
    private Integer floorNumber;

    @NotBlank(message = "Floor code is required")
    @Size(max = 50, message = "Floor code cannot exceed 50 characters")
    private String floorCode;

    @NotBlank(message = "Floor name is required")
    @Size(max = 100, message = "Floor name cannot exceed 100 characters")
    private String floorName;

    @Size(max = 20, message = "Status cannot exceed 20 characters")
    private String status = "ACTIVE";

    public FloorRequest() {}

    public Integer getBuildingId() { return buildingId; }
    public void setBuildingId(Integer buildingId) { this.buildingId = buildingId; }

    public Integer getFloorNumber() { return floorNumber; }
    public void setFloorNumber(Integer floorNumber) { this.floorNumber = floorNumber; }

    public String getFloorCode() { return floorCode; }
    public void setFloorCode(String floorCode) { this.floorCode = floorCode; }

    public String getFloorName() { return floorName; }
    public void setFloorName(String floorName) { this.floorName = floorName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
