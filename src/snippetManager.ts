/* eslint-disable eqeqeq */
/* eslint-disable curly */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
import { Extension, RangeSetBuilder } from '@codemirror/state';
//import { Button } from "./Button";
import { TemplatesManager } from './TemplatesManager';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';


/**TODO: 
 * Find a way to store the snippets so that when I reload it wont disappear
 * Delete snippets? How will that work? 
 * Add a space each time i drop something and only track the before and after of that line.
 * Should I let them know it will cause issues if they delete the line? or should I make it so ur unable to delete this line
 * */

/**
 * Snippet Interface
 * 
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
interface Snippet {
  /** Unique identifier for the cell containing this snippet */
  cell_id: number;
  
  /** content of the snippet */
  content : string;
  
  /** The starting line number in the editor */
  start_line: number;
  
  /** The ending line number in the editor */
  end_line: number;
  
  /** Reference to the associated template ID */
  template_id: string;
}

/**
 * SnippetsManager Class
 * 
 * Responsible for managing snippet instances within the editor.
 * This class handles the creation, tracking, updating, and visualization of snippets.
 * It maintains the connection between snippet/template instances in the editor and their templates.
 */
class SnippetsManager {
  /** Counter for generating unique cell IDs */
  private cellCounter = 0;
  
  /** Array to keep track of all active snippets */
  private snippetTracker: Snippet[] = [];
  
  /** Map to associate editor views with their unique cell IDs */
  private cellMap: Map<EditorView, number> = new Map()
  
  private templatesManager : TemplatesManager;

  /**
   * Initializes a new instance of the SnippetsManager
   */
  constructor( templates : TemplatesManager ){
    this.templatesManager = templates;
  }


  /**
   * Assigns a unique cell ID to an editor view
   * 
   * @param view - The editor view to assign an ID to
   * @returns The assigned cell ID
   * 
   * If the view already has an ID, returns the existing ID.
   * Otherwise, increments the counter and assigns a new ID.
   */
  assignCellID(view: EditorView) {
    if (!this.cellMap.has(view)) {
      this.cellCounter++;
      this.cellMap.set(view, this.cellCounter);
    }
    return this.cellMap.get(view) ?? 0;
  }

  /**
   * Creates a new snippet instance in the editor
   * 
   * @param view - The editor view where the snippet is being created
   * @param startLine - The starting line number of the snippet
   * @param endLine - The ending line number of the snippet
   * @param templateID - The ID of the template this snippet is based on
   * @param content - The code content of the snippet
   * 
   * Method is called when a template is dropped or pasted into the editor.
   * It creates a new Snippet object and adds it to the snippetTracker.
   */
  createSnippetInstance(view: EditorView, startLine: number, endLine: number, templateID: string, content: string) {
    const cellID = this.assignCellID(view);
    const snippet = {
      cell_id: cellID, 
      content: content,
      start_line: startLine,
      end_line: endLine,
      template_id: templateID
    }
    console.log("Snippet object being created: ", snippet);
    this.snippetTracker.push(snippet);
  }

  /**
   * Updates snippet line positions after editor changes
   * 
   * @param view - The editor view being updated
   * @param update - The ViewUpdate object containing information about the changes
   * 
   * This method adjusts the start and end line numbers of snippets when:
   * - Text is inserted or deleted before a snippet (shifts the snippet)
   * - Text is inserted or deleted within a snippet (expands or contracts the snippet)
   * 
   * Known issues:
   * - Relies on template start and end positions which may not be accurate
   * - Requires cell ID to update the correct line numbers when multiple cells exist
   * 
   * TODO: Update the content of the snippets as well, not just their positions
   */
  updateSnippetInstance(view: EditorView, update?: ViewUpdate) {
      if (!update) return;
      const cellID = this.cellMap.get(view);
      if (!cellID) return;
  
      const oldDoc = update.startState.doc; // Previous document state
      const newDoc = update.state.doc;      // Updated document state
      const newTotalLines = newDoc.lines; //total of line after changes
      

      //from A and to A are the new things that were added, so we checking it with old doc to see what was inserted and what was not
      update.changes.iterChanges((fromA, toA, fromB, toB, insertedText) => {
        const insertedLines = insertedText.toString().split("\n").length - 1; //how many new line inerted
        const removedLines = oldDoc.lineAt(toA).number - oldDoc.lineAt(fromA).number; //how many liines removed
    
        for (const snippet of this.snippetTracker) {
          let { start_line, end_line } = snippet;
          if (snippet.cell_id !== cellID) continue; 
          //  Text inserted
          if (fromA < oldDoc.line(start_line).from) {
            start_line += insertedLines - removedLines;
            end_line += insertedLines - removedLines;
          }
          //Text inserted inside the snippet → expand snippet range
          else if (fromA >= oldDoc.line(start_line).from && toA <= oldDoc.line(end_line).to) {
            end_line += insertedLines - removedLines;
          }
    
          //Prevent out-of-bounds issues
          start_line = Math.max(1, Math.min(start_line, newTotalLines));
          end_line = Math.max(start_line, Math.min(end_line, newTotalLines));
    
          snippet.start_line = start_line;
          snippet.end_line = end_line;

          //TODO: Update contents of the snippets as well, not just their position
          const startPos = newDoc.line(start_line).from;
          const endPos = newDoc.line(end_line).to;
          const updatedSnippet = newDoc.sliceString(startPos, endPos);
          console.log("Snippet OLD", snippet.content);
          console.log("Snippet NEW", updatedSnippet);
          snippet.content = updatedSnippet;

          console.log("Updated Snippet content", {
            snippet_id : snippet.template_id,
            start_line,
            end_line,
            contentLength : updatedSnippet.length
          })
        }
      });
      console.log("Updated snippet tracker:", this.snippetTracker);
    }

