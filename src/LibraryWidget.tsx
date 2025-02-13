/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */

import { ReactWidget } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
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

  loadTemplates() {
    return this.templates;
  }

  render() {
    return <Library templates={this.templates} deleteTemplate={this.deleteTemplate} />;
  }
}

const libraryWidget: Widget = new LibraryWidget();
Widget.attach(libraryWidget, document.body);