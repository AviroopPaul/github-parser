import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiGithub, FiFolder, FiRefreshCw, FiBox } from "react-icons/fi";
import { BiGitRepoForked, BiSearchAlt, BiGitBranch } from "react-icons/bi";
import { AiOutlineStar, AiOutlineFileText } from "react-icons/ai";

function Dashboard() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [reposPerPage] = useState(9);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.user;
  const [loadingMessage, setLoadingMessage] = useState(0);

  const loadingMessages = [
    { text: "Connecting to GitHub...", icon: FiGithub },
    { text: "Fetching your repositories...", icon: FiFolder },
    { text: "Loading repository details...", icon: BiGitRepoForked },
    { text: "Getting star counts...", icon: AiOutlineStar },
    { text: "Almost ready...", icon: BiSearchAlt },
    { text: "Preparing your dashboard...", icon: FiRefreshCw },
  ];

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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0); // Scroll to top when page changes
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("github_token");
    navigate("/");
  };

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRepo = page * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const currentRepos = filteredRepos.slice(indexOfFirstRepo, indexOfLastRepo);
  const totalPages = Math.ceil(filteredRepos.length / reposPerPage);
  const hasMore = page < totalPages;

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
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

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-xl text-red-400">{error}</div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-cyan-400 mb-8 border-b border-cyan-800 pb-4">
        Your GitHub Repositories
      </h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-md 
            border border-cyan-900/30 focus:outline-none focus:border-cyan-500
            placeholder-gray-400"
        />
      </div>

      {filteredRepos.length === 0 && (
        <div className="text-center text-gray-400 my-8">
          No repositories found matching "{searchTerm}"
        </div>
      )}

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
            <div className="flex flex-wrap gap-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 bg-cyan-600 text-white rounded-md
                  hover:bg-cyan-500 transition-colors duration-300
                  border border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <FiGithub className="w-5 h-5" />
              </a>
              <Link
                to={`/repo/${repo.name}/summary`}
                className="inline-flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-md
                  hover:bg-purple-500 transition-colors duration-300
                  border border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <AiOutlineFileText className="w-5 h-5 mr-1" />
                Summary
              </Link>
              <Link
                to={`/repo/${repo.name}/dependencies`}
                className="inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md
                  hover:bg-green-500 transition-colors duration-300
                  border border-green-500/30 hover:shadow-lg hover:shadow-green-500/20"
              >
                <FiBox className="w-5 h-5 mr-1" />
                Dependencies
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
  );
}

export default Dashboard;
