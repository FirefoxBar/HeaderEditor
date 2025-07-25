import { ALL_RESOURCE_TYPES } from '@/share/core/constant';
import { t } from '@/share/core/utils';

export const METHOD_LIST = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace', 'connect'].map(
  (e) => ({
    label: e.toUpperCase(),
    value: e,
  }),
);

export const RESOURCE_TYPE_LIST = ALL_RESOURCE_TYPES.map((e) => ({
  label: t(`resourceType_${e}`),
  value: e,
}));
