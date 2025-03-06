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
  console.log("refactors made");
  const { commands } = app;

  const contentsManager = new ContentsManager();
  const templatesManager = new TemplatesManager(contentsManager);
  const snippetsManager = new SnippetsManager(contentsManager, templatesManager);
  const libraryWidget = new LibraryWidget(templatesManager);
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
  document.addEventListener("copy", (event) => {
    const dragInfo = event.target as HTMLElement;
    console.log("What is getting copied, ", dragInfo);

    if (dragInfo.classList.contains("template-snippet")) {
      console.log("Whats getting dragged is a template")

      const templateData = {
        marker: "aspen-template",
        templateID : dragInfo.getAttribute("data-template-id"),
        content : dragInfo.innerText
      }

      console.log("Data that will be set onto the clipboard: ", templateData);
      event.clipboardData?.setData("application/json", JSON.stringify(templateData));
    }
  })

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
    execute: () => {
      const snippet : string = window.getSelection()?.toString() || '';
      if (snippet){
        console.log("Saving the snippet");
        libraryWidget.createTemplate(snippet);
      }
    },
  }); 

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