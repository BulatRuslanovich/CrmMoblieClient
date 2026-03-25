import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { physesApi } from '@/api/physes';
import type { PhysResponse } from '@/api/types';
import { useAuth } from '@/store/auth-context';

const AVATAR_COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#10b981', '#3b82f6'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export default function PhysesScreen() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.policies.includes('Admin') ?? false;

  const [physes, setPhyses] = useState<PhysResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await physesApi.getAll();
      setPhyses(data.items);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  const filtered = physes.filter((p) => {
    const full = [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ');
    return (
      full.toLowerCase().includes(search.toLowerCase()) ||
      (p.specName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.position ?? '').toLowerCase().includes(search.toLowerCase())
    );
  });

  if (loading) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={palette.orange} />
    </View>
  );

  return (
    <View style={[s.flex, { backgroundColor: t.bg }]}>
      <View style={[s.searchWrap, { backgroundColor: t.bg }]}>
        <View style={[s.searchBox, { backgroundColor: t.card, borderColor: t.border }]}>
          <Ionicons name="search" size={16} color={t.placeholder} />
          <TextInput
            style={[s.searchInput, { color: t.text }]}
            value={search} onChangeText={setSearch}
            placeholder="Поиск врачей..."
            placeholderTextColor={t.placeholder}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={t.placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {filtered.length > 0 && (
        <Text style={[s.count, { color: t.sub }]}>{filtered.length} врачей</Text>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.physId)}
        contentContainerStyle={filtered.length === 0 ? s.emptyContainer : { paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => <PhysCard item={item} t={t} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={palette.orange} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: `${palette.orange}12` }]}>
              <Ionicons name="people-outline" size={36} color={palette.orange} />
            </View>
            <Text style={[s.emptyTitle, { color: t.text }]}>
              {search ? 'Ничего не найдено' : 'Нет врачей'}
            </Text>
            <Text style={[s.emptySub, { color: t.sub }]}>
              {search ? 'Попробуйте изменить запрос' : 'Врачи появятся здесь'}
            </Text>
          </View>
        }
      />

      {isAdmin && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => router.push('/(tabs)/physes/create')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function PhysCard({ item, t }: { item: PhysResponse; t: ReturnType<typeof useTheme> }) {
  const router = useRouter();
  const fullName = [item.lastName, item.firstName, item.middleName].filter(Boolean).join(' ');
  const initials = [item.lastName, item.firstName].filter(Boolean).map((n) => n![0].toUpperCase()).join('') || '?';
  const color = avatarColor(item.lastName);

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: t.card }]}
      onPress={() => router.push(`/(tabs)/physes/${item.physId}`)}
      activeOpacity={0.8}
    >
      <View style={[s.avatar, { backgroundColor: `${color}20` }]}>
        <Text style={[s.avatarText, { color }]}>{initials}</Text>
      </View>
      <View style={s.info}>
        <Text style={[s.name, { color: t.text }]} numberOfLines={1}>{fullName}</Text>
        {item.specName ? (
          <View style={[s.specPill, { backgroundColor: `${palette.orange}15` }]}>
            <Text style={[s.specText, { color: palette.orange }]}>{item.specName}</Text>
          </View>
        ) : null}
        {item.position ? (
          <View style={s.posRow}>
            <Ionicons name="briefcase-outline" size={11} color={t.placeholder} />
            <Text style={[s.posText, { color: t.sub }]} numberOfLines={1}>{item.position}</Text>
          </View>
        ) : null}
        {item.orgs.length > 0 ? (
          <View style={s.orgRow}>
            <Ionicons name="business-outline" size={11} color={t.placeholder} />
            <Text style={[s.orgText, { color: t.sub }]} numberOfLines={1}>
              {item.orgs.slice(0, 2).join(', ')}
              {item.orgs.length > 2 ? ` +${item.orgs.length - 2}` : ''}
            </Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.placeholder} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, gap: 8, height: 46,
  },
  searchInput: { flex: 1, fontSize: 15 },
  count: { fontSize: 13, fontWeight: '500', paddingHorizontal: 16, marginBottom: 8 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  avatar: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: '800' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '700' },
  specPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  specText: { fontSize: 11, fontWeight: '700' },
  posRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  posText: { fontSize: 12, flex: 1 },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orgText: { fontSize: 12, flex: 1 },

  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center' },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: palette.orange,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: palette.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
});
