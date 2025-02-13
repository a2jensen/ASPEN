/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */

import { ReactWidget } from '@jupyterlab/ui-components';
//import { Widget } from '@lumino/widgets';
import * as React from 'react';
import { useState } from 'react';
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
  connections: string[];
}

/**
 * React Library Component.
 */
function Library({ templates, deleteTemplate }: { templates: Template[], deleteTemplate: (id: string, name: string) => void }) {
  const [expandedTemplates, setExpandedTemplates] = useState<{ [key: string]: boolean }>({});
  //const [insertedTemplates, setInsertedTemplates] = useState<Set<string>>(new Set());
  console.log("INSIDE LIB COMPONENT")

  const toggleTemplate = (id: string) => {
    setExpandedTemplates((prev) => ({
      ...prev,
      [id]: !prev[id], // Toggle specific template's expanded state
    }));
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, template: Template) => {
    event.dataTransfer.setData("text/plain", template.content);
    event.dataTransfer.setData("application/json", JSON.stringify(template)); // Store full template info
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="library-container">
      <h3 className="library-title">Your Templates</h3>
      <div className="library-sort">Sort Buttons</div>
      {templates.length > 0 ? (
        templates.map((template) => (
          <div key={template.id} className="template-item">
            <div className="template-header">
              <button className='toggle-btn' onClick={() => toggleTemplate(template.id)}>
                {expandedTemplates[template.id] ? "▼" : "▶"} {template.name}
              </button>
              <button className="delete-btn" onClick={() => deleteTemplate(template.id, template.name)}>
                ❌
              </button>
            </div>
            {expandedTemplates[template.id] && (
              <div className="template-content" draggable onDragStart={(event) => handleDragStart(event, template)}>
                <p className="template-snippet">{template.content}</p>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No templates available</p>
      )}
    </div>
  );
}

export class LibraryWidget extends ReactWidget {
  private templates: Template[];

  constructor() {
    super();
    this.addClass('jp-TemplatesManager');
    this.templates = [];
    this.loadTemplates();
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
      connections: []
    };
    this.templates.push(template);
    this.saveTemplate(template);
    this.update();
  }

  deleteTemplate = (id: string, name: string) => {
    const contentsManager = new ContentsManager();
    this.templates = this.templates.filter(template => template.id !== id);

    contentsManager.delete(`/snippets/${name}.json`).then(() => {
      console.log(`File deleted successfully`);
    }).catch(error => {
      console.log(`Failed to delete the JSON file of snippet`, error);
    });

    this.update();
  }

  saveTemplate(template: Template) {
    const contentsManager = new ContentsManager();
    contentsManager.save(`/snippets/${template.name}.json`, {
      type: "file",
      format: "text",
      content: JSON.stringify(template, null, 2)
    }).then(() => {
      console.log(`Saved ${template.name} to file successfully.`);
    }).catch(error => {
      console.error("Error saving file", error);
    });
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
                connections : []
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

  /**
   * 
   * @returns in-memory templates array
   */
  returnTemplateArray() {
    return this.templates;
  }

  /** we will need to access the contents inside the notebook, iterate through and find the instances(find by their marker), and
   * attatch them to their corresponding template
   */
  loadTemplateInstances(){}

  render() {
    return <Library templates={this.templates} deleteTemplate={this.deleteTemplate} />;
  }
}

//const libraryWidget: Widget = new LibraryWidget();
//Widget.attach(libraryWidget, document.body);