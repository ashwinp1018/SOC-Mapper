export default function ResultsTable({ results, control }) {
  console.log("[RESULTS] Rendering", results.length, "results");

  if (!results || results.length === 0) {
    return <div className="text-gray-400 text-center py-8">No results found</div>;
  }

  const getScoreColor = (score) => {
    if (score > 0.02) {
      return "bg-green-900 text-green-300";
    } else if (score >= 0.015) {
      return "bg-yellow-900 text-yellow-300";
    } else {
      return "bg-gray-700 text-gray-300";
    }
  };

  const getBorderColor = (rank) => {
    if (rank === 1) {
      return "border-l-4 border-yellow-400";
    } else if (rank <= 3) {
      return "border-l-4 border-gray-400";
    }
    return "";
  };

  return (
    <div className="space-y-4">
      {control && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Query</p>
          <p className="text-gray-300 line-clamp-3">{control}</p>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-700 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-700">
              <th className="px-4 py-3 text-left font-medium text-gray-300">Rank</th>
              <th className="px-4 py-3 text-left font-medium text-gray-300">Criterion</th>
              <th className="px-4 py-3 text-left font-medium text-gray-300">Section</th>
              <th className="px-4 py-3 text-right font-medium text-gray-300">Score</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => (
              <tr
                key={idx}
                className={`border-b border-gray-700 hover:bg-gray-800/50 transition-colors ${getBorderColor(result.rank)}`}
              >
                <td className="px-4 py-3 text-gray-300 font-medium">{result.rank}</td>
                <td className="px-4 py-3 text-gray-300">{result.criterion}</td>
                <td className="px-4 py-3 text-gray-400">{result.section}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-block px-3 py-1 rounded font-mono text-xs font-medium ${getScoreColor(result.score)}`}>
                    {result.score.toFixed(4)}
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
