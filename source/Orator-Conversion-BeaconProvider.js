/**
 * Orator Conversion — Ultravisor Beacon Capability Provider
 *
 * Wraps the Conversion-Core module as a beacon capability provider,
 * exposing image, PDF, video, and audio conversion actions to the
 * Ultravisor mesh.
 *
 * Capability: MediaConversion
 * Actions:
 *   ImageJpgToPng      — JPEG to PNG
 *   ImagePngToJpg      — PNG to JPEG
 *   ImageResize        — Resize image with format/dimension/fit options
 *   ImageRotate        — Rotate/flip/flop an image
 *   ImageConvert       — Convert between image formats (any-to-any)
 *   PdfPageToPng       — Render PDF page as PNG
 *   PdfPageToJpg       — Render PDF page as JPEG
 *   PdfPageToPngSized  — Render PDF page as PNG, constrained to a max dimension
 *   PdfPageToJpgSized  — Render PDF page as JPEG, constrained to a max dimension
 *   MediaProbe         — Extract media metadata via ffprobe
 *   VideoExtractFrame  — Extract a single video frame at a timestamp
 *   VideoThumbnail     — Generate a video thumbnail (convenience)
 *   AudioExtractSegment— Extract an audio time-range segment
 *   AudioWaveform      — Extract waveform peak data
 *
 * Provider config:
 *   PdftkPath        {string} — Path to pdftk binary (default: 'pdftk')
 *   PdftoppmPath     {string} — Path to pdftoppm binary (default: 'pdftoppm')
 *   FfmpegPath       {string} — Path to ffmpeg binary (default: 'ffmpeg')
 *   FfprobePath      {string} — Path to ffprobe binary (default: 'ffprobe')
 *   MaxFileSizeBytes {number} — Max input file size (default: 100MB)
 */

const libFS = require('fs');
const libPath = require('path');

const libBeaconCapabilityProvider = require('ultravisor-beacon/source/Ultravisor-Beacon-CapabilityProvider.cjs');

const libConversionCore = require('./Conversion-Core.js');

class OratorConversionBeaconProvider extends libBeaconCapabilityProvider
{
	constructor(pProviderConfig)
	{
		super(pProviderConfig);

		this.Name = 'OratorConversion';
		this.Capability = 'MediaConversion';

		this._Core = new libConversionCore({
			PdftkPath: this._ProviderConfig.PdftkPath || 'pdftk',
			PdftoppmPath: this._ProviderConfig.PdftoppmPath || 'pdftoppm',
			FfmpegPath: this._ProviderConfig.FfmpegPath || 'ffmpeg',
			FfprobePath: this._ProviderConfig.FfprobePath || 'ffprobe',
			MaxFileSize: this._ProviderConfig.MaxFileSizeBytes || (100 * 1024 * 1024),
			LogLevel: this._ProviderConfig.LogLevel || 0
		});

		// Track which tools are available
		this._SharpAvailable = false;
		this._PdftoppmAvailable = false;
		this._PdftkAvailable = false;
		this._FfmpegAvailable = false;
		this._FfprobeAvailable = false;
	}

