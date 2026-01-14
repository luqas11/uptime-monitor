#!/bin/bash

# Script to sync monitoring data to git repository
# Pulls latest changes, adds data files, commits and pushes
# Designed to run daily via cron job
# Usage: ./scripts/sync-data.sh

# Pull latest changes
git pull

# Add all files in the data folder
git add public/data/

# Generate commit message with current date
COMMIT_DATE=$(date +"%Y-%m-%d %H:%M:%S")
COMMIT_MESSAGE="Update monitoring data - $COMMIT_DATE"

# Commit the changes
git commit -m "$COMMIT_MESSAGE"

# Push to remote
git push
