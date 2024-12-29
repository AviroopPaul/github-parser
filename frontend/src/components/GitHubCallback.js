import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function GitHubCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the code from URL parameters
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const code = urlParams.get("code");

    if (code) {
      // Add error handling and logging
      console.log("Sending code to backend:", code);

      fetch("http://localhost:8000/api/github/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
        credentials: "include", // Add this if you're using sessions
      })
        .then((response) => {
          console.log("Response status:", response.status);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Received data:", data);
          localStorage.setItem("github_token", data.access_token);
          // Pass user data through navigation state instead of localStorage
          navigate("/dashboard", {
            state: {
              user: data.user,
            },
          });
        })
        .catch((error) => {
          console.error("Error during GitHub callback:", error);
          navigate("/");
        });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white">Processing GitHub login...</div>
    </div>
  );
}

export default GitHubCallback;
