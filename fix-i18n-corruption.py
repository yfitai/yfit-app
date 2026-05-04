#!/usr/bin/env python3
"""Fix corrupted lines in i18nResources.js caused by bad find/replace edits."""

with open('src/lib/i18nResources.js', 'r') as f:
    lines = f.readlines()

fixes = {
    # French: line 835 (0-indexed: 834) — merged two keys on one line, also has duplicate dailyGoal on 834
    # Fix: remove the stray second half of line 835, keep only bpGoal
    835: '        "bpGoal": "Objectif TA",\n',

    # Spanish: line 1354 (0-indexed: 1353) — stray Portuguese dailyGoal
    # Fix: replace with Spanish readMore keys
    1354: '        "readMore": "Leer",\n',
    1355: '        "showLess": "Menos",\n',
    1356: '        "readTheResearch": "Leer la investigación",\n',
    1357: '        "showLessResearch": "Mostrar menos",\n',
    1358: '        "fullArticle": "Artículo completo",\n',
    1359: '        "source": "Fuente",\n',
    1360: '        "categoryNutrition": "Nutrición",\n',
    1361: '        "categoryFitness": "Fitness",\n',
    1362: '        "categoryRecovery": "Recuperación",\n',
    1363: '        "categoryMentalHealth": "Salud mental",\n',
    1364: '        "categoryWellness": "Bienestar",\n',
    1365: '      },\n',
    1366: '      "medications": {\n',

    # Portuguese: line 1873 (0-indexed: 1872) — stray Spanish dailyGoal
    # Fix: replace with Portuguese readMore keys
    1873: '        "readMore": "Ler",\n',
    1874: '        "showLess": "Menos",\n',
    1875: '        "readTheResearch": "Ler a pesquisa",\n',
    1876: '        "showLessResearch": "Mostrar menos",\n',
    1877: '        "fullArticle": "Artigo completo",\n',
    1878: '        "source": "Fonte",\n',
    1879: '        "categoryNutrition": "Nutrição",\n',
    1880: '        "categoryFitness": "Fitness",\n',
    1881: '        "categoryRecovery": "Recuperação",\n',
    1882: '        "categoryMentalHealth": "Saúde mental",\n',
    1883: '        "categoryWellness": "Bem-estar",\n',
    1884: '      },\n',
    1885: '      "medications": {\n',
    # Line 1886 has "medications":: (double colon) — fix it
    1886: '        "title": "Medicamentos",\n',
}

# Apply fixes (line numbers are 1-indexed)
for line_num, new_content in fixes.items():
    idx = line_num - 1
    print(f"Fixing line {line_num}: {lines[idx].rstrip()!r}")
    print(f"  -> {new_content.rstrip()!r}")
    lines[idx] = new_content

# Also need to remove the duplicate dailyGoal on line 834 (French already has it on 834)
# Line 834 is "dailyGoal": "Objectif quotidien" — that's correct, keep it
# Line 835 was the merged line — now fixed to just bpGoal

# Check for the double-colon medications line
for i, line in enumerate(lines, 1):
    if '"medications"::' in line:
        print(f"Found double-colon on line {i}: {line.rstrip()!r}")
        lines[i-1] = line.replace('"medications"::', '"medications":')
        print(f"  Fixed to: {lines[i-1].rstrip()!r}")

with open('src/lib/i18nResources.js', 'w') as f:
    f.writelines(lines)

print("\nDone. Verifying no more corruptions...")

# Verify
with open('src/lib/i18nResources.js') as f:
    content = f.read()

issues = []
if '"medications"::' in content:
    issues.append('Still has double-colon medications')
if '"bpGoal": "Objectif TA",        "dailyGoal"' in content:
    issues.append('Still has merged French line')

for line in content.split('\n'):
    import re
    keys = re.findall(r'"(\w+)":', line)
    if len(keys) > 1:
        issues.append(f'Line with multiple keys: {line.strip()!r}')

if issues:
    print("REMAINING ISSUES:")
    for issue in issues:
        print(f"  - {issue}")
else:
    print("All corruptions fixed!")
