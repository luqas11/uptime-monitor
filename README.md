# Server Uptime Monitor

A simple tool to monitor server uptime by continuously pinging a target IP address and visualizing the results in a web dashboard.

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

2. **Run the monitoring script** with IP address and CSV filename as arguments:
   ```bash
   bash data/ping_monitor.sh <IP_ADDRESS> <CSV_FILENAME>
   ```
   
   **Example**:
   ```bash
   bash data/ping_monitor.sh 192.168.1.1 server1
   ```
   
   This will:
   - Ping the specified IP address every 60 seconds
   - Log results to `src/data/server1.csv`

3. **File naming rules**: The CSV filename can only contain letters, numbers and underscores.

4. **Multiple monitors**: You can run multiple instances of the script simultaneously to monitor different IPs:
   ```bash
   bash data/ping_monitor.sh 192.168.1.1 server1
   bash data/ping_monitor.sh 8.8.8.8 google_dns
   ```

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

- **File Selection**: Use the dropdown menu to select which CSV file to visualize (all CSV files in `src/data/` are automatically detected)
- **Time Range Selection**: Use the "Start Time" and "End Time" inputs to filter data for specific periods
- **Default View**: Shows the last 24 hours of data (or all available data if less than 24 hours)
- **Bar Chart**: 
  - Green bars indicate periods where the server was online
  - Red bars indicate periods where the server was offline
  - Gray bars show periods with no data

### Stopping the Monitor

Press `Ctrl+C` in the terminal where the monitoring script is running to stop it gracefully.

## Data Format

All CSV files in `src/data/` follow the same format with two columns:
- `timestamp`: UNIX timestamp (seconds since epoch)
- `success`: `true` if ping was successful, `false` if it failed

**Example**:
```csv
timestamp,success
1703123456,true
1703123516,false
1703123576,true
```

You can create multiple CSV files to monitor different servers or IP addresses. All files will be automatically available in the dashboard's file selector.

## Deployment

The application is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch. The live version is available at:

**https://luqas11.github.io/uptime-monitor/**
