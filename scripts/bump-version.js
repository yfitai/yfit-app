#!/usr/bin/env node

/**
 * Auto-increment build version
 * This runs during Vercel build to ensure Android app gets latest version
 */

const fs = require('fs');
const path = require('path');

const versionPath = path.join(__dirname, '../public/version.json');

try {
  // Read current version
  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  
  // Increment build number
  const newBuildNumber = (versionData.buildNumber || 0) + 1;
  
  // Calculate new version (major.minor.patch where patch = buildNumber - 1)
  const [major, minor] = versionData.version.split('.').slice(0, 2);
  const newVersion = `${major}.${minor}.${newBuildNumber - 1}`;
  
  // Update version data
  versionData.version = newVersion;
  versionData.buildNumber = newBuildNumber;
  versionData.timestamp = new Date().toISOString();
  
  // Write updated version
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2) + '\n');
  
  console.log(`✅ Version bumped to ${newVersion} (build ${newBuildNumber})`);
} catch (error) {
  console.error('❌ Failed to bump version:', error.message);
  // Don't fail the build if version bump fails
  process.exit(0);
}
