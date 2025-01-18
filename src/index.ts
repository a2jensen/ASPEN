/**
 * jupyterlab/application
 * provides core components necessary to build and integrate extensions into jupyter lab. imports from package help manage the application lifecycle, plugins, and layout
 * 
 * JupyterFrontEnd : base class for jupyters front end application
 * provides APIs to interact with core application(adding widgets, commands, menus). you have access to app.shell for managing layout and adding widgets to specific areas(main, left, right). provides commands interface to register + execute commands
 * 
 * JupyterFrontEndPlugin: structure used to define a jupyterlab extension. specifies how the extension integrates with jupyterlab(required services, activation logic)
 * structure : id, autoStart : boolean, requires : specify dependencies needed, activate : main function to initialize plugin
 * 
 */

import {
    ILayoutRestorer, // restore widgets layout and state on refresh
    JupyterFrontEnd, 
    JupyterFrontEndPlugin,
} from '@jupyterlab/application'

/**
 * This package contains utilities for creating user-friendly and interactive JupyterLab extensions. It simplifies common tasks like creating commands, widgets, and UI elements.
 * 
 * ICommandPalette: Represents JupyterLab’s command palette, a searchable  interface for executing commands.
 * Allows developers to add custom commands to the palette.
 *Example: You can add an entry to the command palette, such as:
 palette.addItem({ command: 'example:do-something', category: 'My Extensions' });
 * MainAreaWidget : a wrapper widget specefially designed for main area
 of jupyterLab. provides consistent layout/behavior for widgets displayed in the main workspace. automatically manages widget titles, closable states, and restoration.
 * WidgetTracker : tracks state and existence of widgets created by extension. essential for integrating with ILayoutRestorer and ensuring widgets persist across sessions.
*/

// https://jupyterlab.readthedocs.io/en/3.0.x/api/modules/apputils.html
import {
    ICommandPalette,
    WidgetTracker, Dialog,
    showDialog, showErrorMessage
} from '@jupyterlab/apputils'

/**Lumino is the underlying framework that powers JupyterLab's layout and widget system. It provides a flexible and responsive API for creating and managing UI components.
Widget
The base class for all UI components in Lumino.
Provides methods and properties for managing DOM elements, layouts, and interactivity.
Key Features:
Directly manipulates the DOM (node property).
Emits signals to handle events.
Allows nesting widgets to create complex layouts. */


// contents manager from jupyterlabs services, allows API writes to JSON file
// https://jupyterlab.readthedocs.io/en/3.4.x/api/classes/services.contentsmanager-1.html
import { Contents } from '@jupyterlab/services'

import DialogBodyWidget from "./Dialog";
import Sidebar from "./Sidebar";

// function called when command button is clicked
async function openInputDialog(contentsManager: Contents.IManager): Promise<void> {
    // Create dialog body (form)
    const DialogWidget = new DialogBodyWidget();
  
    // Show dialog
    const result = await showDialog({
      title: 'Enter Code',
      body : DialogWidget,
      buttons: [
        Dialog.cancelButton(),
        Dialog.okButton({ label: 'Save' })
      ] 
    });    
  
    // Handle dialog submission
    if (result.button.accept) {
      const inputValue = DialogWidget.getValue();
      if (!inputValue) {
        DialogWidget.showError(); // if input is empty throw error
        return;
      }

      const filePath = 'user_snippets/snippets.json';
      const jsonData = {
        timestamp : new Date().toISOString(),
        value : inputValue
      };

      const fileContent = JSON.stringify(jsonData, null, 2);
      // add in funcionality of updating json file as well
      try {
        await contentsManager.save(filePath, {
            type: 'file',
            format : 'text',
            content : fileContent
        });
      } catch ( error : unknown ){
        console.error("Failed saving data to path")
        showErrorMessage("Error reached", "Failed to save snippet", [
          Dialog.cancelButton(),
          Dialog.okButton({label : 'retry'})
        ])
        
      }
    }
  }

/** 
 * Activate ASPEN extension
 */
function activate(app : JupyterFrontEnd, palette: ICommandPalette, restorer: ILayoutRestorer | null) {
    console.log('ASPEN is activated!!!!!!')
    console.log('activated component')

    const contentsManager = app.serviceManager.contents;

    //let widget : InputWidget; // declare input widget

    // command to open widget, adding command to palette
    const command = 'input:open';
    app.commands.addCommand(command, {
        label : 'Open ASPEN widget',
        execute: () => openInputDialog(contentsManager)
    })

    palette.addItem({command, category : 'Tutorial'});

    // track and restore widget state
    const tracker = new WidgetTracker<DialogBodyWidget> ( {
        namespace: 'input-widget'
    });
    if (restorer) {
        restorer.restore(tracker, {
            command,
            name : () => 'input-widget'
        });
    }

}

const plugin: JupyterFrontEndPlugin<void> = {
    id : 'input-widget', // subject to change
    autoStart: true,
    requires: [ICommandPalette],
    optional: [ILayoutRestorer],
    activate: activate
}

export default [plugin, Sidebar];
