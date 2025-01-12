import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import GitHubCallback from "./components/GitHubCallback";
import Dashboard from "./pages/Dashboard";
import RepoSummary from "./pages/RepoSummary";
import Header from "./components/Header";
import Footer from "./components/Footer";
import DependencyCheck from "./pages/DependencyCheck";

// Create a wrapper component to handle the Header logic
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user data from location state or localStorage
    const storedUserData = localStorage.getItem("userData");
    if (location.state?.user) {
      setUserData(location.state.user);
      localStorage.setItem("userData", JSON.stringify(location.state.user));
    } else if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, [location.state]);

  const handleLogout = () => {
    localStorage.removeItem("github_token");
    localStorage.removeItem("userData");
    setUserData(null);
    navigate("/");
  };

  // Don't show header on homepage (login page)
  const showHeader = location.pathname !== "/";

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {showHeader && userData && (
        <Header userData={userData} onLogout={handleLogout} />
      )}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/github/callback" element={<GitHubCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/repo/:repoName/summary" element={<RepoSummary />} />
          <Route
            path="/repo/:repoName/dependencies"
            element={<DependencyCheck />}
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
