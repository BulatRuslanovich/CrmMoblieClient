import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Modal, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { activsApi } from '@/api/activs';
import { orgsApi } from '@/api/orgs';
import { statusesApi } from '@/api/statuses';
import { drugsApi } from '@/api/drugs';
import type { OrgResponse, StatusResponse, DrugResponse } from '@/api/types';
import { sendInstantNotification, scheduleActivityReminder } from '@/services/notifications';

export default function CreateActivScreen() {
  const t = useTheme();
  const router = useRouter();

  const [orgId, setOrgId] = useState<number | null>(null);
  const [statusId, setStatusId] = useState<number | null>(null);
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

  useEffect(() => { loadRefs(); }, []);

  async function loadRefs() {
    try {
      const [o, s, d] = await Promise.all([orgsApi.getAll(), statusesApi.getAll(), drugsApi.getAll()]);
      setOrgs(o.data); setDrugs(d.data);
      const planned = s.data.find((st: StatusResponse) =>
        st.statusName.toLowerCase().includes('запланир')
      );
      if (planned) setStatusId(planned.statusId);
    } catch { Alert.alert('Ошибка', 'Не удалось загрузить справочники'); }
    finally { setLoadingData(false); }
  }

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
        orgId: orgId!, statusId: statusId!,
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
      {/* Org */}
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


      {/* Dates */}
      <FieldBlock label="Дата начала" t={t}>
        <DatePickerField value={start} onChange={setStart} placeholder="Не задано" t={t} />
      </FieldBlock>

      {/* Description */}
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

      {/* Result */}
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

      {/* Drugs */}
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

      {/* Submit */}
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

function fmtDateTime(d: Date) {
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function DatePickerField({
  value, onChange, placeholder, t,
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
  placeholder: string;
  t: ReturnType<typeof useTheme>;
}) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value ?? new Date());

  function openAndroidPicker() {
    const base = value ?? new Date();
    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      onChange: (e, date) => {
        if (e.type === 'dismissed' || !date) return;
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: true,
          onChange: (e2, time) => {
            if (e2.type === 'dismissed' || !time) return;
            const result = new Date(date);
            result.setHours(time.getHours(), time.getMinutes(), 0, 0);
            onChange(result);
          },
        });
      },
    });
  }

  function onIOSChange(_: any, selected?: Date) {
    if (selected) setTempDate(selected);
  }

  return (
    <>
      <TouchableOpacity
        style={[s.dateBtn, { backgroundColor: t.inputBg, borderColor: t.border }]}
        onPress={() => {
          setTempDate(value ?? new Date());
          if (Platform.OS === 'android') openAndroidPicker();
          else setShow(true);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="calendar-outline" size={15} color={value ? palette.blue : t.placeholder} />
        <Text style={[s.dateBtnText, { color: value ? t.text : t.placeholder }]} numberOfLines={1}>
          {value ? fmtDateTime(value) : placeholder}
        </Text>
        {value && (
          <TouchableOpacity onPress={() => onChange(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={15} color={t.placeholder} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={[s.modalSheet, { backgroundColor: t.card }]}>
              <View style={[s.modalHeader, { borderBottomColor: t.border }]}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={[s.modalCancel, { color: t.sub }]}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { onChange(tempDate); setShow(false); }}>
                  <Text style={[s.modalDone, { color: palette.blue }]}>Готово</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate} mode="datetime" display="spinner"
                onChange={onIOSChange} locale="ru-RU" style={{ flex: 1 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

function FieldBlock({
  label, required, error, t, children,
}: {
  label: string; required?: boolean; error?: string;
  t: ReturnType<typeof useTheme>; children: React.ReactNode;
}) {
  return (
    <View style={s.fieldBlock}>
      <View style={s.labelRow}>
        <Text style={[s.label, { color: t.sub }]}>{label}</Text>
        {required && <Text style={s.required}>*</Text>}
      </View>
      {children}
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

function Selector({
  value, placeholder, icon, open, onToggle, t, error,
}: {
  value: string | null; placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  open: boolean; onToggle: () => void;
  t: ReturnType<typeof useTheme>; error?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.selector, { backgroundColor: t.inputBg, borderColor: error ? palette.red : t.border }]}
      onPress={onToggle} activeOpacity={0.8}
    >
      <Ionicons name={icon} size={18} color={value ? palette.blue : t.placeholder} />
      <Text style={[s.selectorText, { color: value ? t.text : t.placeholder }]} numberOfLines={1}>
        {value ?? placeholder}
      </Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={t.placeholder} />
    </TouchableOpacity>
  );
}

function PickerList({
  items, selectedId, onSelect, t,
}: {
  items: { id: number; label: string; sub?: string }[];
  selectedId: number | null; onSelect: (id: number) => void;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[s.pickerList, { backgroundColor: t.card, borderColor: t.border }]}>
      {items.map((item, idx) => (
        <TouchableOpacity
          key={item.id}
          style={[
            s.pickerItem,
            { borderBottomColor: t.border },
            idx < items.length - 1 && { borderBottomWidth: 1 },
            selectedId === item.id && { backgroundColor: `${palette.blue}10` },
          ]}
          onPress={() => onSelect(item.id)}
        >
          <View style={s.pickerItemContent}>
            <Text style={[s.pickerItemLabel, { color: t.text }]}>{item.label}</Text>
            {item.sub ? <Text style={[s.pickerItemSub, { color: t.sub }]}>{item.sub}</Text> : null}
          </View>
          {selectedId === item.id && (
            <Ionicons name="checkmark-circle" size={18} color={palette.blue} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}


const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 4, paddingBottom: 40 },

  fieldBlock: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  required: { color: palette.red, fontWeight: '700', fontSize: 13 },
  error: { color: palette.red, fontSize: 12, marginTop: 4, marginLeft: 2 },

  selector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, height: 50,
  },
  selectorText: { flex: 1, fontSize: 15 },
  pickerList: {
    borderWidth: 1.5, borderRadius: 14, marginTop: 6,
    maxHeight: 220, overflow: 'hidden',
  },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  pickerItemContent: { flex: 1 },
  pickerItemLabel: { fontSize: 15, fontWeight: '500' },
  pickerItemSub: { fontSize: 12, marginTop: 1 },

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
