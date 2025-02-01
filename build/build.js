// # build.js
import path from 'node:path';
import fs from 'node:fs';
import { styleText } from 'node:util';
import { fileURLToPath } from 'node:url';
import * as traverse from './traversers.js';
import builtinMenus from './builtins.js';
import { hex } from 'sc4/utils';
import { createSubmenuButton, createSubmenuPatch } from 'sc4/plugins';
import { FileType, DBPF, TGI } from 'sc4/core';

// Get the path to the placeholder .png icon that we use as long as no menu icon 
// has been generated yet.
const placeholder = fileURLToPath(import.meta.resolve('../placeholder.png'));

// Create & clear dist folder.
const dist = path.resolve(import.meta.dirname, '../dist');
await fs.promises.rm(dist, { recursive: true, force: true });
await fs.promises.mkdir(dist);
await fs.promises.mkdir(path.join(dist, 'buttons'));
await fs.promises.mkdir(path.join(dist, 'patches'));

// # collectTargets()
// The function called to collect all menu ids per TGI item. Once this is 
// complete, we can actually generate the patches.
const db = {};
async function collectTargets({ dir, menu, files }) {
	for (let file of files) {
		let slug = path.basename(file, path.extname(file));
		let contents = String(await fs.promises.readFile(path.join(dir, file)));
		let type = 'lots';
		let lines = contents
			.split('\n')
			.map(x => x.trim())
			.filter(line => !!line && !line.startsWith('#'));
		for (let line of lines) {
			if (line.startsWith('Flora:')) {
				type = 'flora';
				continue;
			}
			let [ids, name] = line.split('#');
			let [group, instance] = ids.trim().split(',');
			let tgi = new TGI(FileType.Exemplar, +group, +instance);
			let pkg = db[slug] ??= {};
			let row = pkg[tgi] ??= {
				type,
				tgi,
				name: name?.trim(),
				menus: new Set(),
			};
			row.menus.add(menu.id);
		}
	}
}

await traverse.directories(async (info) => {

	// Create all the patches from the individual files.
	await collectTargets(info);

	// IMPORTANT! We don't need to generate submenus *buttons* for any of the 
	// builtin menus, these are alread handled obviously. However, for some 
	// menus we'd like to create custom icons, so we *do* override if specified.
	let { dir, menu, parent, icon = placeholder } = info;
	if (builtinMenus.has(menu.id) && !menu.override) return;

	// If this menu has no parent menu, then it normally should've been a 
	// builtin. If that's not the case, something's wrong.
	if (!parent) {
		throw new Error(`${dir} has no parent menu!`);
	}

	// Determine the order from the folder name.
	let dirname = path.basename(dir).replace(/^[-_]/, '');
	let [order] = dirname.split('-');

	// Generate the actual menu button now.
	if (icon === placeholder) {
		console.warn(styleText('yellow', `warning: ${dirname} has no icon, a placeholder icon will be used`));
	}
	let { dbpf } = await createSubmenuButton({
		name: menu.name,
		description: menu.description,
		buttonId: menu.id,
		parent: parent.id,
		order: +order,
		icon,
	});
	let slug = slugify(menu.name);
	let output = path.join(dist, 'buttons', `${slug}_${hex(menu.id)}.dat`);
	await fs.promises.writeFile(output, dbpf.toBuffer());

});

// Cool, all tgis per file have been collected. We will now group them by what 
// menus they need to appear in. Those will become the cohorts.
for (let slug of Object.keys(db)) {
	let tgis = Object.values(db[slug]);
	let grouped = Object.groupBy(tgis, entry => {
		let menus = [...entry.menus].sort();
		return menus.join('/');
	});
	let cohorts = [];
	for (let group of Object.values(grouped)) {
		let targets = {};
		for (let entry of group) {
			let pivot = targets[entry.type] ??= [];
			pivot.push({
				tgi: entry.tgi,
				name: entry.name,
			});
		}
		let [{ menus: [...menus] }] = group;
		let dbpf = await createSubmenuPatch({
			targets,
			menu: menus,
		});
		let patches = dbpf.findAll({ type: FileType.Cohort });
		cohorts.push(...patches);
	}
	let dbpf = new DBPF();
	for (let cohort of cohorts) {
		dbpf.add(cohort.tgi, cohort.read());
	}
	let output = path.join(dist, 'patches', `${slug}.dat`);
	await fs.promises.writeFile(output, dbpf.toBuffer());
}

// # slugify(name)
function slugify(name) {
	return name
		.toLowerCase()
		.replaceAll(/[^a-zA-Z0-9]+/g, ' ')
		.trim()
		.replaceAll(/ /g, '-');
}
