package com.smarthospital.model;

import com.smarthospital.model.enums.HazardStatus;
import com.smarthospital.model.enums.WasteCategory;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "waste_logs")
public class WasteLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "waste_log_id")
    private Long wasteLogId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_by_user_id", nullable = false)
    private User collectedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "waste_category", nullable = false, length = 50)
    private WasteCategory wasteCategory;

    @Column(name = "container_barcode_or_rfid", nullable = false, length = 100)
    private String containerBarcodeOrRfid;

    @Column(name = "weight_kg", nullable = false, precision = 6, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "fill_percentage", nullable = false)
    private Integer fillPercentage;

    @Column(name = "disposal_destination", nullable = false, length = 150)
    private String disposalDestination;

    @Enumerated(EnumType.STRING)
    @Column(name = "hazard_status", nullable = false, length = 50)
    private HazardStatus hazardStatus = HazardStatus.CONTAINED_SEALED;

    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public WasteLog() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (hazardStatus == null) hazardStatus = HazardStatus.CONTAINED_SEALED;
    }

    public Long getWasteLogId() { return wasteLogId; }
    public void setWasteLogId(Long wasteLogId) { this.wasteLogId = wasteLogId; }

    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }

    public Ward getWard() { return ward; }
    public void setWard(Ward ward) { this.ward = ward; }

    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }

    public User getCollectedBy() { return collectedBy; }
    public void setCollectedBy(User collectedBy) { this.collectedBy = collectedBy; }

    public WasteCategory getWasteCategory() { return wasteCategory; }
    public void setWasteCategory(WasteCategory wasteCategory) { this.wasteCategory = wasteCategory; }

    public String getContainerBarcodeOrRfid() { return containerBarcodeOrRfid; }
    public void setContainerBarcodeOrRfid(String containerBarcodeOrRfid) { this.containerBarcodeOrRfid = containerBarcodeOrRfid; }

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public Integer getFillPercentage() { return fillPercentage; }
    public void setFillPercentage(Integer fillPercentage) { this.fillPercentage = fillPercentage; }

    public String getDisposalDestination() { return disposalDestination; }
    public void setDisposalDestination(String disposalDestination) { this.disposalDestination = disposalDestination; }

    public HazardStatus getHazardStatus() { return hazardStatus; }
    public void setHazardStatus(HazardStatus hazardStatus) { this.hazardStatus = hazardStatus; }

    public LocalDateTime getCollectedAt() { return collectedAt; }
    public void setCollectedAt(LocalDateTime collectedAt) { this.collectedAt = collectedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
