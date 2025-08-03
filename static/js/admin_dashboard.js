
let jobRequests = [];
let users = [];
let officers = [];
let selectedJobId = null;
let statusChart = null;
let selectedUserId = null;
let selectedOfficerId = null;

const API_BASE_URL = `${window.location.origin}/api`;


// Initialize
document.addEventListener('DOMContentLoaded', function () {
    // Load all data from backend
    Promise.all([
        loadJobsFromBackend(),
        loadUsersFromBackend(),
        loadOfficersFromBackend()
    ]).then(() => {
        // Initialize UI after data is loaded
        loadJobsTable();
        loadUsersTable();
        loadOfficersTable();
        loadChart();
        updateStats();
        setupEventListeners();
        setupUserOfficerEventListeners();
    }).catch(error => {
        console.error('Failed to load initial data:', error);
        alert('Failed to load data from server. Please refresh the page.');
    });
});




// ================== BACKEND API FUNCTIONS ==================

// Load job requests from backend
function loadJobsFromBackend() {
    return $.ajax({
        url: `${API_BASE_URL}/jobs`,
        method: 'GET',
        dataType: 'json'
    }).done(function(data) {
        jobRequests = data.map(job => ({
            ...job,
            submission_date: new Date(job.submission_date),
            last_updated: new Date(job.last_updated)
        }));
        console.log('Jobs loaded:', jobRequests.length);
    }).fail(function(xhr, status, error) {
        console.error('Failed to load jobs:', error);
        throw new Error('Failed to load jobs');
    });
}

// Load users from backend
function loadUsersFromBackend() {
    return $.ajax({
        url: `${API_BASE_URL}/users`,
        method: 'GET',
        dataType: 'json'
    }).done(function(data) {
        users = data.map(user => ({
            ...user,
            lastActivity: user.lastActivity ? new Date(user.lastActivity) : new Date()
        }));
        console.log('Users loaded:', users.length);
    }).fail(function(xhr, status, error) {
        console.error('Failed to load users:', error);
        throw new Error('Failed to load users');
    });
}

// Load officers from backend
function loadOfficersFromBackend() {
    return $.ajax({
        url: `${API_BASE_URL}/officers`,
        method: 'GET',
        dataType: 'json'
    }).done(function(data) {
        officers = data;
        
        // Update officer select dropdown
        const officerSelect = document.getElementById('officerSelect');
        officerSelect.innerHTML = '<option value="">Select Officer</option>';
        officers.forEach(officer => {
            const option = document.createElement('option');
            option.value = officer.name;
            option.textContent = officer.name;
            officerSelect.appendChild(option);
        });
        
        console.log('Officers loaded:', officers.length);
    }).fail(function(xhr, status, error) {
        console.error('Failed to load officers:', error);
        throw new Error('Failed to load officers');
    });
}

// Create new job request
function createJob(jobData) {
    return $.ajax({
        url: `${API_BASE_URL}/jobs`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(jobData)
    });
}

