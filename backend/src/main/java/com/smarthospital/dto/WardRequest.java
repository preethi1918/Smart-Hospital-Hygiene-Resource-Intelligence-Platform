package com.smarthospital.dto;

import com.smarthospital.model.enums.WardType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class WardRequest {

    @NotNull(message = "Floor ID is required")
    private Integer floorId;

    @NotBlank(message = "Ward code is required")
    @Size(max = 50, message = "Ward code cannot exceed 50 characters")
    private String wardCode;

    @NotBlank(message = "Ward name is required")
    @Size(max = 150, message = "Ward name cannot exceed 150 characters")
    private String name;

    @NotNull(message = "Ward type is required (e.g. GENERAL_MEDICAL, ICU_CRITICAL_CARE, OPERATION_THEATRE, ISOLATION_AIRBORNE, etc.)")
    private WardType wardType;

    @DecimalMin(value = "0.0", message = "Target score must be at least 0.0")
    @DecimalMax(value = "100.0", message = "Target score cannot exceed 100.0")
    private BigDecimal hygieneTargetScore = new BigDecimal("95.00");

    @DecimalMin(value = "0.0", message = "Current score must be at least 0.0")
    @DecimalMax(value = "100.0", message = "Current score cannot exceed 100.0")
    private BigDecimal currentHygieneScore = new BigDecimal("100.00");

    @Size(max = 50, message = "Status cannot exceed 50 characters")
    private String status = "ACTIVE";

    public WardRequest() {}

    public Integer getFloorId() { return floorId; }
    public void setFloorId(Integer floorId) { this.floorId = floorId; }

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
}
