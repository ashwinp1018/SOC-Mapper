export default function ResultsTable({ results, control }) {
  console.log("[RESULTS] Rendering", results.length, "results");

  if (!results || results.length === 0) {
    return <div className="text-gray-400 text-center py-8">No results found</div>;
  }

  const getScoreColor = (score) => {
    if (score > 0.02) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (score >= 0.015) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else {
      return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getBorderColor = (rank) => {
    if (rank === 1) {
      return "border-l-[3px] border-l-yellow-400 bg-yellow-50/30";
    } else if (rank <= 3) {
      return "border-l-[3px] border-l-gray-300";
    }
    return "border-l-[3px] border-l-transparent";
  };

  return (
    <div className="space-y-6">
      {control && (
        <div className="bg-gray-50/50 border border-gray-200 rounded-sm p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">Analyzed Query</p>
          <p className="text-gray-700 leading-relaxed text-sm">{control}</p>
        </div>
      )}

      <div className="overflow-hidden border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-all duration-300 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-5 py-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Rank</th>
              <th className="px-5 py-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Criterion</th>
              <th className="px-5 py-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Section</th>
              <th className="px-5 py-4 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results.map((result, idx) => (
              <tr
                key={idx}
                className={`hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-200 group relative ${getBorderColor(result.rank)}`}
              >
                <td className="px-5 py-4 text-gray-900 font-semibold">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${result.rank === 1 ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {result.rank}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-900 font-medium">{result.criterion}</td>
                <td className="px-5 py-4 text-gray-500">{result.section}</td>
                <td className="px-5 py-4 text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-md border font-mono text-[11px] font-semibold tracking-wide ${getScoreColor(result.score)}`}>
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
