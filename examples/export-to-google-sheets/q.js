'use strict';

module.exports = question =>
	new Promise(resolve => {
		const rl = require('readline').createInterface({input: process.stdin, output: process.stdout});
		rl.question(question, answer => {
			resolve(answer.trim());
			rl.close();
		});
	});
