/**
* Unit tests for Orator File Translation - HTTP Integration
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

const Chai = require("chai");
const Expect = Chai.expect;

const libHTTP = require('http');

const libFable = require('fable');
const libOrator = require('orator');
const libOratorServiceServerRestify = require('orator-serviceserver-restify');
const libOratorFileTranslation = require('../source/Orator-File-Translation.js');

const libSharp = require('sharp');

const defaultFableSettings = (
	{
		Product: 'OratorFileTranslation-IntegrationTests',
		ProductVersion: '0.0.0',
		APIServerPort: 0
	});

/**
 * Helper that creates a Fable + Orator + Restify + FileTranslation harness,
 * starts the service, then calls back with the harness and the actual port.
 *
 * @param {object} pFableSettings - Fable settings to merge with defaults.
 * @param {object} pFileTranslationOptions - Options for the file translation instance.
 * @param {Function} fCallback - Called with (pHarness) after the service starts.
 */
function createStartedHarness(pFableSettings, pFileTranslationOptions, fCallback)
{
	let tmpFableSettings = Object.assign({}, defaultFableSettings, pFableSettings || {});
	let tmpFable = new libFable(tmpFableSettings);

	tmpFable.serviceManager.addServiceType('OratorServiceServer', libOratorServiceServerRestify);
	tmpFable.serviceManager.addServiceType('Orator', libOrator);
	tmpFable.serviceManager.addServiceType('OratorFileTranslation', libOratorFileTranslation);

	let tmpRestifyServer = tmpFable.serviceManager.instantiateServiceProvider('OratorServiceServer', {});
	let tmpOrator = tmpFable.serviceManager.instantiateServiceProvider('Orator', {});
	let tmpFileTranslation = tmpFable.serviceManager.instantiateServiceProvider('OratorFileTranslation', pFileTranslationOptions || {});

	let tmpResult = (
		{
			fable: tmpFable,
			orator: tmpOrator,
			restifyServer: tmpRestifyServer,
			fileTranslation: tmpFileTranslation,
			port: 0
		});

	tmpOrator.startService(
		() =>
		{
			tmpFileTranslation.connectRoutes();
			// Get the actual port from the restify server
			tmpResult.port = tmpRestifyServer.server.address().port;
			return fCallback(tmpResult);
		});
}

/**
 * POST binary data to an endpoint and collect the response.
 *
 * @param {number} pPort - The port to connect to.
 * @param {string} pPath - The URL path.
 * @param {Buffer} pBuffer - The binary body to send.
 * @param {Function} fCallback - Called with (pError, pResponse, pBody).
 */
function postBinaryToEndpoint(pPort, pPath, pBuffer, fCallback)
{
	let tmpOptions =
		{
			hostname: '127.0.0.1',
			port: pPort,
			path: pPath,
			method: 'POST',
			headers:
				{
					'Content-Type': 'application/octet-stream',
					'Content-Length': pBuffer ? pBuffer.length : 0
				}
		};

	let tmpRequest = libHTTP.request(tmpOptions,
		(pResponse) =>
		{
			let tmpChunks = [];
			pResponse.on('data', (pChunk) => { tmpChunks.push(pChunk); });
			pResponse.on('end',
				() =>
				{
					let tmpBody = Buffer.concat(tmpChunks);
					return fCallback(null, pResponse, tmpBody);
				});
		});

	tmpRequest.on('error', (pError) => { return fCallback(pError); });

	if (pBuffer && pBuffer.length > 0)
	{
		tmpRequest.write(pBuffer);
	}

	tmpRequest.end();
}

/**
 * Generate a minimal JPEG test image buffer.
 */
function createTestJpegBuffer(fCallback)
{
	libSharp(
		{
			create:
				{
					width: 2,
					height: 2,
					channels: 3,
					background: { r: 255, g: 0, b: 0 }
				}
		}).jpeg().toBuffer().then(
		(pBuffer) => { return fCallback(null, pBuffer); },
		(pError) => { return fCallback(pError); });
}

/**
 * Generate a minimal PNG test image buffer.
 */
