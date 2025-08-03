let currentStep = 1;
        const totalSteps = 4;

        // Initialize form
        document.addEventListener('DOMContentLoaded', function() {
            // Simulate fetching user data from session
            fetchUserData();
            
            // Initialize accordion functionality
            initializeAccordion();
            
            // Update progress
            updateProgress();
        });

        //  fetching user data from Flask session
        function fetchUserData() {
            const userData = {
                user_name:"{{session['user']['name']}}",
                emp_id: "{{session['user']['_id']}}",
                division: "{{session['user']['group']}}",
                email: "{{session['user']['email']}}"
            };

            // Populate the form fields
            document.getElementById('userName').value = userData.user_name;
            document.getElementById('empId').value = userData.emp_id;
            document.getElementById('division').value = userData.division;
            document.getElementById('email').value = userData.email;
        }

        // Accordion functionality
        function initializeAccordion() {
            const accordionBtns = document.querySelectorAll('.accordion-btn');
            accordionBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const panel = this.nextElementSibling;
                    const isActive = this.classList.contains('active');
                    
                    // Close all panels
                    accordionBtns.forEach(b => {
                        b.classList.remove('active');
                        b.nextElementSibling.classList.remove('active');
                    });
                    
                    // Open clicked panel if it wasn't active
                    if (!isActive) {
                        this.classList.add('active');
                        panel.classList.add('active');
                    }
                });
            });
        }

        // Toggle other machine input
        function toggleOtherMachine(select) {
            const otherGroup = document.getElementById('otherMachineGroup');
            const otherInput = document.querySelector('input[name="other_machine"]');
            
            if (select.value === 'other') {
                otherGroup.style.display = 'block';
                otherInput.required = true;
            } else {
                otherGroup.style.display = 'none';
                otherInput.required = false;
                otherInput.value = '';
            }
        }

        // Toggle other OS input
        function toggleOtherOS(select) {
            const otherGroup = document.getElementById('otherOSGroup');
            const otherInput = document.querySelector('input[name="other_os"]');
            
            if (select.value === 'other') {
                otherGroup.style.display = 'block';
                otherInput.required = true;
            } else {
                otherGroup.style.display = 'none';
                otherInput.required = false;
                otherInput.value = '';
            }
        }

        // Navigation functions
        function nextStep() {
            if (validateCurrentStep()) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    showStep(currentStep);
                    updateProgress();
                    updateNavigation();
                    
                    if (currentStep === 4) {
                        generateReview();
                    }
                }
            }
        }

        function previousStep() {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
                updateProgress();
                updateNavigation();
            }
        }

        function showStep(step) {
            // Hide all sections
            document.querySelectorAll('.form-section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show current section
            document.getElementById(`section${step}`).classList.remove('hidden');
        }

        function updateProgress() {
            const progressFill = document.getElementById('progressFill');
            const progressPercentage = (currentStep / totalSteps) * 100;
            progressFill.style.width = progressPercentage + '%';
            
            // Update step indicators
            for (let i = 1; i <= totalSteps; i++) {
                const step = document.getElementById(`step${i}`);
                if (i <= currentStep) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            }
        }

        function updateNavigation() {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const submitBtn = document.getElementById('submitBtn');
            
            // Show/hide previous button
            if (currentStep > 1) {
                prevBtn.style.display = 'inline-flex';
            } else {
                prevBtn.style.display = 'none';
            }
            
            // Show/hide next/submit buttons
            if (currentStep < totalSteps) {
                nextBtn.style.display = 'inline-flex';
                submitBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-flex';
            }
        }

        function validateCurrentStep() {
            const currentSection = document.getElementById(`section${currentStep}`);
            const requiredInputs = currentSection.querySelectorAll('input[required], select[required]');
            let isValid = true;
            
            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    input.style.borderColor = '#e74c3c';
                    isValid = false;
                } else {
                    input.style.borderColor = '#e9ecef';
                }
            });
            
            if (!isValid) {
                alert('Please fill in all required fields before proceeding.');
            }
            
            return isValid;
        }

        function generateReview() {
            const form = document.getElementById('serviceForm');
            const formData = new FormData(form);
            const reviewContent = document.getElementById('reviewContent');
            
            let html = '<div class="form-grid">';
            
            // User Details
            html += '<div class="form-group"><h3>User Information</h3>';
            html += `<p><strong>Name:</strong> ${formData.get('user_name')}</p>`;
            html += `<p><strong>Employee ID:</strong> ${formData.get('emp_id')}</p>`;
            html += `<p><strong>Division:</strong> ${formData.get('division')}</p>`;
            html += `<p><strong>Email:</strong> ${formData.get('email')}</p>`;
            html += `<p><strong>Location:</strong> ${formData.get('location')}</p>`;
            html += `<p><strong>Project No:</strong> ${formData.get('project_no')}</p>`;
            html += '</div>';
            
            // Machine Details
            html += '<div class="form-group"><h3>Machine Information</h3>';
            html += `<p><strong>Machine Type:</strong> ${formData.get('machine_type')}${formData.get('other_machine') ? ' - ' + formData.get('other_machine') : ''}</p>`;
            html += `<p><strong>Model:</strong> ${formData.get('model_no')}</p>`;
            html += `<p><strong>Serial No:</strong> ${formData.get('serial_no')}</p>`;
            html += `<p><strong>Part No:</strong> ${formData.get('part_no')}</p>`;
            html += `<p><strong>OS:</strong> ${formData.get('operating_system')}${formData.get('other_os') ? ' - ' + formData.get('other_os') : ''}</p>`;
            html += `<p><strong>PIR No:</strong> ${formData.get('pir_no')}</p>`;
            html += '</div>';
            
            html += '</div>';
            
            // Selected Services
            const selectedServices = formData.getAll('services');
            if (selectedServices.length > 0) {
                html += '<div class="form-group"><h3>Selected Services</h3><ul>';
                selectedServices.forEach(service => {
                    html += `<li>${service.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`;
                });
                html += '</ul></div>';
            }
            
            // Additional Information
            if (formData.get('email_id')) {
                html += `<div class="form-group"><h3>Additional Information</h3>`;
                html += `<p><strong>Email ID:</strong> ${formData.get('email_id')}</p>`;
                if (formData.get('document_type')) {
                    html += `<p><strong>Document Type:</strong> ${formData.get('document_type')}</p>`;
                }
                if (formData.get('network_type')) {
                    html += `<p><strong>Network Type:</strong> ${formData.get('network_type')}</p>`;
                }
                if (formData.get('additional_services')) {
                    html += `<p><strong>Additional Services:</strong> ${formData.get('additional_services')}</p>`;
                }
                html += '</div>';
            }
            
            reviewContent.innerHTML = html;
        }
        updateNavigation();
