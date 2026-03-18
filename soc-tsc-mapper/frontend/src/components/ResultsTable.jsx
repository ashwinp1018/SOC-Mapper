import { useState } from 'react';

export default function ResultsTable({ results, control }) {
  console.log("[RESULTS] Rendering", results.length, "results");
  const [hoveredRank, setHoveredRank] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState(null);

  const handleMouseEnter = (event, result) => {
    const rect = event.currentTarget.getBoundingClientRect();
    let x = rect.right + 8;
    let y = rect.top;
    
    if (x + 340 > window.innerWidth) x = rect.left - 340;
    if (y + 400 > window.innerHeight) y = Math.max(10, window.innerHeight - 410);
    
    setTooltipPos({ x, y });
    setTooltipData(result);
    setHoveredRank(result.rank);
  };

  const handleMouseLeave = () => setHoveredRank(null);

  const parseTooltipText = (text) => {
    if (!text) return null;
    const parts = text.split(/(Section:|Criterion:|COSO Principle \d+:)/g);
    
    return parts.map((part, index) => {
      if (part.match(/^(Section:|Criterion:|COSO Principle \d+:)$/)) {
        return <span key={index} style={{ color: '#FFE600', fontWeight: 'bold' }}>{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (!results || results.length === 0) {
    return <div className="text-gray-400 text-center py-8 text-sm">No results found</div>;
  }

  const getScoreColor = (score) => {
    if (score > 0.02) {
      return "bg-green-50 text-green-700 border-green-200";
    } else if (score >= 0.015) {
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    } else {
      return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getBorderColor = (rank) => {
    if (rank === 1) {
      return "border-l-[3px] border-l-[#FFE600] bg-yellow-50/30";
    } else if (rank <= 3) {
      return "border-l-[3px] border-l-gray-300/50";
    }
    return "border-l-[3px] border-l-transparent";
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {control && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-300 ring-1 ring-black/5">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Analyzed Query</p>
          <p className="text-gray-800 leading-relaxed text-sm font-medium">{control}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5 flex-grow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-5 py-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider w-[12%] text-center">Rank</th>
              <th className="px-5 py-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider w-[33%] text-left">Criterion</th>
              <th className="px-5 py-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider w-[35%] text-left">Section</th>
              <th className="px-5 py-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider w-[20%] text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((result, idx) => (
              <tr
                key={idx}
                className={`cursor-pointer hover:bg-gray-50/60 transition-colors duration-200 group relative ${getBorderColor(result.rank)}`}
                onMouseEnter={(e) => handleMouseEnter(e, result)}
                onMouseLeave={handleMouseLeave}
              >
                <td className="px-5 py-5 text-gray-900 font-semibold align-middle">
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shadow-sm transition-colors ${result.rank === 1 ? 'bg-[#FFE600] text-gray-900 ring-2 ring-yellow-400/20' : 'bg-white border border-gray-200 text-gray-500'}`}>
                      {result.rank}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-5 text-gray-900 font-medium align-middle">
                  <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm border transition-colors ${result.rank === 1 ? 'bg-yellow-100 border-yellow-200 text-yellow-800' : 'bg-white border-gray-200 text-gray-700'}`}>
                     <span className="font-mono pt-[1px] tracking-wide">{result.criterion}</span>
                  </span>
                </td>
                <td className="px-5 py-5 text-gray-500 text-sm align-middle">{result.section}</td>
                <td className="px-5 py-5 text-right align-middle">
                  <span className={`inline-block px-3 py-1 rounded-lg border font-mono text-[11px] font-semibold tracking-wide shadow-sm ${getScoreColor(result.score)}`}>
                    {result.score.toFixed(4)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fixed Tooltip Overlay */}
      {tooltipData && (
        <div 
          className={`fixed z-[100] w-max max-w-[320px] max-h-[400px] overflow-y-auto bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl p-4 transition-all duration-200 pointer-events-none left-0 top-0
            ${hoveredRank !== null ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="font-bold text-yellow-400 text-xs mb-3 pb-2 border-b border-gray-700 uppercase tracking-wider">
            {tooltipData.criterion}
          </div>
          <div className="text-gray-300 text-xs text-left space-y-3 whitespace-normal leading-relaxed">
            {tooltipData.bullets && tooltipData.bullets.length > 0 ? (
              tooltipData.bullets.map((bullet, bIdx) => (
                <div key={bIdx} className="flex items-start">
                  <span className="mr-2 text-yellow-500/50 flex-shrink-0 mt-0.5">•</span>
                  <span>{parseTooltipText(bullet)}</span>
                </div>
              ))
            ) : (
              <p className="italic text-gray-500">No description available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
