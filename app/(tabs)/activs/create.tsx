import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { FieldBlock } from '@/components/FieldBlock';
import { Selector, PickerList } from '@/components/Selector';
import { DatePickerField } from '@/components/DatePickerField';
import { activsApi } from '@/api/activs';
import { orgsApi } from '@/api/orgs';
import { drugsApi } from '@/api/drugs';
import type { OrgResponse, DrugResponse } from '@/api/types';
import { sendInstantNotification, scheduleActivityReminder } from '@/services/notifications';

const STATUS_ID = { planned: 1, open: 2, saved: 3, closed: 4 } as const;

export default function CreateActivScreen() {
  const t = useTheme();
  const router = useRouter();

  const [orgId, setOrgId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState('');
  const [start, setStart] = useState<Date | null>(null);
  const [selectedDrugIds, setSelectedDrugIds] = useState<number[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [orgs, setOrgs] = useState<OrgResponse[]>([]);
  const [drugs, setDrugs] = useState<DrugResponse[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [openPicker, setOpenPicker] = useState<'org' | 'drug' | null>(null);

  const loadRefs = useCallback(async () => {
    try {
      const [o, d] = await Promise.all([orgsApi.getAll(), drugsApi.getAll()]);
      setOrgs(o.data.items); setDrugs(d.data.items);
    } catch { Alert.alert('Ошибка', 'Не удалось загрузить справочники'); }
    finally { setLoadingData(false); }
  }, []);

  useEffect(() => { loadRefs(); }, [loadRefs]);

  function validate() {
    const e: Record<string, string> = {};
    if (!orgId) e.orgId = 'Выберите организацию';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await activsApi.create({
        orgId: orgId!, statusId: STATUS_ID.planned,
        description: description || null, result: result || null,
        start: start ? start.toISOString() : null,
        end: null,
        drugIds: selectedDrugIds,
      });
      const orgName = orgs.find((o) => o.orgId === orgId)?.orgName ?? '';
      await sendInstantNotification('Визит создан', `Визит в "${orgName}" зарегистрирован`);
      if (start) await scheduleActivityReminder(orgName, start);
      router.back();
    } catch (err: any) {
      Alert.alert('Ошибка', String(err?.response?.data?.message ?? 'Ошибка создания визита'));
    } finally { setSubmitting(false); }
  }

  function toggleDrug(id: number) {
    setSelectedDrugIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  const selectedOrg = orgs.find((o) => o.orgId === orgId);

  if (loadingData) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={palette.blue} />
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <FieldBlock label="Организация" required error={errors.orgId} t={t}>
        <Selector
          value={selectedOrg?.orgName ?? null}
          placeholder="Выберите организацию"
          icon="business-outline"
          open={openPicker === 'org'}
          onToggle={() => setOpenPicker(openPicker === 'org' ? null : 'org')}
          t={t} error={!!errors.orgId}
        />
        {openPicker === 'org' && (
          <PickerList
            items={orgs.map((o) => ({ id: o.orgId, label: o.orgName, sub: o.orgTypeName }))}
            selectedId={orgId}
            onSelect={(id) => { setOrgId(id); setOpenPicker(null); }}
            t={t}
          />
        )}
      </FieldBlock>

      <FieldBlock label="Дата начала" t={t}>
        <DatePickerField value={start} onChange={setStart} placeholder="Не задано" minimumDate={new Date()} />
      </FieldBlock>

      <FieldBlock label="Описание" t={t}>
        <View style={[s.textareaWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <TextInput
            style={[s.textarea, { color: t.text }]}
            value={description} onChangeText={setDescription}
            placeholder="Описание визита..."
            placeholderTextColor={t.placeholder}
            multiline numberOfLines={3} textAlignVertical="top"
          />
        </View>
      </FieldBlock>

      <FieldBlock label="Результат" t={t}>
        <View style={[s.textareaWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <TextInput
            style={[s.textarea, { color: t.text }]}
            value={result} onChangeText={setResult}
            placeholder="Результат визита..."
            placeholderTextColor={t.placeholder}
            multiline numberOfLines={3} textAlignVertical="top"
          />
        </View>
      </FieldBlock>

      <FieldBlock label={`Препараты${selectedDrugIds.length ? ` (${selectedDrugIds.length})` : ''}`} t={t}>
        <Selector
          value={selectedDrugIds.length ? `Выбрано: ${selectedDrugIds.length}` : null}
          placeholder="Добавить препараты"
          icon="medkit-outline"
          open={openPicker === 'drug'}
          onToggle={() => setOpenPicker(openPicker === 'drug' ? null : 'drug')}
          t={t}
        />
        {openPicker === 'drug' && (
          <View style={[s.drugPicker, { backgroundColor: t.card, borderColor: t.border }]}>
            {drugs.map((d) => (
              <TouchableOpacity
                key={d.drugId}
                style={[s.drugItem, { borderBottomColor: t.border }]}
                onPress={() => toggleDrug(d.drugId)}
              >
                <View style={[
                  s.checkbox,
                  { borderColor: selectedDrugIds.includes(d.drugId) ? palette.blue : t.border },
                  selectedDrugIds.includes(d.drugId) && { backgroundColor: palette.blue },
                ]}>
                  {selectedDrugIds.includes(d.drugId) && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
                <View style={s.drugInfo}>
                  <Text style={[s.drugName, { color: t.text }]}>{d.drugName}</Text>
                  {d.brand ? <Text style={[s.drugBrand, { color: t.sub }]}>{d.brand}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </FieldBlock>

      <TouchableOpacity
        style={[s.submitBtn, submitting && s.disabled]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={s.submitBtnText}>Создать визит</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}


const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 4, paddingBottom: 40 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, height: 50,
  },
  input: { flex: 1, fontSize: 14 },

  textareaWrap: { borderWidth: 1.5, borderRadius: 14, padding: 12 },
  textarea: { fontSize: 15, minHeight: 72 },

  dateRow: { flexDirection: 'row', gap: 10 },
  dateHalf: { flex: 1 },

  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, height: 50,
  },
  dateBtnText: { flex: 1, fontSize: 13 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalCancel: { fontSize: 16 },
  modalDone: { fontSize: 16, fontWeight: '700' },

  drugPicker: {
    borderWidth: 1.5, borderRadius: 14, marginTop: 6, maxHeight: 240, overflow: 'hidden',
  },
  drugItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  drugInfo: { flex: 1 },
  drugName: { fontSize: 15, fontWeight: '500' },
  drugBrand: { fontSize: 12, marginTop: 1 },

  submitBtn: {
    backgroundColor: palette.blue, borderRadius: 16, height: 54,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12,
    shadowColor: palette.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  disabled: { opacity: 0.65 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
