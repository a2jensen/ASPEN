/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */

import { ReactWidget } from '@jupyterlab/ui-components';
import * as React from 'react';
import { useState } from 'react';
import "../style/index.css";
import "../style/base.css";
import Template from "./types";
import { TemplatesManager } from './TemplatesManager';

/**
 * React Library Component.
 */
function Library({ templates, deleteTemplate, renameTemplate, editTemplate }: {
    templates: Template[],
    deleteTemplate : (id : string, name : string) => void,
    renameTemplate : (id : string, name : string) => void,
    editTemplate : (id : string, name : string) => void,
  }) {
  const [expandedTemplates, setExpandedTemplates] = useState<{ [key: string]: boolean }>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState<string>("");

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
      <div className="library-sort">Sort</div>
      {templates.length > 0 ? (
        templates.map((template ) => ( //
            <div className="template-item" key={template.id}>
              {/** Section corresponding to when the template is not opened */}
              <div className="template-header">
                <button className='template-toggle' onClick={() => toggleTemplate(template.id)}>
                  {expandedTemplates[template.id] ? "▼" : "▶"} {template.name} 
                </button>
                <button className="template-delete" onClick={() => deleteTemplate(template.id, template.name)}>
                  X
                </button>
              </div>
              {/** Section corresponding to when the template is opened */}
              {expandedTemplates[template.id] && (
              <div className="template-content" draggable onDragStart={(event) => handleDragStart(event, template)}>
                {renamingId === template.id ? (
                  <input
                  className="rename-input"
                  type="text"
                  value={newName}
                  onChange={handleRenameChange}
                  onBlur={() => handleRenameConfirm(template.id)} // when user clicks outside, confirms rename
                  onKeyDown={(e) => e.key === "Enter" && handleRenameConfirm(template.id)} // when user presses enter, confirms rename
                  autoFocus // user can type in field without clicking first
                  />
                ) : (
                <h4 className="template-name" onClick={() => handleRenameStart(template)}>
                  {template.name}
                </h4>
                )}
                {editingId === template.id ? (
                  <textarea
                    className="edit-content-textarea"
                    value={newContent}
                    onChange={handleEditChange}
                    onBlur={() => handleEditConfirm(template.id)}
                    onKeyDown={(e) => {
                      if ( e.key === "Enter" && !e.shiftKey){
                        e.preventDefault()
                        handleEditConfirm(template.id)
                      } else if (e.key === "Tab") {
                        e.preventDefault();
                        const start = e.currentTarget.selectionStart;
                        const end = e.currentTarget.selectionEnd;
                        setNewContent(
                          newContent.substring(0, start) + "  " + newContent.substring(end) // Inserts 2 spaces
                        );
                        setTimeout(() => {
                          e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2; // Move cursor
                        }, 0);
                      }
                    }
                    }
                    autoFocus
                  />
                ) : (
                  <p className="template-snippet" onClick={() => handleEditStart(template)}>
                    {template.content}
                  </p>
                )}
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
  templateManager : TemplatesManager;

  constructor() {
    super();
    this.addClass('jp-LibraryWidget');
    this.templateManager = new TemplatesManager();
    this.loadTemplates();
  }

  createTemplate(codeSnippet: string) {
    this.templateManager.createTemplate(codeSnippet);
    this.update();
  }

  deleteTemplate = (id: string, name: string) => {
    this.templateManager.deleteTemplate(id,name);
    this.update();
  }

  renameTemplate = (id: string, newName: string) => {
    this.renameTemplate(id, newName);
    this.update();
  }

  editTemplate = (id: string, newContent: string) => {
    this.templateManager.editTemplate(id, newContent);
    this.update();
  }

  loadTemplates() {
    this.templateManager.loadTemplates();
    this.update();
  }

  render() {
    return <Library templates={this.templateManager.templates}
      deleteTemplate={this.templateManager.deleteTemplate}
      renameTemplate={this.templateManager.renameTemplate}
      editTemplate={this.templateManager.editTemplate}
      />;
  }
}