/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
/**
 * This file acts as the main entry point of the extension, where you import and export all your plugins or extensions.
 * It registers the UI components, commands and CodeMirror extension.
 */
import {
  ILayoutRestorer, // Restore widgets layout and state on refresh
  JupyterFrontEnd, // Main JupyterLab application interface
  JupyterFrontEndPlugin, // Interface for JupyterLab plugins
} from '@jupyterlab/application'
import { TemplatesManager } from './TemplatesManager';
import { ContentsManager } from "@jupyterlab/services";
import { LibraryWidget } from './LibraryWidget';
import { SnippetsManager } from './snippetManager';
import { Synchronization } from './Synchronization'
import { CodeMirrorExtension } from './CodeMirrorPlugin';
import { IEditorExtensionRegistry } from '@jupyterlab/codemirror'; // Interface for registering CodeMirror Extensions


/**
 * Activation function for our extension. Function is called
 * when the extension is activated by Jupyter Lab.
 * 
 * @param app app - The JupyterFrontEnd application instance
 * @param restorer restorer - The layout restorer service for preserving widget state
 * @param extensions extensions - The registry for CodeMirror editor extensions
 */
function activate( app: JupyterFrontEnd , restorer: ILayoutRestorer, extensions: IEditorExtensionRegistry) {
  console.log("perhaps perhaps");
  const { commands } = app;

  const contentsManager = new ContentsManager();
  const templatesManager = new TemplatesManager(contentsManager);
  const snippetsManager = new SnippetsManager(contentsManager, templatesManager);
  const libraryWidget = new LibraryWidget(templatesManager, snippetsManager);
  const synchronization = new Synchronization(templatesManager, snippetsManager, libraryWidget);
  libraryWidget.id = "jupyterlab-librarywidget-sidebarRight";
  libraryWidget.title.iconClass = 'jp-SideBar-tabIcon'; 
  libraryWidget.title.caption = "Library display of templates";

  /**
   * Event Listener for when a template is copied from the library.
   * Before getting saved to the clipboard, we want to attach a marker as well as its ID onto it in JSON format.
   * @param event - The ClipboardEvent object containing information about the copy action
   * @property {DataTransfer} event.clipboardData - The DataTransfer object that provides access to data on the clipboard
   *   Methods include:
   *     - setData(format, data): Sets data of the specified format onto the clipboard
   *     - getData(format): Retrieves data of the specified format from the clipboard
   *     - clearData([format]): Removes data of the specified format or all formats
   */

/**
  document.addEventListener("click", async (event) => {
    const target  = event.target as HTMLElement;
    if (target.classList.contains("template-copy")) {
      console.log("Copy button clicked, checking clipboard data");

      try {
        const clipboardText = await navigator.clipboard.readText();
        console.log("Clipboard content:", clipboardText);
  
        const clipboardData = JSON.parse(clipboardText);
  
        if(clipboardData.marker === "aspen-template") {
          console.log("Template was copied:", clipboardData.id);
        }
        else{
          console.warn("Clipboard does not contain a valid template.");
        }
      }
      catch(err){
        console.error("Error reading clipboard:", err);
      }
    }
  });
*/

  /**
 * Event Listener for when a template is dragged from the library.
 * 
 * Before getting saved to dataTransfer, we want to attach a marker as well as its ID onto it in JSON format.
 * 
 */
  document.addEventListener("dragstart", (event) => {
    const dragInfo = event.target as HTMLElement;
    console.log("What is getting dragged, ", dragInfo);

    if (dragInfo.classList.contains("template-snippet")) {
      console.log("Whats getting dragged is a template")

      const templateData = {
        marker: "aspen-template",
        templateID : dragInfo.getAttribute("data-template-id"),
        content : dragInfo.innerText
      }
      console.log("Data that will be set onto the dataTransfer", templateData);
      event.dataTransfer?.setData("application/json", JSON.stringify(templateData));
    }
  })

  /**
   * Adding command that allows their highlighted code to be saved as a template.
   */
  commands.addCommand('templates:create', {
    label: 'Save Code Snippet',
    execute: async () => {
      const snippet : string = window.getSelection()?.toString() || '';
      if (snippet) {
        console.log("Saving the snippet");
        const template = await libraryWidget.createTemplate(snippet);
        
        if (template) {
          document.dispatchEvent(new CustomEvent('Save Code Snippet', {
            detail: {
              snippetText: snippet,
              templateID: template.id
            }
          }));
          console.log("Event Listener Dispatched!!!");
        }
        else {
          console.error("Template creation failed.")
        }
      }
    },
  }); 

  commands.addCommand('templates:push', {
    label: "Push Changes To Template",
    execute: () => {
      console.log("Starting logic for Push Changes To Template!")
      const content = window.getSelection();
      if (content?.rangeCount === 0 || !content) {
        return;
      }

      /**
       * Query the highlighted DOM and check if the instance is within it
       */
      const range = content.getRangeAt(0);
      console.log("range ", range);
      // https://developer.mozilla.org/en-US/docs/Web/API/Range/cloneContents
      const fragment = range.cloneContents(); // DOM fragment of the selection, making a deep copy of DOM so we don't directly edit the base DOM
      console.log("range cloned contented : ", fragment)

      // Create a temporary wrapper to check for class names, acts as a temporary "mini-DOM" where we can make edits
      const tempDiv = document.createElement('div');
      console.log("tempDiv init ", tempDiv)
      tempDiv.appendChild(fragment);
      console.log("tempDiv after appending : ", fragment)

      const startCheck = tempDiv.querySelector('.snippet-start-line');
      const endCheck = tempDiv.querySelector('.snippet-end-line');
      console.log(`Start and end check ${startCheck} AND ${endCheck}`)
      
      
      if (startCheck && endCheck ) {
        /**
         * Grab the needed data and pass it into the synch function
         */
        const templateId = startCheck?.getAttribute("data-associated-template")
        console.log("templateId var: ", templateId);

        // Get all lines inside the tempDiv / highlighted snippet
        const codeLines = Array.from(tempDiv.querySelectorAll('.cm-line'))
        .map(lineEl => (lineEl as HTMLElement).innerText.trimEnd());
        const innerText = codeLines.join('\n'); // Explicitly join lines with \n

        console.log("templateId var: ", templateId);
        console.log("Reconstructed inner text with newlines:\n", innerText);

        if (templateId) {
          // temporary fix, do something like LibraryWidget.synch. similar to create above
          synchronization.synch(templateId, innerText, true);
        }
      }
      
      return;
    }
  })

  /** Adding the templates:create command to their respective context menus */
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

  app.contextMenu.addItem({
    command: 'templates:push',
    selector: '.jp-FileEditor',
    rank : 1
  });
  app.contextMenu.addItem({
    command: 'templates:push',
    selector: '.jp-Notebook',
    rank: 1
  });



  /** Registers Library Widget to the right sidebar. */
  app.shell.add(libraryWidget, 'right', { rank : 300});

  /** Registers the library widget with the layout restorer to
   * preserve its state across page reloads and sessions. */
  restorer.add(libraryWidget, 'custom-sidebar-widget');

  /** Registers the CodeMirror Extension for snippet instance visualization and management. */
  extensions.addExtension({
    name: '@aspen/codemirror_plugin',
    factory: () => ({
      extension: CodeMirrorExtension(snippetsManager),
      instance: () => CodeMirrorExtension(snippetsManager),
      reconfigure: () => null
    })
  });

}

/**
 * JupyterLab Plugin Definition
 * 
 * Defines the entry point for the JupyterLab extension.
 * This object tells JupyterLab how to find and initialize the extension.
 */
const aspen: JupyterFrontEndPlugin<void> = {
  id : 'aspen-extension', 
  autoStart: true,
  requires : [ ILayoutRestorer, IEditorExtensionRegistry],
  activate: activate
};

export default aspen;
