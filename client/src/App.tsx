
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Plus, CheckCircle2, Circle, Calendar } from 'lucide-react';
import type { Task, CreateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state for creating new tasks
  const [createFormData, setCreateFormData] = useState<CreateTaskInput>({
    title: '',
    description: null
  });

  // Form state for editing tasks
  const [editFormData, setEditFormData] = useState<CreateTaskInput>({
    title: '',
    description: null
  });

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Create new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.title.trim()) return;
    
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(createFormData);
      setTasks((prev: Task[]) => [newTask, ...prev]);
      setCreateFormData({ title: '', description: null });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle task completion
  const handleToggleComplete = async (task: Task) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: task.id,
        completed: !task.completed
      });
      setTasks((prev: Task[]) => 
        prev.map((t: Task) => t.id === task.id ? updatedTask : t)
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Start editing a task
  const startEditing = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description
    });
  };

  // Update task
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editFormData.title.trim()) return;

    setIsLoading(true);
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: editingTask.id,
        title: editFormData.title,
        description: editFormData.description
      });
      setTasks((prev: Task[]) => 
        prev.map((t: Task) => t.id === editingTask.id ? updatedTask : t)
      );
      setEditingTask(null);
      setEditFormData({ title: '', description: null });
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Stats
  const completedTasks = tasks.filter((task: Task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✅ Todo Manager</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingTasks}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Create Task Button */}
        <div className="mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your todo list. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask}>
                <div className="space-y-4 py-4">
                  <div>
                    <Input
                      placeholder="Task title (required)"
                      value={createFormData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateTaskInput) => ({ 
                          ...prev, 
                          title: e.target.value 
                        }))
                      }
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Description (optional)"
                      value={createFormData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateTaskInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      rows={3}
                      className="w-full"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || !createFormData.title.trim()}>
                    {isLoading ? 'Creating...' : 'Create Task'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No tasks yet!</h3>
                <p className="text-gray-500 mb-4">
                  Create your first task to get started with your productivity journey.
                </p>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Task
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task: Task) => (
              <Card key={task.id} className={`transition-all hover:shadow-md ${
                task.completed ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleComplete(task)}
                        className="data-[state=checked]:border-green-500 data-[state=checked]:bg-green-500"
                      />
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${
                            task.completed 
                              ? 'line-through text-gray-500' 
                              : 'text-gray-900'
                          }`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className={`text-sm mt-1 ${
                              task.completed 
                                ? 'line-through text-gray-400' 
                                : 'text-gray-600'
                            }`}>
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-3">
                            <Badge variant={task.completed ? 'default' : 'secondary'}>
                              {task.completed ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</>
                              ) : (
                                <><Circle className="w-3 h-3 mr-1" /> Pending</>
                              )}
                            </Badge>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              Created {task.created_at.toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Dialog 
                            open={editingTask?.id === task.id} 
                            onOpenChange={(open: boolean) => {
                              if (!open) {
                                setEditingTask(null);
                                setEditFormData({ title: '', description: null });
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(task)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Task</DialogTitle>
                                <DialogDescription>
                                  Make changes to your task details below.
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleUpdateTask}>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <Input
                                      placeholder="Task title (required)"
                                      value={editFormData.title}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setEditFormData((prev: CreateTaskInput) => ({ 
                                          ...prev, 
                                          title: e.target.value 
                                        }))
                                      }
                                      required
                                      className="w-full"
                                    />
                                  </div>
                                  <div>
                                    <Textarea
                                      placeholder="Description (optional)"
                                      value={editFormData.description || ''}
                                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                        setEditFormData((prev: CreateTaskInput) => ({
                                          ...prev,
                                          description: e.target.value || null
                                        }))
                                      }
                                      rows={3}
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingTask(null);
                                      setEditFormData({ title: '', description: null });
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={isLoading || !editFormData.title.trim()}>
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{task.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        {tasks.length > 0 && (
          <div className="mt-8 text-center">
            <Separator className="mb-4" />
            <p className="text-sm text-gray-500">
              🎉 You have {completedTasks} completed task{completedTasks !== 1 ? 's' : ''} out of {tasks.length} total
              {pendingTasks > 0 && `. Keep going, ${pendingTasks} more to go!`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
