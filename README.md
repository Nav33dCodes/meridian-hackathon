<div align="center">
  <img src="frontend/public/logo.png" alt="Meridian Logo" width="120" />
  <h1>Meridian</h1>
  <p><strong>Global Urban Heat Intelligence & Autonomous Advisory Platform</strong></p>
</div>

---

## 🌍 Overview

**Meridian** is an enterprise-grade autonomous AI platform designed to monitor, analyze, and mitigate hyperlocal urban heat risks. By fusing real-time geospatial temperature data from the FortyGuard API with the reasoning capabilities of Groq's ultra-fast models, Meridian provides city planners and governments with live actionable intelligence and automated heat advisories.

## ✨ Key Features

- **Real-Time Telemetry Dashboard**: Live monitoring of temperature, humidity, and calculated Heat Index across multiple geographical zones via SignalR websockets.
- **Geospatial Heat Mapping**: Interactive Carto-powered maps built on Leaflet for high-fidelity visual risk assessment.
- **Autonomous AI Agent**: A conversational interface powered by Groq that can instantly analyze correlations, identify at-risk zones, and recommend cooling strategies.
- **Enterprise Reporting**: Automated generation and PDF/TXT export of professional government heat advisories and historical risk data.
- **Bulk Zone Ingestion**: Effortlessly onboard hundreds of locations via CSV upload with automatic geospatial resolution.

## 🏗️ Architecture

Meridian is built using a modern, scalable, and decoupled full-stack architecture:

- **Frontend (`/frontend`)**: A highly optimized **Next.js 15** application utilizing React, Tailwind CSS, Recharts, and Framer Motion. It consumes REST APIs and SignalR streams to deliver a buttery-smooth, Geist-inspired dark-mode UI.
- **Backend (`/backend`)**: A robust **.NET 10** Web API built on Clean Architecture principles. It uses Entity Framework Core with a **Neon PostgreSQL** database, MediatR for CQRS command/query separation, and background workers for asynchronous data ingestion.
- **External Integrations**:
  - **FortyGuard API**: Hyperlocal temperature and environmental telemetry.
  - **Groq API**: High-speed LLM inference for the autonomous agent.

## 🚀 Getting Started

Follow these instructions to run the Meridian platform locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- A [Neon PostgreSQL](https://neon.tech/) connection string (or local PostgreSQL database)
- API Keys for FortyGuard and Groq

### 1. Clone the Repository

```bash
git clone https://github.com/Nav33dCodes/meridian-hackathon.git
cd meridian-hackathon
```

### 2. Backend Setup (.NET 10)

Navigate to the backend directory and set up your environment variables:

```bash
cd backend/Meridian.API
```

Create a new file named `appsettings.Development.json` based on the provided `appsettings.json`, and insert your real database credentials and API keys:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=your-neon-host.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=YOUR_NEON_PASSWORD;Ssl Mode=Require;"
  },
  "FortyGuard": {
    "BaseUrl": "https://api.fortyguard.com",
    "ApiKey": "YOUR_FORTYGUARD_API_KEY"
  },
  "Groq": {
    "ApiKey": "YOUR_GROQ_API_KEY",
    "Model": "qwen/qwen3.8-27b"
  }
}
```

Run the API:

```bash
dotnet run
```
The backend will start on `http://localhost:5250` (and `https://localhost:7142`). The database migrations will automatically apply on startup.

### 3. Frontend Setup (Next.js)

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install NPM dependencies:

```bash
npm install
```

Set up your environment variables by copying the example file:

```bash
cp .env.example .env.local
```

*(Ensure `NEXT_PUBLIC_API_URL` is pointing to your running backend, default is `http://localhost:5250`)*

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser to access the Meridian dashboard.

## 📄 License

This project was developed as a hackathon submission. All rights reserved.
