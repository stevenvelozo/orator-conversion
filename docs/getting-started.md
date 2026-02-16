# Getting Started

## Installation

```bash
npm install orator-conversion
```

### System Dependencies

PDF page extraction requires `pdftoppm` (part of the poppler-utils package):

```bash
# macOS
brew install poppler

# Debian/Ubuntu
apt-get install poppler-utils
```

## Basic Setup

```javascript
const libFable = require('fable');
const libOrator = require('orator');
const libOratorServiceServerRestify = require('orator-serviceserver-restify');
const libOratorFileTranslation = require('orator-conversion');

const _Fable = new libFable({
	Product: 'MyConversionServer',
	APIServerPort: 8080
});

// Register service types
_Fable.serviceManager.addServiceType('Orator', libOrator);
_Fable.serviceManager.addServiceType('OratorServiceServer', libOratorServiceServerRestify);
_Fable.serviceManager.addServiceType('OratorFileTranslation', libOratorFileTranslation);

// Instantiate services
_Fable.serviceManager.instantiateServiceProvider('Orator');
_Fable.serviceManager.instantiateServiceProvider('OratorServiceServer');
_Fable.serviceManager.instantiateServiceProvider('OratorFileTranslation');

// Start and connect routes
_Fable.Orator.startService(
	() =>
	{
		_Fable.OratorFileTranslation.connectRoutes();
		console.log('Conversion server running on port 8080');
	});
```

## Adding Custom Converters

You can register custom converters before calling `connectRoutes()`:

```javascript
const tmpFileTranslation = _Fable.serviceManager.instantiateServiceProvider('OratorFileTranslation');

// Add a custom converter
tmpFileTranslation.addConverter('document/csv-to-json',
	(pInputBuffer, pRequest, fCallback) =>
	{
		try
		{
			let tmpCSV = pInputBuffer.toString('utf8');
			let tmpJSON = parseCSV(tmpCSV);
			return fCallback(null, Buffer.from(JSON.stringify(tmpJSON)), 'application/json');
		}
		catch (pError)
		{
			return fCallback(pError);
		}
	});

// Then start Orator and connect routes
_Fable.Orator.startService(
	() =>
	{
		tmpFileTranslation.connectRoutes();
		// Now available: POST /conversion/1.0/document/csv-to-json
	});
```

## Using the Endpoints

All endpoints are versioned. Send file data as the raw request body:

```bash
# Convert JPG to PNG
curl -X POST --data-binary @photo.jpg \
	-H "Content-Type: application/octet-stream" \
	http://localhost:8080/conversion/1.0/image/jpg-to-png \
	-o photo.png

# Convert PNG to JPG
curl -X POST --data-binary @image.png \
	-H "Content-Type: application/octet-stream" \
	http://localhost:8080/conversion/1.0/image/png-to-jpg \
	-o image.jpg

# Extract page 1 from a PDF as PNG
curl -X POST --data-binary @document.pdf \
	-H "Content-Type: application/octet-stream" \
	http://localhost:8080/conversion/1.0/pdf-to-page-png/1 \
	-o page1.png

# Extract page 3 from a PDF as JPEG
curl -X POST --data-binary @document.pdf \
	-H "Content-Type: application/octet-stream" \
	http://localhost:8080/conversion/1.0/pdf-to-page-jpg/3 \
	-o page3.jpg
```
