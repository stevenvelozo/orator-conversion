const libFableServiceProviderBase = require('fable-serviceproviderbase');

class EndpointPdfPageToJpg extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'OratorFileTranslationEndpoint-PdfPageToJpg';

		this._FileTranslation = (pOptions && pOptions.FileTranslation) ? pOptions.FileTranslation : null;

		this.converterPath = 'pdf-to-page-jpg/:Page';
	}

	convert(pInputBuffer, pRequest, fCallback)
	{
		let tmpPage = parseInt(pRequest.params.Page, 10);
		if (isNaN(tmpPage) || tmpPage < 1)
		{
			return fCallback(new Error('Invalid page number. Must be a positive integer.'));
		}

		this._FileTranslation.renderPdfPageToImage(pInputBuffer, tmpPage, 'jpeg',
			(pRenderError, pImageBuffer) =>
			{
				if (pRenderError)
				{
					return fCallback(pRenderError);
				}
				return fCallback(null, pImageBuffer, 'image/jpeg');
			});
	}
}

module.exports = EndpointPdfPageToJpg;
