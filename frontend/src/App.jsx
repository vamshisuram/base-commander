import React, { useState } from "react";
import "./App.css";

function App() {
    const [response, setResponse] = useState("");
    const [inputValue, setInputValue] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Make API call here and set the response in state
        const text = inputValue;
        try {
            const apiResponse = await fetch("http://localhost:4000/run", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
            });
            const data = await apiResponse.json();
            setResponse(data.response);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleChange = (event) => {
        setInputValue(event.target.value);
    };

    return (
        <div className="App">
            <h1>Hello Vite + React!</h1>
            <form onSubmit={handleSubmit}>
                <textarea value={inputValue} onChange={handleChange} />
                <button type="submit">Submit</button>
            </form>
            {response && (
                <div>
                    <h2>Response:</h2>
                    <p>{response}</p>
                </div>
            )}
        </div>
    );
}

export default App;
