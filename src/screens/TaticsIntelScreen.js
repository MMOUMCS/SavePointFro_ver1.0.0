import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AlertCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Package,
  Play,
  Plus,
  Send,
  Settings,
  Share2,
  Swords,
  Trash2,
  TrendingUp,
  Wallet,
  X
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../components/BottomNavigation';
import LoadingSpinner from '../components/LoadingSpinner';
import { useUser } from '../components/UserContext';
import AddScheduleModal from './AddScheduleModal';
// 기존 코드에 useQueryClient를 추가합니다.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WebView } from 'react-native-webview';

import { API_BASE_URL } from '../../settings';

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
const COLUMN_WIDTH = (SCREEN_WIDTH - 48) / 2;

const commonShadow = {
  shadowColor: THEME.textMain,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

// ==========================================
// 1. 메인 부모 컴포넌트 (App Shell)
// ==========================================
const TacticsIntelApp = (props) => {
  const { onNavigate, openModal } = props;
  const [activeTab, setActiveTab] = useState('wiki');

  return (
    <SafeAreaView style={mainStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <View style={mainStyles.container}>
        <View style={mainStyles.header}>
          <View style={mainStyles.topBar}>
            <TouchableOpacity style={mainStyles.iconButton}>
              <ChevronLeft size={24} color={THEME.textMain} />
            </TouchableOpacity>
            <Text style={mainStyles.headerTitle}>Tactics & Intel</Text>
            <View style={mainStyles.headerIcons}>
              <TouchableOpacity style={mainStyles.iconButton} onPress={() => onNavigate('Notifications')}>
                <Bell size={24} color={THEME.textMain} />
              </TouchableOpacity>
              <TouchableOpacity style={mainStyles.iconButton}>
                <Settings size={24} color={THEME.textMain} onPress={() => onNavigate('Settings')} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={mainStyles.tabBar}>
            {['wiki', 'gallery', 'replay'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[mainStyles.tabItem, activeTab === tab && mainStyles.activeTabItem]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[mainStyles.tabText, activeTab === tab && mainStyles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                {activeTab === tab && <View style={mainStyles.activeTabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={mainStyles.contentArea}>
          {activeTab === 'wiki' && <WikiScreen{...props} />}
          {activeTab === 'gallery' && <GalleryScreen />}
          {activeTab === 'replay' && <HighlightsScreen />}
        </View>
      </View>
      <BottomNavigation 
        activeTab="Home"
        onNavigate={onNavigate} 
      />
    </SafeAreaView>
  );
};

// ==========================================
// 2. Wiki Screen
// ==========================================
const WikiScreen = (props) => {
  
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const [isModalVisible, setIsModalVisible] = useState(false);

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today.getDate());


  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const { 
    data: events = [], 
    isLoading, 
    refetch 
  } = useQuery({
    // [중요] 쿼리 키에 currentYear와 currentMonth를 넣어야 
    // 달이 바뀔 때마다 해당 달의 데이터를 DB처럼 따로 저장합니다.
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
    // 5분 동안은 데이터를 '신선'하다고 간주 (화면 왔다 갔다 해도 로딩 0초)
    staleTime: 1000 * 60 * 5, 
  });

  // 부모 컴포넌트(MainAppContent)에서 새로고침을 명령할 수 있게 등록
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

/*
  const fetchEvents = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0: 1월, 1: 2월...

    // 이번 달 1일 00:00:00 (예: 2026-02-01)
    const startDate = new Date(year, month, 1);
    const start = startDate.toISOString().split('T')[0] + "T00:00:00";

    // 다음 달 1일에서 1초 뺀 시각 (즉, 이번 달 말일 23:59:59)
    const endDate = new Date(year, month + 1, 0);
    const end = endDate.toISOString().split('T')[0] + "T23:59:59";
    
    // encodeURIComponent로 감싸서 주소창에서 문자가 깨지는 걸 방지
    // URL 사이에 슬래시가 확실히 들어가도록 수정!
const url = `${API_BASE_URL}/api/v1/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (response.ok) {
      const data = await response.json();
      setEvents(data); 
    } else {
      const errorMsg = await response.text();
      console.error(`서버 에러:`, errorMsg);
    }
  } catch (error) {
  
    console.error("네트워크 에러:", error); 
  }
};

  useEffect(() => {
    fetchEvents();
    if (props.setRefreshHandler) {
    props.setRefreshHandler(() => fetchEvents); 
  }
  }, [currentMonth]); // 달이 바뀔 때마다 새로 가져옴
*/


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
    // 서버 데이터의 날짜와 현재 달력의 날짜 숫자가 같은지만 확인!
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
            bottom: 0, // 숫자 바로 아래
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
              <TouchableOpacity 
  style={wikiStyles.addButton} 
  onPress={() => setIsModalVisible(true)}
>
  <Plus size={18} color={THEME.white} />
</TouchableOpacity>
            </View>
            
          <View>
{(() => {
  // 1. 내가 선택한 날짜를 'YYYY-MM-DD' 형식의 시간 객체로 변환
  const selected = new Date(currentYear, currentMonth - 1, selectedDate);
  selected.setHours(0, 0, 0, 0);

  const filteredEvents = events.filter(event => {
    // 2. 각 일정의 시작일과 종료일을 시간 객체로 변환
    const start = new Date(event.startDateTime);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(event.endDateTime);
    end.setHours(23, 59, 59, 999); // 종료일 끝 시간까지 포함

    // 핵심: 선택한 날짜가 시작일과 종료일 사이에 있는지 체크!
    return selected >= start && selected <= end;
  });

  return filteredEvents.length > 0 ? (
    filteredEvents.map((event, idx) => (
      <View key={idx} style={wikiStyles.scheduleCard}>
        <View style={wikiStyles.scheduleTime}>
          <Clock size={14} color={THEME.primary} />
          <Text style={wikiStyles.timeText}>
            {new Date(event.startDateTime).getHours().toString().padStart(2, '0')}:
            {new Date(event.startDateTime).getMinutes().toString().padStart(2, '0')}
          </Text>
        </View>
        <View style={wikiStyles.scheduleContent}>
          <Text style={wikiStyles.scheduleName}>{event.title}</Text>
          <Text style={wikiStyles.scheduleDesc}>{event.description || '상세 설명 없음'}</Text>
        </View>
        <View style={wikiStyles.badge}>
          <Text style={wikiStyles.badgeText}>{event.location || 'Event'}</Text>
        </View>
      </View>
    ))
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
          <TouchableOpacity>
            <Plus size={20} color={THEME.textSub} />
          </TouchableOpacity>
        </View>

        <View style={wikiStyles.notesGrid}>
          {TACTICS_NOTES.map((note) => (
            <TouchableOpacity key={note.id} style={[wikiStyles.noteCard, commonShadow]}>
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
            <TouchableOpacity key={idx} style={[wikiStyles.itemCard, commonShadow]}>
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
    <AddScheduleModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        initialDate={new Date(currentYear, currentMonth - 1, selectedDate)}
        
        onSaveSuccess={() => refetch()}
      />
    </View>
  );
};


// ==========================================
// 3. Photo Detail Modal (인스타 스타일)
// ==========================================
const CommentItem = ({ comment, onDelete, currentUserId }) => (
  <View style={detailStyles.commentRow}>
    <Image
      source={{ uri: comment.authorProfileImage || 'https://via.placeholder.com/32' }}
      style={detailStyles.commentAvatar}
    />
    <View style={detailStyles.commentBody}>
      <Text style={detailStyles.commentAuthor}>{comment.authorName || '익명'}</Text>
      <Text style={detailStyles.commentText}>{comment.content}</Text>
      <Text style={detailStyles.commentTime}>{comment.createdAt || ''}</Text>
    </View>
    {comment.authorId === currentUserId && (
      <TouchableOpacity onPress={() => onDelete(comment.id)} style={detailStyles.commentDelete}>
        <Trash2 size={13} color="#C0C0C0" />
      </TouchableOpacity>
    )}
  </View>
);

const PhotoDetailModal = ({ visible, photo, onClose, onToggleLike, userData }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageHeight, setImageHeight] = useState(300);
  const inputRef = useRef(null);
  const modalizeRef = useRef(null);

  useEffect(() => {
  if (visible) {
    modalizeRef.current?.open();
    handleModalShow();
  } else {
    modalizeRef.current?.close();
  }
}, [visible]);


  const handleModalShow = useCallback(async () => {
    if (!photo) return;

    // 원본 이미지 비율 계산
    Image.getSize(
      photo.imageUrl || photo.thumbnailUrl,
      (w, h) => {
        const ratio = h / w;
        setImageHeight(SCREEN_WIDTH * ratio);
      },
      () => setImageHeight(300)
    );

    // 댓글 불러오기
    try {
      setLoadingComments(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/photos/${photo.id}/comments`, {
        headers: {
          Authorization: `Bearer ${userData?.accessToken || userData?.token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error('댓글 로드 실패:', e);
    } finally {
      setLoadingComments(false);
    }
  }, [photo, userData]);

  // 모달 닫힐 때 상태 초기화
  const handleClose = () => {
    setComments([]);
    setCommentText('');
    setImageHeight(300);
    onClose();
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/photos/${photo.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userData?.accessToken || userData?.token}`,
        },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, newComment]);
        setCommentText('');
      }
    } catch (e) {
      Alert.alert('오류', '댓글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert('댓글 삭제', '정말 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE_URL}/api/v1/photos/${photo.id}/comments/${commentId}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${userData?.accessToken || userData?.token}`,
              },
            });
            setComments(prev => prev.filter(c => c.id !== commentId));
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

if (!photo) return null;

return (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="pageSheet"
    onRequestClose={handleClose}
    onShow={handleModalShow}
  >
    <SafeAreaView style={detailStyles.safeArea}>
      <View style={{ paddingTop: 20 }} /> 
      <View style={detailStyles.header}>
        <Image source={{ uri: userData?.profileImageUrl || 'https://via.placeholder.com/36' }} style={detailStyles.headerAvatar} />
        <View style={detailStyles.headerInfo}>
          <Text style={detailStyles.headerName}>{photo.authorName || userData?.nickname || '작성자'}</Text>
          <Text style={detailStyles.headerDate}>{photo.createdAt || ''}</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={detailStyles.closeButton}>
          <X size={22} color={THEME.textMain} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Image source={{ uri: photo.imageUrl || photo.thumbnailUrl }} style={[detailStyles.fullImage, { height: imageHeight }]} resizeMode="contain" />
          <View style={detailStyles.actionBar}>
            <TouchableOpacity onPress={() => onToggleLike(photo.id)} style={detailStyles.actionButton}>
              <Heart size={26} color={photo.isLiked ? THEME.danger : THEME.textMain} fill={photo.isLiked ? THEME.danger : 'transparent'} />
              {photo.likeCount != null && <Text style={detailStyles.actionCount}>{photo.likeCount}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => inputRef.current?.focus()} style={detailStyles.actionButton}>
              <MessageCircle size={24} color={THEME.textMain} />
              <Text style={detailStyles.actionCount}>{comments.length}</Text>
            </TouchableOpacity>
          </View>
          {photo.description ? <Text style={detailStyles.description}>{photo.description}</Text> : null}
          <View style={detailStyles.commentSection}>
            <Text style={detailStyles.commentSectionTitle}>댓글 {comments.length}개</Text>
            {loadingComments ? (
              <ActivityIndicator size="small" color={THEME.primary} style={{ marginTop: 16 }} />
            ) : comments.length === 0 ? (
              <Text style={detailStyles.emptyComment}>첫 댓글을 남겨보세요 💬</Text>
            ) : (
              comments.map((c, index) => (
                <View key={`comment-wrapper-${c.id || c.commentId || index}`}>
                  <CommentItem comment={c} onDelete={handleDeleteComment} currentUserId={userData?.id} />
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={detailStyles.inputBar}>
          <Image source={{ uri: userData?.profileImageUrl || 'https://via.placeholder.com/32' }} style={detailStyles.inputAvatar} />
          <TextInput ref={inputRef} style={detailStyles.input} placeholder="댓글 달기..." placeholderTextColor="#AAAAAA" value={commentText} onChangeText={setCommentText} multiline maxLength={300} />
          <TouchableOpacity onPress={handleSubmitComment} disabled={!commentText.trim() || submitting} style={[detailStyles.sendButton, (!commentText.trim() || submitting) && detailStyles.sendButtonDisabled]}>
            {submitting ? <ActivityIndicator size="small" color={THEME.white} /> : <Send size={16} color={THEME.white} />}
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>
);
};

// ==========================================
// 4. Gallery Screen
// ==========================================
const GalleryScreen = (props) => {
  
  const { userData } = useUser();
  const queryClient = useQueryClient();

  const { 
    data: galleryPhotos = [], 
    isLoading: isGalleryLoading, 
    isRefetching, 
    refetch: refetchPhotos
  } = useQuery({
    queryKey: ['galleryPhotos'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/photos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userData?.accessToken || userData?.token}`,
        },
      });
      if (!response.ok) throw new Error('사진 불러오기 실패');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5분 동안은 신선한 데이터로 간주
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisibleId, setMenuVisibleId] = useState(null); 
  const [filterMode, setFilterMode] = useState('ALL');

  // 상세 모달 상태
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const handleFilterChange = (mode) => {
    if (filterMode === mode) return; 
    setLoading(true);
    setFilterMode(mode);
    setTimeout(() => setLoading(false), 300);
  };

  /*
  const fetchPhotos = async (isRefresh = false) => {
    if (!isRefresh && galleryPhotos && galleryPhotos.length > 0) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/v1/photos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userData?.accessToken || userData?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGalleryPhotos(data);
      }
    } catch (error) {
      console.error("Gallery Fetch Error:", error);
      Alert.alert("오류", "사진을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  */
/*
  const onRefresh = useCallback(() => {
    fetchPhotos(true);
  }, [userData]);
*/
  /*
  useEffect(() => {
    fetchPhotos();
  }, []);
*/

  const toggleLike = (id) => {
    queryClient.setQueryData(['galleryPhotos'], (old) => 
      old?.map(p => p.id === id ? { ...p, isLiked: !p.isLiked } : p)
    );
  };

  const handleDelete = async (photoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userData?.accessToken || userData?.token}` },
      });
      if (response.ok) {
        refetchPhotos();
        setMenuVisibleId(null);
      }
    } catch (error) { console.error(error); }
  };

  // 이미지 클릭 → 상세 모달 열기
  const handlePhotoPress = (photo) => {
    setSelectedPhoto(photo);
    setDetailVisible(true);
  };

  const displayedPhotos = filterMode === 'LIKED' 
    ? galleryPhotos.filter(p => p.isLiked) 
    : galleryPhotos;

  const renderPhotoColumn = (columnPhotos) => (
    <View style={galleryStyles.column}>
      {columnPhotos.map((photo) => (
        <View key={photo.id} style={galleryStyles.photoCardWrapper}>
          {/* 이미지 터치 → 상세 모달 */}
          <TouchableOpacity
            style={[galleryStyles.imageContainer, { height: 250 }, commonShadow]}
            activeOpacity={0.9}
            onPress={() => handlePhotoPress(photo)}
          >
            <Image source={{ uri: photo.thumbnailUrl }} style={galleryStyles.image} resizeMode="cover" />
            <View style={galleryStyles.profileBadge}>
              <Image
                source={{ uri: userData?.profileImageUrl || 'https://via.placeholder.com/50' }}
                style={galleryStyles.profileImage}
              />
            </View>
            {/* 좋아요 버튼은 이미지 위에서도 작동 (이벤트 전파 차단) */}
            <TouchableOpacity
              style={galleryStyles.likeButton}
              onPress={(e) => {
                e.stopPropagation();
                toggleLike(photo.id);
              }}
            >
              <Heart
                size={18}
                color={photo.isLiked ? THEME.danger : THEME.white}
                fill={photo.isLiked ? THEME.danger : 'transparent'}
              />
            </TouchableOpacity>
          </TouchableOpacity>
          <View style={galleryStyles.moreButtonContainer}>
            <TouchableOpacity style={galleryStyles.moreButton} onPress={() => setMenuVisibleId(photo.id)}>
              <MoreHorizontal size={18} color={THEME.textSub} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );


  return (
    <View style={galleryStyles.container}>
      {/* 1. 메뉴 모달 (삭제 등) */}
      <Modal transparent visible={menuVisibleId !== null} animationType="fade">
        <TouchableOpacity style={galleryStyles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisibleId(null)}>
          <View style={[galleryStyles.modalContent, commonShadow]}>
            <TouchableOpacity style={galleryStyles.modalItem}>
              <Download size={18} color={THEME.textMain} />
              <Text style={galleryStyles.modalText}>저장</Text>
            </TouchableOpacity>
            <TouchableOpacity style={galleryStyles.modalItem}>
              <Share2 size={18} color={THEME.textMain} />
              <Text style={galleryStyles.modalText}>공유</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[galleryStyles.modalItem, { backgroundColor: '#FFF0F0', borderRadius: 8 }]} 
              onPress={() => handleDelete(menuVisibleId)}
            >
              <Trash2 size={18} color={THEME.danger} />
              <Text style={[galleryStyles.modalText, { color: THEME.danger, fontWeight: '600' }]}>삭제</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>


      {/* 2. 상단 필터 탭 */}
      <View style={galleryStyles.filterContainer}>
        <View style={galleryStyles.filterTabs}>
          <TouchableOpacity 
            style={[galleryStyles.filterTab, filterMode === 'ALL' && galleryStyles.filterTabActive]}
            onPress={() => handleFilterChange('ALL')}
          >
            <Text style={[galleryStyles.filterTabText, filterMode === 'ALL' && galleryStyles.filterTabTextActive]}>
              전체
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[galleryStyles.filterTab, filterMode === 'LIKED' && galleryStyles.filterTabActive]}
            onPress={() => handleFilterChange('LIKED')}
          >
            <Heart
              size={14}
              color={filterMode === 'LIKED' ? THEME.danger : THEME.textSub}
              fill={filterMode === 'LIKED' ? THEME.danger : 'transparent'}
            />
            <Text style={[galleryStyles.filterTabText, filterMode === 'LIKED' && galleryStyles.filterTabTextActive, { marginLeft: 4 }]}>
              즐겨찾기
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. 메인 스크롤 뷰 */}
      <ScrollView 
        contentContainerStyle={galleryStyles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} // 쿼리의 상태 연결
            onRefresh={refetchPhotos}
            colors={[THEME.primary]}
            tintColor={THEME.primary}
          />
        }
      >
        {displayedPhotos.length > 0 ? (
          <View style={galleryStyles.masonryGrid}>
            {renderPhotoColumn(displayedPhotos.filter((_, i) => i % 2 === 0))}
            {renderPhotoColumn(displayedPhotos.filter((_, i) => i % 2 === 1))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <Text style={{ color: THEME.textSub }}>
              {filterMode === 'LIKED' ? "즐겨찾기한 사진이 없습니다." : "사진이 없습니다. 아래로 당겨보세요!"}
            </Text>
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* 4. 사진 상세 모달 */}
      <PhotoDetailModal
        visible={detailVisible}
        photo={selectedPhoto}
        onClose={() => setDetailVisible(false)}
        onToggleLike={(id) => {
          toggleLike(id);
          // 모달 내 photo 상태도 동기화
          setSelectedPhoto(prev =>
            prev?.id === id ? { ...prev, isLiked: !prev.isLiked } : prev
          );
        }}
        userData={userData}
      />
      <LoadingSpinner visible={isGalleryLoading} />
    </View>
  );
};

// ==========================================
// 5. Highlights Screen
// ==========================================
const HighlightsScreen = () => {
  const { userData } = useUser();
  const [replays, setReplays] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchReplays = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/replays`, {
          headers: {
            Authorization: `Bearer ${userData?.accessToken || userData?.token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setReplays(data);
        }
      } catch (error) {
        console.error('리플레이 로드 실패:', error);
      }
    };

    fetchReplays();
  }, [userData]);

  const [likedItems, setLikedItems] = useState({});
  const mainVideo = replays[0];

  const toggleLike = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/replays/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData?.accessToken || userData?.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLikedItems(prev => ({ ...prev, [id]: !prev[id] }));
        setReplays(prev => prev.map(r => r.replayId === id ? { ...r, likeCount: data.likeCount } : r));
      }
    } catch (error) {
      console.error('좋아요 실패:', error);
    }
  };

  if (replays.length === 0) return null;

  if (selectedVideo) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <TouchableOpacity 
        onPress={() => setSelectedVideo(null)}
        style={{ padding: 16 }}
      >
        <Text style={{ color: '#fff', fontSize: 16 }}>✕ 닫기</Text>
      </TouchableOpacity>
      <WebView
        source={{ uri: `https://www.youtube-nocookie.com/embed/${selectedVideo}?playsinline=1` }}
        style={{ flex: 1 }}
        allowsFullscreenVideo
        referrerpolicy='strict-origin-when-cross-origin'
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </SafeAreaView>
  );
}

  return (
    <ScrollView style={replayStyles.scrollView} contentContainerStyle={replayStyles.scrollContent}>
      <TouchableOpacity style={[replayStyles.mainPlayer, commonShadow]} onPress={() => setSelectedVideo(mainVideo?.youtubeVideoId)}>
        <View style={replayStyles.videoContainer}>
          <Image source={{ uri: `https://img.youtube.com/vi/${mainVideo?.youtubeVideoId}/0.jpg` }} style={replayStyles.videoThumbnail} resizeMode="cover" />
          <View style={replayStyles.overlay}>
            <TouchableOpacity style={replayStyles.playButton}>
              <Play size={32} color={THEME.white} fill={THEME.white} />
            </TouchableOpacity>
            <View style={replayStyles.durationBadge}>
              <Clock size={12} color={THEME.white} />
              <Text style={replayStyles.durationText}>{mainVideo?.viewCount} 조회</Text>
            </View>
          </View>
        </View>
        <View style={replayStyles.videoInfo}>
          <View style={replayStyles.videoHeader}>
            <Text style={replayStyles.videoTitle}>{mainVideo?.title}</Text>
            <TouchableOpacity onPress={() => toggleLike(mainVideo?.replayId)}>
              <Heart size={20} color={likedItems[mainVideo?.replayId] ? THEME.danger : THEME.textSub} fill={likedItems[mainVideo?.replayId] ? THEME.danger : 'transparent'} />
            </TouchableOpacity>
          </View>
          <View style={replayStyles.videoMeta}>
            <Eye size={14} color={THEME.textSub} />
            <Text style={replayStyles.metaText}>{mainVideo?.viewCount} 조회 • {mainVideo?.uploaderName}</Text>
          </View>
          <TouchableOpacity style={replayStyles.shareButton}>
            <Share2 size={16} color={THEME.primary} />
            <Text style={replayStyles.shareText}>공유</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <View style={replayStyles.recentSection}>
        <View style={replayStyles.sectionHeader}>
          <Text style={replayStyles.sectionTitle}>최근 하이라이트</Text>
          <TouchableOpacity onPress={() => setShowAll(!showAll)}>
            <Text style={replayStyles.viewAllBtn}>{showAll ? '접기' : '전체보기'}</Text>
          </TouchableOpacity>
        </View>
        <View style={replayStyles.highlightsList}>
          {(showAll ? replays : replays.slice(0, 4)).map((replay) => (
            <TouchableOpacity key={replay.replayId} style={[replayStyles.highlightCard, commonShadow]} onPress={() => setSelectedVideo(replay.youtubeVideoId)}>
              <View style={replayStyles.thumbnailWrapper}>
                <Image source={{ uri: `https://img.youtube.com/vi/${replay.youtubeVideoId}/0.jpg` }} style={replayStyles.thumbnail} resizeMode="cover" />
                <View style={replayStyles.thumbnailDuration}>
                <Text style={replayStyles.thumbnailDurationText}>{replay.viewCount} 조회</Text>
              </View>
              </View>
              <View style={replayStyles.highlightInfo}>
                <Text style={replayStyles.highlightTitle} numberOfLines={1}>{replay.title}</Text>
                <Text style={replayStyles.highlightMetaText}>{replay.viewCount} 조회 • {replay.uploaderName} • {replay.createdAt ? new Date(replay.createdAt).toLocaleDateString('ko-KR') : ''}</Text>
              </View>
              <TouchableOpacity style={replayStyles.cardLikeBtn} onPress={() => toggleLike(replay.replayId)}>
                <Heart size={18} color={likedItems[replay.replayId] ? THEME.danger : THEME.textSub} fill={likedItems[replay.replayId] ? THEME.danger : 'transparent'} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={replayStyles.statsSection}>
        <Text style={replayStyles.sectionTitle}>통계</Text>
        <View style={replayStyles.statsGrid}>
          <View style={[replayStyles.statCard, commonShadow]}>
            <View style={[replayStyles.statIcon, { backgroundColor: THEME.primary + '20' }]}>
              <Eye size={20} color={THEME.primary} />
            </View>
            <Text style={replayStyles.statValue}>{replays.reduce((sum, r) => sum + r.viewCount, 0)}</Text>
            <Text style={replayStyles.statLabel}>총 조회수</Text>
          </View>
          <View style={[replayStyles.statCard, commonShadow]}>
            <View style={[replayStyles.statIcon, { backgroundColor: THEME.danger + '20' }]}>
              <Heart size={20} color={THEME.danger} />
            </View>
            <Text style={replayStyles.statValue}>{replays.reduce((sum, r) => sum + r.likeCount, 0)}</Text>
            <Text style={replayStyles.statLabel}>좋아요</Text>
          </View>
          <View style={[replayStyles.statCard, commonShadow]}>
            <View style={[replayStyles.statIcon, { backgroundColor: THEME.accent + '20' }]}>
              <TrendingUp size={20} color={THEME.accent} />
            </View>
            <Text style={replayStyles.statValue}>
              {replays.filter(r => {
                const createdAt = new Date(r.createdAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return createdAt > weekAgo;
              }).length}개
            </Text>
            <Text style={replayStyles.statLabel}>이번 주</Text>
          </View>
        </View>
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
};


// ==========================================
// Styles
// ==========================================

const mainStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { backgroundColor: THEME.bg, borderBottomWidth: 1, borderBottomColor: THEME.border, zIndex: 10 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 23, paddingVertical: 30 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: THEME.textMain },
  headerIcons: { flexDirection: 'row', gap: 16 },
  iconButton: { padding: 4 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, gap: 24 },
  tabItem: { paddingVertical: 12, paddingHorizontal: 4, position: 'relative' },
  activeTabItem: {},
  tabText: { fontSize: 16, fontWeight: '600', color: THEME.textSub },
  activeTabText: { color: THEME.primary, fontWeight: '700' },
  activeTabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: THEME.primary, borderRadius: 1.5 },
  contentArea: { flex: 1, backgroundColor: '#FAFBFC' },
});

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
  scheduleCard: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  scheduleTime: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: THEME.white, borderRadius: 8 },
  timeText: { fontSize: 12, fontWeight: '600', color: THEME.textMain },
  scheduleContent: { flex: 1 },
  scheduleName: { fontSize: 13, fontWeight: '600', color: THEME.textMain },
  scheduleDesc: { fontSize: 11, color: THEME.textSub, marginTop: 2 },
  badge: { backgroundColor: THEME.primary + '20', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  badgeText: { color: THEME.primary, fontSize: 10, fontWeight: '600' },
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
});

const galleryStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  filterContainer: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterTabs: { flexDirection: 'row', gap: 8 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: THEME.border },
  filterTabActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  filterTabText: { fontSize: 12, fontWeight: '600', color: THEME.textSub },
  filterTabTextActive: { color: THEME.white },
  addButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  masonryGrid: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 16 },
  photoCardWrapper: { marginBottom: 4 },
  imageContainer: { width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#F0F0F0', position: 'relative' },
  image: { width: '100%', height: '100%' },
  profileBadge: { position: 'absolute', bottom: 8, right: 8, zIndex: 2 },
  profileImage: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: THEME.white },
  likeButton: { position: 'absolute', top: 8, right: 8, padding: 4, zIndex: 2 },
  moreButtonContainer: { alignItems: 'flex-end', marginTop: 4 },
  moreButton: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: THEME.white, borderRadius: 12, padding: 8, width: 180 },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12 },
  modalText: { fontSize: 14, fontWeight: '500', color: THEME.textMain },
});

