package com.smarthospital.service;

import com.smarthospital.dto.RoomRequest;
import com.smarthospital.dto.RoomResponse;
import com.smarthospital.exception.BadRequestException;
import com.smarthospital.exception.DuplicateResourceException;
import com.smarthospital.exception.ResourceNotFoundException;
import com.smarthospital.model.Room;
import com.smarthospital.model.Ward;
import com.smarthospital.model.enums.AirflowType;
import com.smarthospital.model.enums.ReadinessStatus;
import com.smarthospital.model.enums.RoomType;
import com.smarthospital.repository.BedRepository;
import com.smarthospital.repository.RoomRepository;
import com.smarthospital.repository.WardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final WardRepository wardRepository;
    private final BedRepository bedRepository;

    public RoomService(RoomRepository roomRepository,
                       WardRepository wardRepository,
                       BedRepository bedRepository) {
        this.roomRepository = roomRepository;
        this.wardRepository = wardRepository;
        this.bedRepository = bedRepository;
    }

    @Transactional
    public RoomResponse create(RoomRequest request) {
        Ward ward = wardRepository.findById(request.getWardId())
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found with id: " + request.getWardId()));

        String qr = request.getQrCodeIdentifier().trim();
        roomRepository.findByQrCodeIdentifier(qr).ifPresent(existing -> {
            throw new DuplicateResourceException("QR code identifier '" + qr + "' is already assigned to room ID " + existing.getRoomId());
        });

        String roomNum = request.getRoomNumber().trim();
        roomRepository.findByWard_WardIdAndRoomNumber(ward.getWardId(), roomNum).ifPresent(existing -> {
            throw new DuplicateResourceException("Room number '" + roomNum + "' already exists in ward '" + ward.getName() + "'");
        });

        Room room = new Room();
        room.setWard(ward);
        room.setRoomNumber(roomNum);
        room.setRoomType(request.getRoomType());
        room.setQrCodeIdentifier(qr);
        if (request.getAirflowType() != null) {
            room.setAirflowType(request.getAirflowType());
        }
        if (request.getReadinessStatus() != null) {
            room.setReadinessStatus(request.getReadinessStatus());
        }

        Room saved = roomRepository.save(room);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getAll(Integer wardId, ReadinessStatus readinessStatus, RoomType roomType, AirflowType airflowType, String keyword) {
        List<Room> list;
        if (wardId != null) {
            list = roomRepository.findByWard_WardId(wardId);
        } else if (readinessStatus != null) {
            list = roomRepository.findByReadinessStatus(readinessStatus);
        } else if (roomType != null) {
            list = roomRepository.findByRoomType(roomType);
        } else if (airflowType != null) {
            list = roomRepository.findByAirflowType(airflowType);
        } else if (keyword != null && !keyword.isBlank()) {
            list = roomRepository.findByRoomNumberContainingIgnoreCase(keyword.trim());
        } else {
            list = roomRepository.findAll();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoomResponse getById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
        return mapToResponse(room);
    }

    @Transactional
    public RoomResponse update(Long id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));

        Ward ward = wardRepository.findById(request.getWardId())
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found with id: " + request.getWardId()));

        String qr = request.getQrCodeIdentifier().trim();
        roomRepository.findByQrCodeIdentifier(qr).ifPresent(existing -> {
            if (!existing.getRoomId().equals(id)) {
                throw new DuplicateResourceException("QR code identifier '" + qr + "' already in use by another room");
            }
        });

        String roomNum = request.getRoomNumber().trim();
        roomRepository.findByWard_WardIdAndRoomNumber(ward.getWardId(), roomNum).ifPresent(existing -> {
            if (!existing.getRoomId().equals(id)) {
                throw new DuplicateResourceException("Room number '" + roomNum + "' already exists in ward '" + ward.getName() + "'");
            }
        });

        room.setWard(ward);
        room.setRoomNumber(roomNum);
        room.setRoomType(request.getRoomType());
        room.setQrCodeIdentifier(qr);
        if (request.getAirflowType() != null) {
            room.setAirflowType(request.getAirflowType());
        }
        if (request.getReadinessStatus() != null) {
            room.setReadinessStatus(request.getReadinessStatus());
        }

        Room saved = roomRepository.save(room);
        return mapToResponse(saved);
    }

    @Transactional
    public RoomResponse updateReadinessStatus(Long id, ReadinessStatus readinessStatus) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
        room.setReadinessStatus(readinessStatus);
        if (readinessStatus == ReadinessStatus.READY_FOR_USE) {
            room.setLastCleanedAt(LocalDateTime.now());
        }
        Room saved = roomRepository.save(room);
        return mapToResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));

        long bedCount = bedRepository.countByRoom_RoomId(id);
        if (bedCount > 0) {
            throw new BadRequestException("Cannot delete room '" + room.getRoomNumber() + "' because it has "
                    + bedCount + " bed(s). Please remove all child beds first.");
        }

        roomRepository.delete(room);
    }

    public RoomResponse mapToResponse(Room rm) {
        RoomResponse r = new RoomResponse();
        r.setRoomId(rm.getRoomId());
        r.setWardId(rm.getWard().getWardId());
        r.setWardCode(rm.getWard().getWardCode());
        r.setWardName(rm.getWard().getName());
        if (rm.getWard().getFloor() != null) {
            r.setFloorId(rm.getWard().getFloor().getFloorId());
            r.setFloorName(rm.getWard().getFloor().getFloorName());
            if (rm.getWard().getFloor().getBuilding() != null) {
                r.setBuildingId(rm.getWard().getFloor().getBuilding().getBuildingId());
                r.setBuildingName(rm.getWard().getFloor().getBuilding().getName());
                if (rm.getWard().getFloor().getBuilding().getHospital() != null) {
                    r.setHospitalId(rm.getWard().getFloor().getBuilding().getHospital().getHospitalId());
                    r.setHospitalName(rm.getWard().getFloor().getBuilding().getHospital().getName());
                }
            }
        }
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
}
