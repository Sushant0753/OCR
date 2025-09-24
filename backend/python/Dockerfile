# Use a lightweight Python base image
FROM python:3.11-slim

# Install system dependencies for OpenCV and Tesseract
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        tesseract-ocr \
        libsm6 \
        libxext6 \
        libxrender1 \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all Python app files
COPY . .

# Expose port (Render expects 0.0.0.0:$PORT)
ENV PORT=5000
EXPOSE 5000

# Run Flask app using Gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--timeout", "180"]
