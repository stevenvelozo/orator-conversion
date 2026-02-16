# JPG to PNG

The JPG to PNG endpoint converts JPEG images to PNG format using the
Sharp image processing library.

## Endpoint Information

| Property | Value |
|----------|-------|
| Method | `POST` |
| Default Route | `/conversion/1.0/image/jpg-to-png` |
| Converter Path | `image/jpg-to-png` |
| Input Content Type | `application/octet-stream` |
| Output Content Type | `image/png` |

## Usage

```bash
curl -X POST --data-binary @photo.jpg \
	-H "Content-Type: application/octet-stream" \
	http://localhost:8080/conversion/1.0/image/jpg-to-png \
	-o photo.png
```

## How It Works

1. The client sends a JPEG image as raw binary data in the POST body
2. The service collects the request body and validates the file size
3. Sharp decodes the JPEG buffer and re-encodes it as PNG
4. The PNG buffer is returned with `Content-Type: image/png`

## Response

### Success (200)

Returns the converted PNG image as binary data.

| Header | Value |
|--------|-------|
| `Content-Type` | `image/png` |
| `Content-Length` | Size of the PNG output in bytes |

### Error Responses

| Status | Condition | Response Body |
|--------|-----------|---------------|
| 400 | Empty request body | `{"error": "No file data provided in request body."}` |
| 413 | File exceeds MaxFileSize | `{"error": "File size exceeds maximum allowed size of ... bytes."}` |
| 500 | Invalid image data | `{"error": "Conversion failed: ..."}` |

## Notes

- PNG output is lossless, so the output file will typically be larger than the JPEG input
- The conversion preserves image dimensions and color data
- Transparent pixels are not present in JPEG input, so the output PNG will have no transparency

## Related Documentation

- [PNG to JPG](002-png-to-jpg.md) - The reverse conversion
- [Configuration](../configuration.md) - MaxFileSize and route settings
