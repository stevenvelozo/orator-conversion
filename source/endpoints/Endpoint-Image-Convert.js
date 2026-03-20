const libFableServiceProviderBase = require('fable-serviceproviderbase');

const libConversionCore = require('../Conversion-Core.js');

class EndpointImageConvert extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'OratorFileTranslationEndpoint-ImageConvert';

		this.converterPath = 'image/convert/:Format';
	}

	convert(pInputBuffer, pRequest, fCallback)
	{
		let tmpParams = pRequest.params || {};
		let tmpQuery = pRequest.query || {};

		let tmpCore = new libConversionCore();

		let tmpOptions =
		{
			Format: tmpParams.Format,
			Quality: tmpQuery.Quality ? parseInt(tmpQuery.Quality, 10) : undefined
		};

		tmpCore.imageConvert(pInputBuffer, tmpOptions, fCallback);
	}
}

module.exports = EndpointImageConvert;