// Update job request
function updateJobInBackend(jobId, updateData) {
    return $.ajax({
        url: `${API_BASE_URL}/jobs/${jobId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(updateData)
    });
}

// Delete job request
function deleteJobFromBackend(jobId) {
    return $.ajax({
        url: `${API_BASE_URL}/jobs/${jobId}`,
        method: 'DELETE'
    });
}

// Update user
function updateUserInBackend(empId, userData) {
    return $.ajax({
        url: `${API_BASE_URL}/users/${empId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(userData)
    });
}

// Delete user
function deleteUserFromBackend(empId) {
    return $.ajax({
        url: `${API_BASE_URL}/users/${empId}`,
        method: 'DELETE'
    });
}

// Create new officer
function createOfficer(officerData) {
    return $.ajax({
        url: `${API_BASE_URL}/officers`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(officerData)
    });
}

// Update officer
function updateOfficerInBackend(officerId, officerData) {
    return $.ajax({
        url: `${API_BASE_URL}/officers/${officerId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(officerData)
    });
}

// Delete officer
function deleteOfficerFromBackend(officerId) {
    return $.ajax({
        url: `${API_BASE_URL}/officers/${officerId}`,
        method: 'DELETE'
    });
}







// Initialize users and officers data
function initializeUsersAndOfficers() {
    // Extract unique users from job requests
    const userMap = new Map();

    jobRequests.forEach(job => {
        const key = job.emp_id;
        if (!userMap.has(key)) {
            userMap.set(key, {
                emp_id: job.emp_id,
                user_name: job.user_name,
                division: job.division,
                totalJobs: 0,
                activeJobs: 0,
                lastActivity: job.submission_date
            });
        }

        const user = userMap.get(key);
        user.totalJobs++;

        if (job.status !== 'completed') {
            user.activeJobs++;
        }

        if (job.last_updated > user.lastActivity) {
            user.lastActivity = job.last_updated;
        }
    });

    users = Array.from(userMap.values());

    // Update officer statistics
    officers.forEach(officer => {
        const assignedJobs = jobRequests.filter(job => job.assignedTo === officer.name);
        officer.assignedJobs = assignedJobs.length;
        officer.completedJobs = assignedJobs.filter(job => job.status === 'completed').length;
        officer.activeJobs = assignedJobs.filter(job => job.status !== 'completed').length;
    });

    loadUsersTable();
    loadOfficersTable();
    setupUserOfficerEventListeners();
}

function setupUserOfficerEventListeners() {
    document.getElementById('userSearchInput').addEventListener('input', filterUsers);
    document.getElementById('userSortBy').addEventListener('change', filterUsers);
    document.getElementById('officerSearchInput').addEventListener('input', filterOfficers);
    document.getElementById('officerSortBy').addEventListener('change', filterOfficers);
}

function loadUsersTable(usersToShow = users) {
    const tbody = document.getElementById('usersTableBody');

    tbody.innerHTML = usersToShow.map(user => `
        <tr>
            <td><strong>${user.user_name}</strong></td>
            <td>${user.emp_id}</td>
            <td>${user.division}</td>
            <td><span class="stat-number" style="font-size: 1.2rem; color: #667eea;">${user.totalJobs}</span></td>
            <td><span class="stat-number" style="font-size: 1.2rem; color: #dd6b20;">${user.activeJobs}</span></td>
            <td>${user.lastActivity.toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-view" onclick="viewUserJobs('${user.emp_id}')" title="View Jobs">📋</button>
                    <button class="btn btn-edit" onclick="openEditUserModal('${user.emp_id}')" title="Edit User">✏️</button>
                    <button class="btn btn-delete" onclick="deleteUser('${user.emp_id}')" title="Delete User">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function loadOfficersTable(officersToShow = officers) {
    const tbody = document.getElementById('officersTableBody');

    tbody.innerHTML = officersToShow.map(officer => {
        const successRate = officer.assignedJobs > 0 ?
            Math.round((officer.completedJobs / officer.assignedJobs) * 100) : 0;

        return `
            <tr>
                <td><strong>${officer.name}</strong></td>
                <td>${officer._id}</td>
                <td>${officer.email_id}</td>

                <td><span class="stat-number" style="font-size: 1.2rem; color: #667eea;">${officer.assignedJobs}</span></td>
                <td><span class="stat-number" style="font-size: 1.2rem; color: #48bb78;">${officer.completedJobs}</span></td>
                <td><span class="stat-number" style="font-size: 1.2rem; color: #dd6b20;">${officer.activeJobs}</span></td>
                <td><span style="color: ${successRate >= 80 ? '#48bb78' : successRate >= 60 ? '#dd6b20' : '#f56565'}">${successRate}%</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-view" onclick="viewOfficerJobs('${officer.name}')" title="View Jobs">📋</button>
                        <button class="btn btn-edit" onclick="openEditOfficerModal('${officer.id}')" title="Edit Officer">✏️</button>
                        <button class="btn btn-delete" onclick="deleteOfficer('${officer.id}')" title="Delete Officer">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterUsers() {
    const search = document.getElementById('userSearchInput').value.toLowerCase();
    const sort = document.getElementById('userSortBy').value;

    let filtered = [...users];

    if (search) {
        filtered = filtered.filter(user =>
            user.user_name.toLowerCase().includes(search) ||
            user.emp_id.toLowerCase().includes(search)
        );
    }

    if (sort === 'name') {
        filtered.sort((a, b) => a.user_name.localeCompare(b.user_name));
    } else if (sort === 'division') {
        filtered.sort((a, b) => a.division.localeCompare(b.division));
    } else if (sort === 'jobCount') {
        filtered.sort((a, b) => b.totalJobs - a.totalJobs);
    }

    loadUsersTable(filtered);
}

function filterOfficers() {
    const search = document.getElementById('officerSearchInput').value.toLowerCase();
    const sort = document.getElementById('officerSortBy').value;

    let filtered = [...officers];

    if (search) {
        filtered = filtered.filter(officer =>
            officer.name.toLowerCase().includes(search)
        );
    }

    if (sort === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'assignedJobs') {
        filtered.sort((a, b) => b.assignedJobs - a.assignedJobs);
    } else if (sort === 'completedJobs') {
        filtered.sort((a, b) => b.completedJobs - a.completedJobs);
    }

    loadOfficersTable(filtered);
}

// User Management Functions
function viewUserJobs(empId) {
    const userJobs = jobRequests.filter(job => job.emp_id === empId);
    const user = users.find(u => u.emp_id === empId);

    if (userJobs.length > 0 && user) {
        const jobsList = userJobs.map(job =>
            `• ${job.machine_type} (${job.status}) - ${job.submission_date.toLocaleDateString()}`
        ).join('\n');

        alert(`Jobs for ${user.user_name} (${empId}):\n\n${jobsList}`);
    } else {
        alert('No jobs found for this user.');
    }
}

function openEditUserModal(empId) {
    selectedUserId = empId;
    const user = users.find(u => u.emp_id === empId);

    if (user) {
        document.getElementById('editUserName').value = user.user_name;
        document.getElementById('editUserEmpId').value = user.emp_id;
        document.getElementById('editUserDivision').value = user.division;
        document.getElementById('editUserModal').style.display = 'block';
    }
}

function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
    selectedUserId = null;
}

function saveUserEdit() {
    const userData = {
        user_name: document.getElementById('editUserName').value,
        emp_id: document.getElementById('editUserEmpId').value,
        division: document.getElementById('editUserDivision').value
    };

    updateUserInBackend(selectedUserId, userData)
        .done(function() {
            // Reload all data to ensure consistency
            Promise.all([
                loadJobsFromBackend(),
                loadUsersFromBackend()
            ]).then(() => {
                loadJobsTable();
                loadUsersTable();
                updateStats();
                loadChart();
                closeEditUserModal();
                alert('User updated successfully!');
            });
        })
        .fail(function(xhr, status, error) {
            console.error('Failed to update user:', error);
            alert('Failed to update user. Please try again.');
        });
}


function deleteUser(empId) {
    if (confirm('Are you sure you want to delete this user? This will also delete all their job requests.')) {
        deleteUserFromBackend(empId)
            .done(function() {
                // Reload all data to ensure consistency
                Promise.all([
                    loadJobsFromBackend(),
                    loadUsersFromBackend()
                ]).then(() => {
                    loadJobsTable();
                    loadUsersTable();
                    updateStats();
                    loadChart();
                    alert('User and related jobs deleted successfully!');
                });
            })
            .fail(function(xhr, status, error) {
                console.error('Failed to delete user:', error);
                alert('Failed to delete user. Please try again.');
            });
    }
}

// Officer Management Functions
function viewOfficerJobs(officerName) {
    const officerJobs = jobRequests.filter(job => job.assignedTo === officerName);

    if (officerJobs.length > 0) {
        const jobsList = officerJobs.map(job =>
            `• ${job.user_name} - ${job.machine_type} (${job.status}) - ${job.submission_date.toLocaleDateString()}`
        ).join('\n');

        alert(`Jobs assigned to ${officerName}:\n\n${jobsList}`);
    } else {
        alert('No jobs assigned to this officer.');
    }
}

function openAddOfficerModal() {
    document.getElementById('addOfficerModal').style.display = 'block';
}

function closeAddOfficerModal() {
    document.getElementById('addOfficerModal').style.display = 'none';
    document.getElementById('newOfficerName').value = '';
    document.getElementById('newOfficerSpecialization').value = 'Hardware';
}

function addNewOfficer() {
    const name = document.getElementById('newOfficerName').value.trim();
    const specialization = document.getElementById('newOfficerSpecialization').value;
    
    if (!name) {
        alert('Please enter officer name');
        return;
    }
    
    // Check if officer already exists locally
    if (officers.some(o => o.name.toLowerCase() === name.toLowerCase())) {
        alert('Officer with this name already exists');
        return;
    }
    
    const officerData = {
        name: name,
        specialization: specialization
    };
    
    createOfficer(officerData)
        .done(function(newOfficer) {
            // Add to local data
            officers.push(newOfficer);
            
            // Update officer select dropdown
            const officerSelect = document.getElementById('officerSelect');
            const option = document.createElement('option');
            option.value = newOfficer.name;
            option.textContent = newOfficer.name;
            officerSelect.appendChild(option);
            
            // Refresh UI
            filterOfficers();
            closeAddOfficerModal();
            alert('Officer added successfully!');
        })
        .fail(function(xhr, status, error) {
            console.error('Failed to add officer:', error);
            alert('Failed to add officer. Please try again.');
        });
}


function openEditOfficerModal(officerId) {
    selectedOfficerId = officerId;
    const officer = officers.find(o => o.id === officerId);

    if (officer) {
        document.getElementById('editOfficerName').value = officer.name;
        document.getElementById('editOfficerSpecialization').value = officer.specialization;
        document.getElementById('editOfficerModal').style.display = 'block';
    }
}

function closeEditOfficerModal() {
    document.getElementById('editOfficerModal').style.display = 'none';
    selectedOfficerId = null;
}

function saveOfficerEdit() {
    const officerData = {
        name: document.getElementById('editOfficerName').value,
        specialization: document.getElementById('editOfficerSpecialization').value
    };
    
    updateOfficerInBackend(selectedOfficerId, officerData)
        .done(function() {
            // Reload all data to ensure consistency
            Promise.all([
                loadJobsFromBackend(),
                loadOfficersFromBackend()
            ]).then(() => {
                loadJobsTable();
                loadOfficersTable();
                updateStats();
                loadChart();
                closeEditOfficerModal();
                alert('Officer updated successfully!');
            });
        })
        .fail(function(xhr, status, error) {
            console.error('Failed to update officer:', error);
            alert('Failed to update officer. Please try again.');
        });
}

function deleteOfficer(officerId) {
    const officer = officers.find(o => o.id === officerId);
    if (!officer) return;
    
    if (confirm(`Are you sure you want to delete ${officer.name}? All assigned jobs will be marked as unassigned.`)) {
        deleteOfficerFromBackend(officerId)
            .done(function() {
                // Reload all data to ensure consistency
                Promise.all([
                    loadJobsFromBackend(),
                    loadOfficersFromBackend()
                ]).then(() => {
                    loadJobsTable();
                    loadOfficersTable();
                    updateStats();
                    loadChart();
                    alert('Officer deleted successfully! Related jobs have been unassigned.');
                });
            })
            .fail(function(xhr, status, error) {
                console.error('Failed to delete officer:', error);
                alert('Failed to delete officer. Please try again.');
            });
    }
}
// Update the existing window click handler for new modals
const originalWindowClick = window.onclick;
window.onclick = function (event) {
    // Call original handler
    if (originalWindowClick) {
        originalWindowClick(event);
    }

    // Handle new modals
    const editUserModal = document.getElementById('editUserModal');
    const addOfficerModal = document.getElementById('addOfficerModal');
    const editOfficerModal = document.getElementById('editOfficerModal');

    if (event.target === editUserModal) {
        closeEditUserModal();
    }
    if (event.target === addOfficerModal) {
        closeAddOfficerModal();
    }
    if (event.target === editOfficerModal) {
        closeEditOfficerModal();
    }
}

// Call this function after DOMContentLoaded in your existing code
// Add this line after your existing initialization:





function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', filterJobs);
    document.getElementById('sortBy').addEventListener('change', filterJobs);
    document.getElementById('statusFilter').addEventListener('change', filterJobs);
}

function loadJobsTable(jobs = jobRequests) {
    const tbody = document.getElementById('jobsTableBody');

    tbody.innerHTML = jobs.map(job => `
                <tr>
                    <td><strong>${job._id}</strong>
                    <td><strong>${job.user_name}</strong><br><small>${job.emp_id}</small></td>
                    <td>${job.submission_date}</td>
                    <td>${job.machine_type}</td>
                    <td><span  onclick="showRejectRemarkModal('${job._id}')"   class="job-status status-${job.status}">${job.status}</span></td>
                    <td><span style="color: ${job.priority === 'high' ? '#e53e3e' : job.priority === 'medium' ? '#dd6b20' : '#38a169'}">${job.priority}</span></td>
                    <td>${job.assignedTo}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-view" onclick="viewJob('${job._id}')" title="Download PDF">📄</button>
        
            <button class="btn btn-assign" onclick="openAssignmentModal('${job._id}')" title="Assign">👤</button>
                            <button class="btn btn-edit" onclick="openEditModal('${job._id}')" title="Edit">✏️</button>
                            <button class="btn btn-delete" onclick="deleteJob('${job._id}')" title="Delete">🗑️</button>
                        </div>
                    </td>
                </tr>
            `).join('');
}

function loadChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');
    const counts = jobRequests.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
    }, {});

    // Destroy existing chart if it exists
    if (statusChart) {
        statusChart.destroy();
    }

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#f56565', '#ed8936', '#48bb78']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function updateStats() {
    const total = jobRequests.length;
    const pending = jobRequests.filter(j => j.status === 'pending').length;
    const processing = jobRequests.filter(j => j.status === 'processing').length;
    const completed = jobRequests.filter(j => j.status === 'completed').length;

    document.getElementById('totalJobs').textContent = total;
    document.getElementById('pendingJobs').textContent = pending;
    document.getElementById('processingJobs').textContent = processing;
    document.getElementById('completedJobs').textContent = completed;
}

function filterJobs() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const sort = document.getElementById('sortBy').value;
    const status = document.getElementById('statusFilter').value;

    let filtered = [...jobRequests];

    if (search) {
        filtered = filtered.filter(job =>
            job.user_name.toLowerCase().includes(search) ||
            job.emp_id.toLowerCase().includes(search) ||
            job.division.toLowerCase().includes(search)||
            job._id.toLowerCase().includes(search)
        );
    }

    if (status !== 'all') {
        filtered = filtered.filter(job => job.status === status);
    }

    if (sort === 'priority') {
        const order = { high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => order[b.priority] - order[a.priority]);
    } else if (sort === 'date') {
        filtered.sort((a, b) => b.submission_date - a.submission_date);
    } else if (sort === 'status') {
        filtered.sort((a, b) => a.status.localeCompare(b.status));
    }

    loadJobsTable(filtered);
}


function closeViewJobModal() {
  document.getElementById("viewJobModal").style.display = "none";
}


function viewJob(jobId) {
  const job = jobRequests.find(j => j._id === jobId);
  if (!job) return;

  const submissionDate = new Date(job.submission_date);
  const estimatedDate = new Date(submissionDate);
  estimatedDate.setDate(submissionDate.getDate() + 15);
  const formatDate = (date) => date.toISOString().split("T")[0];

  const modalContent = `
    <div class="modal-content" id="printableJobContent">
      <span class="close" onclick="closeViewJobModal()">&times;</span>
      
      <div class="header">
        <img src="https://crridom.gov.in/sites/default/files/color/mayo-1cd06d66/logo.png" alt="CSIR-CRRI Logo" class="logo">
        <h2 class="center-text">CSIR - CENTRAL ROAD RESEARCH INSTITUTE</h2>
        <h4 class="center-text">(A Constituent of Council of Scientific & Industrial Research)</h4>
        <h3 class="center-text underline">Job Request Details</h3>
        <h4 class="center-text underline">${job._id}</h4>
      </div>

      <div class="section">
        <h4>User Details</h4>
        <p><strong>Employee Name:</strong> ${job.user_name}</p>
        <p><strong>Employee ID:</strong> ${job.emp_id}</p>
        <p><strong>Division:</strong> ${job.division}</p>
        <p><strong>Email:</strong> ${job.email}</p>
        <p><strong>Location:</strong> ${job.location}</p>
      </div>

      <div class="section">
        <h4>Machine Details</h4>
        <p><strong>Machine Type:</strong> ${job.machine_type}</p>
        <p><strong>Model No:</strong> ${job.model_no}</p>
        <p><strong>Serial No:</strong> ${job.serial_no}</p>
        <p><strong>Project No:</strong> ${job.project_no}</p>
      </div>

      <div class="section">
        <h4>Service Details</h4>
        <p><strong>Services Requested:</strong> ${job.services.join(", ")}</p>
        <p><strong>Status:</strong> ${job.status}</p>
        <p><strong>Priority:</strong> ${job.priority}</p>
        <p><strong>Assigned To:</strong> ${job.assignedTo || "Not Assigned"}</p>
      </div>

      <div class="section">
        <h4>Date Details</h4>
        <p><strong>Submission Date:</strong> ${formatDate(submissionDate)}</p>
        <p><strong>Estimated Completion Date:</strong> ${formatDate(estimatedDate)}</p>
      </div>

      <div class="modal-buttons">
        <button class="btn-secondary" onclick="closeViewJobModal()">Close</button>
        <button class="btn-primary" onclick="printJobDetails()">🖨️ Print to PDF</button>
      </div>
    </div>
  `;

  const modal = document.getElementById("viewJobModal");
  modal.innerHTML = modalContent;
  modal.style.display = "block";
}


function printJobDetails() {
  const printContents = document.getElementById("printableJobContent").innerHTML;
  const printWindow = window.open('', '', 'height=800,width=800');
  printWindow.document.write(`
    <html>
      <head>
        <title>Job Request Details</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .center-text { text-align: center; }
          .underline { text-decoration: underline; }
          .section { border: 1px solid #ccc; border-radius: 8px; padding: 10px; margin-top: 20px; }
          .logo { height: 80px; display: block; margin: 0 auto 20px; }
          .modal-buttons { display: none; } /* hide buttons in print */
        </style>
      </head>
      <body onload="window.print(); window.close();">
        ${printContents}
      </body>
    </html>
  `);
  printWindow.document.close();
}








function generateServiceCheckbox(id, label, selectedServices = []) {
  const checked = selectedServices?.includes(id) ? "checked" : "";
  return `
    <div class="service-item">
      <input type="checkbox" id="${id}" disabled ${checked}>
      <label for="${id}">${label}</label>
    </div>
  `;
}




function openAssignmentModal(jobId) {
    selectedJobId = jobId;
    document.getElementById('assignmentModal').style.display = 'block';
}

function closeAssignmentModal() {
    document.getElementById('assignmentModal').style.display = 'none';
    selectedJobId = null;
    document.getElementById('officerSelect').value = '';
    document.getElementById('assignmentNotes').value = '';
}

function confirmAssignment() {
    const officer = document.getElementById('officerSelect').value;
    const notes = document.getElementById('assignmentNotes').value;

    if (!officer) {
        alert('Please select an officer');
        return;
    }

    const updateData = {
        assignedTo: officer,
        status: 'processing',
        notes: notes
    };

    updateJobInBackend(selectedJobId, updateData)
        .done(function() {
            // Update local data
            const jobIndex = jobRequests.findIndex(j => j._id === selectedJobId);
            if (jobIndex !== -1) {
                jobRequests[jobIndex].assignedTo = officer;
                jobRequests[jobIndex].status = 'processing';
                jobRequests[jobIndex].last_updated = new Date();
            }

            // Refresh UI
            filterJobs();
            updateStats();
            loadChart();
            initializeUsersAndOfficers();
            closeAssignmentModal();
            alert('Job assigned successfully!');
        })
        .fail(function(xhr, status, error) {
            console.error('Failed to assign job:', error);
            alert('Failed to assign job. Please try again.');
        });
}
function showRejectRemarkModal(jobId) {
    selectedJobId = jobId;
    const job = jobRequests.find(j => j._id === jobId);
    if(job.status == 'rejected'){
    document.getElementById('RejectRemark').style.display = 'block';
    document.getElementById('RejectRemarkText').innerHTML =job.reject_remark;
    }
}

function closeRejectRemarkModal() {
    document.getElementById('RejectRemark').style.display = 'none';
    selectedJobId = null;
}


function openEditModal(jobId) {
    selectedJobId = jobId;
    const job = jobRequests.find(j => j._id === jobId);

    if (job) {
        document.getElementById('editStatus').value = job.status;
        document.getElementById('editPriority').value = job.priority;
        document.getElementById('editDivision').value = job.division;
        document.getElementById('editMachine').value = job.machine_type;
        document.getElementById('editModal').style.display = 'block';
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    selectedJobId = null;
}

function saveEdit() {
    const updateData = {
        status: document.getElementById('editStatus').value,
        priority: document.getElementById('editPriority').value,
        division: document.getElementById('editDivision').value,
        machine_type: document.getElementById('editMachine').value
    };

    updateJobInBackend(selectedJobId, updateData)
        .done(function() {
            // Update local data
            const jobIndex = jobRequests.findIndex(j => j._id === selectedJobId);
            if (jobIndex !== -1) {
                Object.assign(jobRequests[jobIndex], updateData);
                jobRequests[jobIndex].last_updated = new Date();
            }

            // Refresh UI
            filterJobs();
            updateStats();
            loadChart();
            initializeUsersAndOfficers();
            closeEditModal();
            alert('Job updated successfully!');
        })
        .fail(function(xhr, status, error) {
            console.error('Failed to update job:', error);
            alert('Failed to update job. Please try again.');
        });
}

function deleteJob(jobId) {
    if (confirm('Are you sure you want to delete this job request?')) {
        deleteJobFromBackend(jobId)
            .done(function() {
                // Remove from local data
                jobRequests = jobRequests.filter(job => job._id !== jobId);
                
                // Refresh UI
                filterJobs();
                updateStats();
                loadChart();
                initializeUsersAndOfficers();
                alert('Job deleted successfully');
            })
            .fail(function(xhr, status, error) {
                console.error('Failed to delete job:', error);
                alert('Failed to delete job. Please try again.');
            });
    }
}

// Close modals when clicking outside
window.onclick = function (event) {
    const assignModal = document.getElementById('assignmentModal');
    const editModal = document.getElementById('editModal');

    if (event.target === assignModal) {
        closeAssignmentModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
}



// refresh


function refreshData() {
    Promise.all([
        loadJobsFromBackend(),
        loadUsersFromBackend(),
        loadOfficersFromBackend()
    ]).then(() => {
        // Only refresh UI if no modals are open
        if (!document.querySelector('.modal[style*="block"]')) {
            loadJobsTable();
            loadUsersTable();
            loadOfficersTable();
            updateStats();
            loadChart();
        }
    }).catch(error => {
        console.error('Failed to refresh data:', error);
    });
}




$(document).ajaxError(function(event, xhr, settings, thrownError) {
    if (xhr.status === 401) {
        alert('Session expired. Please login again.');
        // Redirect to login page
    } else if (xhr.status === 500) {
        console.error('Server error:', thrownError);
        alert('Server error occurred. Please try again later.');
    }
});