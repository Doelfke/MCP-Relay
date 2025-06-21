import React from "react";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>MCP Relay</h1>
        <p>Manage your Model Context Protocol servers</p>
      </header>
      <main>
        hi
        <button className="btn btn-primary">Test</button>
      </main>
    </div>
  );
};

export default App;
