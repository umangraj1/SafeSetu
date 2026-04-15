# 🛡️ Safe Route Finder

An interactive web application focused on **women's safety** while traveling alone in Bangalore. Instead of finding the shortest route, it finds the **safest route** by analyzing crime data, streetlight density, crowd density, and accident-prone areas — all adjusted for **time of day**.

## Features

- **Google Maps integration** with real routing (Directions API + Places Autocomplete)
- **Safety scoring engine** analyzing 4 factors:
  - 🔴 Crime data (35% weight, increases at night)
  - 💡 Streetlight density (25% weight, critical at night)
  - 👥 Crowd density (25% weight, time-bucketed)
  - 🚧 Accident-prone areas (15% weight)
- **Time-aware analysis** — scores change for Morning / Afternoon / Evening / Night
- **Visual safety overlays** — toggle crime zones, streetlight coverage, crowd density, accident spots on the map
- **Live location tracking** — shows your position on the map like Google Maps
- **SOS emergency button** — quick access to Police (100), Women Helpline (1091), Emergency (112)
- **Route comparison** — up to 3 alternative routes scored and ranked
- **Mobile-friendly** app-like interface

## Setup

### 1. Clone & install dependencies

```bash
npm install
npm run install-all
```

### 2. Add your Google Maps API key

Create a file `client/.env`:

```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

> Your API key needs these APIs enabled:
> - Maps JavaScript API
> - Directions API
> - Places API
> - Geocoding API

### 3. Run the app

```bash
npm run dev
```

This starts both the Express backend (port 3001) and Vite frontend (port 5173).

Open **http://localhost:5173** in your browser.

## How It Works

1. **Before searching**: The map shows red spots indicating unsafe/crime-prone areas in Bangalore
2. **Enter origin & destination**: Use the search panel (supports autocomplete) or use your live location
3. **Select time**: Choose Now, Morning, Afternoon, Evening, or Night
4. **View results**: Routes are color-coded (green = safe, yellow = moderate, red = unsafe) with detailed safety breakdowns
5. **During journey**: SOS button appears for emergency calls

## Tech Stack

- **Frontend**: React 18 + Vite, Google Maps JavaScript API, TailwindCSS, Lucide Icons
- **Backend**: Node.js + Express
- **Data**: Simulated safety datasets for Bangalore (15+ zones each)

## Safety Data Coverage

Bangalore areas covered: MG Road, Koramangala, Whitefield, Majestic, Electronic City, Indiranagar, Jayanagar, Marathahalli, Peenya, Hebbal, Banashankari, Silk Board, and more.
