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
  bg: '#0d1117',
  card: '#161b22',
  cardAlt: '#010409',
  border: '#30363d',
  text: '#e6edf3',
  sub: '#8b949e',
  placeholder: '#6e7681',
  inputBg: '#0d1117',
  shadow: '#00000066',
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
