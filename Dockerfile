# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy package.json and lockfile first for caching
COPY client/package*.json ./
RUN npm ci

# Copy all frontend files and build
COPY client/ ./
RUN npm run build

# Stage 2: Setup FastAPI backend
FROM python:3.11-slim AS backend

WORKDIR /app/server

# Install backend dependencies
COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY server/ ./

# Copy frontend build to backend static folder
COPY --from=frontend-builder /app/client/dist ./static

# Expose port
EXPOSE 8080

# Default environment variables (overridden by docker run -e)
ENV GOOGLE_APPLICATION_CREDENTIALS=/credentials/adbe-gcp.json
ENV AZURE_TTS_KEY=""
ENV AZURE_TTS_ENDPOINT=""
ENV ADOBE_EMBED_API_KEY=""
ENV LLM_PROVIDER=gemini
ENV GEMINI_MODEL=gemini-2.5-flash
ENV TTS_PROVIDER=azure

# Run FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
