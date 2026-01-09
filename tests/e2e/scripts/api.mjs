export function callBackgroundApi(popup, action) {
  return popup.evaluate(
    `browser.runtime.sendMessage(${JSON.stringify(action)})`,
  );
}

export async function saveRule(popup, rule) {
  const resp = await callBackgroundApi(popup, {
    method: 'save_rule',
    rule,
  });
  let tabName = '';
  switch (rule.ruleType) {
    case 'cancel':
    case 'redirect':
      tabName = 'request';
      break;
    case 'modifySendHeader':
      tabName = 'sendHeader';
      break;
    case 'modifyReceiveHeader':
      tabName = 'receiveHeader';
      break;
    case 'modifyReceiveBody':
      tabName = 'receiveBody';
      break;
    default:
      break;
  }

  return {
    id: resp.id,
    remove: () =>
      callBackgroundApi(popup, {
        method: 'del_rule',
        id: resp.id,
        type: tabName,
      }),
  };
}

export async function saveTask(popup, task) {
  await callBackgroundApi(popup, {
    method: 'task_save',
    task,
  });
  return {
    remove: () =>
      callBackgroundApi(popup, {
        method: 'task_del',
        key: task.key,
      }),
  };
}

export async function runTask(popup, taskKey) {
  return callBackgroundApi(popup, {
    method: 'task_run',
    key: taskKey,
  });
}

export async function getTask(popup, taskKey) {
  return callBackgroundApi(popup, {
    method: 'task_get',
    key: taskKey,
  });
}

export function setPref(popup, key, value) {
  return callBackgroundApi(popup, {
    method: 'set_pref',
    key,
    value,
  });
}
