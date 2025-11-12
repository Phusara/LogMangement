# Log Management Platform

This is a complete, multi-tenant log management and security monitoring platform.

It is built as a full-stack, containerized application that uses **Vector** for high-performance log ingestion, a **FastAPI** backend for data processing and API access, a **PostgreSQL** database for storage, and a **Vue.js** frontend for data visualization and user interaction.

##  architectural-overview

The system is designed with a clear separation of concerns:

1.  **Ingestion (`/ingest`):** **Vector** acts as the data pipeline. It listens on multiple ports (UDP for Syslog, HTTP for JSON), parses and transforms the logs, and forwards them in a clean JSON format to the backend.
2.  **Backend (`/backend`):** A **FastAPI** application provides a secure REST API for all actions. It handles user authentication, data ingestion from Vector, querying logs/alerts, and serving dashboard analytics.
3.  **Database (`/db`):** A **PostgreSQL** database stores all data. It uses a multi-tenant, shared-schema model where all data (e.g., in the `logs` table) is isolated by a `tenant_id` column.
4.  **Frontend (`/frontend`):** A **Vue.js** single-page application (SPA) provides the user interface. It includes a login page, an alerts dashboard, a log search view, and data retention settings.

## Key Features

* **Multi-Tenant Architecture:** Securely segregates data using a `tenant_id` for every log and alert.
* **High-Performance Ingestion:** Uses Vector to collect and process logs from diverse sources like Syslog and HTTP webhooks.
* **Secure Authentication:**
    * **JWT Token-Based:** All API endpoints are secured using JSON Web Tokens.
    * **RBAC:** Built-in Role-Based Access Control for 'admin' and 'tenant' users.
    * **Password Security:** Passwords are hashed using `bcrypt`.
    * **Brute Force Protection:** Automatically locks out IPs after too many failed login attempts.
* **Automated Data Retention:**
    * A background scheduler automatically deletes logs and alerts older than 7 days.
    * The cleanup job runs every 30 minutes.
    * Admins can manually trigger a data cleanup via the API.
* **Full-Featured Frontend:**
    * Dashboard with analytics for log counts and event types.
    * A detailed log search and filtering interface.
    * Alerts and data retention management pages.
* **Containerized:** Fully containerized with `docker-compose` for easy development and production deployment.

## 🛠️ Prerequisites

* [Docker](https://www.docker.com/get-started)
* [Docker Compose](https://docs.docker.com/compose/install/)

## 🚀 Running the Application

This project is configured to run entirely with Docker Compose.

### 1. Configuration

You must create `.env` files for the backend and frontend before starting.

**Backend Configuration:**

Create a `.env` file in the `./backend/` directory by copying the example:

```bash
cp backend/.env.example backend/.env
````

Now, **edit `backend/.env`** and set your database credentials and a strong secret key.

```ini
# backend/.env

# Replace with your values
DATABASE_URL=postgresql://user:password@db:5432/logdb

# Generate a strong key (e.g., openssl rand -hex 32)
SECRET_KEY=YOUR_STRONG_SECRET_KEY_HERE
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Note:** The `DATABASE_URL` is configured to use the Docker service name (`db`). You only need to set the `user`, `password`, and `logdb`.

**Frontend Configuration:**

Create a `.env` file in the `./frontend/` directory:

```bash
cp frontend/.env.example frontend/.env
```

The default values in `frontend/.env.example` are configured for this `docker-compose` setup and should work out-of-the-box.

```ini
# frontend/.env
VITE_API_URL=http://localhost:8000
```

### 2\. Build and Run (Development)

The `runDev.sh` script starts the application in development mode with hot-reloading for the frontend and backend.

```bash
# Make the script executable
chmod +x ./Makefile/runDev.sh

# Run the script
sh ./Makefile/runDev.sh
```

This command uses `docker-compose.yml` and overlays it with `docker-compose.override.yml` to mount your local code into the containers.

The `init-db` service will run automatically, creating all database tables and indexes on the first launch.

### 3\. Build and Run (Production)

To build and run the production-optimized images:

```bash
# Make the script executable
chmod +x ./Makefile/runProd.sh

# Run the script
sh ./Makefile/runProd.sh
```

This command builds the production Dockerfiles and runs the application in detached mode.

### 4\. Stopping the Application

To stop all running services:

```bash
docker-compose down
```

## 🧪 Accessing the Application

Once the services are running, you can access them at:

  * **Frontend (Web UI):** `http://localhost:8080`
      * *Mapped from port 80 in the `frontend` container*.
  * **Backend (API Docs):** `http://localhost:8000/docs`
      * *Mapped from port 8000 in the `backend` container*.
  * **Vector (Log Ingestion):**
      * **Syslog (UDP):** `127.0.0.1:514` (route) & `127.0.0.1:515` (firewall)
      * **HTTP (JSON):** `http://localhost:9000` (JSON), `http://localhost:9001` (M365), etc.

## 📂 Project Structure

```
.
├── Makefile/           # Helper scripts to run dev/prod environments
├── backend/            # FastAPI (Python) backend application
│   ├── routers/        # API endpoints
│   ├── services/       # Business logic
│   ├── entity/         # Database models
│   ├── .env.example    # Backend environment template
│   ├── Dockerfile.dev  # Development Dockerfile
│   └── Dockerfile.prod # Production Dockerfile
├── db/                 # PostgreSQL database files
│   ├── 01_shema.sql    # Main database schema
│   └── 02_init.sql     # Indexes and initial data
├── docs/               # Project documentation
├── frontend/           # Vue.js 3 frontend application
│   ├── src/
│   │   ├── views/      # Vue pages
│   │   ├── components/ # Vue components
│   │   ├── stores/     # Pinia state management
│   │   └── router/     # Vue router
│   ├── .env.example    # Frontend environment template
│   ├── Dockerfile.dev  # Development Dockerfile
│   └── Dockerfile.prod # Production Dockerfile
├── ingest/             # Vector configuration
│   └── vector.yaml     # Vector pipeline definition
├── docker-compose.yml          # Main production services
└── docker-compose.override.yml # Development-only overrides
```
