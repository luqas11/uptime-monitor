#!/bin/bash

# Script to sync monitoring data to git repository
# Pulls latest changes, adds data files, commits and pushes
# Designed to run hourly via cron job
# Usage: ./scripts/sync-data.sh

# Pull latest changes
git pull

# Generate manifest to include any new data files
npm run generate-manifest

# Add all files in the data folder
git add data/

# Generate commit message with current date
COMMIT_MESSAGE="Update monitoring data - $(date +"%Y-%m-%d %H:%M")"

# Commit the changes
git commit -m "$COMMIT_MESSAGE"

# Push to remote
git push
