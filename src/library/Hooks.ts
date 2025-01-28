import { CodeSnippet } from "./types";

// file that stores all the functions needed

// template converter(or we just use a library)

// read, get, update, patch, delete functions for the JSON file

// pass in the data as a string, should pass in an object of CodeSnippet type
//export async function PostSnippet(){

//}

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