import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { orgsApi } from '@/api/orgs';
import type { OrgResponse } from '@/api/types';
import { useAuth } from '@/store/auth-context';

const TYPE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
function typeColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % TYPE_COLORS.length;
  return TYPE_COLORS[h];
}

export default function OrgsScreen() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.policies.includes('Admin') ?? false;

  const [orgs, setOrgs] = useState<OrgResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await orgsApi.getAll();
      setOrgs(data.items);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  const filtered = orgs.filter(
    (o) =>
      o.orgName.toLowerCase().includes(search.toLowerCase()) ||
      o.orgTypeName.toLowerCase().includes(search.toLowerCase()) ||
      (o.address ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={palette.green} />
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
            placeholder="Поиск организаций..."
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
        <Text style={[s.count, { color: t.sub }]}>{filtered.length} организаций</Text>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.orgId)}
        contentContainerStyle={filtered.length === 0 ? s.emptyContainer : { paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => <OrgCard item={item} t={t} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={palette.green} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: `${palette.green}12` }]}>
              <Ionicons name="business-outline" size={36} color={palette.green} />
            </View>
            <Text style={[s.emptyTitle, { color: t.text }]}>
              {search ? 'Ничего не найдено' : 'Нет организаций'}
            </Text>
            <Text style={[s.emptySub, { color: t.sub }]}>
              {search ? 'Попробуйте изменить запрос' : 'Организации появятся здесь'}
            </Text>
          </View>
        }
      />

      {isAdmin && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => router.push('/(tabs)/orgs/create')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function OrgCard({ item, t }: { item: OrgResponse; t: ReturnType<typeof useTheme> }) {
  const router = useRouter();
  const color = typeColor(item.orgTypeName);
  const initials = item.orgName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: t.card }]}
      onPress={() => router.push(`/(tabs)/orgs/${item.orgId}`)}
      activeOpacity={0.8}
    >
      <View style={[s.avatar, { backgroundColor: `${color}18` }]}>
        <Text style={[s.avatarText, { color }]}>{initials}</Text>
      </View>
      <View style={s.info}>
        <Text style={[s.orgName, { color: t.text }]} numberOfLines={1}>{item.orgName}</Text>
        <View style={s.metaRow}>
          <View style={[s.typePill, { backgroundColor: `${color}15` }]}>
            <Text style={[s.typeText, { color }]}>{item.orgTypeName}</Text>
          </View>
        </View>
        {item.address ? (
          <View style={s.addrRow}>
            <Ionicons name="location-outline" size={12} color={t.placeholder} />
            <Text style={[s.addr, { color: t.sub }]} numberOfLines={1}>{item.address}</Text>
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  avatar: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  info: { flex: 1, gap: 5 },
  orgName: { fontSize: 15, fontWeight: '700' },
  metaRow: { flexDirection: 'row' },
  typePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  typeText: { fontSize: 11, fontWeight: '700' },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addr: { fontSize: 12, flex: 1 },

  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center' },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: palette.green,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: palette.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
});
