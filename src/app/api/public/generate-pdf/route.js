import { NextResponse } from 'next/server';
import puppeteer from '@cloudflare/puppeteer'; // Must use this package
import { getDB } from '@/lib/db';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// ==================================================================
// 1. DATA FETCHING (Same as before)
// ==================================================================
async function fetchPdfData(requesterUid) {
    const db = getDB();
    let userLang = 'English';

    // 1. Get User Language
    if (requesterUid && requesterUid !== 'undefined') {
        const { results } = await db.prepare('SELECT language FROM user WHERE firebaseUid = ?')
            .bind(requesterUid)
            .all();
        if (results.length > 0) userLang = results[0].language || 'English';
    }

    // 2. Calculate Dates
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const targetSunday = new Date(today);
    if (dayOfWeek !== 0) targetSunday.setDate(today.getDate() + (7 - dayOfWeek));
    const sundayStr = targetSunday.toISOString().split('T')[0];

    const prevFriday = new Date(targetSunday);
    prevFriday.setDate(targetSunday.getDate() - 2);
    const nextFriday = new Date(targetSunday);
    nextFriday.setDate(targetSunday.getDate() + 5);
    const nextSaturday = new Date(targetSunday);
    nextSaturday.setDate(targetSunday.getDate() + 6);

    // 3. Fetch News
    let newsQuery = `SELECT title, description, news_date, language FROM news WHERE news_date BETWEEN ? AND ?`;
    let newsParams = [prevFriday.toISOString().split('T')[0], nextFriday.toISOString().split('T')[0]];

    if (userLang === 'Sinhala') newsQuery += ` AND language = 'Sinhala'`;
    else newsQuery += ` AND language IN ('English', 'Tamil')`;
    newsQuery += ` ORDER BY news_date ASC, title ASC`;

    const { results: newsRows } = await db.prepare(newsQuery).bind(...newsParams).all();

    // 4. Fetch Roster
    let rosterRows = [];
    if (userLang !== 'Sinhala') {
        const { results } = await db.prepare(`
          SELECT rr.role_name, sr.assigned_person, sr.is_alternative
          FROM service_roster sr
          JOIN roster_roles rr ON sr.role_id = rr.id
          WHERE sr.service_date = ?
          ORDER BY rr.display_order ASC
        `).bind(sundayStr).all();
        rosterRows = results;
    }

    // 5. Fetch Special Dates (SQLite Syntax)
    const startM = targetSunday.getMonth() + 1;
    const startD = targetSunday.getDate();
    const endM = nextSaturday.getMonth() + 1;
    const endD = nextSaturday.getDate();

    let birthdayQuery = '';
    if (startM === endM) {
        birthdayQuery = `AND (CAST(strftime('%m', event_date) AS INTEGER) = ${startM} AND CAST(strftime('%d', event_date) AS INTEGER) BETWEEN ${startD} AND ${endD})`;
    } else {
        birthdayQuery = `AND (
            (CAST(strftime('%m', event_date) AS INTEGER) = ${startM} AND CAST(strftime('%d', event_date) AS INTEGER) >= ${startD}) 
            OR 
            (CAST(strftime('%m', event_date) AS INTEGER) = ${endM} AND CAST(strftime('%d', event_date) AS INTEGER) <= ${endD})
        )`;
    }

    const { results: specialRows } = await db.prepare(`
        SELECT person_name, event_type, details, event_date 
        FROM special_dates 
        WHERE 1=1 ${birthdayQuery} 
        ORDER BY CAST(strftime('%m', event_date) AS INTEGER), CAST(strftime('%d', event_date) AS INTEGER) ASC
    `).all();

    // Group News
    const groupedNews = newsRows.reduce((acc, item) => {
        const existing = acc.find(n => n.title === item.title);
        if (existing) existing.items.push(item.description);
        else acc.push({ title: item.title, items: [item.description] });
        return acc;
    }, []);

    return {
        meta: { sundayDate: sundayStr, weekRange: `${targetSunday.toLocaleDateString()} - ${nextSaturday.toLocaleDateString()}` },
        userLang,
        news: groupedNews,
        roster: rosterRows,
        specialDates: specialRows
    };
}

