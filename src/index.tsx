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
  document.addEventListener("keydown", (event) => {
    console.log(`You pressed: ${event.key}`);
  });

  // Interfere with copy
  /*document.addEventListener("copy", (event: ClipboardEvent) => {
    const selectedText = window.getSelection()?.toString();
    if (!selectedText) return;

    let copiedText = "hello " + selectedText;
    event.clipboardData?.setData("text/plain", copiedText);
    event.preventDefault();
  });*/

  // Interfere with paste
  document.addEventListener("paste", (event: ClipboardEvent) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const clipboardText = clipboardData.getData("text/plain");
    if (!clipboardText) return;
    
    let pastingText = "goodbye " + clipboardText;
    clipboardData?.setData("text/plain", pastingText);
    event.preventDefault();
    alert("Paste");
  });

  // Listen for template copy (ctrl (or command) + shift + ???))
  let isTemplateCopy = true; // currently there is no keyboard shortcut, copy is always overwritten

  /*document.addEventListener("keydown", (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === ???) {
        isCtrlShiftUPressed = true;
      }
  });
  
  document.addEventListener("keyup", (event: KeyboardEvent) => {
      if (event.key === "Control" || event.key === "Shift" || event.key === "Meta" || event.key === ???) {
        isCtrlShiftUPressed = false;
      }
  });*/

  document.addEventListener("copy", (event: ClipboardEvent) => {
    const selectedText = window.getSelection()?.toString();
    if (!selectedText) return;

    let copiedText: string;

    if (isTemplateCopy) {
      copiedText = "bonjour" + selectedText;
      alert("Copied as a template");
    }
    else { // regular copy
      copiedText = selectedText;
      alert("Copied normally");
    }

    event.clipboardData?.setData("text/plain", copiedText);
    event.preventDefault();
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
