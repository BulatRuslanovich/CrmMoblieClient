import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette, TAB_BAR_CLEARANCE } from '@/constants/design';
import { drugsApi } from '@/api/drugs';

type DrugItem = { drugId: number; drugName: string; brand: string | null; form: string | null };
type DrugForm = { drugName: string; brand: string; form: string };

const DRUG_FIELDS: { key: keyof DrugForm; placeholder: string; icon: 'medkit-outline' | 'pricetag-outline' | 'flask-outline' }[] = [
  { key: 'drugName', placeholder: 'Название препарата *', icon: 'medkit-outline' },
  { key: 'brand',    placeholder: 'Бренд',                icon: 'pricetag-outline' },
  { key: 'form',     placeholder: 'Форма выпуска',        icon: 'flask-outline' },
];

export function DrugsSection() {
  const t = useTheme();
  const [drugs, setDrugs] = useState<DrugItem[]>([]);
  const [form, setForm] = useState<DrugForm>({ drugName: '', brand: '', form: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadDrugs(); }, []);

  async function loadDrugs() {
    try {
      const { data } = await drugsApi.getAll(1, 100);
      setDrugs(data.items);
    } catch { Alert.alert('Ошибка', 'Не удалось загрузить препараты'); }
    finally { setLoading(false); }
  }

  async function addDrug() {
    if (!form.drugName.trim()) return;
    setSaving(true);
    try {
      const { data } = await drugsApi.create({
        drugName: form.drugName.trim(),
        brand: form.brand.trim() || null,
        form: form.form.trim() || null,
        description: null,
      });
      setDrugs((prev) => [...prev, data]);
      setForm({ drugName: '', brand: '', form: '' });
    } catch (err: any) {
      Alert.alert('Ошибка', err?.response?.data?.error ?? 'Не удалось добавить');
    } finally { setSaving(false); }
  }

  async function deleteDrug(id: number) {
    Alert.alert('Удалить препарат?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await drugsApi.delete(id);
          setDrugs((prev) => prev.filter((d) => d.drugId !== id));
        } catch (err: any) {
          Alert.alert('Ошибка', err?.response?.data?.error ?? 'Не удалось удалить');
        }
      }},
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: TAB_BAR_CLEARANCE }}>
      <View style={[s.drugForm, { backgroundColor: t.card }]}>
        {DRUG_FIELDS.map(({ key, placeholder, icon }, i) => (
          <View
            key={key}
            style={[s.drugFormField, i < 2 && { borderBottomColor: t.border, borderBottomWidth: 1 }]}
          >
            <Ionicons name={icon} size={16} color={t.placeholder} />
            <TextInput
              style={[s.input, { color: t.text }]}
              value={form[key]}
              onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
              placeholder={placeholder}
              placeholderTextColor={t.placeholder}
            />
          </View>
        ))}
        <TouchableOpacity
          style={[s.drugAddBtn, { backgroundColor: palette.green }, (!form.drugName.trim() || saving) && s.disabled]}
          onPress={addDrug}
          disabled={!form.drugName.trim() || saving}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={s.drugAddBtnText}>Добавить препарат</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={palette.blue} style={{ marginTop: 32 }} />
      ) : drugs.length === 0 ? (
        <Text style={[s.emptyText, { color: t.sub }]}>Препаратов пока нет</Text>
      ) : (
        <View style={[s.listCard, { backgroundColor: t.card }]}>
          {drugs.map((d, i) => (
            <View
              key={d.drugId}
              style={[s.listItem, { borderBottomColor: t.border }, i < drugs.length - 1 && { borderBottomWidth: 1 }]}
            >
              <View style={[s.listItemIcon, { backgroundColor: `${palette.green}12` }]}>
                <Ionicons name="medkit-outline" size={15} color={palette.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.listItemText, { color: t.text }]}>{d.drugName}</Text>
                {(d.brand || d.form) && (
                  <Text style={[s.listItemSub, { color: t.sub }]}>
                    {[d.brand, d.form].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => deleteDrug(d.drugId)} hitSlop={10}>
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
  drugForm: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  drugFormField: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 50 },
  input: { flex: 1, fontSize: 15 },
  drugAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 50, margin: 10, borderRadius: 12,
  },
  drugAddBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  listCard: {
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  listItemIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  listItemText: { fontSize: 15, fontWeight: '500', flex: 1 },
  listItemSub: { fontSize: 12, marginTop: 2 },
  emptyText: { textAlign: 'center', fontSize: 14, marginTop: 32 },
  disabled: { opacity: 0.5 },
});
