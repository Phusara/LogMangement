from datetime import datetime
import requests


BASE_URL = "https://internlogmange.space/api/routerlog"

def main():
    # Register users
    users_data = [
        {"username": "demoA", "role": "tenant", "password": "secure123"},
        {"username": "demoB", "role": "tenant", "password": "secure123"},
        {"username": "demoC", "role": "tenant", "password": "secure123"},
        {"username": "demoD", "role": "tenant", "password": "secure123"},
        {"username": "demoE", "role": "admin", "password": "secure123"},
    ]

    for user in users_data:
        response = requests.post(f"{BASE_URL}/register", json={
            "username": user["username"],
            "password": user["password"],
            "role": user["role"]
        })
        print(f"Register {user['username']}: {response.status_code} - {response.json()}")
        
if __name__ == "__main__":
    main()
