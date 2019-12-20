import moment from 'moment';

export function getExportName(additional?: string) {
  const date = moment().format('YYYYMMDD_HHmmSS');
  return `HE_${date}${additional ? '_' + additional : ''}.json`;
}
