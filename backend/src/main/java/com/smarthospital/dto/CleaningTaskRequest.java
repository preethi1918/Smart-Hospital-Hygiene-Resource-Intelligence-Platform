package com.smarthospital.dto;

import com.smarthospital.model.enums.CleaningLocationType;
import com.smarthospital.model.enums.TaskPriority;
import com.smarthospital.model.enums.TaskType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CleaningTaskRequest {

    @NotBlank(message = "Location is required")
    private String locationName;

    @NotNull(message = "Location type is required (ROOM, BED, TOILET, CORRIDOR, WAITING_AREA, HANDWASH_STATION)")
    private CleaningLocationType locationType;

    private String targetQrCode;

    @NotNull(message = "Task type is required")
    private TaskType taskType;

    private TaskPriority priority = TaskPriority.ROUTINE;

    private String assignedStaffName;

    private Long assignedToUserId;

    private LocalDateTime scheduledStartTime;

    private String specialInstructions;

    private String notes;

    public CleaningTaskRequest() {}

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public CleaningLocationType getLocationType() { return locationType; }
    public void setLocationType(CleaningLocationType locationType) { this.locationType = locationType; }

    public String getTargetQrCode() { return targetQrCode; }
    public void setTargetQrCode(String targetQrCode) { this.targetQrCode = targetQrCode; }

    public TaskType getTaskType() { return taskType; }
    public void setTaskType(TaskType taskType) { this.taskType = taskType; }

    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

    public String getAssignedStaffName() { return assignedStaffName; }
    public void setAssignedStaffName(String assignedStaffName) { this.assignedStaffName = assignedStaffName; }

    public Long getAssignedToUserId() { return assignedToUserId; }
    public void setAssignedToUserId(Long assignedToUserId) { this.assignedToUserId = assignedToUserId; }

    public LocalDateTime getScheduledStartTime() { return scheduledStartTime; }
    public void setScheduledStartTime(LocalDateTime scheduledStartTime) { this.scheduledStartTime = scheduledStartTime; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
