from flask import Flask, redirect, flash, render_template, request, session, jsonify
from functools import wraps
from bson.objectid import ObjectId
from database import db
from pymongo import MongoClient
from datetime import datetime
import random
import smtplib
from flask_cors import CORS
from admins.models import Admin
from officers.models import Officer
from users.routes import users_bp
from email.mime.text import MIMEText
from passlib.hash import pbkdf2_sha256
import string

app = Flask(__name__)
CORS(app)
app.secret_key = 'your_secret_key_here'

# Register blueprints
app.register_blueprint(users_bp)

# Email configuration
EMAIL_ADDRESS = 'regerfortnite@gmail.com'
EMAIL_PASSWORD = 'yacf gkvx jxwg fvlt'  # Use App Password

# Database collections
job_requests = db.service_requests
users = db['users']
officers = db['officers']
# =============================================
# Helper Functions
# =============================================
def login_required(redirect_to='/'):
    def decorator(f):
        @wraps(f)
        def wrap(*args, **kwargs):
            if 'logged_in' in session:
                return f(*args, **kwargs)
            else:
                return redirect(redirect_to)
        return wrap
    return decorator

def generate_request_id():
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S") 
    rand_num = random.randint(100, 999) 
    return f"REQ-{timestamp}-{rand_num}"

def generate_random_password(length=10):
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(chars) for _ in range(length))

def send_email(recipient, subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = recipient

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.starttls()
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)
    except Exception as e:
        print("Email sending failed:", e)

# =============================================
# Main Routes
# =============================================
@app.route("/")
def home():
    return render_template('home.html')

@app.route("/admin")
def admin():
    return render_template("admin.html")

@app.route("/user")
def user():
    return render_template("user_panel.html")

@app.route("/user/form")
def user_form():
    return render_template("user_form.html")

@app.route("/officer")
def officer():
    return render_template("officer_panel.html")

# =============================================
# Dashboard Routes
# =============================================
@app.route("/user_dashboard")
@login_required(redirect_to='/user')
def user_dashboard():
    return render_template("user_dashboard.html")

@app.route("/admin_dashboard")
@login_required(redirect_to='/admin')
def admin_dashboard():
    return render_template("admin_dashboard.html")

@app.route("/officer_dashboard")
@login_required(redirect_to='/officer')
def officer_dashboard():
    return render_template("officer_dashboard.html")

# =============================================
# Authentication Routes
# =============================================
@app.route('/admin_login', methods=['POST'])
def login():
    return Admin().login()

@app.route('/admin_signup', methods=['POST'])
def signup():
    return Admin().signup()

@app.route('/admin_signout')
def signout():
    return Admin().signout()

@app.route('/officer_login', methods=['POST'])
def officer_login():
    return Officer().login()

@app.route('/officer_signout')
def officer_signout():
    return Officer().signout()

