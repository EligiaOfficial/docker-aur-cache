#!/bin/bash

cd /build-manager
#nvm use
node ./dist/build-manager.js \
    --builder_image_name=docker-aur-cache-builder \
    --packagelist_path=/repository-builder/packagelist.txt \
    --builder_dir=/builder \
    --package_staging_dir=/package-staging \
    --repository_dir=/repository \
    --repository_name=docker-aur-cache