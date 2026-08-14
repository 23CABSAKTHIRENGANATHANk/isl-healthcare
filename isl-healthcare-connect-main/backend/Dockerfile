# ==============================================================================
# ISL Setu — Production FastAPI AI Backend Dockerfile
# Optimized for Railway, Render, Fly.io, and containerized cloud runtimes
# ==============================================================================

FROM python:3.11-slim AS builder

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies in isolated wheels directory
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ==============================================================================
# Final Runtime Stage
# ==============================================================================
FROM python:3.11-slim

WORKDIR /app

# Install OpenCV and MediaPipe required OS libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application source code
COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start FastAPI application using Uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
