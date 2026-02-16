const libFable = require('fable');

const defaultFableSettings = (
	{
		Product: 'Orator-FileTranslation',
		ProductVersion: '1.0.0',
		APIServerPort: 8765
	});

let _Fable = new libFable(defaultFableSettings);

_Fable.serviceManager.addServiceType('OratorServiceServer', require('orator-serviceserver-restify'));
_Fable.serviceManager.instantiateServiceProvider('OratorServiceServer', {});

_Fable.serviceManager.addServiceType('Orator', require('orator'));
let _Orator = _Fable.serviceManager.instantiateServiceProvider('Orator', {});

const libOratorFileTranslation = require('../source/Orator-File-Translation.js');
_Fable.serviceManager.addServiceType('OratorFileTranslation', libOratorFileTranslation);
_Fable.serviceManager.instantiateServiceProvider('OratorFileTranslation', { LogLevel: 2 });

let tmpAnticipate = _Fable.newAnticipate();

tmpAnticipate.anticipate(_Orator.initialize.bind(_Orator));

tmpAnticipate.anticipate(
	(fNext) =>
	{
		_Fable.OratorFileTranslation.connectRoutes();
		return fNext();
	});

tmpAnticipate.anticipate(_Orator.startService.bind(_Orator));

tmpAnticipate.wait(
	(pError) =>
	{
		if (pError)
		{
			_Fable.log.error('Error initializing Orator Service Server: ' + pError.message, pError);
		}
		_Fable.log.info('Orator File Translation Service Server Initialized.');
		_Fable.log.info('Available endpoints:');
		_Fable.log.info('  POST http://127.0.0.1:8765/conversion/1.0/image/jpg-to-png');
		_Fable.log.info('  POST http://127.0.0.1:8765/conversion/1.0/image/png-to-jpg');
		_Fable.log.info('  POST http://127.0.0.1:8765/conversion/1.0/pdf-to-page-png/:Page');
		_Fable.log.info('  POST http://127.0.0.1:8765/conversion/1.0/pdf-to-page-jpg/:Page');
	});
