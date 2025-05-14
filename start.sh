#!/bin/sh

# Extract the version from package.json
PACKAGE_VERSION=$(cat ./package.json | grep '"version"' | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')

# Define the Docker image name
IMAGE="smart-car-api:${PACKAGE_VERSION}"

# Build the Docker image
docker build -t ${IMAGE} .

# Stop and remove the old container
docker stop smart-car-api || true
docker rm smart-car-api || true

# Run the new container
docker run --restart=always -d -p 3030:3000 --name smart-car-api ${IMAGE}

# Keep only the 3 most recent versions
echo "Cleaning up old images, keeping only the 3 most recent..."
docker images --format "{{.Repository}}:{{.Tag}}" | 
  grep "^smart-car-api:" | 
  sort -r | 
  tail -n +4 | 
  xargs -r docker rmi

echo "Deployment completed successfully!"