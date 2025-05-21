
/**
 * @type id : string -  ID associated with the template, generated through`${DateNow()}`
 * @type name : string - Name associated with the template
 * @type content : string - Content/string associated with the template
 * @type : dateCreated : Date - Tracks date creation of template
 * @type : dateUpdated : Date - Tracks most recent updates for the template
 * @type : tags : string[]  - Associates tags with templates - not implemented as of 3/5/25
 * @type color : string  - Color associated with the template - not implemented as of 3/5/25
 * @type : connections : string[] - Tracks associated snippet instances - not implemented as of 3/5/25 and may need refactoring
 */
export interface Template {
    id: string;
    name: string;
    content: string;
    dateCreated: Date;
    dateUpdated: Date;
    tags: string[];
    color: string;
}

/**
 * @type cell_id : number -  Unique identifier for the cell/view containing this snippet
 * @type content : string - Content/string associated with the snippet
 * @type start_line : number - starting line number in view/editor
 * @type end_line : number - ending line number in view/editor
 * @type template_id : string - reference to associated templateID
 */
export interface Snippet {
  id: string,
  cell_id: number;
  content : string;
  start_line: number;
  end_line: number;
  template_id: string;
}

