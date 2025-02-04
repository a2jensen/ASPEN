/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */

/**Notes- localStorage: Allows me to store key-value pairs, is it like an array ? i can store in memory
 * How can I delete stuff from local storage and what is the diff from array and that what if i store in json file
 * Its a built in browser feature?
 * 
 * 
 */


/**Text Boxes- In order to see the different options that can be added to code based off of diff instances
 * - Be able to have a text box :D
 * - Maybe try and do the hover thing a dialog appears perchance try out tut on code mirror
 * - How would we connect that to templates?
 */

/** Issue- When reload  it changes the color :( :D FIXED
 * 
 */

// Imports
import { Extension, RangeSetBuilder } from '@codemirror/state'; 
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { EditorExtensionRegistry, IEditorExtensionRegistry } from '@jupyterlab/codemirror';


// Generates the id from data-cell-id
function getCellId(view: EditorView): string {
    const storedId = view.dom.getAttribute('data-cell-id');
    if (storedId) {
        return storedId;
    }
    //.cm-editor finds the code cells and gets the length of code cells so basically just going up 1
    const newId = `cell-${document.querySelectorAll('.cm-editor').length}`;
    view.dom.setAttribute('data-cell-id', newId); 

    return newId; 
}

//using localstorage because it wont cause issue when reload, cant use array because when reload no work
//makes sure that the color that is connected to the id is stored in order for when reload it appears
//saw the cons not good if a lot of cells :o idk if better way to store it,
function storeColor(cellId: string, color: string): void {
    localStorage.setItem(cellId, color); }

function getStoredColor(cellId: string): string | null {
    return localStorage.getItem(cellId); 
}



//colors for cell, can be changed later :O, make random colors idk how
const colors = ['#d9d2e9', '#E5FFE5', '#ead1dc', '#FFF5E5', '#E5FFF5'];

// Assign background color to code cell lines
function getOrAssignColor(view: EditorView): DecorationSet {
    //DecorationSet
    const builder = new RangeSetBuilder<Decoration>();
    const cellId = getCellId(view); //an idea for the new cell
    const color = getStoredColor(cellId); // get the color that is connected to the id

    if(color) {
    //assigns the decoration/ color
    const background = Decoration.line({
        attributes: { class: 'cm-Back', style: `background-color: ${color};` }
    });
    //adds the line to next spot
    for (const { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to; ) {
            const line = view.state.doc.lineAt(pos);
            builder.add(line.from, line.from, background);
            pos = line.to + 1;
        }
     }
    }

    return builder.finish();
}

// Update cell background when the code changes
const updateCellBackground = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;
        pasteFlag: boolean;

        constructor(view: EditorView) {
            this.decorations = getOrAssignColor(view);
            this.pasteFlag = false;

            //its a bt weird the copy for color thing
            //maybe this can be changed when I select it and click on command and then it will turn into color
            view.dom.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.key === 'v') {
                    this.pasteFlag = true;
                    console.log("Ctrl V pressed");
                }
            });

            
        }
        //updates if paste is chosen, other options as well, like docChange(this allows highlight when I type)
        update(update: ViewUpdate) {
            if (this.pasteFlag) {

                const cellId = getCellId(update.view);
                let color = getStoredColor(cellId);

                //random color from the color list
                if (!color) {
                    color = colors[Math.floor(Math.random() * colors.length)];
                    storeColor(cellId, color);
                }

                this.decorations = getOrAssignColor(update.view);
                this.pasteFlag = false;
            }
        }
    },
    {
        decorations: (v) => v.decorations
    }
);

export function applyBackgroundToActiveCell(view: EditorView): Extension {
    return [updateCellBackground];
}

export function cellBackgroundExtension(): Extension {
    return [updateCellBackground];
}

// Extension Plugin
const cellBackground: JupyterFrontEndPlugin<void> = {
    id: '@aspen/codemirror-extension:plugin',
    autoStart: true,
    requires: [IEditorExtensionRegistry],
    activate: (app: JupyterFrontEnd, extensions: IEditorExtensionRegistry) => {
        extensions.addExtension(
            Object.freeze({
                name: '@aspen/codemirror:cell-background',
                default: 1,
                factory: () =>
                    EditorExtensionRegistry.createConfigurableExtension(() =>
                        cellBackgroundExtension()
                    ),
            })
        );
    }
};

export default cellBackground;
