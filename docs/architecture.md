# System architecture & Techstack

## Overall Architecture
![architecture diagram](https://i.ibb.co/cc2HV2rC/Overall-view.png)

### Data Flow
1. **Syslog Flow (Network/Firewall)**  
   - Logs send as mode UDP with syslog -> Vector will normalize -> Backend -> store in Database

2. **Direct API Flow (Tenant Logs)**  
   - Send direct to API via POST Backend → Send to Vector to Normalize field -> Vector send vai POST api to Backend -> Store in Database

3. **User**  
   - User -> Frontend Register -> Backend get password and hashed -> Store username and hashed password
   - User -> Frontend Login -> Backend check password and send JWT token after password match -> Dashboard
---
## Tech Stack

| Component        | Technology / Tools             |
|-----------------|-------------------------------|
| Frontend UI      | Vue & Tailwind           |
| Backend API      | Python & FastAPI             |
| Syslog Collector & Ingest | Vector                    |
| Database         | Postgresql                     |
| Containerization | Docker + Docker Compose       |
---

## Database & Multi-Tenant
- **Tables**: users, tenants, admin, logs, alerts  

### Access Control Matrix

Role     | Access Level              |
---------|---------------------------|
admin    | Access every logs             |
tenant   | Access their own logs        |


### Tenant Data Isolation
- each tenant has unique `tenant_id`
- Log queries filter with `tenant_id` 
- Admin can view all Tentant's logs
- Tenant can see only their own logs


## Indexes in Database

### Table `logs`
- `idx_timestamp (timestamp)`
- `idx_event_type (event_type)`
- `idx_ip (src_ip)`
- `idx_logs_tenant_id (tenant_id)`

### Table `tenants`
- `idx_tenant (tenant_id)`

## Ports
|Port | Access|
|---|---|
|Port 9000 - 9004 (TCP)| Backend -> Vector  |
|Port 443 (TCP)| Frontend (Https)|
|Port 8000 (TCP) | Backend|
|Port 514  (UDP) | Vector|
|Port 515  (UDP) | Vector|
---

### Security Features
- **JWT token-based authentication:** Users are authenticated using JWT (JSON Web Tokens). The `login_user_service` creates an access token, and the `security.py` file defines the `create_access_token` function using `jose.jwt`.
- **Role-based access control (RBAC):** The system is built for RBAC. The `register_user_service` assigns a `role` (like 'admin' or 'tenant') to each user. This role is then included in the JWT token upon login, which allows the application to check permissions.
- **Secure Password Hashing:** Passwords are not stored in plain text. They are hashed using `bcrypt` via the `hash_password` function and confirmed using `verify_password`.
- **Brute Force Protection:** The `login_user_service` tracks failed login attempts and will raise a "Too many failed login attempts" error (HTTP 429) if a threshold is breached.

### Data Retention Policy
- **Logs/Alerts keep only 7 days:** The default retention period for both the manual and automatic cleanup is 7 days.
- **Every 30 minutes will auto clean up the old logs:** The `main.py` file configures a `BackgroundScheduler` to run the cleanup job every 30 minutes.
- **Admin can manually trigger Data clean up:** The `retention_route.py` file exposes a `/retention/delete-old-data/` API endpoint that allows for manually triggering the deletion.
---
