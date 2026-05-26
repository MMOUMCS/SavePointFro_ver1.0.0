import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CircleUser } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView, ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';

import { API_BASE_URL } from '../../settings';

const ProfileSetupScreen = ({ onNavigate, onComplete }) => { 
  const [profileImage, setProfileImage] = useState(null);
  const [nickname, setNickname] = useState('김세이브'); 
  const [duoEmail, setDuoEmail] = useState('');
  const [connectCode, setConnectCode] = useState('');
  const [errors, setErrors] = useState({});

  const handleSelectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 선택을 위해 권한이 필요합니다.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    // 유효성 검사
    const newErrors = {};

    if (!duoEmail.trim()) {
      newErrors.duoEmail = '상대방의 이메일을 입력해야 매칭을 완료할 수 있어요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(duoEmail)) {
      newErrors.duoEmail = '올바른 이메일 형식이 아니에요';
    }

    if (!connectCode.trim()) {
      newErrors.connectCode = '연결 코드를 입력해주세요';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const FULL_URL = `${API_BASE_URL}/api/v1/couples/connect`;

      const response = await axios.post(
        FULL_URL, 
        { 
          targetEmail: duoEmail,
          connectionCode: connectCode.trim(),
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        Alert.alert('🎉 연결 성공!', '커플 연결이 완료되었습니다.', [
          { text: '확인', onPress: () => onComplete() }
        ]);
      }
    } catch (error) {
  // 1. 디버깅을 위해 콘솔에 전체 구조를 찍어봅니다.
  console.log("--- [DEBUG] 매칭 에러 상세 발생 ---");
  if (error.response) {
    // 서버가 응답을 보냈으나 2xx 외의 상태 코드인 경우
    console.log("Status:", error.response.status);
    console.log("Data:", JSON.stringify(error.response.data));
    
    // 서버에서 보낸 'message' 필드를 추출 시도
    const serverMsg = error.response.data?.message;
    Alert.alert('매칭 실패', serverMsg || '서버에서 에러 메시지를 보내지 않았습니다.');
  } else if (error.request) {
    // 요청은 갔으나 응답을 아예 받지 못한 경우 (네트워크 문제)
    console.log("Request Error:", error.request);
    Alert.alert('네트워크 오류', '서버와 통신할 수 없습니다. 와이파이 연결을 확인하세요.');
  } else {
    // 설정 단계에서 문제 발생
    console.log("Error Message:", error.message);
    Alert.alert('오류', '요청 설정 중 문제가 발생했습니다.');
  }
}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>프로필 및 듀오 설정</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageWrapper}>
            <View style={styles.profileImagePlaceholder}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <CircleUser size={98} color="#A0AEC0" fill="#E2E8F0" />
              )}
            </View>
            <TouchableOpacity onPress={handleSelectPhoto} style={styles.cameraButton}>
              <Camera size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.nicknameText}>{nickname}</Text>
          <Text style={styles.subText}>사진은 나중에 등록해도 괜찮아요!</Text>
        </View>

        <View style={styles.inputFormContainer}>

          {/* 상대방 이메일 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>상대방 이메일 (필수)</Text>
            <TextInput
              placeholder="상대방의 이메일을 입력하세요"
              keyboardType="email-address"
              value={duoEmail}
              onChangeText={(text) => {
                setDuoEmail(text);
                setErrors({});
              }}
              style={[styles.input, errors.duoEmail && styles.inputError]}
              autoCapitalize="none"
            />
            {errors.duoEmail && <Text style={styles.errorText}>{errors.duoEmail}</Text>}
          </View>

          {/* 연결 코드 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>연결 코드 (필수)</Text>
            <TextInput
              placeholder="연결 코드를 입력하세요"
              value={connectCode}
              onChangeText={(text) => {
                setConnectCode(text);
                setErrors({});
              }}
              style={[styles.input, errors.connectCode && styles.inputError]}
              autoCapitalize="none"
            />
            {errors.connectCode && <Text style={styles.errorText}>{errors.connectCode}</Text>}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              듀오 서비스는 커플 연결이 완료되어야 시작할 수 있습니다.
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleComplete} style={styles.completeButton}>
          <Text style={styles.completeButtonText}>연결하고 시작하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 74,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 42,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', flex: 1 },
  subText: { fontSize: 12, color: '#A0AEC0', marginTop: 5 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#191F28',
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderIcon: {
    fontSize: 60,
    color: '#ADB5BD',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'gray',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0064FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cameraIcon: {
    fontSize: 18,
    color: 'white',
  },
  nicknameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191F28',
  },
  inputFormContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 0,
    color: '#191F28',
    fontWeight: '500',
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 14,
  },
  infoIcon: {
    fontSize: 18,
    flexShrink: 0,
  },
  infoText: {
    fontSize: 13,
    color: '#0064FF',
    lineHeight: 18,
    fontWeight: '500',
    flexShrink: 1,
  },
  buttonContainer: {
    marginTop: 24,
  },
  completeButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#0064FF', 
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#0064FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default ProfileSetupScreen;