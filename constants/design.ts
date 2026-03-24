import { useColorScheme } from '@/hooks/use-color-scheme';

export const palette = {
  blue: '#3b82f6',
  blueShadow: '#3b82f640',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
} as const;

export interface Theme {
  bg: string;
  card: string;
  cardAlt: string;
  border: string;
  text: string;
  sub: string;
  placeholder: string;
  inputBg: string;
  shadow: string;
}

export const lightTheme: Theme = {
  bg: '#f0f4ff',
  card: '#ffffff',
  cardAlt: '#f8fafc',
  border: '#e2e8f0',
  text: '#1e293b',
  sub: '#64748b',
  placeholder: '#94a3b8',
  inputBg: '#f8fafc',
  shadow: '#00000014',
};

export const darkTheme: Theme = {
  bg: '#0f172a',
  card: '#1e293b',
  cardAlt: '#0f172a',
  border: '#334155',
  text: '#f1f5f9',
  sub: '#94a3b8',
  placeholder: '#475569',
  inputBg: '#0f172a',
  shadow: '#00000040',
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
