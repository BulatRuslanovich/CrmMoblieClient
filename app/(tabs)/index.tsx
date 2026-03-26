import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, palette } from '@/constants/design';
import { useAuth } from '@/store/auth-context';
import { activsApi } from '@/api/activs';
import { orgsApi } from '@/api/orgs';
import { physesApi } from '@/api/physes';
import type { ActivResponse } from '@/api/types';

export default function HomeScreen() {
  const t = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [counts, setCounts] = useState({ activs: 0, orgs: 0, physes: 0 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<ActivResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    load();
    AsyncStorage.getItem('profile_avatar_uri').then(setAvatarUri);
  }, []);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const [a, o, p] = await Promise.all([
        activsApi.getAll(1, 100),
        orgsApi.getAll(1, 100),
        physesApi.getAll(1, 100),
      ]);
      setCounts({ activs: a.data.items.length, orgs: o.data.items.length, physes: p.data.items.length });
      const sc: Record<string, number> = {};
      for (const activ of a.data.items) {
        sc[activ.statusName] = (sc[activ.statusName] ?? 0) + 1;
      }
      setStatusCounts(sc);
      const sorted = [...a.data.items].sort((x, y) => {
        if (!x.start && !y.start) return y.activId - x.activId;
        if (!x.start) return 1;
        if (!y.start) return -1;
        const diff = new Date(y.start).getTime() - new Date(x.start).getTime();
        return diff !== 0 ? diff : y.activId - x.activId;
      });
      setRecent(sorted.slice(0, 4));
    } catch { /* ignore */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.login || 'Пользователь';

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour >= 5  && hour < 12 ? 'Доброе утро'  :
    hour >= 12 && hour < 18 ? 'Добрый день'  :
    hour >= 18 && hour < 23 ? 'Добрый вечер' :
                              'Доброй ночи';
  const greetingIcon: keyof typeof Ionicons.glyphMap =
    hour >= 5  && hour < 12 ? 'sunny-outline'        :
    hour >= 12 && hour < 18 ? 'partly-sunny-outline' :
    hour >= 18 && hour < 23 ? 'moon-outline'         :
                              'star-outline';
  const todayLabel = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  const openCount = statusCounts['Открыт'] ?? 0;
  const initials =
    [user?.firstName, user?.lastName].filter(Boolean).map((n) => n![0]).join('').toUpperCase() ||
    (user?.login?.[0] ?? '?').toUpperCase();

  const stats = [
    { label: 'Визитов', value: counts.activs, icon: 'clipboard' as const, color: palette.blue, route: '/(tabs)/activs' as const },
    { label: 'Организаций', value: counts.orgs, icon: 'business' as const, color: palette.green, route: '/(tabs)/orgs' as const },
    { label: 'Врачей', value: counts.physes, icon: 'people' as const, color: palette.orange, route: '/(tabs)/physes' as const },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={palette.blue} />}
    >

      <View style={[s.banner, { backgroundColor: palette.blue }]}>
        <View style={s.bannerCircle1} />
        <View style={s.bannerCircle2} />

        <View style={s.bannerTop}>
          <View style={s.bannerGreetingRow}>
            <Ionicons name={greetingIcon} size={16} color="rgba(255,255,255,0.8)" />
            <Text style={s.bannerGreeting}>{greeting}</Text>
          </View>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.bannerAvatar} />
          ) : (
            <View style={s.bannerAvatar}>
              <Text style={s.bannerAvatarText}>{initials}</Text>
            </View>
          )}
        </View>

        <Text style={s.bannerName}>{displayName}</Text>
        <Text style={s.bannerDate}>{todayLabel}</Text>

        {openCount > 0 && (
          <View style={s.bannerBadge}>
            <Ionicons name="radio-button-on" size={10} color="#fff" />
            <Text style={s.bannerBadgeText}>{openCount} визит{openCount === 1 ? '' : 'а'} открыто</Text>
          </View>
        )}

        {/* Quick action */}
        <TouchableOpacity
          style={s.quickAction}
          onPress={() => router.push('/(tabs)/activs/create')}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={18} color={palette.blue} />
          <Text style={[s.quickActionText, { color: palette.blue }]}>Новый визит</Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.section, { color: t.text }]}>Статистика</Text>
      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color={palette.blue} />
        </View>
      ) : (
        <View style={s.statsRow}>
          {stats.map((stat) => (
            <TouchableOpacity
              key={stat.label}
              style={[s.statCard, { backgroundColor: t.card }]}
              onPress={() => router.push(stat.route)}
              activeOpacity={0.8}
            >
              <View style={[s.statIcon, { backgroundColor: `${stat.color}18` }]}>
                <Ionicons name={stat.icon} size={22} color={stat.color} />
              </View>
              <Text style={[s.statValue, { color: t.text }]}>{stat.value}</Text>
              <Text style={[s.statLabel, { color: t.sub }]}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!loading && counts.activs > 0 && (
        <View style={[s.chartCard, { backgroundColor: t.card }]}>
          <Text style={[s.section, { color: t.text, marginBottom: 16 }]}>Статусы визитов</Text>
          <DonutChart statusCounts={statusCounts} />
        </View>
      )}

      <View style={s.sectionRow}>
        <Text style={[s.section, { color: t.text }]}>Последние визиты</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/activs')}>
          <Text style={[s.seeAll, { color: palette.blue }]}>Все →</Text>
        </TouchableOpacity>
      </View>

      {!loading && recent.length === 0 ? (
        <View style={[s.emptyCard, { backgroundColor: t.card }]}>
          <Ionicons name="clipboard-outline" size={40} color={t.placeholder} />
          <Text style={[s.emptyText, { color: t.sub }]}>Визитов пока нет</Text>
          <TouchableOpacity
            style={[s.emptyBtn, { backgroundColor: `${palette.blue}18` }]}
            onPress={() => router.push('/(tabs)/activs/create')}
          >
            <Text style={[s.emptyBtnText, { color: palette.blue }]}>Создать первый визит</Text>
          </TouchableOpacity>
        </View>
      ) : (
        recent.map((a) => (
          <TouchableOpacity
            key={a.activId}
            style={[s.recentCard, { backgroundColor: t.card }]}
            onPress={() => router.push(`/(tabs)/activs/${a.activId}`)}
            activeOpacity={0.8}
          >
            <View style={[s.recentDot, { backgroundColor: `${statusColor(a.statusName)}20` }]}>
              <Ionicons name="clipboard-outline" size={18} color={statusColor(a.statusName)} />
            </View>
            <View style={s.recentInfo}>
              <Text style={[s.recentOrg, { color: t.text }]} numberOfLines={1}>{a.orgName}</Text>
              <Text style={[s.recentMeta, { color: t.sub }]}>
                {a.statusName}
                {a.start ? `  ·  ${new Date(a.start).toLocaleDateString('ru-RU')}` : ''}
              </Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: `${statusColor(a.statusName)}15` }]}>
              <Text style={[s.statusPillText, { color: statusColor(a.statusName) }]} numberOfLines={1}>
                {a.statusName}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const STATUS_CHART_ITEMS = [
  { name: 'Запланирован', color: palette.blue },
  { name: 'Открыт',       color: palette.orange },
  { name: 'Сохранен',     color: palette.purple },
  { name: 'Закрыт',       color: palette.green },
];

function statusColor(name: string | undefined): string {
  return STATUS_CHART_ITEMS.find((s) => s.name === name)?.color ?? palette.blue;
}

const DONUT_SIZE = 140;
const DONUT_STROKE = 20;
const DONUT_R = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRC = 2 * Math.PI * DONUT_R;

function DonutChart({ statusCounts }: { statusCounts: Record<string, number> }) {
  const t = useTheme();
  const total = Object.values(statusCounts).reduce((s, n) => s + n, 0);
  if (total === 0) return null;

  let offset = 0;
  const segments = STATUS_CHART_ITEMS.map((item) => {
    const count = statusCounts[item.name] ?? 0;
    const dash = (count / total) * DONUT_CIRC;
    const seg = { ...item, count, dash, offset };
    offset += dash;
    return seg;
  }).filter((seg) => seg.count > 0);

  return (
    <View style={s.chartInner}>
      <View>
        <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
          <G transform={`rotate(-90, ${DONUT_SIZE / 2}, ${DONUT_SIZE / 2})`}>
            {segments.map((seg) => (
              <Circle
                key={seg.name}
                cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_R}
                fill="none"
                stroke={seg.color}
                strokeWidth={DONUT_STROKE}
                strokeDasharray={`${seg.dash} ${DONUT_CIRC}`}
                strokeDashoffset={-seg.offset}
              />
            ))}
          </G>
        </Svg>
        <View style={s.donutCenter} pointerEvents="none">
          <Text style={[s.donutTotal, { color: t.text }]}>{total}</Text>
          <Text style={[s.donutLabel, { color: t.sub }]}>всего</Text>
        </View>
      </View>
      <View style={s.chartLegend}>
        {segments.map((seg) => (
          <View key={seg.name} style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: seg.color }]} />
            <Text style={[s.legendName, { color: t.sub }]}>{seg.name}</Text>
            <Text style={[s.legendCount, { color: seg.color }]}>{seg.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    borderRadius: 24, padding: 20, marginBottom: 24,
    overflow: 'hidden', gap: 6,
  },
  bannerCircle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60, right: -40,
  },
  bannerCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30, left: 20,
  },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  bannerGreetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  bannerName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 2 },
  bannerDate: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  bannerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4,
  },
  bannerBadgeText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  bannerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  bannerAvatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start',
    marginTop: 8,
  },
  quickActionText: { fontSize: 14, fontWeight: '700' },

  section: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 14, fontWeight: '600' },

  loadingBox: { height: 100, justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, borderRadius: 18, padding: 14,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  recentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  recentDot: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recentInfo: { flex: 1 },
  recentOrg: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  recentMeta: { fontSize: 12 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  emptyCard: {
    borderRadius: 20, padding: 32,
    alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  emptyText: { fontSize: 15 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { fontSize: 14, fontWeight: '700' },

  chartCard: {
    borderRadius: 18, padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  chartInner: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  donutCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  donutTotal: { fontSize: 22, fontWeight: '800', color: '#000' },
  donutLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  chartLegend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: 13, fontWeight: '500', color: '#888' },
  legendCount: { fontSize: 13, fontWeight: '700' },
});
