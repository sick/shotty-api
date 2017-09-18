#!/usr/bin/env node
'use strict';

const cmd = require('commander'),
	shottySettings = require('./shotty.json'),
	shotty = require('shotty-api')(shottySettings.url, shottySettings.secret),
	ftp = require('ftp'),
	https = require('https'),
	fs = require('fs'),
	basename = file => require('path').parse(file).base;

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
	ftp uploader
*/
const upload = file => new Promise((resolve, reject) => {
	let c = new ftp();

	c.on('ready', () => // setting up callback function which fires when ftp-connection is ready
		c.put(
			file, // path to a file to upload
			'/ftp/' + basename(file), // where to store it on ftp server
			err => err ? reject(err) : resolve(c.end()) // callback: checking if there was an error and resolving the promise if not
		)
	);

	c.connect(require('./ftp.json')); // starting ftp-connection
});

/*
	version downloader
*/
const download = version => new Promise((resolve, reject) =>
	https.get(`https://${shottySettings.url}/storage/${version.file.url}`, response => {
		let filePath = `/tmp/${basename(version.file.url)}`,
			file = fs.createWriteStream(filePath);

		response.pipe(file);

		file.on('finish', () =>
			file.close(() => {
				console.log('Downloaded version file:', filePath);
				resolve(filePath);
			})
		);
	})
	.on('error', error => {
		console.error('Could not download the file due to error:\n', error);
		fs.unlinkSync(`/tmp/${basename(version.file.url)}`);
		reject(error);
	})
);

/*
	version file remover
*/
const deleteVersion = version => fs.unlinkSync(`/tmp/${basename(version.file.url)}`);

/*
	notify function
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
		await upload(await download(latestVersion)); // downloading the version file from SHOTTY and uploading it to the ftp server

		// Notification scheme: https://github.com/sick/shotty-api/blob/master/js/schemes.md#notifications
		let results = await new Promise((resolve, reject) =>
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
							mediaUrl: `/storage/${latestVersion.file.basepath}/${latestVersion.file.preview}`,
							mediaLocation: 'web'
						}
					})
				)
			).then(resolve, reject)
		);

		deleteVersion(latestVersion);

		return results;
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
							mediaUrl: `/storage/${latestVersion.file.basepath}/${latestVersion.file.preview}`,
							mediaLocation: 'web'
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
