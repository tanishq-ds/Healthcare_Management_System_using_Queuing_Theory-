# Hospital Management System - Web Interface

Complete single-page application for Hospital Management System with ML-powered patient admission, queue analytics, and database management.

## 📁 Structure

```
web/
├── templates/
│   └── index.html          # Complete single-page UI (All 5 sections)
├── static/
│   ├── js/
│   │   └── main.js         # API integration & frontend logic
│   ├── css/                # (Tailwind via CDN - no files needed)
│   └── images/             # Future: logos, icons
└── README.md               # This file
```

## 🎨 UI Sections

The single-page application includes:

1. **Dashboard (#dashboard)** - Hero, metrics, quick actions
2. **Patient Admission (#admit-patient)** - 16-field form with ML prediction
3. **Queue Analytics (#queue-analytics)** - 4 Plotly charts + live table
4. **Patient Records (#patient-records)** - Search, filter, view details
5. **System Stats (#system-stats)** - ML metrics, DB stats, system health

## 🔗 Integration Points

### API Endpoints Required

All endpoints should return JSON responses.

#### 1. POST /api/predict-ward
**Request Body:**
```json
{
  "name": "John Doe",
  "age": 65,
  "gender": "Male",
  "triage": "orange",
  "blood_pressure": 140,
  "cholesterol": 220,
  "max_heart_rate": 120,
  "chest_pain_type": 2,
  "exercise_angina": 1,
  "plasma_glucose": 110,
  "skin_thickness": 25,
  "insulin": 80,
  "bmi": 28.5,
  "diabetes_pedigree": 0.5,
  "smoking_status": "former",
  "residence_type": "Urban",
  "hypertension": 1,
  "heart_disease": 0
}
```

**Response:**
```json
{
  "ward": "Cardiac Ward",
  "bed_number": "CAR-042",
  "confidence": 85.3,
  "priority_score": 7.2,
  "queue_position": 3,
  "estimated_wait": 45
}
```

#### 2. GET /api/queue-status?ward={ward}
**Response:**
```json
[
  {
    "patient_id": "PAT-001",
    "ward": "Cardiac Ward",
    "priority": 8.5,
    "position": 1,
    "wait_time": 15
  }
]
```

#### 3. GET /api/queue-analytics
**Response:**
```json
{
  "metrics": {
    "avg_wait": "32.5",
    "critical_response": "<5 min",
    "efficiency": "95.3",
    "fairness": "0.89/1.0"
  },
  "priority_distribution": {
    "priority_scores": [3, 4, 5, 6, 7, 8, 9],
    "counts": [5, 8, 12, 10, 7, 4, 2]
  },
  "wait_times": {
    "priority_scores": [3, 4, 5, 6, 7, 8, 9],
    "wait_times": [90, 75, 60, 45, 30, 15, 5]
  },
  "ward_queues": {
    "ward_names": ["ICU", "Cardiac", "General"],
    "queue_counts": [2, 5, 8]
  },
  "priority_categories": {
    "categories": ["Critical", "High", "Medium", "Low"],
    "counts": [2, 5, 8, 10]
  }
}
```

#### 4. GET /api/patients?search={q}&ward={w}&status={s}
**Response:**
```json
[
  {
    "patient_id": "PAT-001",
    "name": "John Doe",
    "age": 65,
    "ward": "Cardiac Ward",
    "bed": "CAR-042",
    "admission_date": "2026-03-01",
    "status": "Active"
  }
]
```

#### 5. GET /api/patients/{id}
**Response:**
```json
{
  "patient_id": "PAT-001",
  "name": "John Doe",
  "age": 65,
  "gender": "Male",
  "medical_data": {
    "blood_pressure": 140,
    "cholesterol": 220,
    "heart_rate": 120
  },
  "timeline": [
    {
      "event": "Admitted",
      "timestamp": "2026-03-01 10:30"
    }
  ]
}
```

#### 6. GET /api/system-stats
**Response:**
```json
{
  "ml": {
    "accuracy": 99.57
  },
  "db_stats": {
    "total_patients": 1247,
    "last_backup": "Today, 2:30 AM"
  },
  "queue_efficiency": {
    "avg_wait": 32.5,
    "critical_response": true,
    "fairness": 0.89
  },
  "system_health": {
    "server": "online",
    "database": "connected",
    "ml_model": "operational"
  }
}
```

#### 7. GET /api/wards/statistics
**Response:**
```json
[
  {
    "ward_name": "ICU",
    "total_beds": 20,
    "occupied": 18,
    "available": 2,
    "utilization": 90.0
  }
]
```

## 🚀 Running the Application

### Development (Simple HTTP Server)

```bash
cd web/templates
python -m http.server 8000
```

Visit: http://localhost:8000/index.html

**Note:** API calls will fail without backend. This is for UI testing only.

### Production (Flask Backend)

Create `web/app.py`:

```python
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/predict-ward', methods=['POST'])
def predict_ward():
    # Connect to your ML model here
    patient_data = request.json
    # Call predict_and_assign_ward()
    result = {
        'ward': 'Cardiac Ward',
        'bed_number': 'CAR-042',
        'confidence': 85.3,
        'priority_score': 7.2,
        'queue_position': 3,
        'estimated_wait': 45
    }
    return jsonify(result)

# Add other endpoints...

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

Run:
```bash
cd web
python app.py
```

Visit: http://localhost:5000

## 🔧 Customization

### Colors
Edit Tailwind config in `<head>` of index.html:
```javascript
colors: {
    "primary": "#1a2332",     // Dark blue
    "accent": "#00d9ff",      // Cyan
    "success": "#00ff88",     // Green
    "warning": "#ff6b35",     // Orange
    "critical": "#ff3860",    // Red
}
```

### Navigation
Smooth scroll navigation is handled automatically. Links are:
- `#dashboard`
- `#admit-patient`
- `#queue-analytics`
- `#patient-records`
- `#system-stats`

### Forms
All form fields have `data-bind` attributes for easy integration:
```html
<input id="patient-age-input" data-bind="patient.age" />
```

Access in JavaScript:
```javascript
const age = document.getElementById('patient-age-input').value;
```

## 📊 Chart Integration

Plotly charts are loaded via CDN. Update data:

```javascript
// In main.js
function loadPriorityChart(data) {
    const trace = {
        x: data.priority_scores,
        y: data.counts,
        type: 'bar',
        marker: { color: '#00d9ff' }
    };
    Plotly.newPlot('priority-chart-container', [trace], layout);
}
```

## 🐛 Debugging

Open browser console (F12) to see:
- Form submission data
- API responses
- Error messages

All API calls are logged:
```javascript
console.log('Calling API:', url);
console.log('Data:', data);
```
