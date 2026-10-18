package com.smarthospital.model;

import com.smarthospital.model.enums.HygieneState;
import com.smarthospital.model.enums.LinenType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "linen")
public class Linen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "linen_id")
    private Long linenId;

    @Column(name = "rfid_tag_or_barcode", nullable = false, unique = true, length = 100)
    private String rfidTagOrBarcode;

    @Enumerated(EnumType.STRING)
    @Column(name = "linen_type", nullable = false, length = 50)
    private LinenType linenType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_bed_id")
    private Bed assignedBed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_ward_id")
    private Ward assignedWard;

    @Column(name = "lifecycle_wash_count", nullable = false)
    private Integer lifecycleWashCount = 0;

    @Column(name = "max_recommended_wash_cycles", nullable = false)
    private Integer maxRecommendedWashCycles = 60;

    @Enumerated(EnumType.STRING)
    @Column(name = "hygiene_state", nullable = false, length = 50)
    private HygieneState hygieneState = HygieneState.CLEAN_STERILIZED;

    @Column(name = "last_washed_at")
    private LocalDateTime lastWashedAt;

    @Column(name = "last_sterilized_at")
    private LocalDateTime lastSterilizedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Linen() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (lifecycleWashCount == null) lifecycleWashCount = 0;
        if (maxRecommendedWashCycles == null) maxRecommendedWashCycles = 60;
        if (hygieneState == null) hygieneState = HygieneState.CLEAN_STERILIZED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getLinenId() { return linenId; }
    public void setLinenId(Long linenId) { this.linenId = linenId; }

    public String getRfidTagOrBarcode() { return rfidTagOrBarcode; }
    public void setRfidTagOrBarcode(String rfidTagOrBarcode) { this.rfidTagOrBarcode = rfidTagOrBarcode; }

    public LinenType getLinenType() { return linenType; }
    public void setLinenType(LinenType linenType) { this.linenType = linenType; }

    public Bed getAssignedBed() { return assignedBed; }
    public void setAssignedBed(Bed assignedBed) { this.assignedBed = assignedBed; }

    public Ward getAssignedWard() { return assignedWard; }
    public void setAssignedWard(Ward assignedWard) { this.assignedWard = assignedWard; }

    public Integer getLifecycleWashCount() { return lifecycleWashCount; }
    public void setLifecycleWashCount(Integer lifecycleWashCount) { this.lifecycleWashCount = lifecycleWashCount; }

    public Integer getMaxRecommendedWashCycles() { return maxRecommendedWashCycles; }
    public void setMaxRecommendedWashCycles(Integer maxRecommendedWashCycles) { this.maxRecommendedWashCycles = maxRecommendedWashCycles; }

    public HygieneState getHygieneState() { return hygieneState; }
    public void setHygieneState(HygieneState hygieneState) { this.hygieneState = hygieneState; }

    public LocalDateTime getLastWashedAt() { return lastWashedAt; }
    public void setLastWashedAt(LocalDateTime lastWashedAt) { this.lastWashedAt = lastWashedAt; }

    public LocalDateTime getLastSterilizedAt() { return lastSterilizedAt; }
    public void setLastSterilizedAt(LocalDateTime lastSterilizedAt) { this.lastSterilizedAt = lastSterilizedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
