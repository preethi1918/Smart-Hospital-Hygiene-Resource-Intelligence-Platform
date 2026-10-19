package com.smarthospital.dto;

import com.smarthospital.model.enums.CleaningLocationType;
import com.smarthospital.model.enums.TaskPriority;
import com.smarthospital.model.enums.TaskStatus;
import com.smarthospital.model.enums.TaskType;
import java.time.LocalDateTime;

public class CleaningTaskResponse {

    private Long taskId;
    private String taskCode;
    private String location;
    private CleaningLocationType locationType;
    private String targetQrCode;
    private TaskType taskType;
    private TaskPriority priority;
    private String assignedStaff;
    private LocalDateTime scheduledTime;
    private LocalDateTime completedTime;
    private TaskStatus status;
    private String notes;
    private String completedByStaff;
    private String verifiedByStaff;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CleaningTaskResponse() {}

    public CleaningTaskResponse(Long taskId, String taskCode, String location, CleaningLocationType locationType,
                                String targetQrCode, TaskType taskType, TaskPriority priority, String assignedStaff,
                                LocalDateTime scheduledTime, LocalDateTime completedTime, TaskStatus status,
                                String notes, String completedByStaff, String verifiedByStaff,
                                LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.taskId = taskId;
        this.taskCode = taskCode;
        this.location = location;
        this.locationType = locationType;
        this.targetQrCode = targetQrCode;
        this.taskType = taskType;
        this.priority = priority;
        this.assignedStaff = assignedStaff;
        this.scheduledTime = scheduledTime;
        this.completedTime = completedTime;
        this.status = status;
        this.notes = notes;
        this.completedByStaff = completedByStaff;
        this.verifiedByStaff = verifiedByStaff;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String taskCode) { this.taskCode = taskCode; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public CleaningLocationType getLocationType() { return locationType; }
    public void setLocationType(CleaningLocationType locationType) { this.locationType = locationType; }

    public String getTargetQrCode() { return targetQrCode; }
    public void setTargetQrCode(String targetQrCode) { this.targetQrCode = targetQrCode; }

    public TaskType getTaskType() { return taskType; }
    public void setTaskType(TaskType taskType) { this.taskType = taskType; }

    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

    public String getAssignedStaff() { return assignedStaff; }
    public void setAssignedStaff(String assignedStaff) { this.assignedStaff = assignedStaff; }

    public LocalDateTime getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(LocalDateTime scheduledTime) { this.scheduledTime = scheduledTime; }

    public LocalDateTime getCompletedTime() { return completedTime; }
    public void setCompletedTime(LocalDateTime completedTime) { this.completedTime = completedTime; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCompletedByStaff() { return completedByStaff; }
    public void setCompletedByStaff(String completedByStaff) { this.completedByStaff = completedByStaff; }

    public String getVerifiedByStaff() { return verifiedByStaff; }
    public void setVerifiedByStaff(String verifiedByStaff) { this.verifiedByStaff = verifiedByStaff; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
