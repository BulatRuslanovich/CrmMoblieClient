import { View, Text, StyleSheet } from 'react-native';
import { palette, useTheme } from '@/constants/design';

export function FieldBlock({
  label, required, error, t, children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  t: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return (
    <View style={s.fieldBlock}>
      <View style={s.labelRow}>
        <Text style={[s.label, { color: t.sub }]}>{label}</Text>
        {required && <Text style={s.required}>*</Text>}
      </View>
      {children}
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  fieldBlock: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  required: { color: palette.red, fontWeight: '700', fontSize: 13 },
  error: { color: palette.red, fontSize: 12, marginTop: 4, marginLeft: 2 },
});
