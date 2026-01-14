#!/bin/bash

# Script to cleanup old data files from the data folder
# Deletes CSV files older than 90 days based on filename date (YYYY-MM-DD.csv)
# Usage: ./scripts/cleanup-old-data.sh

DATA_DIR="./public/data"
DAYS=90

# Check if data directory exists
if [ ! -d "$DATA_DIR" ]; then
  echo "Error: Data directory '$DATA_DIR' does not exist"
  exit 1
fi

# Calculate cutoff date (90 days ago)
CUTOFF_DATE=$(date -d "$DAYS days ago" +%Y-%m-%d 2>/dev/null)

# Find and delete all CSV files older than 90 days based on filename
find "$DATA_DIR" -type f -name "*.csv" -print0 2>/dev/null | while IFS= read -r -d '' file; do
  # Extract date from filename (format: YYYY-MM-DD.csv)
  filename=$(basename "$file")
  file_date="${filename%.csv}"
  
  # Check if filename matches date format (YYYY-MM-DD)
  if [[ "$file_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    # Compare dates (YYYY-MM-DD format allows string comparison)
    if [[ "$file_date" < "$CUTOFF_DATE" ]]; then
      rm -f "$file"
    fi
  fi
done

# Clean up empty directories
find "$DATA_DIR" -type d -empty -delete 2>/dev/null

# Regenerate manifest
npm run generate-manifest 2>/dev/null
