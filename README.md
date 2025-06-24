# US Economic Dashboard

React/Node.js dashboard displaying US economic indicators from FRED API.

## Features
- Real-time GDP, Unemployment & Treasury data
- Interactive charts
- Historical trend analysis

## Setup
1. Get FRED API key at [research.stlouisfed.org](https://research.stlouisfed.org/useraccount/apikey)
2. Create `.env` in `/server`:
```FRED_API_KEY=your_key_here```

## Installation
```bash
# Backend
cd server && npm install

# Frontend (root)
npm install

# Terminal 1 (backend)
cd server && npm start

# Terminal 2 (frontend)
npm start
