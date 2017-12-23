#!/usr/bin/env node
'use strict';

const shottySettings = require('./shotty.json'),
	shotty = require('shotty-api')(shottySettings.url, shottySettings.secret),
	https = require('https'),
	fs = require('fs'),
	basename = file => require('path').parse(file).base;

const getLocalPath = async version => {
	const project = await shotty.get.project(version.projectId),
		shot = await shotty.get.shot(version.shotId);

	const path = project.versionTypes.find(type => type.label === version.type).path
		.replace(/<root>/g, project.paths.root)
		.replace(/<project>/g, project.id)
		.replace(/<type>/g, project.paths[shot.type])
		.replace(/<episode>/g, shot.sequence)
		.replace(/<code>/g, shot.code)
		.replace(/<filename>/g, version.name.substr(0, version.name.lastIndexOf('.')))
		.replace(/<file>/g, version.name);

	return path;
};

/*
	version downloader
*/
const download = version => new Promise((resolve, reject) => {
	console.log(`Downloading file <${basename(version.file.url)}>...`);

	https.get(`https://${shottySettings.url}/storage/${version.file.url}`, async response => {
		let filePath = await getLocalPath(version),
			file = fs.createWriteStream(filePath);

		response.pipe(file);

		file
		.on('error', err => console.log(err))
		.on('finish', () =>
			file.close(() => {
				console.log('Downloaded version file:', filePath);
				resolve(filePath);
			})
		);
	})
	.on('error', error => {
		console.error('Could not download the file due to error:\n', error);
		fs.unlinkSync(filePath);
		reject(error);
	});
});

/*
	finally, launching the watcher
*/
shotty.connect()
.then(async result => {
	shotty.changes('versions', {onConnect: () => console.log('Watching for changes in versions...')})
	.onDisconnect(() => console.log('Stopped watching versions.'))
	.onAdd(async version => fs.open(await getLocalPath(version), 'r', (err, fd) => err ? download(version) : false ));
})
.catch(error => console.error('Could not connect to SHOTTY', error));
