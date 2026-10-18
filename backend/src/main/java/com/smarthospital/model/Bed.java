package com.smarthospital.model;

import com.smarthospital.model.enums.BedType;
import com.smarthospital.model.enums.OperationalStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "beds", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"room_id", "bed_number"})
})
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bed_id")
    private Long bedId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "bed_number", nullable = false, length = 50)
    private String bedNumber;

    @Column(name = "qr_code_identifier", nullable = false, unique = true, length = 100)
    private String qrCodeIdentifier;

    @Enumerated(EnumType.STRING)
    @Column(name = "bed_type", nullable = false, length = 50)
    private BedType bedType;

    @Enumerated(EnumType.STRING)
    @Column(name = "operational_status", nullable = false, length = 50)
    private OperationalStatus operationalStatus = OperationalStatus.VACANT_CLEAN;

    @Column(name = "current_occupancy_reference", length = 100)
    private String currentOccupancyReference;

    @Column(name = "last_bedsheet_change_at")
    private LocalDateTime lastBedsheetChangeAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Bed() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (operationalStatus == null) operationalStatus = OperationalStatus.VACANT_CLEAN;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getBedId() { return bedId; }
    public void setBedId(Long bedId) { this.bedId = bedId; }

    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }

    public String getBedNumber() { return bedNumber; }
    public void setBedNumber(String bedNumber) { this.bedNumber = bedNumber; }

    public String getQrCodeIdentifier() { return qrCodeIdentifier; }
    public void setQrCodeIdentifier(String qrCodeIdentifier) { this.qrCodeIdentifier = qrCodeIdentifier; }

    public BedType getBedType() { return bedType; }
    public void setBedType(BedType bedType) { this.bedType = bedType; }

    public OperationalStatus getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(OperationalStatus operationalStatus) { this.operationalStatus = operationalStatus; }

    public String getCurrentOccupancyReference() { return currentOccupancyReference; }
    public void setCurrentOccupancyReference(String currentOccupancyReference) { this.currentOccupancyReference = currentOccupancyReference; }

    public LocalDateTime getLastBedsheetChangeAt() { return lastBedsheetChangeAt; }
    public void setLastBedsheetChangeAt(LocalDateTime lastBedsheetChangeAt) { this.lastBedsheetChangeAt = lastBedsheetChangeAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
