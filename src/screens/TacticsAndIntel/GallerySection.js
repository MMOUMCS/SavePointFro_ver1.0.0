import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  Trash2,
  X
} from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingSpinner from '../../components/LoadingSpinner'; // 프로젝트 구조에 맞게 경로 확인
import { useUser } from '../../components/UserContext'; // 프로젝트 구조에 맞게 경로 확인

import { API_BASE_URL } from '../../../settings';

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
// 1. Comment Item (댓글 한 줄 컴포넌트)
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

// ==========================================
// 2. Photo Detail Modal (인스타 스타일 상세 모달)
// ==========================================
const PhotoDetailModal = ({ visible, photo, onClose, onToggleLike, userData }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageHeight, setImageHeight] = useState(300);
  const inputRef = useRef(null);

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
// 3. Gallery Screen 메인 컴포넌트
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
    staleTime: 1000 * 60 * 5,
  });

  const [loading, setLoading] = useState(false);
  const [menuVisibleId, setMenuVisibleId] = useState(null); 
  const [filterMode, setFilterMode] = useState('ALL');

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const handleFilterChange = (mode) => {
    if (filterMode === mode) return; 
    setLoading(true);
    setFilterMode(mode);
    setTimeout(() => setLoading(false), 300);
  };

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
      {/* 메뉴 모달 */}
      <Modal transparent visible={menuVisibleId !== null} animationType="fade">
        <TouchableOpacity style={galleryStyles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisibleId(null)}>
          <View style={[galleryStyles.modalContent, commonShadow]}>
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

      {/* 필터 탭 */}
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

      {/* 메인 리스트 */}
      <ScrollView 
        contentContainerStyle={galleryStyles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
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

      {/* 상세 모달 */}
      <PhotoDetailModal
        visible={detailVisible}
        photo={selectedPhoto}
        onClose={() => setDetailVisible(false)}
        onToggleLike={(id) => {
          toggleLike(id);
          setSelectedPhoto(prev =>
            prev?.id === id ? { ...prev, isLiked: !prev.isLiked } : prev
          );
        }}
        userData={userData}
      />
      <LoadingSpinner visible={isGalleryLoading || loading} />
    </View>
  );
};

// ==========================================
// Styles
// ==========================================
const galleryStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  filterContainer: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterTabs: { flexDirection: 'row', gap: 8 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: THEME.border },
  filterTabActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  filterTabText: { fontSize: 12, fontWeight: '600', color: THEME.textSub },
  filterTabTextActive: { color: THEME.white },
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

const detailStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.white },
  header: {
    flex: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 0.5,
    borderColor: THEME.border,
  },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { fontSize: 14, fontWeight: '700', color: THEME.textMain },
  headerDate: { fontSize: 11, color: THEME.textSub, marginTop: 1 },
  closeButton: { padding: 6 },
  fullImage: { width: SCREEN_WIDTH, backgroundColor: '#F5F5F5' },
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
  description: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: THEME.textMain, lineHeight: 20 },
  commentSection: { paddingHorizontal: 16, paddingTop: 10 },
  commentSectionTitle: { fontSize: 13, fontWeight: '700', color: THEME.textMain, marginBottom: 10 },
  emptyComment: { fontSize: 13, color: THEME.textSub, textAlign: 'center', marginVertical: 24 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#F5F5F5' },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10, marginTop: 1 },
  commentBody: { flex: 1 },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: THEME.textMain, marginBottom: 2 },
  commentText: { fontSize: 13, color: '#333', lineHeight: 18 },
  commentTime: { fontSize: 10, color: '#BBBBBB', marginTop: 3 },
  commentDelete: { padding: 6 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderColor: THEME.border,
    backgroundColor: THEME.white,
    gap: 8,
  },
  inputAvatar: { width: 32, height: 32, borderRadius: 16, marginBottom: 2 },
  input: { flex: 1, minHeight: 38, maxHeight: 100, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: THEME.textMain },
  sendButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: THEME.secondary },
});

export default GalleryScreen;