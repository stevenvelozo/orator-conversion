# PNG to JPG

The PNG to JPG endpoint converts PNG images to JPEG format using the
Sharp image processing library.

## Endpoint Information

| Property | Value |
|----------|-------|
| Method | `POST` |
| Default Route | `/conversion/1.0/image/png-to-jpg` |
| Converter Path | `image/png-to-jpg` |
| Input Content Type | `application/octet-stream` |
| Output Content Type | `image/jpeg` |

## Usage

```bash
curl -X POST --data-binary @image.png \
	-H "Content-Type: application/octet-stream" \
	http://localhost:8080/conversion/1.0/image/png-to-jpg \
	-o image.jpg
```

## How It Works

1. The client sends a PNG image as raw binary data in the POST body
2. The service collects the request body and validates the file size
3. Sharp decodes the PNG buffer and re-encodes it as JPEG
4. The JPEG buffer is returned with `Content-Type: image/jpeg`

## Response

### Success (200)

Returns the converted JPEG image as binary data.

| Header | Value |
|--------|-------|
| `Content-Type` | `image/jpeg` |
| `Content-Length` | Size of the JPEG output in bytes |

### Error Responses

| Status | Condition | Response Body |
|--------|-----------|---------------|
| 400 | Empty request body | `{"error": "No file data provided in request body."}` |
| 413 | File exceeds MaxFileSize | `{"error": "File size exceeds maximum allowed size of ... bytes."}` |
| 500 | Invalid image data | `{"error": "Conversion failed: ..."}` |

## Notes

- JPEG is a lossy format, so some image quality is lost during conversion
- Any transparency in the PNG input will be flattened (alpha channel is removed)
- The output file will typically be smaller than the PNG input

## Related Documentation

- [JPG to PNG](001-jpg-to-png.md) - The reverse conversion
- [Configuration](../configuration.md) - MaxFileSize and route settings
