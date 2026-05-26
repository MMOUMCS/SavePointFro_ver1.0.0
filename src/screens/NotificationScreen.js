import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { ChevronLeft, Gamepad2, Info, CheckCircle, Clock } from 'lucide-react-native';

const THEME = {
  bg: '#FFFFFF',
  primary: '#4A7FA7',
  textMain: '#1A3D63',
  textSub: '#6E8EA6',
  border: '#F0F4F8',
};

// Dummy Data
const NOTIFICATIONS = [
    { id: 1, type: 'game', title: "게임방문", desc: "Player B 님 부름.", time: "2 min ago", unread: true },
    { id: 2, type: 'system', title: "시스템 업데이트", desc: "Patch 2.4 패치완료", time: "1 hr ago", unread: true },
    { id: 3, type: 'success', title: "퀘스트 완료", desc: "퀘스트 달성 'Daily Warm-up'.", time: "5 hrs ago", unread: false },
    { id: 4, type: 'game', title: "듀오 퀘스트", desc: "새 듀오 퀘스트 발생 from 'User123'.", time: "1 day ago", unread: false },
];

const NotificationScreen = ({ onNavigate, onGoBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <View style={{ height: 30 }} />
      <View style={styles.header}>
        {/* 2. onPress를 onGoBack으로 변경 */}
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <ChevronLeft size={28} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <TouchableOpacity><Text style={styles.readAll}>모두 읽음</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {NOTIFICATIONS.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.notiCard, item.unread && styles.unreadCard]}>
                <View style={[
                    styles.iconCircle, 
                    item.type === 'game' ? {backgroundColor: '#E3F2FD'} :
                    item.type === 'system' ? {backgroundColor: '#F3E5F5'} : {backgroundColor: '#E8F5E9'}
                ]}>
                    {item.type === 'game' && <Gamepad2 size={20} color={THEME.primary} />}
                    {item.type === 'system' && <Info size={20} color="#AB47BC" />}
                    {item.type === 'success' && <CheckCircle size={20} color="#66BB6A" />}
                </View>
                <View style={styles.textContainer}>
                    <View style={styles.topRow}>
                        <Text style={styles.title}>{item.title}</Text>
                        {item.unread && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.desc} numberOfLines={1}>{item.desc}</Text>
                    <View style={styles.timeRow}>
                        <Clock size={12} color={THEME.textSub} />
                        <Text style={styles.time}>{item.time}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.textMain },
  readAll: { fontSize: 14, color: THEME.primary, fontWeight: '600' },
  content: { padding: 20, gap: 12 },
  notiCard: { flexDirection: 'row', padding: 16, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: THEME.border },
  unreadCard: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  textContainer: { flex: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '700', color: THEME.textMain },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.primary },
  desc: { fontSize: 13, color: THEME.textSub, marginBottom: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  time: { fontSize: 11, color: THEME.textSub },
});

export default NotificationScreen;