package com.smarthospital.dto;

import com.smarthospital.model.enums.BedType;
import com.smarthospital.model.enums.OperationalStatus;
import java.time.LocalDateTime;

public class BedResponse {

    private Long bedId;
    private Long roomId;
    private String roomNumber;
    private Integer wardId;
    private String wardCode;
    private String wardName;
    private Integer floorId;
    private String floorName;
    private Integer buildingId;
    private String buildingName;
    private Integer hospitalId;
    private String hospitalName;
    private String bedNumber;
    private String qrCodeIdentifier;
    private BedType bedType;
    private OperationalStatus operationalStatus;
    private String currentOccupancyReference;
    private LocalDateTime lastBedsheetChangeAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BedResponse() {}

    public Long getBedId() { return bedId; }
    public void setBedId(Long bedId) { this.bedId = bedId; }

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

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

    public String getBedNumber() { return bedNumber; }
    public void setBedNumber(String bedNumber) { this.bedNumber = bedNumber; }

    public String getQrCodeIdentifier() { return qrCodeIdentifier; }
    public void setQrCodeIdentifier(String qrCodeIdentifier) { this.qrCodeIdentifier = qrCodeIdentifier; }

    public BedType getBedType() { return bedType; }
    public void setBedType(BedType bedType) { this.bedType = bedType; }

    public OperationalStatus getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(OperationalStatus operationalStatus) { this.operationalStatus = operationalStatus; }

    public String getCurrentOccupancyReference() { return currentOccupancyReference; }
    public void setCurrentOccupancyReference(String currentOccupancyReference) { this.currentOccupancyReference = currentOccupancyReference; }

    public LocalDateTime getLastBedsheetChangeAt() { return lastBedsheetChangeAt; }
    public void setLastBedsheetChangeAt(LocalDateTime lastBedsheetChangeAt) { this.lastBedsheetChangeAt = lastBedsheetChangeAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
