// Global Data Storage
let pestData = [];
let isLoggedIn = false;
let detectionActive = false;
let irrigationActive = false;

// Sample data
const sampleData = [
    { id: 1, date: '2025-12-18', species: 'aphids', count: 25, location: 'Field A, Zone 1' },
    { id: 2, date: '2025-12-18', species: 'caterpillars', count: 12, location: 'Field B, Zone 2' },
    { id: 3, date: '2025-12-17', species: 'beetles', count: 8, location: 'Field A, Zone 3' },
    { id: 4, date: '2025-12-17', species: 'aphids', count: 35, location: 'Field B, Zone 1' },
    { id: 5, date: '2025-12-16', species: 'whiteflies', count: 18, location: 'Field A, Zone 2' }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Pest form
    const pestForm = document.getElementById('pestForm');
    if (pestForm) {
        pestForm.addEventListener('submit', addPestData);
    }
    
    // Support form
    const supportForm = document.getElementById('supportForm');
    if (supportForm) {
        supportForm.addEventListener('submit', submitTicket);
    }
    
    updateDashboard();
    updateDataCollection();
    initCharts();
});

// Login Handler
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid credentials! Use: admin / admin123');
    }
}

// Logout
function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('pestData');
    pestData = saved ? JSON.parse(saved) : sampleData;
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('pestData', JSON.stringify(pestData));
}

// Update Dashboard
function updateDashboard() {
    const totalPests = pestData.reduce((sum, item) => sum + item.count, 0);
    const highRisk = pestData.filter(item => item.count > 20).length;
    const avgDensity = totalPests > 0 ? ((totalPests / 100) * 10).toFixed(1) + '%' : '0%';
    
    if (document.getElementById('totalPests')) document.getElementById('totalPests').textContent = totalPests;
    if (document.getElementById('alerts')) document.getElementById('alerts').textContent = highRisk;
    if (document.getElementById('avgDensity')) document.getElementById('avgDensity').textContent = avgDensity;
    
    updateRecentActivity();
}

// Update Recent Activity
function updateRecentActivity() {
    const recentList = document.getElementById('recentList');
    if (!recentList) return;
    
    const recent = pestData.slice(0, 5).reverse();
    recentList.innerHTML = recent.map(item => 
        `<div class="activity-item">
            <span class="activity-icon">🐛</span>
            <span>${item.count} ${item.species} detected in ${item.location}</span>
            <span class="activity-date">${new Date(item.date).toLocaleDateString()}</span>
        </div>`
    ).join('');
}

// Update Data Collection Table
function updateDataCollection() {
    const tbody = document.querySelector('#pestTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = pestData.map(item => `
        <tr>
            <td>${new Date(item.date).toLocaleDateString()}</td>
            <td>${item.species.charAt(0).toUpperCase() + item.species.slice(1)}</td>
            <td>${item.count}</td>
            <td>${item.location}</td>
            <td>
                <button class="btn-danger btn-small" onclick="deletePest(${item.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Show/Hide Manual Input
function showManualInput() {
    document.getElementById('manualInputForm').classList.remove('hidden');
}

function hideManualInput() {
    document.getElementById('manualInputForm').classList.add('hidden');
}

// Add Pest Data
function addPestData(e) {
    e.preventDefault();
    const species = document.getElementById('pestSpecies').value;
    const count = parseInt(document.getElementById('pestCount').value);
    const location = document.getElementById('fieldLocation').value || 'Field A';
    
    const newData = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        species,
        count,
        location
    };
    
    pestData.unshift(newData);
    saveData();
    
    updateDataCollection();
    updateDashboard();
    hideManualInput();
    e.target.reset();
}

// Delete Pest Data
function deletePest(id) {
    if (confirm('Are you sure you want to delete this data?')) {
        pestData = pestData.filter(item => item.id !== id);
        saveData();
        updateDataCollection();
        updateDashboard();
    }
}

// Simulate Auto Detection
function simulateDetection() {
    const speciesList = ['aphids', 'caterpillars', 'beetles', 'whiteflies', 'thrips'];
    const species = speciesList[Math.floor(Math.random() * speciesList.length)];
    const count = Math.floor(Math.random() * 30) + 5;
    
    const newData = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        species,
        count,
        location: `Field ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}, Zone ${Math.floor(Math.random() * 4) + 1}`
    };
    
    pestData.unshift(newData);
    saveData();
    
    updateDataCollection();
    updateDashboard();
    alert(`Auto-detected: ${count} ${species} in ${newData.location}`);
}

