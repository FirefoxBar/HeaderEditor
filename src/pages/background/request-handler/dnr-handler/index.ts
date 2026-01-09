import { debounce } from 'lodash-es';
import browser from 'webextension-polyfill';
import type { DeclarativeNetRequest } from 'webextension-polyfill/namespaces/declarativeNetRequest';
import emitter from '@/share/core/emitter';
import logger from '@/share/core/logger';
import { prefs } from '@/share/core/prefs';
import { detectRunner } from '@/share/core/rule-utils';
import SessionMessage from '@/share/core/session-message';
import { getSession, readStorage } from '@/share/core/storage';
import { getRuleUsedTasks } from '@/share/core/tasks';
import type { Rule, Task } from '@/share/core/types';
import {
  getVirtualKey,
  isValidArray,
  parseVirtualKey,
  t,
} from '@/share/core/utils';
import { getAll, get as getRules, waitLoad } from '../../core/rules';
import { createDNR, getRuleId } from './utils';

type DNRRule = DeclarativeNetRequest.Rule;

class DNRRequestHandler {
  private disableAll = false;
  private taskDependencies: Record<string, Set<string>> = {};
  private loadTaskDependencies: Promise<void>;

  constructor() {
    this.saveDependencies = debounce(this.saveDependencies.bind(this), 50);

    this.loadPrefs();
    this.loadTaskDependencies = this.loadDependencies();
    this.initHook();
    this.initRules();
  }

  private async loadDependencies() {
    const s = await readStorage<Record<string, string[]>>(
      getSession(),
      'dnr_task_dependencies',
    );
    if (s) {
      for (const k in s) {
        if (!this.taskDependencies[k]) {
          this.taskDependencies[k] = new Set();
        }
        s[k].forEach(x => this.taskDependencies[k].add(x));
      }
    }
  }

  private saveDependencies() {
    getSession().set({
      dnr_task_dependencies: Object.fromEntries(
        Object.entries(this.taskDependencies).map(([key, deps]) => [
          key,
          Array.from(deps),
        ]),
      ),
    });
  }

  private writeDependency(rule: Rule) {
    const rk = getVirtualKey(rule);
    const dep = getRuleUsedTasks(rule);
    let shouldSave = false;

    for (const key in this.taskDependencies) {
      if (this.taskDependencies[key].has(rk)) {
        // previous dep removed
        if (!dep.has(key)) {
          this.taskDependencies[key].delete(rk);
          shouldSave = true;
        }
      } else {
        // already exists
        dep.delete(key);
        shouldSave = true;
      }
    }

    dep.forEach(key => {
      if (!this.taskDependencies[key]) {
        this.taskDependencies[key] = new Set();
      }
      this.taskDependencies[key].add(rk);
      shouldSave = true;
    });

    if (shouldSave) {
      this.saveDependencies();
    }
  }

  private removeDependency(rule: Rule) {
    const rk = getVirtualKey(rule);
    let shouldSave = false;

    for (const key in this.taskDependencies) {
      if (this.taskDependencies[key].has(rk)) {
        this.taskDependencies[key].delete(rk);
        shouldSave = true;
      }
    }

    if (shouldSave) {
      this.saveDependencies();
    }
  }

  private setDisableAll(to: boolean) {
    if (this.disableAll === to) {
      return;
    }
    logger.debug('[dnr-handler] disableAll', to);
    this.disableAll = to;
    if (IS_DEV) {
      console.log('[dnr-handler] disableAll', to);
    }
    if (to) {
      // disable all
      this.clearRules();
    } else {
      this.initRules();
    }
  }

