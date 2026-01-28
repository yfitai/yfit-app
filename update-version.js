#!/usr/bin/env node

/**
 * Auto-update version.json timestamp
 * Run this before every deployment to trigger the update banner
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionPath = path.join(__dirname, 'public', 'version.json');

try {
  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  
  // Update timestamp to current time
  versionData.timestamp = new Date().toISOString();
  
  // Write back to file
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2) + '\n');
  
  console.log('✅ version.json updated:', versionData.timestamp);
} catch (error) {
  console.error('❌ Error updating version.json:', error.message);
  process.exit(1);
}
