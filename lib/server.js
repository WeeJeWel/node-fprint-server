'use strict';

const express 			= require('express');
const cors				= require('cors');
const bodyParser		= require('body-parser');

const FingerprintReader	= require('./FingerprintReader.js');

const port = process.env.FPRINT_SERVER_PORT || process.argv[2] || 4444;

var reader = new FingerprintReader({
	deviceId: process.env.FPRINT_SERVER_DEVICE || process.argv[3] || 'Digital Persona U.are.U 4000/4000B/4500',
	settingsPath: '/home/pi/prints.json',
	debug: true
});
reader.init();

reader.on('identify', console.log)

express()

	.use( cors() )
	.use( bodyParser.json() )

	.get( '/api/fingerprint', ( req, res ) => {

	})

	// add a new fingerprint
	.post( '/api/fingerprint', ( req, res ) => {

		reader.enroll( req.body, ( err, result ) => {
			if( err ) return res
				.status(500)
				.json({
					success: false,
					message: err.message || err.toString()
				})

			return res
				.json({
					success: true,
					message: result
				})
		});

	})

	/*
	.get( '/webhook', webhook.get )
	.post( '/webhook', webhook.post )
	.delete( '/webhook/:id', webhook.delete )
	*/

	.listen( port, () => {
		console.log(`fprint server running on port ${port}...`);
	});