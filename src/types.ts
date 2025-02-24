interface Template {
    id: string;
    name: string;
    content: string;
    dateCreated: Date;
    dateUpdated: Date;
    tags: string[];
    color: string;
    connections: string[];
  }

  export default Template;