import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(req) {
  try {
    const { env } = getRequestContext();
    const { searchParams } = new URL(req.url);
    const requesterUid = searchParams.get('requester');

    // Default settings
    let userLang = 'English';
    
    // 1. Fetch User's Congregation Language
    if (requesterUid && requesterUid !== 'undefined') {
      const user = await env.DB.prepare('SELECT language FROM user WHERE firebaseUid = ?')
        .bind(requesterUid)
        .first();
      
      if (user) {
        userLang = user.language || 'English';
      }
    }

    // 2. Calculate Date Anchors
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const targetSunday = new Date(today);
    // Adjust to upcoming Sunday
    if (dayOfWeek !== 0) {
        targetSunday.setDate(today.getDate() + (7 - dayOfWeek));
    }
    const sundayStr = targetSunday.toISOString().split('T')[0];

    // 3. Define Filters based on Language
    // LOGIC: News from "Upcoming Sunday - 14 Days"
    const newsStartDate = new Date(targetSunday);
    newsStartDate.setDate(targetSunday.getDate() - 14);
    const newsStartStr = newsStartDate.toISOString().split('T')[0];

    let newsQuery = `
      SELECT title, description, news_date, language 
      FROM news 
      WHERE news_date >= ?
    `;

    // Language Filters
    if (userLang === 'English' || userLang === 'Tamil') {
        newsQuery += ` AND language IN ('Tamil', 'English')`;
    } else if (userLang === 'Sinhala') {
        newsQuery += ` AND language = 'Sinhala'`;
    }
    
    newsQuery += ` ORDER BY news_date DESC, title ASC`;

    const { results: newsRows } = await env.DB.prepare(newsQuery)
        .bind(newsStartStr)
        .all();

    // 4. Fetch Roster Logic (Hide for Sinhala)
    let rosterRows = [];
    if (userLang !== 'Sinhala') {
        const { results } = await env.DB.prepare(`
          SELECT rr.role_name, sr.assigned_person, sr.is_alternative
          FROM service_roster sr
          JOIN roster_roles rr ON sr.role_id = rr.id
          WHERE sr.service_date = ?
          ORDER BY rr.display_order ASC
        `).bind(sundayStr).all();
        rosterRows = results;
    }

    // 5. Fetch Special Dates (1 Month Window)
    // D1/SQLite: Extract Month using strftime and cast to integer
    const currentMonth = today.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

    const { results: specialRows } = await env.DB.prepare(`
      SELECT person_name, event_type, details, event_date 
      FROM special_dates 
      WHERE CAST(strftime('%m', event_date) AS INTEGER) IN (?, ?)
      ORDER BY strftime('%m', event_date), strftime('%d', event_date) ASC
    `).bind(currentMonth, nextMonth).all();

    // 6. Group News
    const groupedNews = newsRows.reduce((acc, item) => {
      const existing = acc.find(n => n.title === item.title);
      if (existing) {
        existing.items.push(item.description);
      } else {
        acc.push({
          title: item.title,
          date: item.news_date,
          lang: item.language,
          items: [item.description]
        });
      }
      return acc;
    }, []);

    return NextResponse.json({
      sundayDate: sundayStr,
      serverDate: today.toISOString(),
      userLanguage: userLang,
      news: groupedNews,
      roster: rosterRows,
      specialDates: specialRows
    });

  } catch (error) {
    console.error("News Feed Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}