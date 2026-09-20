import { createPrefsComponent } from './base-prefs';

const Prefs = createPrefsComponent([
  'manage-collapse-group',
  'show-common-header',
  'include-headers',
  'modify-body',
  'is-debug',
  'rule-switch',
  'rule-history',
  'quick-edit',
  'dark-mode',
  'show-quick-preview',
]);

export default Prefs;
