/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */

import { ReactWidget } from '@jupyterlab/ui-components';
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

  const handleCopy = async (template: Template) => {
    const jsonData = JSON.stringify(template);
    const parsedData = JSON.parse(jsonData);
    
    try {
      await navigator.clipboard.writeText(JSON.stringify({
      "marker": "aspen-template",
      "id": parsedData.id,
      "content": parsedData.content
    }, null, 2) 
    );
    console.log("Copied to clipboard successfully!");
  }
  catch (err){
  console.error("Error copying to clipboard:", err);
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
                  <button className="template-copy" title="Copy to clipboard" onClick={() => handleCopy(template)}>
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
  private templates: Template[];

  constructor() {
    // super calls the parent class (ReactWidget) constructor
    super();
    this.addClass('jp-TemplatesManager');
    this.templates = [];
    this.loadTemplates();
  }

  createTemplate(codeSnippet: string) {
    codeSnippet = "#template start\n" + codeSnippet + "\n#template end";
    const template: Template = {
      id: `${Date.now()}`,
      name: `Snippet ${this.templates.length + 1}`,
      content: codeSnippet,
      dateCreated: new Date(),
      dateUpdated: new Date(),
      tags: [],
      color: '#FFE694',
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
    return <Library templates={this.templates}
      deleteTemplate={this.deleteTemplate}
      renameTemplate={this.renameTemplate}
      editTemplate={this.editTemplate}
      />;
  }
}