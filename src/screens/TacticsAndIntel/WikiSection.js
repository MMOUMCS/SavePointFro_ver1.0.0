import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Gift,
  MapPin,
  Package,
  Pencil,
  Plus,
  Swords,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import AddScheduleModal from '../AddScheduleModal'; // 프로젝트 구조에 맞게 상위 경로 유지

import { API_BASE_URL } from '../../../settings';

import CustomAlert from '../../components/CustomAlert.js';
import { ERROR_MESSAGES } from '../../constants/message.js';

// ==========================================
// 0. 테마 및 공통 스타일 정의
// ==========================================
const THEME = {
  bg: '#FFFFFF',
  white: '#FFFFFF',
  primary: '#4A7FA7',
  secondary: '#B3CFE5',
  accent: '#9BA986',
  textMain: '#1A3D63',
  textSub: '#6E8EA6',
  border: '#F0F4F8',
  gradPurple: ['#4A7FA7', '#B3CFE5'],
  gradMix: ['#B3CFE5', '#9BA986'],
  danger: '#FF6B6B',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const commonShadow = {
  shadowColor: THEME.textMain,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

// ==========================================
// 2. Wiki Screen (export default 적용)
// ==========================================
export default function WikiScreen(props) {
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const [isModalVisible, setIsModalVisible] = useState(false);

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 일정 수정/삭제
  const [editingEvent, setEditingEvent] = useState(null);
  // ── 길게 누른 카드 id 추적 ──
  const [activeCardId, setActiveCardId] = useState(null);

  //alter용
  const [alertVisible, setAlertVisible] = useState(false);
  const { 
    data: events = [], 
    refetch 
  } = useQuery({
    queryKey: ['events', currentYear, currentMonth], 
    queryFn: async () => {
      const token = await AsyncStorage.getItem('userToken');
      const start = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0] + "T00:00:00";
      const end = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0] + "T23:59:59";
      
      const url = `${API_BASE_URL}/api/v1/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('서버 에러');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, 
  });

  useEffect(() => {
    if (props.setRefreshHandler) {
      props.setRefreshHandler(() => refetch); 
    }
  }, [refetch]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth, 1));
  };

  // 삭제 핸들러
  const handleDeleteEvent = (eventId) => {
    Alert.alert(
      '일정 삭제',
      '이 일정을 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              const response = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              if (!response.ok) throw new Error('삭제 실패');
              refetch();
            } catch (e) {
              Alert.alert('오류', '일정 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 수정 버튼 핸들러
  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsModalVisible(true);
  };

  // 모달 닫기 (수정 상태 초기화 포함)
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingEvent(null);
  };

  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const lastDateOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  const lastDateOfPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

  const days = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: lastDateOfPrevMonth - i, month: 'prev' });
  }
  for (let i = 1; i <= lastDateOfMonth; i++) {
    days.push({ day: i, month: 'curr' });
  }
  const remainingSlots = 42 - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    days.push({ day: i, month: 'next' });
  }
  const CALENDAR_DAYS = days;

  const TACTICS_NOTES = [
    { id: 1, type: 'Map', title: "클리어를 위한 맵 공유", content: "맵 지도를 보고 공략을 확인하세요.", icon: MapPin, color: THEME.primary },
    { id: 2, type: 'Boss', title: "스킬 계수 변경", content: "7.4 패치 스킬 계수 확인", icon: AlertCircle, color: THEME.accent },
    { id: 3, type: 'Item', title: "아이템 획득정보", content: "주요 아이템 획득처 정리", icon: FileText, color: THEME.secondary },
    { id: 4, type: 'Team', title: "듀오 분석", content: "최근 승률 높은 조합 분석", icon: Swords, color: THEME.danger },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={wikiStyles.scrollView} contentContainerStyle={wikiStyles.scrollContent}>
        <View style={wikiStyles.section}>
          <View style={[wikiStyles.card, commonShadow]}>
            <View style={wikiStyles.calendarHeader}>
              <View style={wikiStyles.monthSelector}>
                <TouchableOpacity style={wikiStyles.iconButton} onPress={handlePrevMonth}>
                  <ChevronLeft size={20} color={THEME.textSub} />
                </TouchableOpacity>
                <Text style={wikiStyles.monthText}>{`${currentMonth}월 ${currentYear}`}</Text>
                <TouchableOpacity style={wikiStyles.iconButton} onPress={handleNextMonth}>
                  <ChevronRight size={20} color={THEME.textSub} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={wikiStyles.weekRow}>
              {WEEKDAYS.map((day, idx) => (
                <Text key={idx} style={[wikiStyles.weekText, { color: idx === 0 ? THEME.danger : THEME.textSub }]}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={wikiStyles.daysGrid}>
              {CALENDAR_DAYS.map((date, index) => {
                const isSelected = date.day === selectedDate && date.month === 'curr';
                
                const hasEvent = date.month === 'curr' && events.some(event => {
                  const eventDate = new Date(event.startDateTime);
                  return eventDate.getFullYear() === currentYear &&
                         (eventDate.getMonth() + 1) === currentMonth &&
                         eventDate.getDate() === date.day;
                });
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      wikiStyles.dayCell,
                      isSelected && { backgroundColor: THEME.primary },
                      date.month !== 'curr' && { opacity: 0.3 }
                    ]}
                    onPress={() => date.month === 'curr' && setSelectedDate(date.day)}
                  >
                    <Text style={[
                      wikiStyles.dayText,
                      date.month !== 'curr' && { color: THEME.textSub },
                      isSelected && { color: THEME.white, fontWeight: '700' }
                    ]}>
                      {date.day}
                    </Text>
                    {hasEvent && (
                      <View style={{
                        position: 'absolute',
                        bottom: 0,
                        width: 8,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: isSelected ? THEME.white : THEME.primary, 
                      }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={wikiStyles.divider} />

            <View>
              <View style={wikiStyles.scheduleHeader}>
                <View>
                  <Text style={wikiStyles.scheduleTitle}>오늘의 일정</Text>
                  <Text style={wikiStyles.scheduleDate}>{`${currentMonth}월 ${selectedDate}일`}</Text>
                </View>
                <Text style={{ fontSize: 9, color: THEME.textSub, marginRight: 8, alignSelf: 'flex-end', marginBottom: 4 }}>
                * 일정을 길게 누르면 수정/삭제할 수 있어요
            </Text>
                <TouchableOpacity 
                  style={wikiStyles.addButton} 
                  onPress={() => setIsModalVisible(true)}
                >
                  <Plus size={18} color={THEME.white} />
                </TouchableOpacity>
              </View>
              
              <View>
                {(() => {
                  const selected = new Date(currentYear, currentMonth - 1, selectedDate);
                  selected.setHours(0, 0, 0, 0);

                  const filteredEvents = events.filter(event => {
                    const start = new Date(event.startDateTime);
                    start.setHours(0, 0, 0, 0);
                    
                    const end = new Date(event.endDateTime);
                    end.setHours(23, 59, 59, 999);

                    return selected >= start && selected <= end;
                  });

                  return filteredEvents.length > 0 ? (
                    filteredEvents.map((event, idx) => {
  const isActive = activeCardId === event.id;

  return (
    <TouchableOpacity
      key={idx}
      style={wikiStyles.scheduleCard}
      onLongPress={() => {
    Vibration.vibrate(10); // 여기에 진동 툭 넣어주면 손맛이 살아요!
    setActiveCardId(isActive ? null : event.id);
  }}
      onPress={() => { if (isActive) setActiveCardId(null); }}
      activeOpacity={0.85}
      delayLongPress={300}
    >
      {/* 시간 */}
      <View style={wikiStyles.scheduleTime}>
        <Clock size={14} color={THEME.primary} />
        <Text style={wikiStyles.timeText}>
          {new Date(event.startDateTime).getHours().toString().padStart(2, '0')}:
          {new Date(event.startDateTime).getMinutes().toString().padStart(2, '0')}
        </Text>
      </View>

      {/* 제목 + 설명 */}
      <View style={wikiStyles.scheduleContent}>
        <Text style={wikiStyles.scheduleName}>{event.title}</Text>
        <Text style={wikiStyles.scheduleDesc}>{event.description || '상세 설명 없음'}</Text>
      </View>

      {/* 평소엔 배지, 길게 누르면 수정/삭제 */}
      {isActive ? (
        <View style={wikiStyles.scheduleActions}>
          <TouchableOpacity
            style={wikiStyles.actionBtnEdit}
            onPress={() => {
              setActiveCardId(null);
              handleEditEvent(event);
            }}
          >
            <Pencil size={13} color={THEME.primary} />
            <Text style={wikiStyles.actionBtnEditText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={wikiStyles.actionBtnDelete}
            onPress={() => {
              setActiveCardId(null);
              handleDeleteEvent(event.id);
            }}
          >
            <Trash2 size={13} color={THEME.danger} />
            <Text style={wikiStyles.actionBtnDeleteText}>삭제</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={wikiStyles.badge}>
          <Text style={wikiStyles.badgeText}>{event.location || 'Event'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
})
                  ) : (
                    <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                      <Text style={{ color: THEME.textSub, fontSize: 14 }}>등록된 일정이 없습니다. ☕</Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </View>
        </View>

        <View style={wikiStyles.section}>
          <View style={wikiStyles.sectionHeaderRow}>
            <Text style={wikiStyles.sectionTitle}>Tactics & Memo</Text>
            <TouchableOpacity onPress={() => setAlertVisible(true)}>
  <Plus size={20} color={THEME.textSub} />
</TouchableOpacity>
          </View>

          <View style={wikiStyles.notesGrid}>
            {TACTICS_NOTES.map((note) => (
              <TouchableOpacity key={note.id} style={[wikiStyles.noteCard, commonShadow]} onPress={() => setAlertVisible(true)}>
                <View style={[wikiStyles.noteIcon, { backgroundColor: note.color + '20' }]}>
                  <note.icon size={20} color={note.color} />
                </View>
                <Text style={wikiStyles.noteTitle}>{note.title}</Text>
                <Text style={wikiStyles.noteContent} numberOfLines={2}>{note.content}</Text>
                <Text style={wikiStyles.noteType}>{note.type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={wikiStyles.section}>
          <Text style={wikiStyles.sectionTitle}>Supply Drop</Text>
          <View style={wikiStyles.itemsRow}>
            {[
              { icon: Package, name: 'Gaming\nGear', price: '0x80', color: THEME.primary },
              { icon: Gift, name: 'Game\nCurrency', price: '0x50', color: THEME.accent },
              { icon: Wallet, name: 'Steam\nWallet', price: '0x30', color: THEME.secondary },
            ].map((item, idx) => (
              <TouchableOpacity key={idx} style={[wikiStyles.itemCard, commonShadow]} onPress={() => setAlertVisible(true)}>
                <View style={[wikiStyles.itemIcon, { backgroundColor: item.color + '20' }]}>
                  <item.icon size={24} color={item.color} />
                </View>
                <Text style={wikiStyles.itemName}>{item.name}</Text>
                <Text style={wikiStyles.itemPrice}>{item.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* 일정 추가/수정 모달 — editingEvent가 있으면 수정 모드로 열림 */}
      <AddScheduleModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        initialDate={new Date(currentYear, currentMonth - 1, selectedDate)}
        onSaveSuccess={() => refetch()}
        editingEvent={editingEvent}
      />
      <CustomAlert
  isVisible={alertVisible}
  title="🚧 준비 중"
  message={ERROR_MESSAGES.COMING_SOON}
  onConfirm={() => setAlertVisible(false)}
  onClose={() => setAlertVisible(false)}
/>
    </View>
  );
}

// ==========================================
// Styles (wikiStyles만 컴팩트하게 배치!)
// ==========================================
const wikiStyles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 30 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  card: { backgroundColor: THEME.white, borderRadius: 20, padding: 20 },
  calendarHeader: { marginBottom: 16 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthText: { fontSize: 16, fontWeight: '700', color: THEME.textMain },
  iconButton: { padding: 4 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weekText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  dayCell: { width: '13%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginBottom: 4 },
  dayText: { fontSize: 14, fontWeight: '500', color: THEME.textMain },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 20 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scheduleTitle: { fontSize: 15, fontWeight: '700', color: THEME.textMain },
  scheduleDate: { fontSize: 12, color: THEME.textSub, marginTop: 2 },
  addButton: { backgroundColor: THEME.primary, borderRadius: 10, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  scheduleCard: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scheduleTime: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: THEME.white, borderRadius: 8 },
  timeText: { fontSize: 12, fontWeight: '600', color: THEME.textMain },
  scheduleContent: { flex: 1 },
  scheduleName: { fontSize: 13, fontWeight: '600', color: THEME.textMain },
  scheduleDesc: { fontSize: 11, color: THEME.textSub, marginTop: 2 },
  // 배지 + 수정/삭제 버튼을 묶는 컨테이너
  scheduleActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { backgroundColor: THEME.primary + '20', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  badgeText: { color: THEME.primary, fontSize: 10, fontWeight: '600' },
  // 수정/삭제 아이콘 버튼
  actionBtn: { padding: 4, borderRadius: 6 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: THEME.textMain, marginBottom: 12 },
  notesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  noteCard: { width: '48%', backgroundColor: THEME.white, borderRadius: 16, padding: 16, minHeight: 130 },
  noteIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  noteTitle: { fontSize: 13, fontWeight: '700', color: THEME.textMain, marginBottom: 6 },
  noteContent: { fontSize: 11, color: THEME.textSub, lineHeight: 16 },
  noteType: { fontSize: 10, fontWeight: '600', color: THEME.textSub, marginTop: 8 },
  itemsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  itemCard: { flex: 1, backgroundColor: THEME.white, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center' },
  itemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  itemName: { fontSize: 11, fontWeight: '600', color: THEME.textMain, textAlign: 'center', marginBottom: 4 },
  itemPrice: { fontSize: 12, fontWeight: '700', color: THEME.accent },
  // 기존 scheduleActions, actionBtn 지우고 아래로 교체
scheduleActions:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
actionBtnEdit:         { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: THEME.primary + '18', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8 },
actionBtnEditText:     { fontSize: 11, fontWeight: '600', color: THEME.primary },
actionBtnDelete:       { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: THEME.danger + '18', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8 },
actionBtnDeleteText:   { fontSize: 11, fontWeight: '600', color: THEME.danger },
});