// Charts Initialization
let speciesChart, trendChart;

function initCharts() {
    const speciesCtx = document.getElementById('speciesChart');
    const trendCtx = document.getElementById('trendChart');
    
    if (!speciesCtx || !trendCtx) return;
    
    // Species distribution
    const speciesCount = {};
    pestData.forEach(item => {
        speciesCount[item.species] = (speciesCount[item.species] || 0) + item.count;
    });
    
    speciesChart = new Chart(speciesCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(speciesCount),
            datasets: [{
                data: Object.values(speciesCount),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Last 7 days trend
    const last7Days = {};
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    pestData.forEach(item => {
        const date = new Date(item.date);
        if (date >= sevenDaysAgo) {
            const dateKey = date.toLocaleDateString();
            last7Days[dateKey] = (last7Days[dateKey] || 0) + item.count;
        }
    });
    
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: Object.keys(last7Days).sort(),
            datasets: [{
                label: 'Pest Count',
                data: Object.values(last7Days),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    updateAnalysisStats();
}

// Update Analysis Stats
function updateAnalysisStats() {
    const speciesCount = {};
    pestData.forEach(item => {
        speciesCount[item.species] = (speciesCount[item.species] || 0) + item.count;
    });
    
    const topPest = Object.entries(speciesCount).reduce((a, b) => a[1] > b[1] ? a : b);
    const totalDetections = pestData.length;
    
    if (document.getElementById('topPest')) document.getElementById('topPest').textContent = topPest[0];
    if (document.getElementById('totalDetections')) document.getElementById('totalDetections').textContent = totalDetections;
}

// Operation Controls
function toggleDetection(active) {
    detectionActive = active;
    const status = document.querySelector('.status-indicator');
    if (status) {
        status.textContent = active ? 'Online' : 'Offline';
        status.className = `status-indicator ${active ? 'online' : 'offline'}`;
    }
    alert(active ? 'Auto-detection started' : 'Auto-detection stopped');
}

function toggleIrrigation(active) {
    irrigationActive = active;
    alert(active ? 'Irrigation system activated' : 'Irrigation system deactivated');
}

function scheduleSpray() {
    alert('Spray scheduled for next high-risk detection');
}

function emergencySpray() {
    if (confirm('Initiate emergency spray on all fields?')) {
        alert('Emergency spray initiated!');
    }
}

function toggleCamera(element) {
    const status = element.querySelector('.camera-status');
    status.classList.toggle('online');
    status.classList.toggle('offline');
}

// Support Functions
function openManual() {
    window.open('https://example.com/manual', '_blank');
}

function openChat() {
    alert('Chat support would open here');
}

function submitTicket(e) {
    e.preventDefault();
    alert('Support ticket submitted successfully!');
    e.target.reset();
}

function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const toggle = element.querySelector('.faq-toggle');
    
    answer.classList.toggle('show');
    element.classList.toggle('active');
    toggle.textContent = answer.classList.contains('show') ? '−' : '+';
}

// Activity styling (add to CSS via JS)
const activityStyle = document.createElement('style');
activityStyle.textContent = `
    .activity-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: rgba(255,255,255,0.5);
        margin-bottom: 0.5rem;
        border-radius: 10px;
        backdrop-filter: blur(10px);
    }
    .activity-icon { font-size: 1.5rem; }
    .activity-date { margin-left: auto; font-size: 0.9rem; color: #666; }
`;
document.head.appendChild(activityStyle);
