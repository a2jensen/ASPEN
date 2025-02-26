/* eslint-disable curly */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Extension, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';


/**TODO: 
 * Find a way to store the snippets so that when I reload it wont disappear
 * Delete snippets? How will that work? */

//if we copy and paste a snippet how  it know
//Organize it better

interface ISnippet {
  cell_id: number;
  start_line: number;
  end_line: number;
  //template_id: number;//what template it is connected to
}

class SnippetsManager {
  //need cell id, find a different way to get id
  private cellCounter = 0;
  private snippetTracker: ISnippet[] = [];
  private cellMap: Map<EditorView, number> = new Map()


  assignCellID(view: EditorView) {
    if (!this.cellMap.has(view)) {
      this.cellCounter++;
      this.cellMap.set(view, this.cellCounter);
    }
    return this.cellMap.get(view) ?? 0;
  }

  
  createSnippet(view: EditorView,startLine: number,endLine: number ) {
    const cellID = this.assignCellID(view);

    this.snippetTracker.push({
        cell_id: cellID,
        start_line: startLine,
        end_line: endLine, 
        //template_id : template_id
      });
    console.log('Snippet added:', this.snippetTracker);
  }





  /**
   * Purpose Update line number (tracking)
   *  
   * Issues: Relying on template Start and End (fix it: mentioned during meeting that the editor knows where something is deleted or added?)
   * Need to add a cell ID in order to update the correct line numbers b/c wont work if new cell is made
   */


  updateSnippetLineNumbers(view: EditorView, update?: ViewUpdate) {
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
        }
      });
    
      console.log("Updated snippet tracker:", this.snippetTracker);
    }




  /**
   * Purpose: Assigns the color to border based on start and end line
   *
   * Potential Addition: Different border colors depending on the template the snippets are connected to.
   * Colors for dark mode and light mode styling.
   */
  
  getOrAssignColor(view: EditorView): DecorationSet {
    const cellID = this.cellMap.get(view);
    if (!cellID) return Decoration.none;

    const builder = new RangeSetBuilder<Decoration>();

    const snippetsInCell = this.snippetTracker
    .filter(s => s.cell_id === cellID)
    .sort((a, b) => a.start_line - b.start_line);

    //this.snippetTracker.sort((a, b) => a.start_line - b.start_line);
    //goes through the snippetTracker and checks startline/endline for each
    for (const snippet of snippetsInCell) {
      const startLine = view.state.doc.line(snippet.start_line);
      const endLine = view.state.doc.line(snippet.end_line);

      // Apply borders to snippet start & end, currently at pink can change later
      builder.add(startLine.from, startLine.from, Decoration.line({
          attributes: {
            style: `border-top: 2px solid #FFC0CB; border-left: 2px solid #FFC0CB; border-right: 2px solid #FFC0CB;`
          }
        })
      );

      builder.add(endLine.from, endLine.from, Decoration.line({
          attributes: {
            style: `border-bottom: 2px solid #FFC0CB; border-left: 2px solid #FFC0CB; border-right: 2px solid #FFC0CB;`
          }
        })
      );
    }

    return builder.finish();
  }

}

const snippetsManager = new SnippetsManager();

const updateCellBackground = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      //implements the decoration
      this.decorations = snippetsManager.AssignColor(view);
      
      /**
       * On drop, will detect if templates are being dropped in
       */
      view.dom.addEventListener('drop', event => {
        event.preventDefault();

        const clipboard = event.dataTransfer?.getData('application/json');
        const droppedText = event.dataTransfer?.getData('text/plain');
        console.log("dropped text app/json", clipboard);
        console.log("dropped text text/plain", droppedText);

        if (!clipboard) return;
        if (!droppedText) return;
        
        const parsedText = JSON.parse(clipboard);

        if(!(parsedText.marker === "aspen-template")) return; 

        const selection = view.state.selection.main;
        const dropPos = selection.from;
        const startLine = view.state.doc.lineAt(dropPos).number;
        console.log("Start line", startLine);
        const endLine = startLine + droppedText.split('\n').length - 1;
        console.log("End line,", endLine);
        const tempId = 0; // NEEDS TO GET FIXED;;;

        snippetsManager.createSnippet(view, startLine, endLine);

        setTimeout(() => {
          snippetsManager.updateSnippetLineNumbers(view);
          this.decorations = snippetsManager.getOrAssignColor(view);
        }, 10); //a delay to ensure updates are applied after the text is dropped
      });

      /**Do:
       * Implement the ability to create a snippet using paste (restrictions on what is supposed to be made a snippet when pasted,
       * such as length what is minimum? Is Paste an option we are having for snippets?)
       * Implement the ability to create a snippet when 'save code snippet' is selected over code
       */
    }

    /**
     * 
     * @param update 
     * if any changes made to the doc it will update the snippet tracking and decor
     * it knows when things are being typed so therefore it knows the editor just find out in which line it is being typed and increment or add it!
     */
    update(update: ViewUpdate) {
      if (update.docChanged) {
          snippetsManager.updateSnippetLineNumbers(update.view, update);
          this.decorations = snippetsManager.getOrAssignColor(update.view);
    
      }
    }
  },
  {
    decorations: v => v.decorations
  }
);

//Makes sure that both features load together
export function combinedExtension(): Extension {
  return [updateCellBackground ]; 
}
