#!/usr/bin/env node
'use strict';

const cmd = require('commander'),
	shotty = require('shotty-api')(...require('./shotty.json')),
	ftp = require('ftp');

cmd.version('6.6.6')
	.option('-p, --project <project>', 'Project code')
	.option('-u, --users [<email | id>, ...]', 'User email address or ID, one or multiple splitted by commas')
	.parse(process.argv);

if(!cmd.project)
	process.exit(console.error('Please, specify a project code!'), cmd.outputHelp());

const upload = file => new Promise((resolve, reject) => {
	let c = new ftp();
	c.on('ready', () =>
		c.put(file, '/ftp/' + require('path').parse(file).base, err => err ? reject(err) : resolve(c.end()))
	);
	c.connect(require('./ftp.json'));
});

const notifyUser = async shot => {
	let allUsers = await shotty.get.users(),
		selectedUsers = cmd.users.split(',').map(u => u.trim()),
		users = allUsers.filter(au => au.role === 'superuser' || selectedUsers.findIndex(su => au.id === su || au.local.email === su));

	if(!users.length)
		throw Error('No users found!');

	let versions = await shotty.get.versions(cmd.project, shot.id),
		latestVersion = versions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

	try {
		await upload('/media/shotty/storage/' + latestVersion.file.url);

		// Notification scheme: https://github.com/sick/shotty-api/blob/master/js/schemes.md#notifications
		return await new Promise((resolve, reject) =>
			Promise.all(
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

shotty.connect()
.then(() => {
	shotty.changes('shots', {onConnect: () => console.log('Watching for changes in shots...')})
	.onDisconnect(() => console.log('Stopped watching shots.'))
	.onUpdate((shot, oldShot) => shot.projectId !== cmd.project || shot.status !== 'client' || oldShot.status === 'client' ? false :
		notifyUser(shot)
		.then(() => console.log('Notified user about shot', shot.sequence, shot.code))
		.catch(error => console.error(`Couldn't notify user about changes in shot <${shot.sequence} ${shot.code}>:`, error))
	);
})
.catch(console.error);
