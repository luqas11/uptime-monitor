#!/bin/bash

# Script to ping an IP address every 60 seconds and log results to daily CSV files
# Usage: ./ping_monitor.sh <IP_ADDRESS> <TARGET_NAME>
# Example: ./ping_monitor.sh 192.168.1.1 server1

# Function to validate IPv4 address
validate_ip() {
    local ip=$1
    
    # Check IPv4 format
    if [[ ! $ip =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
        return 1
    fi
    
    # Validate each octet is between 0-255
    IFS='.' read -ra ADDR <<< "$ip"
    for i in "${ADDR[@]}"; do
        if [[ $i -lt 0 || $i -gt 255 ]]; then
            return 1
        fi
    done
    
    return 0
}

# Function to validate target name (only letters, numbers, and underscores)
validate_target_name() {
    local name=$1
    
    # Check if name contains only uppercase letters, lowercase letters, numbers, or underscores
    if [[ ! $name =~ ^[a-zA-Z0-9_]+$ ]]; then
        return 1
    fi
    
    return 0
}

# Check if arguments are provided
if [ $# -lt 2 ]; then
    echo "Error: Missing arguments" >&2
    echo "Usage: $0 <IP_ADDRESS> <TARGET_NAME>" >&2
    echo "Example: $0 192.168.1.1 server1" >&2
    exit 1
fi

# Get IP address from first argument
IP=$(echo "$1" | tr -d '[:space:]')

# Validate IP address
if ! validate_ip "$IP"; then
    echo "Error: Invalid IPv4 address: $IP" >&2
    echo "Please provide a valid IPv4 address (e.g., 192.168.1.1)" >&2
    exit 1
fi

# Get target name from second argument
TARGET_NAME=$(echo "$2" | tr -d '[:space:]')

# Validate target name
if ! validate_target_name "$TARGET_NAME"; then
    echo "Error: Invalid target name: $TARGET_NAME" >&2
    echo "Target name can only contain uppercase letters, lowercase letters, numbers, or underscores." >&2
    exit 1
fi

# Define target directory
TARGET_DIR="../public/data/${TARGET_NAME}"

# Ensure the target directory exists
mkdir -p "$TARGET_DIR"

# Function to get current date in YYYY-MM-DD format
get_current_date() {
    date +%Y-%m-%d
}

# Function to get CSV file path for a given date
get_csv_file() {
    local date=$1
    echo "${TARGET_DIR}/${date}.csv"
}

# Initialize current date and CSV file
CURRENT_DATE=$(get_current_date)
CSV_FILE=$(get_csv_file "$CURRENT_DATE")

# Initialize CSV file with header if it doesn't exist
if [ ! -f "$CSV_FILE" ]; then
    echo "timestamp,success" > "$CSV_FILE"
fi

# Function to handle Ctrl+C gracefully
cleanup() {
    echo ""
    echo "Stopping ping monitor..."
    exit 0
}

# Set trap for Ctrl+C
trap cleanup SIGINT SIGTERM

echo "Starting ping monitor for IP: $IP"
echo "Target: $TARGET_NAME"
echo "Results will be written to daily files in: $TARGET_DIR"
echo "Current file: $(basename "$CSV_FILE")"
echo "Press Ctrl+C to stop"
echo ""

# Main loop
while true; do
    # Check if date has changed (day rollover)
    NEW_DATE=$(get_current_date)
    if [ "$NEW_DATE" != "$CURRENT_DATE" ]; then
        echo ""
        echo "Day rolled over. Switching to new file: ${NEW_DATE}.csv"
        CURRENT_DATE="$NEW_DATE"
        CSV_FILE=$(get_csv_file "$CURRENT_DATE")
        
        # Initialize new CSV file with header
        if [ ! -f "$CSV_FILE" ]; then
            echo "timestamp,success" > "$CSV_FILE"
        fi
    fi
    
    # Get current UNIX timestamp
    TIMESTAMP=$(date +%s)
    
    # Ping the IP with 5 second timeout
    # -n 1: send 1 packet (Windows syntax)
    # -w 5000: timeout 5000 milliseconds = 5 seconds (Windows syntax)
    # Capture ping output to check for success (Windows ping returns 0 even on failure)
    PING_OUTPUT=$(ping -n 1 -w 5000 "$IP" 2>&1)
    
    # Check if ping was successful by looking for success indicators in output
    # Successful ping contains: bytes=<number> (time|tiempo)=<number>ms TTL=<number>
    if [[ "$PING_OUTPUT" =~ bytes=[0-9]+\ (time|tiempo)=[0-9]+ms\ TTL=[0-9]+ ]]; then
        SUCCESS="true"
    else
        SUCCESS="false"
    fi
    
    # Write to CSV file
    echo "$TIMESTAMP,$SUCCESS" >> "$CSV_FILE"
    
    # Format timestamp for readable display
    READABLE_TIME=$(date -d "@$TIMESTAMP" +"%H:%M:%S" 2>/dev/null || date +"%H:%M:%S")
    
    # Print to terminal with formatted timestamp
    echo "$READABLE_TIME - $SUCCESS"
    
    # Wait 60 seconds before next ping
    sleep 60
done
