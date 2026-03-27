import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '@/constants/design';
import { STATUSES } from '@/constants/activs';

const SIZE = 140;
const STROKE = 20;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export function DonutChart({ statusCounts }: { statusCounts: Record<string, number> }) {
  const t = useTheme();
  const total = Object.values(statusCounts).reduce((s, n) => s + n, 0);
  if (total === 0) return null;

  let offset = 0;
  const segments = STATUSES.map((item) => {
    const count = statusCounts[item.statusName] ?? 0;
    const dash = (count / total) * CIRC;
    const seg = { ...item, count, dash, offset };
    offset += dash;
    return seg;
  }).filter((seg) => seg.count > 0);

  return (
    <View style={s.inner}>
      <View>
        <Svg width={SIZE} height={SIZE}>
          <G transform={`rotate(-90, ${SIZE / 2}, ${SIZE / 2})`}>
            {segments.map((seg) => (
              <Circle
                key={seg.statusId}
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${seg.dash} ${CIRC}`}
                strokeDashoffset={-seg.offset}
              />
            ))}
          </G>
        </Svg>
        <View style={s.center} pointerEvents="none">
          <Text style={[s.total, { color: t.text }]}>{total}</Text>
          <Text style={[s.label, { color: t.sub }]}>всего</Text>
        </View>
      </View>
      <View style={s.legend}>
        {segments.map((seg) => (
          <View key={seg.statusId} style={s.legendRow}>
            <View style={[s.dot, { backgroundColor: seg.color }]} />
            <Text style={[s.legendName, { color: t.sub }]}>{seg.statusName}</Text>
            <Text style={[s.legendCount, { color: seg.color }]}>{seg.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  inner: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  center: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  total: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '500' },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: 13, fontWeight: '500' },
  legendCount: { fontSize: 13, fontWeight: '700' },
});
