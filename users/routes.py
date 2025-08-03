from flask import Flask,Blueprint
# importing class User
from users.models import User

users_bp = Blueprint('users', __name__, url_prefix='/users')
job_request_bp=Blueprint('job_requests',__name__, url_prefix='/job_requests')

@users_bp.route('/signup',methods=['POST'])
def signup():
    return User().signup()

@users_bp.route('/signout')
def signout():
    return User().signout()

@users_bp.route('/login',methods=['POST'])
def login():
    return User().login()




