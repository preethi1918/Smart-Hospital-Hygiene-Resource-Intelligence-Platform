// Hospital Model and Initial Telemetry State
// Smart Hospital Hygiene & Resource Intelligence Platform

const initialZones = [
  {
    id: 'OT-COMPLEX',
    name: 'Operating Theatre Complex (OT 1 & 2)',
    category: 'Ultra-Clean Sterile',
    floor: 'Level 2',
    hygieneScore: 98.4,
    pressurePa: 24.5, // Positive pressure ensures sterile airflow outwards
    targetPressure: 25.0,
    ach: 22.8, // Air changes per hour (min 20 required for surgical)
    targetAch: 20.0,
    pm25: 1.2,
    pm10: 2.5,
    cfuEst: 3.1, // CFU/m3
    hepaFilterLife: 88, // %
    temperatureC: 20.2,
    humidityPct: 48,
    activeSurgeries: 2,
    riskLevel: 'Nominal',
    devices: {
      dispensers: [
        { id: 'DSP-OT-01', location: 'OT-1 Surgical Scrub Station', levelPct: 82, batteryPct: 94, totalDispenses: 342, compliancePct: 98.6, status: 'Active' },
        { id: 'DSP-OT-02', location: 'OT-2 Scrub Bay Corridor', levelPct: 76, batteryPct: 91, totalDispenses: 298, compliancePct: 97.2, status: 'Active' },
        { id: 'DSP-OT-03', location: 'Anesthesia Induction Room', levelPct: 65, batteryPct: 88, totalDispenses: 184, compliancePct: 95.8, status: 'Active' }
      ],
      uvcUnits: [
        { id: 'UVC-OT-ALPHA', name: 'SterilaTech Pulsed Xenon UV-C', room: 'OT-1 Post-Op Sterilization', status: 'Idle', progressPct: 0, dosageMj: 45.2, targetDosage: 50.0, motionLockout: true, lastCycleTime: '45 mins ago' },
        { id: 'UVC-OT-BETA', name: 'Ceiling Array UVGI Sterilizer', room: 'OT-2 Continuous Air Inactivation', status: 'Active', progressPct: 64, dosageMj: 32.1, targetDosage: 50.0, motionLockout: true, lastCycleTime: 'In Progress' }
      ],
      bioBins: [
        { id: 'BIN-OT-01', type: 'Infectious / Surgical (Yellow)', fillPct: 42, weightKg: 8.4, maxWeightKg: 20, status: 'Normal', lastEmptied: '2h ago' },
        { id: 'BIN-OT-02', type: 'Sharps & Scalpels (Red)', fillPct: 68, weightKg: 4.2, maxWeightKg: 8, status: 'Monitor', lastEmptied: '4h ago' }
      ]
    }
  },
  {
    id: 'ICU-W1',
    name: 'Intensive Care Unit (Wings A & B)',
    category: 'Critical Care',
    floor: 'Level 3',
    hygieneScore: 92.6,
    pressurePa: -8.2, // Negative pressure isolation for airborne protection
    targetPressure: -10.0,
    ach: 14.5,
    targetAch: 12.0,
    pm25: 4.8,
    pm10: 9.1,
    cfuEst: 8.5,
    hepaFilterLife: 74,
    temperatureC: 22.1,
    humidityPct: 52,
    bedsOccupied: 14,
    bedsTotal: 16,
    riskLevel: 'Nominal',
    devices: {
      dispensers: [
        { id: 'DSP-ICU-01', location: 'ICU Bed 1-4 Bay Entrance', levelPct: 38, batteryPct: 84, totalDispenses: 620, compliancePct: 94.1, status: 'Active' },
        { id: 'DSP-ICU-02', location: 'Isolation Room 101 Ante-room', levelPct: 18, batteryPct: 79, totalDispenses: 412, compliancePct: 89.4, status: 'Low Liquid Warning' },
        { id: 'DSP-ICU-03', location: 'Central Nursing Island', levelPct: 84, batteryPct: 96, totalDispenses: 845, compliancePct: 96.5, status: 'Active' }
      ],
      uvcUnits: [
        { id: 'UVC-ICU-MOB1', name: 'SanitiBot Mobile Autonomous UV-C', room: 'Isolation Room 102 (Terminal Cleaning)', status: 'Active', progressPct: 82, dosageMj: 42.0, targetDosage: 48.0, motionLockout: true, lastCycleTime: 'In Progress' }
      ],
      bioBins: [
        { id: 'BIN-ICU-01', type: 'Infectious Bio-waste (Yellow)', fillPct: 89, weightKg: 17.8, maxWeightKg: 20, status: 'Critical - Empty Imminent', lastEmptied: '7h ago' },
        { id: 'BIN-ICU-02', type: 'Cytotoxic / Chemotherapy (Purple)', fillPct: 35, weightKg: 3.1, maxWeightKg: 10, status: 'Normal', lastEmptied: '5h ago' }
      ]
    }
  },
  {
    id: 'ER-TRAUMA',
    name: 'Emergency & Trauma Department',
    category: 'High Traffic Acute',
    floor: 'Ground Floor',
    hygieneScore: 84.1,
    pressurePa: 4.1,
    targetPressure: 5.0,
    ach: 10.2,
    targetAch: 10.0,
    pm25: 11.4,
    pm10: 22.0,
    cfuEst: 16.8,
    hepaFilterLife: 62,
    temperatureC: 23.5,
    humidityPct: 55,
    triageCount: 28,
    riskLevel: 'Moderate',
    devices: {
      dispensers: [
        { id: 'DSP-ER-01', location: 'Triage Waiting Desk', levelPct: 45, batteryPct: 72, totalDispenses: 1120, compliancePct: 83.2, status: 'Active' },
        { id: 'DSP-ER-02', location: 'Resuscitation Bay 1', levelPct: 62, batteryPct: 88, totalDispenses: 740, compliancePct: 91.0, status: 'Active' },
        { id: 'DSP-ER-03', location: 'Ambulance Triage Entry', levelPct: 24, batteryPct: 66, totalDispenses: 1350, compliancePct: 80.5, status: 'Refill Required' }
      ],
      uvcUnits: [
        { id: 'UVC-ER-01', name: 'Mobile UV-C Surface Disinfector', room: 'Decontamination Shower Area', status: 'Idle', progressPct: 0, dosageMj: 38.0, targetDosage: 40.0, motionLockout: false, lastCycleTime: '2h ago' }
      ],
      bioBins: [
        { id: 'BIN-ER-01', type: 'Infectious Bio-waste (Yellow)', fillPct: 78, weightKg: 15.6, maxWeightKg: 20, status: 'Monitor', lastEmptied: '3h ago' },
        { id: 'BIN-ER-02', type: 'Sharps & Needles (Red)', fillPct: 55, weightKg: 4.4, maxWeightKg: 8, status: 'Normal', lastEmptied: '3h ago' }
      ]
    }
  },
  {
    id: 'NEONATAL-ICU',
    name: 'Neonatal ICU (NICU)',
    category: 'Ultra-Sensitive Infant Care',
    floor: 'Level 3',
    hygieneScore: 97.8,
    pressurePa: 15.2,
    targetPressure: 15.0,
    ach: 18.0,
    targetAch: 16.0,
    pm25: 1.8,
    pm10: 3.4,
    cfuEst: 2.2,
    hepaFilterLife: 92,
    temperatureC: 24.0,
    humidityPct: 50,
    incubatorsActive: 12,
    riskLevel: 'Nominal',
    devices: {
      dispensers: [
        { id: 'DSP-NICU-01', location: 'Incubator Pod Entry Antechamber', levelPct: 88, batteryPct: 95, totalDispenses: 512, compliancePct: 99.1, status: 'Active' },
        { id: 'DSP-NICU-02', location: 'Milk Preparation & Feeding Bay', levelPct: 79, batteryPct: 92, totalDispenses: 380, compliancePct: 98.4, status: 'Active' }
      ],
      uvcUnits: [
        { id: 'UVC-NICU-01', name: 'Far-UVC 222nm Safe Continuous Disinfection', room: 'NICU Airlock Entry', status: 'Active', progressPct: 100, dosageMj: 22.0, targetDosage: 22.0, motionLockout: false, lastCycleTime: 'Continuous Active' }
      ],
      bioBins: [
        { id: 'BIN-NICU-01', type: 'Non-Hazardous Diaper & Waste (Black)', fillPct: 40, weightKg: 6.0, maxWeightKg: 15, status: 'Normal', lastEmptied: '1h ago' },
        { id: 'BIN-NICU-02', type: 'Clinical Sharps (Red)', fillPct: 22, weightKg: 1.8, maxWeightKg: 8, status: 'Normal', lastEmptied: '8h ago' }
      ]
    }
  },
  {
    id: 'GENERAL-WARD-3A',
    name: 'Inpatient Medical Ward 3A',
    category: 'General Inpatient',
    floor: 'Level 4',
    hygieneScore: 88.5,
    pressurePa: 2.0,
    targetPressure: 2.0,
    ach: 8.5,
    targetAch: 8.0,
    pm25: 9.8,
    pm10: 18.4,
    cfuEst: 14.2,
    hepaFilterLife: 70,
    temperatureC: 23.0,
    humidityPct: 54,
    bedsOccupied: 32,
    bedsTotal: 36,
    riskLevel: 'Nominal',
    devices: {
      dispensers: [
        { id: 'DSP-WARD-01', location: 'North Corridor Hub', levelPct: 54, batteryPct: 80, totalDispenses: 890, compliancePct: 88.2, status: 'Active' },
        { id: 'DSP-WARD-02', location: 'South Corridor Hub', levelPct: 48, batteryPct: 78, totalDispenses: 760, compliancePct: 86.9, status: 'Active' },
        { id: 'DSP-WARD-03', location: 'Nurse Station 3A', levelPct: 72, batteryPct: 90, totalDispenses: 1040, compliancePct: 93.4, status: 'Active' }
      ],
      uvcUnits: [
        { id: 'UVC-WARD-01', name: 'Mobile UV-C Terminal Unit', room: 'Terminal Discharge Sanitization Bay', status: 'Idle', progressPct: 0, dosageMj: 40.0, targetDosage: 40.0, motionLockout: false, lastCycleTime: '3h ago' }
      ],
      bioBins: [
        { id: 'BIN-WARD-01', type: 'Clinical Bio-waste (Yellow)', fillPct: 62, weightKg: 12.4, maxWeightKg: 20, status: 'Normal', lastEmptied: '4h ago' }
      ]
    }
  },
  {
    id: 'PATH-LAB',
    name: 'Diagnostic Microbiology & Pathology Lab',
    category: 'Biosafety Level 2',
    floor: 'Basement 1',
    hygieneScore: 95.0,
    pressurePa: -12.4,
    targetPressure: -12.0,
    ach: 15.6,
    targetAch: 15.0,
    pm25: 3.5,
    pm10: 6.8,
    cfuEst: 4.8,
    hepaFilterLife: 82,
    temperatureC: 21.0,
    humidityPct: 46,
    samplesInProcess: 145,
    riskLevel: 'Nominal',
    devices: {
      dispensers: [
        { id: 'DSP-LAB-01', location: 'BSL-2 Air Shower Airlock', levelPct: 68, batteryPct: 89, totalDispenses: 430, compliancePct: 98.0, status: 'Active' },
        { id: 'DSP-LAB-02', location: 'Microbial Culture Chamber Entry', levelPct: 74, batteryPct: 94, totalDispenses: 310, compliancePct: 99.0, status: 'Active' }
      ],
      uvcUnits: [
        { id: 'UVC-LAB-01', name: 'Biosafety Cabinet Automated UV Decontaminator', room: 'Culture Hood 4', status: 'Completed', progressPct: 100, dosageMj: 60.0, targetDosage: 60.0, motionLockout: true, lastCycleTime: '15 mins ago' }
      ],
      bioBins: [
        { id: 'BIN-LAB-01', type: 'Autoclave Biohazard Bags (Red)', fillPct: 72, weightKg: 14.4, maxWeightKg: 20, status: 'Monitor', lastEmptied: '2h ago' },
        { id: 'BIN-LAB-02', type: 'Cytotoxic / Chemical Reagent (Purple)', fillPct: 30, weightKg: 3.0, maxWeightKg: 10, status: 'Normal', lastEmptied: '6h ago' }
      ]
    }
  }
];

