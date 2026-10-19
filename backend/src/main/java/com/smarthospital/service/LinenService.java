package com.smarthospital.service;

import com.smarthospital.dto.*;
import com.smarthospital.exception.DuplicateResourceException;
import com.smarthospital.exception.ResourceNotFoundException;
import com.smarthospital.model.Bed;
import com.smarthospital.model.Linen;
import com.smarthospital.model.LinenHistory;
import com.smarthospital.model.Ward;
import com.smarthospital.model.enums.DamageStatus;
import com.smarthospital.model.enums.LinenStatus;
import com.smarthospital.model.enums.LinenType;
import com.smarthospital.repository.BedRepository;
import com.smarthospital.repository.LinenHistoryRepository;
import com.smarthospital.repository.LinenRepository;
import com.smarthospital.repository.WardRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LinenService {

    private final LinenRepository linenRepository;
    private final LinenHistoryRepository linenHistoryRepository;
    private final BedRepository bedRepository;
    private final WardRepository wardRepository;

    public LinenService(LinenRepository linenRepository,
                        LinenHistoryRepository linenHistoryRepository,
                        BedRepository bedRepository,
                        WardRepository wardRepository) {
        this.linenRepository = linenRepository;
        this.linenHistoryRepository = linenHistoryRepository;
        this.bedRepository = bedRepository;
        this.wardRepository = wardRepository;
    }

    private String getCurrentStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
            return auth.getName();
        }
        return "Clinical Operations Staff";
    }

    @Transactional
    public LinenResponse create(LinenRequest request) {
        String code = request.getLinenCode().trim();
        if (linenRepository.existsByLinenCode(code)) {
            throw new DuplicateResourceException("Linen tracking identifier '" + code + "' already registered in platform.");
        }

        Linen linen = new Linen();
        linen.setLinenCode(code);
        linen.setLinenType(request.getLinenType());
        linen.setStatus(request.getStatus() != null ? request.getStatus() : LinenStatus.CLEAN);
        linen.setCurrentLocation(request.getCurrentLocation() != null && !request.getCurrentLocation().trim().isEmpty() 
                ? request.getCurrentLocation().trim() : "Central Linen Storage");
        linen.setWashCycleCount(request.getWashCycleCount() != null ? request.getWashCycleCount() : 0);
        linen.setMaxWashCycles(request.getMaxWashCycles() != null ? request.getMaxWashCycles() : 60);
        linen.setIssueDate(request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now());
        linen.setLastWashedDate(request.getLastWashedDate());
        linen.setDamageStatus(request.getDamageStatus() != null ? request.getDamageStatus() : DamageStatus.NONE);
        linen.setDamageNotes(request.getDamageNotes());

        if (request.getAssignedBedId() != null) {
            Bed bed = bedRepository.findById(request.getAssignedBedId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + request.getAssignedBedId()));
            linen.setAssignedBed(bed);
            if (bed.getRoom() != null && bed.getRoom().getWard() != null) {
                linen.setAssignedWard(bed.getRoom().getWard());
                linen.setCurrentLocation("Ward: " + bed.getRoom().getWard().getName() + " - Bed: " + bed.getBedNumber());
            }
        } else if (request.getAssignedWardId() != null) {
            Ward ward = wardRepository.findById(request.getAssignedWardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ward not found with ID: " + request.getAssignedWardId()));
            linen.setAssignedWard(ward);
        }

        Linen saved = linenRepository.save(linen);

        // Record initial history event
        LinenHistory history = new LinenHistory(
                saved,
                "INITIAL_REGISTRATION",
                null,
                saved.getStatus(),
                null,
                saved.getCurrentLocation(),
                saved.getAssignedBed() != null ? saved.getAssignedBed().getBedNumber() : null,
                saved.getWashCycleCount(),
                getCurrentStaff(),
                "New linen asset issued and registered into platform inventory."
        );
        linenHistoryRepository.save(history);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LinenResponse> getAll(String keyword, LinenType linenType, LinenStatus status, DamageStatus damageStatus, Long bedId) {
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        List<Linen> list = linenRepository.searchLinen(kw, linenType, status, damageStatus, bedId);
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LinenResponse getById(Long id) {
        Linen linen = linenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Linen item not found with ID: " + id));
        return mapToResponse(linen);
    }

    @Transactional
    public LinenResponse update(Long id, LinenRequest request) {
        Linen linen = linenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Linen item not found with ID: " + id));

        String newCode = request.getLinenCode().trim();
        if (!linen.getLinenCode().equalsIgnoreCase(newCode) && linenRepository.existsByLinenCode(newCode)) {
            throw new DuplicateResourceException("Linen tracking identifier '" + newCode + "' is already assigned to another item.");
        }

        LinenStatus prevStatus = linen.getStatus();
        String prevLocation = linen.getCurrentLocation();

        linen.setLinenCode(newCode);
        linen.setLinenType(request.getLinenType());
        if (request.getStatus() != null) linen.setStatus(request.getStatus());
        if (request.getCurrentLocation() != null) linen.setCurrentLocation(request.getCurrentLocation().trim());
        if (request.getWashCycleCount() != null) linen.setWashCycleCount(request.getWashCycleCount());
        if (request.getMaxWashCycles() != null) linen.setMaxWashCycles(request.getMaxWashCycles());
        if (request.getIssueDate() != null) linen.setIssueDate(request.getIssueDate());
        if (request.getLastWashedDate() != null) linen.setLastWashedDate(request.getLastWashedDate());
        if (request.getDamageStatus() != null) linen.setDamageStatus(request.getDamageStatus());
        linen.setDamageNotes(request.getDamageNotes());

        if (request.getAssignedBedId() != null) {
            Bed bed = bedRepository.findById(request.getAssignedBedId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + request.getAssignedBedId()));
            linen.setAssignedBed(bed);
        } else {
            linen.setAssignedBed(null);
        }

        Linen updated = linenRepository.save(linen);

        LinenHistory history = new LinenHistory(
                updated,
                "RECORD_UPDATED",
                prevStatus,
                updated.getStatus(),
                prevLocation,
                updated.getCurrentLocation(),
                updated.getAssignedBed() != null ? updated.getAssignedBed().getBedNumber() : null,
                updated.getWashCycleCount(),
                getCurrentStaff(),
                "Linen specifications and attributes updated."
        );
        linenHistoryRepository.save(history);

        return mapToResponse(updated);
    }

    @Transactional
    public LinenResponse updateStatus(Long id, LinenStatusUpdateRequest request) {
        Linen linen = linenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Linen item not found with ID: " + id));

        LinenStatus prevStatus = linen.getStatus();
        String prevLocation = linen.getCurrentLocation();
        LinenStatus nextStatus = request.getStatus();

        linen.setStatus(nextStatus);

        if (request.getNewLocation() != null && !request.getNewLocation().trim().isEmpty()) {
            linen.setCurrentLocation(request.getNewLocation().trim());
        } else if (nextStatus == LinenStatus.IN_LAUNDRY) {
            linen.setCurrentLocation("Hospital Laundry Facility");
            linen.setAssignedBed(null);
        } else if (nextStatus == LinenStatus.CLEAN && (linen.getAssignedBed() == null)) {
            linen.setCurrentLocation("Clean Linen Storage");
        } else if (nextStatus == LinenStatus.DUE_FOR_CHANGE) {
            // keep current bed location, marked for laundry team pickup
        }

        Linen updated = linenRepository.save(linen);

        String note = (request.getNotes() != null && !request.getNotes().trim().isEmpty()) 
                ? request.getNotes().trim() : ("Status transitioned from " + prevStatus + " to " + nextStatus);

        LinenHistory history = new LinenHistory(
                updated,
                "STATUS_TRANSITION",
                prevStatus,
                nextStatus,
                prevLocation,
                updated.getCurrentLocation(),
                updated.getAssignedBed() != null ? updated.getAssignedBed().getBedNumber() : null,
                updated.getWashCycleCount(),
                getCurrentStaff(),
                note
        );
        linenHistoryRepository.save(history);

        return mapToResponse(updated);
    }

    @Transactional
    public LinenResponse assignBed(Long id, LinenAssignRequest request) {
        Linen linen = linenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Linen item not found with ID: " + id));

        LinenStatus prevStatus = linen.getStatus();
        String prevLocation = linen.getCurrentLocation();

        if (request.getBedId() != null) {
            Bed bed = bedRepository.findById(request.getBedId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + request.getBedId()));

            linen.setAssignedBed(bed);
            linen.setStatus(LinenStatus.IN_USE);

            String roomStr = bed.getRoom() != null ? ("Room " + bed.getRoom().getRoomNumber()) : "Ward Room";
            String wardStr = (bed.getRoom() != null && bed.getRoom().getWard() != null) ? bed.getRoom().getWard().getName() : "Inpatient Ward";
            linen.setCurrentLocation(request.getLocation() != null && !request.getLocation().trim().isEmpty() 
                    ? request.getLocation().trim() : (wardStr + " - " + roomStr + " - Bed " + bed.getBedNumber()));

            Linen updated = linenRepository.save(linen);

            LinenHistory history = new LinenHistory(
                    updated,
                    "BED_ASSIGNMENT",
                    prevStatus,
                    LinenStatus.IN_USE,
                    prevLocation,
                    updated.getCurrentLocation(),
                    bed.getBedNumber(),
                    updated.getWashCycleCount(),
                    getCurrentStaff(),
                    request.getNotes() != null ? request.getNotes() : ("Assigned to " + bed.getBedNumber() + " for clinical occupancy.")
            );
            linenHistoryRepository.save(history);

            return mapToResponse(updated);
        } else {
            // Unassign
            linen.setAssignedBed(null);
            if (linen.getStatus() == LinenStatus.IN_USE) {
                linen.setStatus(LinenStatus.DUE_FOR_CHANGE);
            }
            if (request.getLocation() != null && !request.getLocation().trim().isEmpty()) {
                linen.setCurrentLocation(request.getLocation().trim());
            } else {
                linen.setCurrentLocation("Soiled Linen Collection Bay");
            }

            Linen updated = linenRepository.save(linen);

            LinenHistory history = new LinenHistory(
                    updated,
                    "BED_UNASSIGNMENT",
                    prevStatus,
                    updated.getStatus(),
                    prevLocation,
                    updated.getCurrentLocation(),
                    null,
                    updated.getWashCycleCount(),
                    getCurrentStaff(),
                    request.getNotes() != null ? request.getNotes() : "Unassigned from clinical bed."
            );
            linenHistoryRepository.save(history);

            return mapToResponse(updated);
        }
    }

    @Transactional
    public LinenResponse completeWash(Long id, LinenWashRequest request) {
        Linen linen = linenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Linen item not found with ID: " + id));

        LinenStatus prevStatus = linen.getStatus();
        String prevLocation = linen.getCurrentLocation();

        linen.setWashCycleCount(linen.getWashCycleCount() + 1);
        linen.setLastWashedDate(LocalDate.now());
        linen.setStatus(LinenStatus.CLEAN);
        linen.setAssignedBed(null);

        String newLoc = (request.getNewLocation() != null && !request.getNewLocation().trim().isEmpty())
                ? request.getNewLocation().trim() : "Central Clean Linen Bay";
        linen.setCurrentLocation(newLoc);

        // Check if wash cycles exceed threshold
        String cycleAlert = "";
        if (linen.getWashCycleCount() >= linen.getMaxWashCycles()) {
            cycleAlert = " [ALERT: Max wash cycle limit reached: " + linen.getWashCycleCount() + "/" + linen.getMaxWashCycles() + ". Inspection recommended.]";
        }

        Linen updated = linenRepository.save(linen);

        String washNote = "Thermal wash & disinfection completed (Temp: " + request.getWaterTemperatureCelsius() + "°C). Cycle #" + updated.getWashCycleCount() + "." + cycleAlert;
        if (request.getNotes() != null && !request.getNotes().trim().isEmpty()) {
            washNote += " " + request.getNotes().trim();
        }

        LinenHistory history = new LinenHistory(
                updated,
                "WASH_AND_STERILIZATION",
                prevStatus,
                LinenStatus.CLEAN,
                prevLocation,
                updated.getCurrentLocation(),
                null,
                updated.getWashCycleCount(),
                getCurrentStaff(),
                washNote
        );
        linenHistoryRepository.save(history);

        return mapToResponse(updated);
    }

    @Transactional
    public LinenResponse reportDamage(Long id, LinenDamageRequest request) {
        Linen linen = linenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Linen item not found with ID: " + id));

        LinenStatus prevStatus = linen.getStatus();
        DamageStatus prevDamage = linen.getDamageStatus();

        linen.setDamageStatus(request.getDamageStatus());
        linen.setDamageNotes(request.getDamageNotes());

        if (request.isRetireIfSevere() || request.getDamageStatus() == DamageStatus.SEVERELY_DAMAGED) {
            linen.setStatus(LinenStatus.RETIRED);
            linen.setCurrentLocation("Hazard / Discard Quarantine Storage");
            linen.setAssignedBed(null);
        } else if (request.getDamageStatus() != DamageStatus.NONE && request.getDamageStatus() != DamageStatus.MINOR_WEAR) {
            linen.setStatus(LinenStatus.DAMAGED);
        }

        Linen updated = linenRepository.save(linen);

        String note = "Damage reported: " + request.getDamageStatus() + ". Notes: " + (request.getDamageNotes() != null ? request.getDamageNotes() : "None");

        LinenHistory history = new LinenHistory(
                updated,
                "DAMAGE_REPORTED",
                prevStatus,
                updated.getStatus(),
                linen.getCurrentLocation(),
                updated.getCurrentLocation(),
                updated.getAssignedBed() != null ? updated.getAssignedBed().getBedNumber() : null,
                updated.getWashCycleCount(),
                getCurrentStaff(),
                note
        );
        linenHistoryRepository.save(history);

        return mapToResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        Linen linen = linenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Linen item not found with ID: " + id));
        linenRepository.delete(linen);
    }

    @Transactional(readOnly = true)
    public List<LinenHistoryResponse> getHistory(Long id) {
        if (!linenRepository.existsById(id)) {
            throw new ResourceNotFoundException("Linen item not found with ID: " + id);
        }
        List<LinenHistory> historyList = linenHistoryRepository.findByLinenIdOrderByRecordedAtDesc(id);
        return historyList.stream().map(this::mapHistoryToResponse).collect(Collectors.toList());
    }

    @Transactional
    public LinenHistoryResponse addHistoryNote(Long id, String note, String performedBy) {
        Linen linen = linenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Linen item not found with ID: " + id));

        LinenHistory history = new LinenHistory(
                linen,
                "STAFF_AUDIT_NOTE",
                linen.getStatus(),
                linen.getStatus(),
                linen.getCurrentLocation(),
                linen.getCurrentLocation(),
                linen.getAssignedBed() != null ? linen.getAssignedBed().getBedNumber() : null,
                linen.getWashCycleCount(),
                performedBy != null && !performedBy.trim().isEmpty() ? performedBy.trim() : getCurrentStaff(),
                note
        );
        LinenHistory saved = linenHistoryRepository.save(history);
        return mapHistoryToResponse(saved);
    }

    @Transactional(readOnly = true)
    public LinenStatsResponse getStats() {
        LinenStatsResponse stats = new LinenStatsResponse();
        stats.setTotalLinen(linenRepository.count());
        stats.setCleanCount(linenRepository.countByStatus(LinenStatus.CLEAN));
        stats.setInUseCount(linenRepository.countByStatus(LinenStatus.IN_USE));
        stats.setDueForChangeCount(linenRepository.countByStatus(LinenStatus.DUE_FOR_CHANGE));
        stats.setInLaundryCount(linenRepository.countByStatus(LinenStatus.IN_LAUNDRY));
        stats.setDamagedCount(linenRepository.countByStatus(LinenStatus.DAMAGED));
        stats.setRetiredCount(linenRepository.countByStatus(LinenStatus.RETIRED));

        Map<LinenType, Long> typeMap = new EnumMap<>(LinenType.class);
        for (LinenType t : LinenType.values()) {
            typeMap.put(t, linenRepository.countByLinenType(t));
        }
        stats.setTypeCounts(typeMap);

        Map<LinenStatus, Long> statusMap = new EnumMap<>(LinenStatus.class);
        for (LinenStatus s : LinenStatus.values()) {
            statusMap.put(s, linenRepository.countByStatus(s));
        }
        stats.setStatusCounts(statusMap);

        return stats;
    }

    private LinenResponse mapToResponse(Linen linen) {
        LinenResponse res = new LinenResponse();
        res.setLinenId(linen.getLinenId());
        res.setLinenCode(linen.getLinenCode());
        res.setLinenType(linen.getLinenType());
        res.setStatus(linen.getStatus());
        res.setCurrentLocation(linen.getCurrentLocation());
        res.setLastWashedDate(linen.getLastWashedDate());
        res.setWashCycleCount(linen.getWashCycleCount());
        res.setMaxWashCycles(linen.getMaxWashCycles());
        res.setIssueDate(linen.getIssueDate());
        res.setDamageStatus(linen.getDamageStatus());
        res.setDamageNotes(linen.getDamageNotes());
        res.setCreatedAt(linen.getCreatedAt());
        res.setUpdatedAt(linen.getUpdatedAt());

        if (linen.getAssignedBed() != null) {
            Bed bed = linen.getAssignedBed();
            res.setAssignedBedId(bed.getBedId());
            res.setAssignedBedNumber(bed.getBedNumber());
            if (bed.getRoom() != null) {
                res.setAssignedRoomId(bed.getRoom().getRoomId());
                res.setAssignedRoomNumber(bed.getRoom().getRoomNumber());
                if (bed.getRoom().getWard() != null) {
                    res.setAssignedWardId(bed.getRoom().getWard().getWardId());
                    res.setAssignedWardName(bed.getRoom().getWard().getName());
                }
            }
        }

        if (linen.getHistoryRecords() != null) {
            res.setHistoryCount(linen.getHistoryRecords().size());
        }

        return res;
    }

    private LinenHistoryResponse mapHistoryToResponse(LinenHistory h) {
        LinenHistoryResponse res = new LinenHistoryResponse();
        res.setHistoryId(h.getHistoryId());
        res.setLinenId(h.getLinen().getLinenId());
        res.setLinenCode(h.getLinen().getLinenCode());
        res.setAction(h.getAction());
        res.setPreviousStatus(h.getPreviousStatus());
        res.setNewStatus(h.getNewStatus());
        res.setPreviousLocation(h.getPreviousLocation());
        res.setNewLocation(h.getNewLocation());
        res.setAssignedBedNumber(h.getAssignedBedNumber());
        res.setWashCycleCountAtEvent(h.getWashCycleCountAtEvent());
        res.setPerformedBy(h.getPerformedBy());
        res.setNotes(h.getNotes());
        res.setRecordedAt(h.getRecordedAt());
        return res;
    }
}
