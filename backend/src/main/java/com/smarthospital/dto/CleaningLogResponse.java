package com.smarthospital.dto;

import com.smarthospital.model.enums.CleaningLocationType;
import com.smarthospital.model.enums.CleaningMethod;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CleaningLogResponse {

    private Long cleaningLogId;
    private Long taskId;
    private String taskCode;
    private String locationName;
    private CleaningLocationType locationType;
    private String performedByStaff;
    private String verifiedByStaff;
    private CleaningMethod cleaningMethod;
    private String disinfectantUsed;
    private String qrScannedToken;
    private BigDecimal hygieneScorePostClean;
    private String status;
    private String notes;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;

    public CleaningLogResponse() {}

    public Long getCleaningLogId() { return cleaningLogId; }
    public void setCleaningLogId(Long cleaningLogId) { this.cleaningLogId = cleaningLogId; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String taskCode) { this.taskCode = taskCode; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public CleaningLocationType getLocationType() { return locationType; }
    public void setLocationType(CleaningLocationType locationType) { this.locationType = locationType; }

    public String getPerformedByStaff() { return performedByStaff; }
    public void setPerformedByStaff(String performedByStaff) { this.performedByStaff = performedByStaff; }

    public String getVerifiedByStaff() { return verifiedByStaff; }
    public void setVerifiedByStaff(String verifiedByStaff) { this.verifiedByStaff = verifiedByStaff; }

    public CleaningMethod getCleaningMethod() { return cleaningMethod; }
    public void setCleaningMethod(CleaningMethod cleaningMethod) { this.cleaningMethod = cleaningMethod; }

    public String getDisinfectantUsed() { return disinfectantUsed; }
    public void setDisinfectantUsed(String disinfectantUsed) { this.disinfectantUsed = disinfectantUsed; }

    public String getQrScannedToken() { return qrScannedToken; }
    public void setQrScannedToken(String qrScannedToken) { this.qrScannedToken = qrScannedToken; }

    public BigDecimal getHygieneScorePostClean() { return hygieneScorePostClean; }
    public void setHygieneScorePostClean(BigDecimal hygieneScorePostClean) { this.hygieneScorePostClean = hygieneScorePostClean; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
