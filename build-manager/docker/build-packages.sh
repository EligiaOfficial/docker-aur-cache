#!/bin/bash

cd /build-manager
#nvm use
node ./dist/build-manager.js \
    --builder_image_name=docker-aur-cache-builder \
    --packagelist_path=/repository-builder/packagelist.json \
    --builder_dir=/builder \
    --package_staging_dir=/package-staging \
    --build_report_dir=/repository/build-reports \
    --repository_archive_dir=/repository/archive \
    --repository_dir=/repository \
    --repository_name=docker-aur-cache
