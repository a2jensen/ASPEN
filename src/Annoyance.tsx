import React, { useState } from "react";

// print hello world every time user types a character
const Annoyance = () => {
    const [enteredText, setEnteredText] = useState("");
 
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
     console.log("Hello world");
    };
 
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     setEnteredText(event.target.value);
    };
 
    return (
     <div style={{ padding: "20px" }}>
         <input
             onKeyDown={handleKeyDown}
             onChange={handleChange}
             type="text"
             className="text-input"
             value={enteredText}
             placeholder="Type something..."
         />
     </div>
    );
 };

export default Annoyance;