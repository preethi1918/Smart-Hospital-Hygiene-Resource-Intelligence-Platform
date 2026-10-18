package com.smarthospital.dto;

import com.smarthospital.model.enums.WardType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class WardResponse {

    private Integer wardId;
    private Integer floorId;
    private String floorCode;
    private String floorName;
    private Integer buildingId;
    private String buildingName;
    private Integer hospitalId;
    private String hospitalName;
    private String wardCode;
    private String name;
    private WardType wardType;
    private BigDecimal hygieneTargetScore;
    private BigDecimal currentHygieneScore;
    private String status;
    private long totalRoomsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WardResponse() {}

    public Integer getWardId() { return wardId; }
    public void setWardId(Integer wardId) { this.wardId = wardId; }

    public Integer getFloorId() { return floorId; }
    public void setFloorId(Integer floorId) { this.floorId = floorId; }

    public String getFloorCode() { return floorCode; }
    public void setFloorCode(String floorCode) { this.floorCode = floorCode; }

    public String getFloorName() { return floorName; }
    public void setFloorName(String floorName) { this.floorName = floorName; }

    public Integer getBuildingId() { return buildingId; }
    public void setBuildingId(Integer buildingId) { this.buildingId = buildingId; }

    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }

    public Integer getHospitalId() { return hospitalId; }
    public void setHospitalId(Integer hospitalId) { this.hospitalId = hospitalId; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public String getWardCode() { return wardCode; }
    public void setWardCode(String wardCode) { this.wardCode = wardCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public WardType getWardType() { return wardType; }
    public void setWardType(WardType wardType) { this.wardType = wardType; }

    public BigDecimal getHygieneTargetScore() { return hygieneTargetScore; }
    public void setHygieneTargetScore(BigDecimal hygieneTargetScore) { this.hygieneTargetScore = hygieneTargetScore; }

    public BigDecimal getCurrentHygieneScore() { return currentHygieneScore; }
    public void setCurrentHygieneScore(BigDecimal currentHygieneScore) { this.currentHygieneScore = currentHygieneScore; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getTotalRoomsCount() { return totalRoomsCount; }
    public void setTotalRoomsCount(long totalRoomsCount) { this.totalRoomsCount = totalRoomsCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
