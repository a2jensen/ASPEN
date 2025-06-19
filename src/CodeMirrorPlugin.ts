/* eslint-disable curly */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
import { Extension } from '@codemirror/state';
import {
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
//import { Snippet } from './types'
import { SnippetsManager } from './snippetManager';
import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook"


// Create a global flag to track if the event listener has been registered
let saveSnippetListenerRegistered = false;
let currentView: EditorView | null = null;
let notebookPanel : NotebookPanel | null;
let notebookId : string | null
let cellIndex : number | null

/**
 * 
 * This serves as the main entry point for integrating CodeMirror into the ASPEN extension.
 * This plugin integrates the SnippetsManager Class with CodeMirror's view system, evidenced by the function taking in a SnippetsManager prop.
 * It is in charge of handling editor events, and applying/updating decorations to snippet instances when the view updates appropriately.
 * 
 * @param snippetsManager 
 * @returns ViewPluginExtension. Create a plugin for a class whose constructor takes a single editor view as argument.
 */


export function CodeMirrorExtension(snippetsManager: SnippetsManager, notebookTracker : INotebookTracker): Extension {
 
  notebookTracker.currentChanged.connect(() => {
    console.log("Inside notebooktracker within CodeMirrorExtension!!!")

    notebookPanel = notebookTracker.currentWidget;
    if (!notebookPanel) {
      console.log("no notebook opened yet...")
      return
    }

    const notebook = notebookPanel.content;
    notebookId = notebookPanel.context.path;
    cellIndex = notebook.activeCellIndex;

    notebook.activeCellChanged.connect(() => {
      cellIndex = notebook.activeCellIndex;
      console.log("Active cell changed: ", cellIndex);
    })

    console.log("notebookId:", notebookId);
    console.log("cellIndex:", cellIndex);
  }) 

  // could this be possible moved into the view plugin?
  // Register the global event listener only once
  if (!saveSnippetListenerRegistered) {
    saveSnippetListenerRegistered = true;
    
    // This event listener will now be registered only once
    document.addEventListener('Save Code Snippet', (event) => {
      const templateId = (event as CustomEvent).detail.templateID;
      
      if (!currentView) {
        console.warn("No active editor view available");
        return;
      }
      
      const selection = currentView.state.selection.main;
      const startLine = currentView.state.doc.lineAt(selection.from).number;
      const endLine = currentView.state.doc.lineAt(selection.to).number;
      
      const droppedText = currentView.state.sliceDoc(selection.from, selection.to).trim();
      
      if (!droppedText) {
        console.warn("Skipping empty snippet");
        return; // Do not create an empty snippet
      }
     
      //Issue here because of design its not being applied 
      //Have to do an automatic refresh to reapply the decorations
      setTimeout(() => {
        snippetsManager.update(currentView!);
        //snippetsManager.create(currentView!, startLine, endLine, templateID, droppedText);
        
        cellIndex = notebookPanel?.content.activeCellIndex ?? cellIndex;
        if (cellIndex == null || notebookId === null){
          console.log("failing to create snippet, invalid notebookId and / or cell index")
          console.log("Notebook ID, should be null :", notebookId)
          console.log("cell index, should be null : ", cellIndex)
          return;
        }
        snippetsManager.create(currentView!, startLine, endLine, templateId, droppedText, notebookId, cellIndex);

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
        this.decorations = snippetsManager.assignDecorations(view);
        
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

          cellIndex = notebookPanel?.content.activeCellIndex ?? cellIndex;
          if (notebookId && cellIndex){
            snippetsManager.create(view, startLine, endLine, templateId, droppedText, notebookId, cellIndex);
          }
  
          setTimeout(() => {
            this.decorations = snippetsManager.assignDecorations(view);
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
          const templateId = parsedText.templateID;
          
          snippetsManager.update(currentView!);
          //snippetsManager.create(currentView!, startLine, endLine, templateID, droppedText);
          cellIndex = notebookPanel?.content.activeCellIndex ?? cellIndex;
          if (cellIndex == null || notebookId === null){
            console.log("failing to create snippet, invalid notebookId and / or cell index")
            console.log("Notebook ID, should be null :", notebookId)
            console.log("cell index, should be null : ", cellIndex)
            return;
          }
          snippetsManager.create(currentView!, startLine, endLine, templateId, droppedText, notebookId, cellIndex);
  

          setTimeout(() => {
            snippetsManager.update(view);
            this.decorations = snippetsManager.assignDecorations(view);
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

      /**
       * We need to get the cell ID
       */
      update(update: ViewUpdate) {
        // Update the stored view instance
        this.view = update.view;
        // Update the current view reference
        currentView = update.view;
        
        //const changes = update.changes
        //const checker = update.view.state.doc.lines
        //const cursorPos = update.state.selection.main.head;
        //const cursorLine = update.state.doc.lineAt(cursorPos).number - 1; // 0-indexed
        
        /**
        console.log("current position of cursorLine", cursorLine)
        console.log("the current length of the cell!", checker);
        
        console.log("The update object", update.selectionSet)  */
        
        //const editedSnippets : Snippet[] = []
        
        /**
        for (const snippet of snippetsManager.snippetTracker){
          const from = update.view.state.doc.line(snippet.start_line + 1).from;
          const to = update.view.state.doc.line(snippet.end_line + 1).to;
          if (changes.touchesRange(from, to) || changes.touchesRange(from, to) == "cover") {
            editedSnippets.push(snippet)
            console.log("Edited snippets updated!", snippet);
            console.log(changes.touchesRange(1,2))
          } 
        }    */
        //console.log(notebookTracker)

        // this is always called
        if (update.docChanged || update.transactions.length > 0) {
          snippetsManager.update(update.view, update);
          this.decorations = snippetsManager.assignDecorations(update.view);
        }
      }
    },
    {
      // Allow the plugin to provide decorations
      decorations: v => v.decorations
    }
  );
  
  return [viewPlugin];
}