#!/usr/bin/python3
import cgi
import json
import psycopg2
from datetime import datetime, timedelta
try:
    date_object = datetime.today()
    date_string = date_object.strftime("%Y-%m-%d")
    arguments = cgi.FieldStorage()
    uuid = arguments.getvalue("id")
    liter = arguments.getvalue("liter")
    comment = arguments.getvalue("comment")
    conn = psycopg2.connect("host=yourHost dbname=yourDB user=yourUser password=yourPassword")
    cur = conn.cursor()
    cur.execute("UPDATE trees SET watered_at = %s, watered = %s,comment = %s WHERE tree_id = %s", (date_string, liter, comment ,uuid))
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
