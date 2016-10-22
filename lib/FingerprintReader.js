'use strict';

const events		= require('events');
const fs			= require('fs-extra');
const fprint 		= require('node-fprint');
const uuid			= require('node-uuid');
const _				= require('underscore');

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

		return this;
	}

	_debug() {
		if( this.opts.debug ) this._log.apply( null, arguments );
	}

	_log() {
		console.log.apply( null, arguments );
	}

	_getSettings() {
		this._debug('_getSettings');

		try {
			this._settings = fs.readJsonSync( this.opts.settingsPath );
		} catch( err ) {
			this._settings = {};
		}

	}

	_setSettings() {
		this._debug('_setSettings');

		fs.outputJsonSync( this.opts.settingsPath, this._settings );

	}

	_refreshDevices() {
		this._debug('_refreshDevices');

		this._devices = fprint.discoverDevices();
		if( this._devices.length < 1 ) throw new Error('no devices found');

		this._devices.forEach((device, i) => {
			this._log('device found:', device)
		});

	}

	_initDevice() {
		this._debug('_initDevice');

		if( this._devices.indexOf( this.opts.deviceId ) < 0 )
			throw new Error(`device not found: ${this.opts.deviceId}`);

		this._log('using device:', this.opts.deviceId);

		this._deviceHandle = fprint.openDevice( this.opts.deviceId );
		this._startIdentify();

	}

	_startIdentify( callback ) {
		this._debug('_startIdentify');

		callback = callback || function(){}

		if( !this._deviceHandle )
			throw new Error('missing device handle');

		let usersArray = [];
		let users = this.getUsers();
		users.forEach(( fingerprintObj ) => {
			usersArray.push( fingerprintObj.fingerprint );
		});

		fprint.identifyStart(this._deviceHandle, usersArray, ( state, message, index ) => {
			this._debug('identifyStart state', state, 'message', message, 'index', index)

			this._state = 'identify';

			if( message === 'identify-succeeded' )
				this.emit('identify', users[ index ].id, users[ index ].data );

			this._stopIdentify(() => {
				this._startIdentify();
			});
		});
	}

	_stopIdentify( callback ) {
		this._debug('_stopIdentify');

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

	getUsers( returnFingerprint ) {

		let result = [];

		this._settings.users = this._settings.users || [];
		this._settings.users.forEach((user) => {
			result.push( this.getUser( user.id, returnFingerprint ) );
		});

		return result;
	}

	getUser( userId, returnFingerprint ) {

		if( typeof returnFingerprint !== 'boolean' )
			returnFingerprint = true;

		let user = _.findWhere( this._settings.users, {
			id: userId
		});

		if( user ) {
			if( returnFingerprint === true ) return user;
			let userClone = _.clone( user );
			delete userClone.fingerprint;
			return userClone;
		}

		return new Error('invalid_user');
	}

	addUser( data, callback ) {
		callback = callback || function(){}

		if( !this._deviceHandle )
			throw new Error('missing device handle');

		let userId = uuid.v4()

		data = Object.assign({
			name	: 'New User'
		}, data);

		this._stopIdentify(() => {

			fprint.enrollStart( this._deviceHandle, ( state, message, fingerprint ) => {
				this._debug('enrollStart state', state, 'message', message, 'fingerprint', fingerprint)

				this._state = 'enroll';

				if( message === 'enroll-completed' ) {

	                fprint.enrollStop( this._deviceHandle, () => {

						this._state = undefined;

						this._settings.users = this._settings.users || [];
						this._settings.users.push({
							id			: userId,
							data		: data,
							fingerprint	: fingerprint
						});
						this._setSettings();

						this.emit('user-add', userId, data);

						callback( null, this.getUser( userId, false ) );

						this._startIdentify();
	                });
				} else {

				}

	        });

        });


	}

	updateUser( userId, newUserData ) {

		let user = this.getUser( userId );
		if( user instanceof Error ) return user;

		user.data = newUserData;
		this._setSettings();

		this.emit('user-update', userId, newUserData);

		return this.getUser( userId, false );

	}

	deleteUser( userId ) {

		this._settings.users = this._settings.users || [];
		this._settings.users = _.without( this._settings.users, this.getUser( userId ) );
		this._setSettings();

		this.emit('user-delete', userId);

		this._stopIdentify(() => {
			this._startIdentify();
		})

	}

}

module.exports = FingerprintReader;