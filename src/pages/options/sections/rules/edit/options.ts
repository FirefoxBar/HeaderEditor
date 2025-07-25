export const METHOD_LIST = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace', 'connect'].map(
  (e) => ({
    label: e.toUpperCase(),
    value: e,
  }),
);

export const RESOURCE_TYPE_LIST = [];
