import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";

function Dashboard() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [reposPerPage] = useState(9);
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.user;

  useEffect(() => {
    // Redirect if no user data is present
    if (!userData) {
      navigate("/");
      return;
    }

    const fetchRepos = async () => {
      try {
        const github_token = localStorage.getItem("github_token");
        const response = await axios.get(
          "http://localhost:8000/api/github/repos",
          {
            headers: {
              Authorization: `Bearer ${github_token}`,
            },
          }
        );
        setRepos(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch repositories");
        setLoading(false);
      }
    };

    fetchRepos();
  }, [navigate, userData]);

  // Calculate pagination
  const indexOfLastRepo = page * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const currentRepos = repos.slice(indexOfFirstRepo, indexOfLastRepo);
  const totalPages = Math.ceil(repos.length / reposPerPage);
  const hasMore = page < totalPages;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0); // Scroll to top when page changes
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-xl text-cyan-400">Loading...</div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-xl text-red-400">{error}</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {userData && (
          <div className="mb-8 flex items-center space-x-4 text-white">
            <img
              src={userData.avatar_url}
              alt="Profile"
              className="w-16 h-16 rounded-full border-2 border-cyan-400"
            />
            <div>
              <h2 className="text-2xl font-bold text-cyan-400">
                {userData.name || userData.login}
              </h2>
              {userData.email && (
                <p className="text-gray-400">{userData.email}</p>
              )}
            </div>
          </div>
        )}

        <h1 className="text-3xl font-bold text-cyan-400 mb-8 border-b border-cyan-800 pb-4">
          Your GitHub Repositories
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentRepos.map((repo) => (
            <div
              key={repo.id}
              className="bg-gray-800 rounded-lg border border-cyan-900/30 p-6 
                hover:-translate-y-1 transition-all duration-300 ease-in-out
                hover:shadow-lg hover:shadow-cyan-500/20 backdrop-blur-sm"
            >
              <h3 className="text-xl font-semibold text-white mb-2">
                {repo.name}
              </h3>
              <p className="text-gray-400 mb-4 h-12 overflow-hidden">
                {repo.description || "No description available"}
              </p>
              <div className="flex space-x-4 mb-4">
                <span className="text-sm text-cyan-400 flex items-center">
                  <span className="mr-1">⭐</span> {repo.stargazers_count}
                </span>
                <span className="text-sm text-cyan-400 flex items-center">
                  <span className="mr-1">🔀</span> {repo.forks_count}
                </span>
              </div>
              <div className="flex space-x-4">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-cyan-600 text-white rounded-md
                    hover:bg-cyan-500 transition-colors duration-300
                    border border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  View on GitHub
                </a>
                <Link
                  to={`/repo/${repo.name}/summary`}
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md
                    hover:bg-purple-500 transition-colors duration-300
                    border border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  Generate Summary
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center items-center space-x-4">
          <button
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
            className={`px-4 py-2 rounded-md border
              ${
                page === 1
                  ? "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
                  : "bg-cyan-600 text-white border-cyan-500/30 hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20"
              } transition-colors duration-300`}
          >
            First
          </button>

          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={`px-4 py-2 rounded-md border
              ${
                page === 1
                  ? "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
                  : "bg-cyan-600 text-white border-cyan-500/30 hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20"
              } transition-colors duration-300`}
          >
            Previous
          </button>

          <span className="text-cyan-400">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasMore}
            className={`px-4 py-2 rounded-md border
              ${
                !hasMore
                  ? "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
                  : "bg-cyan-600 text-white border-cyan-500/30 hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20"
              } transition-colors duration-300`}
          >
            Next
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-md border
              ${
                page === totalPages
                  ? "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
                  : "bg-cyan-600 text-white border-cyan-500/30 hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20"
              } transition-colors duration-300`}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
