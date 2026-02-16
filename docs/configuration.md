# Configuration

## Constructor Options

Pass options when instantiating the service:

```javascript
_Fable.serviceManager.instantiateServiceProvider('OratorFileTranslation',
	{
		RoutePrefix: '/api/convert',
		Version: '2.0',
		LogLevel: 2,
		MaxFileSize: 5 * 1024 * 1024,  // 5MB
		PdftkPath: '/usr/local/bin/pdftk',
		PdftoppmPath: '/usr/local/bin/pdftoppm'
	});
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `RoutePrefix` | string | `"/conversion"` | URL prefix for all conversion endpoints |
| `Version` | string | `"1.0"` | Version segment in route URLs |
| `LogLevel` | number | `0` | Logging verbosity (0 = quiet, higher = more output) |
| `MaxFileSize` | number | `10485760` | Maximum upload size in bytes (default 10MB) |
| `PdftkPath` | string | `"pdftk"` | Path to the pdftk binary |
| `PdftoppmPath` | string | `"pdftoppm"` | Path to the pdftoppm binary |

## Fable Settings Fallback

When options are not provided, the service checks Fable settings:

```javascript
const _Fable = new libFable({
	Product: 'MyServer',
	APIServerPort: 8080,
	OratorFileTranslationRoutePrefix: '/api/convert',
	OratorFileTranslationVersion: '2.0',
	OratorFileTranslationLogLevel: 1,
	OratorFileTranslationMaxFileSize: 20 * 1024 * 1024,
	OratorFileTranslationPdftkPath: '/usr/local/bin/pdftk',
	OratorFileTranslationPdftoppmPath: '/usr/local/bin/pdftoppm'
});
```

| Fable Setting | Maps To |
|---------------|---------|
| `OratorFileTranslationRoutePrefix` | `RoutePrefix` |
| `OratorFileTranslationVersion` | `Version` |
| `OratorFileTranslationLogLevel` | `LogLevel` |
| `OratorFileTranslationMaxFileSize` | `MaxFileSize` |
| `OratorFileTranslationPdftkPath` | `PdftkPath` |
| `OratorFileTranslationPdftoppmPath` | `PdftoppmPath` |

## Configuration Priority

Settings are resolved in this order:

1. **Constructor options** (highest priority)
2. **Fable settings**
3. **Default values** (lowest priority)

## JSON Configuration File

When using a Fable configuration file:

```json
{
	"Product": "MyConversionServer",
	"APIServerPort": 8080,
	"OratorFileTranslationRoutePrefix": "/conversion",
	"OratorFileTranslationVersion": "1.0",
	"OratorFileTranslationLogLevel": 0,
	"OratorFileTranslationMaxFileSize": 10485760,
	"OratorFileTranslationPdftkPath": "pdftk",
	"OratorFileTranslationPdftoppmPath": "pdftoppm"
}
```
