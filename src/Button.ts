import { EditorView, WidgetType } from "@codemirror/view";

/**
 * Snippet Interface
 * 
 */
interface Snippet {
    cell_id: number;
    content : string;
    start_line: number;
    end_line: number;
    template_id: string;
  }

/**
 * Propagate Button class that extends WidgetType
 */
export class Button extends WidgetType {
    private templateID: string;
    private snippet : Snippet;
    private view : EditorView;

    constructor( templateID : string , snippet : Snippet , view : EditorView ) {
        super();
        this.templateID = templateID;
        this.snippet = snippet;
        this.view = view;
        this.toDOM(view);
    }

    toDOM(view: EditorView): HTMLElement {
        console.log("INSIDE THE toDOM function!")
        console.log([this.templateID, this.snippet, this.view]);
        const button = document.createElement("button");
        button.innerHTML = "BUTTON";
        button.className = "update-button";
        button.title = "Propagate changes up to the template";

        // Style the button
        button.style.position = 'absolute';
        button.style.top = '2px';
        button.style.fontSize = '12px';
        button.style.backgroundColor = '#f0f0f0';
        button.style.border = '1px solid #ccc';
        button.style.cursor = 'pointer';

        button.addEventListener("click", (event) => {
            event.preventDefault();

            // call function that will push changes up to template 
            // passes in templateID, snippet
        })
        return button;
    }
}