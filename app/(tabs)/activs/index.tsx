import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { activsApi } from '@/api/activs';
import type { ActivResponse } from '@/api/types';

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function dateKey(start: string | null) {
  if (!start) return '';
  const d = new Date(start);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatGroupLabel(start: string | null) {
  if (!start) return 'Без даты';
  return new Date(start).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

type ListItem =
  | { type: 'header'; label: string }
  | { type: 'item'; data: ActivResponse };

export default function ActivsScreen() {
  const t = useTheme();
  const router = useRouter();

  const [activs, setActivs] = useState<ActivResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [error, setError] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setError(false);
    try {
      const { data } = await activsApi.getAll();
      setActivs(data.items);
    } catch {
      setError(true);
    } finally { setLoading(false); setRefreshing(false); }
  }

  const filtered = activs.filter(
    (a) =>
      a.orgName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      a.statusName.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!a.start && !b.start) return b.activId - a.activId;
    if (!a.start) return 1;
    if (!b.start) return -1;
    const diff = new Date(b.start).getTime() - new Date(a.start).getTime();
    return diff !== 0 ? diff : b.activId - a.activId;
  });

  const listItems: ListItem[] = [];
  let lastKey = '__none__';
  for (const activ of sorted) {
    const key = dateKey(activ.start) || '__no_date__';
    if (key !== lastKey) {
      listItems.push({ type: 'header', label: formatGroupLabel(activ.start) });
      lastKey = key;
    }
    listItems.push({ type: 'item', data: activ });
  }

  if (loading) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={palette.blue} />
    </View>
  );

  if (error) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <Ionicons name="cloud-offline-outline" size={48} color={t.placeholder} />
      <Text style={[s.emptyTitle, { color: t.text, marginTop: 12 }]}>Не удалось загрузить</Text>
      <Text style={[s.emptySub, { color: t.sub }]}>Проверьте подключение к интернету</Text>
      <TouchableOpacity
        style={[s.emptyBtn, { backgroundColor: palette.blue, marginTop: 16 }]}
        onPress={() => load()}
      >
        <Text style={s.emptyBtnText}>Повторить</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[s.flex, { backgroundColor: t.bg }]}>
      {/* Search bar */}
      <View style={[s.searchWrap, { backgroundColor: t.bg }]}>
        <View style={[s.searchBox, { backgroundColor: t.card, borderColor: t.border }]}>
          <Ionicons name="search" size={16} color={t.placeholder} />
          <TextInput
            style={[s.searchInput, { color: t.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск по визитам..."
            placeholderTextColor={t.placeholder}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={t.placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: palette.blue }]}
          onPress={() => router.push('/(tabs)/activs/create')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Count */}
      {filtered.length > 0 && (
        <Text style={[s.count, { color: t.sub }]}>
          {filtered.length} визит{filtered.length !== 1 ? (filtered.length < 5 ? 'а' : 'ов') : ''}
        </Text>
      )}

      <FlatList
        data={listItems}
        keyExtractor={(item) => item.type === 'header' ? `h-${item.label}` : String(item.data.activId)}
        contentContainerStyle={filtered.length === 0 ? s.emptyContainer : { paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) =>
          item.type === 'header'
            ? <DateHeader label={item.label} t={t} />
            : <ActivCard item={item.data} t={t} />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={palette.blue} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: `${palette.blue}12` }]}>
              <Ionicons name="clipboard-outline" size={36} color={palette.blue} />
            </View>
            <Text style={[s.emptyTitle, { color: t.text }]}>
              {search ? 'Ничего не найдено' : 'Нет визитов'}
            </Text>
            <Text style={[s.emptySub, { color: t.sub }]}>
              {search ? 'Попробуйте изменить запрос' : 'Создайте первый визит'}
            </Text>
            {!search && (
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: palette.blue }]}
                onPress={() => router.push('/(tabs)/activs/create')}
              >
                <Text style={s.emptyBtnText}>Создать визит</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

function DateHeader({ label, t }: { label: string; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={s.dateHeader}>
      <Text style={[s.dateHeaderText, { color: t.sub }]}>{label}</Text>
      <View style={[s.dateHeaderLine, { backgroundColor: t.border }]} />
    </View>
  );
}

function statusColor(name: string | undefined): string {
  switch (name) {
    case 'Запланирован': return palette.blue;
    case 'Открыт':       return palette.orange;
    case 'Сохранен':     return palette.purple;
    case 'Закрыт':       return palette.green;
    default:             return palette.blue;
  }
}

function ActivCard({ item, t }: { item: ActivResponse; t: ReturnType<typeof useTheme> }) {
  const router = useRouter();
  const date = formatDate(item.start);
  const color = statusColor(item.statusName);

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: t.card }]}
      onPress={() => router.push(`/(tabs)/activs/${item.activId}`)}
      activeOpacity={0.8}
    >
      <View style={s.cardTop}>
        <View style={[s.cardIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name="clipboard-outline" size={20} color={color} />
        </View>
        <View style={s.cardInfo}>
          <Text style={[s.cardOrg, { color: t.text }]} numberOfLines={1}>{item.orgName}</Text>
          <Text style={[s.cardMeta, { color: t.sub }]}>
            {item.usrLogin}{date ? `  ·  ${date}` : ''}
          </Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: `${color}15` }]}>
          <Text style={[s.statusText, { color }]}>{item.statusName}</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={[s.cardDesc, { color: t.sub, borderTopColor: t.border }]} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      {item.drugs.length > 0 ? (
        <View style={[s.drugsRow, { borderTopColor: t.border }]}>
          <Ionicons name="medkit-outline" size={12} color={t.placeholder} />
          <Text style={[s.drugsText, { color: t.sub }]} numberOfLines={1}>
            {item.drugs.join(', ')}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 8 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, gap: 8, height: 46,
  },
  searchInput: { flex: 1, fontSize: 15 },
  addBtn: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    shadowColor: palette.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  count: { fontSize: 13, fontWeight: '500', paddingHorizontal: 16, marginBottom: 8 },

  card: {
    borderRadius: 18, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  cardIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardOrg: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  cardMeta: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 13, lineHeight: 19, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 10, borderTopWidth: 1 },
  drugsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1 },
  drugsText: { fontSize: 12, flex: 1 },

  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8,
    shadowColor: palette.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  dateHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginTop: 14, marginBottom: 4 },
  dateHeaderText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  dateHeaderLine: { flex: 1, height: 1 },
});
