/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
// Imports
//, WidgetType
import { Extension, RangeSetBuilder } from '@codemirror/state'; 
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate} from '@codemirror/view';
import { textBoxExtension } from './textBox';

 //do the tracking stuff 
 //wouldnt want templates with same names, / maybe yes actually
 //just the range instead?
 //choose which changes we want to push how would we do that?- 
 //record the offsets of it instead of tracking
 //highlighting 
 //diff for changes/ visual indicator that the code is different, an indicator that different code can be pushed
 //so indtead of tracking template start and end I ma tracking something else the range, so everytime I paste I get the range of it?
 //ability to find where the instances are located



//highlight will be toggle, so if I click on templae then the instances of that template willl highlight but I need connections first 
//Im going to work on the tracking of the positions I think ignore the code color and just keep working on, tracking and updating where everything is at  


//Update the lines corrrectly and add the option to do the color




interface ISnippet{
    //cellIndex: number;
    start_line: number;
    end_line:number;
    content: string;
    //template_ID: number;//not yet i think idk if need

}

const snippetTracker: ISnippet[] = [];




function createSnippet( view: EditorView, startLine:number, endLine:number, content: string){
    snippetTracker.push({start_line: startLine, end_line: endLine, content});
    console.log("Snippet added:", snippetTracker);
    
}


//idk how to do it without the template start and end because then when would i get out of teh template? like when i space out how would know?
function findSnippetLines(view: EditorView): [number, number][] {
    console.log("Fetching all snippet line numbers...");
    const docText = view.state.doc.toString();
    const snippetPattern = /#template start([\s\S]*?)#template end/g;
    
    let match;
    const snippetLines:[number,number][] = [];

    while ((match = snippetPattern.exec(docText)) !== null) {
        const startPos = match.index;
        const endPos = startPos + match[0].length;

        const startLine = view.state.doc.lineAt(startPos).number;
        const endLine = view.state.doc.lineAt(endPos).number;

        snippetLines.push([startLine, endLine]);
    }

    console.log("Found snippets:", snippetLines);
    return snippetLines;
}

//error with code when I create an new cell and have a
//also does not update new content need to add that
//only active cell
//update line number and content
function updateSnippetLineNumber(view: EditorView) {
    console.log("checking for updates");

    const docText = view.state.doc.toString();
    const snippetPattern = /#template start([\s\S]*?)#template end/g;
    let match;
    let snippetIndex = 0; 

    //not working for differenet cells
    while ((match = snippetPattern.exec(docText)) !== null && snippetIndex < snippetTracker.length) {
        const startPos = match.index;
        const endPos = startPos + match[0].length;

        const newStartLine = view.state.doc.lineAt(startPos).number;
        const newEndLine = view.state.doc.lineAt(endPos).number;

        // Update only if line numbers have changed
        if (snippetTracker[snippetIndex].start_line !== newStartLine || snippetTracker[snippetIndex].end_line !== newEndLine
        ) {
            console.log(`Snippet ${snippetIndex + 1} moved from ${snippetTracker[snippetIndex].start_line}-${snippetTracker[snippetIndex].end_line} to ${newStartLine}-${newEndLine}`);

            snippetTracker[snippetIndex].start_line = newStartLine;
            snippetTracker[snippetIndex].end_line = newEndLine;

            console.log("Snippet update:", snippetTracker);
        }

        snippetIndex++; // Move to next tracked snippet
    }
}



//maybe do a bg text box or something idk
function getOrAssignColor(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();

    const docText = view.state.doc.toString();

    const snippetPattern = /#template start([\s\S]*?)#template end/g;
    let match;
  
    //diff color array of colors

    while ((match = snippetPattern.exec(docText))) {
        const startPos = match.index!;
        const endPos = match.index! + match[0].length;
        
        const startLine = view.state.doc.lineAt(startPos);
        const endLine = view.state.doc.lineAt(endPos);


        builder.add(startLine.from, startLine.from, Decoration.line({
            attributes: { style: `border-top: 2px solid #008000; border-left: 2px solid #008000; border-right: 2px solid #008000; padding: 2px;` }
        }));

        // Apply border to the last line (Bottom border)
        builder.add(endLine.from, endLine.from, Decoration.line({
            attributes: { style: `border-bottom: 2px solid #008000; border-left: 2px solid #008000; border-right: 2px solid #008000; padding: 2px;` }
        }));
        
        //the highlight option
        /*
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
            this.decorations = getOrAssignColor(view);

            view.dom.addEventListener("drop", (event) => {
                event.preventDefault() 
                console.log("Possible template/snippet dragged in");
            
                const droppedText = event.dataTransfer?.getData("text/plain");
                if (!droppedText) {return;}

                setTimeout(() => {
                    const snippetLines = findSnippetLines(view);
                    //const cellIndex = getCellIndex(view); // Ensure this function is defined
                    if (!snippetLines) {
                        console.warn(" No template found in document!");
                        return;
                    }
                    const selection = view.state.selection.main;
                    const pasteLine = view.state.doc.lineAt(selection.from).number;
                
                    // Find the closest snippet to the paste position idk if to change this / find a better way instead of this do cell iindex perchance?
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

                
                    createSnippet(view, startLine, endLine, droppedText);
                }, 10);

            })

            //paste option
            view.dom.addEventListener("paste", (event: ClipboardEvent) => {
                if (!event.clipboardData) {
                    console.log("clipboard")
                    return;
                }

                const pastedText = event.clipboardData.getData("text/plain");
                if (!pastedText) {
                    console.log("No pastedText")
                    return;
                }
                
                setTimeout(() => {
                    const snippetLines = findSnippetLines(view);
                    //const cellIndex = getCellIndex(view); // Ensure this function is defined
                    if (!snippetLines) {
                        console.warn(" No template found in document!");
                        return;
                    }
                    const selection = view.state.selection.main;
                    const pasteLine = view.state.doc.lineAt(selection.from).number;
                
                    // Find the closest snippet to the paste position idk if to change this / find a better way instead of this do cell iindex perchance?
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
                
                    console.log(" Pasted Content:", pastedText);
                    console.log(" Start Line:", startLine, "End Line:", endLine);
                
                    createSnippet(view, startLine, endLine, pastedText);
                }, 10);
            });
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




export function applyBackgroundToActiveCell(view: EditorView): Extension {
    return [
        updateCellBackground,
       ];
}
export function combinedExtension(): Extension {
    return [updateCellBackground,textBoxExtension()];
}



