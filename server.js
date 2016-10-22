'use strict';

const express 			= require('express');
const socketIo			= require('socket.io');
const cors				= require('cors');
const bodyParser		= require('body-parser');
const yargs 			= require('yargs').argv;

const FingerprintReader	= require('./lib/FingerprintReader.js');

const port = process.env.FPRINT_SERVER_PORT || yargs.port || 4444;

const reader = new FingerprintReader({
	deviceId		: process.env.FPRINT_SERVER_DEVICE || yargs.device || 'Digital Persona U.are.U 4000/4000B/4500',
	settingsPath	: process.env.FPRINT_SERVER_CONFPATH || yargs.db || './db.json',
	debug			: true
})
	.on('identify', _onIdentify)
	.on('user-add', _onUserAdd)
	.on('user-update', _onUserUpdate)
	.on('user-delete', _onUserDelete)
	.init();

const server = express()

	.use( cors() )
	.use( bodyParser.json() )

	.use(( req, res, next ) => {

		res.locals.success = function( message, statusCode ) {
			return res
				.status( statusCode || 200 )
				.json({
					success: true,
					message: message
				})
		}

		res.locals.error = function( message, statusCode ) {

			if( message instanceof Error )
				message = message.message || message.toString()

			return res
				.status( statusCode || 500 )
				.json({
					success: false,
					message: message
				})
		}

		next();

	})

	.get( '/api/user/:id', ( req, res ) => {

		let user = reader.getUser( req.params.id, ( req.query.fingerprints === '1' ) );
		if( user instanceof Error ) return res.locals.error( user );
		return res.locals.success( user );

	})
	.get( '/api/user', ( req, res ) => {

		let users = reader.getUsers( ( req.query.fingerprints === '1' ) );
		if( users instanceof Error ) return res.locals.error( users );
		return res.locals.success( users );

	})
	.put( '/api/user/:id', ( req, res ) => {

		let user = reader.updateUser( req.params.id, req.body );
		if( user instanceof Error ) return res.locals.error( user );
		return res.locals.success( user );

	})
	.post( '/api/user', ( req, res ) => {

		reader.addUser( req.body, ( err, result ) => {
			if( err ) return res.locals.error( err );
			return res.locals.success( result );
		});

	})
	.delete( '/api/user/:id', ( req, res ) => {

		let user = reader.deleteUser( req.params.id );
		if( user instanceof Error ) return res.locals.error( user );
		return res.locals.success( user );

	})

	.listen( port, () => {
		console.log(`fprint server running on port ${port}...`);
	});

const io = socketIo( server );

function _onIdentify( userId, userData ) {
	io.sockets.emit('identify', userId, userData );
}

function _onUserAdd( userId, userData ) {
	io.sockets.emit('user-add', userId, userData );
}

function _onUserUpdate( userId, userData ) {
	io.sockets.emit('user-update', userId, userData );
}

function _onUserDelete( userId ) {
	io.sockets.emit('user-delete', userId );
}