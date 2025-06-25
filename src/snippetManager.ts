import { RangeSetBuilder } from '@codemirror/state';
import { ContentsManager } from "@jupyterlab/services";
import { Snippet } from "./types";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewUpdate
} from '@codemirror/view';
import { StateEffect } from '@codemirror/state';
//import { viewBreakpointIcon } from '@jupyterlab/ui-components';
//import { CodeMirrorExtension } from './CodeMirrorPlugin';


/**
 * SnippetsManager Class
 * 
 * Responsible for managing snippet instances within the editor.
 * This class handles the creation, tracking, updating, and visualization of snippets.
 * It maintains the connection between snippet/template instances in the editor and their templates.
 */
export class SnippetsManager {
  public cellCounter; /** Counter for generating unique cell IDs */
  public snippetTracker: Snippet[]; /** Array to keep track of all active snippets */
  public cellMap: Map<EditorView, string>; /** Map editor views with their unique cell IDs */
  //private contentsManager : ContentsManager;
  
  /**
   * Initializes a new instance of the SnippetsManager
   */
  constructor( contentsManager : ContentsManager ){
    this.snippetTracker = [];
    this.cellMap = new Map();
    this.cellCounter = 0;
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
  assignCellID(view: EditorView, cellId : string) {
    console.log("-------inside assignCellId function----------")
    console.log("what was passed in to assignCellId : ", cellId);
    if (!this.cellMap.has(view)) {
      this.cellMap.set(view, cellId);
      console.log("editor not mapped to a cell... adding to data structure")
    }
    console.log("Done with assignCellID ---------")
    console.log("CellMap data structure : ", this.cellMap)
    return this.cellMap.get(view);
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
  create(view: EditorView, startLine: number, endLine: number, templateID: string, content: string, notebookId : string, cellIndex : string) {
    console.log("---------inside snippets create-----------")
    const cellID = this.assignCellID(view, cellIndex);
    const snippet = {
      id: `${Date.now()}`,
      notebook_id : notebookId,
      cell_id: cellID ?? "", 
      content: content,
      start_line: startLine,
      end_line: endLine,
      template_id: templateID
    }
    console.log("Snippet object being created: ", snippet);
    this.snippetTracker.push(snippet);
    console.log("-------exiting the assignCellId function----------")
  }

  /**
   * Updates all snippet line positions after editor changes
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
  update(view: EditorView, update?: ViewUpdate) {
    console.log("-------inside the snippets update function----------")
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
      console.log("-------exiting the update function----------")
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
 */
assignDecorations(view: EditorView): DecorationSet {
  console.log("-------inside the assignDecorations function----------")
  const cellID = this.cellMap.get(view);
  if (cellID === undefined){
    console.log("undefined case reached... cellID is ", cellID)
    return Decoration.none;
  }

  const builder = new RangeSetBuilder<Decoration>();
  
  //organizes it in order otherwise program will crash
  const snippetsInCell = this.snippetTracker
  .filter(s => s.cell_id === cellID)
  .sort((a, b) => a.start_line - b.start_line);

  console.log("All the snippets that are within this cell..", snippetsInCell);

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
          class: 
         'snippet-start-line',
          'data-snippet-id': snippet.cell_id.toString(), // Store snippet ID as data attribute, as well as start and end lines
          'data-start-line': snippet.start_line.toString(),
          'data-end-line': snippet.end_line.toString(),
          'data-associated-template': snippet.template_id.toString()
         },
      })
    );
  
    builder.add(endLine.from, endLine.from, Decoration.line({
        attributes: { 
          style: `border-bottom: 2px solid #FFC0CB; border-left: 2px solid #FFC0CB; border-right: 2px solid #FFC0CB;`,
          class: 
          'snippet-end-line',
          'data-snippet-id': snippet.cell_id.toString() // Store snippet ID as data attribute
        },
      })
    );
  }
  console.log("-------exiting the assignDecorations function----------")
  return builder.finish();
}

  /**
   * Loads snippets from persistent storage
   * 
   * This method is intended to restore snippets when the editor is reopened.
   * 
   * TODO: Implement this method to load saved snippets 
   */
  load() {
    // TODO: Implementation needed
  }


  // Arrow functions automatically bind this to the instance where they were defined.
  editAll = ( templateId : string , templateContent : string ) => {
    console.log("----------inside editAll function---------------")
    // use the cell id and start / end lines to apply changes in the DOM.
    // returns array of snippets
    let snippets : Snippet[] = this.snippetTracker.filter(snippet => snippet.template_id === templateId) // ERROR HERE
    console.log("Found the following snippet instances to update", snippets)

    for (const snippet of snippets){
      if (!snippet) {
        console.log(`Failed to find snippet with ID ${templateId}.`)
        return
      }
  
      // find the editor view ID for the cell
      let targetView : EditorView | undefined;
      for (const [view, cellId] of this.cellMap.entries()) {
        if (cellId === snippet.cell_id) {
          targetView = view;
          break;
        }
      }
  
      if (!targetView) {
        console.log(`Editor view for cell ID ${snippet} not found`)
        return;
      }
      
      const doc = targetView.state.doc;
      const startPos = doc.line(snippet.start_line).from;
      const endPos = doc.line(snippet.end_line).to;
  
      // create transaction to replace the content
      targetView.dispatch({
        changes : {
          from : startPos,
          to: endPos,
          insert : templateContent
        }
      })
  
      snippet.content = templateContent
      console.log(`Updated snippet ${templateId} with the new template content!`)
      console.log("----------exiting the editAll function---------------")
    }
  }

  /***
   * 
   */
  applyHighlights = (templateId : string , relativePosline : number, charRange : number[], insertedText: string ) => {
    console.log("******Within the APPLY HIGHLIGHTS function!******")
    let relatedSnippets : Snippet[] = this.snippetTracker.filter(snippet => snippet.template_id === templateId)

    for (const snippet of relatedSnippets) {
      // find the target view
      let targetView : EditorView | undefined;
      for (const [view, cellId] of this.cellMap.entries()) {
        if (cellId === snippet.cell_id){
          targetView = view;
          break;
        }
      }

      if (!targetView){
        return;
      }

      const doc = targetView.state.doc;
      
      // get the line and chars in the view we want to edit
      const targetLineNumber = snippet.start_line + relativePosline - 1;
      // grabbing the line 
      const targetLine = doc.line(targetLineNumber);
      const absoluteFrom = targetLine.from + charRange[0];
      //const absoluteTo = targetLine.from + charRange[1];
      
      // build decoration
      setTimeout(() => {
        console.log("inside set timeout")

        // 
        targetView?.dispatch({changes : { from : absoluteFrom, to: absoluteFrom + insertedText.length, insert: insertedText}})

        // setting up a new decoration at the specific index range [absoluteFrom, absoluteFrom + 1] (this could be edited as it right now causes wrong behavior)
        // ranges are char level indexes...
        const builder = new RangeSetBuilder<Decoration>();
        builder.add(
          absoluteFrom,
          absoluteFrom + insertedText.length,
          Decoration.mark({
            class : 'highlight-variant-change'
          })
        );

        const decorationSet = builder.finish();
      

        targetView?.dispatch({
          effects: StateEffect.appendConfig.of([
            EditorView.decorations.of(decorationSet)
          ])
        });   
      }, 0);

    }

  }
}