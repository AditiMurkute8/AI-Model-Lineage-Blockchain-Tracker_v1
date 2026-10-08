FROM python:3.11-slim

# Install Node.js LTS and git
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definition files
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm install --production

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Set environment variables
ENV PORT=5000
ENV PYTHON_PATH=python3

EXPOSE 5000

CMD ["node", "server.js"]
