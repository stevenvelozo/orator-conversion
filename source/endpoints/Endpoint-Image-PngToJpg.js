const libFableServiceProviderBase = require('fable-serviceproviderbase');

const libSharp = require('sharp');

class EndpointImagePngToJpg extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'OratorFileTranslationEndpoint-ImagePngToJpg';

		this.converterPath = 'image/png-to-jpg';
	}

	convert(pInputBuffer, pRequest, fCallback)
	{
		libSharp(pInputBuffer)
			.jpeg()
			.toBuffer()
			.then(
				(pOutputBuffer) =>
				{
					return fCallback(null, pOutputBuffer, 'image/jpeg');
				})
			.catch(
				(pError) =>
				{
					return fCallback(pError);
				});
	}
}

module.exports = EndpointImagePngToJpg;
