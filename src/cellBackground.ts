/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
// Imports
import { Extension, RangeSetBuilder } from '@codemirror/state'; 
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { textBoxExtension } from './textBox';

//FIX the start and end pos!!!
/**
interface ISnippet {
    id: number;
    start: number;
    end: number;
    color: string;
  }
  
const trackedSnippets: ISnippet[] = [];
*/

//but that tracks the cell it is in not the snippet
//am i tracking snippet or the cell it is in?

// Assign background color to code cell lines
function getOrAssignColor(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();

    const docText = view.state.doc.toString();
    //the start of the template thing will probably change, or idk if we keeping this or if what i was meant to do:o
    const snippetPattern = /#template start([\s\S]*?)#template end/g;
    let match;
    
    while ((match = snippetPattern.exec(docText))) {
        const startPos = match.index!;
        const endPos = match.index! + match[0].length;
        //Get rid of / does not work because it does not account for updated code areas
      /** let existingSnippet = trackedSnippets.find(snippet => snippet.start === startPos && snippet.end === endPos);

        //position wont update if i switch it to diff places
        if (!existingSnippet) {
            const snippetColor = `#ead1dc`;
            const snippetId = Date.now(); 
            existingSnippet = { id: snippetId, start: startPos, end: endPos, color: snippetColor };
            trackedSnippets.push(existingSnippet); 
            console.log("snippet added")
        }*/

        for (let pos = startPos; pos <= endPos;) {
            const line = view.state.doc.lineAt(pos);
            builder.add(line.from, line.from, Decoration.line({
                attributes: { style: `background-color: #ead1dc` }
            }));
            pos = line.to + 1;
        }
    }
    return builder.finish();
}




/**
 * invisible decoration could be used for tracking but idk???
 * function createSnippetMarks(snippets: ISnippet[]): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();

    snippets.forEach((snippet) => {
        builder.add(snippet.from, snippet.to, Decoration.mark({}));
    });

    return builder.finish();
} */

const updateCellBackground = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = getOrAssignColor(view);
            
            //when a template is drag or dropped input it here but it does
            //not matter because it is only highlight when I "paste" or when Cadies code is shown
            /**
            view.dom.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.key === 'v') {
                    this.decorations = getOrAssignColor(view);
                }
            });*/
        }
        update(update: ViewUpdate) {
            //fix this becasue it updates everytime and it adds a snippet everytime even though position might change
            
            if (update.docChanged) {
                this.decorations = getOrAssignColor(update.view);
            }


        }
    },
    {
        decorations: (v) => v.decorations
    }
);


export function applyBackgroundToActiveCell(view: EditorView): Extension {
    return [
        updateCellBackground];
}
export function combinedExtension(): Extension {
    return [updateCellBackground,textBoxExtension()];
}