# =============================================
# Job Request Routes
# =============================================
@app.route('/submit_job', methods=['POST'])
@login_required(redirect_to='/user')
def submit_job():
    try:
        data = request.get_json()
        
        # Required fields validation
        required_fields = ['user_name', 'emp_id', 'division', 'email', 
                         'location', 'project_no', 'machine_type',
                         'model_no', 'serial_no', 'part_no', 'pir_no']
        
        missing = [field for field in required_fields if field not in data]
        if missing:
            return jsonify({
                'success': False,
                'message': f'Missing required fields: {", ".join(missing)}'
            }), 400
        
        # Prepare complete document with defaults
        job_doc = {
            **data,
            '_id': generate_request_id(),
            'status': 'pending',
            'assignedTo': 'Not Assigned',
            'submission_date': datetime.now(),
            'last_updated': datetime.now()
        }
        
        # Insert into MongoDB
        result = job_requests.insert_one(job_doc)
        
        return jsonify({
            'success': True,
            'job_id': str(result.inserted_id),
            'message': 'Service request submitted successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
@app.route('/get_user_jobs')
@login_required(redirect_to='/user')
def get_user_jobs():
    try:
        user_jobs = list(job_requests.find({"emp_id": session['user']['_id']},{}).sort("submission_date", -1))
        
        for job in user_jobs:
            job['_id'] = str(job['_id'])

            if 'submission_date' in job and isinstance(job['submission_date'], datetime):
                job['submission_date'] = job['submission_date'].isoformat()

            if 'last_updated' in job and isinstance(job['last_updated'], datetime):
                job['last_updated'] = job['last_updated'].isoformat()
        return jsonify({
            'success': True,
            'jobs': user_jobs
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500




@app.route('/get_job/<job_id>')
@login_required(redirect_to='/user')
def get_job(job_id):
    try:
        job = job_requests.find_one({'_id': job_id, 'emp_id': session['user']['_id']})
        if job:
            job['_id'] = str(job['_id'])
            return jsonify(job)
        return jsonify({'error': 'Job not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500










@app.route('/get_officer_job/<job_id>')
@login_required(redirect_to='/officer')
def get_officer_job(job_id):
    try:
        job = job_requests.find_one({'_id': job_id, 'assignedTo': session['officer']['name']})
        if job:
            job['_id'] = str(job['_id'])
            return jsonify(job)
        return jsonify({'error': 'Job not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/get_officer_jobs')
@login_required(redirect_to='/officer')
# from datetime import datetime
def get_officer_jobs():
    try:
        officer_name = session['officer']['name']

        officer_jobs = list(job_requests.find(
            {"assignedTo": officer_name}, {}
        ).sort("submission_date", -1))

        for job in officer_jobs:
            job['_id'] = str(job['_id'])

            # Convert datetime to ISO if it's datetime, else leave it
            submission_date = job.get('submission_date')
            if isinstance(submission_date, datetime):
                job['submission_date'] = submission_date.isoformat()

            last_updated = job.get('last_updated')
            if isinstance(last_updated, datetime):
                job['last_updated'] = last_updated.isoformat()

        return jsonify({'success': True, 'jobs': officer_jobs})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500










# =============================================
# API Endpoints
# =============================================
@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    """Get all job requests"""
    jobs = list(job_requests.find())
    for job in jobs:
        job['_id'] = str(job['_id'])
    return jsonify(jobs)

@app.route('/api/jobs', methods=['POST'])
def create_job():
    """Create new job request"""
    try:
        job_data = request.get_json()
        
        new_job = {
            "user_name": job_data.get('user_name'),
            "emp_id": job_data.get('emp_id'),
            "division": job_data.get('division'),
            "machine_type": job_data.get('machine_type'),
            "services": job_data.get('services', []),
            "status": "pending",
            "assignedTo": "Not Assigned",
            "priority": job_data.get('priority', 'medium'),
            "submission_date": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }
        
        result = job_requests.insert_one(new_job)
        new_job['_id'] = str(result.inserted_id)
        return jsonify(new_job), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/jobs/<job_id>', methods=['PUT'])
def update_job(job_id):
    """Update job request"""
    try:
        update_data = request.get_json()
        update_data['last_updated'] = datetime.now().isoformat()
        
        result = job_requests.update_one(
            {'_id': job_id},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Job not found"}), 404
            
        updated_job = job_requests.find_one({'_id': job_id})
        updated_job['_id'] = str(updated_job['_id'])
        return jsonify(updated_job)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/jobs/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete job request"""
    try:
        result = job_requests.delete_one({'_id': ObjectId(job_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Job not found"}), 404
        return jsonify({"message": "Job deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users with calculated statistics"""
    pipeline = [
        {
            "$group": {
                "_id": "$emp_id",
                "user_name": {"$first": "$user_name"},
                "division": {"$first": "$division"},
                "totalJobs": {"$sum": 1},
                "activeJobs": {
                    "$sum": {
                        "$cond": [{"$ne": ["$status", "completed"]}, 1, 0]
                    }
                },
                "lastActivity": {"$max": "$last_updated"}
            }
        },
        {
            "$project": {
                "emp_id": "$_id",
                "user_name": 1,
                "division": 1,
                "totalJobs": 1,
                "activeJobs": 1,
                "lastActivity": 1,
                "_id": 0
            }
        }
    ]
    
    user_stats = list(job_requests.aggregate(pipeline))
    return jsonify(user_stats)

@app.route('/api/users/<emp_id>', methods=['PUT'])
def update_user(emp_id):
    """Update user information"""
    try:
        update_data = request.get_json()
        new_emp_id = update_data.get('emp_id', emp_id)
        
        result = job_requests.update_many(
            {'emp_id': emp_id},
            {
                '$set': {
                    'emp_id': new_emp_id,
                    'user_name': update_data.get('user_name', '$user_name'),
                    'division': update_data.get('division', '$division'),
                    'last_updated': datetime.now().isoformat()
                }
            }
        )
        
        return jsonify({
            "message": "User updated successfully",
            "modified_jobs": result.modified_count
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/users/<emp_id>', methods=['DELETE'])
def delete_user(emp_id):
    """Delete user and all their job requests"""
    try:
        result = job_requests.delete_many({'emp_id': emp_id})
        return jsonify({
            "message": "User and related jobs deleted successfully",
            "deleted_jobs": result.deleted_count
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/officers', methods=['GET'])
def get_officers():
    """Get all officers with calculated statistics"""
    officer_list = list(officers.find())
    
    for officer in officer_list:
        assigned_jobs = list(job_requests.find({'assignedTo': officer['name']}))
        officer['assignedJobs'] = len(assigned_jobs)
        officer['completedJobs'] = len([j for j in assigned_jobs if j.get('status') == 'completed'])
        officer['activeJobs'] = len([j for j in assigned_jobs if j.get('status') != 'completed'])
        officer['_id'] = str(officer['_id'])
    
    return jsonify(officer_list)

@app.route('/api/officers', methods=['POST'])
def create_officer():
    """Create new officer"""
    try:
        officer_data = request.get_json()
        
        new_officer = {
            "name": officer_data.get('name'),
            "specialization": officer_data.get('specialization'),
            "assignedJobs": 0,
            "completedJobs": 0,
            "activeJobs": 0
        }
        
        result = officers.insert_one(new_officer)
        new_officer['_id'] = str(result.inserted_id)
        return jsonify(new_officer), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/officers/<officer_id>', methods=['PUT'])
def update_officer(officer_id):
    """Update officer information"""
    try:
        update_data = request.get_json()
        officer = officers.find_one({'_id': ObjectId(officer_id)})
        if not officer:
            return jsonify({"error": "Officer not found"}), 404
        
        old_name = officer['name']
        new_name = update_data.get('name', old_name)
        
        result = officers.update_one(
            {'_id': ObjectId(officer_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Officer not found"}), 404
            
        if old_name != new_name:
            job_requests.update_many(
                {'assignedTo': old_name},
                {
                    '$set': {
                        'assignedTo': new_name,
                        'last_updated': datetime.now().isoformat()
                    }
                }
            )
        
        updated_officer = officers.find_one({'_id': ObjectId(officer_id)})
        updated_officer['_id'] = str(updated_officer['_id'])
        return jsonify(updated_officer)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/officers/<officer_id>', methods=['DELETE'])
def delete_officer(officer_id):
    """Delete officer and unassign their jobs"""
    try:
        officer = officers.find_one({'_id': ObjectId(officer_id)})
        if not officer:
            return jsonify({"error": "Officer not found"}), 404
        
        job_requests.update_many(
            {'assignedTo': officer['name']},
            {
                '$set': {
                    'assignedTo': 'Not Assigned',
                    'status': 'pending',
                    'last_updated': datetime.now().isoformat()
                }
            }
        )
        
        result = officers.delete_one({'_id': ObjectId(officer_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Officer not found"}), 404
            
        return jsonify({"message": "Officer deleted successfully"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/stats', methods=['GET'])
def get_statistics():
    """Get dashboard statistics"""
    stats = {
        "totalJobs": job_requests.count_documents({}),
        "pendingJobs": job_requests.count_documents({"status": "pending"}),
        "processingJobs": job_requests.count_documents({"status": "processing"}),
        "completedJobs": job_requests.count_documents({"status": "completed"}),
        "totalUsers": len(job_requests.distinct("emp_id")),
        "totalOfficers": officers.count_documents({})
    }
    return jsonify(stats)

# =============================================
# Password Reset Routes
# =============================================
@app.route('/forgot-password')
def forgot_password():
    return render_template('forgot_password.html')

@app.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    email = data.get("email")

    user = users.find_one({"email": email})  
    if not user:
        return jsonify({"error": "Email not registered"}), 400

    otp = str(random.randint(100000, 999999))
    session['otp'] = otp
    session['email'] = email

    msg = MIMEText(f'Dear {user["name"]},\n\nYour OTP for password reset is: {otp}\n\nPlease use this to proceed with resetting your password.\n\n- Admin Team')
    msg['Subject'] = 'OTP for User Password Reset'
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "OTP sent to your email."})

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    input_otp = data.get("otp")

    if input_otp == session.get("otp"):
        return jsonify({"message": "OTP verified."})
    return jsonify({"error": "Invalid OTP"}), 400

@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    new_pass = data.get("new_password")
    email = session.get("email")

    user = users.find_one({"email": email})
    if user:
        hashed = pbkdf2_sha256.hash(new_pass)
        users.update_one({"email": email}, {"$set": {"password": hashed}})
        session.clear()
        return jsonify({"message": "Password reset successful."})
    
    return jsonify({"error": "Something went wrong."}), 400

# Officer Password Reset
@app.route('/officer/forgot-password')
def officer_forgot_password():
    return render_template('officer_forgot_password.html')

@app.route('/officer/send-otp', methods=['POST'])
def officer_send_otp():
    data = request.json
    email = data.get("email")

    officer = officers.find_one({"email_id": email})
    if not officer:
        return jsonify({"error": "Email not registered"}), 400

    otp = str(random.randint(100000, 999999))
    session['officer_otp'] = otp
    session['officer_email'] = email

    msg = MIMEText(f'Dear {officer["name"]},\n\nYour OTP for password reset is: {otp}\n\nPlease use this to proceed with resetting your password.\n\n- Admin Team')
    msg['Subject'] = 'OTP for Officer Password Reset'
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "OTP sent to your email."})

@app.route('/officer/verify-otp', methods=['POST'])
def officer_verify_otp():
    data = request.json
    input_otp = data.get("otp")

    if input_otp == session.get("officer_otp"):
        return jsonify({"message": "OTP verified."})
    return jsonify({"error": "Invalid OTP"}), 400

@app.route('/officer/reset-password', methods=['POST'])
def officer_reset_password():
    data = request.json
    new_pass = data.get("new_password")
    email = session.get("officer_email")

    officer = officers.find_one({"email_id": email})
    if officer:
        hashed = pbkdf2_sha256.hash(new_pass)
        officers.update_one({"email_id": email}, {"$set": {"password": hashed}})
        session.pop('officer_email', None)
        session.pop('officer_otp', None)
        return jsonify({"message": "Password reset successful."})
    
    return jsonify({"error": "Something went wrong."}), 400

# =============================================
# Officer Management
# =============================================
@app.route("/new", methods=["GET", "POST"])
def add_officer():
    if request.method == "POST":
        officer_id = request.form['_id']
        name = request.form['name']
        group = request.form['group']
        email = request.form['email_id']

        if officers.find_one({"email_id":email}):
            flash("Officer with this Email Id already exists.", "danger")
            return render_template("add_officer.html")

        password = generate_random_password()
        hashed_password = pbkdf2_sha256.hash(password)

        officer = {
            "_id": officer_id,
            "name": name,
            "group": group,
            "email_id": email,
            "password": hashed_password,
            "role":"user"
        }
        officers.insert_one(officer)

        email_body = f"""
        Hello {name},

        You have been added as an officer in the CRRI JobCard system.

        Your login Mail ID: {email}
        Your password: {password}

        Please change your password after logging in
        by clicking on forgot password.

        Regards,
        Admin
        """
        send_email(email, "Your Officer Credentials", email_body)
        flash("Officer added successfully and credentials sent via email.", "success")
        
    return render_template("add_officer.html")

# =============================================
# Error Handlers
# =============================================
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)