function createTestPngBuffer(fCallback)
{
	libSharp(
		{
			create:
				{
					width: 2,
					height: 2,
					channels: 4,
					background: { r: 0, g: 0, b: 255, alpha: 1 }
				}
		}).png().toBuffer().then(
		(pBuffer) => { return fCallback(null, pBuffer); },
		(pError) => { return fCallback(pError); });
}

/**
 * Generate a minimal single-page test PDF buffer.
 * This is a hand-crafted minimal PDF that pdftk can process.
 */
function createTestPdfBuffer(fCallback)
{
	let tmpPdf = '%PDF-1.4\n' +
		'1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
		'2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
		'3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]/Contents 4 0 R>>endobj\n' +
		'4 0 obj<</Length 44>>stream\n' +
		'1 0 0 rg\n' +
		'0 0 72 72 re\n' +
		'f\n' +
		'endstream\n' +
		'endobj\n' +
		'xref\n' +
		'0 5\n' +
		'0000000000 65535 f \n' +
		'0000000009 00000 n \n' +
		'0000000058 00000 n \n' +
		'0000000115 00000 n \n' +
		'0000000210 00000 n \n' +
		'trailer<</Root 1 0 R/Size 5>>\n' +
		'startxref\n' +
		'304\n' +
		'%%EOF';

	return fCallback(null, Buffer.from(tmpPdf));
}

