
import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    
    expect(result).toEqual([]);
  });

  it('should return all tasks', async () => {
    // Create test tasks
    await db.insert(tasksTable).values([
      {
        title: 'First Task',
        description: 'First task description',
        completed: false
      },
      {
        title: 'Second Task',
        description: null,
        completed: true
      }
    ]).execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBeDefined();
    expect(result[0].description).toBeDefined();
    expect(result[0].completed).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return tasks ordered by creation date (newest first)', async () => {
    // Create tasks with different timestamps
    const firstTask = await db.insert(tasksTable).values({
      title: 'Older Task',
      description: 'Created first',
      completed: false
    }).returning().execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondTask = await db.insert(tasksTable).values({
      title: 'Newer Task',
      description: 'Created second',
      completed: false
    }).returning().execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    // Newest should be first
    expect(result[0].title).toEqual('Newer Task');
    expect(result[1].title).toEqual('Older Task');
    
    // Verify ordering by comparing timestamps
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle tasks with nullable description', async () => {
    await db.insert(tasksTable).values([
      {
        title: 'Task with description',
        description: 'Has description',
        completed: false
      },
      {
        title: 'Task without description',
        description: null,
        completed: false
      }
    ]).execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    // Find tasks by title to verify description handling
    const taskWithDesc = result.find(t => t.title === 'Task with description');
    const taskWithoutDesc = result.find(t => t.title === 'Task without description');
    
    expect(taskWithDesc?.description).toEqual('Has description');
    expect(taskWithoutDesc?.description).toBeNull();
  });
});
