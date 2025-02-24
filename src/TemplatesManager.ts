import { ContentsManager } from "@jupyterlab/services";
import Template from "./types";

/**
 * Manages in memory array as well as storage of templates within JSON files.
 */
export class TemplatesManager {
    templates : Template[];
    jsonManager : ContentsManager;

    constructor(){
        this.templates = []
        this.jsonManager = new ContentsManager();
    }

    /**
     * Adds newly created template to array and JSON
     * @param codeSnippet 
     */
    createTemplate( codeSnippet : string ){
        const template : Template = {
            id: `${Date.now()}`,
            name: `Snippet ${this.templates.length + 1}`,
            content: codeSnippet,
            dateCreated: new Date(),
            dateUpdated: new Date(),
            tags: [],
            color: '#FFE694',
            connections: []
        }
        this.templates.push(template);
        
        this.jsonManager.save(`/snippets/${template.name}.json`, {
            type: "file",
            format: "text",
            content: JSON.stringify(template,null,2)
        }).then(() => {
            console.log(`Saved ${template.name} to file successfully.`);
        }).catch(error => {
            console.error("Error saving file", error);
        });

        // MAY NEED THIS.UPDATE... idk because thats responsible for updating state of the widget....
    }

    /**
     * Deletes template from array and JSON.
     * @param id 
     * @param name 
     */
    deleteTemplate( id : string, name: string){
        // returns array of templates that dont equal the specified id
        this.templates = this.templates.filter(template => template.id !== id);

        this.jsonManager.delete(`/snippets/${name}.json`).then(() => {
            console.log(`Successfully deleted template ${name} ${id}`);
        }).catch(( error : unknown ) => {
            console.error(`Failed to delete template ${name} ${id}`, error);
        })
    }

    renameTemplate(id : string, newName : string) {
        const template = this.templates.find((t) => t.id === id);
        if (!template) return;

        const oldName = template.name;
        const oldPath = `/snippets/${oldName}.json`;
        const newPath = `/snippets/${newName}.json`;

        template.name = newName;
        template.dateUpdated = new Date();

        this.jsonManager.save(oldPath, {
            type: "file",
            format: "text",
            content: JSON.stringify(template, null, 2)
        }).then(() => {
            console.log(`Template renamed to ${newName} and saved successfully.`)
            return this.jsonManager.rename(oldPath, newPath);
        }).catch(( error : unknown ) => {
            console.error(`Error renaming template file for ${oldName}`, error);
        })
    }

    /**
     * Properly edits template within the array and JSON.
     * @param id 
     * @param newContent 
     * @returns 
     */
    editTemplate (id: string, newContent: string) {
        const template = this.templates.find((t) => t.id === id);
        if (!template)
          return;
    
        template.content = newContent;
        template.dateUpdated = new Date();
    
        const filePath = `/snippets/${template.name}.json`;
    
        this.jsonManager.save(filePath, {
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
       * Loads in template data on refresh - for data persistence across reloads/sessions
       */
      loadTemplates(){
        // clear existing templates before loading
        this.templates = [];
        this.jsonManager.get('/snippets').then(model => {
            if (model.type === 'directory') {
              for (const file of model.content) {
                this.jsonManager.get(file.path).then(fileModel => {
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