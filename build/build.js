// # build.js
import path from 'node:path';
import fs from 'node:fs';
import * as traverse from './traversers.js';
import createSubmenuButton from 'sc4/api/create-submenu-button.js';
import { DBPF, Cohort, ExemplarProperty, FileType } from 'sc4/core';
import { randomId } from 'sc4/utils';
import builtinMenus from './builtins.js';

// Create & clear dist folder.
const dist = path.resolve(import.meta.dirname, '../dist');
await fs.promises.rm(dist, { recursive: true, force: true });
await fs.promises.mkdir(dist);
await fs.promises.mkdir(path.join(dist, 'buttons'));
await fs.promises.mkdir(path.join(dist, 'patches'));

await traverse.directories(async (info) => {

	// Create all the patches from the individual files.
	await createPatches(info);

	// IMPORTANT! We don't need to generate submenus *buttons* for any of the 
	// builtin menus, these are alread handled obviously.
	let { dir, menu, parent, icon } = info;
	if (builtinMenus.has(menu.id)) return;

	// If this menu has no parent menu, then it normally should've been a 
	// builtin. If that's not the case, something's wrong.
	if (!parent) {
		throw new Error(`${dir} has no parent menu!`);
	}

	// Generate the actual menu button now.
	let { dbpf } = await createSubmenuButton({
		name: menu.name,
		description: '',
		buttonId: menu.id,
		parent: parent.id,
		icon,
	});
	let slug = slugify(menu.name);
	let output = path.join(dist, 'buttons', `${slug}.dat`);
	await fs.promises.writeFile(output, dbpf.toBuffer());

});

// # createPatches()
// Creates the Exemplar patch dbpfs.
async function createPatches({ dir, menu, parent, icon, files }) {
	for (let file of files) {
		let contents = String(await fs.promises.readFile(path.join(dir, file)));
		let gis = contents
			.split('\n')
			.map(x => x.trim())
			.map(line => {
				let [group, instance] = line.split(',');
				return [+group, +instance];
			})
			.flat();

		// Create a fresh Cohort file and add the Exemplar Patch Targets 
		// (0x0062e78a) and Building Submenus (0xAA1DD399)
		let cohort = new Cohort();
		cohort.addProperty(ExemplarProperty.ExemplarPatchTargets, gis);
		cohort.addProperty(0xAA1DD399, [menu.id]);

		// Create an empty dbpf and add the cohort to it, assign it a random 
		// instance id by default.
		let dbpf = new DBPF();
		dbpf.add([FileType.Cohort, 0xb03697d1, randomId()], cohort);

		// Save as well.
		let slug = path.basename(file, path.extname(file));
		let output = path.join(dist, 'patches', `${slug}.dat`);
		await fs.promises.writeFile(output, dbpf.toBuffer());

	}
}

// # slugify(name)
function slugify(name) {
	return name
		.toLowerCase()
		.replaceAll(/[^a-zA-Z0-9]+/g, ' ')
		.trim()
		.replaceAll(/ /g, '-');
}
