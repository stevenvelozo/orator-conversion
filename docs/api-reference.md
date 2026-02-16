# API Reference

## Class: OratorFileTranslation

Extends `fable-serviceproviderbase`. Provides file format conversion
endpoints for an Orator web server.

### Constructor

```javascript
new OratorFileTranslation(pFable, pOptions, pServiceHash)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `pFable` | object | The Fable instance for the application |
| `pOptions` | object | Configuration options (see [Configuration](configuration.md)) |
| `pServiceHash` | string | The service identifier hash |

Typically instantiated through the Fable service manager:

```javascript
_Fable.serviceManager.addServiceType('OratorFileTranslation', libOratorFileTranslation);
_Fable.serviceManager.instantiateServiceProvider('OratorFileTranslation', {});
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `serviceType` | string | `"OratorFileTranslation"` | Service type identifier |
| `RoutePrefix` | string | `"/conversion"` | URL prefix for all endpoints |
| `Version` | string | `"1.0"` | Version segment in route URLs |
| `LogLevel` | number | `0` | Logging verbosity |
| `MaxFileSize` | number | `10485760` | Maximum upload size in bytes |
| `PdftkPath` | string | `"pdftk"` | Path to the pdftk binary |
| `PdftoppmPath` | string | `"pdftoppm"` | Path to the pdftoppm binary |
| `converters` | object | `{}` | Registry of converter functions (populated by `initializeDefaultConverters`) |

## Methods

### connectRoutes()

Register POST endpoints on the Orator service server for each converter
in the registry. Call this after Orator has been started.

**Returns:** `boolean` - `true` if routes were registered, `false` if
Orator is not available.

```javascript
_Fable.Orator.startService(
	() =>
	{
		_Fable.OratorFileTranslation.connectRoutes();
	});
```

Routes are versioned: `{RoutePrefix}/{Version}/{converterPath}`

### addConverter(pPath, fConverter)

Register a custom converter function for a given path segment. The path
becomes part of the endpoint URL. Call this before `connectRoutes()`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pPath` | string | Path segment (e.g. `'image/jpg-to-png'` or `'pdf-to-page-png/:Page'`) |
| `fConverter` | function | Converter function |

The converter function signature is:

```javascript
function(pInputBuffer, pRequest, fCallback)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `pInputBuffer` | Buffer | The raw file data from the request body |
| `pRequest` | object | The HTTP request object (use `pRequest.params` for route parameters) |
| `fCallback` | function | Callback: `fCallback(pError, pOutputBuffer, pContentType)` |

**Example:**

```javascript
_Fable.OratorFileTranslation.addConverter('document/csv-to-json',
	(pInputBuffer, pRequest, fCallback) =>
	{
		let tmpCSV = pInputBuffer.toString('utf8');
		let tmpJSON = convertCSVToJSON(tmpCSV);
		return fCallback(null, Buffer.from(JSON.stringify(tmpJSON)), 'application/json');
	});
```

### initializeDefaultConverters()

Register the built-in converters (JPG to PNG, PNG to JPG, PDF to Page PNG,
PDF to Page JPG). Called automatically by the constructor.

### collectRequestBody(pRequest, fCallback)

Collect the raw request body from the HTTP stream, enforcing the
MaxFileSize limit.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pRequest` | object | The incoming HTTP request |
| `fCallback` | function | Callback: `fCallback(pError, pBuffer)` |

If the request body has already been parsed as a Buffer (e.g. by a body
parser middleware), it is used directly. Otherwise the body is collected
from the stream.

### extractPdfPage(pPdfBuffer, pPageNumber, fCallback)

Extract a single page from a PDF buffer using pdftk, returning the
single-page PDF as a buffer.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pPdfBuffer` | Buffer | The input PDF buffer |
| `pPageNumber` | number | The 1-based page number to extract |
| `fCallback` | function | Callback: `fCallback(pError, pSinglePagePdfBuffer)` |

Requires `pdftk` to be installed and accessible at the configured
`PdftkPath`.

### renderPdfPageToImage(pPdfBuffer, pPageNumber, pFormat, fCallback)

Render a specific page of a PDF to an image buffer. Uses pdftoppm to
rasterize the page at 150 DPI.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pPdfBuffer` | Buffer | The input PDF buffer |
| `pPageNumber` | number | The 1-based page number to render |
| `pFormat` | string | Output format: `'png'` or `'jpeg'` |
| `fCallback` | function | Callback: `fCallback(pError, pImageBuffer)` |

Requires `pdftoppm` to be installed and accessible at the configured
`PdftoppmPath`.

## Related Documentation

- [Getting Started](getting-started.md) - Setup and installation
- [Configuration](configuration.md) - All configuration options
- [Endpoints](endpoints/) - Built-in endpoint reference
