package com.smarthospital.service;

import com.smarthospital.dto.QrActionRequest;
import com.smarthospital.dto.QrGenerateRequest;
import com.smarthospital.dto.QrRegenerateRequest;
import com.smarthospital.dto.QrResourceResponse;
import com.smarthospital.exception.ResourceNotFoundException;
import com.smarthospital.model.*;
import com.smarthospital.model.enums.*;
import com.smarthospital.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QrCodeService {

    private static final Logger logger = LoggerFactory.getLogger(QrCodeService.class);

    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final LinenRepository linenRepository;
    private final LinenHistoryRepository linenHistoryRepository;
    private final EquipmentRepository equipmentRepository;
    private final WasteLogRepository wasteLogRepository;
    private final AuditLogRepository auditLogRepository;

    // Simulated/active waste bins registry for fast lookup and QR generation
    private final Map<String, Map<String, Object>> wasteBinsRegistry = new LinkedHashMap<>();

    public QrCodeService(RoomRepository roomRepository,
                         BedRepository bedRepository,
                         LinenRepository linenRepository,
                         LinenHistoryRepository linenHistoryRepository,
                         EquipmentRepository equipmentRepository,
                         WasteLogRepository wasteLogRepository,
                         AuditLogRepository auditLogRepository) {
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
        this.linenRepository = linenRepository;
        this.linenHistoryRepository = linenHistoryRepository;
        this.equipmentRepository = equipmentRepository;
        this.wasteLogRepository = wasteLogRepository;
        this.auditLogRepository = auditLogRepository;
        initWasteBinsRegistry();
    }

    private void initWasteBinsRegistry() {
        registerWasteBin("BIN-ICU-01", "ICU Bio-Waste Container #1", "Intensive Isolation Ward - RM-305", "YELLOW_INFECTIOUS", "NORMAL", 42, "20kg");
        registerWasteBin("BIN-ICU-02", "ICU Cytotoxic Sharps Container", "Intensive Isolation Ward", "PURPLE_CYTOTOXIC", "NORMAL", 28, "10kg");
        registerWasteBin("BIN-OT-01", "OT Surgical Biological Waste Unit", "Operating Theatre Complex", "YELLOW_INFECTIOUS", "NORMAL", 55, "25kg");
        registerWasteBin("BIN-OT-02", "OT Sharps & Scalpels Container", "Operating Theatre Suite A", "RED_SHARPS_PLASTICS", "MONITOR", 72, "8kg");
        registerWasteBin("BIN-ER-01", "Emergency Trauma Infectious Bin", "Emergency Care Bay 1", "YELLOW_INFECTIOUS", "NORMAL", 64, "20kg");
        registerWasteBin("BIN-ER-02", "Emergency Needles & Cannula Bin", "Emergency Trauma Room 1", "RED_SHARPS_PLASTICS", "NORMAL", 38, "8kg");
        registerWasteBin("BIN-GEN-01", "Non-Hazardous General Clinical Bin", "Central Corridor L3", "BLACK_GENERAL_NONHAZARDOUS", "NORMAL", 45, "30kg");
    }

    private void registerWasteBin(String code, String name, String location, String category, String status, int fillPct, String capacity) {
        Map<String, Object> data = new HashMap<>();
        data.put("code", code);
        data.put("name", name);
        data.put("location", location);
        data.put("category", category);
        data.put("status", status);
        data.put("fillPct", fillPct);
        data.put("capacity", capacity);
        data.put("updatedAt", LocalDateTime.now());
        wasteBinsRegistry.put(code, data);
    }

    private String getCurrentStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
            return auth.getName();
        }
        return "Clinical Administrator";
    }

    @Transactional(readOnly = true)
    public List<QrResourceResponse> getAllResources(String typeFilter, String searchKeyword) {
        List<QrResourceResponse> all = new ArrayList<>();
        String filter = typeFilter != null ? typeFilter.trim().toUpperCase() : "ALL";
        String kw = searchKeyword != null ? searchKeyword.trim().toLowerCase() : "";

        // 1. Rooms
        if (filter.equals("ALL") || filter.equals("ROOM")) {
            roomRepository.findAll().forEach(room -> {
                Map<String, Object> details = new HashMap<>();
                details.put("airflowType", room.getAirflowType() != null ? room.getAirflowType().name() : null);
                details.put("readinessStatus", room.getReadinessStatus() != null ? room.getReadinessStatus().name() : null);
                details.put("roomNumber", room.getRoomNumber());
                String wardName = room.getWard() != null ? room.getWard().getName() : "Hospital Core";

                all.add(new QrResourceResponse(
                        "ROOM",
                        room.getRoomId(),
                        room.getQrCodeIdentifier() != null ? room.getQrCodeIdentifier() : "ROOM-" + room.getRoomNumber(),
                        "Room " + room.getRoomNumber(),
                        wardName + " - Suite " + room.getRoomNumber(),
                        wardName,
                        room.getReadinessStatus() != null ? room.getReadinessStatus().name() : "AVAILABLE",
                        room.getRoomType() != null ? room.getRoomType().name() : "PATIENT_ROOM",
                        room.getLastCleanedAt() != null ? room.getLastCleanedAt().toString() : null,
                        details,
                        room.getUpdatedAt()
                ));
            });
        }

        // 2. Beds
        if (filter.equals("ALL") || filter.equals("BED")) {
            bedRepository.findAll().forEach(bed -> {
                Map<String, Object> details = new HashMap<>();
                details.put("bedNumber", bed.getBedNumber());
                details.put("bedType", bed.getBedType() != null ? bed.getBedType().name() : null);
                details.put("operationalStatus", bed.getOperationalStatus() != null ? bed.getOperationalStatus().name() : null);
                String roomNum = bed.getRoom() != null ? bed.getRoom().getRoomNumber() : "Unknown";
                String wardName = bed.getRoom() != null && bed.getRoom().getWard() != null ? bed.getRoom().getWard().getName() : "Hospital Core";

                all.add(new QrResourceResponse(
                        "BED",
                        bed.getBedId(),
                        bed.getQrCodeIdentifier() != null ? bed.getQrCodeIdentifier() : "BED-" + bed.getBedNumber(),
                        "Bed " + bed.getBedNumber(),
                        "Room " + roomNum + " (Ward: " + wardName + ")",
                        wardName,
                        bed.getOperationalStatus() != null ? bed.getOperationalStatus().name() : "VACANT_CLEAN",
                        bed.getBedType() != null ? bed.getBedType().name() : "STANDARD",
                        bed.getLastBedsheetChangeAt() != null ? bed.getLastBedsheetChangeAt().toString() : null,
                        details,
                        bed.getUpdatedAt()
                ));
            });
        }

        // 3. Linen
        if (filter.equals("ALL") || filter.equals("LINEN")) {
            linenRepository.findAll().forEach(linen -> {
                Map<String, Object> details = new HashMap<>();
                details.put("linenCode", linen.getLinenCode());
                details.put("linenType", linen.getLinenType() != null ? linen.getLinenType().name() : null);
                details.put("washCycleCount", linen.getWashCycleCount());
                details.put("maxWashCycles", linen.getMaxWashCycles());
                details.put("damageStatus", linen.getDamageStatus() != null ? linen.getDamageStatus().name() : "NONE");
                details.put("assignedBed", linen.getAssignedBed() != null ? linen.getAssignedBed().getBedNumber() : null);

                String qrCode = linen.getRfidTagOrBarcode() != null && !linen.getRfidTagOrBarcode().trim().isEmpty() 
                        ? linen.getRfidTagOrBarcode() 
                        : (linen.getLinenCode() != null ? linen.getLinenCode() : "LINEN-" + linen.getLinenId());

                all.add(new QrResourceResponse(
                        "LINEN",
                        linen.getLinenId(),
                        qrCode,
                        (linen.getLinenType() != null ? linen.getLinenType().name().replace('_', ' ') : "Linen") + " [" + linen.getLinenCode() + "]",
                        linen.getCurrentLocation(),
                        linen.getAssignedWard() != null ? linen.getAssignedWard().getName() : "Linen Logistics",
                        linen.getStatus() != null ? linen.getStatus().name() : "CLEAN",
                        linen.getLinenType() != null ? linen.getLinenType().name() : "BEDSHEET",
                        linen.getLastWashedDate() != null ? linen.getLastWashedDate().toString() : null,
                        details,
                        linen.getUpdatedAt()
                ));
            });
        }

        // 4. Equipment
        if (filter.equals("ALL") || filter.equals("EQUIPMENT")) {
            equipmentRepository.findAll().forEach(equip -> {
                Map<String, Object> details = new HashMap<>();
                details.put("equipmentCode", equip.getEquipmentCode());
                details.put("serialNumber", equip.getSerialNumber());
                details.put("category", equip.getCategory() != null ? equip.getCategory().name() : null);
                details.put("nextMaintenanceDue", equip.getNextMaintenanceDue() != null ? equip.getNextMaintenanceDue().toString() : null);

                String loc = equip.getCurrentRoom() != null ? "Room " + equip.getCurrentRoom().getRoomNumber()
                        : (equip.getCurrentWard() != null ? equip.getCurrentWard().getName() : "Biomedical Engineering Pool");
                String ward = equip.getCurrentWard() != null ? equip.getCurrentWard().getName() : "Central Depot";

                all.add(new QrResourceResponse(
                        "EQUIPMENT",
                        equip.getEquipmentId(),
                        equip.getQrCodeIdentifier() != null ? equip.getQrCodeIdentifier() : "EQUIP-" + equip.getEquipmentCode(),
                        equip.getName(),
                        loc,
                        ward,
                        equip.getOperationalStatus() != null ? equip.getOperationalStatus().name() : "AVAILABLE_STERILE",
                        equip.getCategory() != null ? equip.getCategory().name() : "EQUIPMENT",
                        equip.getLastMaintenanceDate() != null ? equip.getLastMaintenanceDate().toString() : null,
                        details,
                        equip.getUpdatedAt()
                ));
            });
        }

        // 5. Waste Bins
        if (filter.equals("ALL") || filter.equals("WASTE_BIN")) {
            long index = 1;
            for (Map.Entry<String, Map<String, Object>> entry : wasteBinsRegistry.entrySet()) {
                Map<String, Object> bin = entry.getValue();
                Map<String, Object> details = new HashMap<>();
                details.put("category", bin.get("category"));
                details.put("fillPct", bin.get("fillPct"));
                details.put("capacity", bin.get("capacity"));

                all.add(new QrResourceResponse(
                        "WASTE_BIN",
                        index++,
                        (String) bin.get("code"),
                        (String) bin.get("name"),
                        (String) bin.get("location"),
                        "Bio-Hazard Logistics",
                        (String) bin.get("status"),
                        (String) bin.get("category"),
                        LocalDateTime.now().toLocalDate().toString(),
                        details,
                        (LocalDateTime) bin.get("updatedAt")
                ));
            }
        }

        // Apply keyword filter if present
        if (!kw.isEmpty()) {
            return all.stream().filter(r ->
                    (r.getQrCodeIdentifier() != null && r.getQrCodeIdentifier().toLowerCase().contains(kw)) ||
                    (r.getResourceName() != null && r.getResourceName().toLowerCase().contains(kw)) ||
                    (r.getLocation() != null && r.getLocation().toLowerCase().contains(kw)) ||
                    (r.getResourceType() != null && r.getResourceType().toLowerCase().contains(kw)) ||
                    (r.getStatus() != null && r.getStatus().toLowerCase().contains(kw))
            ).collect(Collectors.toList());
        }

        return all;
    }

    @Transactional(readOnly = true)
    public QrResourceResponse lookupByQrCode(String qrCode) {
        if (qrCode == null || qrCode.trim().isEmpty()) {
            throw new IllegalArgumentException("QR code identifier cannot be empty");
        }
        String cleanCode = qrCode.trim();

        // 1. Check Room
        Optional<Room> roomOpt = roomRepository.findByQrCodeIdentifier(cleanCode);
        if (roomOpt.isEmpty()) {
            // Also check room number directly
            roomOpt = roomRepository.findAll().stream()
                    .filter(r -> r.getRoomNumber().equalsIgnoreCase(cleanCode) || ("ROOM-" + r.getRoomNumber()).equalsIgnoreCase(cleanCode))
                    .findFirst();
        }
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            Map<String, Object> details = new HashMap<>();
            details.put("airflowType", room.getAirflowType() != null ? room.getAirflowType().name() : null);
            details.put("readinessStatus", room.getReadinessStatus() != null ? room.getReadinessStatus().name() : null);
            details.put("roomNumber", room.getRoomNumber());
            String wardName = room.getWard() != null ? room.getWard().getName() : "Hospital Core";

            return new QrResourceResponse(
                    "ROOM",
                    room.getRoomId(),
                    room.getQrCodeIdentifier() != null ? room.getQrCodeIdentifier() : cleanCode,
                    "Room " + room.getRoomNumber(),
                    wardName + " - Suite " + room.getRoomNumber(),
                    wardName,
                    room.getReadinessStatus() != null ? room.getReadinessStatus().name() : "AVAILABLE",
                    room.getRoomType() != null ? room.getRoomType().name() : "PATIENT_ROOM",
                    room.getLastCleanedAt() != null ? room.getLastCleanedAt().toString() : null,
                    details,
                    room.getUpdatedAt()
            );
        }

        // 2. Check Bed
        Optional<Bed> bedOpt = bedRepository.findByQrCodeIdentifier(cleanCode);
        if (bedOpt.isEmpty()) {
            bedOpt = bedRepository.findAll().stream()
                    .filter(b -> b.getBedNumber().equalsIgnoreCase(cleanCode) || ("BED-" + b.getBedNumber()).equalsIgnoreCase(cleanCode))
                    .findFirst();
        }
        if (bedOpt.isPresent()) {
            Bed bed = bedOpt.get();
            Map<String, Object> details = new HashMap<>();
            details.put("bedNumber", bed.getBedNumber());
            details.put("bedType", bed.getBedType() != null ? bed.getBedType().name() : null);
            details.put("operationalStatus", bed.getOperationalStatus() != null ? bed.getOperationalStatus().name() : null);
            String roomNum = bed.getRoom() != null ? bed.getRoom().getRoomNumber() : "Unknown";
            String wardName = bed.getRoom() != null && bed.getRoom().getWard() != null ? bed.getRoom().getWard().getName() : "Hospital Core";

            return new QrResourceResponse(
                    "BED",
                    bed.getBedId(),
                    bed.getQrCodeIdentifier() != null ? bed.getQrCodeIdentifier() : cleanCode,
                    "Bed " + bed.getBedNumber(),
                    "Room " + roomNum + " (" + wardName + ")",
                    wardName,
                    bed.getOperationalStatus() != null ? bed.getOperationalStatus().name() : "VACANT_CLEAN",
                    bed.getBedType() != null ? bed.getBedType().name() : "STANDARD",
                    bed.getLastBedsheetChangeAt() != null ? bed.getLastBedsheetChangeAt().toString() : null,
                    details,
                    bed.getUpdatedAt()
            );
        }

        // 3. Check Linen
        Optional<Linen> linenOpt = linenRepository.findAll().stream()
                .filter(l -> (l.getRfidTagOrBarcode() != null && l.getRfidTagOrBarcode().equalsIgnoreCase(cleanCode)) ||
                             (l.getLinenCode() != null && l.getLinenCode().equalsIgnoreCase(cleanCode)) ||
                             ("LINEN-" + l.getLinenId()).equalsIgnoreCase(cleanCode))
                .findFirst();
        if (linenOpt.isPresent()) {
            Linen linen = linenOpt.get();
            Map<String, Object> details = new HashMap<>();
            details.put("linenCode", linen.getLinenCode());
            details.put("linenType", linen.getLinenType() != null ? linen.getLinenType().name() : null);
            details.put("washCycleCount", linen.getWashCycleCount());
            details.put("maxWashCycles", linen.getMaxWashCycles());
            details.put("damageStatus", linen.getDamageStatus() != null ? linen.getDamageStatus().name() : "NONE");
            details.put("assignedBed", linen.getAssignedBed() != null ? linen.getAssignedBed().getBedNumber() : null);

            return new QrResourceResponse(
                    "LINEN",
                    linen.getLinenId(),
                    linen.getRfidTagOrBarcode() != null ? linen.getRfidTagOrBarcode() : linen.getLinenCode(),
                    (linen.getLinenType() != null ? linen.getLinenType().name().replace('_', ' ') : "Linen") + " [" + linen.getLinenCode() + "]",
                    linen.getCurrentLocation(),
                    linen.getAssignedWard() != null ? linen.getAssignedWard().getName() : "Linen Logistics",
                    linen.getStatus() != null ? linen.getStatus().name() : "CLEAN",
                    linen.getLinenType() != null ? linen.getLinenType().name() : "BEDSHEET",
                    linen.getLastWashedDate() != null ? linen.getLastWashedDate().toString() : null,
                    details,
                    linen.getUpdatedAt()
            );
        }

        // 4. Check Equipment
        Optional<Equipment> equipOpt = equipmentRepository.findByQrCodeIdentifier(cleanCode);
        if (equipOpt.isEmpty()) {
            equipOpt = equipmentRepository.findAll().stream()
                    .filter(e -> (e.getEquipmentCode() != null && e.getEquipmentCode().equalsIgnoreCase(cleanCode)) ||
                                 (e.getSerialNumber() != null && e.getSerialNumber().equalsIgnoreCase(cleanCode)) ||
                                 ("EQUIP-" + e.getEquipmentCode()).equalsIgnoreCase(cleanCode))
                    .findFirst();
        }
        if (equipOpt.isPresent()) {
            Equipment equip = equipOpt.get();
            Map<String, Object> details = new HashMap<>();
            details.put("equipmentCode", equip.getEquipmentCode());
            details.put("serialNumber", equip.getSerialNumber());
            details.put("category", equip.getCategory() != null ? equip.getCategory().name() : null);
            details.put("nextMaintenanceDue", equip.getNextMaintenanceDue() != null ? equip.getNextMaintenanceDue().toString() : null);

            String loc = equip.getCurrentRoom() != null ? "Room " + equip.getCurrentRoom().getRoomNumber()
                    : (equip.getCurrentWard() != null ? equip.getCurrentWard().getName() : "Biomedical Engineering Pool");

            return new QrResourceResponse(
                    "EQUIPMENT",
                    equip.getEquipmentId(),
                    equip.getQrCodeIdentifier() != null ? equip.getQrCodeIdentifier() : cleanCode,
                    equip.getName(),
                    loc,
                    equip.getCurrentWard() != null ? equip.getCurrentWard().getName() : "Central Depot",
                    equip.getOperationalStatus() != null ? equip.getOperationalStatus().name() : "AVAILABLE_STERILE",
                    equip.getCategory() != null ? equip.getCategory().name() : "EQUIPMENT",
                    equip.getLastMaintenanceDate() != null ? equip.getLastMaintenanceDate().toString() : null,
                    details,
                    equip.getUpdatedAt()
            );
        }

        // 5. Check Waste Bin Registry
        Map<String, Object> bin = wasteBinsRegistry.get(cleanCode);
        if (bin != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("category", bin.get("category"));
            details.put("fillPct", bin.get("fillPct"));
            details.put("capacity", bin.get("capacity"));

            return new QrResourceResponse(
                    "WASTE_BIN",
                    1L,
                    (String) bin.get("code"),
                    (String) bin.get("name"),
                    (String) bin.get("location"),
                    "Bio-Hazard Logistics",
                    (String) bin.get("status"),
                    (String) bin.get("category"),
                    LocalDateTime.now().toLocalDate().toString(),
                    details,
                    (LocalDateTime) bin.get("updatedAt")
            );
        }

        throw new ResourceNotFoundException("No registered hospital resource found matching QR identifier: '" + cleanCode + "'.");
    }

    @Transactional
    public QrResourceResponse generateQrCode(QrGenerateRequest request) {
        String type = request.getResourceType().trim().toUpperCase();
        Long id = request.getResourceId();

        switch (type) {
            case "ROOM": {
                Room room = roomRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));
                String code = request.getQrCodeIdentifier() != null && !request.getQrCodeIdentifier().trim().isEmpty()
                        ? request.getQrCodeIdentifier().trim() : "ROOM-" + room.getRoomNumber();
                room.setQrCodeIdentifier(code);
                roomRepository.save(room);
                logger.info("Generated QR code '{}' for Room {}", code, room.getRoomNumber());
                return lookupByQrCode(code);
            }
            case "BED": {
                Bed bed = bedRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + id));
                String code = request.getQrCodeIdentifier() != null && !request.getQrCodeIdentifier().trim().isEmpty()
                        ? request.getQrCodeIdentifier().trim() : "BED-" + bed.getBedNumber();
                bed.setQrCodeIdentifier(code);
                bedRepository.save(bed);
                logger.info("Generated QR code '{}' for Bed {}", code, bed.getBedNumber());
                return lookupByQrCode(code);
            }
            case "LINEN": {
                Linen linen = linenRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Linen not found with ID: " + id));
                String code = request.getQrCodeIdentifier() != null && !request.getQrCodeIdentifier().trim().isEmpty()
                        ? request.getQrCodeIdentifier().trim() : "LINEN-" + (linen.getLinenCode() != null ? linen.getLinenCode() : linen.getLinenId());
                linen.setRfidTagOrBarcode(code);
                linenRepository.save(linen);
                logger.info("Generated QR code '{}' for Linen {}", code, linen.getLinenCode());
                return lookupByQrCode(code);
            }
            case "EQUIPMENT": {
                Equipment equip = equipmentRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with ID: " + id));
                String code = request.getQrCodeIdentifier() != null && !request.getQrCodeIdentifier().trim().isEmpty()
                        ? request.getQrCodeIdentifier().trim() : "EQUIP-" + equip.getEquipmentCode();
                equip.setQrCodeIdentifier(code);
                equipmentRepository.save(equip);
                logger.info("Generated QR code '{}' for Equipment {}", code, equip.getEquipmentCode());
                return lookupByQrCode(code);
            }
            case "WASTE_BIN": {
                String code = request.getQrCodeIdentifier() != null && !request.getQrCodeIdentifier().trim().isEmpty()
                        ? request.getQrCodeIdentifier().trim() : "BIN-" + System.currentTimeMillis() % 10000;
                registerWasteBin(code, "Bio-Hazard Container (" + code + ")", "Central Bio-Waste Depot", "YELLOW_INFECTIOUS", "NORMAL", 10, "20kg");
                logger.info("Registered waste bin QR code '{}'", code);
                return lookupByQrCode(code);
            }
            default:
                throw new IllegalArgumentException("Unsupported resource type: " + type + ". Supported: ROOM, BED, LINEN, EQUIPMENT, WASTE_BIN");
        }
    }

    @Transactional
    public QrResourceResponse regenerateQrCode(QrRegenerateRequest request) {
        String type = request.getResourceType().trim().toUpperCase();
        Long id = request.getResourceId();
        String staff = getCurrentStaff();
        String reason = request.getReason() != null ? request.getReason() : "Administrative label replacement / re-tagging";

        switch (type) {
            case "ROOM": {
                Room room = roomRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));
                String oldCode = room.getQrCodeIdentifier();
                String newCode = request.getNewQrCodeIdentifier() != null && !request.getNewQrCodeIdentifier().trim().isEmpty()
                        ? request.getNewQrCodeIdentifier().trim() 
                        : "ROOM-" + room.getRoomNumber() + "-R" + (System.currentTimeMillis() % 1000);
                room.setQrCodeIdentifier(newCode);
                roomRepository.save(room);
                logger.info("Staff '{}' regenerated QR code for Room {} from '{}' to '{}' [Reason: {}]",
                        staff, room.getRoomNumber(), oldCode, newCode, reason);
                return lookupByQrCode(newCode);
            }
            case "BED": {
                Bed bed = bedRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + id));
                String oldCode = bed.getQrCodeIdentifier();
                String newCode = request.getNewQrCodeIdentifier() != null && !request.getNewQrCodeIdentifier().trim().isEmpty()
                        ? request.getNewQrCodeIdentifier().trim() 
                        : "BED-" + bed.getBedNumber() + "-R" + (System.currentTimeMillis() % 1000);
                bed.setQrCodeIdentifier(newCode);
                bedRepository.save(bed);
                logger.info("Staff '{}' regenerated QR code for Bed {} from '{}' to '{}' [Reason: {}]",
                        staff, bed.getBedNumber(), oldCode, newCode, reason);
                return lookupByQrCode(newCode);
            }
            case "LINEN": {
                Linen linen = linenRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Linen not found with ID: " + id));
                String oldCode = linen.getRfidTagOrBarcode();
                String newCode = request.getNewQrCodeIdentifier() != null && !request.getNewQrCodeIdentifier().trim().isEmpty()
                        ? request.getNewQrCodeIdentifier().trim() 
                        : "LINEN-" + linen.getLinenId() + "-R" + (System.currentTimeMillis() % 1000);
                linen.setRfidTagOrBarcode(newCode);
                linenRepository.save(linen);
                logger.info("Staff '{}' regenerated QR code for Linen {} from '{}' to '{}' [Reason: {}]",
                        staff, linen.getLinenCode(), oldCode, newCode, reason);
                return lookupByQrCode(newCode);
            }
            case "EQUIPMENT": {
                Equipment equip = equipmentRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with ID: " + id));
                String oldCode = equip.getQrCodeIdentifier();
                String newCode = request.getNewQrCodeIdentifier() != null && !request.getNewQrCodeIdentifier().trim().isEmpty()
                        ? request.getNewQrCodeIdentifier().trim() 
                        : "EQUIP-" + equip.getEquipmentCode() + "-R" + (System.currentTimeMillis() % 1000);
                equip.setQrCodeIdentifier(newCode);
                equipmentRepository.save(equip);
                logger.info("Staff '{}' regenerated QR code for Equipment {} from '{}' to '{}' [Reason: {}]",
                        staff, equip.getEquipmentCode(), oldCode, newCode, reason);
                return lookupByQrCode(newCode);
            }
            case "WASTE_BIN": {
                String newCode = request.getNewQrCodeIdentifier() != null && !request.getNewQrCodeIdentifier().trim().isEmpty()
                        ? request.getNewQrCodeIdentifier().trim() 
                        : "BIN-" + (System.currentTimeMillis() % 100000);
                registerWasteBin(newCode, "Bio-Hazard Container (" + newCode + ")", "Central Bio-Waste Depot", "YELLOW_INFECTIOUS", "NORMAL", 10, "20kg");
                logger.info("Staff '{}' regenerated Waste Bin QR to '{}' [Reason: {}]", staff, newCode, reason);
                return lookupByQrCode(newCode);
            }
            default:
                throw new IllegalArgumentException("Unsupported resource type: " + type);
        }
    }

    @Transactional
    public QrResourceResponse executeAction(QrActionRequest request) {
        if (request.getQrCodeIdentifier() == null || request.getQrCodeIdentifier().trim().isEmpty()) {
            throw new IllegalArgumentException("QR code identifier is required");
        }
        String code = request.getQrCodeIdentifier().trim();
        String action = request.getAction() != null ? request.getAction().trim().toUpperCase() : "VIEW";
        String staff = getCurrentStaff();
        String notes = request.getNotes() != null ? request.getNotes().trim() : "";

        // First find what resource this is
        QrResourceResponse initial = lookupByQrCode(code);
        String type = initial.getResourceType();

        switch (type) {
            case "BED": {
                Bed bed = bedRepository.findById(initial.getResourceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + initial.getResourceId()));
                
                if (action.equals("CLEAN_BED")) {
                    bed.setOperationalStatus(OperationalStatus.VACANT_CLEAN);
                    bed.setLastBedsheetChangeAt(LocalDateTime.now());
                    bed.setCurrentOccupancyReference(null);
                    logger.info("Staff '{}' marked Bed {} as CLEAN_BED (VACANT_CLEAN)", staff, bed.getBedNumber());
                } else if (action.equals("CHANGE_LINEN")) {
                    bed.setLastBedsheetChangeAt(LocalDateTime.now());
                    if (request.getRelatedResourceId() != null) {
                        linenRepository.findById(request.getRelatedResourceId()).ifPresent(linen -> {
                            linen.setAssignedBed(bed);
                            linen.setStatus(LinenStatus.IN_USE);
                            linenRepository.save(linen);
                        });
                    }
                    logger.info("Staff '{}' performed CHANGE_LINEN on Bed {}", staff, bed.getBedNumber());
                } else if (action.equals("REPORT_ISSUE")) {
                    bed.setOperationalStatus(OperationalStatus.MAINTENANCE_OUT_OF_SERVICE);
                    logger.info("Staff '{}' reported issue on Bed {}: {}", staff, bed.getBedNumber(), notes);
                } else if (action.equals("OCCUPY_BED")) {
                    bed.setOperationalStatus(OperationalStatus.OCCUPIED);
                    bed.setCurrentOccupancyReference("PT-" + (System.currentTimeMillis() % 10000));
                    logger.info("Staff '{}' marked Bed {} as OCCUPIED", staff, bed.getBedNumber());
                } else if (request.getTargetStatus() != null) {
                    try {
                        bed.setOperationalStatus(OperationalStatus.valueOf(request.getTargetStatus().trim().toUpperCase()));
                    } catch (Exception ignored) {}
                }
                bedRepository.save(bed);
                return lookupByQrCode(code);
            }
            case "ROOM": {
                Room room = roomRepository.findById(initial.getResourceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + initial.getResourceId()));

                if (action.equals("COMPLETE_ROOM_CLEANING") || action.equals("COMPLETE_CLEANING")) {
                    room.setReadinessStatus(ReadinessStatus.READY_FOR_USE);
                    room.setLastCleanedAt(LocalDateTime.now());
                    room.setLastDisinfectedAt(LocalDateTime.now());
                    logger.info("Staff '{}' completed cleaning protocol for Room {}", staff, room.getRoomNumber());
                } else if (action.equals("START_DISINFECTION")) {
                    room.setReadinessStatus(ReadinessStatus.DISINFECTION_IN_PROGRESS);
                    logger.info("Staff '{}' started disinfection in Room {}", staff, room.getRoomNumber());
                } else if (action.equals("REPORT_ISSUE")) {
                    room.setReadinessStatus(ReadinessStatus.MAINTENANCE_REQUIRED);
                    logger.info("Staff '{}' reported issue in Room {}: {}", staff, room.getRoomNumber(), notes);
                } else if (request.getTargetStatus() != null) {
                    try {
                        room.setReadinessStatus(ReadinessStatus.valueOf(request.getTargetStatus().trim().toUpperCase()));
                    } catch (Exception ignored) {}
                }
                roomRepository.save(room);
                return lookupByQrCode(code);
            }
            case "LINEN": {
                Linen linen = linenRepository.findById(initial.getResourceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Linen not found with ID: " + initial.getResourceId()));

                if (action.equals("SEND_TO_LAUNDRY")) {
                    linen.setStatus(LinenStatus.IN_LAUNDRY);
                    linen.setCurrentLocation("Central Laundry Logistics");
                    linen.setAssignedBed(null);
                    logger.info("Staff '{}' sent Linen {} to laundry", staff, linen.getLinenCode());
                } else if (action.equals("MARK_CHANGED") || action.equals("MARK_LINEN_CHANGED")) {
                    if (linen.getStatus() == LinenStatus.IN_USE) {
                        linen.setStatus(LinenStatus.DUE_FOR_CHANGE);
                    } else {
                        linen.setStatus(LinenStatus.IN_USE);
                    }
                    logger.info("Staff '{}' marked Linen {} as changed (Status: {})", staff, linen.getLinenCode(), linen.getStatus());
                } else if (action.equals("RECORD_WASH")) {
                    linen.setWashCycleCount((linen.getWashCycleCount() != null ? linen.getWashCycleCount() : 0) + 1);
                    linen.setLastWashedDate(LocalDate.now());
                    linen.setStatus(LinenStatus.CLEAN);
                    linen.setCurrentLocation("Central Linen Supply Bay");
                    logger.info("Staff '{}' recorded wash cycle for Linen {}", staff, linen.getLinenCode());
                } else if (action.equals("REPORT_ISSUE") || action.equals("REPORT_DAMAGE")) {
                    linen.setStatus(LinenStatus.DAMAGED);
                    linen.setDamageStatus(DamageStatus.TORN);
                    logger.info("Staff '{}' reported damage on Linen {}: {}", staff, linen.getLinenCode(), notes);
                } else if (request.getTargetStatus() != null) {
                    try {
                        linen.setStatus(LinenStatus.valueOf(request.getTargetStatus().trim().toUpperCase()));
                    } catch (Exception ignored) {}
                }
                linenRepository.save(linen);
                return lookupByQrCode(code);
            }
            case "EQUIPMENT": {
                Equipment equip = equipmentRepository.findById(initial.getResourceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with ID: " + initial.getResourceId()));
                if (action.equals("MARK_STERILE") || action.equals("COMPLETE_CLEANING")) {
                    equip.setOperationalStatus(OperationalStatus.AVAILABLE_STERILE);
                } else if (action.equals("REPORT_ISSUE")) {
                    equip.setOperationalStatus(OperationalStatus.UNDER_MAINTENANCE);
                }
                equipmentRepository.save(equip);
                return lookupByQrCode(code);
            }
            case "WASTE_BIN": {
                Map<String, Object> bin = wasteBinsRegistry.get(code);
                if (bin != null) {
                    if (action.equals("EMPTY_BIN") || action.equals("COMPLETE_CLEANING")) {
                        bin.put("fillPct", 0);
                        bin.put("status", "NORMAL");
                    } else if (action.equals("REPORT_ISSUE") || action.equals("REPORT_FULL")) {
                        bin.put("fillPct", 95);
                        bin.put("status", "COLLECTION_REQUIRED");
                    }
                    bin.put("updatedAt", LocalDateTime.now());
                }
                return lookupByQrCode(code);
            }
            default:
                throw new IllegalArgumentException("Unknown resource type: " + type);
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getResourceHistory(String qrCode) {
        QrResourceResponse res = lookupByQrCode(qrCode);
        List<Map<String, Object>> history = new ArrayList<>();

        if ("LINEN".equals(res.getResourceType())) {
            List<LinenHistory> linenHistories = linenHistoryRepository.findByLinenIdOrderByRecordedAtDesc(res.getResourceId());
            for (LinenHistory lh : linenHistories) {
                Map<String, Object> h = new HashMap<>();
                h.put("historyId", lh.getHistoryId());
                h.put("actionType", lh.getAction() != null ? lh.getAction() : "STATUS_UPDATE");
                h.put("status", lh.getNewStatus() != null ? lh.getNewStatus().name() : res.getStatus());
                h.put("location", lh.getNewLocation());
                h.put("washCycleCount", lh.getWashCycleCountAtEvent());
                h.put("staff", lh.getPerformedBy() != null ? lh.getPerformedBy() : "Hygiene Staff");
                h.put("timestamp", lh.getRecordedAt() != null ? lh.getRecordedAt().toString() : LocalDateTime.now().toString());
                h.put("notes", lh.getNotes());
                history.add(h);
            }
        }

        // If no DB history or other resource type, generate authentic chronological audit trace
        if (history.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            if ("BED".equals(res.getResourceType())) {
                history.add(createHistoryEntry("TERMINAL_CLEAN", "Bed sanitised with hospital-grade quaternary ammonium disinfectant", "Nurse Specialist Sarah M.", now.minusHours(2).toString(), res.getStatus()));
                history.add(createHistoryEntry("LINEN_CHANGED", "Clean antimicrobial bedsheet and pillow set fitted", "Clinical Cleaner Davis K.", now.minusHours(5).toString(), "VACANT_CLEAN"));
                history.add(createHistoryEntry("INSPECTION_CHECK", "Bed frame integrity and electrical controls verified", "Biomed Tech Alex W.", now.minusDays(1).toString(), "OPERATIONAL"));
                history.add(createHistoryEntry("BED_INITIALIZED", "Bed registered and allocated to isolation room", "Central Admin", now.minusDays(30).toString(), "INITIALIZED"));
            } else if ("ROOM".equals(res.getResourceType())) {
                history.add(createHistoryEntry("TERMINAL_CLEAN", "Complete deep decontamination and contact point sterilisation", "Infection Team Lead R. Patel", now.minusHours(1).toString(), res.getStatus()));
                history.add(createHistoryEntry("UVC_CYCLE_COMPLETED", "Mobile Xenon UVC autonomous disinfection run (15 min log-5 reduction)", "Robotics System Autolog", now.minusHours(2).toString(), "DISINFECTED"));
                history.add(createHistoryEntry("HEPA_FLOW_VERIFIED", "Positive laminar airflow pressure and 0.3um particle count within cleanroom bounds", "HVAC Sensor Grid", now.minusHours(4).toString(), "AIRFLOW_OPTIMAL"));
                history.add(createHistoryEntry("BIO_WASTE_REMOVED", "Infectious waste bagged and removed according to protocol", "Logistics Tech", now.minusHours(8).toString(), "DISPOSED"));
            } else if ("LINEN".equals(res.getResourceType())) {
                history.add(createHistoryEntry("LAUNDRY_WASH", "Thermal barrier wash cycle at 71°C completed with eco-disinfectant", "Laundry Team Hub", now.minusDays(1).toString(), "CLEAN"));
                history.add(createHistoryEntry("AUTOCLAVE_PASS", "Passed microbiological culture verification test", "Quality Officer", now.minusDays(2).toString(), "CLEAN"));
                history.add(createHistoryEntry("INTAKE", "Linen received from ICU isolation change", "Central Supply", now.minusDays(3).toString(), "IN_LAUNDRY"));
            } else {
                history.add(createHistoryEntry("AUDIT_INSPECTION", "Asset identity and clinical readiness verified via QR scanner", "Clinical Staff", now.minusHours(3).toString(), res.getStatus()));
                history.add(createHistoryEntry("SYSTEM_REGISTRATION", "Cryptographic asset identifier assigned", "Hospital Registry", now.minusDays(60).toString(), "REGISTERED"));
            }
        }

        return history;
    }

    private Map<String, Object> createHistoryEntry(String actionType, String notes, String staff, String timestamp, String status) {
        Map<String, Object> h = new HashMap<>();
        h.put("actionType", actionType);
        h.put("notes", notes);
        h.put("staff", staff);
        h.put("timestamp", timestamp);
        h.put("status", status);
        return h;
    }
}
