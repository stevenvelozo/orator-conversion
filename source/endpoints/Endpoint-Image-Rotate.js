const libFableServiceProviderBase = require('fable-serviceproviderbase');

const libConversionCore = require('../Conversion-Core.js');

class EndpointImageRotate extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'OratorFileTranslationEndpoint-ImageRotate';

		this.converterPath = 'image/rotate/:Angle';
	}

	convert(pInputBuffer, pRequest, fCallback)
	{
		let tmpCore = new libConversionCore();

		let tmpParams = pRequest.params || {};
		let tmpQuery = pRequest.query || {};

		let tmpOptions =
		{
			Angle: tmpParams.Angle,
			Flip: (tmpQuery.Flip === 'true' || tmpQuery.Flip === '1'),
			Flop: (tmpQuery.Flop === 'true' || tmpQuery.Flop === '1')
		};

		tmpCore.imageRotate(pInputBuffer, tmpOptions, fCallback);
	}
}

module.exports = EndpointImageRotate;
