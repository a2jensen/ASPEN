//import { Widget } from '@lumino/widgets';

// Importing class that allows us to integrate React Components into jupyterlabs UI framework
// https://jupyterlab.readthedocs.io/en/latest/api/classes/apputils.ReactWidget.html
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
  content: string; // or code snippet?
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
  const [ expandedTemplates, setExpandedTemplates ] = useState<{ [key: string]: boolean }>({});

  const toggleTemplate = (id : string) => { 
    setExpandedTemplates((prev) => ({
      ...prev,
      [id] : !prev[id], // Toggle specific templates expanded state
    }))
  };
  
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, template: Template) => {
    event.dataTransfer.setData("text/plain", template.content);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="library-container">
      <h3 className="library-title">Your Templates</h3>
      <div className="library-sort">Sort Buttons </div>
      {/**ADD A SORT DROPDWON */}
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
        <p></p>
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
    this.update(); // Re-render the sidebar with the new template
  };

  deleteTemplate = (id: string) => {
    this.templates = this.templates.filter(template => template.id !== id);
    this.update();
  }

  sortTemplates() {}

  connectTemplate() {}

  render() {
    return <Library templates={this.templates} deleteTemplate={this.deleteTemplate} />;
  }
}

const libraryWidget : Widget = new LibraryWidget();
Widget.attach(libraryWidget, document.body);

