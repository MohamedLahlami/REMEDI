# REMEDI

A React-based front-end with a data scraper backend for tracking medication schedules and doctor appointments.

Check out a deployment version here: [remedi-app.netlify.app](https://remedi-app.netlify.app/) -- [![Netlify Status](https://api.netlify.com/api/v1/badges/47489699-5cec-4357-8895-4149b2d855be/deploy-status)](https://app.netlify.com/sites/remedi-app/deploys)

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
  - [Running the Scraper](#running-the-scraper)
- [License](#license)

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

_The url of the actual website that this script is used on is redacted for legal reasons._

```bash
cd scraper
pip install requests beautifulsoup4
pip install python-dotenv
python medicationScraper.py
```

Output will be written to `REMEDI/src/data/medications.json`

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
