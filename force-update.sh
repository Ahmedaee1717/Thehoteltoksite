#!/bin/bash
# Add a timestamp comment to force new deployment
TIMESTAMP=$(date +%s)
sed -i "1i// Force update: $TIMESTAMP" src/index.tsx
