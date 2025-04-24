# REMEDI

A React-based front-end with a data scraper backend for tracking medication schedules and doctor appointments.

## Table of Contents

- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
  - [Running the Scraper](#running-the-scraper)
- [License](#license)

## Project Structure

REMEDI/
├── REMEDI/
│ ├── public/ # Static assets
│ └── src/
│ ├── api/ # API client & hooks
│ ├── components/ # Reusable UI components
│ │ └── tabs/
│ │ └── functions/ # Tab-specific utilities
│ ├── data/ # Sample or mock data
│ ├── firebase/ # Firebase setup & helpers
│ ├── images/ # Image assets
│ └── utils/ # General utility functions
└── scraper/ # Backend scraper scripts

## Features

- 🖥️ Modern React frontend
- 📡 Data scraping scripts (Node.js or Python—whatever you choose)
- 🔌 Firebase integration for authentication / data storage
- ⚙️ Modular component + utility structure

## Getting Started

### Prerequisites

- Node.js (v14+) and npm or yarn
- Python (for the scraper)

### Installation

1. Clone the repo
   ```bash
   git clone https://github.com/MohamedLahlami/REMEDI.git
   cd REMEDI/REMEDI
   ```
2. Install dependencies
   ```bash
   npm install
   ```

### Running the App

```bash
npm run start
```

Then open `http://localhost:3000` in your browser.

### Running the Scraper

```bash
cd scraper
pip install requests beautifulsoup4
python medicationScraper.py
```

Output will be written to `scraper/medication.json`

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
