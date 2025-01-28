/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import * as React from 'react';

import { Widget } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/ui-components';

// this component loads in snippet data for one individual snippet
function Template() {
    // load in instance of class

    // load in 

  return  (
    <div>
        <h3>Template</h3>
        <p>Content inside the code template</p>
    </div>
  )
}

const myWidget: Widget = ReactWidget.create(<Template />);
Widget.attach(myWidget, document.body);
export default Template;
