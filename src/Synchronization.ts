import { TemplatesManager } from "./TemplatesManager";
import { SnippetsManager } from "./snippetManager";
import { LibraryWidget } from "./LibraryWidget";
import { Snippet } from "./types"

export class Synchronization {
    private templatesManager : TemplatesManager
    private snippetsManager : SnippetsManager
    private libraryWidget : LibraryWidget

    constructor ( templatesManagerInstance : TemplatesManager, snippetsManagerInstance : SnippetsManager, libraryWidgetInstance : LibraryWidget){
        this.templatesManager = templatesManagerInstance;
        this.snippetsManager = snippetsManagerInstance;
        this.libraryWidget = libraryWidgetInstance
    }

    /**
     * Function that is called everytime an edit to a snippet instance is made.  called within the code mirror plugin.
     */
    jsDiff(templateId : string ,line : number, charRange : number[], text : string) : void {
        const relatedSnippets : Snippet[] = this.snippetsManager.snippetTracker.filter(snippet => snippet.template_id === templateId)
        
        // highlight @ line x -> charRange [b,z] on every snippet
        
    }
    

    /**
     * 2 cases to consider: user makes changes to template and synchs, user makes changes to instance and synchs
     * when we push from the template, we set cases to false since template already is edited
     */
    synch( templateId : string, content : string, pushFromInstance : boolean){
        if (pushFromInstance){
            this.templatesManager.edit(templateId, content)
        }
        this.snippetsManager.editAll(templateId, content)
        this.libraryWidget.update()
    }
}