  /**
   * Creates decorations to visually highlight snippets in the editor
   * 
   * @param view - The editor view to apply decorations to
   * @returns A DecorationSet containing all the visual decorations for snippets
   * 
   * This method creates border decorations around snippets to visually distinguish them
   * in the editor. It applies borders to the start and end lines of each snippet.
   * It also applies a button to the 
   * 
   * Potential enhancements:
   * - Use different border colors based on the template type
   * - Implement different color schemes for dark and light editor modes
   * 
   * MAY BE USEFUL : https://codemirror.net/examples/gutter/
   */
  AssignDecorations(view: EditorView): DecorationSet {
    const cellID = this.cellMap.get(view);
    if (!cellID) return Decoration.none;

    const builder = new RangeSetBuilder<Decoration>();
    const button = document.createElement("button");
    button.innerHTML = `BUTTON`;
    button.className = "snippet-instance-button";
    button.title = "Propagate changes"

    //organizes it in order otherwise program will crash
    const snippetsInCell = this.snippetTracker
    .filter(s => s.cell_id === cellID)
    .sort((a, b) => a.start_line - b.start_line);

    //this.snippetTracker.sort((a, b) => a.start_line - b.start_line);
    //goes through the snippetTracker and checks startline/endline for each
    for (const snippet of snippetsInCell) {
      const startLine = view.state.doc.line(snippet.start_line);
      const endLine = view.state.doc.line(snippet.end_line);
      
      /** Reposition the button */
      button.style.position = "absolute";
      button.style.right = "5px";
      button.style.right = "2px";

      // Remove empty snippets (where start line equals end line)
      if (startLine == endLine) {
        continue;
      }

      // Apply borders to snippet start & end, currently using pink (#FFC0CB)
      builder.add(startLine.from, startLine.from, Decoration.line({
          attributes: { 
            style: `border-top: 2px solid #FFC0CB; border-left: 2px solid #FFC0CB; border-right: 2px solid #FFC0CB;`,
            class: 'snippet-start-line'
           },
        })
      );
    
      builder.add(endLine.from, endLine.from, Decoration.line({
          attributes: { 
            style: `border-bottom: 2px solid #FFC0CB; border-left: 2px solid #FFC0CB; border-right: 2px solid #FFC0CB;`,
            class : 'snippet-end-line'
          },
        })
      );
    }
    
    /** CODE THAT ADDS IN A PUSH BUTTON! */

    /** ADDS IN A MARKER
    console.log("About to run set timeout....")
    setTimeout(() => {
      console.log("Trying to find the snippet lines...")
      const startLines = view.dom.querySelectorAll(`.snippet-start-line`);
      console.log("Start lines found : ", startLines)

      startLines.forEach(line => {
        if (line.querySelector('.snippet-button')) return;

        const button = document.createElement('button');
        button.className = 'snippet-button';
        button.innerHTML = '↑';
        button.title = 'Update template';
        button.style.position = 'absolute';
        button.style.right = '10px';
        button.style.top = '2px';

        button.addEventListener('click', () => {
          console.log("Button clicked");
          // logic for pushing up ot template
        })

        line.appendChild(button);
      })
    }, 2000) */ // timeout to ensure DOM is ready
    return builder.finish();
  }

  /**
   * Loads snippets from persistent storage
   * 
   * This method is intended to restore snippets when the editor is reopened.
   * 
   * TODO: Implement this method to load saved snippets from storage
   */
  loadSnippets() {
    // TODO: Implementation needed
    // 1. Load snippets from JSON files 
    // 2. Recreate snippet objects
    // 3. Update snippet tracker array
  }

  /**
   * Propagates changes from snippet instances to their templates
   */
  pushSnippetInstanceChanges(snippet : Snippet ) {
    // 1. Get the content of the specific snippet as well as the snippet ID
    const snippetContent = snippet.content;
    const templateId = snippet.template_id;
    
    this.templatesManager.propagateChanges(snippetContent, templateId);
  }
}

// Create an instance of the SnippetsManager
const snippetsManager = new SnippetsManager(new TemplatesManager());

/**
 * CodeMirror ViewPlugin for Snippet Management
 * 
 * This plugin integrates the SnippetsManager Class with CodeMirror's view system.
 * It is in charge of handling editor events, and applying/updating decorations when the view updates.
 */
const ViewPluginExtension = ViewPlugin.fromClass(
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
    constructor(view: EditorView) {
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
       
        const templateId = parsedText.templateID;
        console.log("The template id associated with the instance", templateId);
        snippetsManager.createSnippetInstance(view, startLine, endLine, templateId, droppedText);

        setTimeout(() => {
          snippetsManager.updateSnippetInstance(view);
          this.decorations = snippetsManager.AssignDecorations(view);
        }, 10); // A small delay to ensure updates are applied after the text is pasted
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
        //added a minus 1
        const startLine = view.state.doc.lineAt(dropPos).number;
        
        const endLine = startLine + droppedText.split('\n').length - 1;
        console.log("End line,", endLine);
        const templateID = parsedText.templateID;

        snippetsManager.createSnippetInstance(view, startLine + 1 , endLine - 1, templateID, droppedText);

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
    update(update: ViewUpdate) {
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

/**
 * Exports the CodeMirror extension
 * 
 * @returns An Extension array that can be added to a CodeMirror editor
 * 
 * This is the main entry point for integrating this functionality
 * with a CodeMirror editor instance.
 */
export function CodeMirrorExtension(): Extension {
  return [ViewPluginExtension]; 
}