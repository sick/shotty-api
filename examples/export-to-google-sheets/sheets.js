'use strict';

const fs = require('fs'),
	gAPI = require('googleapis'),
	gAuth = require('google-auth-library'),
	q = require('./q');

module.exports = class googleSheets {
	constructor(options) {
		this.options = Object.assign({
			tokenDir: (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.cache/shotty/',
			tokenPath: (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.cache/shotty/sheets.googleapis.com.json',
			secretFile: './secret.json'
		}, options);

		this.auth = null;
	}

	authorize(secretFile = this.options.secretFile) {
		return new Promise((resolve, reject) => {
			const credentials = JSON.parse(fs.readFileSync(secretFile));

			const auth = new gAuth(),
				oauth2Client = new auth.OAuth2(credentials.installed.client_id, credentials.installed.client_secret, credentials.installed.redirect_uris[0]);

			try {
				const token = fs.readFileSync(this.options.tokenPath);
				if(token) {
					oauth2Client.credentials = JSON.parse(token);
					return resolve(this.auth = oauth2Client);
				}
			}
			catch(error) {
				console.log('No token found');
			}

			console.log('Authorize this app by visiting this url: ', oauth2Client.generateAuthUrl({'access_type': 'offline', scope: ['https://www.googleapis.com/auth/spreadsheets']}));

			q('Enter the code from the page here: ')
			.then(code =>
				oauth2Client.getToken(code, (err, token) => {
					if(err)
						reject('Error while trying to retrieve access token', err);

					oauth2Client.credentials = token;

					fs.mkdir(this.options.tokenDir, err => {
						if(err && err.code !== 'EEXIST') {
							console.error('Couldn`t create a directory to store access token:', err);
							return resolve(this.auth = oauth2Client);
						}
						else {
							fs.writeFile(this.options.tokenPath, JSON.stringify(token), err => {
								if(err)
									console.error('Couldn`t store access token:', error);

								return resolve(this.auth = oauth2Client);
							});
						}
					});
				})
			)
			.catch(reject);
		});
	}

	_preCheck(spreadsheetId, promiseBody) {
		if(!this.auth)
			return new Promise((_, reject) => reject('You have to authorize first!'));

		if(!spreadsheetId)
			return new Promise((_, reject) => reject('Please, provide a spreadsheet id!'));

		return new Promise(promiseBody);
	}

	createSpreadsheet(properties, sheets = [], namedRanges = []) {
		return this._preCheck(true, (resolve, reject) =>
			gAPI.sheets('v4').spreadsheets.create({
				auth: this.auth,
				resource: {
					properties: Object.assign({title: 'New Sheet'}, properties),
					sheets: [].concat(sheets),
					namedRanges: [].concat(namedRanges)
				}
			}, (error, response) => {
				if(error)
					return reject(error);

				resolve(response);
			})
		);
	}

	getValues(spreadsheetId, range = 'A1:Z') {
		return this._preCheck(spreadsheetId, (resolve, reject) =>
			gAPI.sheets('v4').spreadsheets.values.get({
				auth: this.auth,
				spreadsheetId: spreadsheetId,
				range: range
			}, (error, response) => {
				if(error)
					return reject(error);

				resolve(response.values);
			})
		);
	}

	updateValues(spreadsheetId, data) {
		return this._preCheck(spreadsheetId, (resolve, reject) => {
			gAPI.sheets('v4').spreadsheets.values.batchUpdate({
				auth: this.auth,
				spreadsheetId: spreadsheetId,
				resource: {
					valueInputOption: 'RAW',
					data: data
				}
			}, (error, result) => {
				if(error)
					return reject(error);

				resolve(result);
			});
		});
	}

	appendValues(spreadsheetId, values, range = 'A1:Z') {
		return this._preCheck(spreadsheetId, (resolve, reject) => {
			gAPI.sheets('v4').spreadsheets.values.append({
				auth: this.auth,
				spreadsheetId: spreadsheetId,
				valueInputOption: 'RAW',
				range: range,
				resource: {
					values: [].concat(values)
				}
			}, (error, result) => {
				if(error)
					return reject(error);

				resolve(result);
			});
		});
	}

	getSpreadsheet(spreadsheetId) {
		return this._preCheck(spreadsheetId, (resolve, reject) => {
			gAPI.sheets('v4').spreadsheets.get({
				auth: this.auth,
				spreadsheetId: spreadsheetId,
				includeGridData: true,
				ranges: []
			}, (error, result) => {
				if(error)
					return reject(error);

				resolve(result);
			});
		});
	}

	updateSpreadsheet(spreadsheetId, requests) {
		return this._preCheck(spreadsheetId, (resolve, reject) => {
			gAPI.sheets('v4').spreadsheets.batchUpdate({
				auth: this.auth,
				spreadsheetId: spreadsheetId,
				resource: {requests: [].concat(requests)}
			}, (error, result) => {
				if(error)
					return reject(error);

				resolve(result);
			});
		});
	}
};

