# Food Search Investigation — August 23, 2026

## Reproduction

The deployed endpoint `https://app.yfitai.com/api/food/search?query=apple` returned HTTP 400 with:

```json
{"error":"Failed to fetch from USDA FoodData Central","status":400}
```

The YFIT endpoint delegates to the USDA FoodData Central food-search endpoint at `https://api.nal.usda.gov/fdc/v1/foods/search`.

## Official API confirmation

USDA documents both GET and POST for `/v1/foods/search`. Its POST example accepts `dataType` as a JSON array; this is a safer request shape for YFIT’s multi-dataset query than repeating `dataType` in a query string. USDA requires a data.gov API key on each request and identifies HTTP 429—not HTTP 400—as its documented rate-limit response.

Sources:

- [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide)
- [USDA FoodData Central OpenAPI specification](https://fdc.nal.usda.gov/api-spec/fdc_api.html)

## Next diagnostic step

Inspect the active Vercel `USDA_API_KEY` configuration and test the documented POST request shape before replacing the deployed GET proxy implementation. Do not expose keys in logs or documentation.
