# Use an official Python runtime as a parent image
FROM python:3.10-slim

# LightGBM requires libgomp1 on Debian-based slim images
RUN apt-get update && apt-get install -y libgomp1 && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code into the container
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "inference_server:app", "--host", "0.0.0.0", "--port", "8000"]
