//*********** jquery is used here****************

// signup Form submission on user portal
$("form[name=signup_form]").submit(function (e) {
    e.preventDefault();

    var $form = $(this);
    var $error = $form.find(".error");
    var data = $form.serialize();

    $.ajax({
        url: "/users/signup",
        type: "POST",
        data: data,
        dataType: "json",
        success: function (resp) {
            window.location.href = "/user_dashboard"
            console.log(resp);
        },
        //Handling error
        error: function (resp) {
            console.log(resp);
            $error.text(resp.responseJSON.error).removeClass("error--hidden")
        }
    })
})

// ***************************************End of signup********************************************************
// Login Form submission on user portal
$("form[name=login_form]").submit(function (e) {
    e.preventDefault();

    var $form = $(this);
    var $error = $form.find(".error");
    var data = $form.serialize();

    $.ajax({
        url: "/users/login",
        type: "POST",
        data: data,
        dataType: "json",
        success: function (resp) {
            window.location.href = "/user_dashboard"
        },
        //Handling error
        error: function (resp) {
            console.log(resp);
            $error.text(resp.responseJSON.error).removeClass("error--hidden")
        }
    })
})

// ***************************************End of Login********************************************************



// Submit users job request



$("form[name=job_form]").on('submit', function (e) {
    e.preventDefault();

    // Show loading spinner
    $('#loading').show();
    $('.form-content').hide();

    // Prepare form data object
    let formData = {
        // User Details (including disabled fields)
        user_name: $('#userName').val(),
        emp_id: $('#empId').val(),
        division: $('#division').val(),
        email: $('#email').val(),
        location: $('input[name="location"]').val(),
        project_no: $('input[name="project_no"]').val(),

        // Machine Details
        machine_type: $('select[name="machine_type"]').val(),
        model_no: $('input[name="model_no"]').val(),
        serial_no: $('input[name="serial_no"]').val(),
        part_no: $('input[name="part_no"]').val(),
        pir_no: $('input[name="pir_no"]').val(),
        operating_system: $('select[name="operating_system"]').val(),

        // Services (initialize as empty array)
        services: []
    };

    // Handle "Other" machine type if selected
    if (formData.machine_type === 'other') {
        formData.other_machine = $('input[name="other_machine"]').val();
    }

    // Handle "Other" OS if selected
    if (formData.operating_system === 'other') {
        formData.other_os = $('input[name="other_os"]').val();
    }

    // Collect all checked services
    $('input[name="services"]:checked').each(function () {
        formData.services.push($(this).val());
    });

    // Additional service-specific fields
    formData.email_id = $('input[name="email_id"]').val();
    formData.document_type = $('input[name="document_type"]').val();
    formData.network_type = $('select[name="network_type"]').val();
    formData.additional_services = $('textarea[name="additional_services"]').val();
    // Submit via AJAX
    $.ajax({
        type: 'POST',
        url: '/submit_job',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            $('#loading').hide();
            if (response.success) {
                // Show success and countdown
                let countdown = 5;
                $('#countdown-timer').html(
                    `✅ Request submitted successfully! Redirecting in <span id="countdown">${countdown}</span> seconds...`
                ).show();

                let interval = setInterval(function () {
                    countdown--;
                    $('#countdown').text(countdown);
                    if (countdown <= 0) {
                        clearInterval(interval);
                        window.location.href = '/user_dashboard';
                    }
                }, 1000);
            } else {
                alert('Error: ' + response.message);
                $('.form-content').show();
            }
        },
        error: function (xhr) {
            $('#loading').hide();
            $('.form-content').show();
            let errorMsg = xhr.responseJSON && xhr.responseJSON.message
                ? xhr.responseJSON.message
                : 'Server error occurred';
            alert('Submission failed: ' + errorMsg);
        }
    });
});



// *************************************End of submission*******************************************



// Admin 








// signup Form submission on admin portal
$("form[name=admin_signup_form]").submit(function (e) {
    e.preventDefault();

    var $form = $(this);
    var $error = $form.find(".error");
    var data = $form.serialize();

    $.ajax({
        url: "/admin_signup",
        type: "POST",
        data: data,
        dataType: "json",
        success: function (resp) {
            window.location.href = "/admin_dashboard"
            console.log(resp);
        },
        //Handling error
        error: function (resp) {
            console.log(resp);
            $error.text(resp.responseJSON.error).removeClass("error--hidden")
        }
    })
})

// ***************************************End of signup********************************************************
// Login Form submission on user portal
$("form[name=admin_login_form]").submit(function (e) {
    e.preventDefault();

    var $form = $(this);
    var $error = $form.find(".error");
    var data = $form.serialize();

    $.ajax({
        url: "/admin_login",
        type: "POST",
        data: data,
        dataType: "json",
        success: function (resp) {
            window.location.href = "/admin_dashboard"
            console.log(resp);
        },
        //Handling error
        error: function (resp) {
            console.log(resp);
            $error.text(resp.responseJSON.error).removeClass("error--hidden")
        }
    })
})

// ***************************************End of Login********************************************************




// Officer login**********************************



$("form[name=officer_login_form]").submit(function (e) {
    e.preventDefault();

    var $form = $(this);
    var $error = $form.find(".error");
    var data = $form.serialize();

    $.ajax({
        url: "/officer_login",
        type: "POST",
        data: data,
        dataType: "json",
        success: function (resp) {
            console.log(resp)
            window.location.href = "/officer_dashboard"
        },
        //Handling error
        error: function (resp) {
            console.log(resp);
            $error.text(resp.responseJSON.error).removeClass("error--hidden")
        }
    })
})



