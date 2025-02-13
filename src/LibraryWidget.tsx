/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */
//import { Widget } from '@lumino/widgets';

// Importing class that allows us to integrate React Components into jupyterlabs UI framework
// https://jupyterlab.readthedocs.io/en/latest/api/classes/apputils.ReactWidget.html
import { ReactWidget } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
import {ContentsManager} from '@jupyterlab/services';
import "../style/index.css";
import "../style/base.css";
import { useState } from "react";

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
function Library({ templates, deleteTemplate, renameTemplate, editTemplate }: {
    templates: Template[],
    deleteTemplate : (id : string, name : string) => void,
    renameTemplate : (id : string, name : string) => void,
    editTemplate : (id : string, name : string) => void,
  }) {

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState<string>("");

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, template: Template) => {
    event.dataTransfer.setData("text/plain", template.content);
    event.dataTransfer.effectAllowed = "copy";
  };

  const handleRenameStart = (template: Template) => {
    setRenamingId(template.id); // enter renaming mode
    setNewName(template.name); // current name is prefilled
  }

  const handleRenameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(event.target.value);
  }

  const handleRenameConfirm = (id: string) => {
    if (newName.trim() !== "") {
      renameTemplate(id, newName.trim());
    }
    setRenamingId(null); // exit renaming mode
  }

  const handleEditStart = (template: Template) => {
    setEditingId(template.id); // enter editing mode
    setNewContent(template.content); // current content is prefilled
  }

  const handleEditChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewContent(event.target.value);
  }

  const handleEditConfirm = (id: string) => {
    if (newContent.trim() !== "") {
      editTemplate(id, newContent.trim());
    }
    setEditingId(null); // exit editing mode
  }

  return (
    <div className="library-container">
      <h3 className="library-title">Your Templates</h3>
      <div className="library-sort">Sort Button </div>
      {templates.length > 0 ? (
        templates.map((template, index) => ( //
          <div 
            key={index} //
            className="template-container"
            draggable 
            onDragStart={(event) => handleDragStart(event, template)}
          >
            {renamingId === template.id ? (
              <input
                type="text"
                value={newName}
                onChange={handleRenameChange}
                onBlur={() => handleRenameConfirm(template.id)} // when user clicks outside, confirms rename
                onKeyDown={(e) => e.key === "Enter" && handleRenameConfirm(template.id)} // when user presses enter, confirms rename
                autoFocus // user can type in field without clicking first
                className="rename-input"
              />
            ) : (
              <h4 className="template-name" onClick={() => handleRenameStart(template)}>
                {template.name}
              </h4>
            )}

            {editingId === template.id ? (
              <textarea
                value={newContent}
                onChange={handleEditChange}
                onBlur={() => handleEditConfirm(template.id)}
                onKeyDown={(e) => e.key === "Enter" && handleEditConfirm(template.id)}
                autoFocus
                className="edit-content-textarea"
              />
            ) : (
              <p className="template-snippet" onClick={() => handleEditStart(template)}>
                {template.content}
              </p>
            )}

            <p onClick={() => deleteTemplate(template.id, template.name)}> Delete button</p>
            <p onClick={() => handleRenameStart(template)}> Rename button</p>
            <p onClick={() => handleEditStart(template)}> Edit button</p>
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
      color: '#FFE694',
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

  renameTemplate = (id: string, newName: string) => {
    const contentsManager = new ContentsManager();
    const template = this.templates.find((t) => t.id === id);
    if (!template)
      return;

    const oldName = template.name;
    const oldPath = `/snippets/${oldName}.json`;
    const newPath = `/snippets/${newName}.json`;

    template.name = newName;
    template.dateUpdated = new Date();

    contentsManager.save(oldPath, {
      type : "file",
      format: "text",
      content: JSON.stringify(template, null, 2)
    }).then(() => {
        return contentsManager.rename(oldPath, newPath);
      }).then(() => {
        console.log(`Template renamed to ${newName} and saved successfully.`)
      }).catch( (error : unknown ) => {
        console.error("Error renaming template file", error);
      });

    this.update();
  }

  editTemplate = (id: string, newContent: string) => {
    const contentsManager = new ContentsManager();
    const template = this.templates.find((t) => t.id === id);
    if (!template)
      return;

    template.content = newContent;
    template.dateUpdated = new Date();

    const filePath = `/snippets/${template.name}.json`;

    contentsManager.save(filePath, {
      type : "file",
      format: "text",
      content: JSON.stringify(template, null, 2)
    }).then(() => {
        console.log(`Template ${template.name} content updated successfully.`)
      }).catch( (error : unknown ) => {
        console.error("Error updating template content", error);
      });

    this.update();
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
                color: templateData.color || "#FFE694",
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
    return <Library templates={this.templates}
      deleteTemplate={this.deleteTemplate}
      renameTemplate={this.renameTemplate}
      editTemplate={this.editTemplate}
      />;
  }
}

const libraryWidget : Widget = new LibraryWidget();
Widget.attach(libraryWidget, document.body);

