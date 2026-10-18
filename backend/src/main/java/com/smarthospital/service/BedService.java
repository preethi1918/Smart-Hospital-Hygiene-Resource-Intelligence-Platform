package com.smarthospital.service;

import com.smarthospital.dto.BedRequest;
import com.smarthospital.dto.BedResponse;
import com.smarthospital.exception.BadRequestException;
import com.smarthospital.exception.DuplicateResourceException;
import com.smarthospital.exception.ResourceNotFoundException;
import com.smarthospital.model.Bed;
import com.smarthospital.model.Room;
import com.smarthospital.model.enums.BedType;
import com.smarthospital.model.enums.OperationalStatus;
import com.smarthospital.repository.BedRepository;
import com.smarthospital.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BedService {

    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;

    public BedService(BedRepository bedRepository, RoomRepository roomRepository) {
        this.bedRepository = bedRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional
    public BedResponse create(BedRequest request) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + request.getRoomId()));

        String qr = request.getQrCodeIdentifier().trim();
        bedRepository.findByQrCodeIdentifier(qr).ifPresent(existing -> {
            throw new DuplicateResourceException("QR code identifier '" + qr + "' already assigned to bed ID " + existing.getBedId());
        });

        String bedNum = request.getBedNumber().trim();
        bedRepository.findByRoom_RoomIdAndBedNumber(room.getRoomId(), bedNum).ifPresent(existing -> {
            throw new DuplicateResourceException("Bed number '" + bedNum + "' already exists in room '" + room.getRoomNumber() + "'");
        });

        Bed bed = new Bed();
        bed.setRoom(room);
        bed.setBedNumber(bedNum);
        bed.setQrCodeIdentifier(qr);
        bed.setBedType(request.getBedType());
        if (request.getOperationalStatus() != null) {
            bed.setOperationalStatus(request.getOperationalStatus());
        }
        bed.setCurrentOccupancyReference(request.getCurrentOccupancyReference());

        Bed saved = bedRepository.save(bed);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BedResponse> getAll(Long roomId, Integer wardId, OperationalStatus operationalStatus, BedType bedType, String keyword) {
        List<Bed> list;
        if (roomId != null) {
            list = bedRepository.findByRoom_RoomId(roomId);
        } else if (wardId != null) {
            list = bedRepository.findByRoom_Ward_WardId(wardId);
        } else if (operationalStatus != null) {
            list = bedRepository.findByOperationalStatus(operationalStatus);
        } else if (bedType != null) {
            list = bedRepository.findByBedType(bedType);
        } else if (keyword != null && !keyword.isBlank()) {
            list = bedRepository.findByBedNumberContainingIgnoreCase(keyword.trim());
        } else {
            list = bedRepository.findAll();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BedResponse getById(Long id) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + id));
        return mapToResponse(bed);
    }

    @Transactional
    public BedResponse update(Long id, BedRequest request) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + id));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + request.getRoomId()));

        String qr = request.getQrCodeIdentifier().trim();
        bedRepository.findByQrCodeIdentifier(qr).ifPresent(existing -> {
            if (!existing.getBedId().equals(id)) {
                throw new DuplicateResourceException("QR code identifier '" + qr + "' already in use by another bed");
            }
        });

        String bedNum = request.getBedNumber().trim();
        bedRepository.findByRoom_RoomIdAndBedNumber(room.getRoomId(), bedNum).ifPresent(existing -> {
            if (!existing.getBedId().equals(id)) {
                throw new DuplicateResourceException("Bed number '" + bedNum + "' already exists in room '" + room.getRoomNumber() + "'");
            }
        });

        bed.setRoom(room);
        bed.setBedNumber(bedNum);
        bed.setQrCodeIdentifier(qr);
        bed.setBedType(request.getBedType());
        if (request.getOperationalStatus() != null) {
            bed.setOperationalStatus(request.getOperationalStatus());
        }
        bed.setCurrentOccupancyReference(request.getCurrentOccupancyReference());

        Bed saved = bedRepository.save(bed);
        return mapToResponse(saved);
    }

    @Transactional
    public BedResponse updateOperationalStatus(Long id, OperationalStatus status) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + id));
        bed.setOperationalStatus(status);
        if (status == OperationalStatus.VACANT_CLEAN) {
            bed.setLastBedsheetChangeAt(LocalDateTime.now());
            bed.setCurrentOccupancyReference(null);
        }
        Bed saved = bedRepository.save(bed);
        return mapToResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + id));

        if (bed.getOperationalStatus() == OperationalStatus.OCCUPIED) {
            throw new BadRequestException("Cannot delete bed '" + bed.getBedNumber() + "' while it is currently occupied. Please discharge or transfer patient first.");
        }

        bedRepository.delete(bed);
    }

    public BedResponse mapToResponse(Bed b) {
        BedResponse r = new BedResponse();
        r.setBedId(b.getBedId());
        r.setRoomId(b.getRoom().getRoomId());
        r.setRoomNumber(b.getRoom().getRoomNumber());
        if (b.getRoom().getWard() != null) {
            r.setWardId(b.getRoom().getWard().getWardId());
            r.setWardCode(b.getRoom().getWard().getWardCode());
            r.setWardName(b.getRoom().getWard().getName());
            if (b.getRoom().getWard().getFloor() != null) {
                r.setFloorId(b.getRoom().getWard().getFloor().getFloorId());
                r.setFloorName(b.getRoom().getWard().getFloor().getFloorName());
                if (b.getRoom().getWard().getFloor().getBuilding() != null) {
                    r.setBuildingId(b.getRoom().getWard().getFloor().getBuilding().getBuildingId());
                    r.setBuildingName(b.getRoom().getWard().getFloor().getBuilding().getName());
                    if (b.getRoom().getWard().getFloor().getBuilding().getHospital() != null) {
                        r.setHospitalId(b.getRoom().getWard().getFloor().getBuilding().getHospital().getHospitalId());
                        r.setHospitalName(b.getRoom().getWard().getFloor().getBuilding().getHospital().getName());
                    }
                }
            }
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
