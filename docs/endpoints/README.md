# Endpoints

Orator File Translation registers HTTP POST endpoints for file format
conversion. Each endpoint accepts raw binary data in the request body
and returns the converted file in the response.

## Endpoint Reference

| # | Endpoint | Input | Output | Description |
|---|----------|-------|--------|-------------|
| 001 | [JPG to PNG](001-jpg-to-png.md) | JPEG image | PNG image | Convert JPEG images to PNG format |
| 002 | [PNG to JPG](002-png-to-jpg.md) | PNG image | JPEG image | Convert PNG images to JPEG format |
| 003 | [PDF to Page PNG](003-pdf-to-page-png.md) | PDF document | PNG image | Extract a PDF page as a PNG image |
| 004 | [PDF to Page JPG](004-pdf-to-page-jpg.md) | PDF document | JPEG image | Extract a PDF page as a JPEG image |

## Endpoint Categories

### Image Conversion

Convert between common image formats using Sharp:

- **[JPG to PNG](001-jpg-to-png.md)** - Lossless output from lossy input
- **[PNG to JPG](002-png-to-jpg.md)** - Lossy compression from lossless input

### PDF Page Extraction

Extract individual pages from PDF documents as images using pdftoppm:

- **[PDF to Page PNG](003-pdf-to-page-png.md)** - Lossless page extraction
- **[PDF to Page JPG](004-pdf-to-page-jpg.md)** - Lossy page extraction

## Route Structure

All endpoints follow the same versioned route pattern:

```
POST {RoutePrefix}/{Version}/{converterPath}
```

With default settings this becomes:

```
POST /conversion/1.0/{converterPath}
```

## Common Request Format

All endpoints accept binary data via HTTP POST:

```bash
curl -X POST --data-binary @inputfile \
	-H "Content-Type: application/octet-stream" \
	http://localhost:8080/conversion/1.0/{converterPath} \
	-o outputfile
```

## Common Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Conversion successful, response body contains the converted file |
| 400 | No file data provided in the request body |
| 413 | File exceeds the configured maximum file size |
| 500 | Conversion failed (invalid input data, missing dependencies, etc.) |

## Custom Endpoints

You can register additional endpoints using `addConverter()`. See the
[API Reference](../api-reference.md) for details.

## Related Documentation

- [Getting Started](../getting-started.md) - Setup and installation
- [Configuration](../configuration.md) - Route prefix, version, and size limits
- [API Reference](../api-reference.md) - Full method documentation
