// ==========================================
// Hospital Management System - Main JavaScript
// API Integration & Frontend Logic
// ==========================================

// API Base URL (will be replaced by Antigravity)
const API_BASE_URL = '';  // Empty for relative paths

// ==========================================
// FORM SUBMISSION & ML PREDICTION
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('patient-admission-form');
    const submitBtn = document.getElementById('submit-prediction-btn');
    const submitBtnText = document.getElementById('submit-btn-text');
    const submitBtnLoader = document.getElementById('submit-btn-loader');

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Show loading state
            submitBtn.disabled = true;
            submitBtnText.classList.add('hidden');
            submitBtnLoader.classList.remove('hidden');

            // Collect form data
            const patientData = {
                name: document.getElementById('patient-name-input').value,
                age: parseInt(document.getElementById('patient-age-input').value),
                gender: document.getElementById('patient-gender-select').value,
                triage: document.getElementById('triage-level-select').value,
                blood_pressure: parseFloat(document.getElementById('blood-pressure-input').value),
                cholesterol: parseFloat(document.getElementById('cholesterol-input').value),
                max_heart_rate: parseFloat(document.getElementById('heart-rate-input').value),
                chest_pain_type: parseInt(document.getElementById('chest-pain-select').value),
                exercise_angina: parseInt(document.getElementById('exercise-angina-toggle').value),
                plasma_glucose: parseFloat(document.getElementById('glucose-input').value),
                skin_thickness: parseFloat(document.getElementById('skin-thickness-input').value),
                insulin: parseFloat(document.getElementById('insulin-input').value),
                bmi: parseFloat(document.getElementById('bmi-input').value),
                diabetes_pedigree: parseFloat(document.getElementById('diabetes-pedigree-input').value),
                smoking_status: document.getElementById('smoking-status-select').value,
                residence_type: document.getElementById('residence-type-select').value,
                hypertension: document.getElementById('hypertension-checkbox').checked ? 1 : 0,
                heart_disease: document.getElementById('heart-disease-checkbox').checked ? 1 : 0
            };

            try {
                // Call prediction API
                const response = await fetch(`${API_BASE_URL}/api/predict-ward`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(patientData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                // Display results
                displayPredictionResults(result);

            } catch (error) {
                console.error('Prediction error:', error);
                alert('Error getting prediction. Please try again.\n\nError: ' + error.message);
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtnText.classList.remove('hidden');
                submitBtnLoader.classList.add('hidden');
            }
        });
    }
});

// ==========================================
// DISPLAY PREDICTION RESULTS
// ==========================================

function displayPredictionResults(result) {
    // Hide empty state, show results
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('results-state').classList.remove('hidden');

    // Update status badge
    const statusBadge = document.getElementById('result-status-badge');
    statusBadge.textContent = 'SUCCESS';
    statusBadge.className = 'rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-600';

    // Display ward and bed
    document.getElementById('predicted-ward-display').textContent = result.ward || 'Unknown';
    document.getElementById('bed-number-display').textContent = `Bed: ${result.bed_number || 'N/A'}`;

    // Display confidence score
    const confidence = parseFloat(result.confidence || 0);
    document.getElementById('confidence-score-display').textContent = `${confidence.toFixed(1)}%`;

    // Update confidence circle
    const confidenceCircle = document.getElementById('confidence-circle');
    const circumference = 251.2;
    const offset = circumference - (confidence / 100) * circumference;
    confidenceCircle.style.strokeDashoffset = offset;

    // Display priority score
    const priority = parseFloat(result.priority_score || 0);
    document.getElementById('priority-score-display').textContent = `${priority.toFixed(1)}/10`;

    // Update priority bar
    const priorityBar = document.getElementById('priority-bar');
    priorityBar.style.width = `${(priority / 10) * 100}%`;

    // Display queue info
    document.getElementById('queue-position-display').textContent = `#${result.queue_position || 'N/A'}`;
    document.getElementById('estimated-wait-display').textContent = `${result.estimated_wait || 0} min`;

    // Scroll to results panel
    document.getElementById('prediction-results-panel').scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
    });
}

// ==========================================
// QUEUE ANALYTICS - LOAD CHARTS
// ==========================================

