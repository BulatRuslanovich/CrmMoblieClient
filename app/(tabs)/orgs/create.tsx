import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { orgsApi } from '@/api/orgs';
import { orgTypesApi } from '@/api/org-types';
import type { OrgTypeResponse } from '@/api/types';

export default function CreateOrgScreen() {
  const t = useTheme();
  const router = useRouter();

  const [orgTypeId, setOrgTypeId] = useState<number | null>(null);
  const [orgName, setOrgName] = useState('');
  const [inn, setInn] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [orgTypes, setOrgTypes] = useState<OrgTypeResponse[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [openTypePicker, setOpenTypePicker] = useState(false);

  useEffect(() => { loadRefs(); }, []);

  async function loadRefs() {
    try {
      const { data } = await orgTypesApi.getAll();
      setOrgTypes(data);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить типы организаций');
    } finally {
      setLoadingData(false);
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!orgTypeId) e.orgTypeId = 'Выберите тип организации';
    if (!orgName.trim()) e.orgName = 'Введите название';
    if (inn.trim() && !/^\d{10}$|^\d{12}$/.test(inn.trim())) e.inn = 'ИНН должен содержать 10 или 12 цифр';
    if (latitude && isNaN(Number(latitude))) e.latitude = 'Неверный формат';
    if (longitude && isNaN(Number(longitude))) e.longitude = 'Неверный формат';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await orgsApi.create({
        orgTypeId: orgTypeId!,
        orgName: orgName.trim(),
        inn: inn.trim() || null,
        address: address.trim() || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Ошибка', String(err?.response?.data?.message ?? 'Ошибка создания организации'));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedType = orgTypes.find((o) => o.orgTypeId === orgTypeId);

  if (loadingData) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={palette.green} />
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Тип организации */}
      <FieldBlock label="Тип организации" required error={errors.orgTypeId} t={t}>
        <TouchableOpacity
          style={[s.selector, { backgroundColor: t.inputBg, borderColor: errors.orgTypeId ? palette.red : t.border }]}
          onPress={() => setOpenTypePicker((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name="briefcase-outline" size={18} color={selectedType ? palette.green : t.placeholder} />
          <Text style={[s.selectorText, { color: selectedType ? t.text : t.placeholder }]} numberOfLines={1}>
            {selectedType?.orgTypeName ?? 'Выберите тип'}
          </Text>
          <Ionicons name={openTypePicker ? 'chevron-up' : 'chevron-down'} size={16} color={t.placeholder} />
        </TouchableOpacity>
        {openTypePicker && (
          <View style={[s.pickerList, { backgroundColor: t.card, borderColor: t.border }]}>
            {orgTypes.map((item, idx) => (
              <TouchableOpacity
                key={item.orgTypeId}
                style={[
                  s.pickerItem,
                  { borderBottomColor: t.border },
                  idx < orgTypes.length - 1 && { borderBottomWidth: 1 },
                  orgTypeId === item.orgTypeId && { backgroundColor: `${palette.green}10` },
                ]}
                onPress={() => { setOrgTypeId(item.orgTypeId); setOpenTypePicker(false); }}
              >
                <Text style={[s.pickerItemLabel, { color: t.text }]}>{item.orgTypeName}</Text>
                {orgTypeId === item.orgTypeId && (
                  <Ionicons name="checkmark-circle" size={18} color={palette.green} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </FieldBlock>

      {/* Название */}
      <FieldBlock label="Название" required error={errors.orgName} t={t}>
        <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: errors.orgName ? palette.red : t.border }]}>
          <Ionicons name="business-outline" size={16} color={t.placeholder} />
          <TextInput
            style={[s.input, { color: t.text }]}
            value={orgName} onChangeText={setOrgName}
            placeholder="Название организации"
            placeholderTextColor={t.placeholder}
          />
        </View>
      </FieldBlock>

      {/* ИНН */}
      <FieldBlock label="ИНН" error={errors.inn} t={t}>
        <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: errors.inn ? palette.red : t.border }]}>
          <Ionicons name="card-outline" size={16} color={t.placeholder} />
          <TextInput
            style={[s.input, { color: t.text }]}
            value={inn} onChangeText={setInn}
            placeholder="ИНН"
            placeholderTextColor={t.placeholder}
            keyboardType="numeric"
          />
        </View>
      </FieldBlock>

      {/* Адрес */}
      <FieldBlock label="Адрес" t={t}>
        <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <Ionicons name="location-outline" size={16} color={t.placeholder} />
          <TextInput
            style={[s.input, { color: t.text }]}
            value={address} onChangeText={setAddress}
            placeholder="Адрес организации"
            placeholderTextColor={t.placeholder}
          />
        </View>
      </FieldBlock>

      {/* Координаты */}
      <View style={s.row}>
        <View style={s.half}>
          <FieldBlock label="Широта" error={errors.latitude} t={t}>
            <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: errors.latitude ? palette.red : t.border }]}>
              <Ionicons name="navigate-outline" size={16} color={t.placeholder} />
              <TextInput
                style={[s.input, { color: t.text }]}
                value={latitude} onChangeText={setLatitude}
                placeholder="55.7558"
                placeholderTextColor={t.placeholder}
                keyboardType="decimal-pad"
              />
            </View>
          </FieldBlock>
        </View>
        <View style={s.half}>
          <FieldBlock label="Долгота" error={errors.longitude} t={t}>
            <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: errors.longitude ? palette.red : t.border }]}>
              <Ionicons name="navigate-outline" size={16} color={t.placeholder} />
              <TextInput
                style={[s.input, { color: t.text }]}
                value={longitude} onChangeText={setLongitude}
                placeholder="37.6173"
                placeholderTextColor={t.placeholder}
                keyboardType="decimal-pad"
              />
            </View>
          </FieldBlock>
        </View>
      </View>

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
            <Text style={s.submitBtnText}>Создать организацию</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
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
  pickerItemLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, height: 50,
  },
  input: { flex: 1, fontSize: 14 },

  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },

  submitBtn: {
    backgroundColor: palette.green, borderRadius: 16, height: 54,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12,
    shadowColor: palette.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  disabled: { opacity: 0.65 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
