package com.smarthospital.dto;

import java.time.LocalDateTime;

public class BuildingResponse {

    private Integer buildingId;
    private Integer hospitalId;
    private String hospitalName;
    private String hospitalCode;
    private String buildingCode;
    private String name;
    private Integer totalFloors;
    private String status;
    private long actualFloorsConfigured;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BuildingResponse() {}

    public Integer getBuildingId() { return buildingId; }
    public void setBuildingId(Integer buildingId) { this.buildingId = buildingId; }

    public Integer getHospitalId() { return hospitalId; }
    public void setHospitalId(Integer hospitalId) { this.hospitalId = hospitalId; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public String getHospitalCode() { return hospitalCode; }
    public void setHospitalCode(String hospitalCode) { this.hospitalCode = hospitalCode; }

    public String getBuildingCode() { return buildingCode; }
    public void setBuildingCode(String buildingCode) { this.buildingCode = buildingCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getTotalFloors() { return totalFloors; }
    public void setTotalFloors(Integer totalFloors) { this.totalFloors = totalFloors; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getActualFloorsConfigured() { return actualFloorsConfigured; }
    public void setActualFloorsConfigured(long actualFloorsConfigured) { this.actualFloorsConfigured = actualFloorsConfigured; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
