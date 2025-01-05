// # build.js
import path from 'node:path';
import fs from 'node:fs';
import * as traverse from './traversers.js';
import builtinMenus from './builtins.js';
import { createSubmenuButton, createSubmenuPatch } from 'sc4/plugins';

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

	// Determine the order from the folder name.
	let dirname = path.basename(dir).replace(/^[-_]/, '');
	let [order] = dirname.split('-');

	// Generate the actual menu button now.
	let { dbpf } = await createSubmenuButton({
		name: menu.name,
		description: menu.description,
		buttonId: menu.id,
		parent: parent.id,
		order: +order,
		icon,
	});
	let slug = slugify(menu.name);
	let output = path.join(dist, 'buttons', `${slug}.dat`);
	await fs.promises.writeFile(output, dbpf.toBuffer());

});

// # createPatches()
// Creates the Exemplar patch dbpfs.
async function createPatches({ dir, menu, files }) {
	for (let file of files) {
		let contents = String(await fs.promises.readFile(path.join(dir, file)));
		let targets = contents
			.split('\n')
			.map(x => x.trim())
			.map(line => {
				let [group, instance] = line.split(',');
				return [+group, +instance];
			})
			.flat();

		let slug = path.basename(file, path.extname(file));
		let output = path.join(dist, 'patches', `${slug}.dat`);
		await createSubmenuPatch({
			menu: menu.id,
			targets,
			save: true,
			output,
		});
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
