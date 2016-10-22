'use strict';

const socketIoClient = require('socket.io-client');

const socket = socketIoClient( process.argv[2] || 'http://localhost:4444' );
	socket
		.on('connect', function(){
			console.log('[on connect]');
		})
		.on('disconnect', function(){
			console.log('[on disconnect]');
		})
		.on('identify', function( userId, userData ){
			console.log('[on identify]', 'userId:', userId, 'userData:', userData );
		})
		.on('user-add', function( userId, userData ){
			console.log('[on user-add]', 'userId:', userId, 'userData:', userData );
		})
		.on('user-update', function( userId, userData ){
			console.log('[on user-update]', 'userId:', userId, 'userData:', userData );
		})
		.on('user-delete', function( userId ){
			console.log('[on user-delete]', 'userId:', userId );
		})