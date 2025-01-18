import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin
  } from '@jupyterlab/application';
  
  import { ILayoutRestorer } from '@jupyterlab/application';
  import { Widget } from '@lumino/widgets';
  
  /**
   * Initialization data for the custom sidebar extension.
   */
 const extension: JupyterFrontEndPlugin<void> = {
    id: 'custom-sidebar',
    autoStart: true,
    requires: [ILayoutRestorer],
    activate: (app: JupyterFrontEnd, restorer: ILayoutRestorer) => {
      console.log('Custom Sidebar Extension activated!!!');
  
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
    }
  };
  
  export default extension;
  