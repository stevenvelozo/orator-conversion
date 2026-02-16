const libFableServiceProviderBase = require('fable-serviceproviderbase');

class EndpointPdfPageToPng extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'OratorFileTranslationEndpoint-PdfPageToPng';

		this._FileTranslation = (pOptions && pOptions.FileTranslation) ? pOptions.FileTranslation : null;

		this.converterPath = 'pdf-to-page-png/:Page';
	}

	convert(pInputBuffer, pRequest, fCallback)
	{
		let tmpPage = parseInt(pRequest.params.Page, 10);
		if (isNaN(tmpPage) || tmpPage < 1)
		{
			return fCallback(new Error('Invalid page number. Must be a positive integer.'));
		}

		this._FileTranslation.renderPdfPageToImage(pInputBuffer, tmpPage, 'png',
			(pRenderError, pImageBuffer) =>
			{
				if (pRenderError)
				{
					return fCallback(pRenderError);
				}
				return fCallback(null, pImageBuffer, 'image/png');
			});
	}
}

module.exports = EndpointPdfPageToPng;
