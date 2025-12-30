'use client';

import { addTodo } from "../actions";

export function TodoInput() {
  return (
    <form action={addTodo} className="flex gap-2 mb-4">
      <input
        name="task"
        type="text"
        placeholder="Add a new task..."
        className="border p-2 rounded text-black"
        required
      />
      <button 
        type="submit" 
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Add
      </button>
    </form>
  );
}