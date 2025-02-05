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
import { INotebookTracker } from "@jupyterlab/notebook";


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
}

function activate( app: JupyterFrontEnd , restorer: ILayoutRestorer, notebookTracker : INotebookTracker ) {
  console.log("ASPEN is activated with styling edits");
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
        //console.log("Snippet being saved : ", snippet);
        libraryWidget.createTemplate(snippet);
      }
      // EDITED IMPLEMENTATION
      const highlightedCode = getSelectedText();
      if ( highlightedCode === "" ){
        // case where user right clicks the cell to save
        const curr = document.getElementsByClassName('jp-Cell jp-mod-selected');
        let code = '';
        for (let i = 0; i < curr.length; i++){
          // loop through each cell
          const text =  curr[i] as HTMLElement;
          const cellInputWrappers = text.getElementsByClassName(
            'jp-Cell-inputWrapper'
          )

          for (const cellInputWrapper of cellInputWrappers){
            const codeLines = cellInputWrapper.querySelectorAll('.CodeMirror-line');
            for (const codeLine of codeLines ){
              let codeLineText = codeLine.textContent;
              if (codeLineText?.charCodeAt(0) === 8203){
                // checks if first char in line is invalid
                codeLineText = ''; // replace invalid line with empty string
              }
              code += codeLineText + `\n`;
            }
          }
          console.log("Code", code);
        }
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