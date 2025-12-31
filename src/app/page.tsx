export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { getDb } from "@/db/client";
import { todos } from "@/db/schema";
import { TodoInput } from "@/features/todo/components/TodoInput";
import { desc } from "drizzle-orm";

export default async function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allTodos: any[] = [];
  let errorMsg = null;
  let debugInfo = "";

  try {
    const db = getDb();
    allTodos = await db.select().from(todos).orderBy(desc(todos.createdAt));
  } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error(e);
    errorMsg = e.message || "Unknown Database Error";
    debugInfo = JSON.stringify(e, null, 2);
  }

  // If there was an error, SHOW IT on the screen
  if (errorMsg) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-10 bg-gray-50 text-red-600">
        <h1 className="text-3xl font-bold mb-4">⚠️ Database Connection Failed</h1>
        <div className="bg-white p-6 rounded shadow-md max-w-2xl w-full border border-red-200">
          <p className="text-lg font-semibold mb-2">Error Message:</p>
          <code className="block bg-red-50 p-3 rounded text-sm font-mono mb-4">{errorMsg}</code>
          
          <p className="text-sm font-semibold mb-1">Technical Details:</p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">{debugInfo}</pre>
        </div>
      </main>
    );
  }

  // Normal UI (Only runs if no error)
  return (
    <main className="min-h-screen flex flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">My D1 Todos</h1>
      
      <TodoInput />

      <ul className="w-full max-w-md mt-8">
        {allTodos.map((todo) => (
          <li key={todo.id} className="border-b p-3 flex justify-between items-center bg-white mb-2 shadow-sm rounded">
            <span>{todo.task}</span>
            <span className="text-xs text-gray-400">
              {todo.createdAt ? new Date(todo.createdAt).toLocaleTimeString() : ""}
            </span>
          </li>
        ))}
        {allTodos.length === 0 && (
          <p className="text-gray-500 text-center mt-4">No tasks yet.</p>
        )}
      </ul>
    </main>
  );
}