// PhotoDetailModal 전용 스타일
const detailStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.white },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    padiingTop: 50,
    borderBottomWidth: 0.5,
    borderColor: THEME.border,
  },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { fontSize: 14, fontWeight: '700', color: THEME.textMain },
  headerDate: { fontSize: 11, color: THEME.textSub, marginTop: 1 },
  closeButton: { padding: 6 },

  // 원본 이미지
  fullImage: {
    width: SCREEN_WIDTH,
    backgroundColor: '#F5F5F5',
  },

  // 액션 바
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 16,
    borderBottomWidth: 0.5,
    borderColor: THEME.border,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontSize: 13, color: THEME.textMain, fontWeight: '500' },

  // 설명
  description: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.textMain,
    lineHeight: 20,
  },

  // 댓글 섹션
  commentSection: { paddingHorizontal: 16, paddingTop: 10 },
  commentSectionTitle: { fontSize: 13, fontWeight: '700', color: THEME.textMain, marginBottom: 10 },
  emptyComment: { fontSize: 13, color: THEME.textSub, textAlign: 'center', marginVertical: 24 },

  // 댓글 아이템
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#F5F5F5',
  },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10, marginTop: 1 },
  commentBody: { flex: 1 },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: THEME.textMain, marginBottom: 2 },
  commentText: { fontSize: 13, color: '#333', lineHeight: 18 },
  commentTime: { fontSize: 10, color: '#BBBBBB', marginTop: 3 },
  commentDelete: { padding: 6 },

  // 입력창
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 10,
    borderTopWidth: 0.5,
    borderColor: THEME.border,
    backgroundColor: THEME.white,
    gap: 8,
  },
  inputAvatar: { width: 32, height: 32, borderRadius: 16, marginBottom: 2 },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: THEME.textMain,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: THEME.secondary },
});

