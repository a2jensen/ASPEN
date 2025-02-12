
import * as React from 'react';
import { Widget } from "@lumino/widgets";
import { ReactWidget } from '@jupyterlab/ui-components';

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

function TemplateComponent ( { template } : { template : TemplateProps} ) {
    return (
       <div className=''>
            <h3>{template.name}</h3>
            <div>{template.content}</div>
            <div>specified language here</div>
            <div>Language</div>
       </div>
    )
};

/**
 * Turning REACT component into lumino widget
 * https://jupyterlab.readthedocs.io/en/stable/extension/virtualdom.html
 */

class TemplateWidget extends ReactWidget {
    private template : TemplateProps;

    constructor( template : TemplateProps ) {
        super();
        this.template = template;
    }
    
    render () {
        return <TemplateComponent template={this.template} />;
    }
}

// Create a sample template object
const sampleTemplate: TemplateProps = {
    id: "1",
    name: "First Template",
    content: "console.log('Hello, JupyterLab!');",
    dateCreated: new Date(),
    dateUpdated: new Date(),
    tags: ["javascript", "logging"],
    color: "#FF5733"
};

const templateWidget : Widget = new TemplateWidget(sampleTemplate);
Widget.attach(templateWidget, document.body);

export default TemplateWidget;