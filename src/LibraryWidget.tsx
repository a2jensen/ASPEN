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

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      console.log("Template content copied to clipboard");
    }
    catch (err) {
      console.error("Could not copy template: ", err);
    }
  }

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
    console.log("editing mode"); //

    // adjust height when edit starts to fit content
    // not working!!!
    const textarea = document.getElementById(template.id) as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "auto";
      console.log('scrollHeight:', textarea.scrollHeight); // not reaching !!!
      textarea.style.height = "300px";//`${textarea.scrollHeight}px`;
    }
  }

  const handleEditChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    setNewContent(textarea.value);
    textarea.style.height = "auto";
    console.log('scrollHeight:', textarea.scrollHeight); //
    textarea.style.height = `${textarea.scrollHeight}px`; // adjust height dynamically // not working !!!
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
                  {expandedTemplates[template.id] ? "v" : ">"}
                </button>
                
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
                <span className="template-name" onClick={() => handleRenameStart(template)}>
                  {template.name}
                </span>
                )}

                <div className="template-buttons">
                  <button className="template-copy" title="Copy to clipboard" onClick={() => handleCopy(template.content)}>
                    Copy
                  </button>

                  <button className="template-rename" title="Rename template" onClick={() => handleRenameStart(template)}>
                    Rename
                  </button>

                  <button className="template-edit" title="Edit template" onClick={() => handleEditStart(template)}>
                    Edit
                  </button>

                  <button className="template-delete" title="Delete template" onClick={() => deleteTemplate(template.id, template.name)}>
                    🗑
                  </button>
                </div>
              </div>

              {/** Section corresponding to when the template is opened */}
              {expandedTemplates[template.id] && (
              <div className="template-content"
                    // cannot drag and drop the template currently being edited
                    draggable={editingId !== template.id}
                    onDragStart={(event) => {
                        if (editingId !== template.id) {
                          handleDragStart(event, template);
                        }
                      }}
              >
                
                {editingId === template.id ? (
                  <textarea
                    className="edit-content-textarea"
                    value={newContent}
                    onChange={handleEditChange}
                    onBlur={() => handleEditConfirm(template.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey){
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

/**
 * LibraryWidget extends ReactWidget, which in turn extends Widget.
 * Widget is a core component of the Lumino library.
 * 
 * This class manages the template connection as well as renders the Library react component
 */
export class LibraryWidget extends ReactWidget {
  templateManager : TemplatesManager;

  constructor() {
    // super calls the parent class (ReactWidget) constructor
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
    this.templateManager.renameTemplate(id, newName);
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
      deleteTemplate={this.deleteTemplate}
      renameTemplate={this.renameTemplate}
      editTemplate={this.editTemplate}
      />;
  }
}