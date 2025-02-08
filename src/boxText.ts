/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */


import { Extension } from '@codemirror/state'; 
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';

import {MatchDecorator} from "@codemirror/view"

class PlaceholderWidget extends WidgetType{
    name: string; 

    constructor(name: string) {
        super();
        this.name = name;
    }

    eq(other: PlaceholderWidget): boolean {
        return other.name === this.name;
    }
    toDOM(){
        const span = document.createElement("span");
        span.textContent = this.name;
        span.style.background = "#E0E0E0"; 
        span.style.color = "black";
        span.style.padding = "1px";
        span.style.border = "1px dashed black"
        span.style.borderRadius = "5px";
        return span;
    }
}


const placeholderMatcher = new MatchDecorator({
  // /\b\w+\b/g allows for every word to turn into text box  
    regexp: /\b[A-Z][a-z]*\b/g , //to get text box [[]] is what is done /\[\[(\w+)\]\]/g
    decoration: match => Decoration.replace({
      widget: new PlaceholderWidget(match[0]), //match[1] for [[]]
    })
  })

const placeholders = ViewPlugin.fromClass(class {
    placeholders: DecorationSet

    constructor(view: EditorView) {
      
      this.placeholders = placeholderMatcher.createDeco(view)
    }
    update(update: ViewUpdate) {
      this.placeholders = placeholderMatcher.updateDeco(update, this.placeholders)
    }
  }, {
    decorations: instance => instance.placeholders,
    provide: plugin => EditorView.atomicRanges.of(view => {
      return view.plugin(plugin)?.placeholders || Decoration.none
    })
  })

export function textBoxExtension(): Extension {
    return [placeholders]
}


