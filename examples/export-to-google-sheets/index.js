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
	const findShotIdx = shot =>
		spreadsheetData.findIndex((row, idx) => idx > 0 && row[0] === shot.sequence && row[1] === shot.code);

	const exportShots = async shots => {
		shots = [].concat(shots); // converting anything into an array

		spreadsheetData = await sheets.get(); // update local before updating remote data

		let appendShots = shots.filter(shot => findShotIdx(shot) === -1);
		let updateShots = shots.filter(shot => !appendShots.some(s => s.id === shot.id) && !shotIsUnchanged(shot));

		return {
			appended: {
				shots: appendShots,
				result: await sheets.append(appendShots.map(shot => [shot.sequence, shot.code, shot.status, shot.description, shot.meta]))
			},
			updated: {
				shots: updateShots,
				result: await sheets.set(updateShots.map(shot => ({range: `C${findShotIdx(shot)+1}:Z`, values: [[shot.status, shot.description, shot.meta]]})))
			},
			skipped: shots.filter(shot => !appendShots.some(s => shot.id === s.id) && !updateShots.some(s => shot.id === s.id))
		};
	};

	shotty.changes('shots', {onConnect: () => console.log('Watching for changes in shots...')})
	.onDisconnect(() => console.log('Stopped watching shots.'))
	.onInit(async shots => {
		shots = shots.filter(s => s.projectId === projectCode);
		console.log(`Got ${shots.length} shots. Exporting...`);

		await exportShots(shots)
		.then(rs => console.log(`Exported shots.\n  Updated — ${rs.updated.shots.length}: ${rs.updated.shots.map(s => `<${s.sequence} ${s.code}>`) || '—'}\n  Appended — ${rs.appended.shots.length}: ${rs.appended.shots.map(s => `<${s.sequence} ${s.code}>`) || '—'}\n  Skipped — ${rs.skipped.length}: ${rs.skipped.map(s => `<${s.sequence} ${s.code}>`) || '—'}`))
		.catch(error => console.error('Couldn\'t export shots due to error: ', error));

		console.log('Exported shots. Watching...');
	})
	.onAdd(shot => shot.projectId !== projectCode ? false :
		exportShots(shot)
		.then(() => console.log(`Exported new shot: <${shot.sequence} ${shot.code}>`))
		.catch(error => console.error(`Couldn't export new shot <${shots[i].sequence} ${shots[i].code}>`, error))
	)
	.onUpdate(shot => shot.projectId !== projectCode ? false :
		exportShots(shot)
		.then(() => console.log(`Exported changed shot: <${shot.sequence} ${shot.code}>`))
		.catch(error => console.error(`Couldn't export changed shot <${shots[i].sequence} ${shots[i].code}>`, error))
	);
})();
