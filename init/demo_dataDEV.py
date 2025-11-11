from datetime import datetime
import requests


BASE_URL = "http://localhost:8000"


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

    # Ingest logs
    logs_data = [
        {
            "source": "firewall",
            "vendor": "Palo Alto",
            "product": "PanOS",
            "source_ip": "192.168.1.10",
            "source_port": 54321,
            "dest_ip": "8.8.8.8",
            "dest_port": 443,
            "protocol": "TCP",
            "rule_name": "Allow Web",
            "host": "pa-firewall-01",
            "@timestamp": datetime(2025, 10, 1, 8, 30, 15),
            "tenant": "demoA",
            "event_type": "traffic",
            "event_subtype": "allow",
            "severity": 2,
            "action": "allowed",
            "raw": {"rule": "Allow Web", "app": "ssl"},
            "tags": ["firewall", "web", "tenant_a"]
        },
        {
            "source": "ad",
            "user": "jane.doe",
            "ip": "10.0.5.20",
            "host": "dc-server-01",
            "event_id": 4624,
            "@timestamp": datetime(2025, 10, 1, 9, 15, 0),
            "tenant": "demoB",
            "event_type": "login",
            "event_subtype": "login_success",
            "severity": 3,
            "action": "logged",
            "raw": {"event_id": 4624, "domain": "TENANTB_CORP"},
            "tags": ["server", "login", "windows", "tenant_b"]
        },
        {
            "source": "aws",
            "user": "aws-service-role",
            "service": "S3",
            "account_id": "111122223333",
            "region": "us-east-1",
            "@timestamp": datetime(2025, 10, 2, 10, 5, 10),
            "tenant": "demoA",
            "event_type": "audit",
            "event_subtype": "get_object",
            "severity": 1,
            "action": "logged",
            "raw": {"bucketName": "tenant-a-files", "key": "reports/report.pdf"},
            "tags": ["cloud", "aws", "s3", "tenant_a"]
        },
        {
            "source": "api",
            "user": "n/a",
            "ip": "198.51.100.10",
            "url": "/admin.php",
            "@timestamp": datetime(2025, 10, 2, 11, 12, 45),
            "tenant": "demoB",
            "event_type": "http",
            "severity": 1,
            "action": "logged",
            "raw": {"user_agent": "Mozilla/5.0...", "status_code": 404, "http_method": "GET"},
            "tags": ["server", "web", "nginx", "tenant_b"]
        },
        {
            "source": "firewall",
            "vendor": "Palo Alto",
            "product": "PanOS",
            "source_ip": "192.168.1.50",
            "source_port": 12345,
            "dest_ip": "1.1.1.1",
            "dest_port": 53,
            "protocol": "UDP",
            "rule_name": "Block DNS",
            "host": "pa-firewall-01",
            "@timestamp": datetime(2025, 10, 3, 11, 30, 0),
            "tenant": "demoA",
            "event_type": "traffic",
            "event_subtype": "deny",
            "severity": 4,
            "action": "denied",
            "raw": {"rule": "Block DNS", "app": "dns"},
            "tags": ["firewall", "dns", "blocked", "tenant_a"]
        },
        {
            "source": "ad",
            "user": "administrator",
            "ip": "10.0.5.21",
            "host": "dc-server-01",
            "event_id": 4625,
            "@timestamp": datetime(2025, 10, 3, 12, 0, 5),
            "tenant": "demoB",
            "event_type": "login",
            "event_subtype": "login_failure",
            "severity": 4,
            "action": "logged",
            "raw": {"event_id": 4625, "reason": "Bad password"},
            "tags": ["server", "login", "windows", "tenant_b"]
        },
        {
            "source": "api",
            "user": "n/a",
            "ip": "192.168.1.20",
            "url": "/api/v1/data",
            "@timestamp": datetime(2025, 10, 4, 13, 10, 20),
            "tenant": "demoA",
            "event_type": "http",
            "severity": 2,
            "action": "logged",
            "raw": {"user_agent": "InternalApp/1.0", "status_code": 200, "http_method": "GET"},
            "tags": ["server", "web", "apache", "tenant_a"]
        },
        {
            "source": "aws",
            "user": "admin.user",
            "service": "EC2",
            "account_id": "444455556666",
            "region": "us-west-2",
            "@timestamp": datetime(2025, 10, 4, 14, 0, 0),
            "tenant": "demoB",
            "event_type": "audit",
            "event_subtype": "start_instance",
            "severity": 3,
            "action": "logged",
            "raw": {"instanceId": "i-0abcdef123456789"},
            "tags": ["cloud", "aws", "ec2", "tenant_b"]
        },
        {
            "source": "api",
            "user": "n/a",
            "ip": "192.168.1.22",
            "url": "/api/v1/submit",
            "@timestamp": datetime(2025, 10, 5, 15, 5, 1),
            "tenant": "demoA",
            "event_type": "http",
            "severity": 5,
            "action": "logged",
            "raw": {"error": "Internal Server Error", "status_code": 500, "http_method": "POST"},
            "tags": ["server", "web", "apache", "error", "tenant_a"]
        },
        {
            "source": "firewall",
            "vendor": "Cisco",
            "product": "ASA",
            "source_ip": "10.0.1.50",
            "source_port": 60001,
            "dest_ip": "10.0.10.5",
            "dest_port": 443,
            "protocol": "TCP",
            "rule_name": "Allow Internal Web",
            "host": "cisco-asa-01",
            "@timestamp": datetime(2025, 10, 5, 16, 45, 0),
            "tenant": "demoB",
            "event_type": "traffic",
            "event_subtype": "allow",
            "severity": 2,
            "action": "allowed",
            "raw": {"rule": "Allow Internal Web"},
            "tags": ["firewall", "web", "tenant_b"]
        }
    ]

    response = requests.post(f"{BASE_URL}/routerlog", json=logs_data)
    print(f"Ingest logs: {response.status_code} - {response.json()}")


if __name__ == "__main__":
    main()
