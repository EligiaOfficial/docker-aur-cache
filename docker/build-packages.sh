#!/bin/bash

cd /builder
#nvm use
node ./dist/builder.js --packagelist_path=/repository-builder/packagelist.txt --repository_dir=/repository --build_dir=/repository-builder
