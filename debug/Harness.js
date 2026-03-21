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

// Parse --ultravisor / -u URL from command line
// If flag is given without a URL, defaults to http://localhost:54321
let tmpUltravisorURL = null;
for (let i = 2; i < process.argv.length; i++)
{
	if ((process.argv[i] === '--ultravisor' || process.argv[i] === '-u'))
	{
		if (process.argv[i + 1] && !process.argv[i + 1].startsWith('-'))
		{
			tmpUltravisorURL = process.argv[++i];
		}
		else
		{
			tmpUltravisorURL = 'http://localhost:54321';
		}
	}
}

let tmpAnticipate = _Fable.newAnticipate();

tmpAnticipate.anticipate(_Orator.initialize.bind(_Orator));

tmpAnticipate.anticipate(
	(fNext) =>
	{
		_Fable.OratorFileTranslation.connectRoutes();
		return fNext();
	});

tmpAnticipate.anticipate(_Orator.startService.bind(_Orator));

// If an Ultravisor URL was provided, connect as a beacon
if (tmpUltravisorURL)
{
	tmpAnticipate.anticipate(
		(fNext) =>
		{
			_Fable.OratorFileTranslation.connectBeacon(
				{
					ServerURL: tmpUltravisorURL,
					Name: 'orator-conversion'
				},
				(pError) =>
				{
					if (pError)
					{
						_Fable.log.warn(`Beacon connection failed (server may not be running): ${pError.message}`);
						_Fable.log.warn('HTTP endpoints are still available. Beacon will not be active.');
					}
					return fNext();
				});
		});
}

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

		if (tmpUltravisorURL)
		{
			_Fable.log.info('');
			_Fable.log.info(`Beacon: connected to Ultravisor at ${tmpUltravisorURL}`);
		}
	});

// Graceful shutdown
process.on('SIGINT', () =>
{
	console.log('\n[Orator-Conversion] Shutting down...');
	if (_Fable.OratorFileTranslation._BeaconService)
	{
		_Fable.OratorFileTranslation.disconnectBeacon(() =>
		{
			process.exit(0);
		});
	}
	else
	{
		process.exit(0);
	}
});
