package com.smarthospital.service;

import com.smarthospital.dto.*;
import com.smarthospital.exception.BadRequestException;
import com.smarthospital.exception.DuplicateResourceException;
import com.smarthospital.exception.ResourceNotFoundException;
import com.smarthospital.model.*;
import com.smarthospital.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final WardRepository wardRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;

    public HospitalService(HospitalRepository hospitalRepository,
                           BuildingRepository buildingRepository,
                           FloorRepository floorRepository,
                           WardRepository wardRepository,
                           RoomRepository roomRepository,
                           BedRepository bedRepository) {
        this.hospitalRepository = hospitalRepository;
        this.buildingRepository = buildingRepository;
        this.floorRepository = floorRepository;
        this.wardRepository = wardRepository;
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
    }

    @Transactional
    public HospitalResponse create(HospitalRequest request) {
        String code = request.getHospitalCode().trim();
        String license = request.getLicenseNumber().trim();

        if (hospitalRepository.findByHospitalCode(code).isPresent()) {
            throw new DuplicateResourceException("Hospital code already exists: " + code);
        }
        if (hospitalRepository.findByLicenseNumber(license).isPresent()) {
            throw new DuplicateResourceException("License number already exists: " + license);
        }

        Hospital hospital = new Hospital();
        mapRequestToHospital(request, hospital);

        Hospital saved = hospitalRepository.save(hospital);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<HospitalResponse> getAll(String keyword, String city, String status) {
        List<Hospital> list;
        if (keyword != null && !keyword.isBlank()) {
            list = hospitalRepository.findByNameContainingIgnoreCase(keyword.trim());
        } else if (city != null && !city.isBlank()) {
            list = hospitalRepository.findByCityIgnoreCase(city.trim());
        } else if (status != null && !status.isBlank()) {
            list = hospitalRepository.findByStatus(status.trim().toUpperCase());
        } else {
            list = hospitalRepository.findAll();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public HospitalResponse getById(Integer id) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with id: " + id));
        return mapToResponse(hospital);
    }

    @Transactional
    public HospitalResponse update(Integer id, HospitalRequest request) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with id: " + id));

        String code = request.getHospitalCode().trim();
        String license = request.getLicenseNumber().trim();

        hospitalRepository.findByHospitalCode(code).ifPresent(existing -> {
            if (!existing.getHospitalId().equals(id)) {
                throw new DuplicateResourceException("Hospital code already used by another hospital: " + code);
            }
        });

        hospitalRepository.findByLicenseNumber(license).ifPresent(existing -> {
            if (!existing.getHospitalId().equals(id)) {
                throw new DuplicateResourceException("License number already used by another hospital: " + license);
            }
        });

        mapRequestToHospital(request, hospital);
        Hospital saved = hospitalRepository.save(hospital);
        return mapToResponse(saved);
    }

    @Transactional
    public HospitalResponse updateStatus(Integer id, String status) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with id: " + id));
        hospital.setStatus(status.trim().toUpperCase());
        Hospital saved = hospitalRepository.save(hospital);
        return mapToResponse(saved);
    }

    @Transactional
    public void delete(Integer id) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with id: " + id));

        long buildingCount = buildingRepository.countByHospital_HospitalId(id);
        if (buildingCount > 0) {
            throw new BadRequestException("Cannot delete hospital '" + hospital.getName() + "' because it has "
                    + buildingCount + " existing building(s). Please remove all child buildings first.");
        }

        hospitalRepository.delete(hospital);
    }

    @Transactional
    public HospitalStructureResponse createCompleteStructure(HospitalStructureRequest request) {
        HospitalResponse hospitalResponse = create(request.getHospital());
        Hospital hospital = hospitalRepository.findById(hospitalResponse.getHospitalId()).orElseThrow();

        List<HospitalStructureResponse.BuildingNode> buildingNodes = new ArrayList<>();

        if (request.getBuildings() != null) {
            for (HospitalStructureRequest.BuildingItemRequest bReq : request.getBuildings()) {
                Building building = new Building();
                building.setHospital(hospital);
                building.setBuildingCode(bReq.getBuildingCode().trim());
                building.setName(bReq.getName().trim());
                building.setTotalFloors(bReq.getTotalFloors());
                building.setStatus(bReq.getStatus() != null ? bReq.getStatus() : "ACTIVE");
                Building savedBuilding = buildingRepository.save(building);

                List<HospitalStructureResponse.FloorNode> floorNodes = new ArrayList<>();

                if (bReq.getFloors() != null) {
                    for (HospitalStructureRequest.FloorItemRequest fReq : bReq.getFloors()) {
                        Floor floor = new Floor();
                        floor.setBuilding(savedBuilding);
                        floor.setFloorNumber(fReq.getFloorNumber());
                        floor.setFloorCode(fReq.getFloorCode().trim());
                        floor.setFloorName(fReq.getFloorName().trim());
                        floor.setStatus(fReq.getStatus() != null ? fReq.getStatus() : "ACTIVE");
                        Floor savedFloor = floorRepository.save(floor);

                        List<HospitalStructureResponse.WardNode> wardNodes = new ArrayList<>();

                        if (fReq.getWards() != null) {
                            for (HospitalStructureRequest.WardItemRequest wReq : fReq.getWards()) {
                                Ward ward = new Ward();
                                ward.setFloor(savedFloor);
                                ward.setWardCode(wReq.getWardCode().trim());
                                ward.setName(wReq.getName().trim());
                                ward.setWardType(wReq.getWardType());
                                if (wReq.getHygieneTargetScore() != null) {
                                    ward.setHygieneTargetScore(wReq.getHygieneTargetScore());
                                }
                                if (wReq.getCurrentHygieneScore() != null) {
                                    ward.setCurrentHygieneScore(wReq.getCurrentHygieneScore());
                                }
                                ward.setStatus(wReq.getStatus() != null ? wReq.getStatus() : "ACTIVE");
                                Ward savedWard = wardRepository.save(ward);

                                List<HospitalStructureResponse.RoomNode> roomNodes = new ArrayList<>();

                                if (wReq.getRooms() != null) {
                                    for (HospitalStructureRequest.RoomItemRequest rReq : wReq.getRooms()) {
                                        Room room = new Room();
                                        room.setWard(savedWard);
                                        room.setRoomNumber(rReq.getRoomNumber().trim());
                                        room.setRoomType(rReq.getRoomType());
                                        room.setQrCodeIdentifier(rReq.getQrCodeIdentifier().trim());
                                        if (rReq.getAirflowType() != null) {
                                            room.setAirflowType(rReq.getAirflowType());
                                        }
                                        if (rReq.getReadinessStatus() != null) {
                                            room.setReadinessStatus(rReq.getReadinessStatus());
                                        }
                                        Room savedRoom = roomRepository.save(room);

                                        List<BedResponse> bedResponses = new ArrayList<>();

                                        if (rReq.getBeds() != null) {
                                            for (HospitalStructureRequest.BedItemRequest bedReq : rReq.getBeds()) {
                                                Bed bed = new Bed();
                                                bed.setRoom(savedRoom);
                                                bed.setBedNumber(bedReq.getBedNumber().trim());
                                                bed.setQrCodeIdentifier(bedReq.getQrCodeIdentifier().trim());
                                                bed.setBedType(bedReq.getBedType());
                                                if (bedReq.getOperationalStatus() != null) {
                                                    bed.setOperationalStatus(bedReq.getOperationalStatus());
                                                }
                                                bed.setCurrentOccupancyReference(bedReq.getCurrentOccupancyReference());
                                                Bed savedBed = bedRepository.save(bed);
                                                bedResponses.add(mapBedToResponse(savedBed));
                                            }
                                        }
                                        roomNodes.add(new HospitalStructureResponse.RoomNode(mapRoomToResponse(savedRoom), bedResponses));
                                    }
                                }
                                wardNodes.add(new HospitalStructureResponse.WardNode(mapWardToResponse(savedWard), roomNodes));
                            }
                        }
                        floorNodes.add(new HospitalStructureResponse.FloorNode(mapFloorToResponse(savedFloor), wardNodes));
                    }
                }
                buildingNodes.add(new HospitalStructureResponse.BuildingNode(mapBuildingToResponse(savedBuilding), floorNodes));
            }
        }

        return new HospitalStructureResponse(hospitalResponse, buildingNodes);
    }

    @Transactional(readOnly = true)
    public HospitalStructureResponse getHospitalTree(Integer hospitalId) {
        HospitalResponse hospitalResponse = getById(hospitalId);

        List<Building> buildings = buildingRepository.findByHospital_HospitalId(hospitalId);
        List<HospitalStructureResponse.BuildingNode> buildingNodes = new ArrayList<>();

        for (Building building : buildings) {
            List<Floor> floors = floorRepository.findByBuilding_BuildingId(building.getBuildingId());
            List<HospitalStructureResponse.FloorNode> floorNodes = new ArrayList<>();

            for (Floor floor : floors) {
                List<Ward> wards = wardRepository.findByFloor_FloorId(floor.getFloorId());
                List<HospitalStructureResponse.WardNode> wardNodes = new ArrayList<>();

                for (Ward ward : wards) {
                    List<Room> rooms = roomRepository.findByWard_WardId(ward.getWardId());
                    List<HospitalStructureResponse.RoomNode> roomNodes = new ArrayList<>();

                    for (Room room : rooms) {
                        List<Bed> beds = bedRepository.findByRoom_RoomId(room.getRoomId());
                        List<BedResponse> bedResponses = beds.stream()
                                .map(this::mapBedToResponse)
                                .collect(Collectors.toList());

                        roomNodes.add(new HospitalStructureResponse.RoomNode(mapRoomToResponse(room), bedResponses));
                    }
                    wardNodes.add(new HospitalStructureResponse.WardNode(mapWardToResponse(ward), roomNodes));
                }
                floorNodes.add(new HospitalStructureResponse.FloorNode(mapFloorToResponse(floor), wardNodes));
            }
            buildingNodes.add(new HospitalStructureResponse.BuildingNode(mapBuildingToResponse(building), floorNodes));
        }

        return new HospitalStructureResponse(hospitalResponse, buildingNodes);
    }

    private void mapRequestToHospital(HospitalRequest request, Hospital hospital) {
        hospital.setHospitalCode(request.getHospitalCode().trim());
        hospital.setName(request.getName().trim());
        hospital.setLicenseNumber(request.getLicenseNumber().trim());
        hospital.setAddressLine1(request.getAddressLine1().trim());
        hospital.setAddressLine2(request.getAddressLine2());
        hospital.setCity(request.getCity().trim());
        hospital.setState(request.getState().trim());
        hospital.setPostalCode(request.getPostalCode().trim());
        if (request.getCountry() != null) hospital.setCountry(request.getCountry().trim());
        hospital.setContactEmail(request.getContactEmail());
        hospital.setContactPhone(request.getContactPhone());
        if (request.getStatus() != null) hospital.setStatus(request.getStatus().trim().toUpperCase());
    }

    public HospitalResponse mapToResponse(Hospital h) {
        HospitalResponse r = new HospitalResponse();
        r.setHospitalId(h.getHospitalId());
        r.setHospitalCode(h.getHospitalCode());
        r.setName(h.getName());
        r.setLicenseNumber(h.getLicenseNumber());
        r.setAddressLine1(h.getAddressLine1());
        r.setAddressLine2(h.getAddressLine2());
        r.setCity(h.getCity());
        r.setState(h.getState());
        r.setPostalCode(h.getPostalCode());
        r.setCountry(h.getCountry());
        r.setContactEmail(h.getContactEmail());
        r.setContactPhone(h.getContactPhone());
        r.setStatus(h.getStatus());
        r.setTotalBuildings(buildingRepository.countByHospital_HospitalId(h.getHospitalId()));
        r.setCreatedAt(h.getCreatedAt());
        r.setUpdatedAt(h.getUpdatedAt());
        return r;
    }

    private BuildingResponse mapBuildingToResponse(Building b) {
        BuildingResponse r = new BuildingResponse();
        r.setBuildingId(b.getBuildingId());
        r.setHospitalId(b.getHospital().getHospitalId());
        r.setHospitalName(b.getHospital().getName());
        r.setHospitalCode(b.getHospital().getHospitalCode());
        r.setBuildingCode(b.getBuildingCode());
        r.setName(b.getName());
        r.setTotalFloors(b.getTotalFloors());
        r.setStatus(b.getStatus());
        r.setActualFloorsConfigured(floorRepository.countByBuilding_BuildingId(b.getBuildingId()));
        r.setCreatedAt(b.getCreatedAt());
        r.setUpdatedAt(b.getUpdatedAt());
        return r;
    }

    private FloorResponse mapFloorToResponse(Floor f) {
        FloorResponse r = new FloorResponse();
        r.setFloorId(f.getFloorId());
        r.setBuildingId(f.getBuilding().getBuildingId());
        r.setBuildingName(f.getBuilding().getName());
        r.setBuildingCode(f.getBuilding().getBuildingCode());
        if (f.getBuilding().getHospital() != null) {
            r.setHospitalId(f.getBuilding().getHospital().getHospitalId());
            r.setHospitalName(f.getBuilding().getHospital().getName());
        }
        r.setFloorNumber(f.getFloorNumber());
        r.setFloorCode(f.getFloorCode());
        r.setFloorName(f.getFloorName());
        r.setStatus(f.getStatus());
        r.setTotalWardsCount(wardRepository.countByFloor_FloorId(f.getFloorId()));
        r.setCreatedAt(f.getCreatedAt());
        r.setUpdatedAt(f.getUpdatedAt());
        return r;
    }

    private WardResponse mapWardToResponse(Ward w) {
        WardResponse r = new WardResponse();
        r.setWardId(w.getWardId());
        r.setFloorId(w.getFloor().getFloorId());
        r.setFloorCode(w.getFloor().getFloorCode());
        r.setFloorName(w.getFloor().getFloorName());
        if (w.getFloor().getBuilding() != null) {
            r.setBuildingId(w.getFloor().getBuilding().getBuildingId());
            r.setBuildingName(w.getFloor().getBuilding().getName());
            if (w.getFloor().getBuilding().getHospital() != null) {
                r.setHospitalId(w.getFloor().getBuilding().getHospital().getHospitalId());
                r.setHospitalName(w.getFloor().getBuilding().getHospital().getName());
            }
        }
        r.setWardCode(w.getWardCode());
        r.setName(w.getName());
        r.setWardType(w.getWardType());
        r.setHygieneTargetScore(w.getHygieneTargetScore());
        r.setCurrentHygieneScore(w.getCurrentHygieneScore());
        r.setStatus(w.getStatus());
        r.setTotalRoomsCount(roomRepository.countByWard_WardId(w.getWardId()));
        r.setCreatedAt(w.getCreatedAt());
        r.setUpdatedAt(w.getUpdatedAt());
        return r;
    }

    private RoomResponse mapRoomToResponse(Room rm) {
        RoomResponse r = new RoomResponse();
        r.setRoomId(rm.getRoomId());
        r.setWardId(rm.getWard().getWardId());
        r.setWardCode(rm.getWard().getWardCode());
        r.setWardName(rm.getWard().getName());
        r.setRoomNumber(rm.getRoomNumber());
        r.setRoomType(rm.getRoomType());
        r.setQrCodeIdentifier(rm.getQrCodeIdentifier());
        r.setAirflowType(rm.getAirflowType());
        r.setReadinessStatus(rm.getReadinessStatus());
        r.setLastCleanedAt(rm.getLastCleanedAt());
        r.setLastDisinfectedAt(rm.getLastDisinfectedAt());
        r.setTotalBedsCount(bedRepository.countByRoom_RoomId(rm.getRoomId()));
        r.setCreatedAt(rm.getCreatedAt());
        r.setUpdatedAt(rm.getUpdatedAt());
        return r;
    }

    private BedResponse mapBedToResponse(Bed b) {
        BedResponse r = new BedResponse();
        r.setBedId(b.getBedId());
        r.setRoomId(b.getRoom().getRoomId());
        r.setRoomNumber(b.getRoom().getRoomNumber());
        if (b.getRoom().getWard() != null) {
            r.setWardId(b.getRoom().getWard().getWardId());
            r.setWardCode(b.getRoom().getWard().getWardCode());
            r.setWardName(b.getRoom().getWard().getName());
        }
        r.setBedNumber(b.getBedNumber());
        r.setQrCodeIdentifier(b.getQrCodeIdentifier());
        r.setBedType(b.getBedType());
        r.setOperationalStatus(b.getOperationalStatus());
        r.setCurrentOccupancyReference(b.getCurrentOccupancyReference());
        r.setLastBedsheetChangeAt(b.getLastBedsheetChangeAt());
        r.setCreatedAt(b.getCreatedAt());
        r.setUpdatedAt(b.getUpdatedAt());
        return r;
    }
}
