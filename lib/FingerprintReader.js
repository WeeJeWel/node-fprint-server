'use strict';

const events		= require('events');
const fs			= require('fs-extra');
const fprint 		= require('node-fprint');

class FingerprintReader extends events.EventEmitter {

	constructor( opts ) {
		super();

		this.opts = Object.assign({}, {
			settingsPath: './',
			deviceId	: undefined,
			debug		: false
		}, opts);

		fprint.setDebug(3);
		if( !fprint.init() ) throw new Error('fprint not loaded');

		this._settings = {};
		this._devices = [];
		this._state = undefined;

	}

	init() {
		this._getSettings();
		this._refreshDevices();
		this._initDevice();
	}

	debug() {
		if( this.opts.debug ) this.log.apply( null, arguments );
	}

	log() {
		console.log.apply( null, arguments );
	}

	_getSettings() {
		this.debug('_getSettings');

		try {
			this._settings = fs.readJsonSync( this.opts.settingsPath );
		} catch( err ) {
			this._settings = {};
		}

	}

	_setSettings() {
		this.debug('_setSettings');

		fs.outputJsonSync( this.opts.settingsPath, this._settings );

	}

	_refreshDevices() {
		this.debug('_refreshDevices');

		this._devices = fprint.discoverDevices();
		if( this._devices.length < 1 ) throw new Error('no devices found');

		this._devices.forEach((device, i) => {
			this.log('device found:', device)
		});

	}

	_initDevice() {
		this.debug('_initDevice');

		if( this._devices.indexOf( this.opts.deviceId ) < 0 )
			throw new Error('device not found');

		this.log('using device:', this.opts.deviceId);

		this._deviceHandle = fprint.openDevice( this.opts.deviceId );
		this._startIdentify();

	}

	_startIdentify( callback ) {
		this.debug('_startIdentify');

		callback = callback || function(){}

		if( !this._deviceHandle )
			throw new Error('missing device handle');

		let fingerprintsArray = [];
		if( Array.isArray( this._settings.fingerprints ) ) {
			this._settings.fingerprints.forEach(( fingerprintObj ) => {
				fingerprintsArray.push( fingerprintObj );
			});
		}

		fprint.identifyStart(this._deviceHandle, fingerprintsArray, ( state, message, index ) => {
			console.log('state', state, 'message', message, 'index', index)

			this._state = 'identify';

			if( message === 'identify-succeeded' )
				this.emit('identify', this._settings.fingerprints[ index ].data );

			this._stopIdentify(() => {
				this._startIdentify();
			});
		});
	}

	_stopIdentify( callback ) {
		this.debug('_stopIdentify');

		callback = callback || function(){}

		if( !this._deviceHandle )
			throw new Error('missing device handle');

		if( this._state === 'identify' ) {
			fprint.identifyStop( this._deviceHandle, () => {
				this._state = undefined;
				callback();
			});
		} else {
			callback();
		}

	}

	enroll( data, callback ) {
		callback = callback || function(){}

		if( !this._deviceHandle )
			throw new Error('missing device handle');

		data = Object.assign({
			name	: 'New User'
		}, data);

		this._stopIdentify(() => {

			fprint.enrollStart( this._deviceHandle, ( state, message, fingerprint ) => {
				console.log('state', state, 'message', message, 'fingerprint', fingerprint)

				this._state = 'enroll';

				if( message === 'enroll-completed' ) {

	                fprint.enrollStop( this._deviceHandle, () => {
						callback( null, true );

						this._state = undefined;

						this._settings.fingerprints = this._settings.fingerprints || [];
						this._settings.fingerprints.push({
							data		: data,
							fingerprint	: fingerprint
						});
						this._setSettings();

						this._startIdentify();
	                });
				} else {

				}

	        });

        });


	}

}

module.exports = FingerprintReader;