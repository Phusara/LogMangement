# Log Management Platform

This is a complete, multi-tenant log management and security monitoring platform.

It is built as a full-stack, containerized application that uses **Vector** for high-performance log ingestion, a **FastAPI** backend for data processing and API access, a **PostgreSQL** database for storage, and a **Vue.js** frontend for data visualization and user interaction.

##  architectural-overview

The system is designed with a clear separation of concerns:

1.  **Ingestion (`/ingest`):** **Vector** acts as the data pipeline. It listens on multiple ports (UDP for Syslog, HTTP for JSON/Webhook), parses and transforms the logs, and forwards them in a clean JSON format to the backend.
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

You must create `.env` files for the Main,backend and frontend before starting.

**Backend Configuration:**

Create a `.env` file in the `./backend/` directory by copying the example:

```bash
cp backend/.env.example backend/.env
