### DocuMind AI - Adobe India Hackathon Project

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Frontend-blue?logo=react)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-yellow?logo=python)](https://python.org/)

## 🚀 Project Overview

**DocuMind AI** is an intelligent document processing platform built for the Adobe India Hackathon. It combines the power of AI-driven document analysis, text extraction, audio synthesis, and semantic search to provide a comprehensive solution for document understanding and interaction.

Want to skip docker image building? - https://github.com/AkshatP07/DocuMind-AI 

### 🎯 Key Features

- **📄 PDF Processing**: Advanced text extraction and analysis using PyMuPDF and OCR
- **🧠 AI-Powered Insights**: Gemini 2.5 Flash integration for document understanding  
- **🎤 Text-to-Speech**: Azure Cognitive Services for high-quality audio generation
- **🔍 Semantic Search**: FAISS-powered vector search with sentence transformers
- **📊 Interactive UI**: Modern React frontend with Tailwind CSS and Framer Motion
- **🔌 RESTful API**: FastAPI backend with comprehensive endpoints

---

## 🏗️ Project Structure

```
version8/
├── 📁 client/                    # React Frontend Application
│   ├── 📁 public/               # Static assets
│   ├── 📁 src/                  # React source code
│   │   ├── 📁 components/       # Reusable UI components  
│   │   │   └── 📁 ui/          # UI component library
│   │   └── 📁 assets/          # Images and media files
│   ├── package.json             # Node.js dependencies
│   ├── vite.config.js          # Vite build configuration
│   └── tailwind.css            # Tailwind CSS styles
│
├── 📁 server/                   # FastAPI Backend Application
│   ├── 📁 routers/             # API route handlers
│   │   ├── files.py            # File upload/management endpoints
│   │   ├── tts.py              # Text-to-speech endpoints
│   │   ├── llm.py              # LLM integration endpoints
│   │   ├── model_a.py          # Document analysis endpoints
│   │   └── model_relevant.py   # Semantic search endpoints
│   │
│   ├── 📁 services/            # Business logic services
│   │   ├── pdf_utils.py        # PDF processing utilities
│   │   ├── enhanced_extractor.py # Advanced text extraction
│   │   └── relevant_service.py  # Vector search service
│   │
│   ├── 📁 backends/            # AI/ML backend integrations
│   │   ├── 📁 tts/             # Text-to-speech modules
│   │   └── 📁 relevant_model/  # Semantic search models
│   │
│   ├── 📁 storage/             # Data storage
│   │   ├── 📁 media/           # Generated audio files
│   │   └── 📁 index_data/      # Vector index storage
│   │
│   ├── 📁 uploads/             # User uploaded files
│   ├── main.py                 # FastAPI application entry point
│   └── requirements.txt        # Python dependencies
│
├── 📁 credentials/             # API credentials (not in git)
│   └── adbe-gcp.json          # Google Cloud credentials
│
├── Dockerfile                  # Multi-stage Docker build
├── .dockerignore              # Docker ignore patterns
└── README.md                  # This documentation
```

---

## 🛠️ Technology Stack

### Frontend Stack
- **⚛️ React 19.1** - Modern UI library with hooks
- **🎨 Tailwind CSS 4.1** - Utility-first CSS framework  
- **🎭 Framer Motion 12.23** - Smooth animations and transitions
- **📤 React Dropzone** - Drag-and-drop file uploads
- **🌐 Axios** - HTTP client for API communications
- **⚡ Vite 7.1** - Fast build tool and dev server
- **🎯 Lucide React** - Beautiful SVG icon library

### Backend Stack  
- **🚀 FastAPI 0.116** - High-performance async web framework
- **🐍 Python 3.11** - Latest stable Python runtime
- **📄 PyMuPDF 1.26** - PDF processing and text extraction
- **🔍 Sentence Transformers** - Semantic embeddings
- **📊 FAISS** - Vector similarity search
- **🧠 Google Genai** - Gemini 2.5 Flash integration
- **🗣️ Azure Cognitive Services** - Text-to-speech synthesis
- **🖼️ Pillow & PyTesseract** - OCR and image processing

### Infrastructure
- **🐳 Docker** - Containerized deployment
- **☁️ Multi-cloud Ready** - Azure TTS + Google AI + Adobe APIs
- **🔒 Environment-based Configuration** - Secure credential management

---

## 🚀 Quick Start Guide

### Prerequisites

- **Docker Desktop** installed and running
- **Docker BuildX** enabled (for cross-platform builds)
- **8GB+ RAM** recommended for optimal performance

### 1️⃣ Clone the Repository

```bash
git clone <your-repository-url>
cd version8
```

### 2️⃣ Set Up Credentials

Create your credentials file:

```bash
# Create the credentials directory (if not exists)
mkdir -p credentials

# Add your Google Cloud credentials with Gemini API key
echo '{
  "api_key": "your-gemini-api-key-here"
}' > credentials/adbe-gcp.json
```
```bash
adobe key (38c90a9c49bd4c5b8e96702b40b5ca75) is hardcoded inside the component in client 
```
### 3️⃣ Build the Docker Image

```bash
# Build for Linux AMD64 (recommended for cloud deployment)
docker build --platform linux/amd64 -t documind-ai .

# Alternative: Build for your current platform
docker build -t documind-ai .
```

### 4️⃣ Run the Application

```bash
docker run -d \
  --name documind-container \
  -v "$(pwd)/credentials:/credentials" \
  -e ADOBE_EMBED_API_KEY=your_adobe_api_key \
  -e LLM_PROVIDER=gemini \
  -e GOOGLE_APPLICATION_CREDENTIALS=/credentials/adbe-gcp.json \
  -e GEMINI_MODEL=gemini-2.5-flash \
  -e TTS_PROVIDER=azure \
  -e AZURE_TTS_KEY=your_azure_tts_key \
  -e AZURE_TTS_ENDPOINT=https://centralindia.tts.speech.microsoft.com/ \
  -p 8080:8080 \
  documind-ai
```

### 5️⃣ Access the Application

Open your browser and navigate to: **http://localhost:8080**

---

## 🔧 Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `ADOBE_EMBED_API_KEY` | Adobe PDF Embed API key | ✅ | `38c90a9c49bd4c...` |
| `LLM_PROVIDER` | AI provider (gemini) | ✅ | `gemini` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Google credentials | ✅ | `/credentials/adbe-gcp.json` |
| `GEMINI_MODEL` | Gemini model version | ✅ | `gemini-2.5-flash` |
| `TTS_PROVIDER` | Text-to-speech provider | ✅ | `azure` |
| `AZURE_TTS_KEY` | Azure Cognitive Services key | ✅ | `EMZ41PCfxu9Wws...` |
| `AZURE_TTS_ENDPOINT` | Azure TTS endpoint URL | ✅ | `https://region.tts.speech.microsoft.com/` |

---

## 📡 API Endpoints

### 📁 File Management
- `GET /files` - List uploaded files
- `POST /upload` - Upload PDF documents  
- `GET /uploads/{filename}` - Download specific file
- `DELETE /delete/{filename}` - Remove uploaded file
- `DELETE /clear` - Clear all uploads

### 🧠 Document Analysis  
- `GET /api/v1/extract-outline/` - Extract document structure
- `GET /process/{filename}` - Process existing PDF

### 🔍 Semantic Search
- `POST /relevant/upload` - Upload files for indexing
- `POST /relevant/train` - Build search index
- `GET /relevant/search?query={text}` - Search documents
- `GET /relevant/train/status` - Check indexing status

### 🎤 Audio Generation
- `POST /v1/audio/` - Generate audio from text insights

### 🤖 AI Integration
- `POST /v1/llm/generate` - Generate content with Gemini

---

## 🔄 Development Workflow

### Local Development Setup

1. **Backend Development**:
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

2. **Frontend Development**:
```bash
cd client  
npm install
npm run dev  # Runs on http://localhost:5173
```

### Building for Production

```bash
# Frontend build
cd client
npm run build

# Backend with built frontend
cd ../server  
uvicorn main:app --host 0.0.0.0 --port 8080
```

**FlowChart**
---
*Pdf Management*-
<img width="1597" height="809" alt="file_2025-08-20_00 59 11" src="https://github.com/user-attachments/assets/2f544239-af86-4ad1-b2f1-033412aec715" />
*AI Powered Features*-
<img width="1586" height="810" alt="file_2025-08-20_01 01 16" src="https://github.com/user-attachments/assets/fbffc408-395c-4c64-8d31-796a2fef14eb" />
*Configuration Sources*
<img width="1645" height="600" alt="file_2025-08-20_01 06 15" src="https://github.com/user-attachments/assets/77fbb238-7a72-44fe-8e78-73a7f2c1fef7" />


**Product images**
<img width="1886" height="1057" alt="image" src="https://github.com/user-attachments/assets/9847d71d-e688-44ad-80e3-0da0cc50faaa" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/452a1213-d0af-41f1-9f8b-5a422282c5c1" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/03946e48-8d84-40ea-ab65-d0352d3323d2" />



## 🐳 Docker Configuration

### Multi-Stage Build Process

1. **Stage 1**: Build React frontend with Node.js
2. **Stage 2**: Setup Python backend and copy built frontend

### Key Docker Features

- **🔄 Layer Caching**: Optimized for faster rebuilds
- **🗜️ Size Optimization**: Multi-stage reduces final image size
- **🌐 Cross-Platform**: Linux AMD64 compatible
- **📦 All-in-One**: Single container with frontend + backend

---

## 🧪 Testing & Validation

### Health Checks

```bash
# Check if container is running
docker ps

# View application logs  
docker logs documind-container

# Test API endpoints
curl http://localhost:8080/files
curl -X POST http://localhost:8080/upload -F "file=@test.pdf"
```

---

## 🏆 Hackathon Highlights

### 🎯 Problem Statement
Intelligent document processing with AI-powered insights, semantic search, and multi-modal output generation.

### 💡 Innovation Points
- **Unified Platform**: Combines multiple AI services seamlessly
- **Multi-Modal Output**: Text analysis → Audio synthesis  
- **Real-time Processing**: Fast document ingestion and analysis
- **Scalable Architecture**: Microservices-ready design
- **User Experience**: Intuitive drag-and-drop interface

### 🔧 Technical Achievements
- **Cross-Platform Compatibility**: Docker-based deployment
- **API-First Design**: RESTful architecture  
- **Real-time Indexing**: FAISS vector search integration
- **Security**: Environment-based credential management
- **Performance**: Async processing with FastAPI

---

## 📈 Future Enhancements

- **🔐 Authentication**: User management and access control
- **📊 Analytics Dashboard**: Usage metrics and insights  
- **🌍 Multi-language**: Support for multiple languages
- **☁️ Cloud Storage**: Integration with cloud file systems
- **📱 Mobile App**: Native mobile applications
- **🔄 Batch Processing**: Handle multiple documents simultaneously

---

## 🤝 Contributing

This is a hackathon project built for the **Adobe India Hackathon 2025**. 

### Team Information
- **Project Name**: DocuMind AI
- **Track**: [Akshat Parashar, Mukul, Gaurav Yadav]
- **Technology Stack**: React + FastAPI + Docker

---

## 📄 License

This project is developed for the Adobe India Hackathon and follows the competition guidelines and terms.

---

## 🙏 Acknowledgments

- **Adobe India** for organizing the hackathon
- **Google AI** for Gemini API access  
- **Microsoft Azure** for Cognitive Services
- **Open Source Community** for the amazing tools and libraries

---

**🚀 Ready to transform document processing with AI? Let's build the future together!**
