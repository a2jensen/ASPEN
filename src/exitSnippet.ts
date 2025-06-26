/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import { EditorView } from '@codemirror/view';

let triggeredByCtrlEnter = false;

export function setTriggeredByCtrlEnter(value: boolean) {
  triggeredByCtrlEnter = value;
}

export function getTriggeredByCtrlEnter() {
  return triggeredByCtrlEnter;
}

export function exitSnippet(view: EditorView): boolean {
  setTriggeredByCtrlEnter(true);
  const { state } = view;
  const changes = {
    from: state.selection.main.from,
    to: state.selection.main.to,
    insert: "\n",
  };
  view.dispatch({ changes });
  return true; // indicate the command handled the key
}




