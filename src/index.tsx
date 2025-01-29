// This file acts as the main entry point, where you import and export all your plugins or extensions.

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
import { Widget } from '@lumino/widgets';

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
//import React from "react";
//import TemplateClass from "./TemplateClass";

function activate( app: JupyterFrontEnd , restorer: ILayoutRestorer ) {
  console.log("activate function started! updated to fileEditor!")
  const { commands } = app;

  // initialize code snippet in here
  commands.addCommand('snippets:save', {
    label: 'Save Code Snippet', // possibly "create template", "save template", "save code snippet to template"?
    execute: () => {
      const selectedText = window.getSelection()?.toString() || '';
      if (selectedText){
        console.log("success");
      }
    },
  }); 

  // adding command to files
  app.contextMenu.addItem({
    command: 'snippets:save',
    selector: '.jp-FileEditor',
    rank : 1
  });

  // adding command to notebook
  app.contextMenu.addItem({
    command: 'snippets:save',
    selector: '.jp-Notebook',
    rank: 1
  })

   // Create the widget
   const widget = new Widget();
   widget.id = 'custom-sidebar-widget';
   widget.title.iconClass = 'jp-SideBar-tabIcon'; // Add a custom icon here
   widget.title.caption = 'My Sidebar Widget';
   widget.node.innerHTML = `
     <div>
       <h3>Code Templates</h3>
       <p>This is the content inside the sidebar widget.</p>
     </div>
   `;

   // Add the widget to the left sidebar
   app.shell.add(widget, 'left', { rank: 500 });

   // Restore state if the application restarts
   restorer.add(widget, 'custom-sidebar-widget');
};

/**
 * Inialize data for the code snippet extension
 */
const plugin: JupyterFrontEndPlugin<void> = {
    id : 'input-widget', // subject to change
    autoStart: true,
    optional: [ILayoutRestorer],
    activate: activate
}


export default plugin ;