const initialResources = {
  oxygen: {
    lmoBulkTankPct: 84.5, // Liquid Medical Oxygen bulk tank capacity %
    manifoldPressureBar: 4.25, // Standard medical gas line pressure ~4.2 bar
    targetPressureBar: 4.20,
    totalFlowRateLpm: 385, // Liters per minute
    reserveHoursRemaining: 74,
    status: 'Optimal'
  },
  beds: {
    total: 120,
    occupied: 96,
    available: 24,
    icuOccupied: 14,
    icuTotal: 16,
    isolationOccupied: 4,
    isolationTotal: 6,
    turnoverRateAvgHours: 4.2
  },
  equipment: {
    ventilatorsInUse: 11,
    ventilatorsTotal: 14,
    infusionPumpsInUse: 48,
    infusionPumpsTotal: 55,
    hepaMobileUnitsActive: 8,
    hepaMobileUnitsTotal: 8,
    uvcRobotsActive: 2,
    uvcRobotsTotal: 4
  },
  consumables: {
    hospitalGradeSanitizerLiters: 480,
    maxSanitizerLiters: 600,
    ppeKitsFull: 1450,
    ppeKitsThreshold: 300,
    n95RespiratorMasks: 2800,
    sterileNitrileGlovesBoxes: 820,
    biohazardLinerBags: 650
  }
};

