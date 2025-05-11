#!/bin/sh

# Extract the version from package.json
PACKAGE_VERSION=$(cat ./package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')

# Define the Docker image name
IMAGE="propostadidatica-vm:${PACKAGE_VERSION}"

# Build the Docker image
docker build -t ${IMAGE} .

# Stop and remove the old container
docker stop proposta-didatica || true
docker rm proposta-didatica || true

# Run the new container
docker run --restart=always -d -p 3030:3030 --name proposta-didatica ${IMAGE}