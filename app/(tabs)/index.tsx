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
        activsApi.getAll(),
        orgsApi.getAll(),
        physesApi.getAll(),
      ]);
      setCounts({ activs: a.data.length, orgs: o.data.length, physes: p.data.length });
      const sorted = [...a.data].sort((x, y) => {
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
  const initials =
    [user?.firstName, user?.lastName].filter(Boolean).map((n) => n![0]).join('').toUpperCase() ||
    (user?.login?.[0] ?? '?').toUpperCase();

  function statusColor(name: string | undefined): string {
    switch (name) {
      case 'Запланирован': return palette.blue;
      case 'Открыт':       return palette.orange;
      case 'Сохранен':     return palette.purple;
      case 'Закрыт':       return palette.green;
      default:             return palette.blue;
    }
  }

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
      {/* Hero banner */}
      <View style={[s.banner, { backgroundColor: palette.blue }]}>
        <View style={s.bannerContent}>
          <View>
            <Text style={s.bannerGreeting}>Добро пожаловать</Text>
            <Text style={s.bannerName}>{displayName}</Text>
          </View>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.bannerAvatar} />
          ) : (
            <View style={s.bannerAvatar}>
              <Text style={s.bannerAvatarText}>{initials}</Text>
            </View>
          )}
        </View>

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

      {/* Stats */}
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

      {/* Recent activs */}
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

const s = StyleSheet.create({
  banner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  bannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  bannerLogo: { width: 36, height: 36, marginBottom: 8 },
  bannerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  bannerName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
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
});
