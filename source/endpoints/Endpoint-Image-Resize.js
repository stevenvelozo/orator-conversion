const libFableServiceProviderBase = require('fable-serviceproviderbase');
const libURL = require('url');

const libConversionCore = require('../Conversion-Core.js');

class EndpointImageResize extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'OratorFileTranslationEndpoint-ImageResize';

		this.converterPath = 'image/resize';
	}

	convert(pInputBuffer, pRequest, fCallback)
	{
		let tmpFileTranslation = this.options.FileTranslation;

		let tmpCore = new libConversionCore({
			MaxFileSize: tmpFileTranslation ? tmpFileTranslation.MaxFileSize : undefined
		});

		let tmpParams = pRequest.params || {};
		// Parse query string from the URL if pRequest.query is not available
		let tmpQuery = pRequest.query || {};
		if (Object.keys(tmpQuery).length === 0 && pRequest.url)
		{
			let tmpParsed = libURL.parse(pRequest.url, true);
			tmpQuery = tmpParsed.query || {};
		}

		let tmpOptions =
		{
			Width: tmpQuery.Width || tmpParams.Width,
			Height: tmpQuery.Height || tmpParams.Height,
			Format: tmpQuery.Format || tmpParams.Format,
			Quality: tmpQuery.Quality || tmpParams.Quality,
			Fit: tmpQuery.Fit || tmpParams.Fit,
			Position: tmpQuery.Position || tmpParams.Position,
			AutoOrient: tmpQuery.AutoOrient !== 'false'
		};

		tmpCore.imageResize(pInputBuffer, tmpOptions, fCallback);
	}
}

module.exports = EndpointImageResize;
