import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { palette, useTheme } from '@/constants/design';

export function Selector({
  value, placeholder, icon, open, onToggle, t, error,
}: {
  value: string | null;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  open: boolean;
  onToggle: () => void;
  t: ReturnType<typeof useTheme>;
  error?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.selector, { backgroundColor: t.inputBg, borderColor: error ? palette.red : t.border }]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={18} color={value ? palette.blue : t.placeholder} />
      <Text style={[s.selectorText, { color: value ? t.text : t.placeholder }]} numberOfLines={1}>
        {value ?? placeholder}
      </Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={t.placeholder} />
    </TouchableOpacity>
  );
}

export function PickerList({
  items, selectedId, onSelect, t, accentColor, searchable,
}: {
  items: { id: number; label: string; sub?: string }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  t: ReturnType<typeof useTheme>;
  accentColor?: string;
  searchable?: boolean;
}) {
  const accent = accentColor ?? palette.blue;
  const [query, setQuery] = useState('');
  const filtered = searchable && query
    ? items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : items;
  return (
    <View style={[s.pickerList, { backgroundColor: t.card, borderColor: t.border }]}>
      {searchable && (
        <View style={[s.searchWrap, { borderBottomColor: t.border }]}>
          <Ionicons name="search" size={16} color={t.placeholder} />
          <TextInput
            style={[s.searchInput, { color: t.text }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск..."
            placeholderTextColor={t.placeholder}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={t.placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {filtered.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[
              s.pickerItem,
              { borderBottomColor: t.border },
              idx < filtered.length - 1 && { borderBottomWidth: 1 },
              selectedId === item.id && { backgroundColor: `${accent}10` },
            ]}
            onPress={() => onSelect(item.id)}
          >
            <View style={s.pickerItemContent}>
              <Text style={[s.pickerItemLabel, { color: t.text }]}>{item.label}</Text>
              {item.sub ? <Text style={[s.pickerItemSub, { color: t.sub }]}>{item.sub}</Text> : null}
            </View>
            {selectedId === item.id && (
              <Ionicons name="checkmark-circle" size={18} color={accent} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, height: 50,
  },
  selectorText: { flex: 1, fontSize: 15 },
  pickerList: {
    borderWidth: 1.5, borderRadius: 14, marginTop: 6, maxHeight: 280,
  },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  pickerItemContent: { flex: 1 },
  pickerItemLabel: { fontSize: 15, fontWeight: '500' },
  pickerItemSub: { fontSize: 12, marginTop: 1 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, height: 36 },
});
