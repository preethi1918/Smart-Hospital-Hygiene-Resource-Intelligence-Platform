// IoT Telemetry & Real-Time Simulation Engine
// Smart Hospital Hygiene & Resource Intelligence Platform

const { initialZones, initialResources, initialAlerts } = require('./data/hospitalModel');

class HospitalSimulationEngine {
  constructor(broadcastCallback) {
    this.zones = JSON.parse(JSON.stringify(initialZones));
    this.resources = JSON.parse(JSON.stringify(initialResources));
    this.alerts = JSON.parse(JSON.stringify(initialAlerts));
    this.broadcast = broadcastCallback || (() => {});
    this.simSpeed = 1; // 1x normal speed
    this.isRunning = true;
    this.intervalId = null;
    this.alertCounter = 1100;
  }

  start() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.tick();
    }, 2500);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  tick() {
    if (!this.isRunning) return;

    // 1. Update Dispenser Telemetry
    this.zones.forEach(zone => {
      zone.devices.dispensers.forEach(dsp => {
        // Stochastic dispense event (higher chance in ER and ICU)
        const eventProb = zone.id === 'ER-TRAUMA' ? 0.65 : (zone.id === 'ICU-W1' ? 0.5 : 0.3);
        if (Math.random() < eventProb) {
          dsp.totalDispenses += 1;
          // Slowly decrease level by 0.05%
          if (dsp.levelPct > 0) {
            dsp.levelPct = Math.max(0, +(dsp.levelPct - 0.05).toFixed(1));
          }
          // Slight compliance micro-variation
          const delta = (Math.random() - 0.48) * 0.4;
          dsp.compliancePct = Math.min(100, Math.max(70, +(dsp.compliancePct + delta).toFixed(1)));

          // Check if dispenser hit low threshold
          if (dsp.levelPct <= 15 && dsp.status !== 'Refill Required') {
            dsp.status = 'Refill Required';
            this.createAlert({
              zoneId: zone.id,
              zoneName: zone.name,
              device: `${dsp.id} (${dsp.location})`,
              severity: 'warning',
              type: 'DISPENSER_LOW',
              message: `Sanitizer cartridge depleted to ${dsp.levelPct}%. Auto-replenishment order dispatched.`
            });
          }
        }
      });

      // 2. Update UV-C Disinfection Cycles
      zone.devices.uvcUnits.forEach(uv => {
        if (uv.status === 'Active') {
          uv.progressPct = Math.min(100, uv.progressPct + Math.floor(Math.random() * 4) + 2);
          uv.dosageMj = Math.min(uv.targetDosage, +(uv.dosageMj + 0.8).toFixed(1));

          if (uv.progressPct >= 100) {
            uv.status = 'Completed';
            uv.lastCycleTime = 'Just now';
            this.createAlert({
              zoneId: zone.id,
              zoneName: zone.name,
              device: uv.name,
              severity: 'info',
              type: 'STERILIZATION_COMPLETE',
              message: `Terminal UV-C sterilization cycle completed with lethal dose of ${uv.dosageMj} mJ/cm² (99.999% microbial clearance).`
            });
          }
        }
      });

      // 3. Update Bio-Waste Bins
      zone.devices.bioBins.forEach(bin => {
        if (Math.random() < 0.25) {
          const inc = (Math.random() * 0.25);
          bin.fillPct = Math.min(100, +(bin.fillPct + inc).toFixed(1));
          bin.weightKg = +(bin.weightKg + (inc * 0.15)).toFixed(1);

          if (bin.fillPct >= 90 && bin.status !== 'Critical - Empty Imminent') {
            bin.status = 'Critical - Empty Imminent';
            this.createAlert({
              zoneId: zone.id,
              zoneName: zone.name,
              device: `${bin.id} (${bin.type})`,
              severity: 'critical',
              type: 'BIO_WASTE_CRITICAL',
              message: `Bio-waste container overflow risk at ${bin.fillPct}% capacity (${bin.weightKg}kg). Hazardous spill prevention protocol triggered.`
            });
          } else if (bin.fillPct >= 75 && bin.fillPct < 90 && bin.status === 'Normal') {
            bin.status = 'Monitor';
          }
        }
      });

      // 4. Update Air Quality & Ventilation (ACH, PM2.5, Pressure)
      // Positive pressure for OT (+25Pa), negative for ICU/Lab (-8 to -12Pa)
      const pressJitter = (Math.random() - 0.5) * 0.3;
      zone.pressurePa = +(zone.pressurePa + pressJitter).toFixed(1);

      const achJitter = (Math.random() - 0.5) * 0.2;
      zone.ach = Math.max(4, +(zone.ach + achJitter).toFixed(1));

      const pmJitter = (Math.random() - 0.48) * 0.15;
      zone.pm25 = Math.max(0.5, +(zone.pm25 + pmJitter).toFixed(1));
      zone.pm10 = Math.max(1.0, +(zone.pm10 + pmJitter * 1.5).toFixed(1));

      // Microbial CFU estimate formula
      zone.cfuEst = Math.max(0.8, +(zone.pm25 * 0.8 + (100 - zone.hygieneScore) * 0.2).toFixed(1));

      // 5. Compute Live Zone Hygiene Score
      let avgDispenserCompliance = zone.devices.dispensers.reduce((acc, d) => acc + d.compliancePct, 0) / zone.devices.dispensers.length;
      let binCleanliness = 100 - (zone.devices.bioBins.reduce((acc, b) => acc + b.fillPct, 0) / zone.devices.bioBins.length);
      let airSterility = Math.min(100, Math.max(50, 100 - (zone.pm25 * 2.5)));
      
      let computedScore = +(0.4 * avgDispenserCompliance + 0.3 * airSterility + 0.3 * binCleanliness).toFixed(1);
      zone.hygieneScore = computedScore;

      // Risk categorization
      if (computedScore >= 90) zone.riskLevel = 'Nominal';
      else if (computedScore >= 78) zone.riskLevel = 'Moderate';
      else if (computedScore >= 65) zone.riskLevel = 'Elevated';
      else zone.riskLevel = 'High Risk';
    });

    // 6. Resources micro-changes
    // Oxygen flow & slight tank depletion
    if (this.resources.oxygen.lmoBulkTankPct > 10) {
      this.resources.oxygen.lmoBulkTankPct = +(this.resources.oxygen.lmoBulkTankPct - 0.005).toFixed(3);
    }
    const o2Jitter = (Math.random() - 0.5) * 0.04;
    this.resources.oxygen.manifoldPressureBar = +(this.resources.oxygen.manifoldPressureBar + o2Jitter).toFixed(2);
    
    // Slight flow fluctuation
    this.resources.oxygen.totalFlowRateLpm = Math.floor(380 + (Math.random() - 0.5) * 20);

    // Broadcast state update to clients
    this.broadcast({
      type: 'TELEMETRY_UPDATE',
      timestamp: new Date().toISOString(),
      data: {
        zones: this.zones,
        resources: this.resources,
        systemStats: this.getSystemStats()
      }
    });
  }

  getSystemStats() {
    const totalDispensers = this.zones.reduce((sum, z) => sum + z.devices.dispensers.length, 0);
    const avgCompliance = +(this.zones.reduce((sum, z) => {
      const zAvg = z.devices.dispensers.reduce((a, d) => a + d.compliancePct, 0) / z.devices.dispensers.length;
      return sum + zAvg;
    }, 0) / this.zones.length).toFixed(1);

    const overallHygieneIndex = +(this.zones.reduce((sum, z) => sum + z.hygieneScore, 0) / this.zones.length).toFixed(1);
    const activeAlertsCount = this.alerts.filter(a => a.status === 'Active').length;
    const criticalAlertsCount = this.alerts.filter(a => a.status === 'Active' && a.severity === 'critical').length;
    const activeUvcCount = this.zones.reduce((sum, z) => sum + z.devices.uvcUnits.filter(u => u.status === 'Active').length, 0);

    return {
      overallHygieneIndex,
      avgCompliance,
      totalDispensers,
      activeAlertsCount,
      criticalAlertsCount,
      activeUvcCount,
      activeSurgeriesTotal: 2,
      icuOccupancyRate: +( (this.resources.beds.icuOccupied / this.resources.beds.icuTotal) * 100 ).toFixed(1),
      oxygenPressure: this.resources.oxygen.manifoldPressureBar
    };
  }

  createAlert({ zoneId, zoneName, device, severity, type, message, assignedStaff }) {
    this.alertCounter += 1;
    const newAlert = {
      id: `ALT-${this.alertCounter}`,
      timestamp: new Date().toISOString(),
      zoneId,
      zoneName: zoneName || this.zones.find(z => z.id === zoneId)?.name || 'General',
      device,
      severity,
      type,
      message,
      status: 'Active',
      assignedStaff: assignedStaff || 'Pending Rapid Dispatch'
    };

    // Prepend to alerts list
    this.alerts.unshift(newAlert);
    if (this.alerts.length > 50) this.alerts.pop();

    this.broadcast({
      type: 'NEW_ALERT',
      alert: newAlert
    });

    return newAlert;
  }

  acknowledgeAlert(alertId, staffName) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'Acknowledged';
      if (staffName) alert.assignedStaff = `${staffName} (Acknowledged)`;
      this.broadcast({
        type: 'ALERT_UPDATED',
        alert
      });
      return alert;
    }
    return null;
  }

  resolveAlert(alertId, resolutionNote) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'Resolved';
      alert.resolutionNote = resolutionNote || 'Sanitization protocol executed and verified.';
      this.broadcast({
        type: 'ALERT_UPDATED',
        alert
      });
      return alert;
    }
    return null;
  }

  emptyBioBin(binId) {
    let foundBin = null;
    this.zones.forEach(z => {
      const bin = z.devices.bioBins.find(b => b.id === binId);
      if (bin) {
        bin.fillPct = 4;
        bin.weightKg = +(bin.maxWeightKg * 0.04).toFixed(1);
        bin.status = 'Normal';
        bin.lastEmptied = 'Just now';
        foundBin = bin;
      }
    });

    if (foundBin) {
      this.createAlert({
        zoneId: 'GENERAL',
        zoneName: 'Central Hazardous Waste Transfer',
        device: foundBin.id,
        severity: 'info',
        type: 'BIO_WASTE_EMPTIED',
        message: `${foundBin.id} (${foundBin.type}) safely decanted and autoclaved by hazardous material logistics.`
      });
      this.tick();
    }
    return foundBin;
  }

  refillDispenser(dispenserId) {
    let foundDsp = null;
    this.zones.forEach(z => {
      const dsp = z.devices.dispensers.find(d => d.id === dispenserId);
      if (dsp) {
        dsp.levelPct = 100;
        dsp.status = 'Active';
        foundDsp = dsp;
      }
    });

    if (foundDsp) {
      this.createAlert({
        zoneId: 'GENERAL',
        zoneName: 'Sanitation Central Logistics',
        device: foundDsp.id,
        severity: 'info',
        type: 'DISPENSER_REFILLED',
        message: `Dispenser ${foundDsp.id} refilled with 70% Isopropanol hospital-grade antiseptic solution.`
      });
      this.tick();
    }
    return foundDsp;
  }

  startUvcCycle(uvcId, durationMinutes = 15) {
    let targetUvc = null;
    let targetZone = null;
    this.zones.forEach(z => {
      const u = z.devices.uvcUnits.find(unit => unit.id === uvcId);
      if (u) {
        targetUvc = u;
        targetZone = z;
      }
    });

    if (targetUvc) {
      targetUvc.status = 'Active';
      targetUvc.progressPct = 5;
      targetUvc.dosageMj = 2.0;
      targetUvc.motionLockout = true;
      targetUvc.lastCycleTime = 'Initiated';

      this.createAlert({
        zoneId: targetZone.id,
        zoneName: targetZone.name,
        device: targetUvc.name,
        severity: 'warning',
        type: 'UVC_CYCLE_START',
        message: `WARNING: High-intensity UV-C disinfection active in ${targetZone.name}. PIR motion interlock enabled. Room sealed.`
      });
      this.tick();
      return targetUvc;
    }
    return null;
  }

  injectAnomaly(anomalyType, zoneId = 'OT-COMPLEX') {
    const zone = this.zones.find(z => z.id === zoneId) || this.zones[0];
    switch (anomalyType) {
      case 'HEPA_FAILURE':
        zone.hepaFilterLife = 14;
        zone.pm25 = 38.5;
        zone.pm10 = 74.0;
        zone.ach = 6.2;
        zone.pressurePa = 3.2; // Lost positive pressure barrier
        zone.hygieneScore = 58.2;
        zone.riskLevel = 'High Risk';
        return this.createAlert({
          zoneId: zone.id,
          zoneName: zone.name,
          device: 'HEPA Filtration Unit #03',
          severity: 'critical',
          type: 'HEPA_FILTER_BREACH',
          message: `CRITICAL: HEPA filter pressure drop collapsed. Airborne particulate count spiked to 38.5 µg/m³. Positive pressure seal breached in ${zone.name}!`
        });

      case 'CONTAMINATION_SURGE':
        zone.devices.dispensers.forEach(d => {
          d.compliancePct = +(d.compliancePct - 25).toFixed(1);
        });
        zone.devices.bioBins.forEach(b => {
          b.fillPct = 96;
          b.status = 'Critical - Empty Imminent';
        });
        zone.hygieneScore = 61.4;
        zone.riskLevel = 'High Risk';
        return this.createAlert({
          zoneId: zone.id,
          zoneName: zone.name,
          device: 'Department Infection Control Watch',
          severity: 'critical',
          type: 'HAI_OUTBREAK_RISK',
          message: `URGENT: Composite Hygiene Index plummeted to ${zone.hygieneScore}%. High Hospital-Acquired Infection (HAI) pathogen transmission probability detected in ${zone.name}.`
        });

      case 'OXYGEN_PRESSURE_DROP':
        this.resources.oxygen.manifoldPressureBar = 3.10; // Drop below standard 4.2 bar
        this.resources.oxygen.status = 'Low Pressure Alarm';
        return this.createAlert({
          zoneId: 'ICU-W1',
          zoneName: 'Central Oxygen Manifold Bay',
          device: 'Oxygen Line Sensor S-402',
          severity: 'critical',
          type: 'OXYGEN_PRESSURE_DROP',
          message: 'CRITICAL HAZARD: Central medical oxygen manifold pressure dropped to 3.10 bar (safe baseline: 4.20 bar). Secondary cryogenic tank backup auto-switching.'
        });

      case 'BIO_WASTE_SPILL':
        const bin = zone.devices.bioBins[0];
        if (bin) {
          bin.fillPct = 100;
          bin.status = 'Spill Alarm';
          return this.createAlert({
            zoneId: zone.id,
            zoneName: zone.name,
            device: `${bin.id} (${bin.type})`,
            severity: 'critical',
            type: 'BIOHAZARD_SPILL',
            message: `HAZARD WARNING: Bio-hazardous waste bin ${bin.id} optical sensor triggered spill/tilt event in ${zone.name}. Hazardous response team required immediately.`
          });
        }
        break;

      default:
        return null;
    }
  }

  resetAll() {
    this.zones = JSON.parse(JSON.stringify(initialZones));
    this.resources = JSON.parse(JSON.stringify(initialResources));
    this.alerts = JSON.parse(JSON.stringify(initialAlerts));
    this.tick();
  }
}

module.exports = HospitalSimulationEngine;
