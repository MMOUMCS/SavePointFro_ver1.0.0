import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Clock,
  Eye,
  Heart,
  Play,
  Share2,
  TrendingUp,
} from 'lucide-react-native'; // 안 쓰는 아이콘은 빌드 시 최적화되므로 그대로 두셔도 무방합니다.
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from '../../components/UserContext';

import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../settings'; // 경로 수정 유지

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
// [추가] 스와이프 삭제 가능한 하이라이트 카드 컴포넌트
// ==========================================
function SwipeableHighlightCard({ replay, likedItems, onLike, onDelete }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const DELETE_THRESHOLD = -70; // 이 픽셀 이상 당겨야 삭제 버튼 노출
  const lastOffset = useRef(0);

  // 터치 제스처 처리
  const panResponder = useRef(
    require('react-native').PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gestureState) => {
        // 왼쪽으로만 밀 수 있게 (오른쪽 방향은 막음)
        const newVal = lastOffset.current + gestureState.dx;
        if (newVal <= 0) {
          translateX.setValue(newVal);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const movedEnough = lastOffset.current + gestureState.dx < DELETE_THRESHOLD;
        if (movedEnough) {
          // 삭제 버튼 노출 위치로 스냅
          Animated.spring(translateX, {
            toValue: DELETE_THRESHOLD,
            useNativeDriver: true,
          }).start();
          lastOffset.current = DELETE_THRESHOLD;
        } else {
          // 원위치로 복귀
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          lastOffset.current = 0;
        }
      },
    })
  ).current;

  // 삭제 후 카드 사라지는 애니메이션
  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDelete(replay.replayId));
  };

  return (
    <View style={swipeStyles.wrapper}>
      {/* 뒤쪽 삭제 버튼 레이어 */}
      <View style={swipeStyles.deleteBackground}>
        <TouchableOpacity style={swipeStyles.deleteButton} onPress={handleDelete}>
          <Text style={swipeStyles.deleteText}>삭제</Text>
        </TouchableOpacity>
      </View>

      {/* 앞쪽 카드 레이어 */}
      <Animated.View
        style={[replayStyles.highlightCard, commonShadow, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={swipeStyles.cardInner}
          onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${replay.youtubeVideoId}`)}
          activeOpacity={0.8}
        >
          <View style={replayStyles.thumbnailWrapper}>
            <Image
              source={{ uri: `https://img.youtube.com/vi/${replay.youtubeVideoId}/0.jpg` }}
              style={replayStyles.thumbnail}
              resizeMode="cover"
            />
            <View style={replayStyles.thumbnailDuration}>
              <Text style={replayStyles.thumbnailDurationText}>{replay.viewCount} 조회</Text>
            </View>
          </View>
          <View style={replayStyles.highlightInfo}>
            <Text style={replayStyles.highlightTitle} numberOfLines={1}>{replay.title}</Text>
            <Text style={replayStyles.highlightMetaText}>
              {replay.viewCount} 조회 • {replay.uploaderName} • {replay.createdAt ? new Date(replay.createdAt).toLocaleDateString('ko-KR') : ''}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 하트 버튼 */}
        <TouchableOpacity
          style={replayStyles.cardLikeBtn}
          onPress={() => onLike(replay.replayId)}
          disabled={!!likedItems[replay.replayId]}
        >
          <Heart
            size={18}
            color={likedItems[replay.replayId] ? THEME.danger : THEME.textSub}
            fill={likedItems[replay.replayId] ? THEME.danger : 'transparent'}
            style={likedItems[replay.replayId] && { opacity: 0.7 }} // 이미 누른 건 하트를 살짝 불투명하게 처리
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ==========================================
// 5. Highlights Screen (export default 추가)
// ==========================================
export default function HighlightsScreen() {
  const { userData } = useUser();
  const [showAll, setShowAll] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [likedItems, setLikedItems] = useState({});
  // [추가] 로컬에서 숨긴(삭제한) 리플레이 ID 목록
  const [hiddenIds, setHiddenIds] = useState(new Set());

  const { data: replays = [], refetch } = useQuery({
    // 토큰별로 캐시를 분리하기 위해 queryKey에 토큰을 포함합니다.
    queryKey: ['replays', userData?.accessToken || userData?.token],
    queryFn: async () => {
      if (!userData) return [];

      const response = await fetch(`${API_BASE_URL}/api/v1/replays`, {
        headers: {
          Authorization: `Bearer ${userData?.accessToken || userData?.token}`,
        },
      });
      if (!response.ok) throw new Error('리플레이 로드 실패');

      const data = await response.json();

      // [최신순 정렬] 생성일자(createdAt) 기준으로 내림차순 정렬해서 리턴합니다.
      return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    staleTime: 1000 * 60 * 5, // 5분 동안 다시 호출하지 않도록 캐싱!
    enabled: !!userData,      // 로그인 토큰이 있을 때만 자동으로 호출되게 설정!
  });

  // [버그 수정] mainVideo 선언을 replays useQuery 아래로 이동 (replays가 정의된 후에 참조해야 함)
  const mainVideo = replays && replays.length > 0
    ? [...replays].sort((a, b) => {
        if (b.viewCount === a.viewCount) {
          // 조회수가 둘 다 0회로 똑같다면 최신 날짜(createdAt) 순으로 정렬해 줍니다.
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.viewCount - a.viewCount; // 기본은 조회수 높은 순 정렬
      })[0]
    : null;

  useEffect(() => {
    const loadLikedItems = async () => {
      try {
        const saved = await AsyncStorage.getItem('MY_LIKED_REPLAYS');
        if (saved) {
          setLikedItems(JSON.parse(saved));
        }
      } catch (e) {
        console.error('좋아요 내역 로드 실패:', e);
      }
    };
    loadLikedItems();
  }, []);

  if (!replays || replays.length === 0) return null;

  const toggleLike = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/replays/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData?.accessToken || userData?.token}`,
        },
      });
      if (response.ok) {
        // ── [수정] 내 하트 상태를 만들고 기기 내부 저장소에 세이브 ──
        const updatedLikedItems = { ...likedItems, [id]: true };
        setLikedItems(updatedLikedItems);
        await AsyncStorage.setItem('MY_LIKED_REPLAYS', JSON.stringify(updatedLikedItems));

        refetch(); // 서버에서 최신 likeCount 받아오기 위해 리패치
      }
    } catch (error) {
      console.error('좋아요 실패:', error);
    }
  };

  // 카드 스와이프 삭제 핸들러 
  const handleDelete = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/replays/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userData?.accessToken || userData?.token}`,
      },
    });
    if (response.ok) {
      setHiddenIds((prev) => new Set([...prev, id]));
      refetch(); // 서버에서 최신 목록 받아오기 위해 리패치
    }
  } catch (error) {
    console.error('삭제 실패:', error);
  }
};

  // [추가] 화면에 표시할 리플레이 목록 (숨겨진 항목 제외)
  const visibleReplays = replays.filter((r) => !hiddenIds.has(r.replayId));

  return (
    <ScrollView style={replayStyles.scrollView} contentContainerStyle={replayStyles.scrollContent}>
      {/* ── 메인 플레이어 (가장 조회수 높은 영상) ── */}
      {mainVideo && (
        <TouchableOpacity
          style={[replayStyles.mainPlayer, commonShadow]}
          onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${mainVideo?.youtubeVideoId}`)}
        >
          <View style={replayStyles.videoContainer}>
            <Image
              source={{ uri: `https://img.youtube.com/vi/${mainVideo?.youtubeVideoId}/0.jpg` }}
              style={replayStyles.videoThumbnail}
              resizeMode="cover"
            />
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
              <TouchableOpacity
                onPress={() => toggleLike(mainVideo?.replayId)}
                disabled={!!likedItems[mainVideo?.replayId]}
              >
                <Heart
                  size={20}
                  color={likedItems[mainVideo?.replayId] ? THEME.danger : THEME.textSub}
                  fill={likedItems[mainVideo?.replayId] ? THEME.danger : 'transparent'}
                />
              </TouchableOpacity>
            </View>
            <View style={replayStyles.videoMeta}>
              <Eye size={14} color={THEME.textSub} />
              {/* [버그 수정] viewCount + likeCount 둘 다 정상 표시 */}
              <Text style={replayStyles.metaText}>
                {mainVideo?.viewCount} 조회 · ❤️ {mainVideo?.likeCount} · {mainVideo?.uploaderName}
              </Text>
            </View>
            <TouchableOpacity style={replayStyles.shareButton}>
              <Share2 size={16} color={THEME.primary} />
              <Text style={replayStyles.shareText}>공유</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* ── 최근 하이라이트 목록 ── */}
      <View style={replayStyles.recentSection}>
        <View style={replayStyles.sectionHeader}>
          <Text style={replayStyles.sectionTitle}>최근 하이라이트</Text>
          <TouchableOpacity onPress={() => setShowAll(!showAll)}>
            <Text style={replayStyles.viewAllBtn}>{showAll ? '접기' : '전체보기'}</Text>
          </TouchableOpacity>
        </View>
        <View style={replayStyles.highlightsList}>
          {(showAll ? visibleReplays : visibleReplays.slice(0, 4)).map((replay) => (
            // [추가] 스와이프 삭제 가능한 카드로 교체
            <SwipeableHighlightCard
              key={replay.replayId}
              replay={replay}
              likedItems={likedItems}
              onLike={toggleLike}
              onDelete={handleDelete}
            />
          ))}
        </View>
      </View>

      {/* ── 통계 섹션 ── */}
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
}

// ==========================================
// Styles (replayStyles만 남기고 다이어트!)
// ==========================================
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

// [추가] 스와이프 카드 전용 스타일
const swipeStyles = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden', borderRadius: 12 },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.danger,
    borderRadius: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deleteButton: { paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  deleteText: { color: THEME.white, fontWeight: '700', fontSize: 14 },
  cardInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
});