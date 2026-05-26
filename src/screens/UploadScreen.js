import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ImageIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../../settings'; // 서버 IP 주소가 담긴 설정 파일
import CustomAlert from '../components/CustomAlert'; // 로그인 페이지에서 사용한 것과 동일
import { useUser } from '../components/UserContext';

const THEME = {
  bg: '#FFFFFF',
  primary: '#4A7FA7',
  secondary: '#B3CFE5',
  textMain: '#1A3D63',
  textSub: '#94A3B8',
  border: '#F0F4F8',
  gradMix: ['#4A7FA7', '#B3CFE5'],
};

const UploadScreen = ({ onNavigate, onGoBack }) => {
  const { userData } = useUser(); 
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeUploadTab, setActiveUploadTab] = useState('photo');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  
  // 알림창 상태 관리
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const userDisplay = {
    avatar: userData?.profileImageUrl || "https://via.placeholder.com/150"
  };

  // 1. 이미지 선택 기능
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('권한 필요', '사진첩 접근 권한이 필요합니다.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // 2. 서버 업로드 기능 (로그인 로직 참고)
  const handleUpload = async () => {
    const token = userData?.accessToken || userData?.token;

    // 리플레이 탭일 때
    if (activeUploadTab === 'replay') {
      if (!youtubeUrl) {
        showAlert('알림', '유튜브 URL을 입력해주세요.');
        return;
      }

      // URL에서 ID 추출
      const match = youtubeUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (!match) {
        showAlert('알림', '올바른 유튜브 URL이 아닙니다.');
        return;
      }
      const youtubeVideoId = match[1];

      try {
        setUploading(true);
        const response = await fetch(`${API_BASE_URL}/api/v1/replays`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            youtubeVideoId,
            title: youtubeTitle || '제목 없음',
            uploaderName: userData?.username || '알 수 없음',
          }),
        });

        if (response.ok) {
          showAlert('성공', '리플레이가 등록되었습니다.');
        } else {
          showAlert('실패', '리플레이 등록에 실패했습니다.');
        }
      } catch (error) {
        showAlert('통신 오류', '서버에 연결할 수 없습니다.');
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!image) {
      showAlert('알림', '공유할 사진을 선택해주세요.');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    const localUri = image.uri;
    const filename = localUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('file', { uri: localUri, name: filename, type });
    formData.append('caption', caption);

    try {
      // settings.js에 정의된 API_BASE_URL 사용
      const FULL_URL = `${API_BASE_URL}/api/v1/photos`;

      const response = await fetch(FULL_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showAlert('성공', '사진이 성공적으로 업로드되었습니다.');
        // 확인 버튼 누르면 뒤로 가도록 커스텀 가능
      } else {
        const errorText = await response.text();
        console.error("Upload Error:", errorText);
        showAlert('업로드 실패', '서버 응답 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error("Network Error:", error);
      showAlert('통신 오류', '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.closeBtn}>
          <X size={28} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeUploadTab === 'photo' ? 'New Post' : 'Add Replay'}</Text>
        <TouchableOpacity 
          style={styles.postBtnTextWrapper} 
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={THEME.primary} />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
      {/* 탭 선택 */}
<View style={styles.tabContainer}>
  <TouchableOpacity 
    style={[styles.tabBtn, activeUploadTab === 'photo' && styles.tabBtnActive]} 
    onPress={() => setActiveUploadTab('photo')}
  >
    <Text style={[styles.tabBtnText, activeUploadTab === 'photo' && styles.tabBtnTextActive]}>사진</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    style={[styles.tabBtn, activeUploadTab === 'replay' && styles.tabBtnActive]} 
    onPress={() => setActiveUploadTab('replay')}
  >
    <Text style={[styles.tabBtnText, activeUploadTab === 'replay' && styles.tabBtnTextActive]}>리플레이</Text>
  </TouchableOpacity>
</View>


      <View style={styles.content}>
        {activeUploadTab === 'photo' ? (
          <View>
        {/* Input Area */}
        <View style={styles.inputContainer}>
          <Image source={{ uri: userDisplay.avatar }} style={styles.avatar} />
          <TextInput 
            placeholder="오늘의 추억을 기록해보세요!" 
            placeholderTextColor={THEME.textSub}
            style={styles.textInput}
            multiline
            value={caption}
            onChangeText={setCaption}
          />
        </View>

        {/* Media Preview Area */}
        <TouchableOpacity 
          style={[styles.mediaPlaceholder, image && { borderStyle: 'solid' }]} 
          onPress={pickImage}
        >
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
          ) : (
            <>
              <View style={styles.placeholderIcon}>
                <ImageIcon size={32} color={THEME.secondary} />
              </View>
              <Text style={styles.placeholderText}>사진을 추가하세요</Text>
            </>
          )}
        </TouchableOpacity>
        </View>
        ) : (
  <View style={styles.replayContent}>
    <View style={styles.urlInputContainer}>
      <Text style={styles.urlLabel}>유튜브 URL</Text>
      <TextInput
        placeholder="https://www.youtube.com/watch?v=..."
        placeholderTextColor={THEME.textSub}
        style={styles.urlInput}
        value={youtubeUrl}
        onChangeText={setYoutubeUrl}
        autoCapitalize="none"
      />
      <Text style={styles.urlLabel}>제목</Text>
      <TextInput
        placeholder="영상 제목을 입력해주세요"
        placeholderTextColor={THEME.textSub}
        style={styles.urlInput}
        value={youtubeTitle}
        onChangeText={setYoutubeTitle}
        autoCorrect={false}
      />
    </View>
  </View>
)}
</View>

      <View style={styles.bottomArea}>
        <TouchableOpacity 
          style={styles.mainPostBtn} 
          onPress={handleUpload}
          disabled={uploading}
        >
          <LinearGradient colors={THEME.gradMix} style={styles.gradientBtn}>
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.mainBtnText}>Share to Duo</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 로그인 화면과 동일한 알림창 구성 */}
      <CustomAlert 
        isVisible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => {
          setAlertVisible(false);
          if(alertConfig.title === '성공') onGoBack(); // 성공 시 뒤로가기
        }}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: THEME.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.textMain },
  closeBtn: { padding: 5 },
  postBtnText: { fontSize: 16, fontWeight: '700', color: THEME.primary },
  content: { flex: 1, padding: 24 },
  inputContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  textInput: { flex: 1, fontSize: 16, color: THEME.textMain, paddingTop: 10, textAlignVertical: 'top', minHeight: 80 },
  mediaPlaceholder: { height: 250, backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 2, borderColor: '#EFF2F6', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 30, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  placeholderText: { fontSize: 14, color: THEME.textSub, fontWeight: '600' },
  optionsList: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: THEME.border },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  optionText: { fontSize: 16, fontWeight: '600', color: THEME.textMain },
  divider: { height: 1, backgroundColor: THEME.border, marginHorizontal: 16 },
  bottomArea: { padding: 24 },
  mainPostBtn: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden', elevation: 5 },
  gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, backgroundColor: '#F2F2F7', borderRadius: 10, padding: 4 },
tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
tabBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
tabBtnText: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
tabBtnTextActive: { color: '#000000', fontWeight: '600' },
replayContent: { padding: 16 },
urlInputContainer: { gap: 8 },
urlLabel: { fontSize: 14, fontWeight: '600', color: '#000000', marginTop: 8 },
urlInput: { backgroundColor: '#F2F2F7', borderRadius: 10, padding: 14, fontSize: 14, color: '#000000' },
});

export default UploadScreen;