  private async clearRules() {
    const current = await browser.declarativeNetRequest.getSessionRules();
    await browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: current.map(x => x.id),
    });
  }

  private async initRules() {
    if (this.disableAll) {
      return;
    }

    await waitLoad();

    const v = Object.values(getAll());

    // if service worker restart, get exists rules
    const current = (await browser.declarativeNetRequest.getSessionRules()).map(
      x => x.id,
    );
    const allRules = v.reduce((a, b) => [...a!, ...b!], []) || [];
    const addOriginalRules: Rule[] = [];
    const addRules: DNRRule[] = [];
    allRules.forEach(rule => {
      if (rule._runner !== 'dnr') {
        return;
      }
      const ruleId = getRuleId(rule.id, undefined, rule.ruleType);
      if (current.includes(ruleId)) {
        // rule exists
        return;
      }
      if (!rule.enable) {
        return;
      }
      // update task dependency
      this.writeDependency(rule);
      addOriginalRules.push(rule);
      addRules.push(createDNR(rule, ruleId));
    });
    if (this.disableAll) {
      return;
    }
    if (IS_DEV) {
      console.log('init dnr rules', addRules, this.disableAll);
    }
    if (isValidArray(addRules)) {
      this.addRules(addRules, addOriginalRules);
    }
  }

  private initHook() {
    emitter.on(emitter.INNER_RULE_REMOVE, ({ table, id }) => {
      const old = getRuleId(id, table);
      browser.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [old],
      });
    });

    emitter.on(
      emitter.INNER_RULE_UPDATE,
      async ({ from, target }: { from: Rule; target: Rule }) => {
        if (this.disableAll) {
          return;
        }
        logger.debug('[dnr-handler] rules update', from, target);
        if (from) {
          const old = getRuleId(from.id, undefined, from.ruleType);
          await browser.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [old],
          });
        }
        // detect new rule is DNR or not
        if (detectRunner(target) === 'dnr' && target.enable) {
          this.writeDependency(target);
          this.addRule(
            createDNR(target, getRuleId(target.id, undefined, target.ruleType)),
            target,
          );
        } else {
          this.removeDependency(target);
        }
      },
    );

    emitter.on(emitter.INNER_TASK_RUN, async (task: Task) => {
      await this.loadTaskDependencies;

      if (this.taskDependencies[task.key]) {
        this.taskDependencies[task.key].forEach(async rk => {
          const { table, id } = parseVirtualKey(rk);
          const old = getRuleId(id, table);
          await browser.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [old],
          });
          const rules = getRules(table, { id });
          if (rules && rules.length > 0) {
            const rule = rules[0];
            this.addRule(
              createDNR(rule, getRuleId(rule.id, undefined, rule.ruleType)),
              rule,
            );
          }
        });
      }
    });
  }

  private loadPrefs() {
    emitter.on(emitter.EVENT_PREFS_UPDATE, (key: string, val: any) => {
      switch (key) {
        case 'disable-all':
          this.setDisableAll(Boolean(val));
          break;
        default:
          break;
      }
    });

    prefs.ready(() => {
      this.setDisableAll(Boolean(prefs.get('disable-all')));
    });
  }

  private async addRule(rule: DNRRule, originalRule: Rule) {
    try {
      await browser.declarativeNetRequest.updateSessionRules({
        addRules: [rule],
      });
    } catch (e) {
      console.error('Add DNR rule failed', e, rule, originalRule);
      SessionMessage.add({
        type: 'warning',
        title: t('init_rule_failed'),
        content: `Rule: [${originalRule.id}] ${originalRule.name}\nError: ${(e as Error).message}`,
        more: `Rule: ${JSON.stringify(originalRule)}\nDNR Rule: ${JSON.stringify(rule)}`,
      });
    }
  }

  private async addRules(rules: DNRRule[], originalRules: Rule[]) {
    if (rules.length === 0) {
      return;
    }
    if (rules.length === 1) {
      return this.addRule(rules[0], originalRules[0]);
    }
    try {
      await browser.declarativeNetRequest.updateSessionRules({
        addRules: rules,
      });
    } catch (_) {
      return Promise.all(
        rules.map((rule, idx) => this.addRule(rule, originalRules[idx])),
      );
    }
  }
}

export const createDNRHandler = () => new DNRRequestHandler();
