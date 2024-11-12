#!/bin/bash

set -e


# First, ensure that required directories are made
mkdir -p /usr/share/nginx/html/archive
mkdir -p /usr/share/nginx/html/build-reports


cd /build-manager
node ./dist/build-manager.js \
    --builder_image_name=docker-aur-cache-builder \
    --packagelist_configuration_path=/config/packagelist.config.json \
    --builder_dir=/builder \
    --package_staging_dir=/package-staging \
    --build_report_dir=/usr/share/nginx/html/build-reports \
    --repository_archive_dir=/usr/share/nginx/html/archive \
    --repository_dir=/usr/share/nginx/html \
    --repository_name=docker-aur-cache
