/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';


import { LibraryWidget } from './LibraryWidget';
import { combinedExtension } from './cellBackground';


function activate(app: JupyterFrontEnd, restorer: ILayoutRestorer, extensions: IEditorExtensionRegistry) {
  console.log("ASPEN is activated :D !");
  const { commands } = app;

  

  const libraryWidgetRight = new LibraryWidget();
  libraryWidgetRight.id = "jupyterlab-librarywidget-sidebarright";
  libraryWidgetRight.title.iconClass = 'jp-SideBar-tabIcon';
  libraryWidgetRight.title.caption = "Library display of templates";

  commands.addCommand('templates:create', {
    label: 'Create Template / Save Code Snippet?',
    execute: () => {
      const snippet: string = window.getSelection()?.toString() || '';
      if (snippet) {
        console.log("Snippet being saved:", snippet);
        libraryWidgetRight.createTemplate(snippet);
      }
    }
  });

  app.contextMenu.addItem({
    command: 'templates:create',
    selector: '.jp-FileEditor',
    rank: 1
  });
  app.contextMenu.addItem({
    command: 'templates:create',
    selector: '.jp-Notebook',
    rank: 1
  });

 
  app.shell.add(libraryWidgetRight, 'right', { rank: 300 });

  document.addEventListener('keydown', (event) => {
    console.log(`You pressed: ${event.key}`);
  });


  extensions.addExtension({
    name: '@aspen/codemirror:cell-background',
    factory: () => ({
      extension: combinedExtension(),
      instance: () => combinedExtension(),
      reconfigure: () => null
    })
  });
  
}

const aspen: JupyterFrontEndPlugin<void> = {
  id: 'aspen-extension',
  autoStart: true,
  optional: [ILayoutRestorer, IEditorExtensionRegistry],
  activate: activate
};

export default aspen;
