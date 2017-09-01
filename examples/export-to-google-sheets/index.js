#!/usr/bin/env node
'use strict';

const sheets = new (require('./shotty-sheets-wrapper'))(),
	commander = require('commander'),
	shotty = require('shotty-api')('demo.shottyapp.com', 'a5cf1c75-4f863909-c632683e-5a0e820d-731eb5be'),
	q = require('./q');

commander.version('0.0.42')
	.option('-p, --project [project]', 'Project code')
	.option('-s, --spreadsheet [spreadsheetId]', 'Spreadsheet ID')
	.option('-a, --auth', 'Get Google API token and exit')
	.parse(process.argv);

(async () => {
	await sheets.authorize();
	console.log('Authorized Google Sheets API');

	if(commander.auth)
		return process.exit(0);

	console.log('Connecting to Shotty...');
	await shotty.connect();

	const projects = await shotty.get.projects();
	let projectCode = commander.project;

	while(!projects.some(p => p.code === projectCode))
		projectCode = await q(`Please choose one of these projects: ${projects.map(p => p.code).join(', ')}: `);

	console.log(`<${projectCode}> was chosen.`);

	let spreadsheet = null,
		spreadsheetData = null;

	if(!commander.spreadsheet) {
		console.log('Creating a spreadsheet...');
		spreadsheet = await sheets.create('SHOTTY — ' + projectCode);
		spreadsheetData = await sheets.get();
		console.log(`Created a spreadsheet <${spreadsheet.properties.title}> (id: ${spreadsheet.spreadsheetId})`);
	}
	else {
		console.log('Getting the specified spreadsheet...');
		spreadsheet = await sheets.getSpreadsheet(commander.spreadsheet);
		spreadsheetData = await sheets.get();
		console.log(`Got spreadsheet <${spreadsheet.properties.title}> (id: ${spreadsheet.spreadsheetId})`);
	}

	const eq = (a, b) => (a || '') == (b || '');
	const shotIsUnchanged = shot =>
		spreadsheetData.some(r => r[0] === shot.sequence && r[1] === shot.code && eq(r[2], shot.status) && eq(r[3], shot.description) && eq(r[4], shot.meta));

	const exportShot = async (shot, update = true) => {
		if(update)
			spreadsheetData = await sheets.get(); // update local before updating remote data

		let idx = spreadsheetData.findIndex((row, idx) => idx > 0 && row[0] === shot.sequence && row[1] === shot.code);

		return (idx === -1)
			? await sheets.append([[shot.sequence, shot.code, shot.status, shot.description, shot.meta]])
			: !shotIsUnchanged(shot) ? await sheets.set({range: `C${idx+1}:Z`, values:[[shot.status, shot.description, shot.meta]]}) : false;
	};

	shotty.changes('shots', {onConnect: () => console.log('Watching for changes in shots...')})
	.onDisconnect(() => console.log('Stopped watching shots.'))
	.onInit(async shots => {
		shots = shots.filter(s => s.projectId === projectCode);
		console.log(`Got ${shots.length} shots. Exporting...`);

		for(let i = 0; i < shots.length; i++) { // we should do this in a sync way, since google is not good at async <append> updates
			await exportShot(shots[i], false)
			.then(result => !result ? console.log(`Skipped exporting shot <${shots[i].sequence} ${shots[i].code}>`) : console.log(`Exported shot <${shots[i].sequence} ${shots[i].code}>`))
			.catch(error => console.error(`Couldn't export shot <${shots[i].sequence} ${shots[i].code}>`, error));
		}
		console.log('Exported shots. Watching...');
	})
	.onAdd(shot => shot.projectId !== projectCode ? false :
		exportShot(shot)
		.then(() => console.log(`Exported new shot: <${shot.sequence} ${shot.code}>`))
		.catch(error => console.error(`Couldn't export new shot <${shots[i].sequence} ${shots[i].code}>`, error))
	)
	.onUpdate(shot => shot.projectId !== projectCode ? false :
		exportShot(shot)
		.then(() => console.log(`Exported changed shot: <${shot.sequence} ${shot.code}>`))
		.catch(error => console.error(`Couldn't export changed shot <${shots[i].sequence} ${shots[i].code}>`, error))
	);
})();
