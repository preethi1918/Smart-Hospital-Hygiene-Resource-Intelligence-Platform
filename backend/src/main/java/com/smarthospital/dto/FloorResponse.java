package com.smarthospital.dto;

import java.time.LocalDateTime;

public class FloorResponse {

    private Integer floorId;
    private Integer buildingId;
    private String buildingName;
    private String buildingCode;
    private Integer hospitalId;
    private String hospitalName;
    private Integer floorNumber;
    private String floorCode;
    private String floorName;
    private String status;
    private long totalWardsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FloorResponse() {}

    public Integer getFloorId() { return floorId; }
    public void setFloorId(Integer floorId) { this.floorId = floorId; }

    public Integer getBuildingId() { return buildingId; }
    public void setBuildingId(Integer buildingId) { this.buildingId = buildingId; }

    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }

    public String getBuildingCode() { return buildingCode; }
    public void setBuildingCode(String buildingCode) { this.buildingCode = buildingCode; }

    public Integer getHospitalId() { return hospitalId; }
    public void setHospitalId(Integer hospitalId) { this.hospitalId = hospitalId; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public Integer getFloorNumber() { return floorNumber; }
    public void setFloorNumber(Integer floorNumber) { this.floorNumber = floorNumber; }

    public String getFloorCode() { return floorCode; }
    public void setFloorCode(String floorCode) { this.floorCode = floorCode; }

    public String getFloorName() { return floorName; }
    public void setFloorName(String floorName) { this.floorName = floorName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getTotalWardsCount() { return totalWardsCount; }
    public void setTotalWardsCount(long totalWardsCount) { this.totalWardsCount = totalWardsCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
