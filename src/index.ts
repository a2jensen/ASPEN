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
//import { SnippetsManager } from './SnippetManager';
//import { TemplatesManager} from './TemplatesManager';
import { combinedExtension } from './SnippetManager';
import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';

function activate( app: JupyterFrontEnd , restorer: ILayoutRestorer, extensions: IEditorExtensionRegistry) {
  console.log("EDITS MADE!");
  const { commands } = app;

  //onst templatesManager = new TemplatesManager();
  const libraryWidget = new LibraryWidget();
  //const templates = templatesManager.templates;
  libraryWidget.id = "jupyterlab-librarywidget-sidebarRight";
  libraryWidget.title.iconClass = 'jp-SideBar-tabIcon'; 
  libraryWidget.title.caption = "Library display of templates";

  /**
   * Tracks when a snippet is COPIED from the template, we will need to mark it with the template ID
   */
  document.addEventListener("copy", (event) => {
    console.log("Copy detected, checking to see if its apart of the templates");
    // check

    // if it apart of the templates, mark it with the template ID on the copyboard system
  })



  /**
   * Tracks when a snippet is PASTED IN, if so we will make it an instance of its template
   */
  
  document.addEventListener("paste", (event) => {
    console.log("Paste happened");
    // check the copyboard system if there is an ID attached with it
    // if so, we need to call method from snippet instance class to create an instance of the template
    // attach the id 
  }) 

  /**
   * NOTE: THIS COULD BE MOVED INTO TEMPLATE MANAGER CLASS
   * Tracks when a snippet is DRAGGED from the library
   * Gets marked with the template id before getting saved to the clipboard
   */
  document.addEventListener("dragstart", (event) => {
    const dragInfo = event.target as HTMLElement;
    console.log("What is getting dragged, ", dragInfo);

    if (dragInfo.classList.contains("template-snippet")) {
      console.log("Whats getting dragged is a template")
      const templateID = dragInfo.getAttribute("data-template-id");
      const templateData = {
        marker: "aspen-template",
        templateID,
        content : dragInfo.innerText
      }
      console.log("Data before setting to DataTransfer:", templateData);
      event.dataTransfer?.setData("application/json", JSON.stringify(templateData));
    }
  })

  /**
   * NOTE: THIS COULD BE MOVED INTO SNIPPET MANAGER CLASS
   * Tracks when a snippet is DROPPED IN,
   * detects if template marker is apart of what is getting dragged in
   */ 
  /** 
  document.addEventListener("drop", (event) => {
    console.log("Possible template/snippet dragged in");

    const jsonData = event.dataTransfer?.getData("application/json");

    if (jsonData){
      try {
        const parsedData = JSON.parse(jsonData);
        console.log("parsedData", parsedData);

        if(parsedData.marker === "aspen-template"){
          console.log("Whats getting dropped in is a template!")

          // TODO: create a snippet instance
          
        }

      } catch (error : unknown ) {
        console.error("Failed to parse the dropped data as JSON", error)
      }
    }
  })  */

  // creating command for creating snippet/template
  commands.addCommand('templates:create', {
    label: 'Save Code Snippet',
    execute: () => {
      const snippet : string = window.getSelection()?.toString() || '';
      if (snippet){
        console.log("SAVING THE SNIPPET");
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