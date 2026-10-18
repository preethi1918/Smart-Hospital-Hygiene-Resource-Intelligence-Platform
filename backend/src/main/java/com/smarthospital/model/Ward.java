package com.smarthospital.model;

import com.smarthospital.model.enums.WardType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wards")
public class Ward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ward_id")
    private Integer wardId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Column(name = "ward_code", nullable = false, unique = true, length = 50)
    private String wardCode;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "ward_type", nullable = false, length = 50)
    private WardType wardType;

    @Column(name = "hygiene_target_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal hygieneTargetScore = new BigDecimal("95.00");

    @Column(name = "current_hygiene_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal currentHygieneScore = new BigDecimal("100.00");

    @Column(name = "status", nullable = false, length = 50)
    private String status = "ACTIVE";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Ward() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (hygieneTargetScore == null) hygieneTargetScore = new BigDecimal("95.00");
        if (currentHygieneScore == null) currentHygieneScore = new BigDecimal("100.00");
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Integer getWardId() { return wardId; }
    public void setWardId(Integer wardId) { this.wardId = wardId; }

    public Floor getFloor() { return floor; }
    public void setFloor(Floor floor) { this.floor = floor; }

    public String getWardCode() { return wardCode; }
    public void setWardCode(String wardCode) { this.wardCode = wardCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public WardType getWardType() { return wardType; }
    public void setWardType(WardType wardType) { this.wardType = wardType; }

    public BigDecimal getHygieneTargetScore() { return hygieneTargetScore; }
    public void setHygieneTargetScore(BigDecimal hygieneTargetScore) { this.hygieneTargetScore = hygieneTargetScore; }

    public BigDecimal getCurrentHygieneScore() { return currentHygieneScore; }
    public void setCurrentHygieneScore(BigDecimal currentHygieneScore) { this.currentHygieneScore = currentHygieneScore; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
