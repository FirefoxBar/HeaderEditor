---
title: Tasks
---

## What is a Task?

This feature allows you to silently run code, initiate requests, and use the responses in rules, according to your configuration. For example, you can use this feature to periodically refresh a token and include it in the header.

## Configuration Guide

### Task Key

The task key is a unique identifier for the task. It must begin with a letter and can only contain letters, numbers, and underscores. The key cannot be modified after it is set.

### Execution Type

You can choose when to run the task:

* Run only once: Runs only once when the browser starts.
* Fixed interval operation: Runs once when the browser starts and then again at fixed intervals.
* Scheduled operation: Configure a Cron expression to run once when the browser starts and then repeat at specified intervals.

You can refer to [this document](https://crontab.cronhub.io/) to learn about Cron expressions.

### Execution Type

In the standard approach, you need to configure a request address and request parameters. The Header Editor will periodically send requests to this address.

The response type can be used for subsequent processing.

You can use [JsonLogic](https://jsonlogic.com/) to validate the results. Use `status` to get the HTTP status code of the response and `body` to get the response body. For example:

```js
// Response result
{
  "code": 200,
}

// JsonLogic
{
  "==": [{ "var" : "body.code" }, 200]
}
```

You can also use a custom function. A custom function does not take any parameters; it handles the request and validation logic within the function and returns the result. For example:

```js
const res = await fetch('https://example.com');
if (res.status !== 200) {
  throw new Error('Request failed');
}
return res.json();
```

## Using in Rules

In rules, use `{$TASK.TASK_KEY.Path}` to get the response returned by the task.

For example, you have a task with the key `task1` that returned the following result:

```json
{
  "code": 200,
  "data": {
    "token": "123456"
  }
}
```

In rules, you can use `{$TASK.task1.data.token}` to get the token returned by the task.

Note:
* This syntax can be used in the redirect to, request/response header content, and response body of the rule.
* If the response type is configured as "text", any `{$TASK.task1.*}` will retrieve the complete response text, but `{$TASK.task1}` cannot be used directly.
* This syntax will be replaced with an empty string when the request fails or is not yet complete.

## Utility Functions

The Header Editor provides the following utility functions in the task's custom functions:

The function list is as follows:
* Calling some [lodash](https://lodash.com/docs/4.17.21) functions via `this._`: clone, cloneDeep, cloneDeepWith, cloneWith, difference, differenceBy, differenceWith, eq, first, flatten, get, has, head, isEqual, isEqualWith, last, pick, pickBy, random, set, setWith, uniq, uniqBy, uniqWith
* Generating a random string via `this.nanoid`.
* Retrieve task-related content using `this.task`.
  * `this.task.get`: Retrieve task information.
  * `this.task.getLastRun`: Retrieve the last run result of the task.
  * `this.task.getValidRun`: Retrieve the last successfully run result of the task.
* Note: It is not recommended to use Task-related functions after destructuring, as it may affect import/export functionality.
* Store and retrieve data using `this.sessionStorage` or `this.localStorage`. `localStorage` is persistent storage, while `sessionStorage` is session-level storage (cleared when the browser is closed).

The relevant function definitions are as follows:
```ts
declare const this: {
  _: { /* lodash */ },
  task: {
    // Get task information
    get: (key: string) => Promise<Task | null>,
    // Get the result of the last task execution
    getLastRun: (key: string) => Promise<TaskRun | undefined>,
    // Get the result of the last successful task execution
    getValidRun: (key: string) => Promise<TaskRun | undefined>,
  },
  sessionStorage: Storage,
  localStorage: Storage,
}

declare interface Storage {
  get: (key: string) => Promise<any>,
  set: (key: string, value: any) => Promise<void>,
  remove: (key: string) => Promise<void>,
  has: (key: string) => Promise<boolean>,
}
```

## Task Related Type Definitions

Task related type definitions are as follows:

```ts
// Task execution record
interface TaskRun {
  // Task Key
  key: string;
  // Start time
  time: number;
  // Running status
  status: 'running' | 'done' | 'error';
  // Error message
  error?: string;
  // Execution result
  result?: any;
}

// Task information
interface Task {
  // Task Key
  key: string;
  // Task name
  name: string;
  // Execution type
  execute: 'once' | 'interval' | 'cron';
  // Cron expression
  cron?: string;
  // Time interval (minutes)
  interval?: number;
  // Whether it is a function
  isFunction: boolean;
  // Retry settings
  retry?: {
    // Maximum number of retries
    max: number;
    // Retry wait time (seconds)
    wait: number;
  };
  // Fetch settings
  fetch?: {
    // Request URL
    url: string;
    // Request method
    method: string;
    // Request headers
    headers?: Record<string, string>;
    // Request body
    body?: string;
    // Response type
    responseType?: 'json' | 'text';
    // Validator
    validator?: RulesLogic;
  };
  // Custom function code
  code?: string;
  }
```
