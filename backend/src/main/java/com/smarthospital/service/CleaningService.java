package com.smarthospital.service;

import com.smarthospital.dto.*;
import com.smarthospital.exception.ResourceNotFoundException;
import com.smarthospital.model.*;
import com.smarthospital.model.enums.*;
import com.smarthospital.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CleaningService {

    private final TaskRepository taskRepository;
    private final CleaningLogRepository cleaningLogRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;

    public CleaningService(TaskRepository taskRepository,
                           CleaningLogRepository cleaningLogRepository,
                           UserRepository userRepository,
                           RoomRepository roomRepository,
                           BedRepository bedRepository) {
        this.taskRepository = taskRepository;
        this.cleaningLogRepository = cleaningLogRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
    }

    private String getCurrentStaffName() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
            String principal = auth.getName();
            Optional<User> userOpt = userRepository.findByEmail(principal);
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                return u.getFirstName() + " " + u.getLastName() + " (" + u.getDepartment() + ")";
            }
            return principal;
        }
        return "Sanitation Specialist (Authorized Staff)";
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
            return userRepository.findByEmail(auth.getName()).orElse(null);
        }
        return null;
    }

    @Transactional
    public void updateOverdueTasks() {
        List<Task> overdueCandidates = taskRepository.findByScheduledStartTimeBeforeAndStatusIn(
                LocalDateTime.now(),
                List.of(TaskStatus.PENDING, TaskStatus.IN_PROGRESS)
        );
        for (Task t : overdueCandidates) {
            t.setStatus(TaskStatus.OVERDUE);
            taskRepository.save(t);
        }
    }

    @Transactional
    public List<CleaningTaskResponse> getAllTasks(CleaningLocationType locationType, TaskStatus status) {
        updateOverdueTasks();
        List<Task> tasks;
        if (status != null && locationType != null) {
            tasks = taskRepository.findByStatusOrderByScheduledStartTimeDesc(status).stream()
                    .filter(t -> t.getLocationType() == locationType)
                    .collect(Collectors.toList());
        } else if (status != null) {
            tasks = taskRepository.findByStatusOrderByScheduledStartTimeDesc(status);
        } else if (locationType != null) {
            tasks = taskRepository.findByLocationType(locationType);
        } else {
            tasks = taskRepository.findAllByOrderByScheduledStartTimeDesc();
        }
        return tasks.stream().map(this::toTaskResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CleaningTaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cleaning task not found with ID: " + id));
        return toTaskResponse(task);
    }

    @Transactional
    public CleaningTaskResponse createTask(CleaningTaskRequest req) {
        Task task = new Task();
        String generatedCode = "TASK-CLN-" + System.currentTimeMillis() % 1000000;
        task.setTaskCode(generatedCode);
        task.setLocationName(req.getLocationName().trim());
        task.setLocationType(req.getLocationType() != null ? req.getLocationType() : CleaningLocationType.ROOM);
        task.setTaskType(req.getTaskType() != null ? req.getTaskType() : TaskType.TERMINAL_ROOM_CLEAN);
        task.setPriority(req.getPriority() != null ? req.getPriority() : TaskPriority.ROUTINE);
        task.setStatus(TaskStatus.PENDING);

        // QR Code mapping
        if (req.getTargetQrCode() != null && !req.getTargetQrCode().trim().isEmpty()) {
            task.setTargetQrCode(req.getTargetQrCode().trim().toUpperCase());
        } else {
            // Auto generate QR code identifier based on location type
            task.setTargetQrCode(generateDefaultQr(task.getLocationType(), task.getLocationName()));
        }

        // Link with Room or Bed if match found
        linkTargetEntities(task);

        // Staff assignment
        if (req.getAssignedToUserId() != null) {
            userRepository.findById(req.getAssignedToUserId()).ifPresent(u -> {
                task.setAssignedTo(u);
                task.setAssignedStaffName(u.getFirstName() + " " + u.getLastName());
            });
        }
        if (task.getAssignedStaffName() == null || task.getAssignedStaffName().isBlank()) {
            if (req.getAssignedStaffName() != null && !req.getAssignedStaffName().isBlank()) {
                task.setAssignedStaffName(req.getAssignedStaffName().trim());
            } else {
                task.setAssignedStaffName(getCurrentStaffName());
            }
        }

        task.setAssignedBy(getCurrentUser());
        task.setScheduledStartTime(req.getScheduledStartTime() != null ? req.getScheduledStartTime() : LocalDateTime.now().plusHours(1));
        task.setSpecialInstructions(req.getSpecialInstructions());
        task.setNotes(req.getNotes());

        Task saved = taskRepository.save(task);
        return toTaskResponse(saved);
    }

    @Transactional
    public CleaningTaskResponse updateTask(Long id, CleaningTaskRequest req) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cleaning task not found with ID: " + id));

        if (req.getLocationName() != null) task.setLocationName(req.getLocationName().trim());
        if (req.getLocationType() != null) task.setLocationType(req.getLocationType());
        if (req.getTaskType() != null) task.setTaskType(req.getTaskType());
        if (req.getPriority() != null) task.setPriority(req.getPriority());
        if (req.getTargetQrCode() != null) task.setTargetQrCode(req.getTargetQrCode().trim().toUpperCase());
        if (req.getScheduledStartTime() != null) task.setScheduledStartTime(req.getScheduledStartTime());
        if (req.getSpecialInstructions() != null) task.setSpecialInstructions(req.getSpecialInstructions());
        if (req.getNotes() != null) task.setNotes(req.getNotes());
        if (req.getAssignedStaffName() != null) task.setAssignedStaffName(req.getAssignedStaffName());

        linkTargetEntities(task);

        Task saved = taskRepository.save(task);
        return toTaskResponse(saved);
    }

    @Transactional
    public CleaningTaskResponse startTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cleaning task not found with ID: " + id));

        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setActualStartTime(LocalDateTime.now());
        if (task.getAssignedStaffName() == null || task.getAssignedStaffName().isBlank()) {
            task.setAssignedStaffName(getCurrentStaffName());
        }

        Task saved = taskRepository.save(task);
        return toTaskResponse(saved);
    }

    @Transactional
    public CleaningTaskResponse completeTask(Long id, String notes, String disinfectant, String cleaningMethodStr) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cleaning task not found with ID: " + id));

        LocalDateTime now = LocalDateTime.now();
        String currentStaff = getCurrentStaffName();

        task.setStatus(TaskStatus.COMPLETED);
        task.setActualEndTime(now);
        if (task.getActualStartTime() == null) {
            task.setActualStartTime(now.minusMinutes(25));
        }
        task.setCompletedByStaffName(currentStaff);
        if (notes != null && !notes.isBlank()) {
            task.setNotes((task.getNotes() != null && !task.getNotes().isBlank() ? task.getNotes() + "\n" : "") + notes);
        }

        // Update target resource readiness / hygiene state
        updateTargetResourceAfterClean(task);

        // Record Cleaning History Log (Audit Trail)
        recordCleaningHistoryLog(task, currentStaff, notes, disinfectant, cleaningMethodStr, task.getTargetQrCode(), now);

        Task saved = taskRepository.save(task);
        return toTaskResponse(saved);
    }

    @Transactional
    public CleaningTaskResponse completeTaskViaQr(CompleteTaskQrRequest req) {
        String qr = req.getQrCode() != null ? req.getQrCode().trim().toUpperCase() : "";
        if (qr.isEmpty()) {
            throw new IllegalArgumentException("QR Code is required to complete task via QR workflow");
        }

        LocalDateTime now = LocalDateTime.now();
        String currentStaff = getCurrentStaffName();

        // 1. Locate existing active or pending task for this QR code
        Task targetTask = null;
        if (req.getTaskId() != null) {
            targetTask = taskRepository.findById(req.getTaskId()).orElse(null);
        }

        if (targetTask == null) {
            List<Task> openTasks = taskRepository.findByTargetQrCodeAndStatusIn(
                    qr, List.of(TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE)
            );
            if (!openTasks.isEmpty()) {
                targetTask = openTasks.get(0);
            }
        }

        // 2. If no existing active task, create an immediate on-demand cleaning task for this resource
        if (targetTask == null) {
            targetTask = new Task();
            targetTask.setTaskCode("TASK-QR-" + System.currentTimeMillis() % 1000000);
            targetTask.setTargetQrCode(qr);
            targetTask.setScheduledStartTime(now);
            targetTask.setActualStartTime(now.minusMinutes(15));
            targetTask.setPriority(TaskPriority.ROUTINE);
            targetTask.setAssignedStaffName(currentStaff);
            targetTask.setAssignedBy(getCurrentUser());

            // Infer location name & type from QR code
            inferLocationFromQr(targetTask, qr);
        }

        // 3. Mark task completed and record staff + time
        targetTask.setStatus(TaskStatus.COMPLETED);
        targetTask.setActualEndTime(now);
        if (targetTask.getActualStartTime() == null) {
            targetTask.setActualStartTime(now.minusMinutes(20));
        }
        targetTask.setCompletedByStaffName(currentStaff);

        String combinedNotes = "Completed via QR Scan [" + qr + "] by " + currentStaff + " at " +
                now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        if (req.getNotes() != null && !req.getNotes().isBlank()) {
            combinedNotes += " | Notes: " + req.getNotes().trim();
        }
        targetTask.setNotes((targetTask.getNotes() != null && !targetTask.getNotes().isBlank() ? targetTask.getNotes() + "\n" : "") + combinedNotes);

        // Update target resource readiness / hygiene state
        updateTargetResourceAfterClean(targetTask);

        // 4. Create Cleaning History audit entry
        recordCleaningHistoryLog(targetTask, currentStaff, combinedNotes, req.getDisinfectantUsed(), req.getCleaningMethod(), qr, now);

        Task saved = taskRepository.save(targetTask);
        return toTaskResponse(saved);
    }

    @Transactional
    public CleaningTaskResponse verifyTask(Long id, String notes, BigDecimal postHygieneScore) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cleaning task not found with ID: " + id));

        String verifier = getCurrentStaffName();
        task.setStatus(TaskStatus.VERIFIED);
        task.setVerifiedByStaffName(verifier);
        if (notes != null && !notes.isBlank()) {
            task.setNotes((task.getNotes() != null ? task.getNotes() + "\n" : "") + "[VERIFICATION] " + notes);
        }

        // Update latest cleaning log if exists
        List<CleaningLog> logs = cleaningLogRepository.findByQrScannedTokenOrderByCompletedAtDesc(task.getTargetQrCode());
        if (!logs.isEmpty()) {
            CleaningLog latestLog = logs.get(0);
            latestLog.setVerifiedByStaffName(verifier);
            if (postHygieneScore != null) {
                latestLog.setHygieneScorePostClean(postHygieneScore);
            } else {
                latestLog.setHygieneScorePostClean(new BigDecimal("98.50"));
            }
            cleaningLogRepository.save(latestLog);
        }

        Task saved = taskRepository.save(task);
        return toTaskResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CleaningLogResponse> getCleaningHistory(CleaningLocationType locationType, String qrCode) {
        List<CleaningLog> logs;
        if (qrCode != null && !qrCode.isBlank()) {
            logs = cleaningLogRepository.findByQrScannedTokenOrderByCompletedAtDesc(qrCode.trim().toUpperCase());
        } else if (locationType != null) {
            logs = cleaningLogRepository.findByLocationTypeOrderByCompletedAtDesc(locationType);
        } else {
            logs = cleaningLogRepository.findAllByOrderByCompletedAtDesc();
        }
        return logs.stream().map(this::toLogResponse).collect(Collectors.toList());
    }

    @Transactional
    public CleaningStatsResponse getCleaningStats() {
        updateOverdueTasks();
        List<Task> allTasks = taskRepository.findAll();
        long totalTasks = allTasks.size();
        long pending = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.PENDING).count();
        long inProgress = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long completed = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
        long overdue = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.OVERDUE).count();
        long verified = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.VERIFIED).count();
        long totalLogs = cleaningLogRepository.count();

        Map<String, Long> tasksByLocation = new LinkedHashMap<>();
        for (CleaningLocationType type : CleaningLocationType.values()) {
            long count = allTasks.stream().filter(t -> t.getLocationType() == type).count();
            tasksByLocation.put(type.name(), count);
        }

        return new CleaningStatsResponse(totalTasks, pending, inProgress, completed, overdue, verified, totalLogs, tasksByLocation);
    }

    // Helper: Build CleaningLog entry
    private void recordCleaningHistoryLog(Task task, String staffName, String notes, String disinfectant,
                                         String cleaningMethodStr, String qrToken, LocalDateTime completedAt) {
        CleaningLog log = new CleaningLog();
        log.setTask(task);
        log.setLocationName(task.getLocationName());
        log.setLocationType(task.getLocationType() != null ? task.getLocationType() : CleaningLocationType.ROOM);
        log.setPerformedByStaffName(staffName);
        log.setPerformedBy(getCurrentUser());
        log.setStartedAt(task.getActualStartTime() != null ? task.getActualStartTime() : completedAt.minusMinutes(20));
        log.setCompletedAt(completedAt);
        log.setQrScannedToken(qrToken != null ? qrToken : (task.getTargetQrCode() != null ? task.getTargetQrCode() : "N/A"));
        log.setDisinfectantUsed(disinfectant != null && !disinfectant.isBlank() ? disinfectant : "Hospital-Grade Quaternary Disinfectant (Virex II 256)");

        CleaningMethod method = CleaningMethod.SURFACE_CHEMICAL_WIPE;
        if (cleaningMethodStr != null) {
            try {
                method = CleaningMethod.valueOf(cleaningMethodStr.toUpperCase());
            } catch (Exception ignored) {}
        }
        log.setCleaningMethod(method);
        log.setHygieneScorePostClean(new BigDecimal("97.50"));
        log.setStatus("COMPLETED");
        log.setNotes(notes != null ? notes : task.getNotes());

        if (task.getTargetRoom() != null) log.setRoom(task.getTargetRoom());
        if (task.getTargetBed() != null) log.setBed(task.getTargetBed());

        cleaningLogRepository.save(log);
    }

    private void updateTargetResourceAfterClean(Task task) {
        if (task.getTargetRoom() != null) {
            Room room = task.getTargetRoom();
            room.setReadinessStatus(ReadinessStatus.READY_FOR_USE);
            room.setLastCleanedAt(LocalDateTime.now());
            roomRepository.save(room);
        } else if (task.getLocationType() == CleaningLocationType.ROOM && task.getTargetQrCode() != null) {
            roomRepository.findByQrCodeIdentifier(task.getTargetQrCode()).ifPresent(room -> {
                room.setReadinessStatus(ReadinessStatus.READY_FOR_USE);
                room.setLastCleanedAt(LocalDateTime.now());
                roomRepository.save(room);
            });
        }

        if (task.getTargetBed() != null) {
            Bed bed = task.getTargetBed();
            bed.setOperationalStatus(OperationalStatus.VACANT_CLEAN);
            bed.setLastBedsheetChangeAt(LocalDateTime.now());
            bedRepository.save(bed);
        } else if (task.getLocationType() == CleaningLocationType.BED && task.getTargetQrCode() != null) {
            bedRepository.findByQrCodeIdentifier(task.getTargetQrCode()).ifPresent(bed -> {
                bed.setOperationalStatus(OperationalStatus.VACANT_CLEAN);
                bed.setLastBedsheetChangeAt(LocalDateTime.now());
                bedRepository.save(bed);
            });
        }
    }

    private void linkTargetEntities(Task task) {
        if (task.getTargetQrCode() != null && !task.getTargetQrCode().isBlank()) {
            roomRepository.findByQrCodeIdentifier(task.getTargetQrCode()).ifPresent(r -> {
                task.setTargetRoom(r);
                if (task.getLocationName() == null || task.getLocationName().isBlank()) {
                    task.setLocationName("Room " + r.getRoomNumber() + " (" + (r.getWard() != null ? r.getWard().getName() : "") + ")");
                }
            });
            bedRepository.findByQrCodeIdentifier(task.getTargetQrCode()).ifPresent(b -> {
                task.setTargetBed(b);
                if (task.getLocationName() == null || task.getLocationName().isBlank()) {
                    task.setLocationName("Bed " + b.getBedNumber() + (b.getRoom() != null ? " - Room " + b.getRoom().getRoomNumber() : ""));
                }
            });
        }
    }

    private void inferLocationFromQr(Task task, String qr) {
        if (qr.startsWith("ROOM-")) {
            task.setLocationType(CleaningLocationType.ROOM);
            task.setTaskType(TaskType.TERMINAL_ROOM_CLEAN);
            roomRepository.findByQrCodeIdentifier(qr).ifPresentOrElse(
                    r -> {
                        task.setTargetRoom(r);
                        task.setLocationName("Room " + r.getRoomNumber() + " (" + (r.getWard() != null ? r.getWard().getName() : "General Ward") + ")");
                    },
                    () -> task.setLocationName("Hospital Room [" + qr + "]")
            );
        } else if (qr.startsWith("BED-")) {
            task.setLocationType(CleaningLocationType.BED);
            task.setTaskType(TaskType.BED_DISINFECTION);
            bedRepository.findByQrCodeIdentifier(qr).ifPresentOrElse(
                    b -> {
                        task.setTargetBed(b);
                        task.setLocationName("Bed " + b.getBedNumber() + (b.getRoom() != null ? " - Room " + b.getRoom().getRoomNumber() : ""));
                    },
                    () -> task.setLocationName("Hospital Bed [" + qr + "]")
            );
        } else if (qr.startsWith("TOILET-")) {
            task.setLocationType(CleaningLocationType.TOILET);
            task.setTaskType(TaskType.TOILET_DEEP_CLEAN);
            task.setLocationName("Restroom Facility [" + qr + "]");
        } else if (qr.startsWith("CORR-")) {
            task.setLocationType(CleaningLocationType.CORRIDOR);
            task.setTaskType(TaskType.CORRIDOR_SANITY_MOP);
            task.setLocationName("Main Corridor Passageway [" + qr + "]");
        } else if (qr.startsWith("WAIT-")) {
            task.setLocationType(CleaningLocationType.WAITING_AREA);
            task.setTaskType(TaskType.WAITING_AREA_SANITATION);
            task.setLocationName("Public Waiting Lounge [" + qr + "]");
        } else if (qr.startsWith("HWASH-")) {
            task.setLocationType(CleaningLocationType.HANDWASH_STATION);
            task.setTaskType(TaskType.HANDWASH_STATION_SERVICE);
            task.setLocationName("Hygiene Handwash Station [" + qr + "]");
        } else {
            task.setLocationType(CleaningLocationType.ROOM);
            task.setTaskType(TaskType.TERMINAL_ROOM_CLEAN);
            task.setLocationName("Hospital Area [" + qr + "]");
        }
    }

    private String generateDefaultQr(CleaningLocationType type, String locName) {
        String base = locName.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (base.length() > 6) base = base.substring(0, 6);
        return switch (type) {
            case ROOM -> "ROOM-" + (base.isEmpty() ? "101" : base);
            case BED -> "BED-" + (base.isEmpty() ? "101" : base);
            case TOILET -> "TOILET-" + (base.isEmpty() ? "G01" : base);
            case CORRIDOR -> "CORR-" + (base.isEmpty() ? "C1" : base);
            case WAITING_AREA -> "WAIT-" + (base.isEmpty() ? "W1" : base);
            case HANDWASH_STATION -> "HWASH-" + (base.isEmpty() ? "H1" : base);
        };
    }

    public CleaningTaskResponse toTaskResponse(Task task) {
        CleaningTaskResponse res = new CleaningTaskResponse();
        res.setTaskId(task.getTaskId());
        res.setTaskCode(task.getTaskCode());
        res.setLocation(task.getLocationName() != null ? task.getLocationName() :
                (task.getTargetRoom() != null ? "Room " + task.getTargetRoom().getRoomNumber() : "General Hospital Facility"));
        res.setLocationType(task.getLocationType() != null ? task.getLocationType() : CleaningLocationType.ROOM);
        res.setTargetQrCode(task.getTargetQrCode());
        res.setTaskType(task.getTaskType());
        res.setPriority(task.getPriority());
        res.setAssignedStaff(task.getAssignedStaffName() != null && !task.getAssignedStaffName().isBlank() ?
                task.getAssignedStaffName() :
                (task.getAssignedTo() != null ? task.getAssignedTo().getFirstName() + " " + task.getAssignedTo().getLastName() : "Unassigned Staff"));
        res.setScheduledTime(task.getScheduledStartTime());
        res.setCompletedTime(task.getActualEndTime());
        res.setStatus(task.getStatus());
        res.setNotes(task.getNotes());
        res.setCompletedByStaff(task.getCompletedByStaffName());
        res.setVerifiedByStaff(task.getVerifiedByStaffName());
        res.setCreatedAt(task.getCreatedAt());
        res.setUpdatedAt(task.getUpdatedAt());
        return res;
    }

    public CleaningLogResponse toLogResponse(CleaningLog log) {
        CleaningLogResponse res = new CleaningLogResponse();
        res.setCleaningLogId(log.getCleaningLogId());
        if (log.getTask() != null) {
            res.setTaskId(log.getTask().getTaskId());
            res.setTaskCode(log.getTask().getTaskCode());
        }
        res.setLocationName(log.getLocationName() != null ? log.getLocationName() :
                (log.getRoom() != null ? "Room " + log.getRoom().getRoomNumber() : "Hospital Zone"));
        res.setLocationType(log.getLocationType() != null ? log.getLocationType() : CleaningLocationType.ROOM);
        res.setPerformedByStaff(log.getPerformedByStaffName() != null ? log.getPerformedByStaffName() :
                (log.getPerformedBy() != null ? log.getPerformedBy().getFirstName() + " " + log.getPerformedBy().getLastName() : "Hospital Sanitation Specialist"));
        res.setVerifiedByStaff(log.getVerifiedByStaffName() != null ? log.getVerifiedByStaffName() :
                (log.getVerifiedBy() != null ? log.getVerifiedBy().getFirstName() + " " + log.getVerifiedBy().getLastName() : null));
        res.setCleaningMethod(log.getCleaningMethod());
        res.setDisinfectantUsed(log.getDisinfectantUsed());
        res.setQrScannedToken(log.getQrScannedToken());
        res.setHygieneScorePostClean(log.getHygieneScorePostClean());
        res.setStatus(log.getStatus());
        res.setNotes(log.getNotes());
        res.setStartedAt(log.getStartedAt());
        res.setCompletedAt(log.getCompletedAt());
        res.setCreatedAt(log.getCreatedAt());
        return res;
    }
}
