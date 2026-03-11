# Database Schema Documentation

## Overview

The hospital management system uses MySQL database with 7 interconnected tables to manage patients, wards, beds, assignments, and pharmacy inventory.

## Entity Relationship Diagram
```
patients ──┐
           ├──> patient_assignments ──> beds ──> wards
           │
           └──> patient_medical_data
           
wards ──> pharmacy ──> pharmacy_orders ──> patients
```

## Tables

### 1. patients
Stores basic patient information.

| Column | Type | Description |
|--------|------|-------------|
| patient_id | VARCHAR(50) PK | Unique patient identifier |
| name | VARCHAR(100) | Patient full name |
| age | INT | Patient age |
| gender | TINYINT | 0=Female, 1=Male |
| admission_date | DATE | Date of admission |
| discharge_date | DATE | Date of discharge |
| status | VARCHAR(20) | 'admitted', 'discharged', 'transferred' |

### 2. wards
Defines hospital ward types and capacity.

| Column | Type | Description |
|--------|------|-------------|
| ward_id | INT PK | Unique ward identifier |
| ward_name | VARCHAR(50) | Ward name (ICU, Cardiac, etc.) |
| total_beds | INT | Total bed capacity |
| available_beds | INT | Currently available beds |

### 3. beds
Individual bed tracking within wards.

| Column | Type | Description |
|--------|------|-------------|
| bed_id | INT PK | Unique bed identifier |
| ward_id | INT FK | References wards(ward_id) |
| bed_number | VARCHAR(10) | Human-readable bed number |
| is_occupied | BOOLEAN | Bed occupancy status |

### 4. patient_assignments
Links patients to their assigned wards and beds.

| Column | Type | Description |
|--------|------|-------------|
| assignment_id | INT PK | Unique assignment ID |
| patient_id | VARCHAR(50) FK | References patients(patient_id) |
| ward_id | INT FK | References wards(ward_id) |
| bed_id | INT FK | References beds(bed_id) |
| predicted_ward | VARCHAR(50) | ML model prediction |
| ml_confidence | DECIMAL(5,4) | Model confidence (0-1) |
| priority_score | INT | Priority score (1-10) |
| assigned_date | TIMESTAMP | Assignment timestamp |

### 5. patient_medical_data
Stores detailed medical features for ML predictions.

| Column | Type | Description |
|--------|------|-------------|
| medical_id | INT PK | Unique medical record ID |
| patient_id | VARCHAR(50) FK | References patients(patient_id) |
| chest_pain_type | INT | Type of chest pain (1-4) |
| blood_pressure | DECIMAL(5,2) | Blood pressure reading |
| cholesterol | DECIMAL(5,2) | Cholesterol level |
| ... | ... | (16 total medical features) |

### 6. pharmacy
Medicine inventory management.

| Column | Type | Description |
|--------|------|-------------|
| medicine_id | INT PK | Unique medicine ID |
| medicine_name | VARCHAR(100) | Medicine name |
| category | VARCHAR(50) | Medicine category |
| quantity | INT | Available quantity |
| unit_price | DECIMAL(10,2) | Price per unit |
| expiry_date | DATE | Expiration date |
| ward_id | INT FK | Associated ward |

### 7. pharmacy_orders
Tracks medicine orders from wards.

| Column | Type | Description |
|--------|------|-------------|
| order_id | INT PK | Unique order ID |
| patient_id | VARCHAR(50) FK | References patients(patient_id) |
| medicine_id | INT FK | References pharmacy(medicine_id) |
| quantity | INT | Ordered quantity |
| order_date | TIMESTAMP | Order timestamp |
| status | VARCHAR(20) | 'pending', 'delivered', 'cancelled' |

## Key Relationships

- **patients → patient_assignments**: One patient can have multiple assignments (transfers)
- **wards → beds**: One ward contains multiple beds
- **patient_assignments → beds**: Each assignment links to one specific bed
- **wards → pharmacy**: Each medicine can be associated with a ward
- **patients → pharmacy_orders**: Patients can order multiple medicines

## Database Statistics

- Total Beds: 224 (across 6 wards)
- Total Wards: 6 (ICU, Cardiac, Cardiology, Endocrinology, Emergency, General)
- Total Medicines: 8
- Current Patients: 5 (test data)

## ML Integration

The database integrates with XGBoost ML model:
1. Patient medical data → ML model predicts ward
2. System checks bed availability in predicted ward
3. Assigns first available bed
4. Updates bed occupancy and ward availability
5. Records assignment with ML confidence score

## Sample Queries

### Get all patients in ICU
```sql
SELECT p.name, p.age, b.bed_number, pa.assigned_date
FROM patients p
JOIN patient_assignments pa ON p.patient_id = pa.patient_id
JOIN beds b ON pa.bed_id = b.bed_id
JOIN wards w ON pa.ward_id = w.ward_id
WHERE w.ward_name = 'ICU';
```

### Check ward availability
```sql
SELECT ward_name, available_beds, total_beds,
       ROUND(available_beds/total_beds * 100, 2) as occupancy_rate
FROM wards
ORDER BY available_beds;
```
