/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
// Imports
import { Extension, RangeSetBuilder } from '@codemirror/state'; 

import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';

import { EditorExtensionRegistry, IEditorExtensionRegistry } from '@jupyterlab/codemirror';

//when cells move it gets rid of color :o
//issue when reload if cell normally no color it will get color no clue why :o

// Generates the id from data-cell-id
//storinng t, changing it,
//id and color cant be connected idk?
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
//saw the cons not good if a lot of cells :o idk if there better way to store it,
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
    const cellId = getCellId(view); 
    const color = getStoredColor(cellId); // getting color that is connected to the id

    if(color) {
    //assigns the decoration/ color
    const background = Decoration.line({
        //do i need cm-Back
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

            //its a bit weird the copy for color thing
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
                //what here
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

// Will  be fizex/changed later :O and added to index
const cellBackground: JupyterFrontEndPlugin<void> = {
    id: '@aspen/codemirror:background',
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
