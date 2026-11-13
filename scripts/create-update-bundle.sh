#!/bin/bash

# Script to create OTA update bundle for Capawesome Live Update
# This bundle will be hosted on Vercel and downloaded by the app

echo "🔨 Building app..."
npm run build -- --mode capacitor

echo "📦 Creating update bundle..."
cd dist

# Create bundle.zip from the dist folder
zip -r ../public/updates/bundle.zip ./*

cd ..

echo "✅ Update bundle created at public/updates/bundle.zip"
echo "📤 This will be deployed to Vercel and accessible at:"
echo "   https://yfit-deploy.vercel.app/updates/bundle.zip"
