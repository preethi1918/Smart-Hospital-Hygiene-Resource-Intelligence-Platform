package com.smarthospital.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class BuildingRequest {

    @NotNull(message = "Hospital ID is required")
    private Integer hospitalId;

    @NotBlank(message = "Building code is required")
    @Size(max = 50, message = "Building code cannot exceed 50 characters")
    private String buildingCode;

    @NotBlank(message = "Building name is required")
    @Size(max = 150, message = "Building name cannot exceed 150 characters")
    private String name;

    @NotNull(message = "Total floors count is required")
    @Min(value = 1, message = "Building must have at least 1 floor")
    private Integer totalFloors = 1;

    @Size(max = 20, message = "Status cannot exceed 20 characters")
    private String status = "ACTIVE";

    public BuildingRequest() {}

    public Integer getHospitalId() { return hospitalId; }
    public void setHospitalId(Integer hospitalId) { this.hospitalId = hospitalId; }

    public String getBuildingCode() { return buildingCode; }
    public void setBuildingCode(String buildingCode) { this.buildingCode = buildingCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getTotalFloors() { return totalFloors; }
    public void setTotalFloors(Integer totalFloors) { this.totalFloors = totalFloors; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
