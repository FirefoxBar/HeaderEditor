import type { Task } from '@/share/core/types';

export const EMPTY_TASK: Task = {
  key: '',
  name: '',
  execute: 'once',
  isFunction: false,
};

export interface TaskInput extends Omit<Task, 'fetch'> {
  editHeader?: Array<{ name: string; value: string }>;
  shouldRetry?: boolean;
  fetch?: Omit<Task['fetch'], 'validator'> & {
    validator?: string;
  };
}

export function getInput(task: Task): TaskInput {
  const res: any = { ...task };
  if (task.fetch?.headers) {
    res.editHeader = Object.entries(res.fetch.headers).map(([name, value]) => ({
      name,
      value,
    }));
    delete res.fetch.headers;
  }
  if (task.retry) {
    res.shouldRetry = true;
  }
  if (res.fetch?.validator) {
    res.fetch.validator = JSON.stringify(res.fetch.validator.trim());
  }
  return res;
}

export function getTaskFromInput(input: TaskInput): Task {
  const res: any = { ...input };
  if (Array.isArray(input.editHeader) && res.fetch) {
    res.fetch.headers = Object.fromEntries(
      input.editHeader.filter(x => Boolean(x.name)).map(x => [x.name, x.value]),
    );
  }
  if (input.fetch?.validator) {
    res.fetch.validator = JSON.parse(res.fetch.validator);
  }
  delete res.shouldRetry;
  delete (res as TaskInput).editHeader;
  return res;
}
