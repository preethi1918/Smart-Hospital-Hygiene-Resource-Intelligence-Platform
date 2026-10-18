package com.smarthospital.model;

import com.smarthospital.model.enums.CleaningMethod;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cleaning_logs")
public class CleaningLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cleaning_log_id")
    private Long cleaningLogId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_id")
    private Bed bed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_user_id", nullable = false)
    private User performedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id")
    private User verifiedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "cleaning_method", nullable = false, length = 50)
    private CleaningMethod cleaningMethod;

    @Column(name = "disinfectant_used", length = 150)
    private String disinfectantUsed;

    @Column(name = "qr_scanned_token", nullable = false, length = 100)
    private String qrScannedToken;

    @Column(name = "hygiene_score_post_clean", precision = 5, scale = 2)
    private BigDecimal hygieneScorePostClean;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "SUBMITTED";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public CleaningLog() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "SUBMITTED";
    }

    public Long getCleaningLogId() { return cleaningLogId; }
    public void setCleaningLogId(Long cleaningLogId) { this.cleaningLogId = cleaningLogId; }

    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }

    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }

    public Bed getBed() { return bed; }
    public void setBed(Bed bed) { this.bed = bed; }

    public User getPerformedBy() { return performedBy; }
    public void setPerformedBy(User performedBy) { this.performedBy = performedBy; }

    public User getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(User verifiedBy) { this.verifiedBy = verifiedBy; }

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
