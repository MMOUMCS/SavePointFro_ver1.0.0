import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../../../settings';
import CustomAlert from '../../components/CustomAlert';
import { useUser } from '../../components/UserContext';
import { Header, Icon, InputField, PrimaryBtn } from './components';
import { styles } from './styles';
export const ProfileEditScreen = ({ onBack }) => {
  const { userData, setUserData } = useUser();

  // 변수명을 username, email로 전역 데이터와 통일
  const [username, setUsername] = useState(userData?.username || "사용자");
  const [email, setEmail] = useState(userData?.email || "@gamer_ab");
  const [saved, setSaved] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  
  // 선택한 이미지를 담을 상태 추가 (기본값은 기존 유저 프로필)
  const [avatarUri, setAvatarUri] = useState(userData?.profileImageUrl || "https://via.placeholder.com/150");

  // 사진 변경을 눌렀을 때 실행될 함수
  const pickImage = async () => {
    // 갤러리 접근 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('사진을 변경하려면 갤러리 접근 권한이 필요합니다!');
      return;
    }

    // 갤러리 열기
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // 사진 크롭/편집 기능 여부
      aspect: [1, 1],      // 1:1 비율로 정방형 크롭
      quality: 1,          // 이미지 화질 (0~1)
    });

    // 사용자가 사진 선택을 취소하지 않았다면 상태 변경
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };
  // alter(알람)창 쉽게 켜기 위한 함수
  const showAlert = (title, message) => {
  setAlertTitle(title);
  setAlertMessage(message);
  setAlertVisible(true);
};

  const handleSave = async () => {
  try {
    const token = userData?.accessToken || userData?.token;
    if (!token) {
      showAlert('알림', '로그인 정보가 만료되었습니다.');
      return;
    }
    const isTextChanged = username !== originalUsername;
    // 비교용 원본 데이터
    const originalAvatar = userData?.profileImageUrl || "https://via.placeholder.com/150";
    const originalUsername = userData?.username || "사용자";
    // 무엇이 변경되었는지 정확히 발라내기
    const isAvatarChanged = avatarUri !== originalAvatar;

    // [케이스 1] 둘 다 안 바꿈 -> 요청 안 날리고 컷트
    if (!isAvatarChanged && !isTextChanged) {
      showAlert('알림', '변경사항이 없습니다.');
      return;
    }
    //  [케이스 2] 이름/소개글만 바꿈 (사진은 그대로!)
    //  R2를 건드리지 않는 일반 텍스트 전용 API로 라우팅합니다.
    if (!isAvatarChanged && isTextChanged) {
      console.log(' 텍스트만 변경됨: R2 보호를 위해 일반 프로필 텍스트 API 호출');
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json', // 텍스트 수정이므로 JSON 전송
        },
        body: JSON.stringify({
          username: username,
        }),
      });
      if (response.ok) {
  const updatedUserData = { ...userData, username };
  if (typeof setUserData === 'function') {
    setUserData(updatedUserData);
  }
  await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
  setSaved(true);
  setTimeout(() => setSaved(false), 2000);
  showAlert('프로필 수정', '이름과 소개가 성공적으로 변경되었습니다! ');
}
      return; // 텍스트 전용 로직 끝났으니 여기서 함수 종료!
    }
    //  [케이스 3 & 4] 사진을 바꿈 (사진만 바꿨거나, 둘 다 바꿨거나)
    //  백엔드가 무조건 파일과 텍스트를 같이 받아서 기존 프사를 지우고 새로 깜
    if (isAvatarChanged) {
      console.log(' 사진 변경 포함됨: 기존 프사 삭제 및 새 프사 덮어쓰기 API 호출');
      const formData = new FormData();
      formData.append('username', username);
      const localUri = avatarUri;
      // 확장자를 filename이 아닌 실제 URI 기준으로 추출 (png, webp 등 대응)
      const filename = `profile_${userData?.id || 'user'}_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(localUri);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      formData.append('file', {
        uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
        name: filename,
        type: type,
      });
      const response = await fetch(`${API_BASE_URL}/api/users/profile-image`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (response.ok) {
  const updatedUserData = { ...userData, profileImageUrl: avatarUri, username  };
  if (typeof setUserData === 'function') {
    setUserData(updatedUserData);
  }
  await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
  setSaved(true);
  setTimeout(() => setSaved(false), 2000);
  showAlert('프로필 수정', '변경사항이 성공적으로 저장되었습니다!');
} else {
        showAlert('오류', '서버 저장에 실패했습니다.');
      }
    }
  } catch (error) {
    console.error('업데이트 실패:', error);
    showAlert('네트워크 오류', '인터넷 연결을 확인해 주세요.');
  }
};

  return (
    <View style={styles.screen}>
      <Header title="프로필 수정" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 여기에 TouchableOpacity가 정확히 쓰여 있어야 저장이 풀리지 않아! */}
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} activeOpacity={0.8}>
          <View style={styles.avatarCircle}>
            {/* 텍스트 대신 실제 유저 프로필 이미지 띄우기 / 전역 변수 대신 변경 가능한 avatarUri 상태값 바인딩 */}
            <Image 
              source={{ uri: avatarUri }} 
              style={{ width: '100%', height: '100%', borderRadius: 999, position: 'absolute' }} 
            />
            <View style={styles.cameraBtn}>
              <Icon name="camera" size={12} color="#fff" />
            </View>
          </View>
          <Text style={styles.changePhotoText}>사진 변경</Text>
        </TouchableOpacity>

        {/* value와 onChange를 username / setUsername으로 올바르게 매핑 */}
        <InputField label="이름" value={username} onChange={setUsername} placeholder="이름을 입력하세요" />
        {/* 이메일 칸을 요걸로 완벽하게 바꿔 끼우기! */}
<View style={{ marginBottom: 18 }}>
  {/* 기존 이름 칸 라벨과 똑같은 스타일 적용 */}
  <Text style={styles.inputLabel}>이메일</Text>
  
  <TextInput 
    value={email} 
    editable={false} // 터치 및 수정 완전 차단
    style={{
      height: 48,                 // 일반적인 InputField 한 줄 높이 (혹시 안 맞으면 숫자만 살짝 조절해봐!)
      borderWidth: 1,
      borderColor: '#E5E8EB',     // 테두리 선을 아주 연하게 처리
      borderRadius: 8,            // 둥근 모서리 맞춤
      backgroundColor: '#F2F4F6', // 배경을 은은한 회색톤으로!
      color: '#8B95A1',           // 글자색을 옅은 회색으로 변경!
      paddingHorizontal: 16,       // 좌우 여백 줘서 글씨 안 붙게 처리
      fontSize: 15,               // 글자 크기 맞춤
      textAlignVertical: 'center'
    }} 
  />
  
  <Text style={{ fontSize: 13, color: '#8B95A1', marginTop: 4 }}>
    이메일은 변경할 수 없습니다.
  </Text>
</View>

        <PrimaryBtn label={saved ? '✓ 저장됨' : '변경사항 저장'} onPress={handleSave} />
      </ScrollView>
      <CustomAlert 
        isVisible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onConfirm={() => setAlertVisible(false)} 
        onClose={() => setAlertVisible(false)}   
      />
    </View>
  );
};