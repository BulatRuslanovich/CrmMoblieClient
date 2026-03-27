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

  const loadRefs = useCallback(async () => {
    try {
      const { data } = await specsApi.getAll();
      setSpecs(data);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить специализации');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadRefs(); }, [loadRefs]);

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

      <FieldBlock label="Специализация" t={t}>
        <Selector
          value={selectedSpec?.specName ?? null}
          placeholder="Выберите специализацию"
          icon="medical-outline"
          open={openSpecPicker}
          onToggle={() => setOpenSpecPicker((v) => !v)}
          t={t}
        />
        {openSpecPicker && (
          <PickerList
            items={specs.map((sp) => ({ id: sp.specId, label: sp.specName }))}
            selectedId={specId}
            onSelect={(id) => { setSpecId(id); setOpenSpecPicker(false); }}
            t={t} accentColor={palette.orange}
          />
        )}
      </FieldBlock>

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

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 4, paddingBottom: 40 },

  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, height: 50,
  },
  input: { flex: 1, fontSize: 14 },

  submitBtn: {
    backgroundColor: palette.orange, borderRadius: 16, height: 54,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12,
    shadowColor: palette.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  disabled: { opacity: 0.65 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
