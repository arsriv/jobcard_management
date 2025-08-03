function goTo(element) {
    window.location.href = element.dataset.url;
}

let officerJobs = [];
let filteredRequests = [];
let currentFilter = 'all';
let selectedRejectJobId = null;

let remark_modal = `<div id="rejectRemarkModal" class="modal">
        <div class="modal-content">
          <span class="close" onclick="closeRejectRemarkModal()">&times;</span>
          <h3>📝 Provide Rejection Remark</h3>

          <textarea id="rejectRemarkInput" rows="4" placeholder="Enter reason for rejection..."
            style="width: 100%; padding: 10px; border-radius: 5px;"></textarea>

          <div class="modal-buttons" style="margin-top: 15px;">
            <button class="btn-secondary" onclick="closeRejectRemarkModal()">Cancel</button>
            <button class="btn-primary" onclick="confirmReject()">Submit Remark</button>
          </div>
        </div>
      </div>`







// Fetch officer's jobs from backend
async function fetchOfficerJobs() {
    try {
        const response = await fetch('/get_officer_jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();

        if (data.success) {
            officerJobs = data.jobs;
            filteredRequests = [...officerJobs];
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
        'processing': 'status-progress',
        'completed': 'status-completed',
        'rejected': 'status-rejected'
    };

    const statusText = {
        'pending': 'Pending',
        'processing': 'processing',
        'completed': 'Completed',
        'rejected': 'Rejected'
    };

    return `


    




        <div class="request-card" data-status="${job.status}"">
            ${remark_modal}
            <div class="request-header">
                <div>
                    <div class="request-id">${job._id}</div>
                    <div class="request-date">${new Date(job.submission_date).toLocaleString()}</div>
                </div>
                <div class ="right-header">
                 ${job.status === 'processing' ? `
          <span class="complete-btn" id="complete-btn" onclick="completeJob('${job._id}')">COMPLETED</span>
          <span class="reject-btn" id="reject-btn" onclick="rejectJob('${job._id}')">REJECT</span>
        ` : ''}
                    <span class="status-badge ${statusClasses[job.status]}">${statusText[job.status]}</span>
                </div>
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
    document.getElementById('totalCount').textContent = officerJobs.length;
    document.getElementById('pendingCount').textContent =
        officerJobs.filter(j => j.status === 'pending').length;
    document.getElementById('progressCount').textContent =
        officerJobs.filter(j => j.status === 'processing').length;
    document.getElementById('completedCount').textContent =
        officerJobs.filter(j => j.status === 'completed').length;
}

// Filter requests
function filterRequests(status) {
    currentFilter = status;

    document.querySelectorAll('.filter-btn').forEach(btn =>
        btn.classList.remove('active'));
    event.target.classList.add('active');

    filteredRequests = status === 'all'
        ? [...officerJobs]
        : officerJobs.filter(job => job.status === status);

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
        const response = await fetch(`/get_officer_job/${jobId}`);
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
    fetchOfficerJobs();
}

// reject job
function rejectJob(jobId) {
    selectedRejectJobId = jobId; // Store the job ID
    document.getElementById("rejectRemarkInput").value = ""; // Clear old remark
    document.getElementById("rejectRemarkModal").style.display = "block";
}
function confirmReject() {
    const remark = document.getElementById("rejectRemarkInput").value.trim();

    if (!remark) {
        alert("Please provide a remark before rejecting.");
        return;
    }

    const job = officerJobs.find(j => j._id === selectedRejectJobId);

    if (job) {
        job.status = 'rejected';
        job.reject_remark = remark;

        fetch(`/api/jobs/${selectedRejectJobId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'rejected', reject_remark: remark })
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to update job status');
                return response.json();
            })
            .then(updatedJob => {
                showAlert('Job rejected with remark', 'success');
                fetchOfficerJobs();
                closeRejectRemarkModal();
            })
            .catch(error => {
                console.error('Error rejecting job:', error);
                showAlert('Failed to reject job', 'danger');
            });
    } else {
        showAlert('Job not found', 'warning');
    }
}
function closeRejectRemarkModal() {
    document.getElementById("rejectRemarkModal").style.display = "none";
}

function completeJob(jobId) {
    const job = officerJobs.find(j => j._id === jobId); // Use correct list

    if (job) {
        job.status = 'completed';

        fetch(`/api/jobs/${jobId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'completed' })
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to update job status');
                return response.json();
            })
            .then(updatedJob => {
                showAlert('Job status updated to completed', 'success');
                fetchOfficerJobs(); // Refresh data
            })
            .catch(error => {
                console.error('Error updating job:', error);
                showAlert('Failed to update job status', 'danger');
            });
    } else {
        showAlert('Job not found in list', 'warning');
    }
}



// Initialize when page loads
document.addEventListener('DOMContentLoaded', initDashboard);