const initialAlerts = [
  {
    id: 'ALT-1092',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    zoneId: 'ICU-W1',
    zoneName: 'Intensive Care Unit (Wings A & B)',
    device: 'BIN-ICU-01 (Infectious Bio-waste)',
    severity: 'critical', // 'info', 'warning', 'critical'
    type: 'BIO_WASTE_OVERFILL',
    message: 'Biohazard container fill capacity reached 89% (17.8kg). Immediate hazardous disposal dispatch required.',
    status: 'Active',
    assignedStaff: 'Infection Control Unit (Nurse supervisor on duty: S. Johnson)'
  },
  {
    id: 'ALT-1088',
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    zoneId: 'ICU-W1',
    zoneName: 'Intensive Care Unit (Wings A & B)',
    device: 'DSP-ICU-02 (Dispenser Ante-room)',
    severity: 'warning',
    type: 'DISPENSER_LOW',
    message: 'Antiseptic hand rub volume dropped below 20% (18% remaining). Replenishment queued.',
    status: 'Active',
    assignedStaff: 'Sanitation Logistics Team'
  },
  {
    id: 'ALT-1075',
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    zoneId: 'ER-TRAUMA',
    zoneName: 'Emergency & Trauma Department',
    device: 'DSP-ER-03 (Ambulance Triage Entry)',
    severity: 'warning',
    type: 'COMPLIANCE_DROP',
    message: 'Hand sanitization compliance fell to 80.5% over the past 60 minutes during rapid admission surge.',
    status: 'Acknowledged',
    assignedStaff: 'ER Nursing In-charge'
  },
  {
    id: 'ALT-1061',
    timestamp: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
    zoneId: 'OT-COMPLEX',
    zoneName: 'Operating Theatre Complex (OT 1 & 2)',
    device: 'UVC-OT-BETA (Ceiling UVGI)',
    severity: 'info',
    type: 'STERILIZATION_CYCLE',
    message: 'Scheduled 50 mJ/cm² UVGI sterilization cycle 64% completed in preparation for Orthopedic surgery at 20:30.',
    status: 'Active',
    assignedStaff: 'OT Technician'
  }
];

module.exports = {
  initialZones,
  initialResources,
  initialAlerts
};
