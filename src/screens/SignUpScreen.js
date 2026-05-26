import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../../settings';
import { GradientButton, InputField } from '../components/AuthUI';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../components/ThemeContext'; // 고정 테마를 지우고 전역 테마 훅 임포트
import { ERROR_MESSAGES } from '../constants/message.js';

const REGISTER_ENDPOINT = '/api/users/register';

const SignUpScreen = ({ onNavigate, setIsLoading, isLoading }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기
  const [formData, setFormData] = useState({
    username: '', 
    email: '',
    password: '',
    connectionCode: '', 
  });
  
  // 1. 유효성 검사 오류 메시지를 저장할 상태
  const [errors, setErrors] = useState({});

  // 2. 개별 필드 유효성을 검사하는 함수
  const validateField = (key, value) => {
      let error = '';

      if (key === 'username' && value.trim().length === 0) {
          error = '닉네임은 필수 입력 항목입니다.';
      } else if (key === 'email') {
          if (value.trim().length === 0) {
              error = '이메일은 필수 입력 항목입니다.';
          } 
          // 간단한 이메일 정규식 검사
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              error = '유효한 이메일 형식이어야 합니다.';
          }
      } else if (key === 'password') {
          if (value.trim().length === 0) {
              error = '비밀번호는 필수 입력 항목입니다.';
          } 
          // 백엔드 DTO와 동일하게 최소 8자 검사
          else if (value.length < 8) {
              error = '비밀번호는 최소 8자 이상이어야 합니다.';
          }
      } else if (key === 'connectionCode') {
          if (value.trim().length === 0) {
              error = '연결 코드는 필수 입력 항목입니다.';
          } 
          // 백엔드 DTO와 동일하게 최소 4자 검사
          else if (value.length < 4) {
              error = '연결 코드는 최소 4자 이상이어야 합니다.';
          }
      }

      setErrors(prev => ({ ...prev, [key]: error }));
      return error.length === 0; // 유효하면 true, 아니면 false 반환
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // 입력할 때마다 유효성 검사 실행
    validateField(key, value); 
  };

  // 3. 전체 폼 유효성을 검사하고 API 호출을 결정하는 함수
  const validateForm = () => {
      // 모든 필드를 한 번에 검사
      const isUsernameValid = validateField('username', formData.username);
      const isEmailValid = validateField('email', formData.email);
      const isPasswordValid = validateField('password', formData.password);
      const isCodeValid = validateField('connectionCode', formData.connectionCode);

      return isUsernameValid && isEmailValid && isPasswordValid && isCodeValid;
  };

  const handleSignUp = async () => {
    // 4. API 호출 전에 전체 폼 유효성 검사
    if (!validateForm()) {
        Alert.alert("입력 오류", "입력 내용을 확인해 주세요.");
        return; 
    }
    setIsLoading(true);

    try {
        const FULL_URL = `${API_BASE_URL}${REGISTER_ENDPOINT}`;
        onNavigate('ProfileSetup'); 
        
        const response = await fetch(FULL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        // 1. 응답 객체를 복제합니다.
        const clonedResponse = response.clone();
        
        // 2. 성공 응답 처리 (200 ~ 299)
        if (response.ok) {
            Alert.alert("성공", ERROR_MESSAGES.SIGNUP_SUCCESS);
            onNavigate('Login'); 
            return;
        } 
        
        // 3. 오류 응답 처리 (4xx, 5xx)
        let errorData;
        try {
            // 원본 response로 JSON 파싱 시도
            errorData = await response.json(); 
        } catch (jsonError) {
            // JSON 파싱 실패 시, 복제된 response로 텍스트를 읽습니다. (Already read 오류 방지)
            const errorText = await clonedResponse.text(); 
            console.error("Non-JSON Response received:", errorText);
            errorData = { message: errorText, errorCode: 'UNKNOWN_JSON_FORMAT' };
        }

        // 4. HTTP 상태 코드 및 오류 코드를 기반으로 분기
        if (response.status === 409 && errorData.errorCode === 'DUPLICATE_EMAIL') {
            Alert.alert("회원가입 실패", ERROR_MESSAGES.DUPLICATE_EMAIL);
        } 
        else if (response.status === 400 && errorData.errorCode === 'VALIDATION_FAILED') {
            Alert.alert("입력 오류", errorData.message); 
        }
        else {
            Alert.alert("회원가입 실패", `서버 응답 오류: ${errorData.message || "알 수 없는 오류가 발생했습니다."}`);
        }

    } catch (error) { 
        console.error("Network Error:", error);
        Alert.alert("오류", ERROR_MESSAGES.NETWORK_FAILED);
    } finally {
        // 4. 성공하든 실패하든 로딩 끄기
        setIsLoading(false);
    }
};
  
  return (
    /* SafeAreaView의 배경색을 현재 테마의 bg 색상으로 연동 */
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.content}>
        {/* 타이틀 및 서브타이틀 색상 연동 */}
        <Text style={[styles.title, { color: theme.textMain }]}>어서오세요!</Text>
        <Text style={[styles.subtitle, { color: theme.textSub }]}>Save Point에서 함께해요</Text>

        {/* 1. 닉네임 (Nickname) - username */}
        <InputField 
          placeholder="닉네임 (Nickname)" 
          value={formData.username} 
          onChangeText={(text) => handleChange('username', text)} 
        />
        {/* 오류 메시지 렌더링 - 테마에서 가져온 에러 색상 매핑 */}
        {errors.username ? <Text style={[styles.errorText, { color: theme.error || 'red' }]}>{errors.username}</Text> : null}
        
        {/* 2. 이메일 (Email) - email */}
        <InputField 
          placeholder="이메일 (Email)" 
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          keyboardType="email-address"
        />
        {/* 오류 메시지 렌더링 - 테마에서 가져온 에러 색상 매핑 */}
        {errors.email ? <Text style={[styles.errorText, { color: theme.error || 'red' }]}>{errors.email}</Text> : null}
        
        {/* 3. 비밀번호 (Password) - password */}
        <InputField 
          placeholder="비밀번호 (Password)" 
          isPassword={true} 
          value={formData.password}
          onChangeText={(text) => handleChange('password', text)}
        />
        {/* 오류 메시지 렌더링 - 테마에서 가져온 에러 색상 매핑 */}
        {errors.password ? <Text style={[styles.errorText, { color: theme.error || 'red' }]}>{errors.password}</Text> : null}
        
        {/* 4. 연결코드 (Duo Password) - connectionCode */}
        <InputField 
          placeholder="듀오 연결 코드 (Duo Code)" 
          isPassword={true} 
          value={formData.connectionCode}
          onChangeText={(text) => handleChange('connectionCode', text)}
        />
        {/* 오류 메시지 렌더링 - 테마에서 가져온 에러 색상 매핑 */}
        {errors.connectionCode ? <Text style={[styles.errorText, { color: theme.error || 'red' }]}>{errors.connectionCode}</Text> : null}

        {/* 그라데이션 컬러 배열을 현재 테마 상태의 gradBlue 값으로 바인딩 */}
        <GradientButton
          title="계정 생성"
          colors={theme.gradBlue}
          onPress={handleSignUp}
          style={{ marginTop: 20 }}
          disabled={isLoading}
        />
        <LoadingSpinner visible={isLoading} />
        
        <TouchableOpacity onPress={() => onNavigate('Login')} style={{ marginTop: 15 }}>
          {/* 하단 로그인 이동 버튼 색상 연동 */}
          <Text style={{ textAlign: 'center', color: theme.textSub }}>
            이미 계정이 있으신가요? 로그인
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'left',
    marginBottom: 30,
  },
  // 5. 오류 메시지 스타일 추가
  errorText: {
    fontSize: 12,
    marginBottom: 5, // 다음 입력 필드와의 간격 조절
    marginTop: -5, // 입력 필드와의 간격 조절
  }
});

export default SignUpScreen;