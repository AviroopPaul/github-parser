import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { FiPackage, FiSearch, FiDatabase } from "react-icons/fi";
import { DiNpm, DiPython } from "react-icons/di";
import DependencyTable from "../components/DependencyTable";

function DependencyCheck() {
  const [dependencies, setDependencies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const { repoName } = useParams();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const loadingMessages = [
    { text: "Looking for package.json...", icon: FiSearch },
    { text: "Scanning your package.json...", icon: DiNpm },
    { text: "Looking for requirements.txt...", icon: FiSearch },
    { text: "Scanning your Python dependencies...", icon: DiPython },
    { text: "Fetching latest versions...", icon: FiDatabase },
    { text: "Almost there...", icon: FiPackage },
  ];

  // Add message cycling effect
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const github_token = localStorage.getItem("github_token");
        const response = await axios.get(
          `http://localhost:8000/api/github/repos/${repoName}/dependencies`,
          {
            headers: {
              Authorization: `Bearer ${github_token}`,
            },
          }
        );
        setDependencies(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch dependencies");
        setLoading(false);
      }
    };

    fetchDependencies();
  }, [repoName]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleUpdateDependencies = async (type, dependencies) => {
    try {
      const outdatedDeps = {};
      Object.entries(dependencies).forEach(([pkg, versions]) => {
        if (versions.current !== versions.latest) {
          outdatedDeps[pkg] = versions;
        }
      });

      if (Object.keys(outdatedDeps).length === 0) {
        alert("All dependencies are already up to date!");
        return;
      }

      const github_token = localStorage.getItem("github_token");
      const response = await axios.post(
        `http://localhost:8000/api/github/repos/${repoName}/update-dependencies`,
        {
          file_path: Object.values(outdatedDeps)[0].file_path,
          updates: outdatedDeps,
        },
        {
          headers: {
            Authorization: `Bearer ${github_token}`,
          },
        }
      );

      // Open the PR in a new tab
      window.open(response.data.pr_url, "_blank");
      alert("Pull request created successfully!");
    } catch (error) {
      console.error("Error updating dependencies:", error);
      alert("Failed to update dependencies. Please try again.");
    }
  };

  if (loading) {
    const CurrentIcon = loadingMessages[loadingMessage].icon;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 space-y-4">
        <div className="flex items-center space-x-3">
          <CurrentIcon className="text-cyan-400 w-6 h-6 animate-spin" />
          <div className="text-xl text-cyan-400 animate-pulse">
            {loadingMessages[loadingMessage].text}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-xl text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-cyan-400 border-b border-cyan-800 pb-4">
          Dependencies for {repoName}
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-cyan-600 text-white rounded-md
              hover:bg-cyan-500 transition-colors duration-300
              border border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/20"
          >
            Back
          </button>
          {dependencies?.npm && (
            <button
              onClick={() => handleUpdateDependencies("npm", dependencies.npm)}
              className="px-4 py-2 bg-green-600 text-white rounded-md
                hover:bg-green-500 transition-colors duration-300
                border border-green-500/30 hover:shadow-lg hover:shadow-green-500/20"
            >
              Update NPM Dependencies
            </button>
          )}
          {dependencies?.pip && (
            <button
              onClick={() => handleUpdateDependencies("pip", dependencies.pip)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md
                hover:bg-blue-500 transition-colors duration-300
                border border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20"
            >
              Update Python Dependencies
            </button>
          )}
        </div>
      </div>

      {dependencies?.npm && (
        <DependencyTable
          dependencies={dependencies.npm}
          sortBy={sortBy}
          sortOrder={sortOrder}
          handleSort={handleSort}
          type="npm"
        />
      )}

      {dependencies?.pip && (
        <DependencyTable
          dependencies={dependencies.pip}
          sortBy={sortBy}
          sortOrder={sortOrder}
          handleSort={handleSort}
          type="pip"
        />
      )}

      {!dependencies?.npm && !dependencies?.pip && (
        <div className="text-center text-gray-400 my-8">
          No package.json or requirements.txt found in this repository.
        </div>
      )}
    </div>
  );
}

export default DependencyCheck;
