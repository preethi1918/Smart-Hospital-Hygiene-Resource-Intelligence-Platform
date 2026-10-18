# 🏥 Smart Hospital Hygiene & Resource Intelligence Platform

> **A digital hospital operations platform for hygiene monitoring, resource tracking, maintenance management, and data-driven decision support.**

---

## 📌 Overview

Hospitals manage hundreds of operational activities every day, including room cleaning, bedsheet replacement, equipment maintenance, consumable inventory, biomedical waste collection, and staff task management.

When these activities are handled through manual registers, verbal communication, or disconnected systems, hospitals may face:

- Missed or delayed cleaning tasks
- Difficulty tracking linen usage
- Equipment maintenance delays
- Consumable shortages
- Incomplete operational records
- Difficulty monitoring ward-level performance
- Time-consuming hygiene audits

The **Smart Hospital Hygiene & Resource Intelligence Platform** provides a centralized digital system to manage and monitor these activities.

The platform combines **QR-based identification, task management, hygiene monitoring, resource tracking, audit trails, dashboards, analytics, and predictive models** into one system.

---

# 🎯 Problem Statement

Hospital hygiene is not limited to changing a bedsheet.

A hospital must continuously manage:

- 🛏️ Beds and linen
- 🧹 Cleaning activities
- 🩺 Medical equipment
- 🧴 Consumables
- 🗑️ Biomedical waste
- 🔧 Equipment maintenance
- 👨‍⚕️ Staff responsibilities
- 📊 Hygiene and operational performance

When these activities are managed separately, hospital administrators may not have a complete view of the operational condition of a ward or room.

### The key question this project addresses:

> **"Is this room or ward operationally ready for the next patient?"**

---

# 💡 Proposed Solution

The platform assigns a digital identity to important hospital resources and locations.

QR codes can be attached to:

- Rooms
- Beds
- Linen
- Equipment
- Waste bins

Staff can scan the QR code and perform authorized actions.

Every important activity records:

```text
WHO    → Staff member
WHAT   → Activity performed
WHERE  → Location/resource
WHEN   → Date and time
STATUS → Current state
```

This creates a digital operational history for the hospital.

---

# 🚀 Core Features

## 1. 🏥 Hospital Structure Management

Manage the complete hospital hierarchy:

```text
Hospital
   │
   ├── Building
   │
   ├── Floor
   │
   └── Ward
        │
        ├── Room
        │    └── Bed
        │
        └── Facilities
```

Administrators can create and manage:

- Hospitals
- Buildings
- Floors
- Wards
- Rooms
- Beds

---

# 2. 🛏️ Smart Linen Management

Track reusable hospital linen throughout its lifecycle.

### Supported items

- Bedsheets
- Pillow covers
- Blankets
- Patient gowns
- Other reusable linen

### Linen information

```text
Linen ID
Type
Current Status
Current Location
Assigned Bed
Last Washed Date
Wash Cycle Count
Issue Date
Damage Status
```

### Linen lifecycle

```text
CLEAN
  ↓
IN USE
  ↓
DUE FOR CHANGE
  ↓
IN LAUNDRY
  ↓
CLEAN
  ↓
REUSE
```

Linen can eventually be marked as:

> **DAMAGED → RETIRED**

based on operational rules.

---

# 3. 🧹 Cleaning & Hygiene Management

Digitally manage cleaning activities across the hospital.

### Areas

- Patient rooms
- Beds
- Toilets
- Corridors
- Waiting areas
- Handwashing stations
- Other facilities

### Task lifecycle

```text
PENDING
   ↓
IN PROGRESS
   ↓
COMPLETED
   ↓
VERIFIED
```

The system automatically records the staff member and completion time.

---

# 4. 📱 QR-Based Resource Identification

Every important resource can receive a unique QR code.

Examples:

```text
ROOM-204
BED-204
LINEN-1024
EQUIP-501
BIN-204
```

### QR workflow

```text
Staff
  ↓
Scan QR
  ↓
Identify Resource
  ↓
Retrieve Current Status
  ↓
Perform Authorized Action
  ↓
Save Activity
  ↓
Update Dashboard
```

The QR code contains only a resource identifier and does not store sensitive patient information.

---

# 5. 🩺 Medical Equipment Management

Track operational hospital equipment such as:

- Wheelchairs
- BP monitors
- Pulse oximeters
- Patient monitors
- Oxygen equipment
- Infusion pumps

### Equipment information

```text
Equipment ID
Equipment Name
Category
Location
Status
Purchase Date
Last Maintenance
Next Maintenance
Condition
```

### Equipment status

