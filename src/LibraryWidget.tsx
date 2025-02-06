/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */
//import { Widget } from '@lumino/widgets';

// Importing class that allows us to integrate React Components into jupyterlabs UI framework
// https://jupyterlab.readthedocs.io/en/latest/api/classes/apputils.ReactWidget.html
import { ReactWidget } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
import "../style/index.css";
import "../style/base.css";

interface TemplateProps {
  id: string;
  name: string;
  content: string; // or code snippet?
  dateCreated: Date;
  dateUpdated: Date;
  tags: string[];
  color: string;
  // connections : ???
}


function Library({ templates, deleteTemplate }: { templates: TemplateProps[], deleteTemplate : (id : string) => void }) {
  return (
    <div className="library-Container">
      <h3>Your Templates</h3>
      <div>Sort Button </div>
      {templates.length > 0 ? (
        /** Individual template */
        templates.map((template, index) => (
          <div key={index} className="template-container">
            <h4 className="template-name">{template.name}</h4>
            <p className="template-snippet">{template.content}</p>
            <p className="template-date">date here</p>
            <p onClick={() => deleteTemplate(template.id)}> Delete button</p>
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
  private templates: TemplateProps[];

  constructor() {
    super();
    this.addClass('jp-TemplatesManager');
    this.templates = [];
  }

  createTemplate(codeSnippet: string) {
    const template: TemplateProps = {
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

