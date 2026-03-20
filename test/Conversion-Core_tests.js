/**
* Unit tests for Conversion-Core — Image, Video, Audio operations
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

const Chai = require("chai");
const Expect = Chai.expect;

const libSharp = require('sharp');

const libConversionCore = require('../source/Conversion-Core.js');

/**
 * Generate a minimal JPEG test image buffer (10x20 red).
 */
function createTestJpegBuffer(fCallback)
{
	libSharp(
		{
			create:
				{
					width: 10,
					height: 20,
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
					width: 10,
					height: 20,
					channels: 4,
					background: { r: 0, g: 0, b: 255, alpha: 1 }
				}
		}).png().toBuffer().then(
		(pBuffer) => { return fCallback(null, pBuffer); },
		(pError) => { return fCallback(pError); });
}

suite
(
	'Conversion Core',
	() =>
	{
		suite
		(
			'Image Rotate',
			() =>
			{
				test
				(
					'should rotate an image 90 degrees and swap dimensions',
					(fDone) =>
					{
						createTestJpegBuffer(
							(pError, pJpegBuffer) =>
							{
								Expect(pError).to.equal(null);

								let tmpCore = new libConversionCore();

								tmpCore.imageRotate(pJpegBuffer,
									{ Angle: 90 },
									(pRotateError, pOutputBuffer, pContentType) =>
									{
										Expect(pRotateError).to.equal(null);
										Expect(pOutputBuffer).to.be.an.instanceOf(Buffer);
										Expect(pOutputBuffer.length).to.be.greaterThan(0);
										Expect(pContentType).to.equal('image/jpeg');

										// Verify dimensions are swapped (10x20 → 20x10)
										libSharp(pOutputBuffer).metadata().then(
											(pMetadata) =>
											{
												Expect(pMetadata.width).to.equal(20);
												Expect(pMetadata.height).to.equal(10);
												return fDone();
											}).catch(
											(pMetaError) => { return fDone(pMetaError); });
									});
							});
					}
				);

				test
				(
					'should flip an image without error',
					(fDone) =>
					{
						createTestJpegBuffer(
							(pError, pJpegBuffer) =>
							{
								Expect(pError).to.equal(null);

								let tmpCore = new libConversionCore();

								tmpCore.imageRotate(pJpegBuffer,
									{ Flip: true },
									(pRotateError, pOutputBuffer, pContentType) =>
									{
										Expect(pRotateError).to.equal(null);
										Expect(pOutputBuffer).to.be.an.instanceOf(Buffer);
										Expect(pOutputBuffer.length).to.be.greaterThan(0);
										return fDone();
									});
							});
					}
				);

				test
				(
					'should flop an image without error',
					(fDone) =>
					{
						createTestJpegBuffer(
							(pError, pJpegBuffer) =>
							{
								Expect(pError).to.equal(null);

								let tmpCore = new libConversionCore();

								tmpCore.imageRotate(pJpegBuffer,
									{ Flop: true },
									(pRotateError, pOutputBuffer, pContentType) =>
									{
										Expect(pRotateError).to.equal(null);
										Expect(pOutputBuffer).to.be.an.instanceOf(Buffer);
										Expect(pOutputBuffer.length).to.be.greaterThan(0);
										return fDone();
									});
							});
					}
				);
			}
		);

		suite
		(
			'Image Convert',
			() =>
			{
				test
				(
					'should convert JPEG to PNG',
					(fDone) =>
					{
						createTestJpegBuffer(
							(pError, pJpegBuffer) =>
							{
								Expect(pError).to.equal(null);

								let tmpCore = new libConversionCore();

								tmpCore.imageConvert(pJpegBuffer,
									{ Format: 'png' },
									(pConvertError, pOutputBuffer, pContentType) =>
									{
										Expect(pConvertError).to.equal(null);
										Expect(pOutputBuffer).to.be.an.instanceOf(Buffer);
										Expect(pContentType).to.equal('image/png');

										// Verify PNG magic bytes
										Expect(pOutputBuffer[0]).to.equal(137);
										Expect(pOutputBuffer[1]).to.equal(80);
										Expect(pOutputBuffer[2]).to.equal(78);
										Expect(pOutputBuffer[3]).to.equal(71);

										return fDone();
									});
							});
					}
				);

				test
				(
					'should convert PNG to WebP',
					(fDone) =>
					{
						createTestPngBuffer(
							(pError, pPngBuffer) =>
							{
								Expect(pError).to.equal(null);

								let tmpCore = new libConversionCore();

								tmpCore.imageConvert(pPngBuffer,
									{ Format: 'webp' },
									(pConvertError, pOutputBuffer, pContentType) =>
									{
										Expect(pConvertError).to.equal(null);
										Expect(pOutputBuffer).to.be.an.instanceOf(Buffer);
										Expect(pContentType).to.equal('image/webp');
										Expect(pOutputBuffer.length).to.be.greaterThan(0);

										return fDone();
									});
							});
					}
				);

				test
				(
					'should convert PNG to JPEG with quality option',
					(fDone) =>
					{
						createTestPngBuffer(
							(pError, pPngBuffer) =>
							{
								Expect(pError).to.equal(null);

								let tmpCore = new libConversionCore();

								tmpCore.imageConvert(pPngBuffer,
									{ Format: 'jpeg', Quality: 50 },
									(pConvertError, pOutputBuffer, pContentType) =>
									{
										Expect(pConvertError).to.equal(null);
										Expect(pOutputBuffer).to.be.an.instanceOf(Buffer);
										Expect(pContentType).to.equal('image/jpeg');

										// Verify JPEG magic bytes
										Expect(pOutputBuffer[0]).to.equal(0xFF);
										Expect(pOutputBuffer[1]).to.equal(0xD8);
										Expect(pOutputBuffer[2]).to.equal(0xFF);

										return fDone();
									});
							});
					}
				);
			}
		);

		suite
		(
			'Enhanced Image Resize',
			() =>
			{
				test
				(
					'should resize with contain fit mode',
					(fDone) =>
					{
						createTestJpegBuffer(
							(pError, pJpegBuffer) =>
							{
								Expect(pError).to.equal(null);

								let tmpCore = new libConversionCore();

								// 10x20 image, resize to fit within 5x5 with "inside" mode
								tmpCore.imageResize(pJpegBuffer,
									{ Width: 5, Height: 5, Fit: 'inside' },
									(pResizeError, pOutputBuffer, pContentType) =>
									{
										Expect(pResizeError).to.equal(null);
										Expect(pOutputBuffer).to.be.an.instanceOf(Buffer);

										libSharp(pOutputBuffer).metadata().then(
											(pMetadata) =>
											{
												// With 'inside' fit, the image should fit within 5x5
												// The original is 10x20 (portrait), so height is dominant
												// Scaled to fit: width=2 or 3, height=5
												Expect(pMetadata.width).to.be.at.most(5);
												Expect(pMetadata.height).to.be.at.most(5);
												return fDone();
											}).catch(
											(pMetaError) => { return fDone(pMetaError); });
									});
							});
					}
				);

				test
				(
					'should support avif output format',
					(fDone) =>
					{
						createTestJpegBuffer(
							(pError, pJpegBuffer) =>
							{
								Expect(pError).to.equal(null);

								let tmpCore = new libConversionCore();

								tmpCore.imageResize(pJpegBuffer,
									{ Width: 5, Format: 'avif' },
									(pResizeError, pOutputBuffer, pContentType) =>
									{
										Expect(pResizeError).to.equal(null);
										Expect(pOutputBuffer).to.be.an.instanceOf(Buffer);
										Expect(pContentType).to.equal('image/avif');
										Expect(pOutputBuffer.length).to.be.greaterThan(0);

										return fDone();
									});
							});
					}
				);
			}
		);

		suite
		(
			'Tool Availability Checks',
			() =>
			{
				test
				(
					'checkFfmpeg should return a result',
					(fDone) =>
					{
						let tmpCore = new libConversionCore();

						tmpCore.checkFfmpeg(
							(pError, pAvailable) =>
							{
								// We don't require ffmpeg to be installed;
								// just verify the check completes without throwing
								Expect(typeof pAvailable).to.equal('boolean');
								return fDone();
							});
					}
				);

				test
				(
					'checkFfprobe should return a result',
					(fDone) =>
					{
						let tmpCore = new libConversionCore();

						tmpCore.checkFfprobe(
							(pError, pAvailable) =>
							{
								Expect(typeof pAvailable).to.equal('boolean');
								return fDone();
							});
					}
				);

				test
				(
					'checkFfmpeg with invalid path should return not available',
					(fDone) =>
					{
						let tmpCore = new libConversionCore({ FfmpegPath: '/nonexistent/ffmpeg' });

						tmpCore.checkFfmpeg(
							(pError, pAvailable) =>
							{
								Expect(pError).to.not.equal(null);
								Expect(pAvailable).to.equal(false);
								return fDone();
							});
					}
				);

				test
				(
					'checkFfprobe with invalid path should return not available',
					(fDone) =>
					{
						let tmpCore = new libConversionCore({ FfprobePath: '/nonexistent/ffprobe' });

						tmpCore.checkFfprobe(
							(pError, pAvailable) =>
							{
								Expect(pError).to.not.equal(null);
								Expect(pAvailable).to.equal(false);
								return fDone();
							});
					}
				);
			}
		);

		suite
		(
			'Media Probe',
			() =>
			{
				test
				(
					'should return an error when no file path is provided',
					(fDone) =>
					{
						let tmpCore = new libConversionCore();

						tmpCore.mediaProbe(null,
							(pError, pMetadata) =>
							{
								Expect(pError).to.not.equal(null);
								Expect(pError.message).to.include('No file path');
								return fDone();
							});
					}
				);
			}
		);

		suite
		(
			'Audio Extract Segment',
			() =>
			{
				test
				(
					'should require a Duration parameter',
					(fDone) =>
					{
						let tmpCore = new libConversionCore();

						tmpCore.audioExtractSegment('/tmp/input.mp3', '/tmp/output.mp3',
							{ Start: '0' },
							(pError, pResultPath) =>
							{
								Expect(pError).to.not.equal(null);
								Expect(pError.message).to.include('Duration is required');
								return fDone();
							});
					}
				);
			}
		);
	}
);
