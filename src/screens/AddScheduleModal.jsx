import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import { API_BASE_URL } from '../../settings';
import { COLORS, addScheduleStyles as S } from './addScheduleStyles';

// ─────────────────────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────────────────────

const WEEKDAYS  = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_KOR = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const MAX_WEEKS = 52;

// ─────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────

const fmtDate = d =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

const sameDay = (a, b) =>
  a && b && a.toDateString() === b.toDateString();

const getDim      = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

function buildCells(y, m) {
  const dim   = getDim(y, m);
  const fd    = getFirstDay(y, m);
  const pd    = getDim(y, m === 0 ? 11 : m - 1);
  const cells = [];

  for (let i = 0; i < fd; i++)   cells.push({ d: pd - fd + 1 + i, t: 'p' });
  for (let i = 1; i <= dim; i++) cells.push({ d: i, t: 'c' });
  while (cells.length < 42)      cells.push({ d: cells.length - fd - dim + 1, t: 'n' });

  return cells;
}

function getCellDate(y, m, { d, t }) {
  const yr = t === 'p' ? (m === 0  ? y - 1 : y) : t === 'n' ? (m === 11 ? y + 1 : y) : y;
  const mo = t === 'p' ? (m === 0  ? 11    : m - 1) : t === 'n' ? (m === 11 ? 0 : m + 1) : m;
  const dt = new Date(yr, mo, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

// ─────────────────────────────────────────────────────────────
// Toggle 컴포넌트
// ─────────────────────────────────────────────────────────────

function Toggle({ value, onToggle }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[S.track, value && S.trackOn]}
      activeOpacity={0.85}
    >
      <View style={[S.thumb, value && S.thumbOn]} />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// InlineDatePicker 컴포넌트
// ─────────────────────────────────────────────────────────────

function InlineDatePicker({ value, onChange, minDate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [vy, setVy] = useState(value ? value.getFullYear() : today.getFullYear());
  const [vm, setVm] = useState(value ? value.getMonth()    : today.getMonth());

  const prevMonth = () => { if (vm === 0)  { setVy(y => y - 1); setVm(11); } else setVm(m => m - 1); };
  const nextMonth = () => { if (vm === 11) { setVy(y => y + 1); setVm(0);  } else setVm(m => m + 1); };

  const cells = buildCells(vy, vm);
  const rows  = Array.from({ length: 6 }, (_, r) => cells.slice(r * 7, r * 7 + 7));

  return (
    <View style={S.calWrap}>
      {/* 월 네비게이션 */}
      <View style={S.calNavRow}>
        <TouchableOpacity onPress={prevMonth} style={S.calNavBtn}>
          <ChevronLeft size={16} color={COLORS.textSub} />
        </TouchableOpacity>
        <Text style={S.calNavTitle}>{vy}년 {MONTH_KOR[vm]}</Text>
        <TouchableOpacity onPress={nextMonth} style={S.calNavBtn}>
          <ChevronRight size={16} color={COLORS.textSub} />
        </TouchableOpacity>
      </View>

      {/* 캘린더 그리드 */}
      <View style={S.calInner}>
        <View style={S.calWeekRow}>
          {WEEKDAYS.map(w => <Text key={w} style={S.calWd}>{w}</Text>)}
        </View>

        {rows.map((row, ri) => (
          <View key={ri} style={S.calDaysRow}>
            {row.map((cell, ci) => {
              const cd      = getCellDate(vy, vm, cell);
              const isSel   = sameDay(cd, value);
              const isToday = sameDay(cd, today);
              const isOther = cell.t !== 'c';
              const isDis   = minDate && cd < minDate && !sameDay(cd, minDate);

              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    S.calDay,
                    isSel             && S.calDaySel,
                    isToday && !isSel && S.calDayToday,
                  ]}
                  onPress={() => !isDis && onChange(cd)}
                  disabled={isDis}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    S.calDayText,
                    isSel             && S.calDayTextSel,
                    isToday && !isSel && S.calDayTextToday,
                    isOther           && S.calDayTextOther,
                    isDis             && S.calDayTextDisabled,
                  ]}>
                    {cell.d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// TimeInput 컴포넌트
// ─────────────────────────────────────────────────────────────

function TimeInput({ icon, label, hour, minute, onHourChange, onMinuteChange, disabled }) {
  // 숫자만 허용 + 최대값 초과 방지
  const clamp = (v, max) => {
    const n = v.replace(/\D/g, '').slice(0, 2);
    if (n !== '' && parseInt(n, 10) > max) return String(max);
    return n;
  };

  return (
    <View style={[S.timeBlock, disabled && S.timeBlockDim]}>
      <Text style={S.timeIcon}>{icon}</Text>
      <View style={S.timeInputs}>
        <TextInput
          style={S.timeInput}
          value={hour}
          onChangeText={v => onHourChange(clamp(v, 23))}
          keyboardType="number-pad"
          maxLength={2}
          editable={!disabled}
        />
        <Text style={S.timeSep}>:</Text>
        <TextInput
          style={S.timeInput}
          value={minute}
          onChangeText={v => onMinuteChange(clamp(v, 59))}
          keyboardType="number-pad"
          maxLength={2}
          editable={!disabled}
        />
      </View>
      <Text style={S.timeLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// RepeatSummary 컴포넌트 — 반복 일정 요약 표시
// ─────────────────────────────────────────────────────────────

function RepeatSummary({ days, weeks, startH, startM, endH, endM, allDay }) {
  if (days.length === 0) return null;

  const dayStr  = [...days].sort((a, b) => a - b).map(d => WEEKDAYS[d] + '요일').join(', ');
  const timeStr = allDay ? '하루 종일' : `${startH}:${startM} ~ ${endH}:${endM}`;

  return (
    <View style={S.summary}>
      <Text style={S.summaryText}>
        <Text style={S.summaryBold}>{dayStr}</Text>
        {'  ·  '}
        <Text style={S.summaryBold}>{weeks}주</Text>
        {' 반복\n'}
        {timeStr}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// AddScheduleModal — 메인 export
// editingEvent prop이 있으면 수정 모드, 없으면 등록 모드
// ─────────────────────────────────────────────────────────────

export default function AddScheduleModal(props) {
  const { visible, onClose, onSave, initialDate, onSaveSuccess, editingEvent } = props;

  const modalizeRef = useRef(null);
  const isEditMode  = !!editingEvent; // 수정 모드 여부

  // ── visible 변경 시 모달 열기/닫기 ──
  useEffect(() => {
    if (visible) {
      modalizeRef.current?.open();
    } else {
      modalizeRef.current?.close();
    }
  }, [visible]);

  // ── 폼 상태 ──
  const [title,           setTitle          ] = useState('');
  const [desc,            setDesc           ] = useState('');
  const [location,        setLocation       ] = useState('');
  const [startDate,       setStartDate      ] = useState(null);
  const [endDate,         setEndDate        ] = useState(null);
  const [activePicker,    setActivePicker   ] = useState(null);
  const [startH,          setStartH         ] = useState('09');
  const [startM,          setStartM         ] = useState('00');
  const [endH,            setEndH           ] = useState('10');
  const [endM,            setEndM           ] = useState('00');
  const [allDay,          setAllDay         ] = useState(false);
  const [repeatOn,        setRepeatOn       ] = useState(false);
  const [repeatDays,      setRepeatDays     ] = useState([]);
  const [repeatWeeks,     setRepeatWeeks    ] = useState(1);

  // 포커스 상태
  const [titleFocused,    setTitleFocused   ] = useState(false);
  const [descFocused,     setDescFocused    ] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);

  // ── 수정 모드일 때 기존 데이터로 폼 초기화 ──
  useEffect(() => {
    if (editingEvent) {
      const s = new Date(editingEvent.startDateTime);
      const e = new Date(editingEvent.endDateTime);

      setTitle(editingEvent.title       || '');
      setDesc(editingEvent.description  || '');
      setLocation(editingEvent.location || '');
      setStartDate(s);
      setEndDate(e);
      setStartH(String(s.getHours()).padStart(2, '0'));
      setStartM(String(s.getMinutes()).padStart(2, '0'));
      setEndH(String(e.getHours()).padStart(2, '0'));
      setEndM(String(e.getMinutes()).padStart(2, '0'));
      setAllDay(editingEvent.allDay     || false);
    } else {
      // 등록 모드 — 폼 초기화
      resetForm();
    }
  }, [editingEvent, visible]);

  // ── 폼 초기화 헬퍼 ──
  const resetForm = () => {
    setTitle('');
    setDesc('');
    setLocation('');
    setStartDate(null);
    setEndDate(null);
    setStartH('09');
    setStartM('00');
    setEndH('10');
    setEndM('00');
    setAllDay(false);
    setRepeatOn(false);
    setRepeatDays([]);
    setRepeatWeeks(1);
    setActivePicker(null);
  };

  // ── 날짜 핸들러 ──
  const handleStartDate = useCallback((date) => {
    setStartDate(date);
    if (endDate && date > endDate) setEndDate(null);
    setActivePicker(null);
  }, [endDate]);

  const handleEndDate = useCallback((date) => {
    setEndDate(date);
    setActivePicker(null);
  }, []);

  // ── 반복 요일 토글 ──
  const toggleDay = (d) =>
    setRepeatDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );

  const pad = v => String(v || '0').padStart(2, '0');

  // ── 저장 핸들러 (등록 POST / 수정 PUT 분기) ──
  const handleSave = async () => {
    if (!title.trim()) return;

    // 날짜 파트 추출 (한국 시간 기준)
    const baseDate  = startDate || initialDate || new Date();
    const offset    = baseDate.getTimezoneOffset() * 60000;
    const localDate = new Date(baseDate.getTime() - offset);
    const datePart  = localDate.toISOString().split('T')[0];

    // 종료 날짜 파트 (수정 모드에서 endDate가 다를 수 있음)
    const baseEndDate  = endDate || baseDate;
    const offsetEnd    = baseEndDate.getTimezoneOffset() * 60000;
    const localEndDate = new Date(baseEndDate.getTime() - offsetEnd);
    const endDatePart  = localEndDate.toISOString().split('T')[0];

    const hS = String(startH || '00').padStart(2, '0');
    const mS = String(startM || '00').padStart(2, '0');
    const hE = String(endH   || '00').padStart(2, '0');
    const mE = String(endM   || '00').padStart(2, '0');

    const eventData = {
      title:         title.trim(),
      description:   desc.trim(),
      startDateTime: `${datePart}T${hS}:${mS}:00`,
      endDateTime:   `${endDatePart}T${hE}:${mE}:00`,
      allDay,
      location:      location.trim(),
    };

    try {
      const token = await AsyncStorage.getItem('userToken');

      // 수정이면 PUT, 등록이면 POST
      const url    = isEditMode
        ? `${API_BASE_URL}/api/v1/events/${editingEvent.id}`
        : `${API_BASE_URL}/api/v1/events`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        // 저장 성공 → 캘린더 refetch
        if (typeof onSaveSuccess === 'function') await onSaveSuccess();

        // 로컬 콜백 (선택)
        onSave?.({
          ...eventData,
          repeat: repeatOn ? { days: repeatDays, weeks: repeatWeeks } : null,
        });

        resetForm();
        modalizeRef.current?.close();
      } else {
        alert('서버 저장에 실패했어요 ㅠㅠ');
      }
    } catch (error) {
      console.error('네트워크 에러:', error);
      alert('서버 연결을 확인해주세요.');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 렌더
  // ─────────────────────────────────────────────────────────────

  return (
    <Modalize
      ref={modalizeRef}
      onClosed={onClose}
      modalHeight={Dimensions.get('window').height * 0.85}
      handlePosition="inside"
      adjustToContentHeight={false}
      rootStyle={{ zIndex: 9999 }}
      modalStyle={{
        borderTopLeftRadius:  40,
        borderTopRightRadius: 40,
        backgroundColor:      COLORS.sheet,
      }}
      overlayStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      keyboardAvoidingBehavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 100 }}>

        {/* ── 헤더 ── */}
        <View style={[S.header, { paddingTop: 30, marginBottom: 10 }]}>
          <TouchableOpacity onPress={() => modalizeRef.current?.close()}>
            <X size={24} color={COLORS.textMain} />
          </TouchableOpacity>

          {/* 수정 모드면 '일정 수정', 등록 모드면 '새 일정' */}
          <Text style={S.headerTitle}>{isEditMode ? '일정 수정' : '새 일정'}</Text>

          <TouchableOpacity style={S.saveBtn} onPress={handleSave}>
            <Text style={S.saveBtnText}>저장</Text>
          </TouchableOpacity>
        </View>

        {/* ── 폼 ── */}
        <View style={[S.formContent, { paddingHorizontal: 0 }]}>

          {/* 제목 */}
          <View style={{ marginBottom: 20 }}>
            <Text style={S.fieldLabel}>제목</Text>
            <TextInput
              style={[S.textInput, titleFocused && S.textInputFocused]}
              placeholder="일정 제목을 입력하세요"
              placeholderTextColor={COLORS.placeholder}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
            />
          </View>

          {/* 설명 */}
          <View style={{ marginBottom: 20 }}>
            <Text style={S.fieldLabel}>설명</Text>
            <TextInput
              style={[S.textInput, S.textArea, descFocused && S.textInputFocused]}
              placeholder="메모 또는 설명"
              placeholderTextColor={COLORS.placeholder}
              value={desc}
              onChangeText={setDesc}
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
              multiline
            />
          </View>

          {/* 날짜 */}
          <View style={{ marginBottom: 20 }}>
            <Text style={S.fieldLabel}>날짜</Text>
            <View style={S.dateRow}>
              <TouchableOpacity
                style={[S.dateBlock, activePicker === 'start' && S.dateBlockActive]}
                onPress={() => setActivePicker(activePicker === 'start' ? null : 'start')}
              >
                <Text style={S.dateBlockLabel}>시작</Text>
                <Text style={S.dateBlockValue}>{startDate ? fmtDate(startDate) : '날짜 선택'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[S.dateBlock, activePicker === 'end' && S.dateBlockActive]}
                onPress={() => setActivePicker(activePicker === 'end' ? null : 'end')}
              >
                <Text style={S.dateBlockLabel}>종료</Text>
                <Text style={S.dateBlockValue}>{endDate ? fmtDate(endDate) : '날짜 선택'}</Text>
              </TouchableOpacity>
            </View>

            {activePicker === 'start' && (
              <InlineDatePicker value={startDate} onChange={handleStartDate} />
            )}
            {activePicker === 'end' && (
              <InlineDatePicker value={endDate} onChange={handleEndDate} minDate={startDate} />
            )}
          </View>

          {/* 시간 */}
          <View style={{ marginBottom: 20 }}>
            <Text style={S.fieldLabel}>시간</Text>
            <View style={S.timeRow}>
              <TimeInput
                icon="🕘" label="시작"
                hour={startH} minute={startM}
                onHourChange={setStartH} onMinuteChange={setStartM}
                disabled={allDay}
              />
              <TimeInput
                icon="🕕" label="종료"
                hour={endH} minute={endM}
                onHourChange={setEndH} onMinuteChange={setEndM}
                disabled={allDay}
              />
            </View>
          </View>

          {/* 옵션 — 하루 종일 */}
          <View style={{ marginBottom: 20 }}>
            <Text style={S.fieldLabel}>옵션</Text>
            <TouchableOpacity
              style={S.toggleRow}
              onPress={() => setAllDay(v => !v)}
              activeOpacity={0.8}
            >
              <View style={S.toggleLeft}>
                <View style={S.toggleIcon}>
                  <Text style={S.toggleIconText}>🌙</Text>
                </View>
                <Text style={S.toggleLabel}>하루 종일</Text>
              </View>
              <Toggle value={allDay} onToggle={() => setAllDay(v => !v)} />
            </TouchableOpacity>
          </View>

          {/* 반복 일정 */}
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              style={S.toggleRow}
              onPress={() => setRepeatOn(v => !v)}
              activeOpacity={0.8}
            >
              <View style={S.toggleLeft}>
                <View style={S.toggleIcon}>
                  <Text style={S.toggleIconText}>🔁</Text>
                </View>
                <View>
                  <Text style={S.toggleLabel}>반복 일정</Text>
                  <Text style={S.toggleSub}>특정 요일 반복 저장</Text>
                </View>
              </View>
              <Toggle value={repeatOn} onToggle={() => setRepeatOn(v => !v)} />
            </TouchableOpacity>

            {repeatOn && (
              <View style={S.repeatInner}>

                {/* 반복 요일 */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={[S.fieldLabel, { marginBottom: 8 }]}>반복 요일</Text>
                  <View style={S.pillsRow}>
                    {WEEKDAYS.map((w, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[S.pill, repeatDays.includes(i) && S.pillOn]}
                        onPress={() => toggleDay(i)}
                        activeOpacity={0.7}
                      >
                        <Text style={[S.pillText, repeatDays.includes(i) && S.pillTextOn]}>
                          {w}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 반복 기간 */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={[S.fieldLabel, { marginBottom: 8 }]}>반복 기간</Text>
                  <View style={S.stepper}>
                    <TouchableOpacity
                      style={[S.stepBtn, repeatWeeks <= 1 && S.stepBtnDisabled]}
                      onPress={() => setRepeatWeeks(w => Math.max(1, w - 1))}
                      disabled={repeatWeeks <= 1}
                    >
                      <Text style={S.stepBtnText}>−</Text>
                    </TouchableOpacity>

                    <View style={S.stepCenter}>
                      <Text style={S.stepVal}>{repeatWeeks}</Text>
                      <Text style={S.stepUnit}>주 반복</Text>
                    </View>

                    <TouchableOpacity
                      style={[S.stepBtn, repeatWeeks >= MAX_WEEKS && S.stepBtnDisabled]}
                      onPress={() => setRepeatWeeks(w => Math.min(MAX_WEEKS, w + 1))}
                      disabled={repeatWeeks >= MAX_WEEKS}
                    >
                      <Text style={S.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 반복 요약 */}
                <RepeatSummary
                  days={repeatDays}
                  weeks={repeatWeeks}
                  startH={pad(startH)} startM={pad(startM)}
                  endH={pad(endH)}     endM={pad(endM)}
                  allDay={allDay}
                />

              </View>
            )}
          </View>

          {/* 장소 */}
          <View>
            <Text style={S.fieldLabel}>장소</Text>
            <View style={[S.locWrap, locationFocused && S.locWrapFocused]}>
              <Text style={S.locIcon}>📍</Text>
              <TextInput
                style={S.locInput}
                placeholder="장소를 입력하세요"
                placeholderTextColor={COLORS.placeholder}
                value={location}
                onChangeText={setLocation}
                onFocus={() => setLocationFocused(true)}
                onBlur={() => setLocationFocused(false)}
                returnKeyType="done"
              />
            </View>
            <View style={{ height: 50 }} />
          </View>

        </View>
      </View>
    </Modalize>
  );
}