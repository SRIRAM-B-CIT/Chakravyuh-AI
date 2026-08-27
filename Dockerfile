# =========================================================================
# Chakravyuh AI - Python Core (FastAPI Backend, AI Sniffer & SOAR Engine)
# Cross-Platform Linux & Windows (WSL2 / Docker Desktop) Image
# =========================================================================

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system utilities, Wireshark/tshark packet inspection, and Netfilter tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    tshark \
    iptables \
    iproute2 \
    conntrack \
    procps \
    curl \
    net-tools \
    gcc \
    g++ \
    libcap2-bin \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU first for cross-platform portability & fast image builds
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install application dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Ensure state exchange files exist with read/write permissions
RUN touch state.json events.log && chmod 666 state.json events.log

EXPOSE 8000

CMD ["python", "server.py"]
