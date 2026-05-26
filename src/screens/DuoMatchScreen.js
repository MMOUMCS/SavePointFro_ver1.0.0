import axios from 'axios';
import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { GradientButton, InputField } from '../components/AuthUI';
import { useTheme } from '../components/ThemeContext'; // 고정 테마를 지우고 전역 테마 훅 임포트

import { API_BASE_URL } from '../constants/api';

const DuoMatchScreen = ({ onNavigate, userData }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기
  const [targetEmail, setTargetEmail] = useState('');
  const [connectionCode, setConnectionCode] = useState('');

  const handleConnect = async () => {
    try {
      console.log("보내는 이메일:", targetEmail);
      console.log("보내는 코드:", connectionCode);

      const response = await axios.post(
        `${API_BASE_URL}/api/couples/connect`,
        {
          targetEmail: targetEmail.trim(),
          connectionCode: connectionCode.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${userData.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("매칭 성공:", response.data);
      Alert.alert('성공', '커플 연결 완료!');
      
      onNavigate('Main');

    } catch (error) {
      console.log("매칭 에러:", error.response?.data);
      Alert.alert(
        '매칭 실패',
        error.response?.data?.message || '오류가 발생했습니다.'
      );
    }
  };

  return (
    /* SafeAreaView의 배경색을 현재 테마의 bg 색상으로 연동 */
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.content}>

        {/* 타이틀 텍스트 색상을 현재 테마의 textMain 색상으로 연동 */}
        <Text style={[styles.title, { color: theme.textMain }]}>Duo Match</Text>

        {/* 서브타이틀 텍스트 색상을 현재 테마의 textSub 색상으로 연동 */}
        <Text style={[styles.subtitle, { color: theme.textSub }]}>
          파트너의 정보를 입력하여 연결하세요
        </Text>

        <InputField
          placeholder="상대방 이메일 (Partner's Email)"
          value={targetEmail}
          onChangeText={setTargetEmail}
        />

        <InputField
          placeholder="듀오 비밀번호 (Duo Password)"
          isPassword={true}
          value={connectionCode}
          onChangeText={setConnectionCode}
        />

        {/* 그라데이션 컬러 배열을 현재 테마 상태의 gradBlue 값으로 바인딩 */}
        <GradientButton
          title="매칭 시작"
          colors={theme.gradBlue}
          onPress={handleConnect}
          style={{ marginTop: 20 }}
        />

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
    padding: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 5,
  },
});

export default DuoMatchScreen;