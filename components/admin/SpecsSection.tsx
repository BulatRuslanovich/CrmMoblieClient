import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette, TAB_BAR_CLEARANCE } from '@/constants/design';
import { specsApi } from '@/api/specs';

export function SpecsSection() {
  const t = useTheme();
  const [specs, setSpecs] = useState<{ specId: number; specName: string }[]>([]);
  const [specName, setSpecName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSpecs(); }, []);

  async function loadSpecs() {
    try {
      const { data } = await specsApi.getAll();
      setSpecs(data);
    } catch { Alert.alert('Ошибка', 'Не удалось загрузить специальности'); }
    finally { setLoading(false); }
  }

  async function addSpec() {
    if (!specName.trim()) return;
    setSaving(true);
    try {
      const { data } = await specsApi.create(specName.trim());
      setSpecs((prev) => [...prev, data]);
      setSpecName('');
    } catch (err: any) {
      Alert.alert('Ошибка', err?.response?.data?.error ?? 'Не удалось добавить');
    } finally { setSaving(false); }
  }

  async function deleteSpec(id: number) {
    Alert.alert('Удалить специальность?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await specsApi.delete(id);
          setSpecs((prev) => prev.filter((sp) => sp.specId !== id));
        } catch (err: any) {
          Alert.alert('Ошибка', err?.response?.data?.error ?? 'Не удалось удалить');
        }
      }},
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: TAB_BAR_CLEARANCE }}>
      <View style={[s.addRow, { backgroundColor: t.card, borderColor: t.border }]}>
        <Ionicons name="school-outline" size={18} color={t.placeholder} />
        <TextInput
          style={[s.addInput, { color: t.text }]}
          value={specName}
          onChangeText={setSpecName}
          placeholder="Название специальности"
          placeholderTextColor={t.placeholder}
          onSubmitEditing={addSpec}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: palette.blue }, (!specName.trim() || saving) && s.disabled]}
          onPress={addSpec}
          disabled={!specName.trim() || saving}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="add" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={palette.blue} style={{ marginTop: 32 }} />
      ) : specs.length === 0 ? (
        <Text style={[s.emptyText, { color: t.sub }]}>Специальностей пока нет</Text>
      ) : (
        <View style={[s.listCard, { backgroundColor: t.card }]}>
          {specs.map((sp, i) => (
            <View
              key={sp.specId}
              style={[s.listItem, { borderBottomColor: t.border }, i < specs.length - 1 && { borderBottomWidth: 1 }]}
            >
              <View style={[s.listItemIcon, { backgroundColor: `${palette.blue}12` }]}>
                <Ionicons name="school-outline" size={15} color={palette.blue} />
              </View>
              <Text style={[s.listItemText, { color: t.text }]}>{sp.specName}</Text>
              <TouchableOpacity onPress={() => deleteSpec(sp.specId)} hitSlop={10}>
                <Ionicons name="trash-outline" size={18} color={palette.red} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, height: 52,
  },
  addInput: { flex: 1, fontSize: 15 },
  addBtn: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  listCard: {
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  listItemIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  listItemText: { fontSize: 15, fontWeight: '500', flex: 1 },
  emptyText: { textAlign: 'center', fontSize: 14, marginTop: 32 },
  disabled: { opacity: 0.5 },
});
