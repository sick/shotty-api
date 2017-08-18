#!/usr/bin/env node
'use strict';

const fs = require('fs'),
	path = require('path'),
	request = require('request'),
	glob = require('glob'),
	program = require('commander');

const secret = 'your-api-key';
const shottyUrl = 'you-shotty-url';
const shotty = require('shotty-api')(shottyUrl, secret);

program
	.version('0.1.0')
	.option('-d, --dir <path>', 'Directory with versions to upload, default is current dir', '.')
	.option('-g, --glob ["pattern"]', 'Glob pattern, default is "*.mov"', '*.mov')
	.option('-p, --project <project>', 'Project code value')
	.option('-s, --status <status>', 'status for new shots, default "new"', 'new')
	.parse(process.argv);

if(typeof program.project === 'undefined') {
	console.error('no project code given! exiting...');
	process.exit(1);
}

glob(path.join(program.dir, program.glob), (er, files) => {
	if(files.length) {
		shotty.connect().then(async () => {
			const users = await shotty.get.users(),
				creator = users.find(user => user.local.email === 'support@shottyapp.com'),
				shots = await shotty.get.shots(projectId=program.project);
			files.map(file => {
				console.log(file);

				const filename = path.parse(file).name;
				shots.some(shot => shot.code === filename)
					? console.log('shot already exists')
					: shotty.create('shot', {projectId: program.project, sequence: `ep${filename.slice(0, 2)}`, creatorId: null, code: filename, status: program.status})
					.then(shot => {
						const payload = {
							secret: secret,
							projectId: program.project,
							shotId: shot.id,
							name: filename,
							iteration: 0,
							creatorId: creator.id,
							description: '',
							type: 'src',
							file: fs.createReadStream(file)
						};

						request.post({url: `https://${shottyUrl}/upload/version`, formData: payload})
							.on('response', response => {
								console.log(`Uploading ${payload.name} ${response.statusCode}\n`);
							})
							.on('error', err => {
								console.log(err);
							});
					})
					.catch(error => console.error('cannot create shot', error));
			});
		});
	} else {
		console.log('Can\'t find any file with given pattern');
		process.exit(1);
	}
});
