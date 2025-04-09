/* eslint-disable eqeqeq */
/* eslint-disable curly */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
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
  
  //organizes it in order otherwise program will crash
  const snippetsInCell = this.snippetTracker
  .filter(s => s.cell_id === cellID)
  .sort((a, b) => a.start_line - b.start_line);

  //goes through the snippetTracker and checks startline/endline for each
  for (const snippet of snippetsInCell) {
    const startLine = view.state.doc.line(snippet.start_line);
    const endLine = view.state.doc.line(snippet.end_line);
    
    // Remove empty snippets (where start line equals end line)
    if (startLine == endLine) {
      continue;
    }

    // Apply borders to snippet start & end, currently using pink (#FFC0CB)
    builder.add(startLine.from, startLine.from, Decoration.line({
        attributes: { 
          style: `border-top: 2px solid #FFC0CB; border-left: 2px solid #FFC0CB; border-right: 2px solid #FFC0CB;`,
          class: 'snippet-start-line',
          'data-snippet-id': snippet.cell_id.toString(), // Store snippet ID as data attribute, as well as start and end lines
          'data-start-line': snippet.start_line.toString(),
          'data-end-line': snippet.end_line.toString()
         },
      })
    );
  
    builder.add(endLine.from, endLine.from, Decoration.line({
        attributes: { 
          style: `border-bottom: 2px solid #FFC0CB; border-left: 2px solid #FFC0CB; border-right: 2px solid #FFC0CB;`,
          class: 'snippet-end-line',
          'data-snippet-id': snippet.cell_id.toString() // Store snippet ID as data attribute
        },
      })
    );
  }
  /**
  console.log("Trying to find the snippet lines...");
  const startLines = view.dom.querySelectorAll(`.snippet-start-line`);
  console.log("Start lines found : ", startLines);

  startLines.forEach(line => {
    //if (line.querySelector('.snippet-button')) return;

    // Get the snippet metadata from data attributes
    const snippetId = line.getAttribute('data-snippet-id');
    const startLineNum = parseInt(line.getAttribute('data-start-line') || '0');
    const endLineNum = parseInt(line.getAttribute('data-end-line') || '0');

    /**
    const button = document.createElement('button');
    button.className = 'snippet-button';
    button.innerHTML = 'PUSH';
    button.title = 'Update template';
    button.style.position = 'absolute';
    button.style.right = '10px';
    button.style.top = '2px';
    button.style.margin = '20px';

    button.addEventListener('click', () => {
      const snippet = this.snippetTracker.find(snippet => snippet.cell_id === Number(snippetId));

      if (snippet) {
        console.log("Button clicked for snippet ID:", snippetId);
        console.log("Valid snippet found after clicking push button: ", snippet)

        // Extract the content of the snippet from the document
        if (startLineNum > 0 && endLineNum > 0) {
          console.log("Going to push the snippet instance changes up to the template!")
          this.pushSnippetInstanceChanges( snippet );
        }
      }
    });

    
    line.appendChild(button);
    console.log("Push button added!")
  });
  */
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
    const snippetContent = snippet.content;
    const templateId = snippet.template_id;
    
    console.log("Calling propagate changes in templates manager");
    this.templatesManager.propagateChanges(snippetContent, templateId);
  }
}
