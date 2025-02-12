/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */


//all same color differentiate by name
//active template is colored only

import { Extension, RangeSetBuilder } from '@codemirror/state'; 

import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

import { textBoxExtension } from './boxText';



//just make it generate random id b/c i dont want it to depend on line, so random integer the code cell is assigned to and then a color
//but now I have to make it so that color only activates when I click on template
function getCellId(view: EditorView): string {
    const storedId = view.dom.getAttribute('data-cell-id');
    if (storedId) {
        return storedId;
    }
    //.cm-editor finds the code cells and gets the length of code cells so basically just going up 1
    //gotta change this
    const newId = `cell-${document.querySelectorAll('.cm-editor').length}`;
    view.dom.setAttribute('data-cell-id', newId); 

    return newId; 
}

const cellColors: { [cellId: string]: string } = {};

//way it is being stored will change later
function storeColor(cellId: string, color: string): void {
    cellColors[cellId] = color;
    }

function getStoredColor(cellId: string): string | null {
    return cellColors[cellId] || null; 
}


//colors for cells/ might just keep one color
const colors = ['#d9d2e9', '#E5FFE5', '#ead1dc', '#FFF5E5', '#E5FFF5'];

// Assign background color to code cell lines
function getOrAssignColor(view: EditorView): DecorationSet {
    
    const builder = new RangeSetBuilder<Decoration>();
    const cellId = getCellId(view); 
    const color = getStoredColor(cellId); // getting color that is connected to the id
    const templateContainer = document.querySelector('.template-container') as HTMLElement;
    
    if(color && templateContainer){
        templateContainer.style.setProperty('--template-color', color);
    }

    if(color) {
    //assigns the decoration/ color
    const background = Decoration.line({
       
        attributes: { style: `background-color: ${color};` }
    });
    //adds the line to next spot
    //this is wrong I think this is what I can use if text has been added on top or on bottom or in the middle
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

            
            //Will only activate when I click on a template? and every instance of that template will highlight
            view.dom.addEventListener('keydown', (event) => {
                if ((event.ctrlKey && event.key === 'v') ||( event.metaKey && event.key === 'v')) {
                    this.pasteFlag = true;
                    console.log("Ctrl V pressed");
                }
            });

            //kepe track of where snippets are, search text for template start template end, 
     }
     //update will run and it will adjust depending if more code was added or removed so it will make template background bigger or smaller
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

export function combinedExtension(): Extension {
    return [updateCellBackground, textBoxExtension()];
}
