from flask import Flask,redirect,session,jsonify,request
from passlib.hash import pbkdf2_sha256
from database import db
class Admin:

    def start_session(self,admin):
        session['logged_in']=True
        session['admin']=admin
        return jsonify(admin),200


    def signup(self):

        # create admin object
        admin={
            "name":request.form.get('name'),
            "_id":request.form.get('ID'),
            "email":request.form.get('email'),
            "group":request.form.get('group'),
            "password":request.form.get('password'),

        }
        # Encrypt the password
        admin['password']=pbkdf2_sha256.encrypt(admin['password'])

        # If employee id already exists
        if db.admins.find_one({"_id":admin['_id']}):
            return jsonify({"error":"A admin with this Employee ID already Exists!"}),400
        # If employee id already exists
        if db.admins.find_one({"email":admin['email']}):
            return jsonify({"error":"A admin with this Email already Exists!"}),400
        
        # Start the session and signup the employee
        if db.admins.insert_one(admin):
            return self.start_session(admin)
        
        # default 
        return jsonify({"error":"Signup Failed"}), 400
    
    def signout(self):
        session.clear()
        return redirect('/admin')
    
    def  login(self):
        admin=db.admins.find_one({
            "email":request.form.get('login_email')
        })

        if admin and pbkdf2_sha256.verify(request.form.get('login_password'),admin['password']):
            return self.start_session(admin)
        return jsonify({"error":"Invalid Login Credentials"}),401
