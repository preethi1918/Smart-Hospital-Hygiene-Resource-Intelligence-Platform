package com.smarthospital.service;

import com.smarthospital.dto.BuildingRequest;
import com.smarthospital.dto.BuildingResponse;
import com.smarthospital.exception.BadRequestException;
import com.smarthospital.exception.DuplicateResourceException;
import com.smarthospital.exception.ResourceNotFoundException;
import com.smarthospital.model.Building;
import com.smarthospital.model.Hospital;
import com.smarthospital.repository.BuildingRepository;
import com.smarthospital.repository.FloorRepository;
import com.smarthospital.repository.HospitalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final HospitalRepository hospitalRepository;
    private final FloorRepository floorRepository;

    public BuildingService(BuildingRepository buildingRepository,
                           HospitalRepository hospitalRepository,
                           FloorRepository floorRepository) {
        this.buildingRepository = buildingRepository;
        this.hospitalRepository = hospitalRepository;
        this.floorRepository = floorRepository;
    }

    @Transactional
    public BuildingResponse create(BuildingRequest request) {
        Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with id: " + request.getHospitalId()));

        String code = request.getBuildingCode().trim();
        buildingRepository.findByHospital_HospitalIdAndBuildingCode(hospital.getHospitalId(), code).ifPresent(b -> {
            throw new DuplicateResourceException("Building code '" + code + "' already exists in hospital '" + hospital.getName() + "'");
        });

        Building building = new Building();
        building.setHospital(hospital);
        building.setBuildingCode(code);
        building.setName(request.getName().trim());
        building.setTotalFloors(request.getTotalFloors());
        if (request.getStatus() != null) {
            building.setStatus(request.getStatus().trim().toUpperCase());
        }

        Building saved = buildingRepository.save(building);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BuildingResponse> getAll(Integer hospitalId, String keyword, String status) {
        List<Building> list;
        if (hospitalId != null) {
            list = buildingRepository.findByHospital_HospitalId(hospitalId);
        } else if (keyword != null && !keyword.isBlank()) {
            list = buildingRepository.findByNameContainingIgnoreCase(keyword.trim());
        } else if (status != null && !status.isBlank()) {
            list = buildingRepository.findByStatus(status.trim().toUpperCase());
        } else {
            list = buildingRepository.findAll();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BuildingResponse getById(Integer id) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with id: " + id));
        return mapToResponse(building);
    }

    @Transactional
    public BuildingResponse update(Integer id, BuildingRequest request) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with id: " + id));

        Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with id: " + request.getHospitalId()));

        String code = request.getBuildingCode().trim();
        buildingRepository.findByHospital_HospitalIdAndBuildingCode(hospital.getHospitalId(), code).ifPresent(existing -> {
            if (!existing.getBuildingId().equals(id)) {
                throw new DuplicateResourceException("Building code '" + code + "' already in use in hospital " + hospital.getName());
            }
        });

        building.setHospital(hospital);
        building.setBuildingCode(code);
        building.setName(request.getName().trim());
        building.setTotalFloors(request.getTotalFloors());
        if (request.getStatus() != null) {
            building.setStatus(request.getStatus().trim().toUpperCase());
        }

        Building saved = buildingRepository.save(building);
        return mapToResponse(saved);
    }

    @Transactional
    public BuildingResponse updateStatus(Integer id, String status) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with id: " + id));
        building.setStatus(status.trim().toUpperCase());
        Building saved = buildingRepository.save(building);
        return mapToResponse(saved);
    }

    @Transactional
    public void delete(Integer id) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with id: " + id));

        long floorsCount = floorRepository.countByBuilding_BuildingId(id);
        if (floorsCount > 0) {
            throw new BadRequestException("Cannot delete building '" + building.getName() + "' because it has "
                    + floorsCount + " floor(s). Please remove all child floors first.");
        }

        buildingRepository.delete(building);
    }

    public BuildingResponse mapToResponse(Building b) {
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
}