async function loadQueueAnalytics(ward = 'all') {
    try {
        const url = ward === 'all'
            ? `${API_BASE_URL}/api/queue-analytics`
            : `${API_BASE_URL}/api/queue-analytics?ward=${ward}`;

        console.log('Loading analytics from:', url);

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load queue analytics');

        const data = await response.json();

        console.log('Analytics data received:', data);

        // Update metrics
        if (data.metrics) {
            document.getElementById('queue-metrics-avg-wait').textContent = `${data.metrics.avg_wait} min`;
            document.getElementById('queue-metrics-efficiency').textContent = `${data.metrics.efficiency}%`;
            document.getElementById('queue-metrics-fairness').textContent = data.metrics.fairness;
        }

        // Load charts
        if (window.Plotly && data.priority_distribution) {
            loadPriorityChart(data.priority_distribution);
            loadWaitTimeChart(data.wait_times);
            loadWardQueueChart(data.ward_queues);
            loadCategoryChart(data.priority_categories);
        }

    } catch (error) {
        console.error('Error loading queue analytics:', error);
    }
}

// Priority Distribution Chart
function loadPriorityChart(data) {
    const trace = {
        x: data.priority_scores,
        y: data.counts,
        type: 'bar',
        marker: { color: '#00d9ff' }
    };

    const layout = {
        title: '',
        xaxis: { title: 'Priority Score' },
        yaxis: { title: 'Number of Patients' },
        margin: { t: 20, b: 40, l: 50, r: 20 }
    };

    Plotly.newPlot('priority-chart-container', [trace], layout, { responsive: true });
}

// Wait Time vs Priority Chart
function loadWaitTimeChart(data) {
    const trace = {
        x: data.priority_scores,
        y: data.wait_times,
        mode: 'markers+lines',
        type: 'scatter',
        marker: { color: '#00d9ff', size: 8 },
        line: { color: '#ff6b35', width: 2 }
    };

    const layout = {
        title: '',
        xaxis: { title: 'Priority Score' },
        yaxis: { title: 'Wait Time (minutes)' },
        margin: { t: 20, b: 40, l: 50, r: 20 }
    };

    Plotly.newPlot('waittime-chart-container', [trace], layout, { responsive: true });
}

// Ward Queue Chart
function loadWardQueueChart(data) {
    const trace = {
        x: data.queue_counts,
        y: data.ward_names,
        type: 'bar',
        orientation: 'h',
        marker: { color: '#00d9ff' }
    };

    const layout = {
        title: '',
        xaxis: { title: 'Number of Patients' },
        margin: { t: 20, b: 40, l: 120, r: 20 }
    };

    Plotly.newPlot('wardqueue-chart-container', [trace], layout, { responsive: true });
}

// Category Pie Chart
function loadCategoryChart(data) {
    const trace = {
        values: data.counts,
        labels: data.categories,
        type: 'pie',
        marker: {
            colors: ['#ff3860', '#ff6b35', '#ffd700', '#00ff88']
        }
    };

    const layout = {
        title: '',
        margin: { t: 20, b: 20, l: 20, r: 20 }
    };

    Plotly.newPlot('category-chart-container', [trace], layout, { responsive: true });
}

// ==========================================
// LIVE QUEUE TABLE
// ==========================================

async function loadQueueTable() {
    try {
        const wardFilterEl = document.getElementById('ward-filter-select');
        const wardFilter = wardFilterEl ? wardFilterEl.value : 'all';

        const url = wardFilter === 'all'
            ? `${API_BASE_URL}/api/queue-status`
            : `${API_BASE_URL}/api/queue-status?ward=${wardFilter}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load queue');

        const data = await response.json();
        const tbody = document.getElementById('queue-table-body');

        // Check if element exists
        if (!tbody) {
            console.warn('Queue table body not found');
            return;
        }

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400">No patients in queue</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(patient => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="py-3 px-4 font-medium">${patient.patient_id || 'N/A'}</td>
                <td class="py-3 px-4">${patient.ward || 'N/A'}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(patient.priority)}">
                        ${patient.priority ? patient.priority.toFixed(1) : '0.0'}
                    </span>
                </td>
                <td class="py-3 px-4">#${patient.position || 'N/A'}</td>
                <td class="py-3 px-4">${patient.wait_time || 0} min</td>
            </tr>
        `).join('');

        // Update queue count on dashboard
        const queueCountEl = document.getElementById('queue-count-display');
        if (queueCountEl) {
            queueCountEl.textContent = data.length;
        }

    } catch (error) {
        console.error('Error loading queue table:', error);
        const tbody = document.getElementById('queue-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400">Unable to load queue data</td></tr>';
        }
    }
}

