#!/bin/bash

# Abort if any command fails
set -e

# Ensures that the archive directory exists
mkdir -p /usr/share/nginx/html/archive/

# Go to the archive
cd /usr/share/nginx/html/archive

# Find and delete packages older than 30 days
find -name '*.pkg.tar.zst' -mtime +30 -exec rm {} \;