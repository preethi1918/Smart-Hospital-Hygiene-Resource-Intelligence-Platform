package com.smarthospital.model;

import com.smarthospital.model.enums.CleaningLocationType;
import com.smarthospital.model.enums.TaskPriority;
import com.smarthospital.model.enums.TaskStatus;
import com.smarthospital.model.enums.TaskType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_id")
    private Long taskId;

    @Column(name = "task_code", nullable = false, unique = true, length = 50)
    private String taskCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false, length = 50)
    private TaskType taskType;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private TaskPriority priority = TaskPriority.ROUTINE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_user_id")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_user_id", nullable = true)
    private User assignedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_ward_id")
    private Ward targetWard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_room_id")
    private Room targetRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_bed_id")
    private Bed targetBed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_equipment_id")
    private Equipment targetEquipment;

    @Column(name = "location_name", length = 200)
    private String locationName;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", length = 50)
    private CleaningLocationType locationType = CleaningLocationType.ROOM;

    @Column(name = "target_qr_code", length = 100)
    private String targetQrCode;

    @Column(name = "assigned_staff_name", length = 150)
    private String assignedStaffName;

    @Column(name = "completed_by_staff_name", length = 150)
    private String completedByStaffName;

    @Column(name = "verified_by_staff_name", length = 150)
    private String verifiedByStaffName;

    @Column(name = "scheduled_start_time", nullable = false)
    private LocalDateTime scheduledStartTime;

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private TaskStatus status = TaskStatus.PENDING;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Task() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (priority == null) priority = TaskPriority.ROUTINE;
        if (status == null) status = TaskStatus.PENDING;
        if (locationType == null) locationType = CleaningLocationType.ROOM;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String taskCode) { this.taskCode = taskCode; }

    public TaskType getTaskType() { return taskType; }
    public void setTaskType(TaskType taskType) { this.taskType = taskType; }

    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }

    public User getAssignedBy() { return assignedBy; }
    public void setAssignedBy(User assignedBy) { this.assignedBy = assignedBy; }

    public Ward getTargetWard() { return targetWard; }
    public void setTargetWard(Ward targetWard) { this.targetWard = targetWard; }

    public Room getTargetRoom() { return targetRoom; }
    public void setTargetRoom(Room targetRoom) { this.targetRoom = targetRoom; }

    public Bed getTargetBed() { return targetBed; }
    public void setTargetBed(Bed targetBed) { this.targetBed = targetBed; }

    public Equipment getTargetEquipment() { return targetEquipment; }
    public void setTargetEquipment(Equipment targetEquipment) { this.targetEquipment = targetEquipment; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public CleaningLocationType getLocationType() { return locationType; }
    public void setLocationType(CleaningLocationType locationType) { this.locationType = locationType; }

    public String getTargetQrCode() { return targetQrCode; }
    public void setTargetQrCode(String targetQrCode) { this.targetQrCode = targetQrCode; }

    public String getAssignedStaffName() { return assignedStaffName; }
    public void setAssignedStaffName(String assignedStaffName) { this.assignedStaffName = assignedStaffName; }

    public String getCompletedByStaffName() { return completedByStaffName; }
    public void setCompletedByStaffName(String completedByStaffName) { this.completedByStaffName = completedByStaffName; }

    public String getVerifiedByStaffName() { return verifiedByStaffName; }
    public void setVerifiedByStaffName(String verifiedByStaffName) { this.verifiedByStaffName = verifiedByStaffName; }

    public LocalDateTime getScheduledStartTime() { return scheduledStartTime; }
    public void setScheduledStartTime(LocalDateTime scheduledStartTime) { this.scheduledStartTime = scheduledStartTime; }

    public LocalDateTime getActualStartTime() { return actualStartTime; }
    public void setActualStartTime(LocalDateTime actualStartTime) { this.actualStartTime = actualStartTime; }

    public LocalDateTime getActualEndTime() { return actualEndTime; }
    public void setActualEndTime(LocalDateTime actualEndTime) { this.actualEndTime = actualEndTime; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Convenience aliases for task specification requirements
    public String getLocation() { return locationName; }
    public void setLocation(String loc) { this.locationName = loc; }

    public String getAssignedStaff() { return assignedStaffName; }
    public void setAssignedStaff(String staff) { this.assignedStaffName = staff; }

    public LocalDateTime getScheduledTime() { return scheduledStartTime; }
    public void setScheduledTime(LocalDateTime time) { this.scheduledStartTime = time; }

    public LocalDateTime getCompletedTime() { return actualEndTime; }
    public void setCompletedTime(LocalDateTime time) { this.actualEndTime = time; }
}