function getPriorityColor(priority) {
    const p = parseFloat(priority) || 0;
    if (p >= 8) return 'bg-red-100 text-red-700';
    if (p >= 6) return 'bg-orange-100 text-orange-700';
    if (p >= 4) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
}

// ==========================================
// PATIENT RECORDS SEARCH
// ==========================================

const applySearchBtn = document.getElementById('apply-search-btn');
if (applySearchBtn) {
    applySearchBtn.addEventListener('click', async function () {
        const search = document.getElementById('patient-search-input').value;
        const ward = document.getElementById('patient-ward-filter').value;
        const status = document.getElementById('patient-status-filter').value;

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (ward !== 'all') params.append('ward', ward);
            if (status !== 'all') params.append('status', status);

            const response = await fetch(`${API_BASE_URL}/api/patients?${params}`);
            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            displayPatientRecords(data);

        } catch (error) {
            console.error('Error searching patients:', error);
            alert('Error searching patient records');
        }
    });
}

function displayPatientRecords(patients) {
    const tbody = document.getElementById('patient-table-body');

    if (patients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-400">No patients found</td></tr>';
        return;
    }

    tbody.innerHTML = patients.map(patient => `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-3 px-4 font-medium">${patient.patient_id}</td>
            <td class="py-3 px-4">${patient.name}</td>
            <td class="py-3 px-4">${patient.age}</td>
            <td class="py-3 px-4">${patient.ward}</td>
            <td class="py-3 px-4">${patient.bed}</td>
            <td class="py-3 px-4">${patient.admission_date}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(patient.status)}">
                    ${patient.status}
                </span>
            </td>
            <td class="py-3 px-4">
                <button onclick="viewPatientDetail('${patient.patient_id}')" class="text-accent hover:text-accent/80 font-medium text-sm">
                    View Details
                </button>
            </td>
        </tr>
    `).join('');
}

function getStatusColor(status) {
    if (status === 'Active') return 'bg-green-100 text-green-700';
    if (status === 'In Treatment') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-700';
}

async function viewPatientDetail(patientId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`);
        if (!response.ok) throw new Error('Failed to load patient details');

        const patient = await response.json();

        // Show modal with patient details
        const modal = document.getElementById('patient-detail-modal');
        const content = document.getElementById('modal-content');

        content.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-bold text-slate-800 mb-4">Demographics</h4>
                    <dl class="space-y-2">
                        <div class="flex justify-between">
                            <dt class="text-slate-500">Name:</dt>
                            <dd class="font-semibold">${patient.name}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-slate-500">Age:</dt>
                            <dd class="font-semibold">${patient.age}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-slate-500">Gender:</dt>
                            <dd class="font-semibold">${patient.gender}</dd>
                        </div>
                    </dl>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800 mb-4">Medical Data</h4>
                    <dl class="space-y-2 text-sm">
                        ${Object.entries(patient.medical_data || {}).map(([key, value]) => `
                            <div class="flex justify-between">
                                <dt class="text-slate-500">${formatFieldName(key)}:</dt>
                                <dd class="font-semibold">${value}</dd>
                            </div>
                        `).join('')}
                    </dl>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading patient details:', error);
        alert('Error loading patient details');
    }
}

function formatFieldName(field) {
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ==========================================
// INITIALIZATION
// ==========================================

// Load data when page loads
window.addEventListener('DOMContentLoaded', function () {
    console.log('🏥 Hospital Management System initialized');

    // Load queue analytics if on that section
    if (document.getElementById('queue-analytics')) {
        console.log('📊 Loading queue analytics...');
        loadQueueAnalytics();
        loadQueueTable();

        // Start auto-refresh (only on queue page)
        setInterval(loadQueueTable, 30000);
    }

    console.log('✅ Ready for backend integration');
});

// Ward filter functionality
const applyFiltersBtn = document.getElementById('apply-filters-btn');
if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', function () {
        const wardFilter = document.getElementById('ward-filter-select').value;

        console.log('Filter button clicked! Ward:', wardFilter);

        // Reload analytics with filter
        loadQueueAnalytics(wardFilter);
        loadQueueTable();
    });
}