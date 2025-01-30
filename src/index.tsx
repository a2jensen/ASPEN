/**
 * This file acts as the main entry point, where you import and export all your plugins or extensions.
 */

import {
  ILayoutRestorer, // restore widgets layout and state on refresh
  JupyterFrontEnd, 
  JupyterFrontEndPlugin,
} from '@jupyterlab/application'

//import { INotebookTracker } from "@jupyterlab/notebook";

import {LibraryWidget} from './LibraryWidget';

function activate( app: JupyterFrontEnd , restorer: ILayoutRestorer ) {
  console.log("ASPEN is activated :D ! Check123");
  const { commands } = app;

  // adding library Widget to the left side sidebar
  const libraryWidgetLeft = new LibraryWidget();
  libraryWidgetLeft.id = "jupyterlab-librarywidget-sidebarleft";
  libraryWidgetLeft.title.iconClass = 'jp-SideBar-tabIcon'; 
  libraryWidgetLeft.title.caption = "Library display of templates";

  const libraryWidgetRight = new LibraryWidget();
  libraryWidgetRight.id = "jupyterlab-librarywidget-sidebarleft";
  libraryWidgetRight.title.iconClass = 'jp-SideBar-tabIcon'; 
  libraryWidgetRight.title.caption = "Library display of templates";


  // creating command for creating snippet/template
  commands.addCommand('templates:create', {
    label: 'Create Template / Save Code Snippet?',
    execute: () => {
      // case 1: editor is not a notebook
      const snippet : string = window.getSelection()?.toString() || '';
      if (snippet){
        console.log("Snippet being saved : ", snippet);
        libraryWidgetLeft.createTemplate(snippet);
        libraryWidgetRight.createTemplate(snippet);
      }

      // case 2: editor is a notebook

    },
  }); 

  // adding "create template/save snippet" commands to their respective context menus
  app.contextMenu.addItem({
    command: 'templates:create',
    selector: '.jp-FileEditor',
    rank : 1
  });

  app.contextMenu.addItem({
    command: 'templates:create',
    selector: '.jp-Notebook',
    rank: 1
  });

  // Adding the library widget to both left and right sidebars
  app.shell.add(libraryWidgetLeft, 'left',{ rank: 600} );
  app.shell.add(libraryWidgetRight, 'right', { rank : 300});

  // note: in order to add sidebar widget to right sidebar, we have to create another instance of it.
  //app.shell.add(SidebarWidget, 'right', { rank: 300});

  // Restore state if the application restarts
  restorer.add(libraryWidgetLeft, 'custom-sidebar-widget');

  // Continuously logs in the console characters user presses
  document.addEventListener('keydown', (event) => {
    console.log(`You pressed: ${event.key}`);
  });
};

/**
* Inialize code snippet extension
*/
const aspen: JupyterFrontEndPlugin<void> = {
  id : 'input-widget', // subject to change
  autoStart: true,
  optional: [ILayoutRestorer],
  activate: activate
}

export default aspen;
