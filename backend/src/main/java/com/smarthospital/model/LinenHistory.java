package com.smarthospital.model;

import com.smarthospital.model.enums.LinenStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "linen_history")
public class LinenHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "linen_id", nullable = false)
    private Linen linen;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 50)
    private LinenStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 50)
    private LinenStatus newStatus;

    @Column(name = "previous_location", length = 150)
    private String previousLocation;

    @Column(name = "new_location", length = 150)
    private String newLocation;

    @Column(name = "assigned_bed_number", length = 100)
    private String assignedBedNumber;

    @Column(name = "wash_cycle_count_at_event")
    private Integer washCycleCountAtEvent;

    @Column(name = "performed_by", length = 100)
    private String performedBy;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    public LinenHistory() {}

    public LinenHistory(Linen linen, String action, LinenStatus previousStatus, LinenStatus newStatus,
                        String previousLocation, String newLocation, String assignedBedNumber,
                        Integer washCycleCountAtEvent, String performedBy, String notes) {
        this.linen = linen;
        this.action = action;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.previousLocation = previousLocation;
        this.newLocation = newLocation;
        this.assignedBedNumber = assignedBedNumber;
        this.washCycleCountAtEvent = washCycleCountAtEvent;
        this.performedBy = performedBy;
        this.notes = notes;
        this.recordedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) {
            recordedAt = LocalDateTime.now();
        }
    }

    public Long getHistoryId() { return historyId; }
    public void setHistoryId(Long historyId) { this.historyId = historyId; }

    public Linen getLinen() { return linen; }
    public void setLinen(Linen linen) { this.linen = linen; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public LinenStatus getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(LinenStatus previousStatus) { this.previousStatus = previousStatus; }

    public LinenStatus getNewStatus() { return newStatus; }
    public void setNewStatus(LinenStatus newStatus) { this.newStatus = newStatus; }

    public String getPreviousLocation() { return previousLocation; }
    public void setPreviousLocation(String previousLocation) { this.previousLocation = previousLocation; }

    public String getNewLocation() { return newLocation; }
    public void setNewLocation(String newLocation) { this.newLocation = newLocation; }

    public String getAssignedBedNumber() { return assignedBedNumber; }
    public void setAssignedBedNumber(String assignedBedNumber) { this.assignedBedNumber = assignedBedNumber; }

    public Integer getWashCycleCountAtEvent() { return washCycleCountAtEvent; }
    public void setWashCycleCountAtEvent(Integer washCycleCountAtEvent) { this.washCycleCountAtEvent = washCycleCountAtEvent; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
}
