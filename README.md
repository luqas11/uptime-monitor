# Server Uptime Monitor

> **Note**: This project was built entirely using the [Cursor](https://cursor.com) AI agent, made to test the AI development process on a simple project.  

A simple tool to monitor server uptime by continuously pinging a target IP address and visualizing the results in a web dashboard.

![Server Uptime Monitor Dashboard](screenshot.png)

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

2. **Run the monitoring script** with IP address and target name as arguments:
   ```bash
   bash scripts/ping_monitor.sh <IP_ADDRESS> <TARGET_NAME>
   ```
   
   **Example**:
   ```bash
   bash scripts/ping_monitor.sh 192.168.1.1 server1
   ```
   
   This will:
   - Ping the specified IP address every 60 seconds
   - Create a folder for the target (e.g., `public/data/server1/`)
   - Automatically create daily CSV files (e.g., `2026-01-09.csv`)
   - Automatically switch to a new daily file when the day rolls over at midnight

3. **Target naming rules**: The target name can only contain letters, numbers and underscores.

4. **Multiple monitors**: You can run multiple instances of the script simultaneously to monitor different IPs:
   ```bash
   bash scripts/ping_monitor.sh 192.168.1.1 server1
   bash scripts/ping_monitor.sh 8.8.8.8 google_dns
   ```
   
   Each target will have its own folder with separate daily files.

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

- **Target Selection**: Use the first dropdown to select which target to visualize (e.g., `server1`, `google_dns`)
- **Date Selection**: Use the second dropdown to select which day's data to view (dates are automatically detected from available files)
- **Time Range Selection**: Use the "End Time" selector to choose the end of the 24-hour window you want to view (the chart always displays exactly 24 hours of data)
- **Default View**: Shows the last 24 hours before the most recent data point for the selected date
- **Bar Chart**: 
  - Green bars indicate periods where all pings were successful (server was online)
  - Red bars indicate periods where all pings failed (server was offline)
  - Yellow bars indicate periods with mixed results (unstable - both successful and failed pings)
  - Gray bars show periods with no data

### Stopping the Monitor

Press `Ctrl+C` in the terminal where the monitoring script is running to stop it gracefully.

## Data Format

All CSV files follow the same format with two columns:
- `timestamp`: UNIX timestamp (seconds since epoch)
- `success`: `true` if ping was successful, `false` if it failed

**Example**:
```csv
timestamp,success
1703123456,true
1703123516,false
1703123576,true
```

**Data Organization**:
- Each target (monitored IP) has its own folder in `public/data/`
- Daily files are automatically created with the format `YYYY-MM-DD.csv`
- Example structure:
  ```
  public/data/
  ├── server1/
  │   ├── 2026-01-08.csv
  │   └── 2026-01-09.csv
  └── google_dns/
      ├── 2026-01-09.csv
      └── 2026-01-10.csv
  ```

All targets and dates are automatically detected and available in the dashboard selectors.

## Deployment

The application is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch. The live version is available at:

**https://luqas11.github.io/uptime-monitor/**
