#!/usr/bin/env python3
"""Find components with significant UI text but no useTranslation import."""
import os
import re

dirs = ['src/components', 'src/pages']
results = []

for d in dirs:
    if not os.path.exists(d):
        continue
    for fname in sorted(os.listdir(d)):
        if not fname.endswith('.jsx') and not fname.endswith('.tsx'):
            continue
        path = os.path.join(d, fname)
        with open(path, encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Count JSX text content lines (lines with >Capital letter or placeholder="Capital)
        text_lines = len(re.findall(r'>[A-Z][a-z]|placeholder="[A-Z]', content))
        has_i18n = 'useTranslation' in content
        
        if text_lines > 3 and not has_i18n:
            results.append((path, text_lines))

if results:
    print("Components with UI text but NO useTranslation:")
    for path, count in results:
        print(f"  {path} ({count} text occurrences)")
else:
    print("All components with significant UI text have useTranslation!")
