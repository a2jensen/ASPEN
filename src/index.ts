/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
//index add cellbackground

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



//THIS CAN ALL BE MOVED TO SEPERATE FILE LATER!


import { levenshtein } from './stringMatch';
//import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

function activate( app: JupyterFrontEnd , restorer: ILayoutRestorer, extensions: IEditorExtensionRegistry) {
  console.log("ASPEN is activated with styling edits. loadFunction implemented....");
  console.log("styling added");
  const { commands } = app;


  const libraryWidget = new LibraryWidget();
  const templates = libraryWidget.returnTemplateArray();
  libraryWidget.id = "jupyterlab-librarywidget-sidebarleft";
  libraryWidget.title.iconClass = 'jp-SideBar-tabIcon'; 
  libraryWidget.title.caption = "Library display of templates";

  /**
   * Tracks when a snippet is PASTED IN, if so we will make it an instance of its template
   */
  document.addEventListener("paste", (event) => {
    console.log("A snippet was just used");
    const pastedText = event.clipboardData?.getData("text/plain");
    console.log("Pasted text/snippet", pastedText);

    if (!pastedText) return;
    let bestMatch = null;
    let bestScore = 0; // higher score = more similar
    for (const template of templates) {
      const distance = levenshtein(template.content , pastedText); // calculate levenshtein distance
      const maxLen  = Math.max(pastedText.length, template.content.length);  // normalize the score
      const similarityScore = 1 - distance / maxLen;
      if (similarityScore > bestScore ) { 
        bestScore = similarityScore
        bestMatch = template;
      }
    }
    if ( bestScore > 0.80) {
      console.log(`Pasted snippet is similar to template ${bestMatch}, the score was ${bestScore}`);
      bestMatch?.connections.push(pastedText);
    }  
  })

  /**
   * Tracks when a snippet is DROPPED IN, so we will make it an instance of its template
   */
  document.addEventListener("drop", (event) => {
    event.preventDefault() // prevent default behavior (e.g. opening file in browser)
    console.log("Possible template/snippet dragged in");

    const droppedText = event.dataTransfer?.getData("text/plain");
    if (!droppedText) return;
    let bestMatch = null;
    let bestScore = 0; // higher score = more similar
    for (const template of templates) {
      const distance = levenshtein(template.content , droppedText); // calculate levenshtein distance
      const maxLen  = Math.max(droppedText.length, template.content.length);  // normalize the score
      const similarityScore = 1 - distance / maxLen;
      if (similarityScore > bestScore ) { 
        bestScore = similarityScore
        bestMatch = template;
      }
    }
    if ( bestScore > 0.80) {
      console.log(`Dropped snippet is similar to template ${bestMatch}, the score was ${bestScore}`);
      bestMatch?.connections.push(droppedText);
    }  
  })

  // creating command for creating snippet/template
  commands.addCommand('templates:create', {
    label: 'Save Code Snippet',
    execute: () => {
      //** ORIGINAL IMPLEMENTATION */
      const snippet : string = window.getSelection()?.toString() || '';
      if (snippet){
        libraryWidget.createTemplate(snippet);
      }
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


  document.addEventListener("copy", (event: ClipboardEvent) => {
    const selectedText = window.getSelection()?.toString();
    if (!selectedText) {return;}
   
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

/**
 * HELPER FUNCTIONS
 */


// Function to get metadata from the currently active notebook
// reference https://stackoverflow.com/questions/71736749/accessing-notebook-cell-metadata-and-html-class-attributes-in-jupyterlab-extensi
// NOTE: links to relevant documentation are dead 
/** 
function getNotebookMetadata(app: JupyterFrontEnd) {
  const notebookPanel = app.shell.currentWidget as NotebookPanel;

  if (notebookPanel && notebookPanel.model) {
      const model: INotebookModel = notebookPanel.model;
      // NOTE, getMetaData returns a copy of the metadata
      console.log('Notebook Metadata:', model.getMetadata);
  } else {
      console.warn('No active notebook found');
  }
}
*/

export default aspen;