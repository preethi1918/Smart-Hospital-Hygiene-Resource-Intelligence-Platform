package com.smarthospital.dto;

import com.smarthospital.model.enums.DamageStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class LinenDamageRequest {

    @NotNull(message = "Damage status is required (NONE, MINOR_WEAR, STAINED, TORN, CONTAMINATED, SEVERELY_DAMAGED)")
    private DamageStatus damageStatus;

    @Size(max = 500, message = "Damage notes cannot exceed 500 characters")
    private String damageNotes;

    private boolean retireIfSevere = false;

    public LinenDamageRequest() {}

    public DamageStatus getDamageStatus() { return damageStatus; }
    public void setDamageStatus(DamageStatus damageStatus) { this.damageStatus = damageStatus; }

    public String getDamageNotes() { return damageNotes; }
    public void setDamageNotes(String damageNotes) { this.damageNotes = damageNotes; }

    public boolean isRetireIfSevere() { return retireIfSevere; }
    public void setRetireIfSevere(boolean retireIfSevere) { this.retireIfSevere = retireIfSevere; }
}
