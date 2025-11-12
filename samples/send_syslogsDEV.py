import socket
import random
import time
from datetime import datetime, timedelta

# --- Configuration ---

UDP_IP = "127.0.0.1"  # Use localhost for testing
UDP_PORT_LINK = 514      # Port for link messages
UDP_PORT_FIREWALL = 515  # Port for firewall messages

TENANTS = ['demoA', 'demoB', 'demoC', 'demoD']

NUMBER_OF_MESSAGES = 50

# --- Helper data for more realistic logs ---
FIREWALL_ACTIONS = ['deny', 'allow', 'permit', 'block']
LINK_EVENTS = ['link-down', 'link-up']
LINK_REASONS = ['carrier-loss', 'negotiation-complete', 'admin-down', 'port-flap']
SOURCE_IPS = ['10.0.1.10', '10.0.2.15', '192.168.1.5', '172.16.30.2']
DEST_IPS = ['8.8.8.8', '1.1.1.1', '104.16.249.249', '9.9.9.9']

# --- Helper functions to generate random log messages ---

def get_current_timestamp(max_days: int = 30):
    """Generates a syslog-style timestamp in the past (not future).
    e.g., 'Aug 20 13:01:02'. The timestamp is now minus a random offset
    between 0 and `max_days` days.

    Args:
        max_days: maximum number of days in the past to pick from (default 1)
    """
    max_seconds = max_days * 24 * 3600
    offset = random.randint(0, max_seconds)
    past = datetime.now() - timedelta(seconds=offset)
    # %e uses a space for padding single-digit days, matching your example
    return past.strftime('%b %e %H:%M:%S')

def generate_random_mac():
    """Generates a random MAC address."""
    return ":".join([f"{random.randint(0, 255):02x}" for _ in range(6)])

def create_firewall_log(tenant):
    """Creates a random firewall log string based on your template."""
    timestamp = get_current_timestamp()
    priority = "<134>"
    hostname = f"fw{random.randint(1, 4)}"
    action = random.choice(FIREWALL_ACTIONS)
    src = random.choice(SOURCE_IPS)
    dst = random.choice(DEST_IPS)
    spt = random.randint(1024, 65535)
    dpt = random.choice([53, 80, 443, 22])
    proto = random.choice(['udp', 'tcp'])
    
    return f"{priority}{timestamp} {hostname} vendor=demo product=ngfw action={action} src={src} dst={dst} spt={spt} dpt={dpt} proto={proto} msg=Dynamic-Rule policy=Policy-{random.randint(1, 10)} tenant={tenant}"

def create_link_log(tenant):
    """Creates a random link status log string based on your template."""
    timestamp = get_current_timestamp()
    priority = "<190>"
    hostname = f"r{random.randint(1, 5)}"
    iface = f"ge-0/0/{random.randint(0, 4)}"
    event = random.choice(LINK_EVENTS)
    mac = generate_random_mac()
    reason = random.choice(LINK_REASONS)
    
    return f"{priority}{timestamp} {hostname} if={iface} event={event} mac={mac} reason={reason} tenant={tenant}"

# --- Main script ---
if __name__ == "__main__":
    try:
        # Create the UDP socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        print(f"Socket created. Sending {NUMBER_OF_MESSAGES} messages to {UDP_IP}...")

        for i in range(NUMBER_OF_MESSAGES):
            # 1. Pick a random tenant
            tenant = random.choice(TENANTS)
            
            # 2. Randomly choose which log template to use
            if random.choice([True, False]):
                # --- Firewall Log ---
                message = create_firewall_log(tenant)
                port = UDP_PORT_FIREWALL # Use port 515
            else:
                # --- Link Log ---
                message = create_link_log(tenant)
                port = UDP_PORT_LINK     # Use port 514
            
            # 3. Send the message to its assigned port
            sock.sendto(message.encode('utf-8'), (UDP_IP, port))
            print(f"Sent ({i+1}/{NUMBER_OF_MESSAGES}) to port {port}: {message}")
            
            # 4. Wait a very short time to simulate a real log stream
            time.sleep(0.1)  # 0.1 seconds

    except socket.error as e:
        print(f"Error sending message: {e}")
    except KeyboardInterrupt:
        print("\nScript stopped by user.")
    finally:
        # 5. Close the socket when done
        sock.close()
        print(f"\nDone. Socket closed.")
