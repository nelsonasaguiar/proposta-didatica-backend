#!/bin/sh

# Extract the version from package.json
# PACKAGE_VERSION=$(cat ./package.json | grep '"version"' | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')

# Define the Docker image name
IMAGE="smart-car-api:latest"

# Build the Docker image
docker build -t ${IMAGE} .

# Stop and remove the old container
docker stop smart-car-api || true
docker rm smart-car-api || true

# Run the new container
docker run --restart=always -d -p 3030:3000 --name smart-car-api ${IMAGE}