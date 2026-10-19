package com.smarthospital.model;

import com.smarthospital.model.enums.DamageStatus;
import com.smarthospital.model.enums.HygieneState;
import com.smarthospital.model.enums.LinenStatus;
import com.smarthospital.model.enums.LinenType;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "linen")
public class Linen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "linen_id")
    private Long linenId;

    @Column(name = "linen_code", nullable = false, unique = true, length = 100)
    private String linenCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "linen_type", nullable = false, length = 50)
    private LinenType linenType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private LinenStatus status = LinenStatus.CLEAN;

    @Enumerated(EnumType.STRING)
    @Column(name = "hygiene_state", length = 50)
    private HygieneState hygieneState = HygieneState.CLEAN_STERILIZED;

    @Column(name = "rfid_tag_or_barcode", length = 100)
    private String rfidTagOrBarcode;

    @Column(name = "current_location", nullable = false, length = 150)
    private String currentLocation = "Central Linen Storage";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_bed_id")
    private Bed assignedBed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_ward_id")
    private Ward assignedWard;

    @Column(name = "last_washed_date")
    private LocalDate lastWashedDate;

    @Column(name = "wash_cycle_count", nullable = false)
    private Integer washCycleCount = 0;

    @Column(name = "lifecycle_wash_count", nullable = false)
    private Integer lifecycleWashCount = 0;

    @Column(name = "max_wash_cycles", nullable = false)
    private Integer maxWashCycles = 60;

    @Column(name = "max_recommended_wash_cycles", nullable = false)
    private Integer maxRecommendedWashCycles = 60;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "damage_status", nullable = false, length = 50)
    private DamageStatus damageStatus = DamageStatus.NONE;

    @Column(name = "damage_notes", length = 500)
    private String damageNotes;

    @OneToMany(mappedBy = "linen", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("recordedAt DESC")
    private List<LinenHistory> historyRecords = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Linen() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (washCycleCount == null) washCycleCount = 0;
        lifecycleWashCount = washCycleCount;
        if (maxWashCycles == null) maxWashCycles = 60;
        maxRecommendedWashCycles = maxWashCycles;
        if (status == null) status = LinenStatus.CLEAN;
        if (damageStatus == null) damageStatus = DamageStatus.NONE;
        if (currentLocation == null || currentLocation.trim().isEmpty()) {
            currentLocation = "Central Linen Storage";
        }
        if (issueDate == null) {
            issueDate = LocalDate.now();
        }
        if (rfidTagOrBarcode == null || rfidTagOrBarcode.trim().isEmpty()) {
            rfidTagOrBarcode = linenCode;
        }
        syncHygieneState();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (washCycleCount == null) washCycleCount = 0;
        lifecycleWashCount = washCycleCount;
        if (maxWashCycles == null) maxWashCycles = 60;
        maxRecommendedWashCycles = maxWashCycles;
        if (rfidTagOrBarcode == null || rfidTagOrBarcode.trim().isEmpty()) {
            rfidTagOrBarcode = linenCode;
        }
        syncHygieneState();
    }

    private void syncHygieneState() {
        if (status == LinenStatus.CLEAN) {
            hygieneState = HygieneState.CLEAN_STERILIZED;
        } else if (status == LinenStatus.IN_USE) {
            hygieneState = HygieneState.IN_USE;
        } else if (status == LinenStatus.DUE_FOR_CHANGE) {
            hygieneState = HygieneState.SOILED_CONTAMINATED;
        } else if (status == LinenStatus.IN_LAUNDRY) {
            hygieneState = HygieneState.IN_LAUNDRY;
        } else if (status == LinenStatus.DAMAGED || status == LinenStatus.RETIRED) {
            hygieneState = HygieneState.DISCARDED;
        } else {
            hygieneState = HygieneState.CLEAN_STERILIZED;
        }
    }

    public Long getLinenId() { return linenId; }
    public void setLinenId(Long linenId) { this.linenId = linenId; }

    public String getLinenCode() { return linenCode; }
    public void setLinenCode(String linenCode) { this.linenCode = linenCode; }

    public LinenType getLinenType() { return linenType; }
    public void setLinenType(LinenType linenType) { this.linenType = linenType; }

    public LinenStatus getStatus() { return status; }
    public void setStatus(LinenStatus status) { this.status = status; }

    public String getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(String currentLocation) { this.currentLocation = currentLocation; }

    public Bed getAssignedBed() { return assignedBed; }
    public void setAssignedBed(Bed assignedBed) { this.assignedBed = assignedBed; }

    public Ward getAssignedWard() { return assignedWard; }
    public void setAssignedWard(Ward assignedWard) { this.assignedWard = assignedWard; }

    public LocalDate getLastWashedDate() { return lastWashedDate; }
    public void setLastWashedDate(LocalDate lastWashedDate) { this.lastWashedDate = lastWashedDate; }

    public Integer getWashCycleCount() { return washCycleCount; }
    public void setWashCycleCount(Integer washCycleCount) {
        this.washCycleCount = washCycleCount != null ? washCycleCount : 0;
        this.lifecycleWashCount = this.washCycleCount;
    }

    public Integer getMaxWashCycles() { return maxWashCycles; }
    public void setMaxWashCycles(Integer maxWashCycles) {
        this.maxWashCycles = maxWashCycles != null ? maxWashCycles : 60;
        this.maxRecommendedWashCycles = this.maxWashCycles;
    }

    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }

    public DamageStatus getDamageStatus() { return damageStatus; }
    public void setDamageStatus(DamageStatus damageStatus) { this.damageStatus = damageStatus; }

    public String getDamageNotes() { return damageNotes; }
    public void setDamageNotes(String damageNotes) { this.damageNotes = damageNotes; }

    public List<LinenHistory> getHistoryRecords() { return historyRecords; }
    public void setHistoryRecords(List<LinenHistory> historyRecords) { this.historyRecords = historyRecords; }

    public HygieneState getHygieneState() { return hygieneState; }
    public void setHygieneState(HygieneState hygieneState) { this.hygieneState = hygieneState; }

    public String getRfidTagOrBarcode() { return rfidTagOrBarcode; }
    public void setRfidTagOrBarcode(String rfidTagOrBarcode) { this.rfidTagOrBarcode = rfidTagOrBarcode; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
