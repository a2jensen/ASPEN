/* eslint-disable curly */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
import { Extension, RangeSetBuilder } from '@codemirror/state';
import { Decoration } from '@codemirror/view'
import {
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { Snippet } from './types'
import { SnippetsManager } from './snippetManager';
import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook"
import { Synchronization } from './Synchronization';


// Create a global flag to track if the event listener has been registered
let saveSnippetListenerRegistered = false;
let currentView: EditorView | null = null;
let notebookPanel : NotebookPanel | null;
let notebookId : string 
let cellId : string | undefined;
//let highlightedRanges: { from: number; to: number }[] = [];


/**
 * 
 * This serves as the main entry point for integrating CodeMirror into the ASPEN extension.
 * This plugin integrates the SnippetsManager Class with CodeMirror's view system, evidenced by the function taking in a SnippetsManager prop.
 * It is in charge of handling editor events, and applying/updating decorations to snippet instances when the view updates appropriately.
 * 
 * @param snippetsManager 
 * @returns ViewPluginExtension. Create a plugin for a class whose constructor takes a single editor view as argument.
 */


export function CodeMirrorExtension(synchronizationManager : Synchronization , snippetsManager: SnippetsManager, notebookTracker : INotebookTracker): Extension {
 
  notebookTracker.currentChanged.connect(() => {
    console.log("Inside notebooktracker within CodeMirrorExtension!!!")

    notebookPanel = notebookTracker.currentWidget;
    if (!notebookPanel) {
      console.log("no notebook opened yet...")
      return
    }

    const notebook = notebookPanel.content;
    notebookId = notebookPanel.context.path;
    let cell = notebook.activeCell;
    if (cell){
      console.log("DETECTEDDDDD the active cell, here is the ID ", cell.model.id);
      console.log(cellId)
      cellId = cell.model.id
    } else {
      console.log("Id is undefined")
    }
    

    notebook.activeCellChanged.connect(() => {
      // cellIndex = notebook.activeCellIndex;
      cellId = notebook.activeCell?.model.id
      console.log("Active cell changed: ", cellId);
    })

    console.log("notebookId:", notebookId);
    console.log("cellIndex:", cellId);
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
        
        cellId = notebookPanel?.content.activeCell?.id ?? cellId;
        if (cellId == null || notebookId === null){
          console.log("failing to create snippet, invalid notebookId and / or cell index")
          console.log("Notebook ID, should be null :", notebookId)
          console.log("cell index, should be null : ", cellId)
          return;
        }
        snippetsManager.create(currentView!, startLine, endLine, templateId, droppedText, notebookId, cellId);

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
          cellId = notebookPanel?.content.activeCell?.model.id ?? cellId;
          if (cellId == null || notebookId === null){
            console.log("failing to create snippet, invalid notebookId and / or cell index")
            console.log("Notebook ID, should be null :", notebookId)
            console.log("cell index, should be null : ", cellId)
            return;
          }
          
          snippetsManager.create(currentView!, startLine, endLine, templateId, droppedText, notebookId, cellId);
      
          

  

          setTimeout(() => {
            snippetsManager.update(view);
            this.decorations = snippetsManager.assignDecorations(view);
          }, 1000); // A small delay to ensure updates are applied after the text is dropped
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
        let builder = new RangeSetBuilder<Decoration>()

        // Update the stored view instance
        this.view = update.view;
        // Update the current view reference
        currentView = update.view;
        snippetsManager.cellMap

        if (update.docChanged || update.transactions.length > 0){
          snippetsManager.update(update.view, update);
        }

        const borderDeco = snippetsManager.assignDecorations(update.view);
        borderDeco.between(0, this.view.state.doc.length, (from, to, decoration) => {
          builder.add(from, to, decoration);
        });

        //const changes = update.changes
        const checker = update.view.state.doc.lines
        const cursorPos = update.state.selection.main.head;
        const cursorLine = update.state.doc.lineAt(cursorPos).number; //
        
       
        console.log("current position of cursorLine", cursorLine)
        console.log("the current length of the cell!", checker);
        console.log("The update object", update.selectionSet)  

        const editorViewId = snippetsManager.cellMap.get(currentView)
        const editedSnippets : Snippet[] = snippetsManager.snippetTracker.filter(snip => snip.cell_id === editorViewId)
        console.log("FILTERED SNIPPETS -> ONES THAT ARE CURRENTLY IN THE CELL! ", editedSnippets)

        for (const snippet of editedSnippets){
          if (cursorLine >= snippet.start_line && cursorLine <= snippet.end_line){
            console.log("CURSOR / UPDATE HAS BEEN DONE WITHIN AN INSTANCE!!!!")
            // call the JS Diff function here
            // test first if you can highlight at a character level
            const doc = update.state.doc;

            /**
             * ranges are at a character level
             * fromA -> toA range of the changes in old doc
             * fromB -> toB range of the new doc - range of the new changes in new doc
             * inserted: text that gets added in the new range of fromB -> toB
             */
            update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
              const startLine = doc.lineAt(fromB)
              const lineNumber = startLine.number; // used to + 1
              const lineOffset = startLine.from;

              const charStart = fromB - lineOffset;
              const charEnd = charStart + inserted.length

              const insertedText = inserted.toString();
              const deletedText = doc.sliceString(fromA, toA);

              const fromPos = doc.line(snippet.start_line).from;
              const toPos = doc.line(snippet.end_line).to;
              const updatedContent = doc.sliceString(fromPos, toPos);

              // i dont think we need to worry about this case
              /** 
              if(deletedText.length > 0){
                updatedContent = snippet.content(:) + snippet.content()
              }
              */
              if (lineNumber >= snippet.start_line && lineNumber <= snippet.end_line) {
                console.log(`🟡 Snippet: ${snippet.id}`);
                console.log(`  📍 Line: ${lineNumber}`);
                console.log(`  ✏️ Char range: [${charStart}:${charEnd}]`);
                console.log(`  ➕ Inserted text: "${insertedText}"`);
                console.log(`  ❌ Deleted text: "${deletedText}"`);

                const relativePosLine = lineNumber - snippet.start_line;
                const charRange = [charStart, charEnd]
                console.log("relative calculations, ", relativePosLine);
                
                // this.highlightedRanges.push({ from: fromB, to: toB });
                console.log("updated content", updatedContent);
                if(update.selectionSet){
                  synchronizationManager.diffs(snippet.template_id, relativePosLine, charRange, updatedContent, insertedText)
                }
               
                // Optional: store this edit somewhere
                // snippet.changes.push({ lineNumber, charStart, insertedText });
              }
            });
          }
        }
        this.decorations = builder.finish();
      }
    },
    {
      // Allow the plugin to provide decorations
      decorations: v => v.decorations
    }
  );
  
  return [viewPlugin];
}