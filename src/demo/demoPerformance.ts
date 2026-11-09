import type { PerformancePoint, PeriodKey } from '@/types'

export const performanceByPeriod: Record<PeriodKey, PerformancePoint[]> = {
  '30d': [
    { label: '06/10', points: 0, average: 4 },
    { label: '09/10', points: 8, average: 6 },
    { label: '12/10', points: 0, average: 5 },
    { label: '15/10', points: 10, average: 7 },
    { label: '18/10', points: 7, average: 8 },
    { label: '21/10', points: 0, average: 6 },
    { label: '24/10', points: 9, average: 8 },
    { label: '27/10', points: 8, average: 7 },
    { label: '30/10', points: 0, average: 5 },
    { label: '02/11', points: 10, average: 8 },
    { label: '05/11', points: 8, average: 7 },
  ],
  '6m': [
    { label: 'Jun', points: 16, average: 12 },
    { label: 'Jul', points: 8, average: 11 },
    { label: 'Ago', points: 11, average: 13 },
    { label: 'Set', points: 15, average: 12 },
    { label: 'Out', points: 12, average: 14 },
    { label: 'Nov', points: 18, average: 13 },
  ],
  '12m': [
    { label: 'Dez', points: 8, average: 9 },
    { label: 'Jan', points: 10, average: 10 },
    { label: 'Fev', points: 7, average: 11 },
    { label: 'Mar', points: 14, average: 12 },
    { label: 'Abr', points: 9, average: 11 },
    { label: 'Mai', points: 12, average: 12 },
    { label: 'Jun', points: 16, average: 13 },
    { label: 'Jul', points: 8, average: 12 },
    { label: 'Ago', points: 11, average: 13 },
    { label: 'Set', points: 15, average: 12 },
    { label: 'Out', points: 12, average: 14 },
    { label: 'Nov', points: 6, average: 11 },
  ],
}
