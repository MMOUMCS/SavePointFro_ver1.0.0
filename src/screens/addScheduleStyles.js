import { Platform, StyleSheet } from 'react-native';

// ── 프로젝트 THEME에 맞게 수정하세요 ──────────────────────────
export const COLORS = {
  primary:     '#5B7FFF',
  primary10:   'rgba(91,127,255,0.10)',
  textMain:    '#1A1D2E',
  textSub:     '#9399B2',
  border:      '#ECEEF6',
  card:        '#FFFFFF',
  sheet:       '#FAFBFF',
  placeholder: '#C8CCE0',
};

export const addScheduleStyles = StyleSheet.create({

  // ── Overlay ──────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },

  // ── Sheet ────────────────────────────────────────────────────
  sheet: {
    backgroundColor: COLORS.sheet,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    overflow: 'hidden',
    height: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,

    shadowColor: "#000",
  shadowOffset: { width: 0, height: -10 },
  shadowOpacity: 0.2,
  shadowRadius: 15,
  elevation: 20, 
  },
  handle: {
    width: 34, height: 4, borderRadius: 2,
    backgroundColor: '#D4D8EE',
    alignSelf: 'center', marginTop: 10,
  },

  scroll: {
    flex: 1,
  },

  // ── Header ───────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.textMain },
  closeBtn:     { width: 28, height: 28, borderRadius: 8, backgroundColor: '#ECEEF6', alignItems: 'center', justifyContent: 'center' },
  saveBtn:      { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: COLORS.primary, borderRadius: 9 },
  saveBtnText:  { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  // ── Form ─────────────────────────────────────────────────────
  formScroll:   { flex: 1 },
  formContent:  { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 30, gap: 20 },
  fieldLabel:   { fontSize: 9, fontWeight: '700', color: COLORS.textSub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },

  // ── Text inputs ──────────────────────────────────────────────
  textInput:        { width: '100%', backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '500', color: COLORS.textMain },
  textInputFocused: { borderColor: COLORS.primary },
  textArea:         { height: 68, textAlignVertical: 'top', paddingTop: 11 },

  // ── Date row ─────────────────────────────────────────────────
  dateRow:              { flexDirection: 'row', gap: 8 },
  dateBlock:            { flex: 1, backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 10 },
  dateBlockActive:      { borderColor: COLORS.primary },
  dateBlockLabel:       { fontSize: 8, fontWeight: '700', color: COLORS.textSub, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  dateBlockValue:       { fontSize: 13, fontWeight: '600', color: COLORS.textMain },
  dateBlockPlaceholder: { color: COLORS.placeholder },

  // ── Inline calendar ──────────────────────────────────────────
  calWrap:            { backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, marginTop: 8, overflow: 'hidden' },
  calNavRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  calNavTitle:        { fontSize: 12, fontWeight: '700', color: COLORS.textMain },
  calNavBtn:          { paddingHorizontal: 8, paddingVertical: 4 },
  calInner:           { paddingHorizontal: 8, paddingBottom: 10, paddingTop: 6 },
  calWeekRow:         { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 3 },
  calWd:              { flex: 1, textAlign: 'center', fontSize: 9, fontWeight: '700', color: '#B4B9D0', paddingVertical: 3 },
  calDaysRow:         { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 1 },
  calDay:             { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, margin: 1 },
  calDaySel:          { backgroundColor: COLORS.primary },
  calDayToday:        { borderWidth: 1.5, borderColor: COLORS.primary },
  calDayText:         { fontSize: 11, fontWeight: '500', color: COLORS.textMain },
  calDayTextSel:      { color: '#FFFFFF', fontWeight: '700' },
  calDayTextToday:    { color: COLORS.primary },
  calDayTextOther:    { color: '#D0D4E8' },
  calDayTextDisabled: { color: '#E2E4F0' },

  // ── Time ─────────────────────────────────────────────────────
  timeRow:      { flexDirection: 'row', gap: 8 },
  timeBlock:    { flex: 1, backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeBlockDim: { opacity: 0.35 },
  timeIcon:     { fontSize: 14 },
  timeInputs:   { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  timeInput:    { width: 28, textAlign: 'center', fontSize: 14, fontWeight: '700', color: COLORS.textMain, padding: 0 },
  timeSep:      { fontSize: 14, fontWeight: '700', color: COLORS.textSub },
  timeLabel:    { fontSize: 9, fontWeight: '700', color: COLORS.textSub, letterSpacing: 0.5, textTransform: 'uppercase' },

  // ── Toggle ───────────────────────────────────────────────────
  toggleRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  toggleLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleIcon:     { width: 30, height: 30, borderRadius: 8, backgroundColor: COLORS.primary10, alignItems: 'center', justifyContent: 'center' },
  toggleIconText: { fontSize: 14 },
  toggleLabel:    { fontSize: 13, fontWeight: '600', color: COLORS.textMain },
  toggleSub:      { fontSize: 10, color: COLORS.textSub, marginTop: 1 },
  track:          { width: 40, height: 24, borderRadius: 12, backgroundColor: '#D4D8EE', justifyContent: 'center', paddingHorizontal: 2 },
  trackOn:        { backgroundColor: COLORS.primary },
  thumb:          { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 3, elevation: 2 },
  thumbOn:        { alignSelf: 'flex-end' },

  // ── Repeat ───────────────────────────────────────────────────
  repeatInner:     { paddingTop: 12, gap: 14 },
  pillsRow:        { flexDirection: 'row', gap: 5 },
  pill:            { flex: 1, aspectRatio: 1, maxWidth: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  pillOn:          { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText:        { fontSize: 11, fontWeight: '700', color: COLORS.textSub },
  pillTextOn:      { color: '#FFFFFF' },
  stepper:         { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' },
  stepBtn:         { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepBtnText:     { fontSize: 20, color: COLORS.textSub },
  stepBtnDisabled: { opacity: 0.3 },
  stepCenter:      { flex: 1, alignItems: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border, paddingVertical: 6 },
  stepVal:         { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
  stepUnit:        { fontSize: 9, fontWeight: '700', color: COLORS.textSub, letterSpacing: 0.5, textTransform: 'uppercase' },
  summary:         { backgroundColor: COLORS.primary10, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  summaryText:     { fontSize: 11, color: COLORS.textSub, lineHeight: 18 },
  summaryBold:     { color: COLORS.primary, fontWeight: '700' },

  // ── Location ─────────────────────────────────────────────────
  locWrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 13, gap: 8 },
  locWrapFocused: { borderColor: COLORS.primary },
  locIcon:        { fontSize: 14 },
  locInput:       { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.textMain, paddingVertical: 12 },
});
