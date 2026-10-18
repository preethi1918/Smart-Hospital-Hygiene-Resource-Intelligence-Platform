package com.smarthospital.dto;

import com.smarthospital.model.enums.BedType;
import com.smarthospital.model.enums.OperationalStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class BedRequest {

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotBlank(message = "Bed number is required")
    @Size(max = 50, message = "Bed number cannot exceed 50 characters")
    private String bedNumber;

    @NotBlank(message = "QR Code identifier is required")
    @Size(max = 100, message = "QR Code identifier cannot exceed 100 characters")
    private String qrCodeIdentifier;

    @NotNull(message = "Bed type is required (e.g. STANDARD_WARD, ICU_ELECTRIC, BARIATRIC, ISOLATION, PEDIATRIC_COT, etc.)")
    private BedType bedType;

    private OperationalStatus operationalStatus = OperationalStatus.VACANT_CLEAN;

    @Size(max = 100, message = "Occupancy reference cannot exceed 100 characters")
    private String currentOccupancyReference;

    public BedRequest() {}

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }

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
}
