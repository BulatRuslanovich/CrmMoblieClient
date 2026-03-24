import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { physesApi } from '@/api/physes';
import { specsApi } from '@/api/specs';
import type { SpecResponse } from '@/api/types';

export default function CreatePhysScreen() {
  const t = useTheme();
  const router = useRouter();

  const [specId, setSpecId] = useState<number | null>(null);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [specs, setSpecs] = useState<SpecResponse[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [openSpecPicker, setOpenSpecPicker] = useState(false);

  useEffect(() => { loadRefs(); }, []);

  async function loadRefs() {
    try {
      const { data } = await specsApi.getAll();
      setSpecs(data);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить специализации');
    } finally {
      setLoadingData(false);
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!lastName.trim()) e.lastName = 'Введите фамилию';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await physesApi.create({
        specId,
        lastName: lastName.trim(),
        firstName: firstName.trim() || null,
        middleName: middleName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        position: position.trim() || null,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Ошибка', String(err?.response?.data?.message ?? 'Ошибка создания врача'));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSpec = specs.find((s) => s.specId === specId);

  if (loadingData) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={palette.orange} />
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Фамилия */}
      <FieldBlock label="Фамилия" required error={errors.lastName} t={t}>
        <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: errors.lastName ? palette.red : t.border }]}>
          <Ionicons name="person-outline" size={16} color={t.placeholder} />
          <TextInput
            style={[s.input, { color: t.text }]}
            value={lastName} onChangeText={setLastName}
            placeholder="Фамилия"
            placeholderTextColor={t.placeholder}
          />
        </View>
      </FieldBlock>

      {/* Имя и Отчество */}
      <View style={s.row}>
        <View style={s.half}>
          <FieldBlock label="Имя" t={t}>
            <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}>
              <Ionicons name="person-outline" size={16} color={t.placeholder} />
              <TextInput
                style={[s.input, { color: t.text }]}
                value={firstName} onChangeText={setFirstName}
                placeholder="Имя"
                placeholderTextColor={t.placeholder}
              />
            </View>
          </FieldBlock>
        </View>
        <View style={s.half}>
          <FieldBlock label="Отчество" t={t}>
            <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}>
              <Ionicons name="person-outline" size={16} color={t.placeholder} />
              <TextInput
                style={[s.input, { color: t.text }]}
                value={middleName} onChangeText={setMiddleName}
                placeholder="Отчество"
                placeholderTextColor={t.placeholder}
              />
            </View>
          </FieldBlock>
        </View>
      </View>

      {/* Специализация */}
      <FieldBlock label="Специализация" t={t}>
        <TouchableOpacity
          style={[s.selector, { backgroundColor: t.inputBg, borderColor: t.border }]}
          onPress={() => setOpenSpecPicker((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name="medical-outline" size={18} color={selectedSpec ? palette.orange : t.placeholder} />
          <Text style={[s.selectorText, { color: selectedSpec ? t.text : t.placeholder }]} numberOfLines={1}>
            {selectedSpec?.specName ?? 'Выберите специализацию'}
          </Text>
          {specId !== null && (
            <TouchableOpacity onPress={() => setSpecId(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={t.placeholder} />
            </TouchableOpacity>
          )}
          <Ionicons name={openSpecPicker ? 'chevron-up' : 'chevron-down'} size={16} color={t.placeholder} />
        </TouchableOpacity>
        {openSpecPicker && (
          <View style={[s.pickerList, { backgroundColor: t.card, borderColor: t.border }]}>
            {specs.map((item, idx) => (
              <TouchableOpacity
                key={item.specId}
                style={[
                  s.pickerItem,
                  { borderBottomColor: t.border },
                  idx < specs.length - 1 && { borderBottomWidth: 1 },
                  specId === item.specId && { backgroundColor: `${palette.orange}10` },
                ]}
                onPress={() => { setSpecId(item.specId); setOpenSpecPicker(false); }}
              >
                <Text style={[s.pickerItemLabel, { color: t.text }]}>{item.specName}</Text>
                {specId === item.specId && (
                  <Ionicons name="checkmark-circle" size={18} color={palette.orange} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </FieldBlock>

      {/* Должность */}
      <FieldBlock label="Должность" t={t}>
        <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <Ionicons name="briefcase-outline" size={16} color={t.placeholder} />
          <TextInput
            style={[s.input, { color: t.text }]}
            value={position} onChangeText={setPosition}
            placeholder="Должность"
            placeholderTextColor={t.placeholder}
          />
        </View>
      </FieldBlock>

      {/* Телефон */}
      <FieldBlock label="Телефон" t={t}>
        <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <Ionicons name="call-outline" size={16} color={t.placeholder} />
          <TextInput
            style={[s.input, { color: t.text }]}
            value={phone} onChangeText={setPhone}
            placeholder="+7 900 000 00 00"
            placeholderTextColor={t.placeholder}
            keyboardType="phone-pad"
          />
        </View>
      </FieldBlock>

      {/* Email */}
      <FieldBlock label="Email" t={t}>
        <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <Ionicons name="mail-outline" size={16} color={t.placeholder} />
          <TextInput
            style={[s.input, { color: t.text }]}
            value={email} onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor={t.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
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
            <Text style={s.submitBtnText}>Создать врача</Text>
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

  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, height: 50,
  },
  input: { flex: 1, fontSize: 14 },

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

  submitBtn: {
    backgroundColor: palette.orange, borderRadius: 16, height: 54,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12,
    shadowColor: palette.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  disabled: { opacity: 0.65 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
