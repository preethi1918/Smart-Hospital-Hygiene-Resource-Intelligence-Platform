package com.smarthospital.dto;

import java.util.ArrayList;
import java.util.List;

public class HospitalStructureResponse {

    private HospitalResponse hospital;
    private List<BuildingNode> buildings = new ArrayList<>();

    public HospitalStructureResponse() {}

    public HospitalStructureResponse(HospitalResponse hospital, List<BuildingNode> buildings) {
        this.hospital = hospital;
        this.buildings = buildings != null ? buildings : new ArrayList<>();
    }

    public HospitalResponse getHospital() { return hospital; }
    public void setHospital(HospitalResponse hospital) { this.hospital = hospital; }

    public List<BuildingNode> getBuildings() { return buildings; }
    public void setBuildings(List<BuildingNode> buildings) { this.buildings = buildings; }

    public static class BuildingNode {
        private BuildingResponse building;
        private List<FloorNode> floors = new ArrayList<>();

        public BuildingNode() {}

        public BuildingNode(BuildingResponse building, List<FloorNode> floors) {
            this.building = building;
            this.floors = floors != null ? floors : new ArrayList<>();
        }

        public BuildingResponse getBuilding() { return building; }
        public void setBuilding(BuildingResponse building) { this.building = building; }

        public List<FloorNode> getFloors() { return floors; }
        public void setFloors(List<FloorNode> floors) { this.floors = floors; }
    }

    public static class FloorNode {
        private FloorResponse floor;
        private List<WardNode> wards = new ArrayList<>();

        public FloorNode() {}

        public FloorNode(FloorResponse floor, List<WardNode> wards) {
            this.floor = floor;
            this.wards = wards != null ? wards : new ArrayList<>();
        }

        public FloorResponse getFloor() { return floor; }
        public void setFloor(FloorResponse floor) { this.floor = floor; }

        public List<WardNode> getWards() { return wards; }
        public void setWards(List<WardNode> wards) { this.wards = wards; }
    }

    public static class WardNode {
        private WardResponse ward;
        private List<RoomNode> rooms = new ArrayList<>();

        public WardNode() {}

        public WardNode(WardResponse ward, List<RoomNode> rooms) {
            this.ward = ward;
            this.rooms = rooms != null ? rooms : new ArrayList<>();
        }

        public WardResponse getWard() { return ward; }
        public void setWard(WardResponse ward) { this.ward = ward; }

        public List<RoomNode> getRooms() { return rooms; }
        public void setRooms(List<RoomNode> rooms) { this.rooms = rooms; }
    }

    public static class RoomNode {
        private RoomResponse room;
        private List<BedResponse> beds = new ArrayList<>();

        public RoomNode() {}

        public RoomNode(RoomResponse room, List<BedResponse> beds) {
            this.room = room;
            this.beds = beds != null ? beds : new ArrayList<>();
        }

        public RoomResponse getRoom() { return room; }
        public void setRoom(RoomResponse room) { this.room = room; }

        public List<BedResponse> getBeds() { return beds; }
        public void setBeds(List<BedResponse> beds) { this.beds = beds; }
    }
}
