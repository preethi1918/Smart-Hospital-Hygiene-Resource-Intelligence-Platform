package com.smarthospital.dto;

import com.smarthospital.model.enums.AirflowType;
import com.smarthospital.model.enums.ReadinessStatus;
import com.smarthospital.model.enums.RoomType;
import java.time.LocalDateTime;

public class RoomResponse {

    private Long roomId;
    private Integer wardId;
    private String wardCode;
    private String wardName;
    private Integer floorId;
    private String floorName;
    private Integer buildingId;
    private String buildingName;
    private Integer hospitalId;
    private String hospitalName;
    private String roomNumber;
    private RoomType roomType;
    private String qrCodeIdentifier;
    private AirflowType airflowType;
    private ReadinessStatus readinessStatus;
    private LocalDateTime lastCleanedAt;
    private LocalDateTime lastDisinfectedAt;
    private long totalBedsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public RoomResponse() {}

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }

    public Integer getWardId() { return wardId; }
    public void setWardId(Integer wardId) { this.wardId = wardId; }

    public String getWardCode() { return wardCode; }
    public void setWardCode(String wardCode) { this.wardCode = wardCode; }

    public String getWardName() { return wardName; }
    public void setWardName(String wardName) { this.wardName = wardName; }

    public Integer getFloorId() { return floorId; }
    public void setFloorId(Integer floorId) { this.floorId = floorId; }

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

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public RoomType getRoomType() { return roomType; }
    public void setRoomType(RoomType roomType) { this.roomType = roomType; }

    public String getQrCodeIdentifier() { return qrCodeIdentifier; }
    public void setQrCodeIdentifier(String qrCodeIdentifier) { this.qrCodeIdentifier = qrCodeIdentifier; }

    public AirflowType getAirflowType() { return airflowType; }
    public void setAirflowType(AirflowType airflowType) { this.airflowType = airflowType; }

    public ReadinessStatus getReadinessStatus() { return readinessStatus; }
    public void setReadinessStatus(ReadinessStatus readinessStatus) { this.readinessStatus = readinessStatus; }

    public LocalDateTime getLastCleanedAt() { return lastCleanedAt; }
    public void setLastCleanedAt(LocalDateTime lastCleanedAt) { this.lastCleanedAt = lastCleanedAt; }

    public LocalDateTime getLastDisinfectedAt() { return lastDisinfectedAt; }
    public void setLastDisinfectedAt(LocalDateTime lastDisinfectedAt) { this.lastDisinfectedAt = lastDisinfectedAt; }

    public long getTotalBedsCount() { return totalBedsCount; }
    public void setTotalBedsCount(long totalBedsCount) { this.totalBedsCount = totalBedsCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
