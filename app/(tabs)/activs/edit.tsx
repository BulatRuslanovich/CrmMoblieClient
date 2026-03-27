import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { FieldBlock } from '@/components/FieldBlock';
import { STATUSES } from '@/constants/activs';
import { DatePickerField } from '@/components/DatePickerField';
import { activsApi } from '@/api/activs';
import type { ActivResponse } from '@/api/types';
import { useAuth } from '@/store/auth-context';


export default function EditActivScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.policies.includes('Admin') ?? false;

  const [activ, setActiv] = useState<ActivResponse | null>(null);
  const [statusId, setStatusId] = useState<number | null>(null);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState('');

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openStatusPicker, setOpenStatusPicker] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const activRes = await activsApi.getById(Number(id));

      const a = activRes.data;
      setActiv(a);
      setStatusId(a.statusId);
      setStart(a.start ? new Date(a.start) : null);
      setEnd(a.end ? new Date(a.end) : null);
      setDescription(a.description ?? '');
      setResult(a.result ?? '');
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить визит');
      router.back();
    } finally {
      setLoadingData(false);
    }
  }, [id, router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSubmit() {
    if (!statusId) {
      Alert.alert('Ошибка', 'Выберите статус');
      return;
    }
    setSubmitting(true);
    try {
      await activsApi.update(Number(id), {
        statusId,
        start: start ? start.toISOString() : null,
        end: end ? end.toISOString() : null,
        description: description.trim() || null,
        result: result.trim() || null,
      });
      Alert.alert('Готово', 'Визит сохранён', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Ошибка', String(err?.response?.data?.message ?? 'Ошибка сохранения'));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedStatus = STATUSES.find((s) => s.statusId === statusId);
  const isClosed = activ?.statusId === 4 && !isAdmin;

  if (loadingData) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={palette.blue} />
    </View>
  );

  if (!activ) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      {isClosed && (
        <View style={[s.closedBanner, { backgroundColor: `${palette.red}12`, borderColor: `${palette.red}30` }]}>
          <Ionicons name="lock-closed" size={16} color={palette.red} />
          <Text style={[s.closedBannerText, { color: palette.red }]}>Визит закрыт — редактирование недоступно</Text>
        </View>
      )}

      {isAdmin && (
        <FieldBlock label="Статус" required t={t}>
          <TouchableOpacity
            style={[s.selector, { backgroundColor: t.inputBg, borderColor: t.border }, isClosed && s.fieldDisabled]}
            onPress={() => !isClosed && setOpenStatusPicker((v) => !v)}
            activeOpacity={isClosed ? 1 : 0.8}
          >
            <Ionicons name="flag-outline" size={18} color={selectedStatus ? palette.blue : t.placeholder} />
            <Text style={[s.selectorText, { color: selectedStatus ? t.text : t.placeholder }]} numberOfLines={1}>
              {selectedStatus?.statusName ?? 'Выберите статус'}
            </Text>
            <Ionicons name={openStatusPicker ? 'chevron-up' : 'chevron-down'} size={16} color={t.placeholder} />
          </TouchableOpacity>
          {openStatusPicker && !isClosed && (
            <View style={[s.pickerList, { backgroundColor: t.card, borderColor: t.border }]}>
              {STATUSES.map((item, idx) => (
                <TouchableOpacity
                  key={item.statusId}
                  style={[
                    s.pickerItem,
                    { borderBottomColor: t.border },
                    idx < STATUSES.length - 1 && { borderBottomWidth: 1 },
                    statusId === item.statusId && { backgroundColor: `${palette.blue}10` },
                  ]}
                  onPress={() => { setStatusId(item.statusId); setOpenStatusPicker(false); }}
                >
                  <Text style={[s.pickerItemLabel, { color: t.text }]}>{item.statusName}</Text>
                  {statusId === item.statusId && (
                    <Ionicons name="checkmark-circle" size={18} color={palette.blue} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </FieldBlock>
      )}

      {isAdmin && (
        <View style={s.row}>
          <View style={s.half}>
            <FieldBlock label="Дата начала" t={t}>
              <DatePickerField value={start} onChange={setStart} placeholder="Не задано" disabled={isClosed} />
            </FieldBlock>
          </View>
          <View style={s.half}>
            <FieldBlock label="Дата конца" t={t}>
              <DatePickerField value={end} onChange={setEnd} placeholder="Не задано" disabled={isClosed} />
            </FieldBlock>
          </View>
        </View>
      )}

      <FieldBlock label="Описание" t={t}>
        <View style={[s.textareaWrap, { backgroundColor: t.inputBg, borderColor: t.border }, isClosed && s.fieldDisabled]}>
          <TextInput
            style={[s.textarea, { color: t.text }]}
            value={description} onChangeText={setDescription}
            placeholder="Описание визита..."
            placeholderTextColor={t.placeholder}
            multiline numberOfLines={3} textAlignVertical="top"
            editable={!isClosed}
          />
        </View>
      </FieldBlock>

      <FieldBlock label="Результат" t={t}>
        <View style={[s.textareaWrap, { backgroundColor: t.inputBg, borderColor: t.border }, isClosed && s.fieldDisabled]}>
          <TextInput
            style={[s.textarea, { color: t.text }]}
            value={result} onChangeText={setResult}
            placeholder="Результат визита..."
            placeholderTextColor={t.placeholder}
            multiline numberOfLines={3} textAlignVertical="top"
            editable={!isClosed}
          />
        </View>
      </FieldBlock>

      {!isClosed && (
        <TouchableOpacity
          style={[s.submitBtn, submitting && s.disabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={s.submitBtnText}>Сохранить</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}


const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 4, paddingBottom: 40 },

  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },

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

  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, height: 50,
  },
  dateBtnText: { flex: 1, fontSize: 13 },

  textareaWrap: { borderWidth: 1.5, borderRadius: 14, padding: 12 },
  textarea: { fontSize: 15, minHeight: 72 },

  submitBtn: {
    backgroundColor: palette.blue, borderRadius: 16, height: 54,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12,
    shadowColor: palette.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  disabled: { opacity: 0.65 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalCancel: { fontSize: 16 },
  modalDone: { fontSize: 16, fontWeight: '700' },

  closedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8,
  },
  closedBannerText: { fontSize: 14, fontWeight: '600', flex: 1 },
  fieldDisabled: { opacity: 0.5 },
});
