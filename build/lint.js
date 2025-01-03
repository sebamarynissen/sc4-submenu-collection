// # lint.js
import chalk from 'chalk';
import path from 'node:path';
import * as traverse from './traversers.js';
const src = path.resolve(import.meta.dirname, '../src');

let logs = [];
await traverse.directories(function({ dir }) {

	let basename = path.basename(dir);
	let [hex] = basename
		.replace(/^_/, '')
		.split('-');
	let rel = path.relative(src, dir);
	if (!hex.match(/^0x[0-9A-Fa-f]{8}/)) {
		logs.push({
			type: 'error',
			message: `Folder ${chalk.cyan(rel)} must start with a valid 32-bit hexadecimal number.`,
		});
	}
	let nr = +hex;
	if (0x80000000 <= nr && nr <= 0xffffffff) {
		if (!basename.startsWith('_')) {
			logs.push({
				type: 'error',
				message: `Folder ${chalk.cyan(rel)} has a negative Item Order and must be prefixed with _`,
			});
		}
	}

});

for (let log of logs) {
	if (log.type === 'error') {
		console.error(log.message);
	} else if (log.type === 'warning') {
		console.warn(log.message);
	}
}

let errors = logs.filter(log => log.type === 'error');
if (errors.length > 0) {
	process.exit(1);
}
