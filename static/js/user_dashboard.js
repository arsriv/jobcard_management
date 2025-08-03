function goTo(element) {
    window.location.href = element.dataset.url;
}

let userJobs = [];
let filteredRequests = [];
let currentFilter = 'all';

// Fetch user's jobs from backend
async function fetchUserJobs() {
    try {
        const response = await fetch('/get_user_jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();
        
        if (data.success) {
            userJobs = data.jobs;
            filteredRequests = [...userJobs];
            updateStats();
            renderRequests();
        } else {
            throw new Error(data.message || 'Failed to load jobs');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to load jobs: ' + error.message, 'danger');
    }
}

// Generate request card HTML
function generateRequestCard(job) {
    const priorityColors = {
        'High': '#e74c3c',
        'Medium': '#f39c12',
        'Low': '#27ae60'
    };

    const statusClasses = {
        'pending': 'status-pending',
        'progress': 'status-progress',
        'completed': 'status-completed',
        'rejected': 'status-rejected'
    };

    const statusText = {
        'pending': 'Pending',
        'progress': 'In Progress',
        'completed': 'Completed',
        'rejected': 'Rejected'
    };

    return `
        <div class="request-card" data-status="${job.status}" onclick="viewRequestDetails('${job._id}')">
            <div class="request-header">
                <div>
                    <div class="request-id">${job._id}</div>
                    <div class="request-date">${new Date(job.submission_date).toLocaleString()}</div>
                </div>
                <span class="status-badge ${statusClasses[job.status]}">${statusText[job.status]}</span>
            </div>
            
            <div class="request-details">
                <div class="detail-item">
                    <div class="detail-label">Project No.</div>
                    <div class="detail-value">${job.project_no}</div>
                </div>
                 <div class="detail-item">
                    <div class="detail-label">Location.</div>
                    <div class="detail-value">${job.location}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Machine Type</div>
                    <div class="detail-value">${job.machine_type}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Model</div>
                    <div class="detail-value">${job.model_no || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Priority</div>
                    <div class="detail-value" style="color: ${priorityColors[job.priority] || '#333'}">
                        ${job.priority || 'Not specified'}
                    </div>
                </div>
            </div>
            
            <div class="request-services">
                <div class="detail-label">Services:</div>
                <div class="service-tags">
                    ${job.services.map(s => `<span class="service-tag">${s}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

// Render requests
function renderRequests(requests = filteredRequests) {
    const container = document.getElementById('requestsList');
    
    if (!requests.length) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No requests found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(job => generateRequestCard(job)).join('');
}

// Update statistics
function updateStats() {
    document.getElementById('totalCount').textContent = userJobs.length;
    document.getElementById('pendingCount').textContent = 
        userJobs.filter(j => j.status === 'pending').length;
    document.getElementById('progressCount').textContent = 
        userJobs.filter(j => j.status === 'progress').length;
    document.getElementById('completedCount').textContent = 
        userJobs.filter(j => j.status === 'completed').length;
}

// Filter requests
function filterRequests(status) {
    currentFilter = status;
    
    document.querySelectorAll('.filter-btn').forEach(btn => 
        btn.classList.remove('active'));
    event.target.classList.add('active');

    filteredRequests = status === 'all' 
        ? [...userJobs] 
        : userJobs.filter(job => job.status === status);

    const searchTerm = document.getElementById('searchInput').value.trim();
    searchTerm ? applySearch(searchTerm) : renderRequests();
}

// Search functionality
function applySearch(term) {
    const searchTerm = term.toLowerCase();
    const results = filteredRequests.filter(job => 
        job._id.toLowerCase().includes(searchTerm) ||
        (job.model_no && job.model_no.toLowerCase().includes(searchTerm)) ||
        job.services.some(s => s.toLowerCase().includes(searchTerm))
    );
    renderRequests(results);
}

// Handle search input
function searchRequests() {
    const term = document.getElementById('searchInput').value.trim();
    term ? applySearch(term) : renderRequests();
}

// View request details
async function viewRequestDetails(jobId) {
    try {
        const response = await fetch(`/get_job/${jobId}`);
        const job = await response.json();
        
        if (job) {
            alert(`Request Details:\n\nID: ${job._id}\nStatus: ${job.status}\nMachine: ${job.machine_type}\nModel: ${job.model_no}\n\nServices:\n${job.services.join('\n')}`);
        } else {
            showAlert('Request not found', 'warning');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to load request details', 'danger');
    }
}

// Show alert message
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    document.body.prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

// Initialize dashboard
function initDashboard() {
    // Set up user avatar
    const nameElement = document.getElementById("user-name");
    const fullName = nameElement.textContent.replace(/\w\S*/g, 
        w => w[0].toUpperCase() + w.slice(1).toLowerCase());
    nameElement.textContent = fullName;
    
    const initials = fullName.split(/\s+/)
        .map(n => n[0])
        .join('')
        .toUpperCase();
    document.getElementById("user-logo").textContent = initials.slice(0, 2);

    // Load data
    fetchUserJobs();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initDashboard);