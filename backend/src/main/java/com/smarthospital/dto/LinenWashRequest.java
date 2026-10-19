package com.smarthospital.dto;

import jakarta.validation.constraints.Size;

public class LinenWashRequest {

    @Size(max = 150, message = "Location cannot exceed 150 characters")
    private String newLocation = "Clean Linen Storage";

    private Double waterTemperatureCelsius = 71.0;

    @Size(max = 100, message = "Detergent name cannot exceed 100 characters")
    private String detergentOrDisinfectant = "Hospital-Grade Thermal Bio-Detergent";

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    public LinenWashRequest() {}

    public String getNewLocation() { return newLocation; }
    public void setNewLocation(String newLocation) { this.newLocation = newLocation; }

    public Double getWaterTemperatureCelsius() { return waterTemperatureCelsius; }
    public void setWaterTemperatureCelsius(Double waterTemperatureCelsius) { this.waterTemperatureCelsius = waterTemperatureCelsius; }

    public String getDetergentOrDisinfectant() { return detergentOrDisinfectant; }
    public void setDetergentOrDisinfectant(String detergentOrDisinfectant) { this.detergentOrDisinfectant = detergentOrDisinfectant; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
