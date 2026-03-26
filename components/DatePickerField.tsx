import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';

function fmtDateTime(d: Date) {
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface DatePickerFieldProps {
  value: Date | null;
  onChange: (d: Date | null) => void;
  placeholder: string;
  disabled?: boolean;
  minimumDate?: Date;
}

export function DatePickerField({ value, onChange, placeholder, disabled, minimumDate }: DatePickerFieldProps) {
  const t = useTheme();
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value ?? new Date());

  function openAndroidPicker() {
    const base = value ?? new Date();
    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      minimumDate,
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

  function onIOSChange(_: DateTimePickerEvent, selected?: Date) {
    if (selected) setTempDate(selected);
  }

  return (
    <>
      <TouchableOpacity
        style={[s.dateBtn, { backgroundColor: t.inputBg, borderColor: t.border }, disabled && s.disabled]}
        onPress={() => {
          if (disabled) return;
          setTempDate(value ?? new Date());
          if (Platform.OS === 'android') openAndroidPicker();
          else setShow(true);
        }}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <Ionicons name="calendar-outline" size={15} color={value ? palette.blue : t.placeholder} />
        <Text style={[s.dateBtnText, { color: value ? t.text : t.placeholder }]} numberOfLines={1}>
          {value ? fmtDateTime(value) : placeholder}
        </Text>
        {value && !disabled && (
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
                minimumDate={minimumDate}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const s = StyleSheet.create({
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, height: 50,
  },
  dateBtnText: { flex: 1, fontSize: 13 },
  disabled: { opacity: 0.5 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalCancel: { fontSize: 16 },
  modalDone: { fontSize: 16, fontWeight: '700' },
});
