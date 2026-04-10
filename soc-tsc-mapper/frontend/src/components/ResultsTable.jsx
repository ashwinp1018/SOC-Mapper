import { useState } from 'react';

export default function ResultsTable({ results }) {
  const [hoveredResult, setHoveredResult] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (event, result) => {
    const rect = event.currentTarget.getBoundingClientRect();
    let x = rect.right + 16;
    let y = rect.top;

    if (x + 360 > window.innerWidth) x = rect.left - 360;
    if (y + 400 > window.innerHeight) y = Math.max(10, window.innerHeight - 410);

    setTooltipPos({ x, y });
    setHoveredResult(result);
  };

  const handleMouseLeave = () => setHoveredResult(null);

  const parseTooltipText = (text) => {
    if (!text) return null;
    const parts = text.split(/(Section:|Criterion:|COSO Principle \d+:)/g);

    return parts.map((part, index) => {
      if (part.match(/^(Section:|Criterion:|COSO Principle \d+:)$/)) {
        return <span key={index} className="text-[#FFE600] font-[700] block mt-2 mb-0.5 uppercase tracking-wide">{part}</span>;
      }
      return <span key={index} className="text-[#374151]">{part.trim()}</span>;
    });
  };

  const getScoreStyle = (score) => {
    if (score > 0.02) return "bg-[#FFE600] text-[#111827] font-[700]";
    if (score >= 0.015) return "bg-[#FEF3C7] text-[#92400E]";
    return "bg-[#F3F4F6] text-[#6B7280]";
  };

  const getRowStyle = (rank) => {
    if (rank === 1) return "border-l-[4px] border-l-[#FFE600] bg-[#FFFBCC] hover:bg-[#F9FAFB] hover:border-l-black";
    if (rank <= 3) return "border-l-[2px] border-l-[#D1D5DB] hover:bg-[#F9FAFB] hover:border-l-black";
    return "border-l-[2px] border-l-transparent hover:bg-[#F9FAFB] hover:border-l-black";
  };

  if (!results || results.length === 0) return null;

  return (
    <div className="flex flex-col flex-grow">
      <div className="overflow-x-auto hidden-scrollbar">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b-[2px] border-[#FFE600]">
              <th className="px-4 py-3 font-[600] text-[#9CA3AF] text-[11px] uppercase tracking-[0.08em] w-[10%] text-center">Rank</th>
              <th className="px-4 py-3 font-[600] text-[#9CA3AF] text-[11px] uppercase tracking-[0.08em] w-[20%] text-left">Criterion</th>
              <th className="px-4 py-3 font-[600] text-[#9CA3AF] text-[11px] uppercase tracking-[0.08em] w-[50%] text-left">Section</th>
              <th className="px-4 py-3 font-[600] text-[#9CA3AF] text-[11px] uppercase tracking-[0.08em] w-[20%] text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => (
              <tr
                key={idx}
                className={`cursor-pointer transition-all duration-150 group animate-slide-in border-b border-[#F3F4F6] ${getRowStyle(result.rank)}`}
                style={{ animationDelay: `${idx * 50}ms` }}
                onMouseEnter={(e) => handleMouseEnter(e, result)}
                onMouseLeave={handleMouseLeave}
              >
                <td className="px-4 py-4 align-middle text-center">
                  <span className="text-[13px] text-[#9CA3AF] font-[500]">{result.rank}</span>
                </td>
                <td className="px-4 py-4 align-middle">
                  <span className={`font-mono font-[700] text-black ${result.rank === 1 ? 'text-[15px]' : 'text-[13px]'} tracking-wide`}>
                    {result.criterion}
                  </span>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="text-[11px] font-[600] text-[#9CA3AF] uppercase truncate max-w-[220px]" title={result.section}>
                    {result.section}
                  </div>
                </td>
                <td className="px-4 py-4 text-right align-middle">
                  <span className={`inline-block px-3 py-1 text-[12px] font-[600] tracking-wide ${getScoreStyle(result.score)}`}>
                    {result.score.toFixed(4)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hoveredResult && (
        <div
          className={`fixed z-[100] w-max max-w-[340px] max-h-[400px] overflow-y-auto bg-[#FFFFFF] border border-[#E5E7EB] border-t-[4px] border-t-black p-5 pointer-events-none`}
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px`,
            animation: 'slideIn 0.15s ease-out forwards'
          }}
        >
          <div className="mb-4 pb-3 border-b border-[#F0F0F0]">
            <span className="font-[700] text-[#111827] text-[14px] font-mono tracking-wide">{hoveredResult.criterion}</span>
            <span className="text-[#9CA3AF] text-[11px] uppercase font-[600] ml-3">{hoveredResult.section}</span>
          </div>
          
          <div className="text-[13px] text-left space-y-3 leading-relaxed">
            {hoveredResult.bullets && hoveredResult.bullets.length > 0 ? (
              hoveredResult.bullets.slice(0, 3).map((bullet, bIdx) => (
                <div key={bIdx} className="flex items-start">
                  <span className="mr-2 text-[#FFE600] flex-shrink-0 mt-0.5 font-bold">•</span>
                  <div className="flex-1">{parseTooltipText(bullet)}</div>
                </div>
              ))
            ) : (
              <p className="italic text-[#9CA3AF]">No description available</p>
            )}
            {hoveredResult.bullets && hoveredResult.bullets.length > 3 && (
              <div className="text-center pt-2 text-[11px] text-[#9CA3AF] italic uppercase tracking-widest font-[700]">
                + {hoveredResult.bullets.length - 3} MORE BULLETS
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
