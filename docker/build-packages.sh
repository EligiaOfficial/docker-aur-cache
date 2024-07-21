#!/bin/bash

# TODO: Update this file to call the application with the correct parameters

cd /builder
nvm use
node dist/builder.js --packagelist_path=/builder/packagelist.txt --repository_dir=/repository --build_dir=/build
