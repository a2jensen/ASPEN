interface Template {
    /** ID associated with the template - generated with DateNow() */
    id: string;
    /** Name associated with the template */
    name: string;
    /** Content/snippet associated with the template */
    content: string;

    /** Tracks date created as well as updated */
    dateCreated: Date;
    dateUpdated: Date;

    /** Feature not implemented yet - but will allow for certain tags to marked onto a tempalte */
    tags: string[];

    /** Sets a color to a template, not in use */
    color: string;

    /** Holds IDs of the snippet instances */
    connections: string[];
  }

  export default Template;