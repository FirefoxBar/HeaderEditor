import {
  getLastTaskRun,
  getTask as innerGetTask,
  getTasks as innerGetTasks,
  removeTask,
  runTaskAndSave,
  saveTask,
} from '../core/task';

export { removeTask, saveTask };

export async function runTask(key: string) {
  const task = await innerGetTask(key);
  if (task) {
    return runTaskAndSave(task);
  }
}

export async function getTask(key: string) {
  const task = await innerGetTask(key);
  if (!task) {
    return;
  }
  task.lastRun = getLastTaskRun(key);
  return task;
}

export async function getTasks() {
  const result = await innerGetTasks();

  result.forEach(task => (task.lastRun = getLastTaskRun(task.key)));

  return result;
}
