import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Check, Gamepad2, Heart, HelpCircle, Settings, Sparkles, Target, Trophy, User, X, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../../settings';
import BottomNavigation from '../components/BottomNavigation';
import { useTheme } from '../components/ThemeContext'; // 1. 전역 테마 훅 임포트
import { useUser } from '../components/UserContext';

import CustomAlert from '../components/CustomAlert';
import { ERROR_MESSAGES } from '../constants/message.js';


const GAME_NAME_MAP = {
  'notepad.exe': '메모장',
  'ffxiv_dx11.exe': '파이널 판타지 14',
  'GenshinImpact.exe': '원신',
  'LeagueClient.exe': '리그 오브 레전드',
  'None': '휴식'
};

const { width } = Dimensions.get('window');

const MainScreen = ({ onNavigate }) => {
  const { theme } = useTheme(); // 2. 전역 테마 상태 가져오기
  const { userData, partnerData, fetchPartnerInfo } = useUser();
  const [myStatus, setMyStatus] = useState({ running: false, process: null }); 
  const coupleId = userData?.coupleId;
  const userId = userData?.id;
  const [partnerStatus, setPartnerStatus] = useState({ running: false, process: null });
  
  const userDisplay = {
    name: userData?.username || "사용자",
    avatar: userData?.profileImageUrl || "https://via.placeholder.com/150"
  };

  const [modalVisible, setModalVisible] = useState(false);  
  const [isQuest1Done, setIsQuest1Done] = useState(true);
  const [isQuest2Done, setIsQuest2Done] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [requestVisible, setRequestVisible] = useState(false);
  const [pingVisible, setPingVisible] = useState(false);

  //alter 위한 state
  const [alertVisible, setAlertVisible] = useState(false);

  useEffect(() => {
    if (partnerData === null) {
      fetchPartnerInfo(API_BASE_URL);
    }
  }, []); //  의존성 배열을 빈 배열로 두어 최초 마운트 시 1회만 실행

// 2. 웹소켓은 userData 정보 기반으로 연결하고, partnerData 때문에 끊기지 않게 하기
  useEffect(() => {
    if (!userData?.accessToken) return;
    //   const socketUrl =
    //     API_BASE_URL.replace('http', 'ws') +
    //     `/ws/game-status?client=react&token=${userData?.accessToken}&coupleId=${coupleId}&userId=${userId}`;

    //   const ws = new WebSocket(socketUrl);

    // ws.onmessage = (e) => {
    //   try {
    //     const data = JSON.parse(e.data);
    //     if (data.command) return;

    //     if (String(data.senderId) === String(userId)) {
    //       setMyStatus({ running: data.running, process: data.process });
    //     } else {
    //       setPartnerStatus({ running: data.running, process: data.process });
    //     }
    //   } catch (err) {
    //     console.error("데이터 읽기 실패:", err);
    //   }
    // };

    // return () => ws.close();
  }, [userData]);

  const sendFCM = async (body) => {
  try {
    const token = userData?.accessToken || userData?.token;

    const email =
      partnerData?.email ||
      partnerData?.userEmail ||
      partnerData?.partnerEmail;

    if (!email) return false;

    const res = await fetch(`${API_BASE_URL}/api/fcm/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        email,
        ...body,
      }),
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
};

  const handleQuest1Press = () => setIsQuest1Done(!isQuest1Done);
  const handleQuest2Press = () => setIsQuest2Done(!isQuest2Done);

  // 동적 그라디언트 테마 세팅
  const gradPurple = theme.gradPurple || ['#4A7FA7', '#B3CFE5'];
  const gradMix = theme.gradMix || ['#B3CFE5', '#9BA986'];
  const gradBlue = theme.gradBlue || ['#9BA986', '#D1DAC2'];
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* === 1. Header === */}
        <View style={styles.headerRow}>
          <View>
            <View style={[styles.levelBadge, { backgroundColor: theme.dark ? '#1e293b' : '#eff6ff' }]}>
                <Trophy size={14} color={theme.primary} fill={theme.primary} />
                <Text style={[styles.levelText, { color: theme.primary }]}>LV. 24 DREAMER</Text>
            </View>
            <Text style={[styles.headerTitle, { color: theme.textMain }]}>Command Center</Text>
          </View>
          <View style={styles.headerIcons}>
             <TouchableOpacity
  style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
  onPress={() => setAlertVisible(true)}
>
  <Bell size={22} color={theme.textMain} />
  <View style={[styles.notificationDot, { backgroundColor: theme.accent }]} />
</TouchableOpacity>
             <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => onNavigate('Settings')}>
                <Settings size={22} color={theme.textMain} />
             </TouchableOpacity>
          </View>
        </View>

        {/* === 2. Profiles === */}
        <View style={styles.profilesContainer}>
            {/* Player 1 (Active User) */}
            <TouchableOpacity style={[styles.profileCard, { shadowColor: theme.primary }]}>
                <View style={[styles.cardInner, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatarBorder, { backgroundColor: theme.border }]}>
                            <View style={[styles.avatar, { backgroundColor: theme.dark ? '#334155' : '#e2e8f0', borderColor: theme.card }]}>
                                {userData?.profileImageUrl ? (
    <Image 
        source={{ uri: `${userData.profileImageUrl}?update=${new Date().getTime()}` }} 
        style={{ width: '100%', height: '100%' }} 
    />
) : (
    <User size={28} color={theme.textSub} />
)}
                            </View>
                        </View>
                        <View style={[styles.onlineBadge, { backgroundColor: myStatus.running ? '#22c55e' : '#94a3b8', borderColor: theme.card }]} />
                    </View>

                    <Text style={[styles.cardName, { color: userData ? theme.textMain : theme.textSub }]}>
                        {userData ? userData.username : 'Me'}
                    </Text>

                    <View style={[styles.statusPill, {
                        backgroundColor: myStatus.running ? (theme.dark ? '#14532d' : '#f0fdf4') : (theme.dark ? '#1e293b' : '#f8fafc'), 
                        borderColor: myStatus.running ? (theme.dark ? '#166534' : '#dcfce7') : theme.border
                    }]}>
                        {myStatus.running && <Gamepad2 size={12} color="#16a34a" style={{ marginRight: 4 }} />}
                        <Text style={[styles.statusText, { color: myStatus.running ? '#16a34a' : theme.textSub }]}>
                            {myStatus.running ? `${GAME_NAME_MAP[myStatus.process] || myStatus.process} 실행 중` : 'OFFLINE'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            <View style={styles.linkWrapper}>
                <View style={[styles.linkLine, { backgroundColor: theme.border }]} />
                <View style={[styles.heartBox, { backgroundColor: theme.card, shadowColor: theme.accent }]}>
                    <Heart size={18} color={theme.accent} fill={theme.accent} />
                </View>
                <View style={[styles.linkLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Player 2 (Partner) */}
            <TouchableOpacity style={[styles.profileCard, { shadowColor: theme.primary }]}>
                 <View style={[styles.cardInner, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatarBorder, { backgroundColor: theme.border }]}>
                            <View style={[styles.avatar, { backgroundColor: theme.dark ? '#334155' : '#e2e8f0', borderColor: theme.card }]}>
                                {partnerData?.profileImageUrl ? (
                                  <Image source={{ uri: partnerData.profileImageUrl }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                  <User size={28} color={theme.textSub} />
                                )}
                            </View>
                        </View>
                        {partnerData && <View style={[styles.onlineBadge, { backgroundColor: partnerStatus.running ? '#22c55e' : '#94a3b8', borderColor: theme.card }]} />}
                    </View>
                    <Text style={[styles.cardName, { color: partnerData ? theme.textMain : theme.textSub }]}>
                      {partnerData ? partnerData.name : 'Partner'}
                    </Text>
                    <View style={[styles.statusPill, {
                      backgroundColor: partnerStatus.running ? (theme.dark ? '#14532d' : '#f0fdf4') : (theme.dark ? '#1e293b' : '#f8fafc'), 
                      borderColor: partnerStatus.running ? (theme.dark ? '#166534' : '#dcfce7') : theme.border
                    }]}>
                        {partnerStatus.running && <Gamepad2 size={12} color="#16a34a" style={{ marginRight: 4 }} />}
                        <Text style={[styles.statusText, { color: partnerStatus.running ? '#16a34a' : theme.textSub }]}>
                          {partnerStatus.running ? `${GAME_NAME_MAP[partnerStatus.process] || partnerStatus.process} 실행 중` : 'OFFLINE'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>

        {/* === 3. Summon Buttons === */}
<View style={styles.sectionContainer}>
  <View style={styles.titleRow}>
    <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Summon</Text>
    <TouchableOpacity style={styles.helpBtn} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
      <HelpCircle size={16} color={theme.textSub} />
    </TouchableOpacity>
  </View>

  <View style={styles.skillRow}>
    <TouchableOpacity
      style={[styles.skillBtnWrapper, { shadowColor: theme.primary, backgroundColor: theme.card }]}
      onPress={() => setInviteVisible(true)}
    >
      <LinearGradient colors={gradPurple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.skillBtn}>
        <View style={styles.skillIconOverlay}><Gamepad2 size={24} color="#fff" /></View>
        <Text style={styles.skillLabel}>Invite</Text>
      </LinearGradient>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.skillBtnWrapper, { shadowColor: theme.primary, backgroundColor: theme.card }]}
      onPress={() => setRequestVisible(true)}
    >
      <LinearGradient colors={gradMix} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.skillBtn}>
        <View style={styles.skillIconOverlay}><Zap size={24} color="#fff" /></View>
        <Text style={styles.skillLabel}>Request</Text>
      </LinearGradient>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.skillBtnWrapper, { shadowColor: theme.primary, backgroundColor: theme.card }]}
      onPress={() => setPingVisible(true)}
    >
      <LinearGradient colors={gradBlue} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.skillBtn}>
        <View style={styles.skillIconOverlay}><Target size={24} color="#fff" /></View>
        <Text style={styles.skillLabel}>Ping</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
</View>

        {/* === 4. Daily Wishes === */}
        <View style={styles.sectionContainer}>
            <View style={styles.questHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Daily Wishes</Text>
                <Text style={[styles.xpText, { color: theme.primary }]}>XP 1240 / 2000</Text>
            </View>
            
            <View style={[styles.questList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TouchableOpacity 
                    style={[styles.questItem, isQuest1Done ? { backgroundColor: theme.dark ? '#1e293b' : '#f8fafc' } : null]}
                    onPress={handleQuest1Press}
                >
                    <View style={styles.questLeft}>
                        {isQuest1Done ? (
                            <View style={styles.checkCircleDone}>
                                <Check size={14} color="#fff" strokeWidth={4} />
                            </View>
                        ) : (
                            <View style={[styles.checkCircle, { borderColor: theme.border }]} />
                        )}
                        <View>
                            <Text style={[styles.questTitle, { color: theme.textMain }, isQuest1Done ? { textDecorationLine: 'line-through', color: '#94a3b8' } : null]}>
                                경쟁전 3회 승리
                            </Text>
                            <Text style={[styles.questSub, { color: theme.textSub }]}>{isQuest1Done ? 'Done' : '미션 진행 중'}</Text>
                        </View>
                    </View>
                    <Text style={{ color: isQuest1Done ? '#cbd5e1' : theme.textMain, fontWeight: '600', fontSize: 12 }}>+50 XP</Text>
                </TouchableOpacity>
                
                <View style={[styles.separator, { backgroundColor: theme.border }]} />
                
                <TouchableOpacity 
                    style={[styles.questItem, isQuest2Done ? { backgroundColor: theme.dark ? '#1e293b' : '#f8fafc' } : null]}
                    onPress={handleQuest2Press}
                >
                    <View style={styles.questLeft}>
                        {isQuest2Done ? (
                            <View style={styles.checkCircleDone}>
                                <Check size={14} color="#fff" strokeWidth={4} />
                            </View>
                        ) : (
                            <View style={[styles.checkCircle, { borderColor: theme.border }]} />
                        )}
                        <View>
                            <Text style={[styles.questTitle, { color: theme.textMain }, isQuest2Done ? { textDecorationLine: 'line-through', color: '#94a3b8' } : null]}>
                                승급전 5회 승리
                            </Text>
                            <Text style={[styles.questSub, { color: theme.textSub }]}>{isQuest2Done ? 'Done' : '2/5'}</Text>
                        </View>
                    </View>
                    {isQuest2Done ? (
                        <Text style={{ color: '#cbd5e1', fontWeight: '600', fontSize: 12 }}>+20 XP</Text>
                    ) : (
                        <View style={[styles.rewardBadge, { backgroundColor: theme.dark ? '#1e293b' : '#eff6ff' }]}>
                            <Sparkles size={12} color={theme.primary} style={{ marginRight: 4 }}/>
                            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12 }}>+20 XP</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>

        <View style={{ height: 120 }} /> 
      </ScrollView>

      <BottomNavigation activeTab="Home" onNavigate={onNavigate} />

      {/* === Help Modal === */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Pressable style={[styles.modalContent, { backgroundColor: theme.card }]} onPress={() => {}}> 
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.textMain }]}>Summon Guide</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <X size={24} color={theme.textSub} />
                    </TouchableOpacity>
                </View>
                <View style={styles.guideItem}>
                    <View style={[styles.guideIconBox, { backgroundColor: theme.dark ? '#1e3a8a' : '#E0F2FE' }]}><Gamepad2 size={24} color={theme.primary} /></View>
                    <View style={styles.guideTextBox}>
                        <Text style={[styles.guideTitle, { color: theme.textMain }]}>Invite (초대)</Text>
                        <Text style={[styles.guideDesc, { color: theme.textSub }]}>지금 당장 파트너에게 게임 접속을 요청합니다.</Text>
                    </View>
                </View>
                <View style={styles.guideItem}>
                    <View style={[styles.guideIconBox, { backgroundColor: theme.dark ? '#14532d' : '#F0FDF4' }]}><Zap size={24} color={theme.accent} /></View>
                    <View style={styles.guideTextBox}>
                        <Text style={[styles.guideTitle, { color: theme.textMain }]}>Request (예약)</Text>
                        <Text style={[styles.guideDesc, { color: theme.textSub }]}>나중에 함께 게임할 시간을 제안합니다.</Text>
                    </View>
                </View>
                 <View style={styles.guideItem}>
                    <View style={[styles.guideIconBox, { backgroundColor: theme.dark ? '#581c87' : '#F3E8FF' }]}><Target size={24} color="#9333EA" /></View>
                    <View style={styles.guideTextBox}>
                        <Text style={[styles.guideTitle, { color: theme.textMain }]}>Ping (콕 찌르기)</Text>
                        <Text style={[styles.guideDesc, { color: theme.textSub }]}>가볍게 파트너에게 알림을 보냅니다.</Text>
                    </View>
                </View>
            </Pressable>
        </Pressable>
      </Modal>

      {/* === Invite Modal === */}
<InviteModal
  visible={inviteVisible}
  onClose={() => setInviteVisible(false)}
  onSend={sendFCM}
  partnerName={partnerData?.name || 'Partner'}
  theme={theme}
  gradPurple={gradPurple}
/>

{/* === Request Modal === */}
<RequestModal
  visible={requestVisible}
  onClose={() => setRequestVisible(false)}
  onSend={sendFCM}
  partnerName={partnerData?.name || 'Partner'}
  theme={theme}
/>

{/* === Ping Modal === */}
<PingModal
  visible={pingVisible}
  onClose={() => setPingVisible(false)}
  onSend={sendFCM}
  partnerName={partnerData?.name || 'Partner'}
  theme={theme}
/>
<CustomAlert
  isVisible={alertVisible}
  title="🚧 준비 중"
  message={ERROR_MESSAGES.COMING_SOON}
  onConfirm={() => setAlertVisible(false)}
  onClose={() => setAlertVisible(false)}
/>
    </SafeAreaView>
  );
};
const InviteModal = ({ visible, onClose, onSend, partnerName, theme, gradPurple }) => {
  const [gameName, setGameName] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setConfirmVisible(false);
    setLoading(true);
    const ok = await onSend({ type: 'INVITE', gameName });
    setLoading(false);
    if (ok) { setGameName(''); onClose(); }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={summonStyles.overlay}>
          <View style={[summonStyles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[summonStyles.iconCircle, { backgroundColor: (gradPurple?.[0] || '#7C3AED') + '22' }]}>
              <Gamepad2 size={28} color={gradPurple?.[0] || '#7C3AED'} />
            </View>
            <Text style={[summonStyles.sheetTitle, { color: theme.textMain }]}>지금 같이 게임할래?</Text>
            <Text style={[summonStyles.sheetSub, { color: theme.textSub }]}>{partnerName}님에게 게임 초대를 보내요</Text>

            <Text style={[summonStyles.label, { color: theme.textSub }]}>게임 이름</Text>
            <TextInput
              style={[summonStyles.input, { color: theme.textMain, borderColor: theme.border, backgroundColor: theme.bg }]}
              placeholder="예: 리그 오브 레전드"
              placeholderTextColor={theme.textSub}
              value={gameName}
              onChangeText={setGameName}
            />

            <View style={summonStyles.btnRow}>
              <TouchableOpacity style={[summonStyles.cancelBtn, { borderColor: theme.border }]} onPress={onClose}>
                <Text style={[summonStyles.cancelText, { color: theme.textSub }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[summonStyles.sendBtn, { backgroundColor: gradPurple?.[0] || '#7C3AED' }, (!gameName.trim() || loading) && summonStyles.disabledBtn]}
                onPress={() => setConfirmVisible(true)}
                disabled={!gameName.trim() || loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={summonStyles.sendText}>초대 보내기</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <ConfirmDialog
        visible={confirmVisible}
        message={`${partnerName}님에게\n"${gameName}" 게임 초대를\n보내시겠습니까?`}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmVisible(false)}
        theme={theme}
        accentColor={gradPurple?.[0] || '#7C3AED'}
      />
    </>
  );
};

const RequestModal = ({ visible, onClose, onSend, partnerName, theme }) => {
  const [gameName, setGameName] = useState('');
  const [time, setTime] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setConfirmVisible(false);
    setLoading(true);
    const ok = await onSend({ type: 'REQUEST', gameName, time });
    setLoading(false);
    if (ok) { setGameName(''); setTime(''); onClose(); }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={summonStyles.overlay}>
          <View style={[summonStyles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[summonStyles.iconCircle, { backgroundColor: '#F59E0B22' }]}>
              <Zap size={28} color="#F59E0B" />
            </View>
            <Text style={[summonStyles.sheetTitle, { color: theme.textMain }]}>나중에 같이 게임할래?</Text>
            <Text style={[summonStyles.sheetSub, { color: theme.textSub }]}>{partnerName}님에게 게임 약속을 제안해요</Text>

            <Text style={[summonStyles.label, { color: theme.textSub }]}>게임 이름</Text>
            <TextInput
              style={[summonStyles.input, { color: theme.textMain, borderColor: theme.border, backgroundColor: theme.bg }]}
              placeholder="예: 발로란트"
              placeholderTextColor={theme.textSub}
              value={gameName}
              onChangeText={setGameName}
            />
            <Text style={[summonStyles.label, { color: theme.textSub }]}>제안 시간</Text>
            <TextInput
              style={[summonStyles.input, { color: theme.textMain, borderColor: theme.border, backgroundColor: theme.bg }]}
              placeholder="예: 오늘 밤 10시"
              placeholderTextColor={theme.textSub}
              value={time}
              onChangeText={setTime}
            />

            <View style={summonStyles.btnRow}>
              <TouchableOpacity style={[summonStyles.cancelBtn, { borderColor: theme.border }]} onPress={onClose}>
                <Text style={[summonStyles.cancelText, { color: theme.textSub }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[summonStyles.sendBtn, { backgroundColor: '#F59E0B' }, (!gameName.trim() || !time.trim() || loading) && summonStyles.disabledBtn]}
                onPress={() => setConfirmVisible(true)}
                disabled={!gameName.trim() || !time.trim() || loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={summonStyles.sendText}>제안 보내기</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <ConfirmDialog
        visible={confirmVisible}
        message={`${partnerName}님에게\n"${gameName}" ${time}\n게임 약속을 보내시겠습니까?`}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmVisible(false)}
        theme={theme}
        accentColor="#F59E0B"
      />
    </>
  );
};

const PingModal = ({ visible, onClose, onSend, partnerName, theme }) => {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setConfirmVisible(false);
    setLoading(true);
    const ok = await onSend({ type: 'PING' });
    setLoading(false);
    if (ok) onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={summonStyles.overlay}>
          <View style={[summonStyles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[summonStyles.iconCircle, { backgroundColor: '#3B82F622' }]}>
              <Target size={28} color="#3B82F6" />
            </View>
            <Text style={[summonStyles.sheetTitle, { color: theme.textMain }]}>콕 찌르기</Text>
            <Text style={[summonStyles.sheetSub, { color: theme.textSub }]}>{partnerName}님에게 가볍게 알림을 보내요</Text>

            <View style={[summonStyles.pingBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text style={[summonStyles.pingBoxText, { color: theme.textSub }]}>📳 상대방 폰이 한 번 울려요</Text>
            </View>

            <View style={summonStyles.btnRow}>
              <TouchableOpacity style={[summonStyles.cancelBtn, { borderColor: theme.border }]} onPress={onClose}>
                <Text style={[summonStyles.cancelText, { color: theme.textSub }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[summonStyles.sendBtn, { backgroundColor: '#3B82F6' }, loading && summonStyles.disabledBtn]}
                onPress={() => setConfirmVisible(true)}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={summonStyles.sendText}>Ping!</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ConfirmDialog
        visible={confirmVisible}
        message={`${partnerName}님에게\nPing을 보내시겠습니까?`}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmVisible(false)}
        theme={theme}
        accentColor="#3B82F6"
      />
    </>
  );
};

const ConfirmDialog = ({ visible, message, onConfirm, onCancel, theme, accentColor }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={summonStyles.confirmOverlay}>
      <View style={[summonStyles.confirmBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[summonStyles.confirmMsg, { color: theme.textMain }]}>{message}</Text>
        <View style={summonStyles.btnRow}>
          <TouchableOpacity style={[summonStyles.cancelBtn, { borderColor: theme.border }]} onPress={onCancel}>
            <Text style={[summonStyles.cancelText, { color: theme.textSub }]}>아니요</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[summonStyles.sendBtn, { backgroundColor: accentColor }]} onPress={onConfirm}>
            <Text style={summonStyles.sendText}>보내기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const summonStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 28, paddingBottom: 44 },
  iconCircle: { alignSelf: 'center', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  sheetSub: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 14 },
  pingBox: { borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 },
  pingBoxText: { fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  sendBtn: { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  sendText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabledBtn: { opacity: 0.4 },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  confirmBox: { width: '100%', borderRadius: 24, borderWidth: 1, padding: 28 },
  confirmMsg: { fontSize: 17, fontWeight: '700', textAlign: 'center', lineHeight: 28, marginBottom: 24 },
});

// 구조적인 스타일만 고정값으로 남겨두고 색상 결합도는 걷어냈습니다.
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 6 },
  levelText: { fontSize: 11, fontWeight: '800' },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 10, borderRadius: 14, borderWidth: 1 },
  notificationDot: { position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3 },
  profilesContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 35, height: 170 },
  profileCard: { flex: 1, height: '100%', borderRadius: 24, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 4 },
  cardInner: { flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 10, borderWidth: 1 },
  avatarContainer: { width: 70, height: 70, marginBottom: 10, position: 'relative' },
  avatarBorder: { width: '100%', height: '100%', borderRadius: 35, padding: 3, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: '100%', height: '100%', borderRadius: 50, borderWidth: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, borderWidth: 2, zIndex: 10 },
  cardName: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  linkWrapper: { width: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  linkLine: { width: 2, height: 20 },
  heartBox: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3, marginVertical: 4 },
  sectionContainer: { marginBottom: 30 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  helpBtn: { padding: 2 },
  skillRow: { flexDirection: 'row', gap: 12 },
  skillBtnWrapper: { flex: 1, height: 100, borderRadius: 20, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  skillBtn: { flex: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  skillIconOverlay: { marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2 },
  skillLabel: { color: '#fff', fontSize: 13, fontWeight: '700' },
  questHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  xpText: { fontSize: 12, fontWeight: '700' },
  questList: { borderRadius: 24, padding: 6, borderWidth: 1 },
  questItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 18 },
  questLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  checkCircleDone: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  questTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  questSub: { fontSize: 12 },
  rewardBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  separator: { height: 1, marginHorizontal: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.85, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  guideItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  guideIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  guideTextBox: { flex: 1 },
  guideTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  guideDesc: { fontSize: 13, lineHeight: 18 },
});

export default MainScreen;