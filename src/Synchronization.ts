/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
import { TemplatesManager } from "./TemplatesManager";
import { SnippetsManager } from "./snippetManager";
import { LibraryWidget } from "./LibraryWidget";

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
     * NOTE. I NEED TO GET JSDIFF INSTALLED CORRECTLY BEFORE WORKING ON THIS
     */
    jsDiff(){
        return 0;
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