	get actions()
	{
		return {
			'ImageJpgToPng':
			{
				Description: 'Convert a JPEG image to PNG format.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input JPEG file (relative to staging)' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output PNG file (relative to staging)' }
				]
			},
			'ImagePngToJpg':
			{
				Description: 'Convert a PNG image to JPEG format.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input PNG file (relative to staging)' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output JPEG file (relative to staging)' }
				]
			},
			'ImageResize':
			{
				Description: 'Resize an image with format, dimension, fit, and position options.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input image file' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output image file' },
					{ Name: 'Width', DataType: 'Number', Required: false, Description: 'Target width in pixels' },
					{ Name: 'Height', DataType: 'Number', Required: false, Description: 'Target height in pixels' },
					{ Name: 'Format', DataType: 'String', Required: false, Description: 'Output format: png, jpeg, webp, avif, tiff (default: jpeg)' },
					{ Name: 'Quality', DataType: 'Number', Required: false, Description: 'Quality for lossy formats 1-100 (default: 80)' },
					{ Name: 'AutoOrient', DataType: 'Boolean', Required: false, Description: 'Auto-orient from EXIF (default: true)' },
					{ Name: 'Fit', DataType: 'String', Required: false, Description: 'Resize fit mode: cover, contain, fill, inside, outside' },
					{ Name: 'Position', DataType: 'String', Required: false, Description: 'Resize position/gravity: centre, north, south, etc.' }
				]
			},
			'ImageRotate':
			{
				Description: 'Rotate and/or flip an image.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input image file' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output image file' },
					{ Name: 'Angle', DataType: 'Number', Required: false, Description: 'Rotation angle in degrees' },
					{ Name: 'Flip', DataType: 'Boolean', Required: false, Description: 'Flip vertically' },
					{ Name: 'Flop', DataType: 'Boolean', Required: false, Description: 'Flip horizontally' }
				]
			},
			'ImageConvert':
			{
				Description: 'Convert an image between formats (jpeg, png, webp, avif, tiff).',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input image file' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output image file' },
					{ Name: 'Format', DataType: 'String', Required: true, Description: 'Target format: jpeg, png, webp, avif, tiff' },
					{ Name: 'Quality', DataType: 'Number', Required: false, Description: 'Quality for lossy formats 1-100 (default: 80)' }
				]
			},
			'PdfPageToPng':
			{
				Description: 'Render a PDF page as a PNG image.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input PDF file' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output PNG file' },
					{ Name: 'Page', DataType: 'Number', Required: true, Description: '1-based page number to render' }
				]
			},
			'PdfPageToJpg':
			{
				Description: 'Render a PDF page as a JPEG image.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input PDF file' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output JPEG file' },
					{ Name: 'Page', DataType: 'Number', Required: true, Description: '1-based page number to render' }
				]
			},
			'PdfPageToPngSized':
			{
				Description: 'Render a PDF page as a PNG image constrained to a maximum dimension.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input PDF file' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output PNG file' },
					{ Name: 'Page', DataType: 'Number', Required: true, Description: '1-based page number to render' },
					{ Name: 'LongSidePixels', DataType: 'Number', Required: true, Description: 'Maximum pixels for the longest dimension' }
				]
			},
			'PdfPageToJpgSized':
			{
				Description: 'Render a PDF page as a JPEG image constrained to a maximum dimension.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input PDF file' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output JPEG file' },
					{ Name: 'Page', DataType: 'Number', Required: true, Description: '1-based page number to render' },
					{ Name: 'LongSidePixels', DataType: 'Number', Required: true, Description: 'Maximum pixels for the longest dimension' }
				]
			},
			'MediaProbe':
			{
				Description: 'Extract media metadata (format, streams, duration, etc.) via ffprobe.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input media file' }
				]
			},
			'VideoExtractFrame':
			{
				Description: 'Extract a single frame from a video at a given timestamp.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input video file' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output JPEG image' },
					{ Name: 'Timestamp', DataType: 'String', Required: false, Description: 'Seek position (default: 00:00:00)' },
					{ Name: 'Width', DataType: 'Number', Required: false, Description: 'Scale width (height auto)' },
					{ Name: 'Height', DataType: 'Number', Required: false, Description: 'Scale height (width auto)' }
				]
			},
			'VideoThumbnail':
			{
				Description: 'Generate a thumbnail from a video file.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input video file' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output JPEG thumbnail' },
					{ Name: 'Timestamp', DataType: 'String', Required: false, Description: 'Seek position (default: 00:00:01)' },
					{ Name: 'Width', DataType: 'Number', Required: false, Description: 'Thumbnail width (default: 320)' }
				]
			},
			'AudioExtractSegment':
			{
				Description: 'Extract a time-range segment from an audio or video file.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input audio/video file' },
					{ Name: 'OutputFile', DataType: 'String', Required: true, Description: 'Path for output audio file' },
					{ Name: 'Start', DataType: 'String', Required: false, Description: 'Start time in seconds or HH:MM:SS (default: 0)' },
					{ Name: 'Duration', DataType: 'String', Required: true, Description: 'Segment duration in seconds or HH:MM:SS' },
					{ Name: 'Codec', DataType: 'String', Required: false, Description: 'Output codec: mp3, wav, flac, ogg, aac (default: mp3)' }
				]
			},
			'AudioWaveform':
			{
				Description: 'Extract waveform peak data from an audio file.',
				SettingsSchema:
				[
					{ Name: 'InputFile', DataType: 'String', Required: true, Description: 'Path to input audio/video file' },
					{ Name: 'SampleRate', DataType: 'Number', Required: false, Description: 'PCM sample rate (default: 8000)' },
					{ Name: 'Samples', DataType: 'Number', Required: false, Description: 'Number of peak values to return (default: 800)' }
				]
			}
		};
	}

	/**
	 * Validate prerequisites: Sharp must be available; pdftoppm, pdftk, ffmpeg, ffprobe are optional.
	 */
	initialize(fCallback)
	{
		this._Core.checkSharp((pSharpError, pSharpAvailable) =>
		{
			if (pSharpError)
			{
				return fCallback(new Error(`OratorConversion provider requires Sharp: ${pSharpError.message}`));
			}
			this._SharpAvailable = true;
			console.log(`  [OratorConversion] Sharp: available`);

			this._Core.checkPdftoppm((pPdftoppmError, pPdftoppmAvailable) =>
			{
				this._PdftoppmAvailable = !pPdftoppmError;
				console.log(`  [OratorConversion] pdftoppm: ${this._PdftoppmAvailable ? 'available' : 'not found (PDF actions disabled)'}`);

				this._Core.checkPdftk((pPdftkError, pPdftkAvailable) =>
				{
					this._PdftkAvailable = !pPdftkError;
					console.log(`  [OratorConversion] pdftk: ${this._PdftkAvailable ? 'available' : 'not found (PDF extraction disabled)'}`);

					this._Core.checkFfmpeg((pFfmpegError, pFfmpegAvailable) =>
					{
						this._FfmpegAvailable = !pFfmpegError;
						console.log(`  [OratorConversion] ffmpeg: ${this._FfmpegAvailable ? 'available' : 'not found (video/audio actions disabled)'}`);

						this._Core.checkFfprobe((pFfprobeError, pFfprobeAvailable) =>
						{
							this._FfprobeAvailable = !pFfprobeError;
							console.log(`  [OratorConversion] ffprobe: ${this._FfprobeAvailable ? 'available' : 'not found (media probe disabled)'}`);

							return fCallback(null);
						});
					});
				});
			});
		});
	}

	/**
	 * Execute a conversion action.
	 */
	execute(pAction, pWorkItem, pContext, fCallback, fReportProgress)
	{
		let tmpLog = pContext && pContext.log ? pContext.log : { info: console.log, warn: console.warn, error: console.error };
		tmpLog.info(`[OratorConversion] execute: action="${pAction}" workItem=${pWorkItem.WorkItemHash || '?'} settings=${JSON.stringify(pWorkItem.Settings || {}).substring(0, 200)}`);
		let tmpSettings = pWorkItem.Settings || {};
		let tmpStagingPath = pContext.StagingPath || process.cwd();

		// Coerce settings types from the action's schema.
		// Template engines and JSON transport may deliver numbers as strings.
		let tmpActionDef = this.actions[pAction];
		if (tmpActionDef && tmpActionDef.SettingsSchema)
		{
			for (let i = 0; i < tmpActionDef.SettingsSchema.length; i++)
			{
				let tmpField = tmpActionDef.SettingsSchema[i];
				let tmpVal = tmpSettings[tmpField.Name];
				if (tmpVal === undefined || tmpVal === null || tmpVal === '') { continue; }
				if (tmpField.DataType === 'Number' && typeof tmpVal === 'string')
				{
					let tmpNum = Number(tmpVal);
					if (!isNaN(tmpNum)) { tmpSettings[tmpField.Name] = tmpNum; }
				}
				else if (tmpField.DataType === 'Boolean' && typeof tmpVal === 'string')
				{
					tmpSettings[tmpField.Name] = (tmpVal === 'true' || tmpVal === '1');
				}
			}
		}

		let tmpInputPath = this._resolvePath(tmpSettings.InputFile, tmpStagingPath);
		let tmpOutputPath = this._resolvePath(tmpSettings.OutputFile, tmpStagingPath);

		if (!tmpInputPath)
		{
			return fCallback(null, {
				Outputs: { StdOut: 'No InputFile specified.', ExitCode: -1, Result: '' },
				Log: ['OratorConversion: no InputFile specified.']
			});
		}

		if (!libFS.existsSync(tmpInputPath))
		{
			tmpLog.warn(`[OratorConversion] Input file NOT FOUND: ${tmpInputPath} (settings.InputFile=${tmpSettings.InputFile})`);
			return fCallback(null, {
				Outputs: { StdOut: `Input file not found: ${tmpSettings.InputFile}`, ExitCode: -1, Result: '' },
				Log: [`OratorConversion: input file not found: ${tmpInputPath}`]
			});
		}

		tmpLog.info(`[OratorConversion] Input file OK: ${tmpInputPath} (${libFS.statSync(tmpInputPath).size} bytes)`);

		// File-path actions skip the buffer read — Sharp and ffmpeg handle files directly
		let tmpFilePathActions = { 'ImageResize': true, 'ImageConvert': true, 'MediaProbe': true, 'VideoExtractFrame': true, 'VideoThumbnail': true, 'AudioExtractSegment': true, 'AudioWaveform': true };
		if (tmpFilePathActions[pAction])
		{
			return this._executeFilePathAction(pAction, tmpSettings, tmpInputPath, tmpOutputPath, fCallback, fReportProgress);
		}

		// Buffer-based actions: read input into memory
		let tmpInputBuffer;
		try
		{
			tmpInputBuffer = libFS.readFileSync(tmpInputPath);
		}
		catch (pReadError)
		{
			return fCallback(null, {
				Outputs: { StdOut: `Failed to read input file: ${pReadError.message}`, ExitCode: -1, Result: '' },
				Log: [`OratorConversion: read error: ${pReadError.message}`]
			});
		}

		// Ensure output directory exists
		if (tmpOutputPath)
		{
			let tmpOutputDir = libPath.dirname(tmpOutputPath);
			if (!libFS.existsSync(tmpOutputDir))
			{
				libFS.mkdirSync(tmpOutputDir, { recursive: true });
			}
		}

		let tmpWriteAndReturn = (pError, pOutputBuffer, pContentType) =>
		{
			if (pError)
			{
				tmpLog.error(`[OratorConversion] ${pAction} FAILED: ${pError.message}`);
				return fCallback(null, {
					Outputs: { StdOut: `Conversion failed: ${pError.message}`, ExitCode: 1, Result: '' },
					Log: [`OratorConversion ${pAction} error: ${pError.message}`]
				});
			}

			tmpLog.info(`[OratorConversion] ${pAction} SUCCESS: ${pOutputBuffer.length} bytes → ${tmpOutputPath}`);

			try
			{
				libFS.writeFileSync(tmpOutputPath, pOutputBuffer);
			}
			catch (pWriteError)
			{
				return fCallback(null, {
					Outputs: { StdOut: `Failed to write output: ${pWriteError.message}`, ExitCode: 1, Result: '' },
					Log: [`OratorConversion: write error: ${pWriteError.message}`]
				});
			}

			return fCallback(null, {
				Outputs:
				{
					StdOut: `Converted ${tmpSettings.InputFile} → ${tmpSettings.OutputFile}`,
					ExitCode: 0,
					Result: tmpOutputPath,
					ContentType: pContentType || '',
					OutputSize: pOutputBuffer.length
				},
				Log: [`OratorConversion ${pAction}: ${tmpSettings.InputFile} → ${tmpSettings.OutputFile} (${pOutputBuffer.length} bytes)`]
			});
		};

		switch (pAction)
		{
			case 'ImageJpgToPng':
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Converting JPEG to PNG...' });
				this._Core.jpgToPng(tmpInputBuffer, tmpWriteAndReturn);
				break;

			case 'ImagePngToJpg':
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Converting PNG to JPEG...' });
				this._Core.pngToJpg(tmpInputBuffer, tmpWriteAndReturn);
				break;

			case 'ImageResize':
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Resizing image...' });
				this._Core.imageResize(tmpInputBuffer,
					{
						Width: tmpSettings.Width,
						Height: tmpSettings.Height,
						Format: tmpSettings.Format,
						Quality: tmpSettings.Quality,
						AutoOrient: tmpSettings.AutoOrient,
						Fit: tmpSettings.Fit,
						Position: tmpSettings.Position
					},
					tmpWriteAndReturn);
				break;

			case 'ImageRotate':
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Rotating image...' });
				this._Core.imageRotate(tmpInputBuffer,
					{
						Angle: tmpSettings.Angle,
						Flip: tmpSettings.Flip,
						Flop: tmpSettings.Flop
					},
					tmpWriteAndReturn);
				break;

			case 'ImageConvert':
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Converting image format...' });
				this._Core.imageConvert(tmpInputBuffer,
					{
						Format: tmpSettings.Format,
						Quality: tmpSettings.Quality
					},
					tmpWriteAndReturn);
				break;

			case 'PdfPageToPng':
				if (!this._PdftoppmAvailable)
				{
					return fCallback(null, {
						Outputs: { StdOut: 'pdftoppm not available on this beacon.', ExitCode: -1, Result: '' },
						Log: ['OratorConversion: pdftoppm required for PDF rendering but not found.']
					});
				}
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Rendering PDF page to PNG...' });
				this._Core.renderPdfPageToImage(tmpInputBuffer, parseInt(tmpSettings.Page, 10), 'png',
					(pError, pImageBuffer) =>
					{
						tmpWriteAndReturn(pError, pImageBuffer, 'image/png');
					});
				break;

			case 'PdfPageToJpg':
				if (!this._PdftoppmAvailable)
				{
					return fCallback(null, {
						Outputs: { StdOut: 'pdftoppm not available on this beacon.', ExitCode: -1, Result: '' },
						Log: ['OratorConversion: pdftoppm required for PDF rendering but not found.']
					});
				}
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Rendering PDF page to JPEG...' });
				this._Core.renderPdfPageToImage(tmpInputBuffer, parseInt(tmpSettings.Page, 10), 'jpeg',
					(pError, pImageBuffer) =>
					{
						tmpWriteAndReturn(pError, pImageBuffer, 'image/jpeg');
					});
				break;

			case 'PdfPageToPngSized':
				if (!this._PdftoppmAvailable)
				{
					return fCallback(null, {
						Outputs: { StdOut: 'pdftoppm not available on this beacon.', ExitCode: -1, Result: '' },
						Log: ['OratorConversion: pdftoppm required for PDF rendering but not found.']
					});
				}
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Rendering PDF page to sized PNG...' });
				this._Core.renderPdfPageToImage(tmpInputBuffer, parseInt(tmpSettings.Page, 10), 'png',
					(pError, pImageBuffer) =>
					{
						tmpWriteAndReturn(pError, pImageBuffer, 'image/png');
					},
					{ LongSidePixels: parseInt(tmpSettings.LongSidePixels, 10) });
				break;

			case 'PdfPageToJpgSized':
				if (!this._PdftoppmAvailable)
				{
					return fCallback(null, {
						Outputs: { StdOut: 'pdftoppm not available on this beacon.', ExitCode: -1, Result: '' },
						Log: ['OratorConversion: pdftoppm required for PDF rendering but not found.']
					});
				}
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Rendering PDF page to sized JPEG...' });
				this._Core.renderPdfPageToImage(tmpInputBuffer, parseInt(tmpSettings.Page, 10), 'jpeg',
					(pError, pImageBuffer) =>
					{
						tmpWriteAndReturn(pError, pImageBuffer, 'image/jpeg');
					},
					{ LongSidePixels: parseInt(tmpSettings.LongSidePixels, 10) });
				break;

			default:
				return fCallback(null, {
					Outputs: { StdOut: `Unknown action: ${pAction}`, ExitCode: -1, Result: '' },
					Log: [`OratorConversion: unknown action "${pAction}".`]
				});
		}
	}

	/**
	 * Execute a file-path based action (video, audio, probe).
	 *
	 * These actions work directly with file paths instead of reading the
	 * entire input into a buffer, since media files can be very large.
	 */
	_executeFilePathAction(pAction, pSettings, pInputPath, pOutputPath, fCallback, fReportProgress)
	{
		switch (pAction)
		{
			case 'MediaProbe':
			{
				if (!this._FfprobeAvailable)
				{
					return fCallback(null, {
						Outputs: { StdOut: 'ffprobe not available on this beacon.', ExitCode: -1, Result: '' },
						Log: ['OratorConversion: ffprobe required for MediaProbe but not found.']
					});
				}
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Probing media metadata...' });
				this._Core.mediaProbe(pInputPath,
					(pError, pMetadata) =>
					{
						if (pError)
						{
							return fCallback(null, {
								Outputs: { StdOut: `Probe failed: ${pError.message}`, ExitCode: 1, Result: '' },
								Log: [`OratorConversion MediaProbe error: ${pError.message}`]
							});
						}

						return fCallback(null, {
							Outputs:
							{
								StdOut: `Probed ${pSettings.InputFile}`,
								ExitCode: 0,
								Result: JSON.stringify(pMetadata),
								ContentType: 'application/json'
							},
							Log: [`OratorConversion MediaProbe: ${pSettings.InputFile}`]
						});
					});
				break;
			}

			case 'VideoExtractFrame':
			{
				if (!this._FfmpegAvailable)
				{
					return fCallback(null, {
						Outputs: { StdOut: 'ffmpeg not available on this beacon.', ExitCode: -1, Result: '' },
						Log: ['OratorConversion: ffmpeg required for VideoExtractFrame but not found.']
					});
				}
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Extracting video frame...' });

				this._Core.videoExtractFrame(pInputPath, pOutputPath,
					{
						Timestamp: pSettings.Timestamp,
						Width: pSettings.Width,
						Height: pSettings.Height
					},
					(pError, pResultPath) =>
					{
						if (pError)
						{
							return fCallback(null, {
								Outputs: { StdOut: `Frame extraction failed: ${pError.message}`, ExitCode: 1, Result: '' },
								Log: [`OratorConversion VideoExtractFrame error: ${pError.message}`]
							});
						}

						let tmpOutputSize = 0;
						try { tmpOutputSize = libFS.statSync(pResultPath).size; } catch (pIgnore) { /* ignore */ }

						return fCallback(null, {
							Outputs:
							{
								StdOut: `Extracted frame from ${pSettings.InputFile} → ${pSettings.OutputFile}`,
								ExitCode: 0,
								Result: pResultPath,
								ContentType: 'image/jpeg',
								OutputSize: tmpOutputSize
							},
							Log: [`OratorConversion VideoExtractFrame: ${pSettings.InputFile} → ${pSettings.OutputFile} (${tmpOutputSize} bytes)`]
						});
					});
				break;
			}

			case 'VideoThumbnail':
			{
				if (!this._FfmpegAvailable)
				{
					return fCallback(null, {
						Outputs: { StdOut: 'ffmpeg not available on this beacon.', ExitCode: -1, Result: '' },
						Log: ['OratorConversion: ffmpeg required for VideoThumbnail but not found.']
					});
				}
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Generating video thumbnail...' });

				this._Core.videoThumbnail(pInputPath, pOutputPath,
					{
						Timestamp: pSettings.Timestamp,
						Width: pSettings.Width
					},
					(pError, pResultPath) =>
					{
						if (pError)
						{
							return fCallback(null, {
								Outputs: { StdOut: `Thumbnail generation failed: ${pError.message}`, ExitCode: 1, Result: '' },
								Log: [`OratorConversion VideoThumbnail error: ${pError.message}`]
							});
						}

						let tmpOutputSize = 0;
						try { tmpOutputSize = libFS.statSync(pResultPath).size; } catch (pIgnore) { /* ignore */ }

						return fCallback(null, {
							Outputs:
							{
								StdOut: `Generated thumbnail from ${pSettings.InputFile} → ${pSettings.OutputFile}`,
								ExitCode: 0,
								Result: pResultPath,
								ContentType: 'image/jpeg',
								OutputSize: tmpOutputSize
							},
							Log: [`OratorConversion VideoThumbnail: ${pSettings.InputFile} → ${pSettings.OutputFile} (${tmpOutputSize} bytes)`]
						});
					});
				break;
			}

			case 'AudioExtractSegment':
			{
				if (!this._FfmpegAvailable)
				{
					return fCallback(null, {
						Outputs: { StdOut: 'ffmpeg not available on this beacon.', ExitCode: -1, Result: '' },
						Log: ['OratorConversion: ffmpeg required for AudioExtractSegment but not found.']
					});
				}
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Extracting audio segment...' });

				this._Core.audioExtractSegment(pInputPath, pOutputPath,
					{
						Start: pSettings.Start,
						Duration: pSettings.Duration,
						Codec: pSettings.Codec
					},
					(pError, pResultPath) =>
					{
						if (pError)
						{
							return fCallback(null, {
								Outputs: { StdOut: `Audio extraction failed: ${pError.message}`, ExitCode: 1, Result: '' },
								Log: [`OratorConversion AudioExtractSegment error: ${pError.message}`]
							});
						}

						let tmpOutputSize = 0;
						try { tmpOutputSize = libFS.statSync(pResultPath).size; } catch (pIgnore) { /* ignore */ }

						return fCallback(null, {
							Outputs:
							{
								StdOut: `Extracted audio segment from ${pSettings.InputFile} → ${pSettings.OutputFile}`,
								ExitCode: 0,
								Result: pResultPath,
								ContentType: 'audio/mpeg',
								OutputSize: tmpOutputSize
							},
							Log: [`OratorConversion AudioExtractSegment: ${pSettings.InputFile} → ${pSettings.OutputFile} (${tmpOutputSize} bytes)`]
						});
					});
				break;
			}

			case 'AudioWaveform':
			{
				if (!this._FfmpegAvailable)
				{
					return fCallback(null, {
						Outputs: { StdOut: 'ffmpeg not available on this beacon.', ExitCode: -1, Result: '' },
						Log: ['OratorConversion: ffmpeg required for AudioWaveform but not found.']
					});
				}
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Extracting waveform data...' });

				this._Core.audioWaveform(pInputPath,
					{
						SampleRate: pSettings.SampleRate,
						Samples: pSettings.Samples
					},
					(pError, pPeaks) =>
					{
						if (pError)
						{
							return fCallback(null, {
								Outputs: { StdOut: `Waveform extraction failed: ${pError.message}`, ExitCode: 1, Result: '' },
								Log: [`OratorConversion AudioWaveform error: ${pError.message}`]
							});
						}

						return fCallback(null, {
							Outputs:
							{
								StdOut: `Extracted waveform from ${pSettings.InputFile} (${pPeaks.length} peaks)`,
								ExitCode: 0,
								Result: JSON.stringify(pPeaks),
								ContentType: 'application/json'
							},
							Log: [`OratorConversion AudioWaveform: ${pSettings.InputFile} (${pPeaks.length} peaks)`]
						});
					});
				break;
			}

			case 'ImageResize':
			{
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Resizing image...' });
				this._Core.imageResize(pInputPath,
					{
						Width: pSettings.Width,
						Height: pSettings.Height,
						Format: pSettings.Format,
						Quality: pSettings.Quality,
						AutoOrient: pSettings.AutoOrient,
						Fit: pSettings.Fit,
						Position: pSettings.Position
					},
					(pError, pOutputBuffer, pContentType) =>
					{
						if (pError)
						{
							return fCallback(null, {
								Outputs: { StdOut: `Resize failed: ${pError.message}`, ExitCode: 1, Result: '' },
								Log: [`OratorConversion ImageResize error: ${pError.message}`]
							});
						}

						try
						{
							libFS.writeFileSync(pOutputPath, pOutputBuffer);
						}
						catch (pWriteError)
						{
							return fCallback(null, {
								Outputs: { StdOut: `Write failed: ${pWriteError.message}`, ExitCode: 1, Result: '' },
								Log: [`OratorConversion ImageResize write error: ${pWriteError.message}`]
							});
						}

						return fCallback(null, {
							Outputs:
							{
								StdOut: `Resized ${pSettings.InputFile} → ${pSettings.OutputFile}`,
								ExitCode: 0,
								Result: pOutputPath,
								ContentType: pContentType || '',
								OutputSize: pOutputBuffer.length
							},
							Log: [`OratorConversion ImageResize: ${pSettings.InputFile} → ${pSettings.OutputFile} (${pOutputBuffer.length} bytes)`]
						});
					});
				break;
			}

			case 'ImageConvert':
			{
				if (fReportProgress) fReportProgress({ Percent: 10, Message: 'Converting image...' });
				this._Core.imageResize(pInputPath,
					{
						Format: pSettings.Format,
						Quality: pSettings.Quality,
						AutoOrient: pSettings.AutoOrient
					},
					(pError, pOutputBuffer, pContentType) =>
					{
						if (pError)
						{
							return fCallback(null, {
								Outputs: { StdOut: `Convert failed: ${pError.message}`, ExitCode: 1, Result: '' },
								Log: [`OratorConversion ImageConvert error: ${pError.message}`]
							});
						}

						try
						{
							libFS.writeFileSync(pOutputPath, pOutputBuffer);
						}
						catch (pWriteError)
						{
							return fCallback(null, {
								Outputs: { StdOut: `Write failed: ${pWriteError.message}`, ExitCode: 1, Result: '' },
								Log: [`OratorConversion ImageConvert write error: ${pWriteError.message}`]
							});
						}

						return fCallback(null, {
							Outputs:
							{
								StdOut: `Converted ${pSettings.InputFile} → ${pSettings.OutputFile}`,
								ExitCode: 0,
								Result: pOutputPath,
								ContentType: pContentType || '',
								OutputSize: pOutputBuffer.length
							},
							Log: [`OratorConversion ImageConvert: ${pSettings.InputFile} → ${pSettings.OutputFile} (${pOutputBuffer.length} bytes)`]
						});
					});
				break;
			}

			default:
				return fCallback(null, {
					Outputs: { StdOut: `Unknown file-path action: ${pAction}`, ExitCode: -1, Result: '' },
					Log: [`OratorConversion: unknown file-path action "${pAction}".`]
				});
		}
	}

	/**
	 * Resolve a file path relative to the staging directory.
	 * Absolute paths are returned as-is.
	 */
	_resolvePath(pFilePath, pStagingPath)
	{
		if (!pFilePath)
		{
			return null;
		}
		if (libPath.isAbsolute(pFilePath))
		{
			return pFilePath;
		}
		return libPath.join(pStagingPath, pFilePath);
	}
}

module.exports = OratorConversionBeaconProvider;
