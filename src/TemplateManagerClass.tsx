/** 
 * Acts as the JupyterLab plugin for the sidebar.
 * 
 * THIS MAY NOT BE NEEDED, UI WOULD BE HANDLED INSIDE THE SIDEBAR.TSX
 * FIND A WAY TO MOVE THIS INSIDE THE INDEX.TS component
 */

/** 
import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin
  } from '@jupyterlab/application';
  
  import { ILayoutRestorer } from '@jupyterlab/application';
  import { Widget } from '@lumino/widgets';
  import Template from './TemplateClass';



export class TemplateManager extends Widget {
  // add in a constructor

  // fetch Templates
  async function fetchTemplates() {
    
  }

  // sort templates
  function sortTemplates() {

  }
  
}

*/

/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import * as React from 'react';

import { Widget } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/ui-components';

function Sidebar() {
  return (
    <div>
      <h3>Code Templates from TEMPLATEMANAGER!!!!</h3>
      <p>This is the content inside the sidebar widget. woo</p>
    </div>
  );
}


class TemplatesManager extends ReactWidget {
  render() {
    return <Sidebar />;
  }
}
const TemplatesManagerClass: Widget = new TemplatesManager();
Widget.attach(TemplatesManagerClass, document.body);

export default TemplatesManager;