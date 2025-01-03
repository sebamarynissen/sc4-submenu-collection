# SimCity 4 Submenu Collection

A collection of third-party submenus for use with [memo's Submenus DLL](https://github.com/memo33/submenus-dll).

While not functional yet, the idea is that this repo allows easily adding new submenus by simply adding them in a human-friendly format to the folder structure.
From then on, a build script takes over and compiles the entire folder structure to `.dat` files that will create the submenu functionality.

## Adding a new submenu

If you want to add a new submenu, navigate to the appropriate folder, and then create a new folder that starts with 3-digits - which will determine the order of the submenu. *Within* that created folder, you have to create a file called `_menu.yaml`, which at least has to include a `name` field:

```yaml
name: Name of the submenu as it appears in game
```

You can optionally specify a `description` and `id` as well.
However, if you don't specify an id explicitly, then a random id will be assigned at build time, *which will be committed back to the repository*, meaning that once the random id has been generated, it will remain fixed from then on, unless manually changed again in the `_menu.yaml` file.

## Adding lots to a submenu

Navigate to the submenu folder you want the lots to appear in, and then create a `.txt` file.
The text file should contain all the [Exemplar Patch Targets](https://github.com/memo33/submenus-dll?tab=readme-ov-file#exemplar-patching) - which are the Group and Instance IDs of a building exemplar.
Every line should contain exactly *one* Group/Instance pair*, which have to be separated by a comma:

```txt
0x908CD9D2, 0xA485470C
0x908CD9D2, 0x0485403E
0x908CD9D2, 0xD485519A
...
```

You can name the file whatever you want, but preferrably you stick to the [sc4pac](https://memo33.github.io/sc4pac/#/) package name if possible.
For example, if you're creating a submenu for the package `kingofsimcity:sp-modular-parking-base-set`, then it is advised to call the txt file `kingofsimcity.sp-modular-parking-base-set.txt`.

*Note: technically you don't *need* put each pair on a line, just a comma-separated list of numbers will do as well, but it's highly advised to put them on separate lines.

## Building locally

Install [Node.js](https://nodejs.org/en) 22.11 or higher.
Then, fire up a command prompt in the root folder of this repo and run `npm install`.
From now on, you can just run `npm run build` to build all the submenus, which will be available in the `/dist` folder.

## FAQ

### Can I use the [sc4](https://github.com/sebamarynissen/sc4) cli tool to contribute to this repo?

The answer is yes, but with some workarounds.
The [sc4](https://github.com/sebamarynissen/sc4) module generates the required `.dat` files for creating a submenu, but this repo doesn't work with `.dat` files.
Instead the submenus are stored in an "extracted" way, and only get compiled back to `.dat` files in the build step.

However, if you have generated a new submenu, you can open the generated `.dat` in ILive's Reader and then export the PNG icon from it, and create a `_menu.yaml` file with the id that was generated.
Likewise, you can also open the generated exemplar patch to get all the Group/Instance pairs of lots that need to be added to the submenu.

I plan to update the [sc4](https://github.com/sebamarynissen/sc4) utility in the future so that instead of only generating `.dat` files, it will also be able to generate "exploded" menus that can then be directly added to this repo.
