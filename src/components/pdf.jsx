import React, { forwardRef } from 'react';
import { Calendar } from 'lucide-react';

const PdfDocument = forwardRef(function PdfDocument({ pdfData, lang, uiText, logoBase64, helpers }, ref) {
  // If no data, render nothing
  if (!pdfData) return null;

  // Use helpers passed from Main to process data locally for the view
  const pdfRosterData = helpers.processRosterData(pdfData.roster);
  const pdfCalendarGrid = helpers.processCalendarGrid(pdfData.specialDates, pdfData.meta.sundayDate);
  const text = uiText[lang];

  return (
    <div ref={ref} style={{ 
        width: "210mm", 
        backgroundColor: "white", 
        padding: "15mm", 
        paddingBottom: "80px", 
        color: "#1e293b", 
        fontFamily: "Arial, sans-serif", 
        boxSizing: "border-box" 
    }}>
      <div style={{ position: 'relative' }}> 
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: "3px solid #1e3a8a", paddingBottom: "15px", marginBottom: "20px" }}>
          <div style={{ marginRight: '20px' }}>{logoBase64 && <img src={logoBase64} alt="Logo" style={{ width: "80px", height: 'auto', display: 'block' }}/>}</div>
          <div style={{ flexGrow: 1 }}>
            <h1 style={{ fontSize: "26px", fontWeight: "900", textTransform: "uppercase", margin: "0", color: "#1e3a8a", lineHeight: "1.1" }}>The Grace Evangelical Church</h1>
            <p style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", margin: "5px 0 0 0" }}>Weekly Bulletin • {pdfData.meta.weekRange}</p>
          </div>
        </div>

        {/* VERSE */}
        <div style={{ backgroundColor: "#f0f9ff", padding: "12px", borderRadius: "6px", borderLeft: "4px solid #0ea5e9", marginBottom: "25px" }}>
          <p style={{ fontSize: "14px", fontStyle: "italic", marginBottom: "4px", color: "#0f172a", fontWeight: "500", fontFamily: 'Georgia, serif' }}>{text.verse}</p>
          <p style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#0284c7", margin: 0 }}>{text.verseRef}</p>
        </div>

        {/* MAIN BODY */}
        <div style={{ display: "block", position: "relative" }}>
          
          {/* SIDEBAR */}
          <div style={{ 
              float: "right", 
              width: "40%", 
              marginLeft: "25px", 
              marginBottom: "20px",
              display: "flex", 
              flexDirection: "column", 
              gap: "25px" 
          }}>
            
            {/* Roster */}
            <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1px solid #cbd5e1", paddingBottom: "5px", marginBottom: "8px", color: "#334155" }}>
                {text.roster} <span style={{ fontSize: '9px', float:'right', color:'#64748b' }}>{pdfData.meta.sundayDate}</span>
              </h3>
              {pdfRosterData.map((r, idx) => (
                <div key={idx} style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "10px" }}>
                  <span style={{ fontWeight: "bold", textTransform: "uppercase", color: "#64748b", width: "40%" }}>{r.role}</span>
                  <div style={{ width: "60%", textAlign: "right" }}>
                    <span style={{ fontWeight: "bold", display: "block", color: "#0f172a" }}>{r.main.join(", ") || "-"}</span>
                    {r.alt.length > 0 && <span style={{ display: "block", fontStyle: "italic", color: "#b45309", fontSize: "9px" }}>Alt: {r.alt.join(", ")}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Celebrations */}
            {pdfCalendarGrid.length > 0 && (
              <div style={{ padding: "12px", borderRadius: "8px", border: "2px solid #fbbf24", backgroundColor: "#fffbeb", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "10px", right: "5px", opacity: 0.1, zIndex: 0 }}><Calendar size={80} color="#b45309" /></div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px", color: "#b45309" }}>{text.celebrations}</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '25%', borderBottom: '2px solid #fcd34d', padding: '4px', textAlign: 'left', color: '#92400e', fontSize: '10px' }}>Date</th>
                        <th style={{ width: '37.5%', borderBottom: '2px solid #fcd34d', padding: '4px', textAlign: 'center', color: '#92400e', fontSize: '10px' }}>Birthday</th>
                        <th style={{ width: '37.5%', borderBottom: '2px solid #fcd34d', padding: '4px', textAlign: 'center', color: '#92400e', fontSize: '10px' }}>Anniversary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pdfCalendarGrid.map((day, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #fcd34d' }}>
                           <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 'bold', color: '#78350f', fontSize: '10px', lineHeight: '1.2' }}>{day.dayName}</div>
                              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#d97706' }}>{day.dayNum}</div>
                           </td>
                           <td style={{ padding: '6px 4px', verticalAlign: 'top', textAlign: 'center' }}>
                              {day.birthdays.length > 0 ? (day.birthdays.map((n, x) => <div key={x} style={{ fontSize:'10px', fontWeight:'500', marginBottom:'2px' }}>{n}</div>)) : <span style={{color:'#d1d5db', fontSize:'10px'}}>-</span>}
                           </td>
                           <td style={{ padding: '6px 4px', verticalAlign: 'top', textAlign: 'center' }}>
                              {day.anniversaries.length > 0 ? (day.anniversaries.map((n, x) => <div key={x} style={{ fontSize:'10px', fontWeight:'500', marginBottom:'2px' }}>{n}</div>)) : <span style={{color:'#d1d5db', fontSize:'10px'}}>-</span>}
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* NEWS ITEMS */}
          <div style={{ width: "100%" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", paddingBottom: "5px", marginBottom: "15px", color: "#0f172a" }}>
              {text.latestNews}
            </h2>
            
            {pdfData.news.length > 0 ? (
                <ol className="pdf-item" style={{ paddingLeft: "0", margin: "0", listStylePosition: "inside" }}>
                {pdfData.news.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "30px", color: "#1d4ed8", fontWeight: "bold", fontSize: "13px" }}>
                    <span style={{ color: "#1d4ed8" }}>{item.title}</span>
                    <div style={{ marginTop: "8px", paddingLeft: "12px", borderLeft: "3px solid #e2e8f0", marginLeft: "5px" }}>
                        {item.items.map((desc, i) => (
                            <p key={i} style={{ margin: "0 0 12px 0", color: "#334155", fontSize: "11px", lineHeight: "1.6", fontWeight: "normal", textAlign: "justify" }}>
                                {desc}
                            </p>
                        ))}
                    </div>
                    </li>
                ))}
                </ol>
            ) : <p style={{ fontStyle: "italic", fontSize: "11px" }}>{text.noNews}</p>}
          </div> 
        </div> 
      </div>
    </div>
  );
});

PdfDocument.displayName = 'PdfDocument';

export default PdfDocument;