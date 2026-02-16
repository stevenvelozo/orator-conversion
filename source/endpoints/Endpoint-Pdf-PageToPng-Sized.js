const libFableServiceProviderBase = require('fable-serviceproviderbase');

class EndpointPdfPageToPngSized extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'OratorFileTranslationEndpoint-PdfPageToPngSized';

		this._FileTranslation = (pOptions && pOptions.FileTranslation) ? pOptions.FileTranslation : null;

		this.converterPath = 'pdf-to-page-png/:Page/:LongSidePixels';
	}

	convert(pInputBuffer, pRequest, fCallback)
	{
		let tmpPage = parseInt(pRequest.params.Page, 10);
		if (isNaN(tmpPage) || tmpPage < 1)
		{
			return fCallback(new Error('Invalid page number. Must be a positive integer.'));
		}

		let tmpLongSidePixels = parseInt(pRequest.params.LongSidePixels, 10);
		if (isNaN(tmpLongSidePixels) || tmpLongSidePixels < 1)
		{
			return fCallback(new Error('Invalid LongSidePixels value. Must be a positive integer.'));
		}

		this._FileTranslation.renderPdfPageToImage(pInputBuffer, tmpPage, 'png',
			(pRenderError, pImageBuffer) =>
			{
				if (pRenderError)
				{
					return fCallback(pRenderError);
				}
				return fCallback(null, pImageBuffer, 'image/png');
			},
			{ LongSidePixels: tmpLongSidePixels });
	}
}

module.exports = EndpointPdfPageToPngSized;
