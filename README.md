# Smart Hospital Hygiene & Resource Intelligence Platform 🏥✨

An enterprise-grade, real-time IoT, big data, and clinical infection intelligence platform designed for modern healthcare environments. It provides continuous surveillance of hospital hygiene compliance, autonomous UV-C disinfection, biohazard waste capacity, air sterility/pressure barriers, and critical life-support resources (liquid medical oxygen, ICU beds, ventilator fleets).

---

## 🌟 Key Features

### 1. Spatial Hygiene & IoT Hospital Floor Plan
- **Interactive SVG Hospital Wing Map**: High-tech architectural visualization of Operating Theatres (OT 1 & 2), Intensive Care Units (ICU Wings A & B), Emergency & Trauma Bay, Neonatal ICU (NICU), Inpatient Medical Ward 3A, and Diagnostic Microbiology Laboratory.
- **Pulsing Sensor Beacons**: Real-time visual feedback for smart sanitizers (Cyan), UV-C robots/emitters (Purple), biohazard waste bins (Yellow/Red), and negative/positive pressure enclosures (Teal/Emerald).
- **Interactive Zone Telemetry Inspector**: Instant deep-dive into zone cleanliness, airflow barrier pressure, ventilation ACH, particulate PM2.5, and microbial CFU counts.

### 2. Hygiene & Disinfection Command Center
- **Smart RFID Hand Sanitizer Dispensers**: Live tracking of cartridge fill levels, battery %, total dispense count, and staff compliance rates with 1-click rapid cartridge replenishment.
- **UV-C Terminal Sterilization Fleet**: Real-time radial progress tracking, accumulated radiation dosage ($mJ/cm^2$), PIR safety motion interlock protection, and terminal sterilization triggers.
- **Smart Bio-Hazard Waste Containers**: Color-coded categorization (Yellow Infectious, Red Sharps, Purple Cytotoxic, Black General), load-cell weight sensors, optical fill percentage, and hazmat decanting workflows.
- **Air Sterility & HVAC Pressure Barriers**: Positive pressure monitoring for surgical suites ($+25\text{ Pa}$), negative pressure containment for isolation rooms ($-8\text{ to } -12\text{ Pa}$), Air Changes per Hour (ACH), PM2.5/PM10 particle counts, and HEPA filter life indices.

### 3. Critical Resource & Asset Intelligence
- **Liquid Medical Oxygen (LMO) Telemetry**: Animated cryogenic bulk tank fluid gauge, central manifold line pressure in bar (with standard $4.20\text{ bar}$ safety baseline), total gas flow rate in L/min, and emergency reserve hours.
- **Critical Bed & Isolation Capacity**: Real-time occupancy metrics for ICU beds, airborne negative-pressure isolation suites, and general inpatient wards.
- **Life-Support Equipment Fleet**: Live telemetry for ventilators, infusion pumps, portable HEPA air scrubbers, and autonomous disinfection robots.
- **Infection Prevention Consumables**: RFID depot tracking for hospital-grade antiseptic solution, sterile PPE kits, N95 respirators, and biohazard liners.

### 4. Predictive AI & Cross-Data Correlation Analytics
- **Compliance Trends**: 12-hour historical trend visualization comparing surgical, critical care, and emergency departments.
- **HAI Outbreak Correlation**: Mathematical cross-correlation linking hand hygiene lapses with Hospital-Acquired Infection (HAI) pathogen transmission probability.
- **Bio-Waste Accumulation Velocity**: Real-time generation curves predicting central autoclave sterilization transfer cycles.

### 5. Incident Response & Real-Time Alert System
- **Synthesized Web Audio Alarm Chimes**: Built-in dual-mode clinical synthesizer (subtle harmonic chimes for warnings; pulsing urgent tones for critical hazards).
- **Incident Dispatch Workflow**: Incident acknowledgment, team assignment, and resolution logging.
- **Interactive Fault & Anomaly Simulator**: Slide-out drawer to inject HEPA filter collapses, contamination surges, oxygen line drops, and biohazard overflows to test fail-safes.

---

## 🛠️ Technology Stack

- **Backend**: Node.js & Express.js
- **Real-Time Communication**: Native WebSockets (`ws`) for sub-second telemetry streaming
- **Frontend**: Modern Vanilla JavaScript (ES6+ Modules, Web Audio API, Canvas 2D)
- **Styling**: Vanilla CSS3 Glassmorphism with custom clinical color tokens and responsive grid
- **Zero External UI Bloat**: Fast, lightweight, and completely offline-capable.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)

### Installation
```bash
# Clone or navigate to the workspace
cd "Smart Hospital Hygiene & Resource Intelligence Platform"

# Install dependencies
npm install
```

### Running the Platform
```bash
# Start the server with simulated IoT telemetry
npm start
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/status` | `GET` | Complete snapshot of zones, resources, alerts, and system KPIs |
| `/api/zones` | `GET` | List all hospital zones and associated IoT devices |
| `/api/zones/:id` | `GET` | Detailed telemetry for a specific hospital wing |
| `/api/alerts` | `GET` | Current list of active and historical hazard alerts |
| `/api/alerts/:id/acknowledge`| `POST` | Acknowledge an incident and log responder |
| `/api/alerts/:id/resolve` | `POST` | Resolve and close an active incident |
| `/api/actions/refill-dispenser`| `POST` | Refill sanitizer cartridge to 100% |
| `/api/actions/empty-bin` | `POST` | Decant and empty a biohazard waste container |
| `/api/actions/start-uvc` | `POST` | Initiate UV-C disinfection cycle |
| `/api/actions/simulate-anomaly` | `POST` | Inject fault (e.g. `HEPA_FAILURE`, `OXYGEN_PRESSURE_DROP`) |
| `/api/actions/reset` | `POST` | Reset all simulation parameters to baseline |

---

## 🛡️ License
MIT License. Developed for advanced healthcare hygiene intelligence and patient safety.
