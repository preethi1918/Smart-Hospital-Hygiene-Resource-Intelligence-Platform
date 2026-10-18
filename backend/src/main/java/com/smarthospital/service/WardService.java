package com.smarthospital.service;

import com.smarthospital.dto.WardRequest;
import com.smarthospital.dto.WardResponse;
import com.smarthospital.exception.BadRequestException;
import com.smarthospital.exception.DuplicateResourceException;
import com.smarthospital.exception.ResourceNotFoundException;
import com.smarthospital.model.Floor;
import com.smarthospital.model.Ward;
import com.smarthospital.model.enums.WardType;
import com.smarthospital.repository.FloorRepository;
import com.smarthospital.repository.RoomRepository;
import com.smarthospital.repository.WardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WardService {

    private final WardRepository wardRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;

    public WardService(WardRepository wardRepository,
                       FloorRepository floorRepository,
                       RoomRepository roomRepository) {
        this.wardRepository = wardRepository;
        this.floorRepository = floorRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional
    public WardResponse create(WardRequest request) {
        Floor floor = floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new ResourceNotFoundException("Floor not found with id: " + request.getFloorId()));

        String code = request.getWardCode().trim();
        wardRepository.findByWardCode(code).ifPresent(existing -> {
            throw new DuplicateResourceException("Ward code '" + code + "' already exists");
        });

        Ward ward = new Ward();
        ward.setFloor(floor);
        ward.setWardCode(code);
        ward.setName(request.getName().trim());
        ward.setWardType(request.getWardType());
        if (request.getHygieneTargetScore() != null) {
            ward.setHygieneTargetScore(request.getHygieneTargetScore());
        }
        if (request.getCurrentHygieneScore() != null) {
            ward.setCurrentHygieneScore(request.getCurrentHygieneScore());
        }
        if (request.getStatus() != null) {
            ward.setStatus(request.getStatus().trim().toUpperCase());
        }

        Ward saved = wardRepository.save(ward);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<WardResponse> getAll(Integer floorId, WardType wardType, String status, String keyword) {
        List<Ward> list;
        if (floorId != null) {
            list = wardRepository.findByFloor_FloorId(floorId);
        } else if (wardType != null) {
            list = wardRepository.findByWardType(wardType);
        } else if (keyword != null && !keyword.isBlank()) {
            list = wardRepository.findByNameContainingIgnoreCase(keyword.trim());
        } else if (status != null && !status.isBlank()) {
            list = wardRepository.findByStatus(status.trim().toUpperCase());
        } else {
            list = wardRepository.findAll();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WardResponse getById(Integer id) {
        Ward ward = wardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found with id: " + id));
        return mapToResponse(ward);
    }

    @Transactional
    public WardResponse update(Integer id, WardRequest request) {
        Ward ward = wardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found with id: " + id));

        Floor floor = floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new ResourceNotFoundException("Floor not found with id: " + request.getFloorId()));

        String code = request.getWardCode().trim();
        wardRepository.findByWardCode(code).ifPresent(existing -> {
            if (!existing.getWardId().equals(id)) {
                throw new DuplicateResourceException("Ward code '" + code + "' already used by another ward");
            }
        });

        ward.setFloor(floor);
        ward.setWardCode(code);
        ward.setName(request.getName().trim());
        ward.setWardType(request.getWardType());
        if (request.getHygieneTargetScore() != null) {
            ward.setHygieneTargetScore(request.getHygieneTargetScore());
        }
        if (request.getCurrentHygieneScore() != null) {
            ward.setCurrentHygieneScore(request.getCurrentHygieneScore());
        }
        if (request.getStatus() != null) {
            ward.setStatus(request.getStatus().trim().toUpperCase());
        }

        Ward saved = wardRepository.save(ward);
        return mapToResponse(saved);
    }

    @Transactional
    public WardResponse updateStatus(Integer id, String status) {
        Ward ward = wardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found with id: " + id));
        ward.setStatus(status.trim().toUpperCase());
        Ward saved = wardRepository.save(ward);
        return mapToResponse(saved);
    }

    @Transactional
    public WardResponse updateHygieneScore(Integer id, BigDecimal score) {
        Ward ward = wardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found with id: " + id));
        ward.setCurrentHygieneScore(score);
        Ward saved = wardRepository.save(ward);
        return mapToResponse(saved);
    }

    @Transactional
    public void delete(Integer id) {
        Ward ward = wardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found with id: " + id));

        long roomCount = roomRepository.countByWard_WardId(id);
        if (roomCount > 0) {
            throw new BadRequestException("Cannot delete ward '" + ward.getName() + "' because it has "
                    + roomCount + " room(s). Please remove all child rooms first.");
        }

        wardRepository.delete(ward);
    }

    public WardResponse mapToResponse(Ward w) {
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
}
