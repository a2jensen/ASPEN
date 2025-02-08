//import { Widget } from '@lumino/widgets';

// Importing class that allows us to integrate React Components into jupyterlabs UI framework
// https://jupyterlab.readthedocs.io/en/latest/api/classes/apputils.ReactWidget.html
import { ReactWidget } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
import {ContentsManager} from '@jupyterlab/services';
import "../style/index.css";
import "../style/base.css";

interface Template {
  id: string;
  name: string;
  content: string;
  dateCreated: Date;
  dateUpdated: Date;
  tags: string[];
  color: string;
  // connections : ???
}

/**
 * 
 * React Library Component.
 */
function Library({ templates, deleteTemplate }: { templates: Template[], deleteTemplate : (id : string, name : string) => void }) {
  
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, template: Template) => {
    event.dataTransfer.setData("text/plain", template.content);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="library-container">
      <h3 className="library-title">Your Templates</h3>
      <div className="library-sort">Sort Button </div>
      {templates.length > 0 ? (
        templates.map((template, index) => (
          <div 
            key={index} 
            className="template-container"
            draggable 
            onDragStart={(event) => handleDragStart(event, template)}
          >
            <h4 className="template-name">{template.name}</h4>
            <p className="template-snippet">{template.content}</p>
            <p onClick={() => deleteTemplate(template.id, template.name)}> Delete button</p>
          </div>
        ))
      ) : (
        <p>No templates available</p>
      )}
    </div>
  );
}


// Wrapping library component and making it a widget
// https://jupyterlab.readthedocs.io/en/latest/extension/virtualdom.html
export class LibraryWidget extends ReactWidget {
  // array to store templates
  private templates: Template[];

  constructor() {
    super();
    this.addClass('jp-TemplatesManager');
    this.templates = [];
    this.loadTemplates();
  }

  onAfterAttach( msg : any) {
    super.onAfterAttach(msg);
    //this.loadTemplates();
  }

  createTemplate(codeSnippet: string) {
    const template: Template = {
      id: `${Date.now()}`,
      name: `Snippet ${this.templates.length + 1}`,
      content: codeSnippet,
      dateCreated: new Date(),
      dateUpdated: new Date(),
      tags: [],
      color: '#ffffff',
    };
    this.templates.push(template);
    this.saveTemplate(template);
    this.update(); // Re-render the sidebar with the new template
  };

  deleteTemplate = (id: string, name: string) => {
    const contentsManager = new ContentsManager();
    this.templates = this.templates.filter(template => template.id !== id);

    contentsManager.delete(`/snippets/${name}.json`).then(() => {
      console.log(`File deleted successfully`);
    }).catch((error : unknown ) => {
      console.log(`Failed to delete the JSON file of snippet`, error);
    }) 

    this.update()
  }

  /**
   * Function that saves to JSON file
   */
  saveTemplate(template : Template){
    const contentsManager = new ContentsManager();
    const templateName = template.name;
    contentsManager.save(`/snippets/${templateName}.json`, {
      type : "file",
      format: "text",
      content: JSON.stringify(template, null, 2)
    }).then(() => {
      console.log(`Saved ${template} to file successfully.`)
    }).catch( (error : unknown ) => {
      console.error("Error reading file", error);
    })
  }
  
  // function that will load on refresh
  loadTemplates() {
    const contentsManager = new ContentsManager();
    this.templates = []; // Clear existing templates before loading
  
    contentsManager.get('/snippets').then(model => {
      if (model.type === 'directory') {
        for (const file of model.content) {
          contentsManager.get(file.path).then(fileModel => {
            try {
              const templateData = JSON.parse(fileModel.content as string);
              const template: Template = {
                id: templateData.id || `${Date.now()}`,
                name: templateData.name || file.name,
                content: templateData.content || "",
                dateCreated: new Date(templateData.dateCreated || Date.now()),
                dateUpdated: new Date(templateData.dateUpdated || Date.now()),
                tags: templateData.tags || [],
                color: templateData.color || "#ffffff",
              };
  
              this.templates.push(template);
              console.log(`Loaded template: ${template.name}`, template);
              this.update(); // Re-render after adding each template
            } catch (error) {
              console.error(`Error parsing JSON from ${file.path}:`, error);
            }
          }).catch(error => {
            console.error(`Error loading file: ${file.path}`, error);
          });
        }
      }
    }).catch(error => {
      console.error("Error fetching snippets directory:", error);
    });
  }
  
  sortTemplates() {}

  connectTemplate() {}

  render() {
    return <Library templates={this.templates} deleteTemplate={this.deleteTemplate} />;
  }
}

const libraryWidget : Widget = new LibraryWidget();
Widget.attach(libraryWidget, document.body);