suite
(
	'Orator File Translation HTTP Integration',
	() =>
	{
		suite
		(
			'JPG to PNG Conversion',
			() =>
			{
				test
				(
					'should convert a JPEG image to PNG format via versioned endpoint',
					(fDone) =>
					{
						createTestJpegBuffer(
							(pError, pJpegBuffer) =>
							{
								Expect(pError).to.equal(null);
								Expect(pJpegBuffer).to.be.an.instanceOf(Buffer);
								Expect(pJpegBuffer.length).to.be.greaterThan(0);

								createStartedHarness(null, null,
									(pHarness) =>
									{
										postBinaryToEndpoint(pHarness.port, '/conversion/1.0/image/jpg-to-png', pJpegBuffer,
											(pPostError, pResponse, pBody) =>
											{
												Expect(pPostError).to.equal(null);
												Expect(pResponse.statusCode).to.equal(200);
												Expect(pResponse.headers['content-type']).to.equal('image/png');
												Expect(pBody).to.be.an.instanceOf(Buffer);
												Expect(pBody.length).to.be.greaterThan(0);

												// Verify the output is actually a valid PNG by checking the magic bytes
												// PNG files start with: 137 80 78 71 13 10 26 10
												Expect(pBody[0]).to.equal(137);
												Expect(pBody[1]).to.equal(80);
												Expect(pBody[2]).to.equal(78);
												Expect(pBody[3]).to.equal(71);

												pHarness.orator.stopService(fDone);
											});
									});
							});
					}
				);
			}
		);

		suite
		(
			'PNG to JPG Conversion',
			() =>
			{
				test
				(
					'should convert a PNG image to JPEG format via versioned endpoint',
					(fDone) =>
					{
						createTestPngBuffer(
							(pError, pPngBuffer) =>
							{
								Expect(pError).to.equal(null);
								Expect(pPngBuffer).to.be.an.instanceOf(Buffer);

								createStartedHarness(null, null,
									(pHarness) =>
									{
										postBinaryToEndpoint(pHarness.port, '/conversion/1.0/image/png-to-jpg', pPngBuffer,
											(pPostError, pResponse, pBody) =>
											{
												Expect(pPostError).to.equal(null);
												Expect(pResponse.statusCode).to.equal(200);
												Expect(pResponse.headers['content-type']).to.equal('image/jpeg');
												Expect(pBody).to.be.an.instanceOf(Buffer);
												Expect(pBody.length).to.be.greaterThan(0);

												// Verify the output is actually a valid JPEG by checking the magic bytes
												// JPEG files start with: 0xFF 0xD8 0xFF
												Expect(pBody[0]).to.equal(0xFF);
												Expect(pBody[1]).to.equal(0xD8);
												Expect(pBody[2]).to.equal(0xFF);

												pHarness.orator.stopService(fDone);
											});
									});
							});
					}
				);
			}
		);

		suite
		(
			'PDF Page Extraction',
			() =>
			{
				test
				(
					'should extract page 1 from a PDF and return as PNG',
					(fDone) =>
					{
						createTestPdfBuffer(
							(pError, pPdfBuffer) =>
							{
								Expect(pError).to.equal(null);
								Expect(pPdfBuffer).to.be.an.instanceOf(Buffer);

								createStartedHarness(null, null,
									(pHarness) =>
									{
										postBinaryToEndpoint(pHarness.port, '/conversion/1.0/pdf-to-page-png/1', pPdfBuffer,
											(pPostError, pResponse, pBody) =>
											{
												Expect(pPostError).to.equal(null);
												Expect(pResponse.statusCode).to.equal(200);
												Expect(pResponse.headers['content-type']).to.equal('image/png');
												Expect(pBody).to.be.an.instanceOf(Buffer);
												Expect(pBody.length).to.be.greaterThan(0);

												// Verify PNG magic bytes
												Expect(pBody[0]).to.equal(137);
												Expect(pBody[1]).to.equal(80);
												Expect(pBody[2]).to.equal(78);
												Expect(pBody[3]).to.equal(71);

												pHarness.orator.stopService(fDone);
											});
									});
							});
					}
				);

				test
				(
					'should extract page 1 from a PDF and return as JPEG',
					(fDone) =>
					{
						createTestPdfBuffer(
							(pError, pPdfBuffer) =>
							{
								Expect(pError).to.equal(null);

								createStartedHarness(null, null,
									(pHarness) =>
									{
										postBinaryToEndpoint(pHarness.port, '/conversion/1.0/pdf-to-page-jpg/1', pPdfBuffer,
											(pPostError, pResponse, pBody) =>
											{
												Expect(pPostError).to.equal(null);
												Expect(pResponse.statusCode).to.equal(200);
												Expect(pResponse.headers['content-type']).to.equal('image/jpeg');
												Expect(pBody).to.be.an.instanceOf(Buffer);
												Expect(pBody.length).to.be.greaterThan(0);

												// Verify JPEG magic bytes
												Expect(pBody[0]).to.equal(0xFF);
												Expect(pBody[1]).to.equal(0xD8);
												Expect(pBody[2]).to.equal(0xFF);

												pHarness.orator.stopService(fDone);
											});
									});
							});
					}
				);

				test
				(
					'should return 500 when requesting an invalid page number from a PDF',
					(fDone) =>
					{
						createTestPdfBuffer(
							(pError, pPdfBuffer) =>
							{
								Expect(pError).to.equal(null);

								createStartedHarness(null, null,
									(pHarness) =>
									{
										// Request page 999 from a 1-page PDF
										postBinaryToEndpoint(pHarness.port, '/conversion/1.0/pdf-to-page-png/999', pPdfBuffer,
											(pPostError, pResponse, pBody) =>
											{
												Expect(pPostError).to.equal(null);
												Expect(pResponse.statusCode).to.equal(500);

												let tmpResponseData = JSON.parse(pBody.toString());
												Expect(tmpResponseData).to.have.a.property('error');
												Expect(tmpResponseData.error).to.include('Conversion failed');

												pHarness.orator.stopService(fDone);
											});
									});
							});
					}
				);

				test
				(
					'should return 500 when posting invalid data to PDF endpoint',
					(fDone) =>
					{
						createStartedHarness(null, null,
							(pHarness) =>
							{
								let tmpInvalidData = Buffer.from('this is not a pdf');

								postBinaryToEndpoint(pHarness.port, '/conversion/1.0/pdf-to-page-png/1', tmpInvalidData,
									(pPostError, pResponse, pBody) =>
									{
										Expect(pPostError).to.equal(null);
										Expect(pResponse.statusCode).to.equal(500);

										let tmpResponseData = JSON.parse(pBody.toString());
										Expect(tmpResponseData).to.have.a.property('error');
										Expect(tmpResponseData.error).to.include('Conversion failed');

										pHarness.orator.stopService(fDone);
									});
							});
					}
				);
			}
		);

		suite
		(
			'Error Handling',
			() =>
			{
				test
				(
					'should return 400 when no file data is provided',
					(fDone) =>
					{
						createStartedHarness(null, null,
							(pHarness) =>
							{
								postBinaryToEndpoint(pHarness.port, '/conversion/1.0/image/jpg-to-png', Buffer.alloc(0),
									(pPostError, pResponse, pBody) =>
									{
										Expect(pPostError).to.equal(null);
										Expect(pResponse.statusCode).to.equal(400);

										let tmpResponseData = JSON.parse(pBody.toString());
										Expect(tmpResponseData).to.have.a.property('error');
										Expect(tmpResponseData.error).to.include('No file data');

										pHarness.orator.stopService(fDone);
									});
							});
					}
				);

				test
				(
					'should return 500 when invalid image data is provided',
					(fDone) =>
					{
						createStartedHarness(null, null,
							(pHarness) =>
							{
								let tmpInvalidData = Buffer.from('this is not an image file');

								postBinaryToEndpoint(pHarness.port, '/conversion/1.0/image/jpg-to-png', tmpInvalidData,
									(pPostError, pResponse, pBody) =>
									{
										Expect(pPostError).to.equal(null);
										Expect(pResponse.statusCode).to.equal(500);

										let tmpResponseData = JSON.parse(pBody.toString());
										Expect(tmpResponseData).to.have.a.property('error');
										Expect(tmpResponseData.error).to.include('Conversion failed');

										pHarness.orator.stopService(fDone);
									});
							});
					}
				);
			}
		);

		suite
		(
			'Custom Route Prefix and Version',
			() =>
			{
				test
				(
					'should use a custom route prefix and version for conversion endpoints',
					(fDone) =>
					{
						createTestJpegBuffer(
							(pError, pJpegBuffer) =>
							{
								Expect(pError).to.equal(null);

								createStartedHarness(null,
									{
										RoutePrefix: '/api/convert',
										Version: '2.0'
									},
									(pHarness) =>
									{
										postBinaryToEndpoint(pHarness.port, '/api/convert/2.0/image/jpg-to-png', pJpegBuffer,
											(pPostError, pResponse, pBody) =>
											{
												Expect(pPostError).to.equal(null);
												Expect(pResponse.statusCode).to.equal(200);
												Expect(pResponse.headers['content-type']).to.equal('image/png');

												pHarness.orator.stopService(fDone);
											});
									});
							});
					}
				);
			}
		);

		suite
		(
			'PDF Page Extraction with LongSidePixels',
			() =>
			{
				test
				(
					'should extract page 1 from a PDF as PNG resized to 100 pixels on the long side',
					(fDone) =>
					{
						createTestPdfBuffer(
							(pError, pPdfBuffer) =>
							{
								Expect(pError).to.equal(null);
								Expect(pPdfBuffer).to.be.an.instanceOf(Buffer);

								createStartedHarness(null, null,
									(pHarness) =>
									{
										postBinaryToEndpoint(pHarness.port, '/conversion/1.0/pdf-to-page-png/1/100', pPdfBuffer,
											(pPostError, pResponse, pBody) =>
											{
												Expect(pPostError).to.equal(null);
												Expect(pResponse.statusCode).to.equal(200);
												Expect(pResponse.headers['content-type']).to.equal('image/png');
												Expect(pBody).to.be.an.instanceOf(Buffer);
												Expect(pBody.length).to.be.greaterThan(0);

												// Verify PNG magic bytes
												Expect(pBody[0]).to.equal(137);
												Expect(pBody[1]).to.equal(80);
												Expect(pBody[2]).to.equal(78);
												Expect(pBody[3]).to.equal(71);

												// Verify the image dimensions using sharp metadata
												libSharp(pBody).metadata().then(
													(pMetadata) =>
													{
														let tmpLongSide = Math.max(pMetadata.width, pMetadata.height);
														Expect(tmpLongSide).to.equal(100);
														pHarness.orator.stopService(fDone);
													}).catch(
													(pMetaError) =>
													{
														pHarness.orator.stopService(() => { fDone(pMetaError); });
													});
											});
									});
							});
					}
				);

				test
				(
					'should extract page 1 from a PDF as JPEG resized to 200 pixels on the long side',
					(fDone) =>
					{
						createTestPdfBuffer(
							(pError, pPdfBuffer) =>
							{
								Expect(pError).to.equal(null);

								createStartedHarness(null, null,
									(pHarness) =>
									{
										postBinaryToEndpoint(pHarness.port, '/conversion/1.0/pdf-to-page-jpg/1/200', pPdfBuffer,
											(pPostError, pResponse, pBody) =>
											{
												Expect(pPostError).to.equal(null);
												Expect(pResponse.statusCode).to.equal(200);
												Expect(pResponse.headers['content-type']).to.equal('image/jpeg');
												Expect(pBody).to.be.an.instanceOf(Buffer);
												Expect(pBody.length).to.be.greaterThan(0);

												// Verify JPEG magic bytes
												Expect(pBody[0]).to.equal(0xFF);
												Expect(pBody[1]).to.equal(0xD8);
												Expect(pBody[2]).to.equal(0xFF);

												// Verify the image dimensions using sharp metadata
												libSharp(pBody).metadata().then(
													(pMetadata) =>
													{
														let tmpLongSide = Math.max(pMetadata.width, pMetadata.height);
														Expect(tmpLongSide).to.equal(200);
														pHarness.orator.stopService(fDone);
													}).catch(
													(pMetaError) =>
													{
														pHarness.orator.stopService(() => { fDone(pMetaError); });
													});
											});
									});
							});
					}
				);

				test
				(
					'should still work with the original page-only route (no resize)',
					(fDone) =>
					{
						createTestPdfBuffer(
							(pError, pPdfBuffer) =>
							{
								Expect(pError).to.equal(null);

								createStartedHarness(null, null,
									(pHarness) =>
									{
										postBinaryToEndpoint(pHarness.port, '/conversion/1.0/pdf-to-page-png/1', pPdfBuffer,
											(pPostError, pResponse, pBody) =>
											{
												Expect(pPostError).to.equal(null);
												Expect(pResponse.statusCode).to.equal(200);
												Expect(pResponse.headers['content-type']).to.equal('image/png');

												// Verify the original route still produces output at the default 150 DPI
												libSharp(pBody).metadata().then(
													(pMetadata) =>
													{
														// The test PDF is 72x72 points; at 150 DPI that's 150 pixels
														Expect(pMetadata.width).to.equal(150);
														Expect(pMetadata.height).to.equal(150);
														pHarness.orator.stopService(fDone);
													}).catch(
													(pMetaError) =>
													{
														pHarness.orator.stopService(() => { fDone(pMetaError); });
													});
											});
									});
							});
					}
				);
			}
		);

		suite
		(
			'Custom Converter',
			() =>
			{
				test
				(
					'should support custom converters added via addConverter',
					(fDone) =>
					{
						let tmpFable = new libFable(defaultFableSettings);

						tmpFable.serviceManager.addServiceType('OratorServiceServer', libOratorServiceServerRestify);
						tmpFable.serviceManager.addServiceType('Orator', libOrator);
						tmpFable.serviceManager.addServiceType('OratorFileTranslation', libOratorFileTranslation);

						let tmpRestifyServer = tmpFable.serviceManager.instantiateServiceProvider('OratorServiceServer', {});
						let tmpOrator = tmpFable.serviceManager.instantiateServiceProvider('Orator', {});
						let tmpFileTranslation = tmpFable.serviceManager.instantiateServiceProvider('OratorFileTranslation', {});

						// Add a custom echo converter before connecting routes
						tmpFileTranslation.addConverter('custom/echo',
							(pInputBuffer, pRequest, fCallback) =>
							{
								return fCallback(null, pInputBuffer, 'application/octet-stream');
							});

						tmpOrator.startService(
							() =>
							{
								tmpFileTranslation.connectRoutes();
								let tmpPort = tmpRestifyServer.server.address().port;

								let tmpTestData = Buffer.from('hello world');

								postBinaryToEndpoint(tmpPort, '/conversion/1.0/custom/echo', tmpTestData,
									(pPostError, pResponse, pBody) =>
									{
										Expect(pPostError).to.equal(null);
										Expect(pResponse.statusCode).to.equal(200);
										Expect(pResponse.headers['content-type']).to.equal('application/octet-stream');
										Expect(pBody.toString()).to.equal('hello world');

										tmpOrator.stopService(fDone);
									});
							});
					}
				);
			}
		);
	}
);
