# YFIT Dev Notes

## Food Search — Critical Findings (March 2, 2026)

### Current Working Architecture
- **Sequential** calls: Open Food Facts first, then USDA. DO NOT change to parallel.
- OFF uses Vercel proxy → `world.openfoodfacts.org/cgi/search.pl` (v1 API, no language filter)
- USDA uses Vercel proxy → `api.nal.usda.gov/fdc/v1/foods/search`
- Client-side filtering: only blocks CJK/Arabic/Cyrillic scripts + 2 specific brands
- Relevance threshold: > 5 score

### DO NOT DO — Parallel Calls (Promise.all)
Switching USDA + OFF to `Promise.all()` **breaks bread and chicken breast searches** — 
they return all USDA with no branded results. Root cause unclear but consistently reproducible.
Always keep calls sequential.

### DO NOT DO — CapacitorHttp for OFF Search
Using `CapacitorHttp.get()` to call `us.openfoodfacts.org/api/v2/search` directly 
(bypassing the Vercel proxy) causes timeouts for most queries except "bread".
The Vercel proxy calling `world.openfoodfacts.org/cgi/search.pl` is reliable.

### DO NOT DO — Aggressive Accented Char Filter
Blocking any product name with a single accented character removes too many 
Canadian bilingual products (e.g. "Poitrine de poulet"). Only block if needed.

### Safe Changes Made Today
- USDA results now show real brand names (Tyson, Jennie-O, Prairie Farms, etc.)
- Unbranded USDA items show "Whole Food" badge instead of "USDA"

### Search Speed
- Currently sequential and slightly slow but stable and correct
- Do not attempt to speed up without thorough isolated testing
