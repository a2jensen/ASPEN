import { Extension, StateField, EditorState } from '@codemirror/state';
import {
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Tooltip,
  showTooltip
} from '@codemirror/view';
import { SnippetsManager } from './snippetManager';

/**
 * 
 * This serves as the main entry point for integrating CodeMirror into ASPEN.
 * This plugin integrates the SnippetsManager Class with CodeMirror's view system.
 * It is in charge of handling editor events, and applying/updating decorations to snippet instances when the view updates appropriately.
 * 
 * @param snippetsManager 
 * @returns ViewPluginExtension. Create a plugin for a class whose constructor takes a single editor view as argument.
 */
export function CodeMirrorExtension( snippetsManager : SnippetsManager) : Extension {

  const cursorTooltipField = StateField.define<readonly Tooltip[]>({
    create: getCursorTooltips,
  
    update(tooltips, tr) {
      if (!tr.docChanged && !tr.selection) return tooltips
      return getCursorTooltips(tr.state)
    },
  
    provide: f => showTooltip.computeN([f], state => state.field(f))
  })

  function getCursorTooltips(state: EditorState): readonly Tooltip[] {
    console.log("State ranges: ", state.selection.ranges);
    return state.selection.ranges
      .filter(range => range.empty)
      .map(range => {
        return {
          pos: range.head,
          above: true,
          strictSide: true,
          arrow: true,
          create: () => {
            let dom = document.createElement("div")
            dom.className = "cm-tooltip-cursor"
            //dom.textContent = text

            dom.appendChild(document.createTextNode(" "));

            let button = document.createElement("button");
            button.textContent = "Push Changes";
            button.className = "cm-tool-tip-button"
            //button.style.marginLeft = "8px"
            //button.style.padding = "2px 5px"
            button.style.fontSize = "12px"
            button.style.cursor = "pointer"
            
            // Add click event handler
            button.addEventListener("click", () => {
              console.log("Update template clicked at position", range.head)
              // Your update template logic here
            })

            dom.appendChild(button);

            return {dom}
          }
        }
      })
  }

    const viewPlugin = ViewPlugin.fromClass(
      class {
        /** The current set of decorations in the editor */
        decorations: DecorationSet;
        
        /**
         * Initializes the plugin for a specific editor view
         * 
         * @param view - The editor view this plugin instance is attached to
         * 
         * Sets up the initial decorations and event listeners for:
         * - Paste events: Handle pasting templates into the editor
         * - Drop events: Handle drag-and-drop of templates into the editor
         */
        constructor(view: EditorView ) {
          // Initialize decorations
          this.decorations = snippetsManager.AssignDecorations(view);
          
          /**
           * Event listener for paste events
           * 
           * Handles when a template is pasted into the editor from the clipboard.
           * Parses the clipboard data and creates a new snippet instance if it contains
           * a valid template.
           */
          view.dom.addEventListener("paste", event => {
            event.preventDefault();
    
            const clipboardContent = event.clipboardData?.getData('application/json');
            const droppedText = event.clipboardData?.getData('text/plain');
            console.log("dropped text app/json", clipboardContent);
            console.log("dropped text text/plain", droppedText);
    
            if (!clipboardContent) return;
            if(!droppedText) return;
    
            const parsedText = JSON.parse(clipboardContent);
            if(!(parsedText.marker === "aspen-template")) return; 
            
            const selection = view.state.selection.main;
            const dropPos = selection.from;
            const startLine = view.state.doc.lineAt(dropPos).number;
            const endLine = startLine + droppedText.split('\n').length - 1;
            console.log("Start line", startLine);
            console.log("End line,", endLine);
    
            const templateId = parsedText.templateID;
            console.log("The template id associated with the instance", templateId);
            snippetsManager.createSnippetInstance(view, startLine, endLine, templateId, droppedText);
    
            setTimeout(() => {
              snippetsManager.updateSnippetInstance(view);
              this.decorations = snippetsManager.AssignDecorations(view);
            }, 10); // A small delay to ensure updates are applied after the text is pasted
          })
    
          /**
           * Event listener for drop events
           * 
           * Handles when a template is dragged and dropped into the editor.
           * Parses the drop data and creates a new snippet instance if it contains
           * a valid template.
           */
          view.dom.addEventListener('drop', event => {
            event.preventDefault();
    
            const dragContent = event.dataTransfer?.getData('application/json');
            const droppedText = event.dataTransfer?.getData('text/plain');
            console.log("dropped text app/json", dragContent);
            console.log("dropped text text/plain", droppedText);
    
            if (!dragContent) return;
            if (!droppedText) return;
            
            const parsedText = JSON.parse(dragContent);
    
            if(!(parsedText.marker === "aspen-template")) return; 
    
            const selection = view.state.selection.main;
            const dropPos = selection.from;
            const startLine = view.state.doc.lineAt(dropPos).number;
            //console.log("Start line", startLine);
            const endLine = startLine + droppedText.split('\n').length - 1;
            //console.log("End line,", endLine);
            const templateID = parsedText.templateID;
    
            snippetsManager.createSnippetInstance(view, startLine + 1, endLine - 1, templateID, droppedText);
    
            setTimeout(() => {
              snippetsManager.updateSnippetInstance(view);
              this.decorations = snippetsManager.AssignDecorations(view);
            }, 10); // A small delay to ensure updates are applied after the text is dropped
          });

          /** 
          view.dom.addEventListener("mouseover", event => {
            const target = event.target as HTMLElement;
            console.log("target: ", target);
            if (target.classList.contains("snippet-start-line")){
              const tooltip = createToolTip(view, )
            }
          })*/


          /*Have an event listener for the custom command we created in index in order for when we click create Snippet it will ad the decoration and track the line
          numbers start and end*/
          document.addEventListener('Save Code Snippet', () => {

            console.log("Event listener for createSnippet!!!!!");
            const selection = view.state.selection.main;
            const startLine = view.state.doc.lineAt(selection.from).number;

            const endLine = view.state.doc.lineAt(selection.to).number;

            const templateID = 'custom';
            const droppedText = view.state.sliceDoc(selection.from, selection.to);
            snippetsManager.createSnippetInstance(view, startLine, endLine, templateID, droppedText);
    
            snippetsManager.updateSnippetInstance(view);
            this.decorations = snippetsManager.AssignDecorations(view);
             // A small delay to ensure updates are applied after the text is dropped
          });


        }
    
        /**
         * Updates the plugin state when changes occur in the editor
         * 
         * @param update - The ViewUpdate object containing information about the changes
         * 
         * This method is called whenever the document changes. It:
         * 1. Updates the positions of snippet instances via snippetsManager
         * 2. Refreshes the decorations to reflect the current state
         */
        update(update: ViewUpdate  ) {
          if (update.docChanged) {
              snippetsManager.updateSnippetInstance(update.view, update);
              this.decorations = snippetsManager.AssignDecorations(update.view);
          }
        }
      },
      {
        // Provide the decorations from this plugin to CodeMirror
        decorations: v => v.decorations
      }
    );
    
    return [viewPlugin, cursorTooltipField];
  }