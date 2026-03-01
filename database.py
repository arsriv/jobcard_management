from flask import Flask
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

# Connect to local MongoDB server
client = os.getenv("MONGO_URI")

# jobcard_db created
db = client["jobcard_db"]