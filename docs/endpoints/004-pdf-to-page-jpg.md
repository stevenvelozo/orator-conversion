# PDF to Page JPG

The PDF to Page JPG endpoint extracts a single page from a PDF document
and renders it as a JPEG image using pdftoppm.

## Endpoint Information

| Property | Value |
|----------|-------|
| Method | `POST` |
| Default Route | `/conversion/1.0/pdf-to-page-jpg/:Page` |
| Converter Path | `pdf-to-page-jpg/:Page` |
| Input Content Type | `application/octet-stream` |
| Output Content Type | `image/jpeg` |

## Usage

```bash
# Extract page 1
curl -X POST --data-binary @document.pdf \
	-H "Content-Type: application/octet-stream" \
	http://localhost:8080/conversion/1.0/pdf-to-page-jpg/1 \
	-o page1.jpg

# Extract page 3
curl -X POST --data-binary @document.pdf \
	-H "Content-Type: application/octet-stream" \
	http://localhost:8080/conversion/1.0/pdf-to-page-jpg/3 \
	-o page3.jpg
```

## Route Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `:Page` | integer | The 1-based page number to extract (must be >= 1) |

## How It Works

1. The client sends a PDF file as raw binary data in the POST body
2. The page number is parsed from the URL parameter
3. The PDF buffer is written to a temporary file
4. `pdftoppm` renders the specified page at 150 DPI as JPEG
5. The JPEG output is read back into a buffer
6. Temporary files are cleaned up
7. The JPEG buffer is returned with `Content-Type: image/jpeg`

## System Dependencies

This endpoint requires `pdftoppm` from the poppler-utils package:

```bash
# macOS
brew install poppler

# Debian/Ubuntu
apt-get install poppler-utils
```

The path to pdftoppm can be configured via the `PdftoppmPath` setting.

## Response

### Success (200)

Returns the rendered page as a JPEG image.

| Header | Value |
|--------|-------|
| `Content-Type` | `image/jpeg` |
| `Content-Length` | Size of the JPEG output in bytes |

### Error Responses

| Status | Condition | Response Body |
|--------|-----------|---------------|
| 400 | Empty request body | `{"error": "No file data provided in request body."}` |
| 413 | File exceeds MaxFileSize | `{"error": "File size exceeds maximum allowed size of ... bytes."}` |
| 500 | Invalid page number (0, negative, or non-integer) | `{"error": "Conversion failed: Invalid page number. Must be a positive integer."}` |
| 500 | Page number exceeds document page count | `{"error": "Conversion failed: pdftoppm failed: ..."}` |
| 500 | Invalid PDF data | `{"error": "Conversion failed: pdftoppm failed: ..."}` |

## Notes

- Pages are rendered at 150 DPI by default
- JPEG output will be smaller than the equivalent PNG but with lossy compression
- The rendering process has a 30-second timeout
- Page numbering is 1-based (first page is 1, not 0)
- Temporary files are created in the system temp directory and cleaned up after each request

## Related Documentation

- [PDF to Page PNG](003-pdf-to-page-png.md) - Same extraction in PNG format
- [Configuration](../configuration.md) - PdftoppmPath and MaxFileSize settings
