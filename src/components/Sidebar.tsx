/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import * as React from 'react';

//import { useState, useEffect } from 'react';
import { Widget } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/ui-components';
//import { GetSnippet } from '../library/Hooks'
import Snippet  from "./Template";
import SearchBar from "./Searchbar";
//import { CodeSnippet } from '../library/types';



function Sidebar() {
    //const [snippets, setSnippets] = useState<CodeSnippet>("empty");

    /**
    useEffect(() => {
        // something like this
        const data = GetSnippet();
        setSnippets(data);
    }, [])
    */

  return  (
    <div>
        <h3>Code Templates</h3>
        <SearchBar/>
        <Snippet  /> { /**  this needs to be changed to a for loop/mapping */}
        <p>This is the content inside the sidebar widget. Will be deleted</p>
    </div>
  )
}

const myWidget: Widget = ReactWidget.create(<Sidebar />);
Widget.attach(myWidget, document.body);