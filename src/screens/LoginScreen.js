import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GradientButton, InputField } from '../components/AuthUI';
import CustomAlert from '../components/CustomAlert.js';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../components/ThemeContext'; // 고정 테마를 지우고 전역 테마 훅 임포트
import { useUser } from '../components/UserContext';
import { ERROR_MESSAGES } from '../constants/message.js';

// API 상수
import { API_BASE_URL } from '../../settings';
const LOGIN_ENDPOINT = '/api/users/login'; 

const LoginScreen = ({ onNavigate, onLoginSuccess, setIsLoading, isLoading }) => {
    const { setUserData } = useUser();
    const { theme } = useTheme(); // 전역 테마 상태 가져오기
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

    const showAlert = (title, message) => {
        setAlertConfig({ title, message });
        setAlertVisible(true);
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: '' }));
    };

    const validateForm = () => {
        const currentErrors = {};
        if (!formData.email) {
            currentErrors.email = '이메일은 필수 입력 항목입니다.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
             currentErrors.email = '유효한 이메일 형식이 아닙니다.';
        }

        if (!formData.password || formData.password.length < 8) {
            currentErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
        }
        
        setErrors(currentErrors);
        return Object.keys(currentErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) {
            showAlert("입력 오류", ERROR_MESSAGES.INVALID_LOGIN_FORMAT);
            return;
        }
        try {
            const FULL_URL = `${API_BASE_URL}${LOGIN_ENDPOINT}`;
            console.log(FULL_URL+"+");
            const response = await fetch(FULL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            console.log(FULL_URL+"+"+response+"formData");

            if (response.ok) {
                const data = await response.json(); 

                const token = data.accessToken;
                
                if (!token) {
                    console.error("데이터에 토큰이 없음:", data);
                    showAlert("시스템 오류", ERROR_MESSAGES.TOKEN_MISSING);
                    return; 
                }
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('userData', JSON.stringify(data)); // 객체를 문자열로 변환

                // 2. Context(전역 상태) 업데이트
                // 이제 앱 어디서든 useUser()를 통해 username, profileImageUrl에 접근 가능합니다.
                setUserData(data); 

                // 3. 성공 콜백 호출
                onLoginSuccess(data);
                return;
            } 
            
            if (response.status === 401 || response.status === 403) {
                showAlert("로그인 실패", ERROR_MESSAGES.LOGIN_FAILED);
            } else {
                let errorMessage = ERROR_MESSAGES.SERVER_ERROR;
                try {
                    const errorData = await response.json();
                    if(errorData.message) errorMessage = errorData.message;
                } catch (e) {
                    const errorText = await response.text();
                    if(errorText) errorMessage = errorText;
                }
                
                showAlert("오류", `서버 응답: ${errorMessage}`);
            }

        } catch (error) {
            console.error("Login Network Error:", error);
            showAlert("통신 오류", ERROR_MESSAGES.NETWORK_FAILED);
        }
        setIsLoading(false);
    };

    return (
        /* SafeAreaView 배경색을 현재 테마의 bg로 연동 */
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 상단 여백 */}
                <View style={styles.topSpacer} />

                {/* 타이틀 */}
                <Text style={[styles.title, { color: theme.textMain }]}>안녕하세요!</Text>
                <Text style={[styles.subtitle, { color: theme.textSub }]}>Save Point에 로그인해요</Text>

                {/* 입력 필드 영역 */}
                <View style={styles.formContainer}>
                    <InputField 
                        placeholder="이메일 (Email)"
                        value={formData.email}
                        onChangeText={(text) => handleChange('email', text)}
                        keyboardType="email-address"
                    />
                    {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                    
                    <InputField 
                        placeholder="비밀번호 (Password)" 
                        isPassword={true}
                        value={formData.password}
                        onChangeText={(text) => handleChange('password', text)}
                    />
                    {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                </View>

                {/* 버튼 영역 */}
                <View style={styles.buttonContainer}>
                    <GradientButton
                        title="로그인"
                        colors={theme.gradPurple} // 현재 테마 상태의 gradPurple 배열 연동
                        onPress={handleLogin}
                        disabled={isLoading}
                    />
                    <LoadingSpinner visible={isLoading} />

                    <TouchableOpacity 
                        style={styles.signupButton}
                        onPress={() => onNavigate('SignUp')}
                    >
                        <Text style={[styles.signupButtonText, { color: theme.textSub }]}>
                            계정이 없으신가요? 회원가입
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 알림창 */}
                <CustomAlert 
                    isVisible={alertVisible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onConfirm={() => setAlertVisible(false)}
                    onClose={() => setAlertVisible(false)}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    topSpacer: {
        height: 200,
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
        marginBottom: 40,
    },
    formContainer: {
        marginBottom: 0,
    },
    errorText: {
        color: '#FF4444',
        fontSize: 12,
        marginTop: -8,
        marginBottom: 12,
        marginLeft: 4,
    },
    buttonContainer: {
        gap: 5,
    },
    signupButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    signupButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    breadLoadingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        paddingVertical: 8,
        borderRadius: 12,
    },
    breadText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#8B4513', // 초콜릿 빵 색상
    },
});

export default LoginScreen;