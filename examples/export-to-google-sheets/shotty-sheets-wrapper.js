'use strict';

module.exports = class shottySheetsWrapper extends (require('./sheets')){
	constructor(options) {
		super(options);
		this.spreadsheet = null;
	}

	set(...args) {
		if(typeof args[0] !== 'string')
			args.unshift(this.spreadsheet.spreadsheetId);

		return super.updateValues(...args);
	}

	get(...args) {
		if(typeof args[0] !== 'string')
			args.unshift(this.spreadsheet.spreadsheetId);

		return super.getValues(...args);
	}

	append(...args) {
		if(typeof args[0] !== 'string')
			args.unshift(this.spreadsheet.spreadsheetId);

		return super.appendValues(...args);
	}

	async getSpreadsheet(id) {
		return this.spreadsheet = await super.getSpreadsheet(id);
	}

	create(title = 'SHOTTY — untitled', rows = 1000, columns = 10) {
		return super.createSpreadsheet({
			title: title
		}, {
			properties: {
				title: 'Shots #1',
				gridProperties: {
					rowCount: rows,
					columnCount: columns,
					frozenRowCount: 1,
					frozenColumnCount: 2
				}
			}
		})
		.then(spreadsheet => {
			this.spreadsheet = spreadsheet;
			return this.init(this.spreadsheet);
		});
	}

	init(spreadsheet) {
		return new Promise((resolve, reject) =>
			super.updateSpreadsheet(spreadsheet.spreadsheetId, [
				{
					updateCells: {
						start: {sheetId: spreadsheet.sheets[0].properties.sheetId, rowIndex: 0, columnIndex: 0},
						rows: [{
							values: [{
								userEnteredValue: {stringValue: 'Sequence'},
								userEnteredFormat: {textFormat: {bold: true}}
							}, {
								userEnteredValue: {stringValue: 'Code'},
								userEnteredFormat: {textFormat: {bold: true}}
							}, {
								userEnteredValue: {stringValue: 'Status'},
								userEnteredFormat: {textFormat: {bold: true}}
							}, {
								userEnteredValue: {stringValue: 'Description'},
								userEnteredFormat: {textFormat: {bold: true}}
							}, {
								userEnteredValue: {stringValue: 'Meta'},
								userEnteredFormat: {textFormat: {bold: true}}
							}]
						}],
						fields: 'userEnteredValue,userEnteredFormat.textFormat'
					}
				}, {
					addProtectedRange: {
						protectedRange: {
							description: 'Columns names',
							warningOnly: true,
							range: {
								sheetId: spreadsheet.sheets[0].properties.sheetId,
								startRowIndex: 0,
								endRowIndex: 1,
								startColumnIndex: 0,
								endColumnIndex: 5
							}
						}
					}
				}, {
					addProtectedRange: {
						protectedRange: {
							description: 'Shots Sequences',
							warningOnly: true,
							range: {
								sheetId: spreadsheet.sheets[0].properties.sheetId,
								startRowIndex: 1,
								endRowIndex: 999,
								startColumnIndex: 0,
								endColumnIndex: 1
							}
						}
					}
				}, {
					addProtectedRange: {
						protectedRange: {
							description: 'Shots Codes',
							warningOnly: true,
							range: {
								sheetId: spreadsheet.sheets[0].properties.sheetId,
								startRowIndex: 1,
								endRowIndex: 999,
								startColumnIndex: 1,
								endColumnIndex: 2
							}
						}
					}
				}
			])
			.then(() => resolve(spreadsheet))
			.catch(reject)
		);
	}
};
