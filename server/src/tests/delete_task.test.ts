
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteTaskInput = {
  id: 1
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a test task first
    await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing deletion',
        completed: false
      })
      .execute();

    // Verify task exists
    const tasksBefore = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, 1))
      .execute();
    
    expect(tasksBefore).toHaveLength(1);

    // Delete the task
    const result = await deleteTask(testInput);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify task no longer exists in database
    const tasksAfter = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, 1))
      .execute();

    expect(tasksAfter).toHaveLength(0);
  });

  it('should throw error when task does not exist', async () => {
    // Try to delete non-existent task
    await expect(deleteTask({ id: 999 })).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should not affect other tasks when deleting one task', async () => {
    // Create multiple test tasks
    await db.insert(tasksTable)
      .values([
        {
          title: 'Task 1',
          description: 'First task',
          completed: false
        },
        {
          title: 'Task 2', 
          description: 'Second task',
          completed: true
        },
        {
          title: 'Task 3',
          description: 'Third task',
          completed: false
        }
      ])
      .execute();

    // Delete middle task (id: 2)
    const result = await deleteTask({ id: 2 });

    expect(result.success).toBe(true);

    // Verify other tasks still exist
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    expect(remainingTasks.map(t => t.id)).toEqual([1, 3]);
    expect(remainingTasks.map(t => t.title)).toEqual(['Task 1', 'Task 3']);
  });
});