- AVAILABLE
- IN_USE
- MAINTENANCE
- DAMAGED
- RETIRED

---

# 6. 🔧 Maintenance Management

Maintenance staff can manage preventive and corrective maintenance.

Track:

- Equipment
- Problem description
- Technician
- Priority
- Start date
- Completion date
- Status
- Notes

### Priority levels

```text
LOW
MEDIUM
HIGH
CRITICAL
```

The system automatically identifies overdue maintenance.

---

# 7. 🧴 Consumable Inventory Management

Monitor hospital consumables and cleaning materials.

Examples:

- Gloves
- Masks
- Sanitizer
- Disinfectants
- Tissue
- Cleaning materials

### Inventory information

```text
Item ID
Item Name
Category
Quantity
Unit
Minimum Stock
Expiry Date
Supplier
Location
```

### Smart alerts

```text
Normal Stock       🟢
Low Stock          🟡
Critical Stock     🔴
Expired            🔴
```

---

# 8. 🗑️ Biomedical Waste Management

Track biomedical waste collection activities.

### Workflow

```text
Waste Generated
      ↓
Waste Bin
      ↓
Collection Requested
      ↓
Staff Assigned
      ↓
Collected
      ↓
Disposed
```

The system maintains collection history for operational auditing.

---

# 9. 👨‍⚕️ Staff Task Management

Managers can assign tasks to staff based on their role.

### Cleaning Staff

- Room cleaning
- Bed cleaning
- Linen replacement
- Toilet cleaning
- Waste collection

### Maintenance Staff

- Equipment inspection
- Repairs
- Preventive maintenance

### Store Staff

- Stock updates
- Material issue
- Expiry checking

### Task states

```text
ASSIGNED
   ↓
IN PROGRESS
   ↓
COMPLETED
   ↓
VERIFIED
```

---

# 10. ⭐ Room Readiness Score

One of the major features of the platform.

Instead of checking multiple conditions manually, the system evaluates whether a room is ready for use.

### Example

**Room 204**

| Requirement | Status |
|---|---|
| Bed cleaned | ✅ |
| Bedsheet changed | ✅ |
| Pillow cover changed | ✅ |
| Room cleaned | ✅ |
| Toilet cleaned | ⚠️ |
| Waste collected | ✅ |
| Required supplies available | ✅ |

### Result

**Room Readiness: 91%**

If a critical requirement is incomplete:

> 🔴 **ROOM NOT READY**

Otherwise:

> 🟢 **ROOM READY**

The readiness rules are configurable.

---

# 11. 📊 Ward Hygiene Score

The system calculates an operational hygiene-performance score for each ward.

Possible indicators include:

- Cleaning completion
- Overdue cleaning tasks
- Linen compliance
- Waste collection
- Equipment maintenance
- Critical hygiene tasks

Example:

```text
Ward 1    94%
Ward 2    88%
Ward 3    76%
Ward 4    92%
```

The score is an **operational performance indicator** and does not represent medical safety or guarantee infection prevention.

---

# 12. 📈 Hospital Dashboard

Administrators get a centralized view of hospital operations.

### Dashboard metrics

```text
Total Wards
Total Rooms
Total Beds
Pending Tasks
Overdue Tasks
Linen Items
Equipment
Low Stock Items
Maintenance Due
Rooms Ready
Rooms Not Ready
```

### Example

```text
┌───────────────────────────────────────┐
│       SMART HOSPITAL DASHBOARD        │
├───────────────────────────────────────┤
│                                       │
│  🏥 Wards             12              │
│  🛏️ Beds              240             │
│  🧹 Pending Tasks      14             │
│  🔴 Overdue Tasks       5             │
│  🩺 Equipment          126            │
│  🧴 Low Stock            8            │
│                                       │
└───────────────────────────────────────┘
```

All dashboard values are retrieved from the backend database.

---

# 13. 🚨 Smart Alert System

The platform generates alerts for operational issues.

Examples:

```text
🔴 Room 204 cleaning overdue

🟡 Ward 3 sanitizer stock below threshold

🔴 Equipment EQ-102 maintenance overdue

🟡 Linen inventory may be insufficient

🔴 Waste collection pending
```

Alerts contain:

- Type
- Severity
- Message
- Related resource
- Created time
- Read/unread state

---

# 14. 📜 Digital Audit Trail

Important activities are automatically recorded.

Examples:

- Login
- Resource creation
- Resource update
- Cleaning completion
- Linen change
- Equipment maintenance
- Inventory adjustment
- Waste collection
- Task completion

Each record contains:

