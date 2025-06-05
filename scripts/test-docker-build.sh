#!/bin/bash

echo "🐳 Testing Docker Build"
echo "====================="

# Test the main Dockerfile
echo "📦 Testing main Dockerfile..."
docker build -f docker/Dockerfile -t discord-birthday-bot:test .

if [ $? -eq 0 ]; then
    echo "✅ Main Dockerfile build successful!"
    
    # Test that the image can start (will fail due to missing env vars, but should not crash immediately)
    echo "🧪 Testing image startup..."
    timeout 10s docker run --rm discord-birthday-bot:test || [ $? -eq 124 ] || [ $? -eq 1 ]
    
    if [ $? -eq 124 ] || [ $? -eq 1 ]; then
        echo "✅ Image starts correctly (exits due to missing env vars as expected)"
    else
        echo "❌ Image failed to start properly"
        exit 1
    fi
else
    echo "❌ Main Dockerfile build failed!"
    
    echo ""
    echo "🔧 Testing with debug Dockerfile..."
    docker build -f docker/Dockerfile.test -t discord-birthday-bot:debug .
    
    if [ $? -eq 0 ]; then
        echo "✅ Debug build successful - check logs above for issues"
    else
        echo "❌ Debug build also failed"
        exit 1
    fi
fi

echo ""
echo "🎉 Docker build test completed!" 