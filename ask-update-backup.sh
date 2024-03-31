#!/bin/bash

# Prompt the user
read -p "Do you want to update backup before running 'npm run dev'? (y/N): " answer

# Check user's response
if [[ $answer =~ ^[Yy]$ ]]; then
    # Run update-backup command
    npm run update-backup && npm run dev:start
else
    # Run npm run dev directly
    npm run dev:start
fi
