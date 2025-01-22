#!/usr/bin/python3
import cgi
import json
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os 

load_dotenv('/home/python_env/config.env')

try:
    date_object = datetime.today()
    date_string = date_object.strftime("%Y-%m-%d")
    arguments = cgi.FieldStorage()
    uuid = arguments.getvalue("id")
    liter = arguments.getvalue("liter")
    comment = arguments.getvalue("comment")
    conn = psycopg2.connect(
       user = os.getenv("DATABASE_USERNAME"),
       password = os.getenv("DATABASE_PASSWORD"),
       host = os.getenv("DATABASE_IP"),
       port = os.getenv("DATABASE_PORT"),
       database = os.getenv("DATABASE_NAME")
    )
    cur = conn.cursor()
    cur.execute("UPDATE trees_3857 SET watered_at = %s, watered = %s,comment = %s WHERE tree_id = %s", (date_string, liter, comment ,uuid))
    conn.commit()
    cur.close()
    conn.close()
    print ("Content-type: application/json")
    print () 
    print ('{"request" : "done"}')
except Exception as error:
    print ("Content-type: application/json")
    print () 
    print ('{"request" : "error"}')
