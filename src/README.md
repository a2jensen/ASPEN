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



//import Connections from "./ConnectionsClass";
//import { TemplateManager } from "./TemplateManagerClass";
import * as React from 'react';
import { Widget } from "@lumino/widgets";
import { ReactWidget } from '@jupyterlab/ui-components';
import TemplatesManager from './TemplatesManager';
/**
interface TemplateProps {
    id : string,
    name: string,
    content: string, // change from content to codeSnippet?
    dateCreated : Date,
    dateUpdated: Date,
    tags: string[],
    color : string,
    //connections : Connections[] // array of all the connected snippet
}
  */

function TemplateComponent ( codeSnippet : string ) {
    return (
       <div className=''>
            <h3>Template Title</h3>
            <div>{codeSnippet}</div>
            <div>Language</div>
       </div>
    )
};