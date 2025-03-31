/**
 * WORK WITH YARN and not npm install commands
 *THIS IS JUST CODE FROM THE TUTORIAL REPO
 */

import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';

import { Widget } from '@lumino/widgets';

interface APODResponse {
  copyright: string;
  date: string;
  explanation: string;
  media_type: 'video' | 'image';
  title: string;
  url: string;
};

class APODWidget extends Widget {
  /**
  * Construct a new APOD widget.
  */
  constructor() {
    super();

    this.addClass('my-apodWidget'); 

    // Add an image element to the panel
    this.img = document.createElement('img');
    this.node.appendChild(this.img);

    // Add a summary element to the panel
    this.summary = document.createElement('p');
    this.node.appendChild(this.summary);
  }

  /**
  * The image element associated with the widget.
  */
  readonly img: HTMLImageElement;

  /**
  * The summary text element associated with the widget.
  */
  readonly summary: HTMLParagraphElement;

  /**
  * Handle update requests for the widget.
  */
  async updateAPODImage(): Promise<void> {

    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${this.randomDate()}`);

    if (!response.ok) {
      const data = await response.json();
      if (data.error) {
        this.summary.innerText = data.error.message;
      } else {
        this.summary.innerText = response.statusText;
      }
      return;
    }

    const data = await response.json() as APODResponse;

    if (data.media_type === 'image') {
      // Populate the image
      this.img.src = data.url;
      this.img.title = data.title;
      this.summary.innerText = data.title;
      if (data.copyright) {
        this.summary.innerText += ` (Copyright ${data.copyright})`;
      }
    } else {
      this.summary.innerText = 'Random APOD fetched was not an image.';
    }
  }

  /**
  * Get a random date string in YYYY-MM-DD format.
  */
  randomDate(): string {
    const start = new Date(2010, 1, 1);
    const end = new Date();
    const randomDate = new Date(start.getTime() + Math.random()*(end.getTime() - start.getTime()));
    return randomDate.toISOString().slice(0, 10);
  }
}

/**
* Activate the APOD widget extension.
*/
function activate(app: JupyterFrontEnd, palette: ICommandPalette, restorer: ILayoutRestorer | null) {
  console.log('JupyterLab extension ASPEN is activated');

  // Declare a widget variable
  let widget: MainAreaWidget<APODWidget>;

  // Add an application command
  const command: string = 'apod:open';
  app.commands.addCommand(command, {
    label: 'Random Astronomy Picture',
    execute: () => {
      if (!widget || widget.isDisposed) {
        const content = new APODWidget();
        widget = new MainAreaWidget({content});
        widget.id = 'apod-jupyterlab';
        widget.title.label = 'Astronomy Picture';
        widget.title.closable = true;
      }
      if (!tracker.has(widget)) {
        // Track the state of the widget for later restoration
        tracker.add(widget);
      }
      if (!widget.isAttached) {
        // Attach the widget to the main work area if it's not there
        app.shell.add(widget, 'left', { rank : 600 });
      }
      widget.content.updateAPODImage();

      // Activate the widget
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the palette.
  palette.addItem({ command, category: 'Tutorial' });

  // Track and restore the widget state
  let tracker = new WidgetTracker<MainAreaWidget<APODWidget>>({
    namespace: 'apod'
  });
  if (restorer) {
    restorer.restore(tracker, {
      command,
      name: () => 'apod'
    });
  }
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_apod',
  autoStart: true,
  requires: [ICommandPalette],
  optional : [ILayoutRestorer],
  activate: activate
};

export default plugin;



/************ DUMP

import {
    ICommandPalette,
    WidgetTracker, Dialog,
    showDialog, showErrorMessage,
} from '@jupyterlab/apputils'

import { Contents } from '@jupyterlab/services'
import { PostSnippet } from './library/Hooks';
import DialogBodyWidget from "./Dialog";

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

      //const fileContent = JSON.stringify(jsonData, null, 2);
      // add in funcionality of updating json file as well
      try {
        await PostSnippet(inputValue, contentsManager);
        /**
         * await contentsManager.save(filePath, {
            type: 'file',
            format : 'text',
            content : fileContent
        });
         */
      } catch ( error : unknown ){
        console.error("Failed saving data to path")
        showErrorMessage("Error reached", "Failed to save snippet", [
          Dialog.cancelButton(),
          Dialog.okButton({label : 'retry'})
        ])
        
      }
    }
  }