// ==================================================================
// 2. HTML GENERATOR (UNCHANGED)
// ==================================================================
const generateHtml = (data, uiText, logoBase64) => {
    // Process Roster
    const rosterGroups = {};
    data.roster.forEach(item => {
        if (!rosterGroups[item.role_name]) rosterGroups[item.role_name] = { main: [], alt: [] };
        const names = item.assigned_person.split(/[,/]/).map(n => n.trim()).filter(n => n && n !== '0' && n !== 'null');
        if (item.is_alternative) rosterGroups[item.role_name].alt.push(...names);
        else rosterGroups[item.role_name].main.push(...names);
    });

    const weekDates = [];
    const startDate = new Date(data.meta.sundayDate);
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        weekDates.push(d);
    }

    const eventsByDate = {};
    data.specialDates.forEach(ev => {
        const evDate = new Date(ev.event_date);
        const key = `${evDate.getMonth()}-${evDate.getDate()}`;
        if (!eventsByDate[key]) eventsByDate[key] = { birthdays: [], anniversaries: [] };
        
        if (ev.event_type && ev.event_type.toLowerCase().includes('birthday')) {
            eventsByDate[key].birthdays.push(ev.person_name);
        } else {
            eventsByDate[key].anniversaries.push(ev.person_name);
        }
    });

    const celebrationRows = weekDates.map(dateObj => {
        const key = `${dateObj.getMonth()}-${dateObj.getDate()}`;
        const events = eventsByDate[key];
        if (events) {
            return {
                day: dateObj.getDate(),
                dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
                birthdays: events.birthdays,
                anniversaries: events.anniversaries
            };
        }
        return null;
    }).filter(row => row !== null);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Sans+Sinhala:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Noto Sans', 'Noto Sans Sinhala', 'Noto Sans Tamil', sans-serif; color: #1e293b; padding: 0px 10px; font-size: 12px; line-height: 1.4; }
            .sidebar { float: right; width: 38%; margin-left: 20px; margin-bottom: 20px; }
            .main-content-wrapper { display: block; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px; break-inside: avoid; }
            .dates-card { background: #fffbeb; border-color: #fbbf24; }
            h3 { font-size: 13px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin-top: 0; margin-bottom: 10px; color: #334155; }
            .roster-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; }
            .roster-role { font-weight: bold; color: #64748b; }
            .roster-name { font-weight: bold; color: #0f172a; text-align: right; }
            .celebration-table { width: 100%; border-collapse: collapse; font-size: 10px; }
            .celebration-table th { text-align: left; color: #f5e3d5ff; font-weight: bold; padding-bottom: 4px; border-bottom: 2px solid #fcd34d; text-transform: uppercase; font-size: 9px; }
            .celebration-table td { padding: 6px 2px; vertical-align: top; border-bottom: 1px solid #fef3c7; }
            .date-badge { background: #f2e6beff; color: #4a2007ff; font-weight: bold; border-radius: 6px; padding: 3px 0; text-align: center; display: block; width: 32px; box-shadow: 1px 1px 0px rgba(0,0,0,0.1); line-height: 1.1; }
            .day-name { display: block; font-size: 8px; text-transform: uppercase; opacity: 0.85; }
            .person-tag { margin-bottom: 3px; padding: 2px 5px; border-radius: 4px; font-weight: bold; display: block; font-size: 9px; }
            .bday-tag { background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
            .anni-tag { background-color: #fce7f3; color: #000000ff; border: 1px solid #fbcfe8; }
            .news-header { font-size: 15px; font-weight: bold; text-transform: uppercase; border-bottom: 3px solid #1e3a8a; padding-bottom: 5px; margin-bottom: 15px; color: #1e3a8a; clear: none; }
            .news-item { margin-bottom: 20px; }
            .news-title { font-size: 13px; font-weight: bold; color: #1d4ed8; display: block; margin-bottom: 4px; page-break-after: avoid; }
            .news-desc { font-size: 12px; color: #334155; text-align: justify; margin-bottom: 4px; border-left: 3px solid #e2e8f0; padding-left: 10px; break-inside: avoid; }
            .title-header { display: flex; align-items: center; justify-content: flex-start; margin-bottom: 20px; border-bottom: none; }
            .title-text { text-align: left; }
            .verse-box { background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 12px; margin-bottom: 25px; border-radius: 4px; clear: both; }
        </style>
    </head>
    <body>
        <div class="title-header">
             ${logoBase64 ? `<img src="${logoBase64}" style="width: 50px; height: auto; margin-right: 15px;" />` : ''}
             <div class="title-text">
                <h1 style="color: #1e3a8a; font-size: 22px; margin: 0; text-transform: uppercase; line-height: 1.1;">The Grace Evangelical Church</h1>
                <p style="color: #64748b; font-weight: bold; margin: 2px 0 0 0; font-size: 11px;">Weekly Bulletin • ${data.meta.weekRange}</p>
             </div>
        </div>
        <div class="verse-box">
            <div style="font-style: italic; font-size: 13px; margin-bottom: 4px; color: #0f172a;">"${uiText.verse}"</div>
            <div style="font-size: 10px; font-weight: bold; color: #0284c7; text-transform: uppercase;">${uiText.verseRef}</div>
        </div>
        <div class="main-content-wrapper">
            <div class="sidebar">
                <div class="card">
                    <h3 style="border-color: #94a3b8;">${uiText.roster}</h3>
                    ${Object.entries(rosterGroups).map(([role, peeps]) => `
                        <div class="roster-row">
                            <span class="roster-role">${role}</span>
                            <div>
                                <div class="roster-name">${peeps.main.join(', ') || '-'}</div>
                                ${peeps.alt.length ? `<div style="font-style:italic; color:#b45309; font-size:10px; text-align:right;">Alt: ${peeps.alt.join(', ')}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${celebrationRows.length > 0 ? `
                <div class="card dates-card">
                    <h3 style="color: #b45309; border-color: #fcd34d;">${uiText.celebrations}</h3>
                    <table class="celebration-table">
                        <thead><tr><th style="width: 25%">Date</th><th style="width: 37%">B'Day</th><th style="width: 38%">Anniv</th></tr></thead>
                        <tbody>
                            ${celebrationRows.map(row => `
                                <tr>
                                    <td>
                                        <div class="date-badge">${row.day}<span class="day-name">${row.dayName}</span></div>
                                    </td>
                                    <td>${row.birthdays.length > 0 ? row.birthdays.map(n => `<span class="person-tag bday-tag">${n}</span>`).join('') : '<span style="color:#cbd5e1">-</span>'}</td>
                                    <td>${row.anniversaries.length > 0 ? row.anniversaries.map(n => `<span class="person-tag anni-tag">${n}</span>`).join('') : '<span style="color:#cbd5e1">-</span>'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>` : ''}
            </div>
            <div class="news-block">
                <div class="news-header">${uiText.latestNews}</div>
                ${data.news.length === 0 ? `<p style="font-style:italic;">${uiText.noNews}</p>` : ''}
                ${data.news.map(item => `
                    <div class="news-item">
                        <span class="news-title">${item.title}</span>
                        ${item.items.map(desc => `<div class="news-desc">${desc}</div>`).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
    </body>
    </html>
    `;
};

// ==================================================================
// 3. MAIN API HANDLER
// ==================================================================
export async function GET(req) {
    try {
        // 1. Get Context and Environment
        // This is critical for Cloudflare Bindings
        const { env } = getRequestContext();

        // ----------------------------------------------------
        // DIAGNOSTIC CHECK: Is the Browser Binding Found?
        // ----------------------------------------------------
        if (!env || !env.MYBROWSER) {
            console.error("FATAL: Browser Binding (MYBROWSER) is undefined.");
            console.error("Available Env Keys:", env ? Object.keys(env) : "env is null");
            return NextResponse.json({ 
                error: "Configuration Error: Browser binding 'MYBROWSER' not found. Please check wrangler.toml and Cloudflare Dashboard." 
            }, { status: 500 });
        }

        const { searchParams } = new URL(req.url);
        const requesterUid = searchParams.get('requester');

        // 2. Fetch Data
        const data = await fetchPdfData(requesterUid);

        // 3. Logo Handling (Base64 or URL)
        let logoBase64 = null; 
        // Note: fs.readFileSync is NOT available in Cloudflare. 
        // If you need the logo, you must paste the long base64 string here 
        // or fetch it from a public URL like:
        // const r = await fetch('https://example.com/logo.png'); const b = await r.arrayBuffer(); ...

        const UI_TEXT = {
            English: { verse: "Give ear, O Lord, to my prayer...", verseRef: "Psalm 86:6", latestNews: "Latest News", roster: "Duty Roster", celebrations: "Celebrations", noNews: "No news this week." },
            Tamil: { verse: "கர்த்தாவே, என் ஜெபத்திற்குச் செவிகொடுத்து...", verseRef: "சங்கீதம் 86 : 6", latestNews: "சமீபத்திய செய்திகள்", roster: "பணி பட்டியல்", celebrations: "கொண்டாட்டங்கள்", noNews: "செய்திகள் இல்லை." },
            Sinhala: { verse: "ස්වාමීනි, මාගේ යාච්ඤාවට කන් දුන මැනව...", verseRef: "ගීතාවලිය 86:6", latestNews: "නවතම පුවත්", roster: "රාජකාරි ලැයිස්තුව", celebrations: "සැමරුම්", noNews: "පුවත් නැත." }
        };
        const lang = data.userLang || 'English';
        const uiText = UI_TEXT[lang] || UI_TEXT['English'];

        // 4. Generate HTML
        const htmlContent = generateHtml(data, uiText, logoBase64);

        // 5. Launch Puppeteer (The part that was failing)
        // We now safely pass the binding we checked earlier
        const browser = await puppeteer.launch({ binding: env.MYBROWSER });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const headerTemplate = `
            <div style="font-family: 'Noto Sans', sans-serif; width: 100%; font-size: 10px; padding: 0 20px; display: flex; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-bottom: 10px;">
                ${logoBase64 ? `<img src="${logoBase64}" style="width: 25px; height: 25px; margin-right: 10px;" />` : ''}
                <span style="font-weight: bold; color: #1e3a8a; font-size: 12px; text-transform: uppercase;">The Grace Evangelical Church</span>
                <span style="flex-grow: 1;"></span>
                <span style="color: #64748b;">${data.meta.sundayDate}</span>
            </div>
        `;

        const footerTemplate = `
            <div style="font-family: 'Noto Sans', sans-serif; width: 100%; font-size: 8px; border-top: 1px solid #cbd5e1; padding: 5px 20px; display: flex; justify-content: space-between; color: #64748b;">
                <span>www.thegraceevangelicalchurch.lk</span>
                <span>Soli Deo Gloria</span>
                <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            </div>
        `;

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: headerTemplate,
            footerTemplate: footerTemplate,
            margin: { top: '25mm', right: '15mm', bottom: '20mm', left: '15mm' }
        });

        await browser.close();

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Bulletin_${data.meta.sundayDate}_${lang}.pdf"`
            }
        });

    } catch (error) {
        console.error("PDF Gen Error Stack:", error.stack);
        return NextResponse.json({ error: "Failed to generate PDF: " + error.message }, { status: 500 });
    }
}