package com.smarthospital.model;

import com.smarthospital.model.enums.AirflowType;
import com.smarthospital.model.enums.ReadinessStatus;
import com.smarthospital.model.enums.RoomType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rooms", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"ward_id", "room_number"})
})
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long roomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    @Column(name = "room_number", nullable = false, length = 50)
    private String roomNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false, length = 50)
    private RoomType roomType;

    @Column(name = "qr_code_identifier", nullable = false, unique = true, length = 100)
    private String qrCodeIdentifier;

    @Enumerated(EnumType.STRING)
    @Column(name = "airflow_type", nullable = false, length = 50)
    private AirflowType airflowType = AirflowType.STANDARD_LAMINAR;

    @Enumerated(EnumType.STRING)
    @Column(name = "readiness_status", nullable = false, length = 50)
    private ReadinessStatus readinessStatus = ReadinessStatus.READY_FOR_USE;

    @Column(name = "last_cleaned_at")
    private LocalDateTime lastCleanedAt;

    @Column(name = "last_disinfected_at")
    private LocalDateTime lastDisinfectedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Room() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (airflowType == null) airflowType = AirflowType.STANDARD_LAMINAR;
        if (readinessStatus == null) readinessStatus = ReadinessStatus.READY_FOR_USE;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }

    public Ward getWard() { return ward; }
    public void setWard(Ward ward) { this.ward = ward; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public RoomType getRoomType() { return roomType; }
    public void setRoomType(RoomType roomType) { this.roomType = roomType; }

    public String getQrCodeIdentifier() { return qrCodeIdentifier; }
    public void setQrCodeIdentifier(String qrCodeIdentifier) { this.qrCodeIdentifier = qrCodeIdentifier; }

    public AirflowType getAirflowType() { return airflowType; }
    public void setAirflowType(AirflowType airflowType) { this.airflowType = airflowType; }

    public ReadinessStatus getReadinessStatus() { return readinessStatus; }
    public void setReadinessStatus(ReadinessStatus readinessStatus) { this.readinessStatus = readinessStatus; }

    public LocalDateTime getLastCleanedAt() { return lastCleanedAt; }
    public void setLastCleanedAt(LocalDateTime lastCleanedAt) { this.lastCleanedAt = lastCleanedAt; }

    public LocalDateTime getLastDisinfectedAt() { return lastDisinfectedAt; }
    public void setLastDisinfectedAt(LocalDateTime lastDisinfectedAt) { this.lastDisinfectedAt = lastDisinfectedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
