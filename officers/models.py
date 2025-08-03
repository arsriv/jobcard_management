from flask import Flask,redirect,session,jsonify,request
from passlib.hash import pbkdf2_sha256
from database import db
class Officer:

    def start_session(self,officer):
        session['logged_in']=True
        session['officer']=officer
        return jsonify(officer),200

    def signout(self):
        session.clear()
        return redirect('/officer')
    
    def  login(self):
        officer=db.officers.find_one({
            "email_id":request.form.get('login_email')
        })

        if officer and pbkdf2_sha256.verify(request.form.get('login_password'),officer['password']):
            return self.start_session(officer)
        return jsonify({"error":"Invalid Login Credentials"}),401
