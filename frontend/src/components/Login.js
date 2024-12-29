import React, { useEffect } from "react";
import { FaGithub } from "react-icons/fa";

function Login({ onLogin }) {
  useEffect(() => {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      handleGitHubCallback(code);
    }
  }, []);

  const handleGitHubCallback = async (code) => {
    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to login");
      }

      // Store the access token securely
      localStorage.setItem("github_token", data.access_token);

      // Call the onLogin callback with user data
      if (onLogin) {
        onLogin(data.user);
      }

      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error("Login error:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleLogin = () => {
    const GITHUB_CLIENT_ID = process.env.REACT_APP_GITHUB_CLIENT_ID;
    const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;

    if (!GITHUB_CLIENT_ID || !REDIRECT_URI) {
      console.error("GitHub OAuth configuration is missing");
      return;
    }

    // Encode the redirect URI to ensure it's properly formatted
    const encodedRedirectUri = encodeURIComponent(REDIRECT_URI);

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodedRedirectUri}&scope=repo,user`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Welcome to GitHub Repo Summarizer
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in with GitHub to get started
          </p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
        >
          <FaGithub className="w-5 h-5" />
          Login with GitHub
        </button>
      </div>
    </div>
  );
}

export default Login;
