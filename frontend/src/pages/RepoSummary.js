import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

function RepoSummary() {
  const { repoName } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const github_token = localStorage.getItem("github_token");
        const response = await axios.get(
          `http://localhost:8000/api/github/repos/${repoName}/summary`,
          {
            headers: {
              Authorization: `Bearer ${github_token}`,
            },
          }
        );
        setSummary(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch repository summary");
        setLoading(false);
      }
    };

    fetchSummary();
  }, [repoName]);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8 border-b border-cyan-800 pb-4">
          <h1 className="text-3xl font-bold text-cyan-400">
            Repository Summary: {repoName}
          </h1>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            ← Back to Repositories
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg border border-cyan-900/30 p-6">
          <div className="relative">
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-red-400 mb-4">
                Failed to generate summary. Please try again.
              </div>
            ) : (
              <pre className="text-white whitespace-pre-wrap">
                {summary?.content}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RepoSummary;
