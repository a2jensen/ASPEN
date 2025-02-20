/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
// Imports
import { Extension, RangeSetBuilder } from '@codemirror/state'; 
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { textBoxExtension } from './textBox';

 

//highlight will be toggle, so if I click on templae then the instances of that template willl highlight but I need connections first 
//Im going to work on the tracking of the positions I think ignore the code color and just keep working on, tracking and updating where everything is at  

//drag and drop edit it 

interface ISnippet{
    start_line: number;
    end_line:number;
    content: string;
    //template_ID: number;//not yet i think idk if need

}

const snippetTracker: ISnippet[] = [];


//error does not update the content when in same cell but in diff cell it good
function createSnippet(view: EditorView){
    //issue here it does not find the newest instance of it
    const docText = view.state.doc.toString();
    
    const snippetPattern = /#template start([\s\S]*?)#template end/;
    const match = snippetPattern.exec(docText);
    if(match){
        const startPos = match.index
        const endPos = startPos + match[0].length;
        const startLine = view.state.doc.lineAt(startPos).number;
        const endLine = view.state.doc.lineAt(endPos).number;
        const content = match[1].trim();

        snippetTracker.push({ start_line: startLine, end_line: endLine, content});
        console.log("Snippet added:", snippetTracker);
    }

    
}


//error with code when I create an new cell and have a
//also does not update new content need to add that

function updateSnippetLineNumber(view: EditorView) {
    console.log("checking for updates");

    const docText = view.state.doc.toString();
    const snippetPattern = /#template start([\s\S]*?)#template end/g;
    let match;
    let snippetIndex = 0; 

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



// Assign background color to code cell lines
function getOrAssignColor(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();

    const docText = view.state.doc.toString();

    const snippetPattern = /#template start([\s\S]*?)#template end/g;
    let match;
  
    
    while ((match = snippetPattern.exec(docText))) {
        const startPos = match.index!;
        const endPos = match.index! + match[0].length;
        

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



const updateCellBackground = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = getOrAssignColor(view);
            
            view.dom.addEventListener("paste", (event: ClipboardEvent) => {
                setTimeout(() =>{
                    createSnippet(view);
                }, 10);
               
            });
           
        }
        update(update: ViewUpdate) {
            //fix this becasue it updates everytime and it adds a snippet everytime even though position might change
            //snippet class template class and a manager for the two, snippet class should have the onject maybe no id, / color, line numbers tracking it by, 
            //everytime the file changes a method updates the snippet start and end line numbers, adding or lessing, , a snippet manager for the last bulletin updating the chagning of line number
            //snippet class refrence to template object
            //template class will have a list of the snippets it has or maybe it doesnt need to know, instead the template manager does know
            //instances do know what they are connected to
            //code snippet class
            //snippet manager -  create snipet method which is called whenever u drag and drop or copy and paste, update snippet line number, 
            // 
            if (update.docChanged) {
                //because now instead of checking th entire doc and updating it would only need to check when Snippets update and upadte those
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
        updateCellBackground];
}
export function combinedExtension(): Extension {
    return [updateCellBackground,textBoxExtension()];
}

