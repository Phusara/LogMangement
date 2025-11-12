# 🚀 Running the Vector Data Pipeline

This guide explains how to run [Vector](https://vector.dev/) using the provided `vector.yaml` configuration.

Vector will act as a high-performance data pipeline to:
1.  **Collect** logs from multiple sources (Syslog and HTTP).
2.  **Transform** and normalize the log data into a clean JSON format.
3.  **Forward** all processed data to your FastAPI backend.

## Prerequisites

1.  **FastAPI App Running:** This configuration is designed to send data to your backend. You **must** have your FastAPI application running *before* starting Vector.
2.  **Vector Installed:** We recommend running Vector with Docker, as it's the simplest way to manage networking and dependencies.

---

## ▶️ Option 1: Run with Docker (Recommended)

This is the best method, as your `vector.yaml` is configured to find the backend at the hostname `http://backend:8000`. Docker networking makes this simple.

### Step 1: Create a Docker Network

First, create a dedicated network so your FastAPI app and Vector can talk to each other by name.

```bash
docker network create log-network
````

### Step 2: Run Your FastAPI Backend

Run your FastAPI application (assuming it's in a Docker image) and connect it to the network with the name `backend`.

```bash
# Make sure to build your FastAPI image first (e.g., docker build -t fastapi-app .)
docker run -d --name backend --network log-network -p 8000:8000 your-fastapi-image-name
```

**Note:** The `--name backend` part is **critical**. This makes it reachable at `http://backend:8000` from within the Docker network.

### Step 3: Run Vector

Now, run the official Vector image. We will:

  * Connect it to the same `log-network`.
  * Mount your local `vector.yaml` file into the container.
  * Expose all the necessary ports defined in your configuration.

<!-- end list -->

```bash
# Run this command from the directory containing your vector.yaml
docker run -d --name vector \
  --network log-network \
  -v "$(pwd)/vector.yaml:/etc/vector/vector.yaml" \
  -p 514:514/udp \
  -p 515:515/udp \
  -p 9000:9000 \
  -p 9001:9001 \
  -p 9002:9002 \
  -p 9003:9003 \
  -p 9004:9004 \
  timberio/vector:latest
```

Vector is now running and forwarding all data to your `backend` container.

-----

## ▶️ Option 2: Run with a Local Binary

This method is good for testing if you don't want to use Docker, but it **requires one small change to your `vector.yaml` file.**

### Step 1: Install Vector

Follow the [official Vector installation guide](https://vector.dev/docs/setup/installation/) to install the binary on your system.

### Step 2: Modify `vector.yaml`

Your current file tries to send data to `http://backend:8000`, which won't work on your local machine. You must change it to `http://localhost:8000`.

Find this section at the bottom of `vector.yaml`:

```yaml
  fastapi_sink:
    type: "http"
    inputs: [...]
    uri: "http://backend:8000/ingest"  # <-- CHANGE THIS
    # ...
```

And change `uri` to point to `localhost`:

```yaml
  fastapi_sink:
    type: "http"
    inputs: [...]
    uri: "http://localhost:8000/ingest" # <-- TO THIS
    # ...
```

### Step 3: Run Vector

With your FastAPI app running in one terminal, open a new terminal and run Vector, pointing it to your config file:

```bash
vector --config /path/to/your/vector.yaml
```

Vector is now running and sending data to your local FastAPI app.

-----

## ⚙️ How This Configuration Works

### Data Ingest (Sources)

Your `vector.yaml` is configured to listen for data at the following ports:

| Port | Protocol | Source |
| :--- | :--- | :--- |
| `514` | UDP | `route_syslog` (Standard Syslog) |
| `515` | UDP | `firewall_syslog` (Firewall Logs) |
| `9000` | HTTP | `json_syslog` (Generic JSON) |
| `9001` | HTTP | `M365_syslog` (M365) |
| `9002` | HTTP | `Crowdstrike` |
| `9003` | HTTP | `AWS_CT` (AWS CloudTrail) |
| `9004` | HTTP | `MCAD` |

### Data Egress (Sinks)

All incoming data is processed by the `transform` steps and sent to two destinations:

1.  **FastAPI Backend (`fastapi_sink`):** All logs are batched (10 events or 2 seconds) and sent via HTTP POST to your `/ingest` endpoint.
2.  **Console (Debugging):** Each source *also* has a `console_sink` (like `my_console_sink`, `firewall_console_sink`, etc.). This prints the final, processed JSON to your terminal (or Docker logs), which is extremely useful for debugging.

## 🧪 How to Test

You can send test log messages to Vector to see it in action.

**1. Check Vector Logs:**
Whether using Docker or local, check the terminal output.

```bash
# If using Docker
docker logs -f vector
```

You should see the pretty-printed JSON output from the `console` sinks as soon as you send data.

**2. Send a Test Syslog (UDP) Message:**

```bash
# This sends to the 'route_syslog' source
echo "<13>Jan 01 10:00:00 host app: message" | nc -u 127.0.0.1 514
```

**3. Send a Test HTTP (JSON) Message:**

```bash
# This sends to the 'json_syslog' source
curl -X POST -H "Content-Type: application/json" \
  -d '{"log": "{\"event_type\":\"login\",\"user\":\"test\",\"status\":\"failed\"}", "severity": "error"}' \
  [http://127.0.0.1:9000](http://127.0.0.1:9000)
```

**4. Check Your FastAPI Logs:**
Finally, check the logs of your FastAPI application. You should see it receiving the POST requests at the `/ingest` endpoint.

```bash
# If using Docker
docker logs -f backend
```
