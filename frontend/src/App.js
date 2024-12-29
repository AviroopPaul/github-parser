import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GitHubCallback from "./components/GitHubCallback";
import Dashboard from "./pages/Dashboard";
import RepoSummary from "./pages/RepoSummary";

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/github/callback" element={<GitHubCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/repo/:repoName/summary" element={<RepoSummary />} />
          {/* Add more routes here as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
