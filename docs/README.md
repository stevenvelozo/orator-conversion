# Orator File Translation

> File format conversion endpoints for Orator service servers

Orator File Translation adds file format conversion endpoints to an Orator web server. Upload a file via HTTP POST and receive the converted file in the response. All routes are versioned.

## Features

- **Image Conversion** - Convert between JPG and PNG formats
- **PDF Page Extraction** - Extract individual pages from PDFs as PNG or JPEG
- **Versioned Routes** - All endpoints include a configurable version segment
- **Extensible** - Add custom converters for any file format
- **Configurable** - Route prefix, version, logging, and file size limits
- **Fable Service** - Standard Fable service provider pattern

## How It Works

```
Client                     Orator Server                  pdftoppm/Sharp
  |                             |                            |
  |  POST /conversion/1.0/     |                            |
  |  image/jpg-to-png           |                            |
  |  [binary JPEG data]        |                            |
  | --------------------------> |                            |
  |                             |  sharp(buffer).png()       |
  |                             | -------------------------> |
  |                             |                            |
  |                             |  [PNG buffer]              |
  |                             | <------------------------- |
  |  200 OK                    |                            |
  |  Content-Type: image/png   |                            |
  |  [binary PNG data]         |                            |
  | <-------------------------- |                            |
```

## Quick Start

```javascript
const libFable = require('fable');
const libOrator = require('orator');
const libOratorServiceServerRestify = require('orator-serviceserver-restify');
const libOratorFileTranslation = require('orator-conversion');

const _Fable = new libFable({
	Product: 'MyConversionServer',
	APIServerPort: 8080
});

_Fable.serviceManager.addServiceType('Orator', libOrator);
_Fable.serviceManager.addServiceType('OratorServiceServer', libOratorServiceServerRestify);
_Fable.serviceManager.instantiateServiceProvider('Orator');
_Fable.serviceManager.instantiateServiceProvider('OratorServiceServer');

_Fable.serviceManager.addServiceType('OratorFileTranslation', libOratorFileTranslation);
_Fable.serviceManager.instantiateServiceProvider('OratorFileTranslation');

_Fable.Orator.startService(
	() =>
	{
		_Fable.OratorFileTranslation.connectRoutes();
	});
```

## Related Packages

- [orator](https://github.com/stevenvelozo/orator) - Main Orator service abstraction
- [orator-serviceserver-restify](https://github.com/stevenvelozo/orator-serviceserver-restify) - Restify service server
- [fable](https://github.com/stevenvelozo/fable) - Service provider framework