```text
WHO
WHAT
WHEN
RESOURCE
ACTION
```

This helps with operational review and auditing.

---

# 15. 📊 Analytics Module

Historical data is used to understand hospital operations.

### Analytics areas

#### Cleaning

- Completion rate
- Overdue tasks
- Ward comparison
- Daily/weekly/monthly trends

#### Linen

- Daily usage
- Ward-wise usage
- Wash cycles
- Replacement trends

#### Equipment

- Maintenance frequency
- Overdue maintenance
- Equipment availability

#### Inventory

- Consumption
- Low-stock trends
- Expiry monitoring

#### Waste

- Collection frequency
- Ward-wise collection
- Pending collections

---

# 16. 🤖 Predictive Analytics

The project uses machine learning for **operational planning**, not medical diagnosis.

## Linen Demand Prediction

Possible inputs:

- Historical linen usage
- Ward
- Occupancy
- Day of week
- Average linen changes

Output:

> Predicted linen requirement for a future period.

---

## Consumable Demand Prediction

Predict future requirements for:

- Gloves
- Masks
- Sanitizer
- Disinfectant

The system can calculate:

```text
Current Stock
       +
Predicted Demand
       +
Safety Buffer
       =
Recommended Stock
```

---

## Equipment Maintenance Analysis

Historical equipment usage and maintenance records can be analyzed to identify assets that may require attention.

---

# 🧠 Machine Learning Architecture

```text
Hospital Database
       ↓
Historical Operational Data
       ↓
Python Data Processing
       ↓
Feature Engineering
       ↓
ML Model
       ↓
Prediction
       ↓
FastAPI
       ↓
Spring Boot
       ↓
React Dashboard
```

If real hospital data is unavailable, development can use **clearly labelled synthetic operational data**.

---

# 👥 User Roles

| Role | Access |
|---|---|
| Admin | Complete system |
| Hospital Manager | Dashboard, reports, analytics |
| Cleaning Staff | Cleaning and linen |
| Maintenance Staff | Equipment and maintenance |
| Store Manager | Inventory |
| Auditor | Read-only audit records |

---

# 🏗️ System Architecture

```text
                 ┌─────────────────────┐
                 │    Hospital Staff   │
                 └──────────┬──────────┘
                            │
                       QR / Web App
                            │
                            ▼
                 ┌─────────────────────┐
                 │   React Frontend    │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  Spring Boot API    │
                 └──────────┬──────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
           MySQL       FastAPI ML     Alert Engine
              │             │             │
              └─────────────┼─────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   Admin Dashboard   │
                 └─────────────────────┘
```

---

# 🗄️ Database Entities

Main entities include:

```text
USERS
ROLES
HOSPITALS
BUILDINGS
FLOORS
WARDS
ROOMS
BEDS
LINEN
EQUIPMENT
INVENTORY
TASKS
CLEANING_LOGS
MAINTENANCE_LOGS
WASTE_LOGS
AUDIT_LOGS
ALERTS
```

### Basic relationship

```text
Hospital
   │
   └── Building
        │
        └── Floor
             │
             └── Ward
                  │
                  ├── Room
                  │    └── Bed
                  │         └── Linen
                  │
                  ├── Equipment
                  └── Cleaning Tasks
```

---

# 🛠️ Technology Stack

## Frontend

- React.js
- JavaScript
- HTML5
- CSS3

## Backend

- Java
- Spring Boot
- Spring Data JPA
- Spring Security
- REST APIs
- JWT

## Database

- MySQL

## Machine Learning

- Python
- Pandas
- NumPy
- Scikit-learn
- FastAPI

## Tools

- Git
- GitHub
- VS Code
- IntelliJ IDEA
- Postman

---

# 📂 Project Structure

```text
smart-hospital-platform/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── assets/
│
├── backend/
│   ├── src/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── model/
│   │   ├── dto/
│   │   ├── security/
│   │   └── config/
│   └── pom.xml
│
├── ml/
│   ├── datasets/
│   ├── notebooks/
│   ├── models/
│   └── prediction.py
│
├── database/
│   └── schema.sql
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── screenshots/
│
├── docker-compose.yml
└── README.md
```

---

# 🔄 Complete System Workflow

```text
Hospital Setup
      ↓
Create Wards & Rooms
      ↓
Register Beds / Linen / Equipment
      ↓
Generate QR Codes
      ↓
Assign Staff Tasks
      ↓
Staff Scans QR
      ↓
Perform Activity
      ↓
System Records Activity
      ↓
Dashboard Updates
      ↓
Alerts Generated
      ↓
Analytics
      ↓
Predictive Insights
      ↓
Operational Decision Support
```

