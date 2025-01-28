
//import { CodeSnippet } from "./types";
import { Contents } from '@jupyterlab/services'

// file that stores all the functions needed

// template converter(or we just use a library)

// read, get, update, patch, delete functions for the JSON file

// pass in the data as a string, should pass in an object of CodeSnippet type
export async function PostSnippet( snippet : string , contentsManager : Contents.IManager ){
    const filePath : string = 'user_snippets/snippets.json';
    const jsonFormat = {
        timestamp : new Date().toISOString(),
        value : snippet
    };

    const fileContent = JSON.stringify(jsonFormat, null, 2);

    try {
        await contentsManager.save(filePath, {
            type : 'file',
            format : 'text',
            content : fileContent
        })
    } catch (error : unknown ) {
        console.error("Failed saving data to path")
        throw Error('failed to save code to JSON');
    }
}

// returns object of codesnippet type
//export async function GetSnippet(){

//}

// pass in the data as a string, should pass in an object of CodeSnippet type
//export async function UpdateSnippet(){

//}

const snippetLibrary: CodeSnippet[] = [];

export function addSnippet(name: string, code: string): void{
    const newSnippet: CodeSnippet = {
        id: new Date().getTime().toString(),
        name,
        code,
    };
    snippetLibrary.push(newSnippet);
}

export function getSnippets(): CodeSnippet[]{
    return snippetLibrary;
}

export function removeSnippet(id: string): void{
    const index = snippetLibrary.findIndex((snippet) => snippet.id === id );
    if (index !== -1){
        snippetLibrary.splice(index, 1);
    }
}