/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
import { ReactWidget } from '@jupyterlab/ui-components';
import * as React from 'react';
import { useState } from 'react';
import "../style/index.css";
import "../style/base.css";
import { copyIcon, editIcon, deleteIcon, caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';
import { Template, Snippet } from "./types";
import { TemplatesManager } from './TemplatesManager';
import { SnippetsManager } from './snippetManager';

/**
 * TODO: possibly move updates into the REACT component itself....
 * pass in templatesManager / snippetsManager into component...
 * useEffect for state updates
 * edge case : handle array updates outside of component, implement Signaling possibly
 */

/**
 * React Library Component.
 */
function Library({ templates, snippets, deleteTemplate, renameTemplate, editTemplate,toggleTemplateColor,activeTemplateHighlightIds }: {
    templates: Template[],
    snippets: Snippet[],
    deleteTemplate : (id : string, name : string) => void,
    renameTemplate : (id : string, name : string) => void,
    editTemplate : (id : string, name : string) => void,
    toggleTemplateColor : (id : string) => void,
    activeTemplateHighlightIds: Set<string>,
  }) {
    console.log("Library received templates:", templates);
  const [expandedTemplates, setExpandedTemplates] = useState<{ [key: string]: boolean }>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState<string>("");

  // sort by last used sort option (or created-desc if none)
  const initialSortOption = localStorage.getItem("sortOption") || "created-desc";
  const [sortOption, setSortOption] = useState(initialSortOption);
  const [sortedTemplates, setSortedTemplates] = useState<Template[]>(templates);

  const toggleTemplate = (id: string) => {
    setExpandedTemplates((prev) => ({
      ...prev,
      [id]: !prev[id], // Toggle specific template's expanded state
    }));
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    let sorted = [...templates]; // prevents original array from being modified during sorting

    switch (option) {
      case 'created-desc':
        sorted = sorted.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
        break;
        case 'created-asc':
          sorted = sorted.sort((a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime());
          break;
        case 'updated-desc':
          sorted = sorted.sort((a, b) => new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime());
          break;
        case 'updated-asc':
          sorted = sorted.sort((a, b) => new Date(a.dateUpdated).getTime() - new Date(b.dateUpdated).getTime());
          break;
        default:
          break;
    }
    
    setSortedTemplates(sorted);
  }

  React.useEffect(() => {
    console.log("USE EFFECT 1")
    setRenamingId(null);
    setEditingId(null);

    const validIds = new Set(templates.map(t => t.id));
    setExpandedTemplates(prev => {
      const updated = { ...prev };
      let changed = false;
      
      // Remove any expanded state for templates that no longer exist
      Object.keys(updated).forEach(id => {
        if (!validIds.has(id)) {
          delete updated[id];
          changed = true;
        }
      });
      
      // Only return a new object if something changed
      return changed ? updated : prev;
    });
  }, [templates])

  // When the sort option is updated, save to local storage
  React.useEffect(() => {
    localStorage.setItem("sortOption", sortOption);
  }, [sortOption]);

  /** 
  React.useEffect(() => {
    console.log("USE EFFECT 2")
    let sorted = [...templates];
    switch (sortOption) {
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
    setSortedTemplates(sorted);
  }, [templates, sortOption]);
  */

  
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, template: Template) => {
    //added a line before and after the content in order to be able to get out of template, issue still there tho if we delete it it wont work
    event.dataTransfer.setData("text/plain", "\n" + template.content + "\n");
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
    console.log("editing mode"); //
  }

  const handleEditChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    setNewContent(textarea.value);
    textarea.style.height = "auto";
    console.log('scrollHeight:', textarea.scrollHeight); //
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
        <select value={sortOption} onChange={(e) => handleSortChange(e.target.value)}>
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

                 <button 
                    className={`template-toggle ${activeTemplateHighlightIds.has(template.id) ? 'template-highlight-active' : ''}`}
                    title={activeTemplateHighlightIds.has(template.id) ? "Hide highlights" : "Show highlights"} 
                    onClick={() => {
                      toggleTemplateColor(template.id);
                    }}
                  >
                    <span style={{ 
                      color: activeTemplateHighlightIds.has(template.id) ? template.color : 'gray' 
                    }}>▣</span>
                  </button>

                  <button className="template-copy" title="Copy to clipboard" onClick={() => handleCopy(template)}>
                    <copyIcon.react tag="span" height="16px" width="16px" />
                  </button>
                  <button className="template-edit" title="Edit template" onClick={() => handleEditStart(template)}>
                    <editIcon.react tag="span" height="16px" width="16px" />
                  </button>

                  <button className="template-delete" title="Delete template" onClick={() => deleteTemplate(template.id, template.name)}>
                    <deleteIcon.react tag="span" height="16px" width="16px" />
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
  snippetsManager : SnippetsManager;

  constructor( templatesManager : TemplatesManager, snippetsManager : SnippetsManager ) {
    super();
    this.addClass('jp-LibraryWidget');
    this.templateManager = templatesManager;
    this.snippetsManager = snippetsManager;
    this.loadTemplates();
  }

  createTemplate(codeSnippet: string) {
    this.update();
    return this.templateManager.create(codeSnippet);
  }

  deleteTemplate = (id: string, name: string) => {
    this.templateManager.delete(id);
    this.update();
  }

  renameTemplate = (id: string, newName: string) => {
    this.templateManager.rename(id, newName);
    this.update();
  }

  editTemplate = (id: string, newContent: string) => {
    this.templateManager.edit(id, newContent);
    this.update();
  }

  toggleTemplateColor = (id: string) => {
    this.templateManager.toggleTemplateColor(id);
    this.update();
  }

  loadTemplates() {
    this.templateManager.loadTemplates();
    this.update();
  }

  render() {
    console.log("RENDERING LIBRARY WIDGET", this.templateManager.templates);
    return <Library 
      templates={this.templateManager.templates}
      snippets={this.snippetsManager.snippetTracker}
      deleteTemplate={this.deleteTemplate}
      renameTemplate={this.renameTemplate}
      editTemplate={this.editTemplate}
      toggleTemplateColor={this.toggleTemplateColor}
      activeTemplateHighlightIds={this.templateManager.activeTemplateHighlightIds}
      />;
  }
}