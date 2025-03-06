import { RangeSetBuilder } from '@codemirror/state';
import { ContentsManager } from "@jupyterlab/services";
import { TemplatesManager } from './TemplatesManager';
import { Snippet } from "./types";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewUpdate
} from '@codemirror/view';

/**
 * TODO Implementation Tasks:
 * 1. Implement persistent storage for snippets so they persist on reload/across sessions
 * 2. Handle edge cases - if i delete an entire snippet instance the colored borders still persist.
 */

/**
 * SnippetsManager Class
 * 
 * Responsible for managing snippet instances within the editor.
 * This class handles the creation, tracking, updating, and visualization of snippets.
 * It maintains the connection between snippet/template instances in the editor and their templates.
 */
export class SnippetsManager {
  /** Counter for generating unique cell IDs */
  private cellCounter = 0;
  
  /** Array to keep track of all active snippets */
  private snippetTracker: Snippet[] = [];
  
  /** Map to associate editor views with their unique cell IDs */
  private cellMap: Map<EditorView, number> = new Map()
  
  private templatesManager : TemplatesManager;

  //private contentsManager : ContentsManager;

  /**
   * Initializes a new instance of the SnippetsManager
   */
  constructor( contentsManager : ContentsManager , templates : TemplatesManager){
    this.templatesManager = templates;
    //this.contentsManager = contentsManager;
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
      const oldTotalLines = oldDoc.lines;
      const newTotalLines = newDoc.lines;
      const lineDifference = newTotalLines - oldTotalLines; // Positive = lines added, Negative = lines removed
      console.log(`Line count changed: Old Total ${oldTotalLines}, New Total ${newTotalLines}, Line difference: ${lineDifference}`);

      update.changes.iterChanges((fromA, toA, fromB, toB, insertedText) => {
        const insertedLines = insertedText.toString().split("\n").length - 1;
        const removedLines = oldDoc.lineAt(toA).number - oldDoc.lineAt(fromA).number;
    
        for (const snippet of this.snippetTracker) {
          let { start_line, end_line } = snippet;
          if (snippet.cell_id !== cellID) continue; 
          //  Case 1: Text inserted **before** the snippet → shift it down
          if (fromA < oldDoc.line(start_line).from) {
            start_line += insertedLines - removedLines;
            end_line += insertedLines - removedLines;
          }
          // Case 2: Text inserted **inside** the snippet → expand snippet range
          else if (fromA >= oldDoc.line(start_line).from && toA <= oldDoc.line(end_line).to) {
            end_line += insertedLines - removedLines;
          }
    
          //  Prevent out-of-bounds issues
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
    console.log("INSIDE ASSIGN DECORATIONS FUNCTION!")
    const cellID = this.cellMap.get(view);
    if (!cellID) return Decoration.none;

    const builder = new RangeSetBuilder<Decoration>();
    const button = document.createElement("button");
    button.innerHTML = `BUTTON`;
    button.className = "snippet-instance-button";
    button.title = "Propagate changes"

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
