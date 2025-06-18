
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a task for testing
const createTaskForTest = async (input: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: input.title,
      description: input.description,
      completed: false
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title', async () => {
    // Create initial task
    const createInput: CreateTaskInput = {
      title: 'Original Task',
      description: 'Original description'
    };
    const createdTask = await createTaskForTest(createInput);

    // Update title
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdTask.updated_at).toBe(true);
  });

  it('should update task description to null', async () => {
    // Create initial task
    const createInput: CreateTaskInput = {
      title: 'Test Task',
      description: 'Original description'
    };
    const createdTask = await createTaskForTest(createInput);

    // Update description to null
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result.description).toBeNull();
    expect(result.title).toEqual('Test Task'); // Unchanged
  });

  it('should update task completion status', async () => {
    // Create initial task
    const createInput: CreateTaskInput = {
      title: 'Test Task',
      description: null
    };
    const createdTask = await createTaskForTest(createInput);

    // Update completed status
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.completed).toBe(true);
    expect(result.title).toEqual('Test Task'); // Unchanged
    expect(result.description).toBeNull(); // Unchanged
  });

  it('should update multiple fields at once', async () => {
    // Create initial task
    const createInput: CreateTaskInput = {
      title: 'Original Task',
      description: 'Original description'
    };
    const createdTask = await createTaskForTest(createInput);

    // Update multiple fields
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toBe(true);
    expect(result.updated_at > createdTask.updated_at).toBe(true);
  });

  it('should save updated task to database', async () => {
    // Create initial task
    const createInput: CreateTaskInput = {
      title: 'Database Test Task',
      description: 'Test description'
    };
    const createdTask = await createTaskForTest(createInput);

    // Update task
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Database Task',
      completed: true
    };

    await updateTask(updateInput);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Updated Database Task');
    expect(tasks[0].description).toEqual('Test description'); // Unchanged
    expect(tasks[0].completed).toBe(true);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should only update updated_at when no other fields provided', async () => {
    // Create initial task
    const createInput: CreateTaskInput = {
      title: 'Time Update Test',
      description: 'Test description'
    };
    const createdTask = await createTaskForTest(createInput);

    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with only ID (should only update timestamp)
    const updateInput: UpdateTaskInput = {
      id: createdTask.id
    };

    const result = await updateTask(updateInput);

    expect(result.title).toEqual(createdTask.title); // Unchanged
    expect(result.description).toEqual(createdTask.description); // Unchanged
    expect(result.completed).toEqual(createdTask.completed); // Unchanged
    expect(result.updated_at > createdTask.updated_at).toBe(true); // Changed
  });
});
