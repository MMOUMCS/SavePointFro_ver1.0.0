// src/components/CustomAlert.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

const CustomAlert = ({ isVisible, title, message, onConfirm, onClose }) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose} // 배경 누르면 닫기 (선택사항)
      backdropOpacity={0.4}
      animationIn="fadeIn"
      animationOut="fadeOut"
    >
      <View style={styles.modalContainer}>
        {/* 1. 텍스트 영역 */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>

        {/* 2. 버튼 영역 (가로 선으로 구분) */}
        <View style={styles.buttonContainer}>
          {/* 취소 등의 버튼이 필요하면 여기에 추가 가능 */}
          
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={onConfirm}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmText}>확인</Text> 
            {/* 이미지의 'Action' 버튼처럼 파란색 */}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // 살짝 투명한 흰색 (iOS 느낌)
    borderRadius: 14,
    width: 270, // 아이폰 Alert 표준 너비
    alignSelf: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 5,
  },
  message: {
    fontSize: 13,
    color: '#000',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    borderTopWidth: 0.5,
    borderTopColor: '#3F3F3F', // 얇은 회색 구분선
    flexDirection: 'row',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', 
  },
  confirmText: {
    fontSize: 17,
    color: '#007AFF', // ✨ iOS 기본 파란색 (핵심)
    fontWeight: '600',
  },
});

export default CustomAlert;