# Meridian — Global Urban Heat Intelligence

Meridian is an autonomous AI agent platform that monitors hyperlocal urban heat using the FortyGuard Temperature API, providing real-time risk analysis, geographic heat mapping, and automated government advisories.

## Project Structure

This repository is organized into a full-stack architecture:

- **/frontend**: A Next.js 15 application built with React, Tailwind CSS, Recharts, and Leaflet. Features a modern, enterprise-grade dark-mode dashboard with real-time SignalR integration.
- **/backend**: A .NET 10 Web API utilizing Entity Framework Core, Neon PostgreSQL, and SignalR. Implements the CQRS pattern with MediatR for scalable background processing and data ingestion.

## Getting Started

### Prerequisites
- Node.js (v18+)
- .NET 10 SDK
- PostgreSQL (or Neon connection string)

### Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run the application:
   ```bash
   dotnet run --project Meridian.API
   ```
The backend API will run on `http://localhost:5250`.

### Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
The frontend application will be available at `http://localhost:3000`.

## Features

- **Real-Time Dashboard**: Live temperature, humidity, and heat index streaming for monitored zones.
- **Geospatial Intelligence**: Global mapping of heat risks using Carto tiles and Leaflet.
- **AI Agent**: Interactive chat interface powered by Groq (LLaMA-3) to analyze urban heat correlations and answer queries.
- **Enterprise Reporting**: Generate, filter, and export professional TXT heat advisories.
- **Zone Management**: Bulk import via CSV and manage locations for active monitoring.

## License

This project was built for a hackathon and is provided as-is.
