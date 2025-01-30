
//import Connections from "./ConnectionsClass";
//import { TemplateManager } from "./TemplateManagerClass";
import * as React from 'react';
import { Widget } from "@lumino/widgets";
import { ReactWidget } from '@jupyterlab/ui-components';

/**
interface TemplateProps {
    id : string,
    name: string,
    content: string, // change from content to codeSnippet?
    dateCreated : Date,
    dateUpdated: Date,
    tags: string[],
    color : string,
    //connections : Connections[] // array of all the connected snippet
}
 */

function TemplateComponent () {
    return (
       <div className=''>
            <h3>Title</h3>
            <div>Code Snippet</div>
       </div>
    )
};

class Template extends ReactWidget {
    // construct a

    // adding Template
        // add an array 
    // deleting Template

    // updating Template

    // drag template
    render () {
        return <TemplateComponent />;
    }
}

const TemplateClass : Widget = new Template();
Widget.attach(TemplateClass, document.body);

export default Template;