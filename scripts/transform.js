// # transform.js
import path from 'node:path';
import fs from 'node:fs';
import { Glob } from 'glob';
import { SubmenuPatcher } from 'sc4/plugins';
import { hex } from 'sc4/utils';

// First we'll lookup all .sc4pac folders. Each folder will be transform to a single .txt
const glob = new Glob('**/*.sc4pac/', {
	cwd: path.join(import.meta.dirname, '../src'),
	absolute: true,
});

const patcher = new SubmenuPatcher();
for await (let directory of glob) {
	let targets = await patcher.findPatchTargets({ directory });
	let lots = targets.lots.map(target => {
		let line = [hex(target.tgi.group), hex(target.tgi.instance)].join(', ');
		if (target.name) {
			line += ` # ${target.name}`;
		}
		return `${line}\n`;
	}).sort().join('');
	let flora = targets.flora.map(target => {
		let line = [hex(target.tgi.group), hex(target.tgi.instance)].join(', ');
		if (target.name) {
			line += ` # ${target.name}`;
		}
		return `${line}\n`;
	}).sort().join('');
	let file = lots;
	if (flora) {
		file += `Flora:\n${flora}`;
	}
	let dirname = path.dirname(directory);
	let [group, name] = path.basename(directory).split('.');
	let fullPath = path.join(dirname, `${group}.${name}.txt`);
	await fs.promises.writeFile(fullPath, file);
}
