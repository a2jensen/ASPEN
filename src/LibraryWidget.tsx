import { ReactWidget } from '@jupyterlab/ui-components';
import * as React from 'react';
import { useState } from 'react';
import "../style/index.css";
import "../style/base.css";
import { copyIcon, editIcon, deleteIcon, caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';
import { Template } from "./types";
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
  const [expandedTemplates, setExpandedTemplates] = useState<{ [key: string]: boolean }>(() => {
    const initialState: { [key: string]: boolean } = {};
    templates.forEach(template => {
      initialState[template.id] = true;
    });
    return initialState;
  });
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState<string>("");

  const initialSortOption = localStorage.getItem("sortOption") || "created-desc";
  const [sortOption, setSortOption] = useState(initialSortOption);

  const sortTemplates = (templates: Template[], option: string): Template[] => {
    const sorted = [...templates]; // prevents original array from being modified during sorting

    switch (option) {
      case 'created-desc':
        sorted.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
        break;
      case 'created-asc':
        sorted.sort((a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime());
        break;
      case 'updated-desc':
        sorted.sort((a, b) => new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime());
        break;
      case 'updated-asc':
        sorted.sort((a, b) => new Date(a.dateUpdated).getTime() - new Date(b.dateUpdated).getTime());
        break;
      default:
        break;
    }

    return sorted;
  };

  const [sortedTemplates, setSortedTemplates] = useState<Template[]>(() => {
    return sortTemplates(templates, initialSortOption);
  });

  // When the sort option is updated, re-sort and save to local storage
  React.useEffect(() => {
    setSortedTemplates(sortTemplates(templates, sortOption));
    localStorage.setItem("sortOption", sortOption);
  }, [sortOption, templates]);

  React.useEffect(() => {
    const newExpanded: { [key: string]: boolean } = { ...expandedTemplates };
    templates.forEach(template => {
      if (!(template.id in newExpanded)) {
        newExpanded[template.id] = true;
      }
    });
    setExpandedTemplates(newExpanded);
  }, [templates]);

  const toggleTemplate = (id: string) => {
    setExpandedTemplates((prev) => ({
      ...prev,
      [id]: !prev[id], // Toggle specific template's expanded state
    }));
  };
  
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, template: Template) => {
    //added a line before and after the content in order to be able to get out of template, issue still there tho if we delete it it wont work
    event.dataTransfer.setData("text/plain", "\n"+template.content + "\n");
    event.dataTransfer.setData("application/json", JSON.stringify(template)); // Store full template info
    event.dataTransfer.effectAllowed = "copy";
  };

  const handleCopy = (template: Template) => {
    const jsonData = JSON.stringify(template);
    const parsedData = JSON.parse(jsonData);
    
    navigator.clipboard.writeText(parsedData.content).then(() => {
      localStorage.setItem("templateId", parsedData.id);
      console.log("Copied to clipboard successfully!");
    });
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
    if (!expandedTemplates[template.id]) {
      toggleTemplate(template.id);
    }
    console.log("editing mode");
  }

  React.useEffect(() => {
    if (editingId) {
      const textarea = document.getElementById(editingId) as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }
  }, [editingId]);

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
      <div className="library-sort">
        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
          <option value="created-desc">Most Recently Created</option>
          <option value="created-asc">Least Recently Created</option>
          <option value="updated-desc">Most Recently Updated</option>
          <option value="updated-asc">Least Recently Updated</option>
        </select>
      </div>

      {sortedTemplates.length > 0 ? (
        sortedTemplates.map((template ) => (
            <div className="template-item" key={template.id}>
              {/** Section corresponding to when the template is not opened */}
              <div className="template-header">
                <button className='template-toggle' onClick={() => toggleTemplate(template.id)}>
                  {expandedTemplates[template.id] ? <caretDownIcon.react tag="span" height="16px" width="16px" /> : <caretRightIcon.react tag="span" height="16px" width="16px" />}
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
                    <copyIcon.react tag="span" height="16px" width="16px"/>
                  </button>

                  <button className="template-edit" title="Edit template" onClick={() => handleEditStart(template)}>
                    <editIcon.react tag="span" height="16px" width="16px"/>
                  </button>

                  <button className="template-delete" title="Delete template" onClick={() => deleteTemplate(template.id, template.name)}>
                    <deleteIcon.react tag="span" height="16px" width="16px"/>
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
                  <p className="template-snippet" 
                    onClick={() => handleEditStart(template)}
                    data-template-id={template.id}  
                    draggable 
                    onDragStart={(event) => handleDragStart(event, template)}
                  >
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

  constructor( templatesManager : TemplatesManager ) {
    super();
    this.addClass('jp-LibraryWidget');
    this.templateManager = templatesManager;
    this.loadTemplates();
  }

  async createTemplate(codeSnippet: string) {
    await this.templateManager.createTemplate(codeSnippet);
    await this.templateManager.loadTemplates();
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

  async loadTemplates() {
    await this.templateManager.loadTemplates();
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