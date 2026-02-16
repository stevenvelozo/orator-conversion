const libFableServiceProviderBase = require('fable-serviceproviderbase');

const libSharp = require('sharp');

class EndpointImageJpgToPng extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'OratorFileTranslationEndpoint-ImageJpgToPng';

		this.converterPath = 'image/jpg-to-png';
	}

	convert(pInputBuffer, pRequest, fCallback)
	{
		libSharp(pInputBuffer)
			.png()
			.toBuffer()
			.then(
				(pOutputBuffer) =>
				{
					return fCallback(null, pOutputBuffer, 'image/png');
				})
			.catch(
				(pError) =>
				{
					return fCallback(pError);
				});
	}
}

module.exports = EndpointImageJpgToPng;
