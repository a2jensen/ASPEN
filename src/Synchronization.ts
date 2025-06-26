import { TemplatesManager } from "./TemplatesManager";
import { SnippetsManager } from "./snippetManager";
import { LibraryWidget } from "./LibraryWidget";
import { Snippet } from "./types"
//import { diffChars } from "diff";

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
    diffs(templateId : string ,relativePosLine : number, charRange : number[], updatedText : string, insertedText : string) : void {
        console.log("--------within the diffs function-----------")
        const relatedSnippets : Snippet[] = this.snippetsManager.snippetTracker.filter(snippet => snippet.template_id === templateId)

        // collect all snippet contents
        const contents = relatedSnippets.map(s => s.content);

        const allIdentical = contents.every(c => c === contents[0])
        if (allIdentical){
            console.log("All instances are identical")
            return
        }

        this.snippetsManager.applyHighlights(templateId, relativePosLine, charRange,insertedText)

        // highlight @ line x -> charRange [b,z] on every snippet
        console.log("--------exiting the diffs function-----------")
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
