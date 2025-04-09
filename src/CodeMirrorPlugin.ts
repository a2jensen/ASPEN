import { Extension } from '@codemirror/state';
import {
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { SnippetsManager } from './SnippetManager';

// Create a global flag to track if the event listener has been registered
let saveSnippetListenerRegistered = false;
let currentView: EditorView | null = null;

/**
 * 
 * This serves as the main entry point for integrating CodeMirror into the ASPEN extension.
 * This plugin integrates the SnippetsManager Class with CodeMirror's view system, evidenced by the function taking in a SnippetsManager prop.
 * It is in charge of handling editor events, and applying/updating decorations to snippet instances when the view updates appropriately.
 * 
 * @param snippetsManager 
 * @returns ViewPluginExtension. Create a plugin for a class whose constructor takes a single editor view as argument.
 */
export function CodeMirrorExtension(snippetsManager: SnippetsManager): Extension {
  // Register the global event listener only once
  if (!saveSnippetListenerRegistered) {
    saveSnippetListenerRegistered = true;
    
    // This event listener will now be registered only once
    document.addEventListener('Save Code Snippet', (event) => {
      console.log("Event listener for createSnippet fired");
      
      if (!currentView) {
        console.warn("No active editor view available");
        return;
      }
      
      const selection = currentView.state.selection.main;
      const startLine = currentView.state.doc.lineAt(selection.from).number;
      const endLine = currentView.state.doc.lineAt(selection.to).number;
      
      const templateID = 'custom';
      const droppedText = currentView.state.sliceDoc(selection.from, selection.to).trim();
      
      if (!droppedText) {
        console.warn("Skipping empty snippet");
        return; // Do not create an empty snippet
      }
     
      //Issue here because of design its not being applied 
      //Have to do an automatic refresh to reapply the decorations
      setTimeout(() => {
        snippetsManager.updateSnippetInstance(currentView!);
        snippetsManager.createSnippetInstance(currentView!, startLine, endLine, templateID, droppedText);
        currentView!.dispatch({ effects: [] });
      }, 10);
      // Update decorations through the plugin instance rather than directly here
      // The ViewPlugin's update method will handle that
    });
  }
  
  const viewPlugin = ViewPlugin.fromClass(
    class {
      /** The current set of decorations in the editor */
      decorations: DecorationSet;
      /** Store the view instance */
      view: EditorView;
      
      /**
       * Initializes the plugin for a specific editor view
       * 
       * @param view - The editor view this plugin instance is attached to
       * 
       * Sets up the initial decorations and event listeners for:
       * - Paste events: Handle pasting templates into the editor
       * - Drop events: Handle drag-and-drop of templates into the editor
       */
      constructor(view: EditorView) {
        // Store the view instance
        this.view = view;
        
        // Update the current view reference
        currentView = view;
        
        // Initialize decorations
        this.decorations = snippetsManager.AssignDecorations(view);
        
        /**
         * Event listener for paste events
         * 
         * Handles when a template is pasted into the editor from the clipboard.
         * Parses the clipboard data and creates a new snippet instance if it contains
         * a valid template.
         */
        view.dom.addEventListener("paste", event => {
          event.preventDefault();
  
          const clipboardContent = event.clipboardData?.getData('application/json');
          const droppedText = event.clipboardData?.getData('text/plain');
          console.log("dropped text app/json", clipboardContent);
          console.log("dropped text text/plain", droppedText);
  
          if (!clipboardContent) return;
          if(!droppedText) return;
  
          const parsedText = JSON.parse(clipboardContent);
          if(!(parsedText.marker === "aspen-template")) return; 
          
          const selection = view.state.selection.main;
          const dropPos = selection.from;
          const startLine = view.state.doc.lineAt(dropPos).number;
          const endLine = startLine + droppedText.split('\n').length - 1;
          console.log("Start line", startLine);
          console.log("End line,", endLine);
  
          const templateId = parsedText.templateID;
          console.log("The template id associated with the instance", templateId);
          snippetsManager.createSnippetInstance(view, startLine, endLine, templateId, droppedText);
  
          setTimeout(() => {
            snippetsManager.updateSnippetInstance(view);
            this.decorations = snippetsManager.AssignDecorations(view);
          }, 10); // A small delay to ensure updates are applied after the text is pasted
        });
  
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
          const startLine = view.state.doc.lineAt(dropPos).number;
          //console.log("Start line", startLine);
          const endLine = startLine + droppedText.split('\n').length - 1;
          //console.log("End line,", endLine);
          const templateID = parsedText.templateID;
  
          snippetsManager.createSnippetInstance(view, startLine + 1, endLine - 1, templateID, droppedText);
          //this.decorations = snippetsManager.AssignDecorations(view);

          setTimeout(() => {
            snippetsManager.updateSnippetInstance(view);
            this.decorations = snippetsManager.AssignDecorations(view);
          }, 10); // A small delay to ensure updates are applied after the text is dropped
        });
      }
      
      /**
       * Cleanup when the view plugin is destroyed
       */
      destroy() {
        // Clear the currentView reference if it matches this view
        if (currentView === this.view) {
          currentView = null;
        }
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
      update(update: ViewUpdate) {
        // Update the stored view instance
        this.view = update.view;
        
        // Update the current view reference
        currentView = update.view;
        
        if (update.docChanged || update.transactions.length > 0) {
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
  
  return [viewPlugin];
}