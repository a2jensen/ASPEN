/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */

import { Extension, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';
import { textBoxExtension } from './textBox';

/**TODO: Change file name!!!
 * Find a way to store the snippets so that when I reload it wont disappear
 * Delete snippets? How will that work? */

interface ISnippet {
  id: number;
  start_line: number;
  end_line: number;
  //template: number;//what template it is connected to
}

//need cell id, find a different way to get id
let lastSnippetId = 0;
const snippetTracker: ISnippet[] = [];

function createSnippet( view: EditorView, startLine:number, endLine:number, content: string){
    lastSnippetId++; 
    snippetTracker.push({id:lastSnippetId, start_line: startLine, end_line: endLine});
    console.log("Snippet added:", snippetTracker);   
}

/**
 * Purpose Update line number (tracking)
 *
 * Issues: Relying on template Start and End (fix it: mentioned during meeting that the editor knows where something is deleted or added?)
 * Need to add a cell ID in order to update the correct line numbers b/c wont work if new cell is made 
 */
function updateSnippetLineNumber(view: EditorView) {
    //views the entire document and looks for start and end
    const docText = view.state.doc.toString();
    const snippetPattern = /#template start([\s\S]*?)#template end/g;
    let match;
    let snippetIndex = 0; 

    //looks for the template start and end and if in tracker
    while ((match = snippetPattern.exec(docText)) !== null && snippetIndex < snippetTracker.length) {
        const startPos = match.index;
        const endPos = startPos + match[0].length;

        const newStartLine = view.state.doc.lineAt(startPos).number;
        const newEndLine = view.state.doc.lineAt(endPos).number;
    //finds the new start and end by looking at where start and end template ^^

    // Update only if line numbers have changed
        if (snippetTracker[snippetIndex].start_line !== newStartLine || snippetTracker[snippetIndex].end_line !== newEndLine
        ) {
            snippetTracker[snippetIndex].start_line = newStartLine;
            snippetTracker[snippetIndex].end_line = newEndLine;

            console.log("Snippet update:", snippetTracker);
        }

        snippetIndex++; // Move to next tracked snippet
    }
}

/**
 * Purpose: Assigns the color to border based on start and end line
 *
 * Potential Addition: Different border colors depending on the template the snippets are connected to.
 * Colors for dark mode and light mode styling.
*/
function getOrAssignColor(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    //goes through the snippetTracker and checks startline/endline for each
    for (const snippet of snippetTracker) {
        const startLine = view.state.doc.line(snippet.start_line);
        const endLine = view.state.doc.line(snippet.end_line);

        // Apply borders to snippet start & end, currently at pink can change later
        builder.add(startLine.from, startLine.from, Decoration.line({
            attributes: { style: `border-top: 2px solid #FFC0CB; border-left: 2px solid #FFC0CB; border-right: 2px solid #FFC0CB;` }
        }));

        builder.add(endLine.from, endLine.from, Decoration.line({
            attributes: { style: `border-bottom: 2px solid #FFC0CB; border-left: 2px solid #FFC0CB; border-right: 2px solid #FFC0CB;` }
        }));
    }

    return builder.finish();
}


const updateCellBackground = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
            //implements the decoration
            this.decorations = getOrAssignColor(view);
            //if drop then it will collect the content from the template
            view.dom.addEventListener("drop", (event) => {
                event.preventDefault() 
    
                const droppedText = event.dataTransfer?.getData("text/plain");
                if (!droppedText) {return;}

                //finds where the text was dropped in the editor
                const selection = view.state.selection.main;
                const dropPos = selection.from; 
                const startLine = view.state.doc.lineAt(dropPos).number;
                const endLine = startLine + droppedText.split("\n").length - 1;

                createSnippet(view, startLine, endLine, droppedText);
               
                setTimeout(() => {
                    updateSnippetLineNumber(view);
                    this.decorations = getOrAssignColor(view);
                }, 10); //a delay to ensure updates are applied after the text is dropped
            })
            
            /**Do:
             * Implement the ability to create a snippet using paste (restrictions on what is supposed to be made a snippet when pasted, 
             * such as length what is minimum? Is Paste an option we are having for snippets?)
             * Implement the ability to create a snippet when 'save code snippet' is selected over code
             */
    
        }
        update(update: ViewUpdate) {
            //if any changes made to the doc it will update the snippet tracking and decor
            if (update.docChanged) {
                updateSnippetLineNumber(update.view)
                this.decorations = getOrAssignColor(update.view);
            }
        }
    },
  {
    decorations: (v) => v.decorations
  }
);

//Makes sure that both features load together
export function combinedExtension(): Extension {
  return [updateCellBackground, textBoxExtension()]; //TextBoxExtension is in here but not needed for now will get rid of probably
}
