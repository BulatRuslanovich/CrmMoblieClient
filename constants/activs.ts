import { palette } from './design';


export const STATUSES = [
  { statusId: 1, statusName: 'Запланирован', color: palette.blue },
  { statusId: 2, statusName: 'Открыт',       color: palette.orange },
  { statusId: 3, statusName: 'Сохранен',     color: palette.purple },
  { statusId: 4, statusName: 'Закрыт',       color: palette.green },
] as const;

// export const ACTIV_STATUS_CHART_ITEMS = [
//   { name: 'Запланирован', color: palette.blue },
//   { name: 'Открыт',       color: palette.orange },
//   { name: 'Сохранен',     color: palette.purple },
//   { name: 'Закрыт',       color: palette.green },
// ] as const;

// export function activStatusColor(name: string | undefined): string {
//   switch (name) {
//     case 'Запланирован': return palette.blue;
//     case 'Открыт':       return palette.orange;
//     case 'Сохранен':     return palette.purple;
//     case 'Закрыт':       return palette.green;
//     default:             return palette.blue;
//   }
// }
