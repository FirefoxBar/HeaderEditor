---
title: 任务
---

## 任务是什么

该功能可以按照配置，静默运行代码、发起请求，并将响应用于规则中。例如，您可以使用该功能定期刷新某个 token，并将其放入 header 中。

## 配置指南

### 任务 Key

任务 Key 是任务的唯一标识，必须以字母开头，且只能包含字母、数字、下划线。Key 设置后不可修改。

### 运行类型

您可以选择在何时运行任务：

* 仅运行一次：仅在浏览器启动时运行一次。
* 固定间隔任务：在浏览器启动时运行一次，并每隔固定时间运行一次。
* 定时任务：配置 Cron 表达式，在浏览器启动时运行一次，并在指定时间重复运行。

您可以参考[该文档](https://help.aliyun.com/document_detail/133509.html)学习 Cron 表达式。

### 执行类型

常规方式下，您需要配置一个请求地址及请求参数。Header Editor 会定时向该地址发起请求。

响应类型可以用于后续步骤处理。

您可以使用 [JsonLogic](https://jsonlogic.com/) 对结果进行校验。使用 status 获取响应的 HTTP 状态码，使用 body 获取响应体。例如：

```js
// 响应结果
{
  "code": 200,
}

// JsonLogic
{
  "==": [{ "var" : "body.code" }, 200]
}
```

您也可以使用自定义函数。自定义函数不会传入任何参数，在函数中处理请求及校验逻辑，并返回结果。例如：

```js
const res = await fetch('https://example.com');
if (res.status !== 200) {
  throw new Error('Request failed');
}
return res.json();
```

## 在规则中使用

在规则中，使用 `{$TASK.TASK_KEY.Path}` 获取任务返回的响应结果。

例如，您有一个 Key 为 `task1` 的任务，该任务返回了如下结果：

```json
{
  "code": 200,
  "data": {
    "token": "123456"
  }
}
```

在规则中，您可以使用 `{$TASK.task1.data.token}` 获取任务返回的 token。

注意：
* 可以在规则的 重定向至、请求/响应头内容、响应体中使用此语法。
* 如果响应类型配置为“文本”，则任何 `{$TASK.task1.*}` 均会获取到完整的响应文本。
* 当请求失败或尚未完成请求时，该语法会被替换为空字符串。

## 工具函数

在任务的自定义函数中，Header Editor 提供了以下工具函数：

函数列表如下：
* 通过 `this._` 调用部分 [lodash](https://lodash.com/docs/4.17.21) 函数：clone, cloneDeep, cloneDeepWith, cloneWith, difference, differenceBy, differenceWith, eq, first, flatten, get, has, head, isEqual, isEqualWith, last, pick, pickBy, random, set, setWith, uniq, uniqBy, uniqWith
* 通过 `this.task` 获取任务相关内容。
  * `this.task.get`: 获取任务信息。
  * `this.task.getLastRun`: 获取任务上一次运行结果。
  * `this.task.getValidRun`: 获取任务上一次成功运行的结果。
* 通过 `this.sessionStorage` 或 `this.localStorage` 进行数据存取。其中，`localStorage` 为持久化存储，`sessionStorage` 为会话级存储（浏览器关闭时清空）。

相关函数定义如下：
```ts
declare const this: {
  _: { /* lodash */ },
  task: {
    // 获取任务信息
    get: (key: string) => Promise<Task | null>,
    // 获取任务上一次运行结果
    getLastRun: (key: string) => Promise<TaskRun | undefined>,
    // 获取任务上一次成功运行的结果
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

## Task 相关类型定义

Task 相关类型定义如下：
```ts
// 任务运行记录
interface TaskRun {
  // 任务 Key
  key: string;
  // 开始运行的时间
  time: number;
  // 运行状态
  status: 'running' | 'done' | 'error';
  // 错误信息
  error?: string;
  // 运行结果
  result?: any;
}

// 任务信息
interface Task {
  // 任务 Key
  key: string;
  // 任务名称
  name: string;
  // 运行类型
  execute: 'once' | 'interval' | 'cron';
  // Cron 表达式
  cron?: string;
  // 时间间隔（分）
  interval?: number;
  // 是否是函数
  isFunction: boolean;
  // 重试设置
  retry?: {
    // 最大重试次数
    max: number;
    // 重试等待时间（秒）
    wait: number;
  };
  // Fetch 设置
  fetch?: {
    // 请求 URL
    url: string;
    // 请求方法
    method: string;
    // 请求头
    headers?: Record<string, string>;
    // 请求体
    body?: string;
    // 响应类型
    responseType?: 'json' | 'text';
    // 验证器
    validator?: RulesLogic;
  };
  // 自定义函数代码
  code?: string;
}
```