---

# 🔐 Security

The platform includes:

- JWT authentication
- Role-based access control
- BCrypt password hashing
- API authorization
- Input validation
- Secure error handling
- Audit logging
- Environment variables for secrets
- Restricted resource access

The system should minimize the use of patient-identifying information.

---

# 🧪 Testing

Testing will cover:

### Backend

- Unit tests
- Service tests
- Controller tests
- Authentication tests

### Frontend

- Component testing
- Form validation
- API error handling
- Role-based UI

### Integration

- Login
- QR scanning
- Linen updates
- Cleaning tasks
- Equipment maintenance
- Inventory
- Dashboard
- Alerts
- ML predictions

---

# 📋 Development Roadmap

## Phase 1 — Foundation

- [ ] Project initialization
- [ ] Database design
- [ ] Spring Boot setup
- [ ] Authentication

## Phase 2 — Hospital Structure

- [ ] Hospital management
- [ ] Ward management
- [ ] Room management
- [ ] Bed management
- [ ] React frontend foundation

## Phase 3 — Core Operations

- [ ] Linen management
- [ ] QR generation
- [ ] QR scanning
- [ ] Cleaning management
- [ ] Equipment management
- [ ] Maintenance management
- [ ] Inventory management
- [ ] Waste management
- [ ] Staff task management

## Phase 4 — Intelligence

- [ ] Room readiness score
- [ ] Ward hygiene score
- [ ] Dashboard
- [ ] Alert system
- [ ] Audit trail

## Phase 5 — Analytics & ML

- [ ] Analytics dashboard
- [ ] Dataset preparation
- [ ] Linen prediction
- [ ] Consumable prediction
- [ ] ML API integration

## Phase 6 — Finalization

- [ ] UI/UX improvements
- [ ] Security review
- [ ] Testing
- [ ] Docker configuration
- [ ] Deployment
- [ ] Final documentation

---

# 🌟 Key Differentiators

This project is **not just a bedsheet tracking system** and is not intended to replace existing hospital-management software.

The platform focuses specifically on **hospital operational hygiene and resource intelligence**.

### Major differentiators:

**1. Unified Operational Platform**

Combines:

> Hygiene + Linen + Cleaning + Equipment + Inventory + Waste + Maintenance

---

**2. Room Readiness**

Provides a single operational view of whether a room is ready.

---

**3. Ward Hygiene Score**

Helps management compare operational performance between wards.

---

**4. QR-Based Digital Workflow**

Connects physical hospital resources with digital records.

---

**5. Digital Audit Trail**

Maintains:

> Who + What + Where + When

for important activities.

---

**6. Predictive Resource Planning**

Uses historical operational data to estimate future linen and consumable requirements.

---

# ⚠️ Scope & Limitations

This project is intended for **hospital operational management and decision support**.

It does **not**:

- Diagnose diseases
- Replace doctors or nurses
- Determine whether a patient has an infection
- Guarantee microbiological sterility
- Replace hospital hygiene protocols
- Make clinical treatment decisions

The system records and analyzes operational activities while actual hospital procedures remain under qualified healthcare professionals and institutional protocols.

---

# 🚀 Future Enhancements

Future versions may include:

- RFID-based tracking
- NFC identification
- IoT-enabled smart waste bins
- BLE equipment tracking
- Dedicated mobile application
- Multi-hospital support
- Advanced predictive maintenance
- Real-time asset location
- Cloud deployment
- Automated compliance reports
- Advanced demand forecasting
- Integration with existing hospital information systems

---

# 🎯 Expected Outcome

The final system aims to transform hospital operational management from:

```text
Manual Registers
      ↓
Scattered Information
      ↓
Delayed Monitoring
```

into:

```text
Digital Tracking
      ↓
Centralized Data
      ↓
Real-Time Monitoring
      ↓
Analytics
      ↓
Predictive Insights
      ↓
Better Operational Decisions
```

---

# 👩‍💻 Project Status

🚧 **Currently in Development**

The project is being developed incrementally using a phase-by-phase approach.

The first MVP focuses on:

```text
Login
  ↓
Ward
  ↓
Room
  ↓
Bed
  ↓
QR Code
  ↓
Linen
  ↓
Cleaning
  ↓
Room Readiness
  ↓
Dashboard
```

Additional modules will be integrated progressively.

---

# 📜 License

This project is developed for **educational, research, and demonstration purposes**.

---

## 🏥 Vision

> **To create a connected hospital operational environment where every important resource, task, and hygiene activity can be digitally tracked, monitored, and improved through data.**