const replayStyles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#FAFBFC' },
  scrollContent: { paddingBottom: 30 },
  mainPlayer: { backgroundColor: THEME.white, margin: 20, borderRadius: 16, overflow: 'hidden' },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', position: 'relative' },
  videoThumbnail: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  playButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
  durationBadge: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6 },
  durationText: { fontSize: 11, fontWeight: '600', color: THEME.white },
  videoInfo: { padding: 16 },
  videoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  videoTitle: { fontSize: 16, fontWeight: '700', color: THEME.textMain, flex: 1, marginRight: 12 },
  videoMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  metaText: { fontSize: 12, color: THEME.textSub, fontWeight: '500' },
  shareButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: THEME.primary + '15', borderRadius: 8 },
  shareText: { fontSize: 13, fontWeight: '600', color: THEME.primary },
  recentSection: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: THEME.textMain },
  viewAllBtn: { fontSize: 13, fontWeight: '600', color: THEME.primary },
  highlightsList: { gap: 12 },
  highlightCard: { backgroundColor: THEME.white, borderRadius: 12, padding: 10, flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumbnailWrapper: { width: 100, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailDuration: { position: 'absolute', bottom: 4, right: 4, paddingVertical: 2, paddingHorizontal: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4 },
  thumbnailDurationText: { fontSize: 9, fontWeight: '600', color: THEME.white },
  highlightInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  highlightTitle: { fontSize: 13, fontWeight: '600', color: THEME.textMain },
  highlightMetaText: { fontSize: 11, color: THEME.textSub },
  cardLikeBtn: { padding: 6 },
  statsSection: { paddingHorizontal: 20, marginTop: 24 },
  statsGrid: { flexDirection: 'row', gap: 12, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: THEME.white, borderRadius: 12, padding: 16, alignItems: 'center', gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: THEME.textMain },
  statLabel: { fontSize: 11, fontWeight: '500', color: THEME.textSub },
});

export default TacticsIntelApp;