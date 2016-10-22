# node-fprint-server
HTTP server for libfprint to enroll &amp; identify remotely. Users can be retrieved, registered, updated and deleted using HTTP, identify events are emitted using Socket.io.

This project is not meant to be used as a Node.js module but rather as a standalone application.

## Installation

Make sure you have the Linux packages `libfprint0` and `libfprint-dev` installed.

Execute in your console:

```
git clone https://github.com/WeeJeWel/node-fprint-server
cd node-fprint-server
npm install
node server.js --db /writable/path/to/database.json --device "Name of your fingerprint device" --port 4444
```

e.g. when running on a Raspberry Pi with a Microsoft Fingerprint Reader:

```
node server.js --db /home/pi/fingerprintserver.json --device "Digital Persona U.are.U 4000/4000B/4500"
```

_Hint: run the server once to get a list of devices._

## HTTP API

### Get all users ###
Append `?fingerprint=1` to get the binary fingerprint data as well.

```
GET /api/user
```

### Get a single user ###

```
GET /api/user/:id
```

###Create a user ###
After invoking this call, the user must place a finger on the Fingerprint Reader Device.

The body is a 'data' object, where additional information can be placed such as a name.

```
POST /api/user

{
	"name": "Chares"
}
```

### Edit a user's data object ###

```
PUT /api/user

{
	"name": "Charles"
}
```

### Delete a user ###
```
DELETE /api/user/:id
```

## Socket.io API

Also see `./examples/client.js`

```
	socket
	
		// when a user is identified (finger recognized)
		.on('identify', function( userId, userData ){
			console.log('[on identify]', 'userId:', userId, 'userData:', userData );
		})
		
		// when a user is added
		.on('user-add', function( userId, userData ){
			console.log('[on user-add]', 'userId:', userId, 'userData:', userData );
		})
		
		// when a user is updated
		.on('user-update', function( userId, userData ){
			console.log('[on user-update]', 'userId:', userId, 'userData:', userData );
		})
		
		// when a user is deleted
		.on('user-delete', function( userId ){
			console.log('[on user-delete]', 'userId:', userId );
		})
```