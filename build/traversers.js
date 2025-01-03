// # traversers.js
// A file contain a bunch of traversal functions that can be used to perform 
// specific actions on menus.
import path from 'node:path';
import fs from 'node:fs';
import { Glob } from 'glob';
import { parse } from 'yaml';

const srcFolder = path.resolve(import.meta.dirname, '../src');

// # directories(fn)
// Traverse function for looping all menu directories.
export async function directories(fn) {
	let glob = new Glob('**/*/', {
		cwd: srcFolder,
		absolute: true,
	});
	for await (let folder of glob) {

		// Read in the entire folder, and filter out the files. If there are no 
		// files in the folder, we can shortcut.
		let dir = await fs.promises.readdir(folder, { withFileTypes: true });
		let files = dir
			.filter(entry => !entry.isDirectory())
			.map(entry => entry.name);
		if (files.length === 0) continue;

		// Next we have to ensure that a `_menu.yaml` file exists. If not, 
		// something is wrong.
		if (!files.includes('_menu.yaml')) {
			throw new Error(`No _menu.yaml file found in ${folder}!`);
		}
		
		// Read in the `_menu.yaml` file and parse it.
		let contents = String(await fs.promises.readFile(
			path.join(folder, '_menu.yaml'),
		));
		let menu = parse(contents);

		// Filter out the icon and menu files.
		let { icons = [], rest = [] } = Object.groupBy(files, file => {
			if (file === '_menu.yaml') return 'menu';
			else if (path.extname(file) === '.png') return 'icons';
			return 'rest';
		});

		// Read in the parent menu as well. Note that it's possible that the 
		// file doesn't exist, which is fine in this case.
		let parentFolder = path.dirname(folder);
		let parentMenuFile = path.join(parentFolder, '_menu.yaml');
		let parent = null;
		try {
			let parentContents = await fs.promises.readFile(parentMenuFile);
			parent = parse(String(parentContents));
		} catch (e) {
			if (e.code !== 'ENOENT') throw e;
		}

		// Call the callback with the files & parsed menu.
		await fn({
			dir: folder,
			parent,
			menu,
			icon: icons.length > 0 ? path.join(folder, icons.at(0)) : undefined,
			files: rest,
		});

	}
}
