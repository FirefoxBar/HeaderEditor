import dayjs from 'dayjs';

export function getExportName(additional?: string) {
  const date = dayjs().format('YYYYMMDD_HHmmss');
  return `HE_${date}${additional ? '_' + additional : ''}.json`;
}
