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
// Add these functions to your existing script.js file

// Auth Management
let currentUser = null;

// Show/Hide Auth Cards
function showLogin() {
    document.getElementById('loginCard').classList.remove('hidden');
    document.getElementById('signupCard').classList.add('hidden');
    document.getElementById('forgotPasswordCard').classList.add('hidden');
}

function showSignup() {
    showLogin();
    document.getElementById('signupCard').classList.remove('hidden');
}

function showForgotPassword() {
    showLogin();
    document.getElementById('forgotPasswordCard').classList.remove('hidden');
}

// Signup Handler
function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    // Check if username exists
    const users = JSON.parse(localStorage.getItem('cropguard_users') || '[]');
    if (users.find(user => user.username === username)) {
        alert('Username already exists!');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        name,
        username,
        email,
        password, // In production, hash this!
        farmLocation: 'Dhaka, Bangladesh',
        phone: '',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('cropguard_users', JSON.stringify(users));
    
    alert('Account created successfully! Please login.');
    showLogin();
    e.target.reset();
}

// Forgot Password Handler
function handleForgotPassword(e) {
    e.preventDefault();
    const username = document.getElementById('resetUsername').value;
    
    const users = JSON.parse(localStorage.getItem('cropguard_users') || '[]');
    const user = users.find(u => u.username === username);
    
    if (user) {
        // Reset to default password
        user.password = 'newpass123';
        localStorage.setItem('cropguard_users', JSON.stringify(users));
        alert(`Password reset successful!\nNew password: newpass123\nPlease login with new credentials.`);
    } else {
        alert('Username not found!');
    }
    
    showLogin();
    e.target.reset();
}

// Update Login Handler (replace existing)
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const users = JSON.parse(localStorage.getItem('cropguard_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user || (username === 'admin' && password === 'admin123')) {
        if (!user) {
            // Demo admin user
            currentUser = { name: 'Admin User', username, email: 'admin@cropguard.com', phone: '+880 123 456 7890', farmLocation: 'Dhaka, Bangladesh' };
        } else {
            currentUser = user;
        }
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid credentials!');
    }
}

// Load Current User
function loadCurrentUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('navUser').textContent = `Welcome, ${currentUser.name}`;
        
        // Update profile form
        if (document.getElementById('userName')) document.getElementById('userName').value = currentUser.name || 'Admin User';
        if (document.getElementById('userEmail')) document.getElementById('userEmail').value = currentUser.email || 'admin@cropguard.com';
        if (document.getElementById('userPhone')) document.getElementById('userPhone').value = currentUser.phone || '';
        if (document.getElementById('userFarm')) document.getElementById('userFarm').value = currentUser.farmLocation || 'Dhaka, Bangladesh';
    }
}

// Profile Update Handler
function handleProfileUpdate(e) {
    e.preventDefault();
    if (!currentUser) return;
    
    currentUser.name = document.getElementById('userName').value;
    currentUser.email = document.getElementById('userEmail').value;
    currentUser.phone = document.getElementById('userPhone').value;
    currentUser.farmLocation = document.getElementById('userFarm').value;
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    document.getElementById('navUser').textContent = `Welcome, ${currentUser.name}`;
    
    alert('Profile updated successfully!');
}

// Password Change Handler
function handlePasswordChange(e) {
    e.preventDefault();
    if (!currentUser) return;
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    // Demo admin check
    const isDemoAdmin = currentUser.username === 'admin' && currentPassword === 'admin123';
    
    if (!isDemoAdmin && currentUser.password !== currentPassword) {
        alert('Current password is incorrect!');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters!');
        return;
    }
    
    currentUser.password = newPassword;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update users array too
    const users = JSON.parse(localStorage.getItem('cropguard_users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('cropguard_users', JSON.stringify(users));
    }
    
    alert('Password changed successfully!');
    e.target.reset();
}

// Tab Switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

// Update DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Auth forms
    const signupForm = document.getElementById('signupForm');
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) forgotForm.addEventListener('submit', handleForgotPassword);
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);
    
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) passwordForm.addEventListener('submit', handlePasswordChange);
    
    loadCurrentUser();
});
