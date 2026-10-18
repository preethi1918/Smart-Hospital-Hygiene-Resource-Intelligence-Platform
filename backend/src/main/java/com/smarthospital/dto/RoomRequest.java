package com.smarthospital.dto;

import com.smarthospital.model.enums.AirflowType;
import com.smarthospital.model.enums.ReadinessStatus;
import com.smarthospital.model.enums.RoomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RoomRequest {

    @NotNull(message = "Ward ID is required")
    private Integer wardId;

    @NotBlank(message = "Room number is required")
    @Size(max = 50, message = "Room number cannot exceed 50 characters")
    private String roomNumber;

    @NotNull(message = "Room type is required (e.g. SINGLE_ISOLATION, DOUBLE_OCCUPANCY, MULTI_BED_WARD, SURGICAL_SUITE, etc.)")
    private RoomType roomType;

    @NotBlank(message = "QR Code identifier is required")
    @Size(max = 100, message = "QR Code identifier cannot exceed 100 characters")
    private String qrCodeIdentifier;

    private AirflowType airflowType = AirflowType.STANDARD_LAMINAR;

    private ReadinessStatus readinessStatus = ReadinessStatus.READY_FOR_USE;

    public RoomRequest() {}

    public Integer getWardId() { return wardId; }
    public void setWardId(Integer wardId) { this.wardId = wardId; }

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
}
