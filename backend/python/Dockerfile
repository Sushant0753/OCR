# Base image
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000

# System dependencies for OpenCV and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip tooling
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch CPU wheels separately to control size and avoid GPU deps
# Keeping this in its own layer improves build caching when app code changes
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
    torch torchvision

# Install EasyOCR separately so it stays cached independently
RUN pip install --no-cache-dir easyocr

# Pre-download/cached EasyOCR models at build time to avoid runtime downloads
# This creates /root/.EasyOCR with the required weights for 'en'
RUN python - <<'PY'
import easyocr
reader = easyocr.Reader(['en'], gpu=False)
print("EasyOCR models cached at:", reader.model_storage_directory)
PY

# Install the rest of the runtime dependencies
RUN pip install --no-cache-dir \
    Flask \
    opencv-python-headless \
    Pillow \
    numpy

# Copy application code
COPY . /app

# Expose Flask port
EXPOSE 5000

# Start the Flask app
CMD ["python", "app.py"]
