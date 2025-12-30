export const dynamic = 'force-dynamic'; // <--- ADD THIS LINE
export const runtime = 'edge';
import { getDb } from "@/db/client";
import { todos } from "@/db/schema";
import { TodoInput } from "@/features/todo/components/TodoInput";
import { desc } from "drizzle-orm";

export default async function Home() {
  const db = getDb();
  
  // Fetch todos from D1 (Server-side)
  const allTodos = await db.select().from(todos).orderBy(desc(todos.createdAt));

  return (
    <main className="min-h-screen flex flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">My D1 Todos</h1>
      
      <TodoInput />

      <ul className="w-full max-w-md">
        {allTodos.map((todo) => (
          <li key={todo.id} className="border-b p-3 flex justify-between items-center">
            <span>{todo.task}</span>
            <span className="text-xs text-gray-400">
              {todo.createdAt?.toLocaleTimeString()}
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