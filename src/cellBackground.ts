/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */

import { Extension, RangeSetBuilder } from '@codemirror/state'; 
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate} from '@codemirror/view';
import { textBoxExtension } from './textBox';

//ability to delete snippet, and store it properly :o

interface ISnippet{
    //cellIndex: number; probably needed because it wont work for other cell
    id: number;
    start_line: number;
    end_line:number;
    content: string;
    //template: number;//not yet i think idk
}

let lastSnippetId = 0;
const snippetTracker: ISnippet[] = [];

//it is put in order 

function createSnippet( view: EditorView, startLine:number, endLine:number, content: string){
    lastSnippetId++;
    snippetTracker.push({id:lastSnippetId, start_line: startLine, end_line: endLine, content});
    console.log("Snippet added:", snippetTracker);   
}

 
//Issues when I create a new cell it restarts the line number back to one for the new cell
//And if i try to update that new cell line it updates the old cell line :(
function updateSnippetLineNumber(view: EditorView) {

    const docText = view.state.doc.toString();
    const snippetPattern = /#template start([\s\S]*?)#template end/g;
    let match;
    let snippetIndex = 0; 

    //not working for differenet cells
    //looks for the template start stuff and in tracker
    while ((match = snippetPattern.exec(docText)) !== null && snippetIndex < snippetTracker.length) {
        const startPos = match.index;
        const endPos = startPos + match[0].length;

        const newStartLine = view.state.doc.lineAt(startPos).number;
        const newEndLine = view.state.doc.lineAt(endPos).number;
        //finds the new start and end by looking at where start and end template ^^

        // Update only if line numbers have changed
        //probably not the best way to do it maybe because what if i move the snippet? or idk are we doing that
        if (snippetTracker[snippetIndex].start_line !== newStartLine || snippetTracker[snippetIndex].end_line !== newEndLine
        ) {
            snippetTracker[snippetIndex].start_line = newStartLine;
            snippetTracker[snippetIndex].end_line = newEndLine;

            console.log("Snippet update:", snippetTracker);
        }

        snippetIndex++; // Move to next tracked snippet
    }
}

/*
function updateContent(view: EditorView){
    return;
}
*/

//make it based on range instead of on template start and end?
//this one shhould rely on range rather then the template start and end
//fix that
function getOrAssignColor(view: EditorView): DecorationSet {
    //stores the decorations
    const builder = new RangeSetBuilder<Decoration>();
    //look through the ISnippet interface and apply it on all the ranges rather than on the template start and end

    const docText = view.state.doc.toString();
    //the pattern we are looking for

    //idk if to depend on this or just use the start and end lines collected ?
    const snippetPattern = /#template start([\s\S]*?)#template end/g;
    let match;
    
    //What this does is it looks for the template start and end and find the start and end lines of where they are located at
    while ((match = snippetPattern.exec(docText))) {
        const startPos = match.index!;
        const endPos = match.index! + match[0].length;
        
        const startLine = view.state.doc.lineAt(startPos);
        const endLine = view.state.doc.lineAt(endPos);
        

        builder.add(startLine.from, startLine.from, Decoration.line({
            attributes: { style: `border-top: 2px solid #FFC0CB; border-left: 2px solid #FFC0CB ; border-right: 2px solid #FFC0CB ;` }
        }));

       
        builder.add(endLine.from, endLine.from, Decoration.line({
            attributes: { style: `border-bottom: 2px solid #FFC0CB; border-left: 2px solid #FFC0CB; border-right: 2px solid #FFC0CB;` }
        }));
        
        //the highlight option colored code cell
        /**
        for (let pos = startPos; pos <= endPos;) {
            const line = view.state.doc.lineAt(pos);
            builder.add(line.from, line.from, Decoration.line({
                attributes: { style: `background-color: #ead1dc` }
            }));
            pos = line.to + 1;
        } 
        */
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

                //the range of what was dropped
                const selection = view.state.selection.main;
                //gets the starting position of what was dropped
                const dropPos = selection.from; 
            
                
                const startLine = view.state.doc.lineAt(dropPos).number;

                const endLine = startLine + droppedText.split("\n").length - 1;
                        
                createSnippet(view, startLine, endLine, droppedText);
               
                setTimeout(() => {
                    updateSnippetLineNumber(view);
                }, 10);
            })

            
            //this does not work because it is not reseting after every new code cell
            //idk i think ist better for it to restart every code cell because then, idk if me adding lines somewhere better, and also the past already has it?
            //but idk would it be better if i just have it every line? just need to update the update and the 
            //no just leave it as it resets try and get it to restart but without it rely on template start and end
            //figure it out
            /*
            view.dom.addEventListener("paste", (event: ClipboardEvent) => {
                if (!event.clipboardData) {return;}

                const pastedText = event.clipboardData.getData("text/plain");
                    
                const snippetLines = findSnippetLines(view);
                //const cellIndex = getCellIndex(view); // Ensure this function is defined
                 
                 if (!snippetLines) {return;}
 
                 const selection = view.state.selection.main;
                 const pasteLine = view.state.doc.lineAt(selection.from).number;
                 
                 // Find the closest snippet to the paste position idk if to change this / find a better way instead of this do cell iindex perchance?
                 //where was the paste option at
                 let closestSnippet = snippetLines[0];
                 let minDiff = Math.abs(pasteLine - closestSnippet[0]);
                 
                 for (const [startLine, endLine] of snippetLines) {
                     const diff = Math.abs(pasteLine - startLine);
                     if (diff < minDiff) {
                         closestSnippet = [startLine, endLine];
                         minDiff = diff;
                         }
                     }
                 
                 const [startLine, endLine] = closestSnippet;
                 
                 createSnippet(view, startLine, endLine, pastedText);
                 
             });
             */
            
        }
        update(update: ViewUpdate) {

            if (update.docChanged) {
                this.decorations = getOrAssignColor(update.view);
                updateSnippetLineNumber(update.view)
            }
        }
    },
    {
    decorations: (v) => v.decorations
    }
);


export function combinedExtension(): Extension {
    return [updateCellBackground,textBoxExtension()];
}



