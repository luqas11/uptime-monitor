#!/bin/bash

# Script to ping an IP address every 10 seconds and log results to CSV

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

# Try to read IP from .ip file
IP=""
if [ -f ".ip" ]; then
    IP=$(cat .ip | tr -d '[:space:]')
    if ! validate_ip "$IP"; then
        IP=""
    fi
fi

# If IP is invalid or file doesn't exist, ask user for IP
if [ -z "$IP" ]; then
    while true; do
        read -p "Please enter a valid IPv4 address: " IP
        IP=$(echo "$IP" | tr -d '[:space:]')
        
        if validate_ip "$IP"; then
            # Write valid IP to .ip file
            echo "$IP" > .ip
            echo "IP address saved to .ip file"
            break
        else
            echo "Error: Invalid IPv4 address. Please try again." >&2
        fi
    done
fi

# Define CSV file path
CSV_FILE="../src/data/data.csv"

# Ensure the directory exists
mkdir -p "$(dirname "$CSV_FILE")"

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
echo "Results will be written to $CSV_FILE"
echo "Press Ctrl+C to stop"
echo ""

# Main loop
while true; do
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
