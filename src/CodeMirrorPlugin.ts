import { Extension } from '@codemirror/state';
import {
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';
import { SnippetsManager } from './snippetManager';

/**
 * 
 * This serves as the main entry point for integrating CodeMirror into ASPEN.
 * This plugin integrates the SnippetsManager Class with CodeMirror's view system.
 * It is in charge of handling editor events, and applying/updating decorations to snippet instances when the view updates appropriately.
 * 
 * @param snippetsManager 
 * @returns ViewPluginExtension. Create a plugin for a class whose constructor takes a single editor view as argument.
 */
export function CodeMirrorExtension( snippetsManager : SnippetsManager) : Extension {
    return ViewPlugin.fromClass(
      class {
        /** The current set of decorations in the editor */
        decorations: DecorationSet;
        
        /**
         * Initializes the plugin for a specific editor view
         * 
         * @param view - The editor view this plugin instance is attached to
         * 
         * Sets up the initial decorations and event listeners for:
         * - Paste events: Handle pasting templates into the editor
         * - Drop events: Handle drag-and-drop of templates into the editor
         */
        constructor(view: EditorView ) {
          // Initialize decorations
          this.decorations = snippetsManager.AssignDecorations(view);
          
          /**
           * Event listener for paste events
           * 
           * Handles when a template is pasted into the editor from the clipboard.
           * Parses the clipboard data and creates a new snippet instance if it contains
           * a valid template.
           */
          view.dom.addEventListener("paste", (event) =>{
            event.preventDefault();
            try{
              const text = event.clipboardData?.getData("text") || "";
              const copiedId = localStorage.getItem("templateId")
    
              if(copiedId){
                console.log("Pasted content is a template:", copiedId)
    
                const selection = view.state.selection.main;
                const cursorPos = selection.from;
                const pastedLines = text.split('\n').length
                const startLine = view.state.doc.lineAt(cursorPos).number - pastedLines + 1;
                console.log("Start line", startLine);
                const endLine = startLine + pastedLines - 1;
                console.log("Number of new lines in pasted text:", text.split("\n").length);
                console.log("End line,", endLine);
    
                snippetsManager.createSnippetInstance(view, startLine, endLine, copiedId, text);
                setTimeout(() => {
                  snippetsManager.updateSnippetInstance(view);
                  this.decorations = snippetsManager.AssignDecorations(view);
                }, 10);
              }
              else{
                console.log("No template found")
              }
            }
            catch(err){
              console.error("Error with paste: ", err);
            }
          })
          
          // add copy event listener to make sure default copy doesn't interfere with template creation
          view.dom.addEventListener("copy", event =>{
            console.log("event listener listened");
            localStorage.removeItem("templateId");
          })

          /**
           * Event listener for drop events
           * 
           * Handles when a template is dragged and dropped into the editor.
           * Parses the drop data and creates a new snippet instance if it contains
           * a valid template.
           */
          view.dom.addEventListener('drop', event => {
            event.preventDefault();
    
            const dragContent = event.dataTransfer?.getData('application/json');
            const droppedText = event.dataTransfer?.getData('text/plain');
            console.log("dropped text app/json", dragContent);
            console.log("dropped text text/plain", droppedText);
    
            if (!dragContent) return;
            if (!droppedText) return;
            
            const parsedText = JSON.parse(dragContent);
    
            if(!(parsedText.marker === "aspen-template")) return; 
    
            const selection = view.state.selection.main;
            const dropPos = selection.from;
            const endPos = dropPos + droppedText.length;
            const startLine = view.state.doc.lineAt(dropPos).number;
            console.log("Start line", startLine);
            const endLine = startLine + droppedText.split('\n').length - 1;
            console.log("End line,", endLine);
            const templateID = parsedText.templateID;
    
            snippetsManager.createSnippetInstance(view, startLine, endLine, templateID, droppedText);
    
            // Clear the selection (so template text is added unselected)
            view.dispatch({
              selection: { anchor: endPos, head: endPos} // set to end of inserted text
            });

            setTimeout(() => {
              snippetsManager.updateSnippetInstance(view);
              this.decorations = snippetsManager.AssignDecorations(view);
            }, 10); // A small delay to ensure updates are applied after the text is dropped
          });
        }
    
        /**
         * Updates the plugin state when changes occur in the editor
         * 
         * @param update - The ViewUpdate object containing information about the changes
         * 
         * This method is called whenever the document changes. It:
         * 1. Updates the positions of snippet instances via snippetsManager
         * 2. Refreshes the decorations to reflect the current state
         */
        update(update: ViewUpdate  ) {
          if (update.docChanged) {
              snippetsManager.updateSnippetInstance(update.view, update);
              this.decorations = snippetsManager.AssignDecorations(update.view);
          }
        }
      },
      {
        // Provide the decorations from this plugin to CodeMirror
        decorations: v => v.decorations
      }
    );
  }