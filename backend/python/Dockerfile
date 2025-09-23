# Base image
FROM python:3.10-slim

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000 \
    EASYOCR_PATH=/app/.EasyOCR  # Custom path for EasyOCR models

# System dependencies for OpenCV and image processing
# Combine RUN commands to reduce layers
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

WORKDIR /app

# Upgrade pip tooling and install core ML dependencies first
# Using a single RUN command for related installations
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
    torch torchvision && \
    pip install --no-cache-dir easyocr

# Pre-download/cached EasyOCR models at build time to avoid runtime downloads
# Use the custom EASYOCR_PATH
RUN mkdir -p ${EASYOCR_PATH} && \
    python -c "import os; import easyocr; reader = easyocr.Reader(['en'], gpu=False, model_storage_directory=os.environ.get('EASYOCR_PATH')); print('EasyOCR models cached at:', reader.model_storage_directory)"

# Install the rest of the runtime dependencies
# Combine into a single RUN command
RUN pip install --no-cache-dir \
    Flask \
    opencv-python-headless \
    Pillow \
    numpy

# Copy application code (do this after dependencies for better caching)
COPY . /app

# Expose Flask port
EXPOSE 5000

# Start the Flask app
CMD ["python", "app.py"]
