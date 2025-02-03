/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */

// Imports
import { Extension, RangeSetBuilder } from '@codemirror/state'; 
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { EditorExtensionRegistry, IEditorExtensionRegistry } from '@jupyterlab/codemirror';

//When u print something it will give color
// Issues: when reload it changes the color
//fix the cellId
//Next work on text box thing

function getStoredColor(cellId: string): string | null {
    return localStorage.getItem(cellId); 
}

function storeColor(cellId: string, color: string): void {
    localStorage.setItem(cellId, color); }

// Generate unique identifier for code cells
function getCellId(view: EditorView): string {
    return `cell-${Math.random().toString(36).substr(2, 9)}`; // Random unique ID for each cell
}
//fix this ^^

const colors = ['#d9d2e9', '#E5FFE5', '#ead1dc', '#FFF5E5', '#E5FFF5'];

// Assign background color to code cell lines
function getOrAssignColor(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const cellId = getCellId(view); // Unique ID for the cell
    let color = getStoredColor(cellId); // Retrieve stored color for the cell

    
    if (!color) {
        color = colors[Math.floor(Math.random() * colors.length)]; 
        storeColor(cellId, color); // Store the new color
    }

    const background = Decoration.line({
        attributes: { class: 'cm-Back', style: `background-color: ${color};` }
    });

    for (const { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to; ) {
            const line = view.state.doc.lineAt(pos);
            builder.add(line.from, line.from, background);
            pos = line.to + 1;
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
                 // Update color on paste
                    console.log("Ctrl V pressed");
                }
            });

            
        }
        //makes it so only the pasted content is highlighted
        update(update: ViewUpdate) {
            if (this.pasteFlag && update.docChanged) {
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
    return [
        updateCellBackground
    ];
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
                schema: {
                    type: 'boolean',
                    title: 'Enable cell backgrounds',
                    description: 'Apply a background color to each code cell.'
                }
            })
        );
    }
};

export default cellBackground;
