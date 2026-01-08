# Server Uptime Monitor

A simple tool to monitor server uptime by continuously pinging a target IP address and visualizing the results in a web dashboard.

## Features

- **Continuous Monitoring**: Automatically pings a target IP address at regular intervals
- **Data Logging**: Records ping results with timestamps in CSV format
- **Interactive Dashboard**: Web interface with a bar chart visualization
- **Time Range Selection**: Filter and view data for specific time periods (up to 24 hours)
- **Real-time Status**: Color-coded bars show online (green) and offline (red) periods
- **10-minute Aggregation**: Data is grouped into 10-minute intervals for better visualization
- **Automatic Deployment**: Automatically deployed to GitHub Pages on every commit

## Purpose

This tool helps you monitor the availability of servers, network devices, or any IP address. It continuously checks connectivity and provides a visual representation of uptime history, making it easy to identify downtime periods and network issues.

## Technologies Used

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Charts**: Recharts
- **Monitoring Script**: Bash (Windows-compatible via Git Bash)
- **Deployment**: GitHub Pages with GitHub Actions

## Usage Guide

### Setting Up the Monitor

1. **Clone the repository**:
   ```bash
   git clone https://github.com/luqas11/uptime-monitor.git
   cd uptime-monitor
   ```

2. **Run the monitoring script**:
   ```bash
   bash data/ping_monitor.sh
   ```

3. **Enter the IP address** when prompted (or it will use the saved IP from `.ip` file)

4. **Let it run**: The script will continuously ping the target and log results to `src/data/data.csv`

### Viewing the Dashboard

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to the local development URL (usually `http://localhost:5173`)

4. **View the data**: The dashboard will automatically load and display the ping results

### Using the Dashboard

- **Time Range Selection**: Use the "Start Time" and "End Time" inputs to filter data for specific periods
- **Default View**: Shows the last 24 hours of data (or all available data if less than 24 hours)
- **Bar Chart**: 
  - Green bars indicate periods where the server was online
  - Red bars indicate periods where the server was offline
  - Gray bars show periods with no data

### Stopping the Monitor

Press `Ctrl+C` in the terminal where the monitoring script is running to stop it gracefully.

## Data Format

The CSV file (`src/data/data.csv`) contains two columns:
- `timestamp`: UNIX timestamp (seconds since epoch)
- `success`: `true` if ping was successful, `false` if it failed

## Deployment

The application is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch. The live version is available at:

**https://luqas11.github.io/uptime-monitor/**
