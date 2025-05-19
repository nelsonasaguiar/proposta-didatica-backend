#!/bin/sh

# Extract the version from package.json
PACKAGE_VERSION=$(cat ./package.json | grep '"version"' | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')

# Define the Docker image name
IMAGE="proposta-didatica-backend:${PACKAGE_VERSION}"

# Build the Docker image
docker build -t ${IMAGE} .

# Stop and remove the old container
docker stop proposta-didatica-backend || true
docker rm proposta-didatica-backend || true

# Run the new container
docker run --restart=always --network backend-network -d -p 3030:3000 --name proposta-didatica-backend ${IMAGE}

# Keep only the 3 most recent versions
echo "Cleaning up old images, keeping only the 3 most recent..."
docker images --format "{{.Repository}}:{{.Tag}}" | 
  grep "^proposta-didatica-backend:" | 
  sort -r | 
  tail -n +4 | 
  xargs -r docker rmi

echo "Deployment completed successfully!"