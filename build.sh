#!/bin/bash
echo "Building BPMN Designer monolithic container..."
docker build -t bpmn-designer:latest .
echo "Build complete!"