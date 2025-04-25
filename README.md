# REMEDI

A React-based front-end with a data scraper backend for tracking medication schedules and doctor appointments.

Check out a deployment version here: [![Netlify Status](https://api.netlify.com/api/v1/badges/47489699-5cec-4357-8895-4149b2d855be/deploy-status)](https://app.netlify.com/sites/remedi-app/deploys)

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

```
REMEDI/
├── REMEDI/                   # Main React application
│   ├── build/                # Production build output
│   ├── public/               # Static public assets
│   ├── src/                  # Source code
│   │   ├── api/              # API integration services
│   │   ├── components/       # React components
│   │   │   ├── tabs/         # Tab-specific components
│   │   │   │   ├── functions/  # Utility functions for tabs
│   │   ├── data/             # Static data and configuration
│   │   ├── firebase/         # Firebase configuration and services
│   │   ├── images/           # Image assets
│   │   ├── utils/            # Utility functions and helpers
│   │   ├── App.js            # Main application component
│   │   └── index.js          # Application entry point
│   ├── package.json          # Dependencies and scripts
│   └── .gitignore            # Git ignore file
├── scraper/                  # Data scraping scripts
│   ├── medicationScraper.py  # Python scraper for medication data
│   └── medications.json      # Scraped medication data
├── LICENSE                   # License information
└── README.md                 # Project documentation
```

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

*The url of the actual website that this script is used on is redacted for legal reasons.*

```bash
cd scraper
pip install requests beautifulsoup4
python medicationScraper.py
```

Output will be written to `scraper/medication.json`

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
