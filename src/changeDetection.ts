import { diffWords } from "diff";
//import { JupyterFrontEnd } from '@jupyterlab/application';
// import { INotebookTracker } from '@jupyterlab/notebook';
import { Template } from "./types";

// imports commented out needed for tracking save state

/* function that finds the differences between a snippet and template,
 what is returned is a change object:

* value: The concatenated content of all the tokens represented by this change object
    - i.e. generally the text that is either added, deleted, or common, as a single string.
    - In cases where tokens are considered common but are non-identical (e.g. because an option like ignoreCase or a custom comparator was used), the value from the new string will be provided here.
* added: true if the value was inserted into the new string, otherwise false
* removed: true if the value was removed from the old string, otherwise false
* count: How many tokens (e.g. chars for diffChars, lines for diffLines) the value in the change object consists of
*/

// we need to figure out a way to use the change object to create the placements of textboxes
// we also need to distinguish template and snippets

export function changeDetector(snippet1: Template, snippet2: Template){
    const snippetContent = snippet1.content;
    const templateContent = snippet2.content;
    return diffWords(snippetContent, templateContent);
}

