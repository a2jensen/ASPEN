/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import * as React from 'react';

import { Widget } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/ui-components';

// this component loads in snippet data for one individual snippet
function Snippet(SnippetData) {
    // updating snippet name

    // updating snippet extension 

  return  (
    <div>
        <h3>Code Templates</h3>
        <p>This is the content inside the sidebar widget.</p>
    </div>
  )
}

const myWidget: Widget = ReactWidget.create(<Snippet />);
Widget.attach(myWidget, document.body);
export default Snippet;
