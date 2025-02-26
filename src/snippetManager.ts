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
  id: number;
  start_line: number;
  end_line: number;
  //template: number;//what template it is connected to
}

class SnippetsManager {
  //need cell id, find a different way to get id
  private lastSnippetId = 0;
  private snippetTracker: ISnippet[] = [];

  createSnippet(view: EditorView,startLine: number,endLine: number ) {
    this.lastSnippetId++;
    this.snippetTracker.push({id: this.lastSnippetId,start_line: startLine,end_line: endLine });
    console.log('Snippet added:', this.snippetTracker);
  }

  /**
   * Purpose Update line number (tracking)
   *
   * #template start
    #issue when i delete at bottom line i dont want it to move, the end line,
    #Issue with delete if i delete above it moves the line do not want that,
    #Get rid of the border and focus on line numbers for now

    

   * Issues: Relying on template Start and End (fix it: mentioned during meeting that the editor knows where something is deleted or added?)
   * Need to add a cell ID in order to update the correct line numbers b/c wont work if new cell is made
   */

  updateSnippetLineNumber(view: EditorView, update?: ViewUpdate) {
      const totalLines = view.state.doc.lines;
      this.snippetTracker.sort((a, b) => a.start_line - b.start_line);
  
      if (!update) {
        //try t figure out what this does
          for (const snippet of this.snippetTracker) {
              if (snippet.start_line < 1 || snippet.start_line > totalLines || snippet.end_line > totalLines) {
                  console.warn(`Skipping snippet ${snippet.id}: Invalid line range (${snippet.start_line}-${snippet.end_line})`);
                  continue;
              }
              // Track current snippet positions
              const startPos = view.state.doc.line(snippet.start_line).from;
              const endPos = view.state.doc.line(snippet.end_line).to;
  
              snippet.start_line = view.state.doc.lineAt(startPos).number;
              snippet.end_line = view.state.doc.lineAt(endPos).number;
          }
  
          console.log("Snippet tracker updated (Drop Event):", this.snippetTracker);
  
          setTimeout(() => {
              this.getOrAssignColor(view);
          }, 10);
  
          return;
      }
  
      console.log("Checking for changes in the document...");
  
      update.changes.iterChanges((fromA, toA, fromB, toB) => {
          const doc = view.state.doc;
  
          const removedText = doc.sliceString(fromA, toA);
          const insertedText = doc.sliceString(fromB, toB);
  
          const removedLines = removedText.split("\n");
          const insertedLines = insertedText.split("\n");
  
          // Correct how we count full line insertions and deletions
          const removedFullLines = removedText.includes("\n") ? removedLines.length - 1 : 0;
          const insertedFullLines = insertedText.includes("\n") ? insertedLines.length - 1 : 0;
  
          let netLineChange = insertedFullLines - removedFullLines;
  
          //not workingg
          if (removedText.length > 0 && !removedText.includes("\n") && insertedText.length === 0) {
            // If a single character or part of a line is deleted, do NOT change netLineChange
            netLineChange = 0;
        }
          // Ensure we are not shifting lines unnecessarily for small text edits
          //issue here if i do a new line inside the content it considers it this but i should be considered a new line so wrong
          if (netLineChange === 0) {
              console.log("Skipping minor text change (no full line change detected).");
              return;
          }
  
          const startLineB = doc.lineAt(fromB).number;
          const endLineB = doc.lineAt(toB).number;
  
          console.log(`Change detected: Start ${startLineB}, End ${endLineB}, Net Line Change: ${netLineChange}`);
  
          this.snippetTracker.sort((a, b) => a.start_line - b.start_line);
  
          for (const snippet of this.snippetTracker) {
            //this is giving me issue i think if i delete a lot 
              if (snippet.start_line > totalLines || snippet.end_line > totalLines) {
                  console.warn(`Skipping snippet ${snippet.id}: Out of bounds after edit`);
                  continue;
              }
  
              // Adjust snippet if Enter was pressed inside
              //not wokring because enter is being considered as 0 so wont do nothing
              if (startLineB >= snippet.start_line && startLineB <= snippet.end_line) {
                  snippet.end_line += netLineChange;
              }
  
              // Adjust snippets positioned below the change
              if (netLineChange > 0) {
                  if (snippet.start_line > startLineB) {
                      snippet.start_line += netLineChange;
                      snippet.end_line += netLineChange;
                  }
                  //if things have been deleted, this  is wromg 
              } else if (netLineChange < 0) {
                  if (startLineB < snippet.start_line) {
                      snippet.start_line = snippet.start_line + netLineChange;
                      snippet.end_line = snippet.end_line + netLineChange;
                  }
              }
          }
      });
  
      console.log("Snippet tracker updated:", this.snippetTracker);
  }


  /**
   * Purpose: Assigns the color to border based on start and end line
   *
   * Potential Addition: Different border colors depending on the template the snippets are connected to.
   * Colors for dark mode and light mode styling.
   */
  
  getOrAssignColor(view: EditorView): DecorationSet {
    this.snippetTracker.sort((a, b) => a.start_line - b.start_line);

    const builder = new RangeSetBuilder<Decoration>();
    //goes through the snippetTracker and checks startline/endline for each
    for (const snippet of this.snippetTracker) {
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
      this.decorations = snippetsManager.getOrAssignColor(view);
      //if drop then it will collect the content from the template
      view.dom.addEventListener('drop', event => {
        event.preventDefault();

        const droppedText = event.dataTransfer?.getData('text/plain');
        if (!droppedText) {
          return;
        }

        //finds where the text was dropped in the editor
        const selection = view.state.selection.main;
        const dropPos = selection.from;
        const startLine = view.state.doc.lineAt(dropPos).number;
        const endLine = startLine + droppedText.split('\n').length - 1;

        snippetsManager.createSnippet(view, startLine, endLine);

        setTimeout(() => {
          snippetsManager.updateSnippetLineNumber(view);
          this.decorations = snippetsManager.getOrAssignColor(view);
        }, 10); //a delay to ensure updates are applied after the text is dropped
      });

      /**Do:
       * Implement the ability to create a snippet using paste (restrictions on what is supposed to be made a snippet when pasted,
       * such as length what is minimum? Is Paste an option we are having for snippets?)
       * Implement the ability to create a snippet when 'save code snippet' is selected over code
       */
    }
    update(update: ViewUpdate) {
      //if any changes made to the doc it will update the snippet tracking and decor
      //it knows when things are being typed so therefore it knows the editor just find out in which line it is being typed and increment or add it!
      if (update.docChanged) {
        snippetsManager.updateSnippetLineNumber(update.view, update);
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
  return [updateCellBackground]; 
}
