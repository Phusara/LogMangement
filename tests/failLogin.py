import requests
import time

# --- Configuration ---
# !!! IMPORTANT: Change this to the full URL of your server
BASE_URL = "http://localhost:8000" 
LOGIN_URL = BASE_URL + "/login"

# --- Test Data ---
# This data will be sent as 'application/x-www-form-urlencoded'
# which is standard for most web form logins.
login_data = {
    "username": "demoA",
    "password": "thisisawrongpassword123"
}

# --- Test Script ---
print(f"--- Starting Login Failure Test ---")
print(f"Target URL: {LOGIN_URL}")
print(f"Username: {login_data['username']}")
print("-------------------------------------")

# Loop 6 times
for i in range(6):
    attempt_num = i + 1
    print(f"\n[Attempt {attempt_num} of 6]")
    
    try:
        # We use the 'data=' parameter to send the payload as
        # 'application/x-www-form-urlencoded', just like a real login form.
        #
        # If your API expects JSON, you would use 'json=login_data' instead.
        response = requests.post(LOGIN_URL, json=login_data)
        
        # Print the server's response
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")

        # Check for expected failure codes
        if response.status_code in [401, 403, 400]:
            print("Result: Success (Received expected login failure)")
        else:
            print(f"Warning: Received an unexpected status code {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print(f"Error: Connection refused. Is the server running at {BASE_URL}?")
        print("Test stopped.")
        break # Stop the test if the server isn't running
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

    # Wait for 1 second before the next attempt
    if attempt_num < 6:
        time.sleep(1)

print("\n--- Test Finished ---")