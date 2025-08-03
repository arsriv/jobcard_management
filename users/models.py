from flask import Flask,redirect,session,jsonify,request
from passlib.hash import pbkdf2_sha256
from database import db
class User:

    def start_session(self,user):
        session['logged_in']=True
        session['user']=user
        return jsonify(user),200


    def signup(self):

        # create user object
        user={
            "name":request.form.get('name'),
            "_id":request.form.get('ID'),
            "email":request.form.get('email'),
            "group":request.form.get('group'),
            "password":request.form.get('password'),

        }
        # Encrypt the password
        user['password']=pbkdf2_sha256.encrypt(user['password'])

        # If employee id already exists
        if db.users.find_one({"_id":user['_id']}):
            return jsonify({"error":"A user with this Employee ID already Exists!"}),400
        # If employee id already exists
        if db.users.find_one({"email":user['email']}):
            return jsonify({"error":"A user with this Email already Exists!"}),400
        
        # Start the session and signup the employee
        if db.users.insert_one(user):
            return self.start_session(user)
        
        # default 
        return jsonify({"error":"Signup Failed"}), 400
    
    def signout(self):
        session.clear()
        return redirect('/user')
    
    def  login(self):
        user=db.users.find_one({
            "email":request.form.get('login_email')
        })

        if user and pbkdf2_sha256.verify(request.form.get('login_password'),user['password']):
            return self.start_session(user)
        return jsonify({"error":"Invalid Login Credentials"}),401
