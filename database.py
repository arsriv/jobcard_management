from flask import Flask
from pymongo import MongoClient

# Connect to local MongoDB server
client = MongoClient("mongodb://localhost:27017/")

# jobcard_db created
db = client["jobcard_db"]