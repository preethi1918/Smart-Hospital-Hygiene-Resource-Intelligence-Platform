package com.smarthospital.dto;

import com.smarthospital.model.enums.AirflowType;
import com.smarthospital.model.enums.BedType;
import com.smarthospital.model.enums.OperationalStatus;
import com.smarthospital.model.enums.ReadinessStatus;
import com.smarthospital.model.enums.RoomType;
import com.smarthospital.model.enums.WardType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class HospitalStructureRequest {

    @NotNull(message = "Hospital details are required")
    @Valid
    private HospitalRequest hospital;

    @Valid
    private List<BuildingItemRequest> buildings = new ArrayList<>();

    public HospitalStructureRequest() {}

    public HospitalRequest getHospital() { return hospital; }
    public void setHospital(HospitalRequest hospital) { this.hospital = hospital; }

    public List<BuildingItemRequest> getBuildings() { return buildings; }
    public void setBuildings(List<BuildingItemRequest> buildings) { this.buildings = buildings; }

    public static class BuildingItemRequest {
        @NotBlank(message = "Building code is required")
        @Size(max = 50)
        private String buildingCode;

        @NotBlank(message = "Building name is required")
        @Size(max = 150)
        private String name;

        @NotNull(message = "Total floors count is required")
        @Min(1)
        private Integer totalFloors = 1;

        private String status = "ACTIVE";

        @Valid
        private List<FloorItemRequest> floors = new ArrayList<>();

        public BuildingItemRequest() {}

        public String getBuildingCode() { return buildingCode; }
        public void setBuildingCode(String buildingCode) { this.buildingCode = buildingCode; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Integer getTotalFloors() { return totalFloors; }
        public void setTotalFloors(Integer totalFloors) { this.totalFloors = totalFloors; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public List<FloorItemRequest> getFloors() { return floors; }
        public void setFloors(List<FloorItemRequest> floors) { this.floors = floors; }
    }

    public static class FloorItemRequest {
        @NotNull(message = "Floor number is required")
        private Integer floorNumber;

        @NotBlank(message = "Floor code is required")
        @Size(max = 50)
        private String floorCode;

        @NotBlank(message = "Floor name is required")
        @Size(max = 100)
        private String floorName;

        private String status = "ACTIVE";

        @Valid
        private List<WardItemRequest> wards = new ArrayList<>();

        public FloorItemRequest() {}

        public Integer getFloorNumber() { return floorNumber; }
        public void setFloorNumber(Integer floorNumber) { this.floorNumber = floorNumber; }

        public String getFloorCode() { return floorCode; }
        public void setFloorCode(String floorCode) { this.floorCode = floorCode; }

        public String getFloorName() { return floorName; }
        public void setFloorName(String floorName) { this.floorName = floorName; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public List<WardItemRequest> getWards() { return wards; }
        public void setWards(List<WardItemRequest> wards) { this.wards = wards; }
    }

    public static class WardItemRequest {
        @NotBlank(message = "Ward code is required")
        @Size(max = 50)
        private String wardCode;

        @NotBlank(message = "Ward name is required")
        @Size(max = 150)
        private String name;

        @NotNull(message = "Ward type is required")
        private WardType wardType;

        private BigDecimal hygieneTargetScore = new BigDecimal("95.00");
        private BigDecimal currentHygieneScore = new BigDecimal("100.00");
        private String status = "ACTIVE";

        @Valid
        private List<RoomItemRequest> rooms = new ArrayList<>();

        public WardItemRequest() {}

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

        public List<RoomItemRequest> getRooms() { return rooms; }
        public void setRooms(List<RoomItemRequest> rooms) { this.rooms = rooms; }
    }

    public static class RoomItemRequest {
        @NotBlank(message = "Room number is required")
        @Size(max = 50)
        private String roomNumber;

        @NotNull(message = "Room type is required")
        private RoomType roomType;

        @NotBlank(message = "QR code is required")
        @Size(max = 100)
        private String qrCodeIdentifier;

        private AirflowType airflowType = AirflowType.STANDARD_LAMINAR;
        private ReadinessStatus readinessStatus = ReadinessStatus.READY_FOR_USE;

        @Valid
        private List<BedItemRequest> beds = new ArrayList<>();

        public RoomItemRequest() {}

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

        public List<BedItemRequest> getBeds() { return beds; }
        public void setBeds(List<BedItemRequest> beds) { this.beds = beds; }
    }

    public static class BedItemRequest {
        @NotBlank(message = "Bed number is required")
        @Size(max = 50)
        private String bedNumber;

        @NotBlank(message = "QR code is required")
        @Size(max = 100)
        private String qrCodeIdentifier;

        @NotNull(message = "Bed type is required")
        private BedType bedType;

        private OperationalStatus operationalStatus = OperationalStatus.VACANT_CLEAN;
        private String currentOccupancyReference;

        public BedItemRequest() {}

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
}
