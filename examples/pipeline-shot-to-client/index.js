#!/usr/bin/env node
'use strict';

const cmd = require('commander'),
	shotty = require('shotty-api')(...require('./shotty.json')),
	ftp = require('ftp');

/*
	setting up commander to read command line arguments
*/
cmd.version('6.6.6')
	.option('-p, --project <project>', 'Project code')
	.option('-u, --users [<email | id>, ...]', 'User email address or ID, one or multiple splitted by commas')
	.parse(process.argv);

/*
	project code is required
*/
if(!cmd.project)
	process.exit(console.error('Please, specify a project code!'), cmd.outputHelp());

/*
	setting up ftp uploader
*/
const upload = file => new Promise((resolve, reject) => {
	let c = new ftp();

	c.on('ready', () => // setting up callback function which fires when ftp-connection is ready
		c.put(
			file, // path to a file to upload
			'/ftp/' + require('path').parse(file).base, // where to store it on ftp server
			err => err ? reject(err) : resolve(c.end()) // callback: checking if there was an error and resolving the promise if not
		)
	);

	c.connect(require('./ftp.json')); // starting ftp-connection
});

/*
	setting up notify function
*/
const notifyUsers = async shot => {
	let allUsers = await shotty.get.users(), // getting all users
		selectedUsers = cmd.users ? cmd.users.split(',').map(u => u.trim()) : [], // splitting -u argument value into array of ids and emails
		users = allUsers.filter(au => // getting superusers and users specified in -u argument
			au.role === 'superuser' || selectedUsers.findIndex(su => au.id === su || au.local.email === su)
		);

	if(!users.length)
		throw Error('No users found!');

	let versions = await shotty.get.versions(cmd.project, shot.id), // getting versions corresponding to project code and shot
		latestVersion = versions.sort((a, b) => new Date(b.date) - new Date(a.date))[0]; // selecting the latest version

	try {
		await upload('/media/shotty/storage/' + latestVersion.file.url); // uploading a file to the ftp server

		// Notification scheme: https://github.com/sick/shotty-api/blob/master/js/schemes.md#notifications
		return await new Promise((resolve, reject) =>
			Promise.all( // creating notifications for all users and waiting for them all to be created
				users.map(user =>
					shotty.create('notification', {
						userId: user.id,
						text: `Shot <${shot.sequence} ${shot.code}> was marked as <${shot.status}>, the latest version <${latestVersion.name}> was uploaded to FTP.`,
						url: `/project/${cmd.project}/shots/${shot.sequence}/${shot.code}/versions/${latestVersion.name}`,
						previewUrl: latestVersion.file.frames && latestVersion.file.frames[0]
							? `/storage/${latestVersion.file.basepath}/frames/${latestVersion.file.frames[0]}`
							: null,
						meta: {
							caption: `The latest version for shot <${shot.sequence} ${shot.code}>`,
							mediaType: latestVersion.file.type,
							mediaUrl: '/media/shotty/storage/' + latestVersion.file.url,
							mediaLocation: 'local'
						}
					})
				)
			).then(resolve, reject)
		);
	}
	catch(error) {
		console.error('Something wrong happened', error);

		return await new Promise((resolve, reject) =>
			Promise.all(
				users.map(user =>
					shotty.create('notification', {
						userId: user.id,
						text: `Shot <${shot.sequence} ${shot.code}> was marked as <${shot.status}>, the latest version <${latestVersion.name}> wasn't uploaded to FTP due to error: ${error.msg}`,
						url: `/project/${cmd.project}/shots/${shot.sequence}/${shot.code}/versions/${latestVersion.name}`,
						previewUrl: latestVersion.file.frames && latestVersion.file.frames[0]
							? `/storage/${latestVersion.file.basepath}/frames/${latestVersion.file.frames[0]}`
							: null,
						meta: {
							caption: `The latest version for shot <${shot.sequence} ${shot.code}>`,
							mediaType: latestVersion.file.type,
							mediaUrl: '/media/shotty/storage/' + latestVersion.file.url,
							mediaLocation: 'local'
						}
					})
				)
			).then(resolve, reject)
		);
	}
};

/*
	finally, launching the watcher
*/
shotty.connect()
.then(() => {
	shotty.changes('shots', {onConnect: () => console.log('Watching for changes in shots...')})
	.onDisconnect(() => console.log('Stopped watching shots.'))
	.onUpdate((shot, oldShot) =>
		shot.projectId !== cmd.project || shot.status !== 'client' || oldShot.status === 'client'
		? false // if the updated shot is not in the specified project, or status is not <client>, or old status is <client> — skip the event
		: notifyUsers(shot) // otherwise — notify users
		.then(() => console.log('Notified users about shot', shot.sequence, shot.code))
		.catch(error => console.error(`Couldn't notify users about changes in shot <${shot.sequence} ${shot.code}>:`, error))
	);
})
.catch(error => console.error('Could not connect to SHOTTY', error));
