# Base image
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libsm6 libxext6 libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /python

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose the port Render uses
ENV PORT=5000
EXPOSE 5000

# Run Flask app using Gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--timeout", "180"]
