#!/bin/bash

cd /builder
#nvm use
node ./dist/builder.js \
    --packagelist_path=/repository-builder/packagelist.txt \
    --build_dir=/repository-builder \
    --repository_dir=/repository \
    --repository_name=docker-aur-cache
