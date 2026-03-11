-- Hospital Management System Database Schema

CREATE DATABASE IF NOT EXISTS hospital_management;
USE hospital_management;

CREATE TABLE IF NOT EXISTS wards (
    ward_id INT PRIMARY KEY AUTO_INCREMENT,
    ward_name VARCHAR(50) NOT NULL UNIQUE,
    total_beds INT NOT NULL,
    available_beds INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

2. Beds Table
CREATE TABLE IF NOT EXISTS beds (
    bed_id INT PRIMARY KEY AUTO_INCREMENT,
    ward_id INT NOT NULL,
    bed_number VARCHAR(10) NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id) ON DELETE CASCADE,
    UNIQUE KEY unique_bed (ward_id, bed_number)
);

3. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    patient_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT,
    gender TINYINT,  -- 0=Female, 1=Male
    admission_date DATE,
    discharge_date DATE,
    status VARCHAR(20) DEFAULT 'admitted',  -- 'admitted', 'discharged', 'transferred'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

4. Patient Medical Data Table (for ML features)
CREATE TABLE IF NOT EXISTS patient_medical_data (
    medical_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(50) NOT NULL,
    chest_pain_type INT,
    blood_pressure DECIMAL(5,2),
    cholesterol DECIMAL(5,2),
    max_heart_rate INT,
    exercise_angina TINYINT,
    plasma_glucose DECIMAL(5,2),
    skin_thickness DECIMAL(5,2),
    insulin DECIMAL(5,2),
    bmi DECIMAL(5,2),
    diabetes_pedigree DECIMAL(10,6),
    hypertension TINYINT,
    heart_disease TINYINT,
    smoking_status VARCHAR(20),
    residence_type VARCHAR(20),
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

5. Patient Assignments Table
CREATE TABLE IF NOT EXISTS patient_assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(50) NOT NULL,
    ward_id INT NOT NULL,
    bed_id INT,
    predicted_ward VARCHAR(50),
    ml_confidence DECIMAL(5,4),  -- Model prediction confidence
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discharge_date TIMESTAMP NULL,
    priority_score INT,  -- For queuing theory (1-10)
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id),
    FOREIGN KEY (bed_id) REFERENCES beds(bed_id)
);

6. Pharmacy Inventory Table
CREATE TABLE IF NOT EXISTS pharmacy (
    medicine_id INT PRIMARY KEY AUTO_INCREMENT,
    medicine_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),  -- 'Cardiac', 'Diabetes', 'Pain Relief', etc.
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2),
    expiry_date DATE,
    ward_id INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id)
);

7. Pharmacy Orders Table
CREATE TABLE IF NOT EXISTS pharmacy_orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(50) NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'delivered', 'cancelled'
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (medicine_id) REFERENCES pharmacy(medicine_id)
);
