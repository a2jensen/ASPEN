/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
/**
 * This file acts as the main entry point, where you import and export all your plugins or extensions.
 */

import {
  ILayoutRestorer, // restore widgets layout and state on refresh
  JupyterFrontEnd, 
  JupyterFrontEndPlugin,
} from '@jupyterlab/application'

// https://jupyterlab.readthedocs.io/en/stable/api/interfaces/notebook.INotebookTracker.html
import { LibraryWidget } from './LibraryWidget';
//import { INotebookTracker } from "@jupyterlab/notebook";
import { combinedExtension } from './cellBackground';
import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';



function activate( app: JupyterFrontEnd , restorer: ILayoutRestorer, extensions: IEditorExtensionRegistry) {
  console.log("ASPEN is activated with styling edits. loadFunction implemented....");
  console.log("styling added");
  const { commands } = app;


  const libraryWidget = new LibraryWidget();
  libraryWidget.id = "jupyterlab-librarywidget-sidebarleft";
  libraryWidget.title.iconClass = 'jp-SideBar-tabIcon'; 
  libraryWidget.title.caption = "Library display of templates";

  // creating command for creating snippet/template
  commands.addCommand('templates:create', {
    label: 'Save Code Snippet',
    execute: () => {
      //** ORIGINAL IMPLEMENTATION */
      const snippet : string = window.getSelection()?.toString() || '';
      if (snippet){
        libraryWidget.createTemplate(snippet);
      }
      
      //** EDITED IMPLEMENTATION currently logs HTML */
      console.log("Grabbing the snippet with this new method..")
      const curr = document.getElementsByClassName('jp-Cell jp-mod-selected');

      console.log("Curr variable", curr);
      if ( curr ) {
        const text = curr[0];
        console.log("Values at curr[0]", text);
      }

      // EDITED IMPLEMENTATION
      /** 
      const highlightedCode = getSelectedText();
      if ( highlightedCode === "" ){
        // case where user right clicks the cell to save
        const curr = document.querySelector('jp-Cell jp-mod-selected');
        if (curr){
          const cellContent = curr.querySelector('.CodeMirror')?.innerHTML;
          console.log(cellContent);
        }
      }
      */
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
  app.shell.add(libraryWidget, 'right', { rank : 300});

  // Restore state if the application restarts
  restorer.add(libraryWidget, 'custom-sidebar-widget');

  //new
  document.addEventListener("copy", (event: ClipboardEvent) => {
    const selectedText = window.getSelection()?.toString();
    if (!selectedText) {return;}
    //turned into comments
    const copiedText = "#template start\n" + selectedText + "\n#template end";
    event.clipboardData?.setData("text/plain", copiedText);
    event.preventDefault();
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

/**
* Inialize code snippet extension
*/
const aspen: JupyterFrontEndPlugin<void> = {
  id : 'input-widget', // subject to change
  autoStart: true,
  optional: [ILayoutRestorer, IEditorExtensionRegistry],
  activate: activate
};

//probably call this function for color cell
function enableJupyterDropSupport() {
  document.addEventListener("drop", (event) => {
    event.preventDefault();
    
    const data = event.dataTransfer?.getData("text/plain");
    if (data) {
      const Jupyter = (window as any).Jupyter;
      if (Jupyter && Jupyter.notebook) {
        const cell = Jupyter.notebook.get_selected_cell();
        if (cell) {
          cell.set_text(data);
          Jupyter.notebook.execute_cells([Jupyter.notebook.get_selected_index()]);
        }
      }
    }
  });

  document.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
}

// Run this script when the extension loads
if ((window as any).Jupyter) {
  enableJupyterDropSupport();
}

/**
 * Saves template to a JSON file
 */
/**
function saveJSON(){

} */

/**
 * 
 * @returns code snippet
 * 
 */
/** 
function getSelectedText()  {
  console.log("Within the selected text function");
  let selectedText;
  // user highlighted
  if (window.getSelection()){
    selectedText = window.getSelection();
    console.log("Selected text in the first case", selectedText);
  }
  // user right clicked
  else if (document.getSelection){
    selectedText = document.getSelection();
  }
  return selectedText?.toString()
}*/

export default aspen;