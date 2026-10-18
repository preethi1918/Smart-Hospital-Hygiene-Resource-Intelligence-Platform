package com.smarthospital.service;

import com.smarthospital.dto.FloorRequest;
import com.smarthospital.dto.FloorResponse;
import com.smarthospital.exception.BadRequestException;
import com.smarthospital.exception.DuplicateResourceException;
import com.smarthospital.exception.ResourceNotFoundException;
import com.smarthospital.model.Building;
import com.smarthospital.model.Floor;
import com.smarthospital.repository.BuildingRepository;
import com.smarthospital.repository.FloorRepository;
import com.smarthospital.repository.WardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FloorService {

    private final FloorRepository floorRepository;
    private final BuildingRepository buildingRepository;
    private final WardRepository wardRepository;

    public FloorService(FloorRepository floorRepository,
                        BuildingRepository buildingRepository,
                        WardRepository wardRepository) {
        this.floorRepository = floorRepository;
        this.buildingRepository = buildingRepository;
        this.wardRepository = wardRepository;
    }

    @Transactional
    public FloorResponse create(FloorRequest request) {
        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with id: " + request.getBuildingId()));

        floorRepository.findByBuilding_BuildingIdAndFloorNumber(building.getBuildingId(), request.getFloorNumber())
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("Floor number " + request.getFloorNumber() + " already exists in building '" + building.getName() + "'");
                });

        Floor floor = new Floor();
        floor.setBuilding(building);
        floor.setFloorNumber(request.getFloorNumber());
        floor.setFloorCode(request.getFloorCode().trim());
        floor.setFloorName(request.getFloorName().trim());
        if (request.getStatus() != null) {
            floor.setStatus(request.getStatus().trim().toUpperCase());
        }

        Floor saved = floorRepository.save(floor);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<FloorResponse> getAll(Integer buildingId, String status) {
        List<Floor> list;
        if (buildingId != null) {
            list = floorRepository.findByBuilding_BuildingId(buildingId);
        } else if (status != null && !status.isBlank()) {
            list = floorRepository.findByStatus(status.trim().toUpperCase());
        } else {
            list = floorRepository.findAll();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FloorResponse getById(Integer id) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Floor not found with id: " + id));
        return mapToResponse(floor);
    }

    @Transactional
    public FloorResponse update(Integer id, FloorRequest request) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Floor not found with id: " + id));

        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with id: " + request.getBuildingId()));

        floorRepository.findByBuilding_BuildingIdAndFloorNumber(building.getBuildingId(), request.getFloorNumber())
                .ifPresent(existing -> {
                    if (!existing.getFloorId().equals(id)) {
                        throw new DuplicateResourceException("Floor number " + request.getFloorNumber() + " already exists in building '" + building.getName() + "'");
                    }
                });

        floor.setBuilding(building);
        floor.setFloorNumber(request.getFloorNumber());
        floor.setFloorCode(request.getFloorCode().trim());
        floor.setFloorName(request.getFloorName().trim());
        if (request.getStatus() != null) {
            floor.setStatus(request.getStatus().trim().toUpperCase());
        }

        Floor saved = floorRepository.save(floor);
        return mapToResponse(saved);
    }

    @Transactional
    public FloorResponse updateStatus(Integer id, String status) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Floor not found with id: " + id));
        floor.setStatus(status.trim().toUpperCase());
        Floor saved = floorRepository.save(floor);
        return mapToResponse(saved);
    }

    @Transactional
    public void delete(Integer id) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Floor not found with id: " + id));

        long wardCount = wardRepository.countByFloor_FloorId(id);
        if (wardCount > 0) {
            throw new BadRequestException("Cannot delete floor '" + floor.getFloorName() + "' because it has "
                    + wardCount + " ward(s). Please remove all child wards first.");
        }

        floorRepository.delete(floor);
    }

    public FloorResponse mapToResponse(Floor f) {
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
}
