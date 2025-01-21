
import * as React from 'react';
import { useState, useEffect } from "react";

function Searchbar(){
    const [ search, setSearch ] = useState();

    useEffect(() => {
        try {

        } catch (error : unknown ){
            console.error("Error in Searchbar")
        }
    },[]);

    return (
        <div>Search bar component</div>
    )
}

export default Searchbar;