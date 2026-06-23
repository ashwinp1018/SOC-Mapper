import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateNarrative } from "../api/match";

const ALL_CRITERIA = [
  "CC1.1","CC1.2","CC1.3","CC1.4","CC1.5",
  "CC2.1","CC2.2","CC2.3",
  "CC3.1","CC3.2","CC3.3","CC3.4",
  "CC4.1","CC4.2",
  "CC5.1","CC5.2","CC5.3",
  "CC6.1","CC6.2","CC6.3","CC6.4","CC6.5","CC6.6","CC6.7","CC6.8",
  "CC7.1","CC7.2","CC7.3","CC7.4","CC7.5",
  "CC8.1",
  "CC9.1","CC9.2",
  "A1.1","A1.2","A1.3",
  "C1.1","C1.2",
  "PI1.1","PI1.2","PI1.3","PI1.4","PI1.5",
  "P1.1","P2.1","P3.1","P3.2","P4.1","P4.2","P4.3",
  "P5.1","P5.2","P6.1","P6.2","P6.3","P6.4","P6.5","P6.6","P6.7",
  "P7.1","P8.1"
];

const TESTING_RESULTS_OPTIONS = [
  "-- Select --",
  "No deviations noted",
  "Deviations noted",
  "Not applicable",
  "See comments"
];

