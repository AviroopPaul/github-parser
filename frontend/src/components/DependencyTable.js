import React from "react";

function DependencyTable({
  dependencies,
  sortBy,
  sortOrder,
  handleSort,
  type,
}) {
  const sortDependencies = (dependencies) => {
    if (!sortBy || !dependencies) return Object.entries(dependencies);

    return Object.entries(dependencies).sort((a, b) => {
      if (sortBy === "status") {
        const aStatus = a[1].current === a[1].latest;
        const bStatus = b[1].current === b[1].latest;
        return sortOrder === "asc" ? aStatus - bStatus : bStatus - aStatus;
      }
      return 0;
    });
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-white mb-4">
        {type === "npm" ? "NPM" : "Python"} Dependencies
      </h2>
      <div className="bg-gray-800 rounded-lg p-6">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-2 text-cyan-400">Package</th>
              <th className="pb-2 text-cyan-400">Current Version</th>
              <th className="pb-2 text-cyan-400">Latest Version</th>
              <th
                className="pb-2 text-cyan-400 cursor-pointer hover:text-cyan-300 flex items-center gap-1"
                onClick={() => handleSort("status")}
              >
                Status
                {sortBy === "status" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortDependencies(dependencies).map(([pkg, versions]) => (
              <tr key={pkg} className="border-b border-gray-700/50">
                <td className="py-3 text-white">{pkg}</td>
                <td className="py-3 text-gray-300">{versions.current}</td>
                <td className="py-3 text-gray-300">{versions.latest}</td>
                <td className="py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      versions.current === versions.latest
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {versions.current === versions.latest
                      ? "Up to date"
                      : "Update available"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DependencyTable;
