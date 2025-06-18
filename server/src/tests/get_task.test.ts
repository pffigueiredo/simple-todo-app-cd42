
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput } from '../schema';
import { getTask } from '../handlers/get_task';

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when it exists', async () => {
    // Create a test task first
    const taskData = {
      title: 'Test Task',
      description: 'A task for testing',
      completed: false
    };

    const insertResult = await db.insert(tasksTable)
      .values(taskData)
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Test the handler
    const input: GetTaskInput = { id: createdTask.id };
    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.title).toEqual('Test Task');
    expect(result!.description).toEqual('A task for testing');
    expect(result!.completed).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when task does not exist', async () => {
    const input: GetTaskInput = { id: 999 };
    const result = await getTask(input);

    expect(result).toBeNull();
  });

  it('should handle task with null description', async () => {
    // Create a task with null description
    const taskData = {
      title: 'Task with null description',
      description: null,
      completed: true
    };

    const insertResult = await db.insert(tasksTable)
      .values(taskData)
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Test the handler
    const input: GetTaskInput = { id: createdTask.id };
    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.title).toEqual('Task with null description');
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
