import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SECTION_MAPPING = {
  "CC1": "1.0 Control Environment",
  "CC2": "2.0 Communication and Information",
  "CC3": "3.0 Risk Assessment",
  "CC4": "4.0 Monitoring Activities",
  "CC5": "5.0 Control Activities",
  "CC6": "6.0 Logical and Physical Access",
  "CC7": "7.0 System Operations",
  "CC8": "8.0 Change Management",
  "CC9": "9.0 Risk Mitigation",
  "A": "10.0 Availability",
  "C": "11.0 Confidentiality",
  "PI": "12.0 Processing Integrity",
  "P": "13.0 Privacy"
};

const TESTING_RESULTS_OPTIONS = [
  "-- Select --",
  "No deviations noted",
  "Deviations noted",
  "Not applicable",
  "See comments"
];

export default function BulkResultsTable({ results }) {
  const [editableResults, setEditableResults] = useState([]);
  
  // Hover Tooltip States
  const [hoveredResult, setHoveredResult] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Inline Add states
  const [addingCriterionId, setAddingCriterionId] = useState(null);
  const [newCriterionValue, setNewCriterionValue] = useState("");

  useEffect(() => {
    setEditableResults(results.map(r => ({
      ...r,
      matches: r.matches ? r.matches.map(m => ({ ...m })) : [],
      testing_performed: "",
      testing_results: "-- Select --",
      comments: ""
    })));
  }, [results]);

  const handleUpdateField = (index, field, value) => {
    const newData = [...editableResults];
    newData[index][field] = value;
    setEditableResults(newData);
  };

  const handleRemoveCriterion = (rowIndex, matchIndex) => {
    const newData = [...editableResults];
    newData[rowIndex].matches.splice(matchIndex, 1);
    setEditableResults(newData);
  };

  const handleAddCriterionSubmit = (index) => {
    if (newCriterionValue.trim()) {
      const match = { criterion: newCriterionValue.trim(), score: 0, section: "User Defined", bullets: [] };
      const newData = [...editableResults];
      if (!newData[index].matches) newData[index].matches = [];
      newData[index].matches.push(match);
      setEditableResults(newData);
    }
    setAddingCriterionId(null);
    setNewCriterionValue("");
  };

  const handleAddRow = () => {
    const nextNum = editableResults.length > 0 
      ? (parseInt(editableResults[editableResults.length - 1].control_number) || editableResults.length) + 1 
      : 1;
    setEditableResults([...editableResults, {
      control_number: nextNum,
      control_text: "",
      matches: [],
      testing_performed: "",
      testing_results: "-- Select --",
      comments: "",
      isNew: true
    }]);
  };

  const handleMouseEnter = (event, matchResult) => {
    if (!matchResult.bullets || matchResult.bullets.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    let x = rect.right + 8;
    let y = rect.top;
    
    if (x + 340 > window.innerWidth) x = rect.left - 340;
    if (y + 400 > window.innerHeight) y = Math.max(10, window.innerHeight - 410);
    
    setTooltipPos({ x, y });
    setHoveredResult(matchResult);
  };

  const handleMouseLeave = () => setHoveredResult(null);

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

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Grouping
    const groupedRows = {};
    const uncategorizedRows = [];

    editableResults.forEach(r => {
      let sectionCode = "Uncategorized";
      if (r.matches && r.matches.length > 0) {
        const firstCrit = r.matches[0].criterion || "";
        const match = firstCrit.match(/^(CC[1-9]|A|C|PI|P)/);
        if (match && SECTION_MAPPING[match[1]]) {
          sectionCode = match[1];
        }
      }
      
      if (sectionCode === "Uncategorized") uncategorizedRows.push(r);
      else {
        if (!groupedRows[sectionCode]) groupedRows[sectionCode] = [];
        groupedRows[sectionCode].push(r);
      }
    });

    const body = [];
    
    Object.keys(SECTION_MAPPING).forEach(code => {
      if (groupedRows[code] && groupedRows[code].length > 0) {
        body.push([{ content: SECTION_MAPPING[code], colSpan: 6, styles: { fillColor: [46, 46, 56], textColor: [255, 230, 0], fontStyle: 'bold' } }]);
        groupedRows[code].forEach(r => {
           const criteriaText = r.matches ? r.matches.map(m => m.criterion).join('\n') : "";
           body.push([
             String(r.control_number || ""),
             r.control_text || "",
             criteriaText,
             "N/A", 
             r.testing_performed || "",
             r.testing_results === "-- Select --" ? "" : r.testing_results
           ]);
        });
      }
    });

    if (uncategorizedRows.length > 0) {
        body.push([{ content: "Other / Uncategorized", colSpan: 6, styles: { fillColor: [46, 46, 56], textColor: [255, 230, 0], fontStyle: 'bold' } }]);
        uncategorizedRows.forEach(r => {
           const criteriaText = r.matches ? r.matches.map(m => m.criterion).join('\n') : "";
           body.push([
             String(r.control_number || ""),
             r.control_text || "",
             criteriaText,
             "N/A", 
             r.testing_performed || "",
             r.testing_results === "-- Select --" ? "" : r.testing_results
           ]);
        });
    }

    autoTable(doc, {
      body: body,
      startY: 32,
      margin: { top: 32, right: 10, bottom: 20, left: 10 },
      theme: 'grid',
      styles: { fontSize: 7, lineColor: [204, 204, 204], lineWidth: 0.1, cellPadding: 2 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      headStyles: { fillColor: [46, 46, 56], textColor: [255, 230, 0], fontStyle: 'bold', fontSize: 8 },
      columns: [
        { header: "Control #", dataKey: "col1" },
        { header: "Control specified by [Client]", dataKey: "col2" },
        { header: "Criteria", dataKey: "col3" },
        { header: "HIPAA Security Rule Requirement", dataKey: "col4" },
        { header: "Testing Performed by EY", dataKey: "col5" },
        { header: "Results of Testing", dataKey: "col6" }
      ],
      columnStyles: {
        0: { cellWidth: 12, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 25, textColor: [180, 150, 0] },
        3: { cellWidth: 30, fontStyle: 'italic', textColor: [150, 150, 150] },
        4: { cellWidth: 55 },
        5: { cellWidth: 30, halign: 'center' }
      },
      head: [["Control #", "Control specified by [Client]", "Criteria", "HIPAA Security Rule Requirement", "Testing Performed by EY", "Results of Testing"]],
      didDrawPage: function(data) {
        doc.setFillColor(46, 46, 56);
        doc.rect(10, 10, pageWidth - 20, 15, 'F');
        doc.setTextColor(255, 230, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Applicable Trust Services Criteria Mapped to [Client] Controls & Independent Auditor's Tests, and Results of Tests", 14, 18);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        const dateStr = new Date().toLocaleDateString();
        doc.text(`Date: ${dateStr}`, 14, 23);

        doc.setDrawColor(204, 204, 204);
        doc.setLineWidth(0.1);
        doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.text("PRIVATE AND CONFIDENTIAL", 10, pageHeight - 11);
        doc.text("This report contains confidential information. Use or reproduction of this report and/or its contents is strictly prohibited without express permission of EY.", 10, pageHeight - 8);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 10, pageHeight - 11, { align: 'right' });
      }
    });

    const fileDate = new Date().toISOString().split('T')[0];
    doc.save(`EY_SOC_TSC_Mapping_${fileDate}.pdf`);
  };

  if (!editableResults || editableResults.length === 0) return null;

  return (
    <div className="space-y-6">
      
      {/* Header Block Minimal Refinement */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
            <span className="bg-yellow-100 text-yellow-600 rounded-lg p-1.5 mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </span>
            Review & Edit Mapping Results
          </h2>
          <p className="text-gray-500 text-sm max-w-2xl ml-11">
            You can modify criteria, add testing notes, and select results before exporting to PDF.
          </p>
        </div>
        
        <button 
          onClick={handleExportPDF}
          disabled={editableResults.length === 0}
          className="mt-4 md:mt-0 flex items-center px-5 py-2.5 bg-[#FFE600] text-gray-900 hover:bg-yellow-400 font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-[#FFE600]/80"
        >
          <svg className="w-4 h-4 mr-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Export PDF Report
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto ring-1 ring-black/5">
        <table className="w-full text-left table-fixed min-w-[1200px] border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-5 py-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider w-[5%] text-center">#</th>
              <th className="px-5 py-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider w-[24%]">Control Description</th>
              <th className="px-5 py-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider w-[20%]">Criteria Mapped</th>
              <th className="px-5 py-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider w-[22%]">Testing Performed by EY</th>
              <th className="px-5 py-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider w-[14%]">Results</th>
              <th className="px-5 py-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider w-[15%]">Comments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {editableResults.map((r, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors duration-200">
                 
                 {/* ID */}
                 <td className="px-5 py-5 align-top border-l-[3px] border-l-transparent hover:border-l-[#FFE600] transition-colors">
                   <div className="flex flex-col items-center pt-1.5">
                     {r.isNew ? (
                       <input 
                         type="text" 
                         value={r.control_number} 
                         onChange={(e) => handleUpdateField(idx, 'control_number', e.target.value)} 
                         className="w-10 bg-gray-50 text-gray-900 border border-gray-200 focus:border-[#FFE600] focus:ring-2 focus:ring-yellow-400/20 outline-none px-1 py-1.5 text-xs text-center rounded-lg font-medium shadow-sm transition-all" 
                       />
                     ) : (
                       <span className="font-bold text-gray-500 bg-gray-100 w-8 h-8 flex items-center justify-center rounded-full text-xs shadow-inner">
                         {r.control_number}
                       </span>
                     )}
                   </div>
                 </td>
                 
                 {/* Description */}
                 <td className="px-5 py-5 align-top group">
                   <div className="flex flex-col gap-1.5 h-full relative">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Client Defined</span>
                     {r.isNew ? (
                       <textarea 
                          className="w-full bg-gray-50 hover:bg-white text-gray-800 p-3.5 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-yellow-400/30 focus:border-[#FFE600] shadow-sm transition-all min-h-[120px] leading-relaxed resize-y placeholder-gray-400" 
                          value={r.control_text} 
                          onChange={(e) => handleUpdateField(idx, "control_text", e.target.value)} 
                          placeholder="Type target control..."
                       />
                     ) : (
                       <div className="text-gray-700 text-sm leading-relaxed p-4 bg-gray-50/80 rounded-xl border border-gray-100 h-full overflow-y-auto max-h-[160px] shadow-inner group-hover:bg-white transition-colors">
                         {r.control_text}
                       </div>
                     )}
                   </div>
                 </td>
                 
                 {/* Criteria */}
                 <td className="px-5 py-5 align-top group">
                   <div className="flex flex-col gap-1.5 h-full">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Mapped Tags</span>
                     <div className="flex flex-wrap gap-2 bg-gray-50 group-hover:bg-white p-3.5 rounded-xl border border-gray-200 min-h-[120px] items-start content-start shadow-inner transition-colors">
                       {r.matches && r.matches.map((m, mIdx) => (
                         <span 
                           key={mIdx} 
                           className="inline-flex items-center text-xs font-semibold text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-full pl-3 pr-1 py-1 shadow-sm hover:shadow hover:bg-yellow-50 transition-all cursor-help relative"
                           onMouseEnter={(e) => handleMouseEnter(e, m)}
                           onMouseLeave={handleMouseLeave}
                         >
                           <span className="tracking-wide font-mono pt-[1px]">{m.criterion}</span>
                           <button 
                             onClick={() => handleRemoveCriterion(idx, mIdx)} 
                             className="ml-2 p-1 text-yellow-600/60 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center opacity-80 hover:opacity-100"
                             title="Remove Tag"
                           >
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                           </button>
                         </span>
                       ))}
                       
                       {addingCriterionId === idx ? (
                         <div className="flex w-full mt-1 items-center bg-white border border-[#FFE600] rounded-full p-1 pl-3 shadow-sm ring-2 ring-yellow-400/20">
                           <input 
                             autoFocus
                             type="text" 
                             value={newCriterionValue} 
                             onChange={(e) => setNewCriterionValue(e.target.value)} 
                             onKeyDown={(e) => e.key === 'Enter' && handleAddCriterionSubmit(idx)}
                             placeholder="e.g. CC1.1"
                             className="w-full min-w-[60px] bg-transparent text-gray-800 outline-none text-xs font-medium placeholder-gray-400 font-mono"
                           />
                           <button onClick={() => handleAddCriterionSubmit(idx)} className="ml-2 text-[10px] uppercase tracking-wider bg-[#FFE600] text-gray-900 font-bold px-3 py-1.5 rounded-full hover:bg-yellow-400 transition-colors shrink-0">Add</button>
                           <button onClick={() => { setAddingCriterionId(null); setNewCriterionValue("") }} className="ml-1 text-gray-400 hover:text-gray-600 p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                         </div>
                       ) : (
                         <button 
                           onClick={() => setAddingCriterionId(idx)} 
                           className="inline-flex items-center justify-center text-[10px] uppercase font-bold text-gray-400 bg-white hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 px-3 py-1.5 rounded-full border border-dashed border-gray-300 transition-all shadow-sm tracking-wider mt-0.5"
                         >
                           <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                           ADD
                         </button>
                       )}
                     </div>
                   </div>
                 </td>
                 
                 {/* Testing */}
                 <td className="px-5 py-5 align-top">
                   <div className="flex flex-col gap-1.5 h-full">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Auditor Input</span>
                     <textarea 
                       value={r.testing_performed}
                       onChange={(e) => handleUpdateField(idx, "testing_performed", e.target.value)}
                       className="w-full bg-gray-50 hover:bg-white text-gray-800 p-3.5 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-yellow-400/30 focus:border-[#FFE600] shadow-sm transition-all min-h-[120px] leading-relaxed resize-y placeholder-gray-400"
                       placeholder="Enter testing specifics..."
                     />
                   </div>
                 </td>
                 
                 {/* Results */}
                 <td className="px-5 py-5 align-top">
                   <div className="flex flex-col gap-1.5 h-full">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Verdict</span>
                     <select 
                       value={r.testing_results}
                       onChange={(e) => handleUpdateField(idx, "testing_results", e.target.value)}
                       className="w-full bg-gray-50 hover:bg-white text-gray-800 p-3 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-yellow-400/30 focus:border-[#FFE600] shadow-sm transition-all appearance-none cursor-pointer font-medium"
                       style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.85rem top 50%', backgroundSize: '0.65rem auto' }}
                     >
                       {TESTING_RESULTS_OPTIONS.map(opt => (
                         <option key={opt} value={opt}>{opt}</option>
                       ))}
                     </select>
                   </div>
                 </td>
                 
                 {/* Comments */}
                 <td className="px-5 py-5 align-top">
                   <div className="flex flex-col gap-1.5 h-full">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Notes</span>
                     <textarea 
                       value={r.comments}
                       onChange={(e) => handleUpdateField(idx, "comments", e.target.value)}
                       className="w-full bg-gray-50 hover:bg-white text-gray-800 p-3.5 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-yellow-400/30 focus:border-[#FFE600] shadow-sm transition-all min-h-[120px] leading-relaxed resize-y placeholder-gray-400"
                       placeholder="Deviations or tags..."
                     />
                   </div>
                 </td>
                 
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-center">
          <button 
            onClick={handleAddRow}
            className="flex items-center text-gray-500 hover:text-gray-900 font-semibold text-sm bg-white hover:bg-gray-50 px-5 py-2.5 border border-gray-200 rounded-xl transition-all shadow-sm group"
          >
            <span className="bg-gray-100 text-gray-400 group-hover:bg-[#FFE600] group-hover:text-gray-900 rounded-full p-1 mr-2 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
            </span>
            Add Control Row
          </button>
        </div>
      </div>

      {hoveredResult && (
        <div 
          className="fixed z-[100] w-max max-w-[320px] max-h-[400px] overflow-y-auto bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl p-4 transition-all duration-200 pointer-events-none opacity-100 left-0 top-0"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="font-bold text-yellow-400 text-xs mb-3 pb-2 border-b border-gray-700 uppercase tracking-wider">
            {hoveredResult.criterion}
          </div>
          <div className="text-gray-300 text-xs text-left space-y-3 whitespace-normal leading-relaxed">
            {hoveredResult.bullets && hoveredResult.bullets.length > 0 ? (
              hoveredResult.bullets.map((bullet, bIdx) => (
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
