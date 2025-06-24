# jupyterlab_apod

[![Github Actions Status](/workflows/Build/badge.svg)](/actions/workflows/build.yml)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh//main?urlpath=lab)


JupyterLab Extension aimed at making code reuse easier. Inspiration taken directly from Elyra code snippets.

## Developer Setup
Prerequisites: conda, jupyterlab, python

For context, conda is a self-contained space that will be used to create an isolated environment with the needed dependencies and installations for ASPEN. When running ASPEN, it will be done within a Conda environment.


- Run this command to create a named conda environment
```bash
conda create -n aspen --override-channels --strict-channel-priority -c conda-forge -c nodefaults jupyterlab=4 nodejs=20 git copier=9 jinja2-time
```

activate the environment
```bash
conda activate aspen
```

The repo has enough code in it to see it working in your JupyterLab. Run the following command to install the initial project dependencies and install the extension into the JupyterLab environment.
```bash
pip install -ve .
```

The above command installs the Python package in editable mode and triggers the JavaScript build process. It also registers the extension with JupyterLab, making both the frontend and backend code available. We can run this pip install command again every time we make a change to copy the change into JupyterLab. Even better, we can use the develop command to create a symbolic link from JupyterLab to our source directory. This means our changes are automatically available in JupyterLab:

```bash
jupyter labextension develop --overwrite .
```

After the install completes, open a second terminal. Run these commands to activate the jupyterlab-ext environment and start JupyterLab in your default web browser.

```bash
conda activate jupyterlab-ext
jupyter lab
```

Afterwords, navigate to the dev console and look for a message along the lines of "JupyterLab extension jupyterlab_apod is activated!" You should be setup now.

Instead of having to run `jlpm run build` and `jlpm run watch`, we have a make file setup.

Running `make build` will automatically run these commands for you.

Running `make delete` will delete the javascript dependencies - specifically the folders + files `.yarn`, `node_modules`, `tsconfig.tsbuildinfo`. In order to reinstall the needed dependencies again run:

```bash
jlpm install
jlpm build
```

Note(6/19/25): If you delete the dependencies via `make delete`, running the command `pip install -ve .` will give an `OS-error` for some reason(even after reinstalling the dependencies again). This should be be a non-issue however as the extension still builds.




## Github Commands

```bash
git pull origin // pulls latest changes from remote
git branch -r // lists all branches
git switch BRANCH_NAME // switch branches
git merge origin/BRANCH_NAME // merge specified branch into your own branch
```

## EVEYTHING BELOW THIS WAS PRE MADE WITH THE REPO SETUP

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install jupyterlab_apod
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_apod
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_apod directory
# Install package in development mode
pip install -e "."
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall jupyterlab_apod
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab_apod` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