export default function BulkResultsTable({ results }) {
  const [editableResults, setEditableResults] = useState([]);
  const [clientName, setClientName] = useState("");

  const [hoveredResult, setHoveredResult] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const [openPickerIdx, setOpenPickerIdx] = useState(null);
  const [pickerSearch, setPickerSearch] = useState("");

  const [generatingRows, setGeneratingRows] = useState(new Set());

  const [visibleColumns, setVisibleColumns] = useState({
    criteria: true,
    testing: true,
    results: true,
    comments: true
  });
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  useEffect(() => {
    setEditableResults(results.map(r => ({
      ...r,
      matches: r.matches ? r.matches.map(m => ({ ...m })) : [],
      testing_performed: [""],
      testing_results: "-- Select --",
      comments: ""
    })));
  }, [results]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openPickerIdx !== null) {
        const picker = document.getElementById(`picker-${openPickerIdx}`);
        const addBtn = document.getElementById(`addbtn-${openPickerIdx}`);
        if (picker && !picker.contains(e.target) && addBtn && !addBtn.contains(e.target)) {
          setOpenPickerIdx(null);
          setPickerSearch("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openPickerIdx]);

  const handleUpdateField = (index, field, value) => {
    const newData = [...editableResults];
    newData[index][field] = value;
    setEditableResults(newData);
  };

  const handleUpdateTestingStep = (rowIndex, stepIndex, value) => {
    const newData = [...editableResults];
    const steps = Array.isArray(newData[rowIndex].testing_performed)
      ? [...newData[rowIndex].testing_performed]
      : [newData[rowIndex].testing_performed || ""];
    steps[stepIndex] = value;
    newData[rowIndex].testing_performed = steps;
    setEditableResults(newData);
  };

  const handleAddTestingStep = (rowIndex) => {
    const newData = [...editableResults];
    const steps = Array.isArray(newData[rowIndex].testing_performed)
      ? [...newData[rowIndex].testing_performed]
      : [newData[rowIndex].testing_performed || ""];
    steps.push("");
    newData[rowIndex].testing_performed = steps;
    setEditableResults(newData);
  };

  const handleRemoveTestingStep = (rowIndex, stepIndex) => {
    const newData = [...editableResults];
    const steps = Array.isArray(newData[rowIndex].testing_performed)
      ? [...newData[rowIndex].testing_performed]
      : [newData[rowIndex].testing_performed || ""];
    steps.splice(stepIndex, 1);
    newData[rowIndex].testing_performed = steps.length > 0 ? steps : [""];
    setEditableResults(newData);
  };

  const handleGenerateNarrative = async (idx) => {
    const row = editableResults[idx];
    const controlText = row.control_text || "";
    const criteria = row.matches?.map(m => m.criterion) || [];
    
    if (!controlText.trim()) {
      console.warn("[GENERATE] No control text for row", idx);
      return;
    }
    
    console.log("[GENERATE] Starting generation for row", idx);
    setGeneratingRows(prev => new Set([...prev, idx]));
    
    try {
      const result = await generateNarrative(controlText, criteria);
      handleUpdateField(idx, "testing_performed", result.narrative);
      console.log("[GENERATE] Success for row", idx);
    } catch (err) {
      console.error("[GENERATE ERROR]", err);
      handleUpdateField(
        idx, 
        "testing_performed", 
        "Error generating narrative. Please try again."
      );
    } finally {
      setGeneratingRows(prev => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
    }
  };

  const handleRemoveCriterion = (rowIndex, matchIndex) => {
    const newData = [...editableResults];
    newData[rowIndex].matches.splice(matchIndex, 1);
    setEditableResults(newData);
  };

  const handlePickCriterion = (rowIdx, criterion) => {
    const match = { criterion: criterion, score: 0, section: "User Defined", bullets: [] };
    const newData = [...editableResults];
    if (!newData[rowIdx].matches) newData[rowIdx].matches = [];
    newData[rowIdx].matches.push(match);
    setEditableResults(newData);
  };

  const handleAddRow = () => {
    const nextNum = editableResults.length > 0
      ? (parseInt(editableResults[editableResults.length - 1].control_number) || editableResults.length) + 1
      : 1;
    setEditableResults([...editableResults, {
      control_number: nextNum,
      control_text: "",
      matches: [],
      testing_performed: [""],
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
        return <span key={index} className="text-[#FFE600] font-[700] block mt-2 mb-0.5 uppercase tracking-wide">{part}</span>;
      }
      return <span key={index} className="text-[#374151]">{part.trim()}</span>;
    });
  };

  const calculateSummaryLine = () => {
    if (editableResults.length === 0) return "";
    const controlCount = editableResults.length;
    const criteriaSet = new Set();
    editableResults.forEach(row => {
      row.matches?.forEach(match => {
        const prefix = match.criterion.match(/^[A-Z]+/);
        if (prefix) criteriaSet.add(prefix[0]);
      });
    });
    const familyCount = criteriaSet.size;
    return `${controlCount} control${controlCount !== 1 ? 's' : ''} mapped across ${familyCount} unique criteria famil${familyCount !== 1 ? 'ies' : 'y'}`;
  };

  const handleExportPDF = () => {
    const sectionMap = {
      CC1: "1.0 Management and Oversight",
      CC2: "2.0 Communication and Information",
      CC3: "3.0 Risk Assessment",
      CC4: "4.0 Monitoring Activities",
      CC5: "5.0 Control Activities",
      CC6: "6.0 Logical and Physical Access Controls",
      CC7: "7.0 System Operations",
      CC8: "8.0 Change Management",
      CC9: "9.0 Risk Mitigation",
      A: "10.0 Availability",
      C: "11.0 Confidentiality",
      PI: "12.0 Processing Integrity",
      P: "13.0 Privacy",
    };

    const getSection = (criterion) => {
      if (!criterion) return "14.0 Other";
      if (criterion.startsWith("CC1")) return sectionMap["CC1"];
      if (criterion.startsWith("CC2")) return sectionMap["CC2"];
      if (criterion.startsWith("CC3")) return sectionMap["CC3"];
      if (criterion.startsWith("CC4")) return sectionMap["CC4"];
      if (criterion.startsWith("CC5")) return sectionMap["CC5"];
      if (criterion.startsWith("CC6")) return sectionMap["CC6"];
      if (criterion.startsWith("CC7")) return sectionMap["CC7"];
      if (criterion.startsWith("CC8")) return sectionMap["CC8"];
      if (criterion.startsWith("CC9")) return sectionMap["CC9"];
      if (criterion.startsWith("PI")) return sectionMap["PI"];
      if (criterion.startsWith("P")) return sectionMap["P"];
      if (criterion.startsWith("A")) return sectionMap["A"];
      if (criterion.startsWith("C")) return sectionMap["C"];
      return "14.0 Other";
    };

    const cleanText = (text) => {
      if (!text) return "";
      return text.replace(/^\d+[.:]\s*/, "").trim();
    };

    const getSectionPrefix = (criterion) => {
      if (!criterion) return "C";
      if (criterion.startsWith("CC1")) return "MO";
      if (criterion.startsWith("CC2")) return "CI";
      if (criterion.startsWith("CC3")) return "RA";
      if (criterion.startsWith("CC4")) return "MA";
      if (criterion.startsWith("CC5")) return "CA";
      if (criterion.startsWith("CC6")) return "LA";
      if (criterion.startsWith("CC7")) return "SO";
      if (criterion.startsWith("CC8")) return "CM";
      if (criterion.startsWith("CC9")) return "RM";
      if (criterion.startsWith("PI")) return "PI";
      if (criterion.startsWith("P")) return "PR";
      if (criterion.startsWith("A")) return "AV";
      if (criterion.startsWith("C")) return "CF";
      return "C";
    };

    // Group rows by section
    const grouped = {};
    const groupOrder = [];

    editableResults.forEach((row) => {
      const firstCriterion = row.matches?.[0]?.criterion || "";
      const section = getSection(firstCriterion);
      if (!grouped[section]) {
        grouped[section] = [];
        groupOrder.push(section);
      }
      grouped[section].push(row);
    });

    const prefixCounters = {};
    const body = [];

    const clientLabel = clientName.trim() || "[CLIENT]";

    // Title row — inside the table, spans all 5 columns
    body.push([{
      content: `Security, Availability, and Confidentiality Criteria Mapped to ${clientLabel} Controls & Independent Auditor's Tests, and Results of Tests`,
      colSpan: 5,
      styles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 10,
        cellPadding: { top: 8, bottom: 8, left: 4, right: 4 },
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
    }]);

    // Column header row — inside body, not in head
    body.push([
      { content: "Control #", styles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9, lineColor: [0, 0, 0], lineWidth: 0.3 } },
      { content: `Control specified by ${clientLabel}`, styles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9, lineColor: [0, 0, 0], lineWidth: 0.3 } },
      { content: "Criteria", styles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9, lineColor: [0, 0, 0], lineWidth: 0.3 } },
      { content: "Testing performed by EY", styles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9, lineColor: [0, 0, 0], lineWidth: 0.3 } },
      { content: "Results of tests", styles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9, lineColor: [0, 0, 0], lineWidth: 0.3 } },
    ]);

    // Section headers and data rows
    groupOrder.forEach((section) => {
      // Section header — full border on all sides
      body.push([{
        content: section,
        colSpan: 5,
        styles: {
          fillColor: [128, 128, 128],   // medium grey, matches "2.0 - Management and Oversight" banner
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
          cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
        },
      }]);

      grouped[section].forEach((row) => {
        const firstCriterion = row.matches?.[0]?.criterion || "";
        const prefix = getSectionPrefix(firstCriterion);

        if (!prefixCounters[prefix]) prefixCounters[prefix] = 0;
        prefixCounters[prefix]++;
        const controlNum = `${prefix}-${String(prefixCounters[prefix]).padStart(2, "0")}`;

        const criteriaList = (row.matches?.map((m) => m.criterion) || []).join("\n");

        let testingStr = "";
        if (Array.isArray(row.testing_performed)) {
          testingStr = row.testing_performed.filter(s => s && s.trim()).join("\n\n");
        } else if (typeof row.testing_performed === "string") {
          testingStr = row.testing_performed;
        }

        const testing = testingStr && testingStr.trim() !== ""
          ? testingStr
          : "";

        const results = row.testing_results && row.testing_results !== "-- Select --"
          ? row.testing_results
          : "";

        // Split testing narrative into separate paragraphs by blank line
        const testParagraphs = testing
          .split(/\n\s*\n/)
          .map(p => p.trim())
          .filter(p => p.length > 0);

        // If no paragraphs (empty testing field), still create one row
        const paragraphsToRender = testParagraphs.length > 0 ? testParagraphs : [""];
        const rowSpanCount = paragraphsToRender.length;

        paragraphsToRender.forEach((paragraph, pIdx) => {
          if (pIdx === 0) {
            // First sub-row: include merged cells for Control #, Description, Criteria
            body.push([
              {
                content: controlNum,
                rowSpan: rowSpanCount,
                styles: { fontStyle: "bold", valign: "top", lineColor: [0, 0, 0], lineWidth: 0.3 }
              },
              {
                content: cleanText(row.control_text || ""),
                rowSpan: rowSpanCount,
                styles: { valign: "top", lineColor: [0, 0, 0], lineWidth: 0.3 }
              },
              {
                content: criteriaList,
                rowSpan: rowSpanCount,
                styles: { valign: "top", lineColor: [0, 0, 0], lineWidth: 0.3 }
              },
              {
                content: paragraph,
                styles: { valign: "top", lineColor: [0, 0, 0], lineWidth: 0.3 }
              },
              {
                content: results,
                styles: { valign: "top", lineColor: [0, 0, 0], lineWidth: 0.3 }
              },
            ]);
          } else {
            // Subsequent sub-rows: ONLY the testing paragraph cell and repeated results cell
            // (merged cells from row above cover the other columns)
            body.push([
              {
                content: paragraph,
                styles: { valign: "top", lineColor: [0, 0, 0], lineWidth: 0.3 }
              },
              {
                content: results,
                styles: { valign: "top", lineColor: [0, 0, 0], lineWidth: 0.3 }
              },
            ]);
          }
        });
      });
    });

    const doc = new jsPDF({ orientation: "landscape", format: "a4" });

    autoTable(doc, {
      startY: 15,
      head: [],
      body: body,
      theme: "plain",
      pageBreak: "auto",
      rowPageBreak: "avoid",
      tableWidth: 197,
      styles: {
        fontSize: 9,
        cellPadding: 5,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        valign: "top",
        textColor: [0, 0, 0],
        overflow: "linebreak",
        font: "times",        // reference uses a serif font, not helvetica
      },
      columnStyles: {
        0: { cellWidth: 16 },   // Control #
        1: { cellWidth: 62 },   // Control Description
        2: { cellWidth: 16 },   // Criteria
        3: { cellWidth: 80 },   // Testing Performed
        4: { cellWidth: 23 },   // Results of Test
      },
      margin: { top: 15, right: 10, bottom: 20, left: 10 },
      didDrawPage: (data) => {
        const totalPages = doc.internal.getNumberOfPages();
        const currentPage = data.pageNumber;
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "normal");
        doc.text(
          "PRIVATE AND CONFIDENTIAL",
          data.settings.margin.left,
          doc.internal.pageSize.height - 8
        );
        const generatedAt = new Date().toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        doc.text(
          `Generated: ${generatedAt}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 4
        );
        doc.text(
          `Page ${currentPage} of ${totalPages}`,
          doc.internal.pageSize.width - data.settings.margin.right,
          doc.internal.pageSize.height - 8,
          { align: "right" }
        );
      },
    });

    const today = new Date().toISOString().split("T")[0];
    const safeName = clientName.trim().replace(/\s+/g, '_') || 'CLIENT';
    doc.save(`EY_SOC_${safeName}_${today}.pdf`);
  };

  if (!editableResults || editableResults.length === 0) return null;

  return (
    <div className="space-y-[24px] border-t-[4px] border-t-[#FFE600]">
      <div style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px'}}>
        <label style={{fontSize: '12px', fontWeight: 700, color: '#6B7280', 
          textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap'}}>
          CLIENT NAME
        </label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Enter client name..."
          style={{
            flex: 1,
            maxWidth: '300px',
            height: '36px',
            border: 'none',
            borderBottom: '2px solid #FFE600',
            background: 'transparent',
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827',
            outline: 'none',
            padding: '0 8px'
          }}
        />
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4">
        <div>
          <h2 className="text-[16px] font-[700] text-[#111827] mb-1 pl-3 border-l-[4px] border-l-[#FFE600]">
            Review & Edit Mapping Results
          </h2>
          <p className="text-[#6B7280] text-[13px] max-w-2xl">
            {calculateSummaryLine()}
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="relative">
            <button
              onClick={() => setShowColumnToggle(!showColumnToggle)}
              className="flex items-center px-4 h-[40px] bg-[#FFFFFF] text-[#374151] font-[600] transition-colors duration-150 text-[13px] border border-[#E5E7EB] hover:bg-[#fff7cc] hover:border-[#FFE600]"
            >
              <svg className="w-[16px] h-[16px] mr-2 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              COLUMNS
            </button>

            {showColumnToggle && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowColumnToggle(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] border border-[#E5E7EB] z-50 p-2 text-[13px] font-[500] text-[#374151]">
                  <label className="flex items-center px-3 py-2 hover:bg-[#F9FAFB] cursor-not-allowed opacity-60">
                    <input type="checkbox" checked readOnly className="mr-3 w-4 h-4 accent-[#FFE600] border-[#E5E7EB]" /> Control #
                  </label>
                  <label className="flex items-center px-3 py-2 hover:bg-[#F9FAFB] cursor-not-allowed opacity-60">
                    <input type="checkbox" checked readOnly className="mr-3 w-4 h-4 accent-[#FFE600] border-[#E5E7EB]" /> Control Description
                  </label>
                  <label className="flex items-center px-3 py-2 hover:bg-[#F9FAFB] cursor-pointer transition-colors">
                    <input type="checkbox" checked={visibleColumns.criteria} onChange={() => setVisibleColumns({...visibleColumns, criteria: !visibleColumns.criteria})} className="mr-3 w-4 h-4 accent-[#FFE600] border-[#E5E7EB]" /> Criteria Mapped
                  </label>
                  <label className="flex items-center px-3 py-2 hover:bg-[#F9FAFB] cursor-pointer transition-colors">
                    <input type="checkbox" checked={visibleColumns.testing} onChange={() => setVisibleColumns({...visibleColumns, testing: !visibleColumns.testing})} className="mr-3 w-4 h-4 accent-[#FFE600] border-[#E5E7EB]" /> Testing Performed
                  </label>
                  <label className="flex items-center px-3 py-2 hover:bg-[#F9FAFB] cursor-pointer transition-colors">
                    <input type="checkbox" checked={visibleColumns.results} onChange={() => setVisibleColumns({...visibleColumns, results: !visibleColumns.results})} className="mr-3 w-4 h-4 accent-[#FFE600] border-[#E5E7EB]" /> Results
                  </label>
                  <label className="flex items-center px-3 py-2 hover:bg-[#F9FAFB] cursor-pointer transition-colors">
                    <input type="checkbox" checked={visibleColumns.comments} onChange={() => setVisibleColumns({...visibleColumns, comments: !visibleColumns.comments})} className="mr-3 w-4 h-4 accent-[#FFE600] border-[#E5E7EB]" /> Comments
                  </label>
                </div>
              </>
            )}
          </div>

          <button
            onClick={async () => {
              for (let i = 0; i < editableResults.length; i++) {
                await handleGenerateNarrative(i);
              }
            }}
            disabled={generatingRows.size > 0}
            className="flex items-center px-5 h-[40px] bg-[#FFFFFF] text-[#111827] hover:bg-[#FFFBCC] font-[800] tracking-[0.05em] uppercase transition-all duration-150 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed border-[2px] border-[#FFE600]"
          >
            ✦ GENERATE ALL
          </button>

          <button
            onClick={handleExportPDF}
            disabled={editableResults.length === 0}
            className="flex items-center px-5 h-[40px] bg-[#FFE600] text-[#111827] hover:bg-[#FFD700] hover:-translate-y-[1px] active:translate-y-[0px] font-[800] tracking-[0.05em] uppercase transition-all duration-150 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed border-l-[4px] border-l-[#D4A017]"
          >
            EXPORT PDF
          </button>
        </div>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E5E7EB] overflow-x-auto">
        <table className="w-full text-left table-fixed min-w-[1200px] border-collapse">
          <thead>
            <tr className="border-b-[2px] border-[#FFE600] bg-[#FAFAFA]">
              <th className="px-5 py-4 font-[600] text-[#9CA3AF] text-[11px] uppercase tracking-[0.08em] w-[3%] text-center border-r border-[#F0F0F0]">#</th>
              <th className="px-5 py-4 font-[600] text-[#9CA3AF] text-[11px] uppercase tracking-[0.08em] w-[20%] border-r border-[#F0F0F0]">Control Description</th>
              {visibleColumns.criteria && <th className="px-5 py-4 font-[600] text-[#9CA3AF] text-[11px] uppercase tracking-[0.08em] w-[15%] border-r border-[#F0F0F0]">Criteria</th>}
              {visibleColumns.testing && <th className="px-5 py-4 font-[600] text-[#9CA3AF] text-[11px] uppercase tracking-[0.08em] w-[30%] border-r border-[#F0F0F0]">Testing Performed</th>}
              {visibleColumns.results && <th className="px-5 py-4 font-[600] text-[#9CA3AF] text-[11px] uppercase tracking-[0.08em] w-[12%] border-r border-[#F0F0F0]">Results</th>}
              {visibleColumns.comments && <th className="px-5 py-4 font-[600] text-[#9CA3AF] text-[11px] uppercase tracking-[0.08em] w-[20%]">Comments</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {editableResults.map((r, idx) => (
              <tr key={idx} className="hover:bg-[#fffdf2] transition-colors duration-150 group" style={{ animation: `rowEntrance 0.3s ease-out ${idx * 60}ms both`, overflow:'visible' }}>
                <td className="px-3 py-5 align-top border-r border-[#F3F4F6]">
                  <div className="flex flex-col items-center pt-2">
                    {r.isNew ? (
                      <input
                        type="text"
                        value={r.control_number}
                        onChange={(e) => handleUpdateField(idx, 'control_number', e.target.value)}
                        className="w-8 bg-[#FFFFFF] text-[#111827] border border-[#E5E7EB] focus:border-[#FFE600] outline-none text-[13px] text-center font-[700] transition-colors"
                      />
                    ) : (
                      <span className="font-[700] text-[#111827] text-[13px]">{r.control_number}</span>
                    )}
                  </div>
                </td>

                <td className="px-5 py-4 align-top border-r border-[#F3F4F6]">
                  <div className="h-[100px] relative">
                    {r.isNew ? (
                      <textarea
                        className="w-full h-full bg-[#FFFFFF] text-[#374151] p-2 border border-transparent border-b-[2px] border-b-[#E5E7EB] outline-none text-[13px] focus:border-b-[2px] focus:border-b-[#FFE600] focus:bg-white transition-all resize-none scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pr-1"
                        value={r.control_text}
                        onChange={(e) => handleUpdateField(idx, "control_text", e.target.value)}
                        placeholder="Type target control..."
                      />
                    ) : (
                      <div className="text-[#374151] text-[13px] leading-relaxed p-1 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pr-1">
                        {r.control_text}
                      </div>
                    )}
                  </div>
                </td>

                {visibleColumns.criteria && (
                  <td className="px-5 py-4 align-top border-r border-[#F3F4F6]" style={{position:'relative', overflow:'visible'}}>
                    <div className="flex flex-col gap-2 h-full" style={{position:'relative'}}>
                      <div className="flex flex-wrap gap-2 items-start content-start transition-colors">
                        {r.matches && r.matches.map((m, mIdx) => (
                          <span
                            key={mIdx}
                            className="relative group/tag inline-flex items-center rounded-sm text-[12px] font-[700] text-[#92400E] bg-[#FFFBCC] border border-[#FFE600] pl-2 py-1 pr-6 transition-colors cursor-help"
                            onMouseEnter={(e) => handleMouseEnter(e, m)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <span className="tracking-wide font-mono">{m.criterion}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCriterion(idx, mIdx)}
                              className="absolute top-0 right-0 p-0.5 text-[#92400E] hover:text-[#EF4444] opacity-0 group-hover/tag:opacity-100 transition-opacity flex items-center justify-center"
                              title="Remove Tag"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                          </span>
                        ))}
                        <div className="relative">
                          <button
                            id={`addbtn-${idx}`}
                            type="button"
                            onClick={() => setOpenPickerIdx(openPickerIdx === idx ? null : idx)}
                            className="inline-flex items-center justify-center w-7 h-7 shrink-0 text-[#6B7280] bg-transparent hover:bg-[#FFFBCC] hover:text-[#111827] border border-dashed border-[#D1D5DB] hover:border-[#FFE600] transition-colors"
                            title="Add criterion"
                          >
                            <span className="text-[18px] font-[700] leading-none">+</span>
                          </button>
                          
                          {openPickerIdx === idx && (
                            <div id={`picker-${idx}`} style={{position:'absolute', top:'100%', left:0, width:'200px', maxHeight:'220px', overflowY:'auto', backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderTop:'2px solid #FFE600', boxShadow:'0 8px 16px rgba(0,0,0,0.15)', zIndex:9999}} onMouseDown={(e) => e.stopPropagation()} className="flex flex-col">
                              <input
                                type="text"
                                placeholder="Search criteria..."
                                value={pickerSearch}
                                onChange={(e) => setPickerSearch(e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 text-[12px] font-[500] border-b border-[#FFE600] outline-none focus:bg-[#FFFBCC] transition-colors"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Escape' && setOpenPickerIdx(null)}
                              />
                              <div className="flex-1 overflow-y-auto">
                                {ALL_CRITERIA.filter(c => 
                                  c.toLowerCase().includes(pickerSearch.toLowerCase())
                                ).map((criterion) => {
                                  const isAdded = r.matches?.some(m => m.criterion === criterion);
                                  return (
                                    <button
                                      key={criterion}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        if (!isAdded) handlePickCriterion(idx, criterion)
                                      }}
                                      className={`w-full h-8 px-3 text-[12px] font-[600] font-mono text-left border-b border-[#F3F4F6] last:border-b-0 flex items-center justify-between ${
                                        isAdded
                                          ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                                          : "hover:bg-[#FFFBCC] transition-colors cursor-pointer text-[#111827]"
                                      }`}
                                      disabled={isAdded}
                                    >
                                      <span>{criterion}</span>
                                      {isAdded && <span className="text-[#9CA3AF] font-bold">✓</span>}
                                    </button>
                                  );
                                })}
                                {ALL_CRITERIA.filter(c => 
                                  c.toLowerCase().includes(pickerSearch.toLowerCase())
                                ).length === 0 && (
                                  <div className="p-3 text-[11px] text-[#9CA3AF] text-center">
                                    {pickerSearch ? "No matches" : "All added"}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                )}

                {visibleColumns.testing && (
                  <td className="pl-0 pr-5 py-0 align-top border-r border-[#F3F4F6]">
                    <div className="flex flex-row items-stretch min-h-0">
                      <button
                        type="button"
                        onClick={() => handleGenerateNarrative(idx)}
                        disabled={generatingRows.has(idx)}
                        className={`
                          group/autogen w-8 shrink-0 self-stretch flex items-center justify-center
                          bg-[#FFFBCC] border-0 border-r-[2px] border-r-[#FFE600] border-solid
                          transition-colors duration-150
                          ${generatingRows.has(idx)
                            ? "cursor-wait"
                            : "cursor-pointer hover:bg-[#FFE600]"
                          }
                        `}
                      >
                        {generatingRows.has(idx) ? (
                          <svg className="animate-spin h-5 w-5 text-[#111827]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#92400E] group-hover/autogen:text-[#111827] [writing-mode:vertical-rl] [text-orientation:mixed]">
                            AUTO-GENERATE
                          </span>
                        )}
                      </button>
                      <div className="flex-1 flex flex-col gap-2 min-w-0 py-4 pl-3">
                        {typeof r.testing_performed === 'string' ? (
                          <textarea
                            value={r.testing_performed}
                            onChange={(e) => handleUpdateField(idx, "testing_performed", e.target.value)}
                            className="w-full min-w-0 bg-transparent text-[#374151] font-[500] text-[13px] outline-none border border-transparent border-b-[2px] border-b-[#E5E7EB] focus:border-[2px] focus:border-[#FFE600] focus:bg-[#FFFFFF] transition-all duration-150 resize-none placeholder-[#9CA3AF] p-2"
                            placeholder="Enter testing specifics or use Auto-Generate beside this field..."
                            rows={5}
                          />
                        ) : (
                          <div>
                            {(Array.isArray(r.testing_performed) ? r.testing_performed : [r.testing_performed || ""]).map((step, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-1">
                                <span className="text-[#FFE600] font-bold text-[14px] mt-2 select-none flex-shrink-0 leading-none">•</span>
                                <textarea
                                  value={step}
                                  onChange={(e) => handleUpdateTestingStep(idx, sIdx, e.target.value)}
                                  className="flex-1 min-w-0 bg-transparent text-[#374151] font-[500] text-[13px] outline-none border border-transparent border-b-[2px] border-b-[#E5E7EB] focus:border-[2px] focus:border-[#FFE600] focus:bg-[#FFFFFF] transition-all duration-150 resize-none placeholder-[#9CA3AF] p-2"
                                  placeholder={sIdx === 0 ? "Enter testing step..." : "Next step..."}
                                  rows={5}
                                />
                                {(Array.isArray(r.testing_performed) ? r.testing_performed : [""]).length > 1 && (
                                  <button
                                    onClick={() => handleRemoveTestingStep(idx, sIdx)}
                                    className="mt-2 text-[#9CA3AF] hover:text-[#EF4444] transition-colors p-0.5 flex-shrink-0"
                                    title="Remove step"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                )}

                {visibleColumns.results && (
                  <td className="px-5 py-4 align-top border-r border-[#F3F4F6]">
                    <div className="relative">
                      <div className={`absolute left-0 top-[20%] bottom-[20%] w-[3px] pointer-events-none z-10 transition-colors ${
                        r.testing_results === "No deviations noted" ? "bg-[#10B981]" :
                        r.testing_results === "Deviations noted" ? "bg-[#EF4444]" :
                        "bg-transparent"
                      }`}></div>
                      <select
                        value={r.testing_results}
                        onChange={(e) => handleUpdateField(idx, "testing_results", e.target.value)}
                        className={`w-full bg-transparent text-[#374151] font-[600] text-[13px] outline-none border border-transparent border-b-[2px] border-b-[#E5E7EB] focus:border-[2px] focus:border-[#FFE600] focus:bg-[#FFFFFF] transition-all duration-150 p-2 cursor-pointer appearance-none ${r.testing_results !== "-- Select --" ? "pl-3" : ""}`}
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111827%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.25rem top 50%', backgroundSize: '0.65rem auto' }}
                      >
                        {TESTING_RESULTS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                )}

                {visibleColumns.comments && (
                  <td className="px-5 py-4 align-top">
                    <textarea
                      value={r.comments}
                      onChange={(e) => handleUpdateField(idx, "comments", e.target.value)}
                      className="w-full bg-transparent text-[#374151] font-[500] text-[13px] outline-none border border-transparent border-b-[2px] border-b-[#E5E7EB] focus:border-[2px] focus:border-[#FFE600] focus:bg-[#FFFFFF] transition-all duration-150 resize-y min-h-[44px] placeholder-[#9CA3AF] p-2"
                      placeholder="Deviations or tags..."
                      rows={2}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <button
          onClick={handleAddRow}
          className="w-full flex items-center justify-center text-[#6B7280] hover:text-[#111827] font-[700] text-[13px] uppercase tracking-wide bg-transparent hover:bg-[#FFFBCC] py-[12px] border-[2px] border-dashed border-[#D1D5DB] hover:border-[#FFE600] transition-colors"
        >
          + ADD CONTROL ROW
        </button>
      </div>

      {hoveredResult && createPortal(
        <div
          className="fixed z-[100] w-max max-w-[340px] max-h-[400px] overflow-y-auto bg-[#FFFFFF] border border-[#E5E7EB] border-t-[4px] border-t-black p-5 pointer-events-none"
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
        </div>,
        document.body
      )}
    </div>
  );
}