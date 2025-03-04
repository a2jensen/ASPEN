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
 * Delete snippets? How will that work? 
 * Add a space each time i drop something and only track the before and after of that line.
 * Should I let them know it will cause issues if they delete the line? or should I make it so ur unable to delete this line
 * */

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
  //this assigns the editor to a number
  //this was suggested by GPT cause I couldnt figure out how to do it 
  private cellMap: Map<EditorView, number> = new Map()


  assignCellID(view: EditorView) {
    if (!this.cellMap.has(view)) {
      this.cellCounter++;
      this.cellMap.set(view, this.cellCounter);
    }
    return this.cellMap.get(view) ?? 0;
  }

  removeCell(view: EditorView) {
    if (this.cellMap.has(view)) {
      this.cellMap.delete(view);  // Remove the view from tracking
    }
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
   */
  updateSnippetLineNumbers(view: EditorView, update?: ViewUpdate) {
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

    //organizes it in order otherwise program will crash
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
/**Goal is to add blanks on bottom and top but dont count them as a line so subtract and add 1 to start and end line
 * Add the blank lines to template managers, for drop, and only need to fix it here because that is the initalizer
 *   Should I let them know it will cause issues if they delete the line? or should I make it so ur unable to delete this line
 */
const updateCellBackground = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      //implements the decoration
      this.decorations = snippetsManager.getOrAssignColor(view);
      //if drop then it will collect the content from the template
      view.dom.addEventListener('drop', event => {
        event.preventDefault();

        const droppedText = event.dataTransfer?.getData('text/plain');
        if (!droppedText) {
          return;
        }
        //finds where the text was dropped in the editor
        //the drop text will consist of two empty lines
        const selection = view.state.selection.main;
        const dropPos = selection.from;
        //added a minus 1
        const startLine = view.state.doc.lineAt(dropPos).number;
        
        const endLine = startLine + droppedText.split('\n').length - 1;
      //added two blank lines after and before snippet idk if we wanna make it so u cant delete it?
        snippetsManager.createSnippet(view, startLine + 1, endLine - 1);

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
      /*
      view.dom.addEventListener('paste', event =>{
        //add the start line and end line once passted
        snippetsManager.createSnippet(view, startLine, endLine);
      })
      */
    }
    update(update: ViewUpdate) {
      //if any changes made to the doc it will update the snippet tracking and decor
      //it knows when things are being typed so therefore it knows the editor just find out in which line it is being typed and increment or add it!
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
