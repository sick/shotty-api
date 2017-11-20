#!/usr/bin/env node
'use strict';

const path = require('path'),
	program = require('commander'),
	shotty = require('shotty-api')('ava.shotty.ru', 'e1767298-5e454986-5dd845bf-a5cd8ba7-7e52b7e8');

program
	.version('1.0')
	.option('-d, --dir <path>', 'Directory with version files to upload. Current dir is used by default.', '.')
	.option('-p, --pattern ["pattern"]', 'Glob pattern. Default is "*.mov"', '*.mov')
	.option('-p, --project <project>', 'Project code')
	.option('-s, --status <status>', 'The status for new shots. Default is "new"', 'new')
	.parse(process.argv);

if(!program.project) {
	console.error('Please specify a project code with -p or --project');
	shotty.connect().then(async () => {
		console.error('Available projects: ', (await shotty.get.projects()).map(p => p.code).join(', '));
		process.exit(1);
	});
}
else {
	require('glob')(path.join(program.dir, program.pattern), (er, files) => {
		if(!files.length) {
			console.log('No files have been found!');
			return process.exit(0);
		}

		console.log(`Found ${files.length}`);

		shotty.connect().then(async () => {
			console.log('Connected to Shotty');

			let shots = await shotty.get.shots(program.project);

			files.forEach(file => {
				const filename = path.parse(file).name;
				let shot;

				console.log('Uploading file:', filename);

				if((shot = shots.find(shot => shot.code === filename))) {
					console.log('Shot already exists:', shot.sequence, shot.code);
				}
				else {
					console.log('Creating a new shot for', filename);

					shotty
					.create('shot', {
						projectId: program.project,
						sequence: filename.split('_').slice(0, 2).join('_'),
						code: filename.split('_').slice(2, 4).join('_'),
						status: program.status,
						creatorId: null
					})
					.then(shot => {
						console.log('Created new shot:', shot.sequence, shot.code);

						shotty.upload('version', file, {
							projectId: program.project,
							shotId: shot.id,
							description: '',
							type: 'src'
						})
						.then(result => console.log('Uploaded version', JSON.parse(result).data.data.name))
						.catch(error => console.error(`Couldn't upload version <${filename}>`, error));
					})
					.catch(error => console.error(`Couldn't create a shot for version ${filename}`, error));
				}
			});
		});
	});
}
