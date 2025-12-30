'use server';


import { getDb } from "@/db/client";
import { todos } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function addTodo(formData: FormData) {
  const task = formData.get("task") as string;
  
  if (!task) return;

  const db = getDb();
  
  // Insert into D1
  await db.insert(todos).values({
    task: task,
  });

  // Refresh the UI
  revalidatePath("/");
}
