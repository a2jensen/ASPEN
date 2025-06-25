import { ContentsManager } from "@jupyterlab/services";
import { Template } from "./types";

/**
 * TemplatesManager Class
 * 
 * This class is responsible for managing templates within the application.
 * It handles creation, storage, retrieval, updating, and deletion of templates.
 * Templates are stored both in-memory as an array and persisted as JSON files.
 */
export class TemplatesManager {
    /** Array containing all loaded templates */
    templates : Template[]; // TODO:refactor so it is private! this needs to be done during libWidget refactor
    
    /** JupyterLab's ContentsManager to handle file operations */
    contentsManager : ContentsManager;

    /**
     * Initializes a new instance of the TemplatesManager
     * Sets up an empty templates array and creates a ContentsManager instance
     */
    constructor( contentManager : ContentsManager ){
        this.templates = [];
        this.contentsManager = contentManager;
    }

    get(templateId : string) : Template | undefined {
      return this.templates.find(template => template.id === templateId);
    }

    /**
     * Creates a new template from the provided code snippet
     * 
     * @param codeSnippet - The code content to be saved as a template
     * 
     * 1. Creates a new Template object with a unique timestamp ID
     * 2. Adds the template to the in-memory array
     * 3. Persists the template as a JSON file in the /snippets directory
     */
    
    async create( codeSnippet : string ){
        const template : Template = {
            id: `${Date.now()}`,  // Use timestamp as unique ID
            name: `Template ${this.templates.length + 1}`,  // Auto-generate name based on count
            content: codeSnippet,
            dateCreated: new Date(),
            dateUpdated: new Date(),
            tags: [],
            color: '#FFE694',  // Default color
        }
        this.templates.push(template);
        
        // saving a file is asynchronous
        try {
          await this.contentsManager.save(`/snippets/${template.name}.json`, {
            type: "file",
            format: "text",
            content: JSON.stringify(template,null,2)
          });
          return template;
        }
        catch(error) {
          console.error("Error saving file", error);
        }
    }

    /**
     * Deletes a template from both the in-memory array and filesystem
     * 
     * @param id - The unique identifier of the template to delete
     * @param name - The name of the template (used for file path construction)
     */
    delete( templateId : string ){
        const template = this.get(templateId);
        if (!template) return;

        // Filter out the template with the specified ID
        this.templates = this.templates.filter(template => template.id !== templateId);

        // Delete the corresponding JSON file
        this.contentsManager.delete(`/snippets/${template.name}.json`).then(() => {
            console.log(`Successfully deleted template ${template.name} ${templateId}`);
        }).catch(( error : unknown ) => {
            console.error(`Failed to delete template ${template.name} ${templateId}`, error);
        })
    }

    /**
     * Renames a template and updates its file path
     * 
     * @param id - The unique identifier of the template to rename
     * @param newName - The new name to assign to the template
     * 
     * The method:
     * 1. Finds the template with the matching ID
     * 2. Updates its name and dateUpdated properties
     * 3. Saves the updated template to the original file path
     * 4. Renames the file to match the new template name
     */
    rename(templateId : string, newName : string) {
        const template = this.get(templateId)
        if (!template) return;  // Exit if template not found

        const oldName = template.name;
        const oldPath = `/snippets/${template.name}.json`;
        const newPath = `/snippets/${newName}.json`;

        template.name = newName;
        template.dateUpdated = new Date();

        this.contentsManager.save(oldPath, {
            type: "file",
            format: "text",
            content: JSON.stringify(template, null, 2)
        }).then(() => {
            console.log(`Template renamed to ${newName} and saved successfully.`)
            return this.contentsManager.rename(oldPath, newPath);
        }).catch(( error : unknown ) => {
            console.error(`Error renaming template file for ${oldName}`, error);
        })
    }

    /**
     * Updates the content of an existing template
     * 
     * @param id - The unique identifier of the template to edit
     * @param newContent - The new content to replace the existing template content
     * 
     * The method:
     * 1. Finds the template with the matching ID
     * 2. Updates its content and dateUpdated properties
     * 3. Saves the updated template to its existing file path
     */
    edit(templateId: string, newContent: string) {
        const template = this.get(templateId)
        //const template = this.templates.find((t) => t.id === id);
        if (!template)
          return;  // Exit if template not found
    
        template.content = newContent;
        template.dateUpdated = new Date();
    
        const filePath = `/snippets/${template.name}.json`;
    
        this.contentsManager.save(filePath, {
          type : "file",
          format: "text",
          content: JSON.stringify(template, null, 2)
        }).then(() => {
            console.log(`Template ${template.name} content updated successfully.`)
          }).catch( ( error : unknown ) => {
            console.error("Error updating template content", error);
          });
      }

      /**
       * Loads all templates from the filesystem into memory
       * 
       * Used to initialize or refresh the templates array using the persisted JSON files.
       * It provides data persistence across browser reloads and sessions.
       * 
       */
      loadTemplates(){
        // Clear existing templates before loading
        this.templates = [];
        this.contentsManager.get('/snippets').then(model => {
            if (model.type === 'directory') {
              for (const file of model.content) {
                this.contentsManager.get(file.path).then(fileModel => {
                  try {
                    const templateData = JSON.parse(fileModel.content as string);
                    const template: Template = {
                      id: templateData.id || `${Date.now()}`,  // Use provided ID or generate new one
                      name: templateData.name || file.name,    // Use provided name or filename
                      content: templateData.content || "",     // Use provided content or empty string
                      dateCreated: new Date(templateData.dateCreated || Date.now()),
                      dateUpdated: new Date(templateData.dateUpdated || Date.now()),
                      tags: templateData.tags || [],           // Use provided tags or empty array
                      color: templateData.color || "#ffffff",  // Use provided color or default white
                    };
                    this.templates.push(template);
                    console.log(`Loaded template: ${template.name}`, template);
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
}