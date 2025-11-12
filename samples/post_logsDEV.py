import requests
import json
import random
from datetime import datetime, timedelta

# The endpoint to send logs to

URL = "http://localhost:8000/routerlog"

# Log templates
LOG_TEMPLATES = [
    {
      "source": "api",
      "event_type": "app_login_failed",
      "user": "alice",
      "ip": "203.0.113.7",
      "reason": "wrong_password",
    },
    {
      "source": "crowdstrike",
      "event_type": "malware_detected",
      "host": "WIN10-01",
      "process": "powershell.exe",
      "severity": 8,
      "sha256": "abc...",
      "action": "quarantine",
    },
    {
      "source": "aws",
      "cloud": {
        "service": "iam",
        "account_id": "123456789012",
        "region": "ap-southeast-1"
      },
      "event_type": "CreateUser",
      "user": "admin",
      "raw": {
        "eventName": "CreateUser",
        "requestParameters": {
          "userName": "temp-user"
        }
      }
    },
    {
      "source": "m365",
      "event_type": "UserLoggedIn",
      "user": "bob@demo.local",
      "ip": "198.51.100.23",
      "status": "Success",
      "workload": "Exchange",
    },
    {
      "source": "ad",
      "event_id": 4625,
      "event_type": "LogonFailed",
      "user": "demo\\leve",
      "host": "DC01",
      "ip": "203.0.113.77",
      "logon_type": 3,
    }
]

TENANTS = ['demoA', 'demoB','demoC','demoD']
USERS = ['alice', 'bob', 'charlie', 'david', 'eve', 'frank']
IPS = [f"203.0.113.{i}" for i in range(1, 255)]
HOSTS = [f"WIN10-0{i}" for i in range(1, 5)] + [f"DC0{i}" for i in range(1, 3)]

def generate_log():
    """Generates a random log from the templates."""
    log_template = random.choice(LOG_TEMPLATES).copy()
    
    log = {}
    log["tenant"] = random.choice(TENANTS)
    log.update(log_template)
    # Pick a random timestamp in the past (not future). Up to `max_days` days back.
    # Change `max_days` to control the range (default 30 days).
    max_days = 30
    max_seconds = max_days * 24 * 3600
    offset = random.randint(0, max_seconds)
    log["@timestamp"] = (datetime.utcnow() - timedelta(seconds=offset)).isoformat() + "Z"
    
    if "user" in log:
        log["user"] = random.choice(USERS)
    if "ip" in log:
        log["ip"] = random.choice(IPS)
    if "host" in log:
        log["host"] = random.choice(HOSTS)
        
    return log

def send_log(log_data):
    """Sends a single log to the endpoint."""
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(URL, data=json.dumps(log_data), headers=headers, timeout=5)
        print(f"Sent log for tenant {log_data['tenant']}. Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response body: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Error sending log for tenant {log_data['tenant']}: {e}")

if __name__ == "__main__":
    for i in range(50):
        log = generate_log()
        send_log(log)
        print(f"--- Log {i+1}/50 ---")
