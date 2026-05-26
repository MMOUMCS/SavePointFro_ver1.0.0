import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Bell,
  GripVertical,
  Plus,
  Settings,
  X
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { API_BASE_URL } from '../../settings';
import BottomNavigation from '../components/BottomNavigation';
import { useTheme } from '../components/ThemeContext';
import { DARK_THEME, LIGHT_THEME } from '../constants/theme.js';

const DEFAULT_GAME_LIST = [
  { id: 'lol',       label: '리그 오브 레전드', short: 'LoL',      hasKD: true  },
  { id: 'valorant',  label: '발로란트',          short: 'VAL',     hasKD: true  }, // 'VALORANT' -> 'VAL'
  { id: 'overwatch', label: '오버워치 2',        short: 'OV2',       hasKD: true }, // 'OVERWATCH' -> 'OV2'
  { id: 'ff14',      label: '파이널판타지 14',   short: 'FF14',    hasKD: false },
  { id: 'other',     label: '기타',               short: 'ETC',     hasKD: false },
];

const RESULT_OPTIONS = ['승리', '패배', '무승부', '기록 없음'];
// FF14 전용 UI 레이블 (API 통신은 기존 WIN/LOSE/DRAW/ETC 그대로 사용)
const FF14_RESULT_OPTIONS = ['진도 나감', '진도 못나감', '똑같음', '기록 없음'];
// FF14 UI 레이블 → 공통 한국어 결과값 매핑 (API payload 변환에 사용)
const MAP_FF14_TO_RESULT = {
  '진도 나감':    '승리',
  '진도 못나감':  '패배',
  '똑같음':      '무승부',
  '기록 없음':   '기록 없음',
};
// 공통 한국어 결과값 → FF14 UI 레이블 역매핑 (서버 데이터 표시에 사용)
const MAP_RESULT_TO_FF14 = {
  '승리':     '진도 나감',
  '패배':     '진도 못나감',
  '무승부':   '똑같음',
  '기록 없음': '기록 없음',
};
const MAP_RESULT_TO_ENG = { '승리': 'WIN', '패배': 'LOSE', '무승부': 'DRAW', '기록 없음': 'ETC' };
const MAP_RESULT_TO_KOR = { 'WIN': '승리', 'LOSE': '패배', 'DRAW': '무승부', 'ETC': '기록 없음' };

const formatDuration = (minutes) => {
  const m = parseInt(minutes, 10);
  if (isNaN(m) || m <= 0) return '0m';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ''}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const isThisWeek = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d)) return false;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return d >= startOfWeek;
};

// ── SVG 원형 게이지: 퍼센트에 맞춰 정확히 호(arc) 그리기 ──────────────
const CircleGauge = ({ percent, size = 110, strokeWidth = 5, trackColor, fillColor, bgColor, children }) => {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  // 12시(top)에서 시작하도록 -90도 회전 적용은 startAngle로 처리
  const clampedPct = Math.min(Math.max(percent, 0), 100);
  const dashOffset = circumference * (1 - clampedPct / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* 배경 트랙 */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 진행 호 — 12시 방향에서 시작 (rotation: -90) */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      {/* 가운데 컨텐츠 */}
      <View style={{ width: size - strokeWidth * 4, height: size - strokeWidth * 4, borderRadius: (size - strokeWidth * 4) / 2, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
};

const BattleDateScreen = ({ onNavigate }) => {
  const [sessions, setSessions] = useState([]);

  const [gameList, setGameList] = useState(DEFAULT_GAME_LIST);
  
  // 백엔드 데이터 불러오기 함수 (GET)
  // 백엔드 데이터 불러오기 함수 (GET - 5분 캐싱 최적화 적용)
  const loadBattleData = async (forceRefresh = false) => {
    try {
      const savedUser = await AsyncStorage.getItem('userData');
      const token = savedUser ? JSON.parse(savedUser)?.accessToken : null;

      // [수정] 렌더링 시점의 실제 최신 filterGame을 기준으로 판별하기 위해, 
      // 아래와 같이 확실하게 상단에서 매핑 정의를 이용해 gameParam을 구합니다.
      const MAP_GAME_TO_ENUM = {
        lol: 'LOL',
        valorant: 'VALORANT',
        overwatch: 'OVERWATCH',
        ff14: 'FF14',
        other: 'ETC',
      };

      // 만약 외부(save 함수 등)에서 강제로 특정 필터 데이터를 불러오라고 지정했다면 
      // state 의존도를 낮추기 위해 변수를 유연하게 쓰거나 'all'로 초기화하여 fetch 합니다.
      const currentFilter = forceRefresh ? 'all' : filterGame;

      const gameParam = currentFilter === 'all' ? '전체' : (MAP_GAME_TO_ENUM[currentFilter] || 'ETC');
      const cacheKey = `battle_data_${currentFilter}`;
      const cacheTimeKey = `battle_data_time_${currentFilter}`;

      // 강제 새로고침이 아닐 때만 로컬 캐시를 읽음
      if (!forceRefresh) {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        const cachedTime = await AsyncStorage.getItem(cacheTimeKey);
        
        if (cachedData && cachedTime) {
          const isExpired = Date.now() - parseInt(cachedTime, 10) > 5 * 60 * 1000;
          if (!isExpired) {
            setSessions(JSON.parse(cachedData));
            return; 
          }
        }
      }

      // 서버 요청 발송
      const response = await fetch(`${API_BASE_URL}/api/battle?gameName=${gameParam}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        const MAP_ENUM_TO_GAME_ID = {
          'LOL': 'lol',
          'VALORANT': 'valorant',
          'OVERWATCH': 'overwatch',
          'FF14': 'ff14',
          'ETC': 'other',
        };

        const mappedData = data.map(b => ({
          id: String(b.id),
          gameId: MAP_ENUM_TO_GAME_ID[b.gameName] || 'other', 
          result: MAP_RESULT_TO_KOR[b.result] || '기록 없음', 
          date: b.playDate,
          durationMin: b.playTime,
          customRecord: { kills: b.kills, deaths: b.deaths },
          memo: b.memo
        }));

        await AsyncStorage.setItem(cacheKey, JSON.stringify(mappedData));
        await AsyncStorage.setItem(cacheTimeKey, String(Date.now()));

        setSessions(mappedData);
      }

    } catch (e) {
      console.error("데이터 불러오기 에러:", e);
    }
  };

  // 필터가 바뀌거나 모달이 닫힐 때(=추가/수정 후) 자동으로 갱신
  useEffect(() => {
  if (!modalVisible) {
    loadBattleData(); 
  }
}, [filterGame, modalVisible]);
  const { theme } = useTheme();
  const isDark = theme?.mode === 'dark'; 
  const currentTheme = isDark ? DARK_THEME : LIGHT_THEME;

  const [modalVisible, setModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const emptyForm = {
    gameId: 'lol',
    result: '승리',
    date: new Date().toISOString().slice(0, 10),
    durationMin: '',
    kills: '',
    deaths: '',
    memo: '',
  };
  const [form, setForm] = useState(emptyForm);

  const [activeTab, setActiveTab] = useState('history'); 
  const [filterGame, setFilterGame] = useState('all');

  const { bg, card, border, textMain, textSub, primary, white, divider, textMuted, warning, success, danger, accent } = currentTheme;
  
  const getResultColors = (r) => {
    if (r === '승리' || r === '진도 나감') return { eng: 'WIN', main: success, light: currentTheme.successLight };
    if (r === '패배' || r === '진도 못나감') return { eng: 'LOSE', main: danger, light: currentTheme.dangerLight };
    if (r === '무승부' || r === '똑같음') return { eng: 'DRAW', main: accent, light: isDark ? '#2a261f' : '#fcf8f2' };
    return { eng: 'ETC', main: textSub, light: isDark ? '#222222' : '#f1f5f9' };
  };

  // ── 데이터 연산 ────────────────────────────────────────────────────
  const filtered = filterGame === 'all' ? sessions : sessions.filter((s) => s.gameId === filterGame);
  
  // [규칙 1] draw는 승률/연패 계산에서 완전 제외 — 승리/패배만 카운트
  const wins       = filtered.filter((s) => s.result === '승리').length;
  const losses     = filtered.filter((s) => s.result === '패배').length;
  const decidedGames = wins + losses; // 무승부·기록없음 제외한 실질 경기 수
  
  const totalGames = filtered.length;
  const winRate    = decidedGames > 0 ? Math.round((wins / decidedGames) * 100) : 0;
  const totalMin   = filtered.reduce((a, s) => a + (parseInt(s.durationMin, 10) || 0), 0);
  const totalKills  = filtered.reduce((a, s) => a + (parseInt(s.customRecord?.kills,  10) || 0), 0);
  const totalDeaths = filtered.reduce((a, s) => a + (parseInt(s.customRecord?.deaths, 10) || 0), 0);
  // kills, deaths 둘 다 0이면 데이터 없음(-), deaths만 0이면 퍼펙트(∞)
  const kd = (totalKills === 0 && totalDeaths === 0)
    ? '-'
    : totalDeaths > 0
      ? (totalKills / totalDeaths).toFixed(2)
      : '∞';

  let streak = 0;
  for (const s of [...sessions]) {
    if (s.result === '승리') streak++;
    else if (s.result === '무승부' || s.result === '기록 없음') continue; // draw/기록없음은 연승 영향 없음
    else break; // 패배만 연승 끊기
  }

  const weekSessions = sessions.filter((s) => isThisWeek(s.date));
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayMap = [0, 0, 0, 0, 0, 0, 0];
  weekSessions.forEach((s) => {
    const d = new Date(s.date);
    if (!isNaN(d)) {
      const day = (d.getDay() + 6) % 7; 
      dayMap[day]++;
    }
  });
  const maxDay = Math.max(...dayMap, 1);

  const currentGameInfo = gameList.find((g) => g.id === form.gameId);
  // FF14 여부에 따라 결과 옵션 동적 분기
  const isFF14Form = form.gameId === 'ff14';
  const activeResultOptions = isFF14Form ? FF14_RESULT_OPTIONS : RESULT_OPTIONS;

  const openNew = () => { setEditTarget(null); setForm(emptyForm); setModalVisible(true); };

  const openEdit = (s) => {
    setEditTarget(s.id);
    const isFF14Session = s.gameId === 'ff14';
    setForm({
      gameId: s.gameId,
      // FF14이면 서버값(승리/패배 등)을 FF14 UI 레이블로 변환해서 폼에 넣기
      result: isFF14Session ? (MAP_RESULT_TO_FF14[s.result] || '기록 없음') : s.result,
      date: s.date,
      durationMin: String(s.durationMin),
      kills: String(s.customRecord?.kills ?? ''),
      deaths: String(s.customRecord?.deaths ?? ''),
      memo: s.memo || '',
    });
    setModalVisible(true);
  };

  // 백엔드로 전적 저장/등록 요청 (POST)
// 백엔드로 전적 저장/등록 요청 (POST/PUT)
  const save = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('userData');
      const token = savedUser ? JSON.parse(savedUser)?.accessToken : null;
      const MAP_GAME_TO_ENUM = {
        'lol': 'LOL',
        'valorant': 'VALORANT',
        'overwatch': 'OVERWATCH',
        'ff14': 'FF14',
        'other': 'ETC'
      };

      const rawGameEnum = MAP_GAME_TO_ENUM[form.gameId] || 'ETC';

      const isFF14 = form.gameId === 'ff14';
      const korResult = isFF14 ? (MAP_FF14_TO_RESULT[form.result] || form.result) : form.result;
      const engResult = MAP_RESULT_TO_ENG[korResult] || 'ETC';

      const payload = {
        gameName: rawGameEnum,   
        result: engResult, // 변환된 영어 코드가 들어갑니다. (WIN / LOSE / DRAW / ETC)
        playDate: form.date,
        playTime: parseInt(form.durationMin, 10) || 0,
        kills: currentGameInfo?.hasKD ? parseInt(form.kills, 10) || 0 : 0,
        deaths: currentGameInfo?.hasKD ? parseInt(form.deaths, 10) || 0 : 0,
        memo: form.memo,
      };



      // 수정모드(editTarget 존재)면 PUT /api/battle/{id}, 신규면 POST /api/battle
      const url = editTarget 
        ? `${API_BASE_URL}/api/battle/${editTarget}` 
        : `${API_BASE_URL}/api/battle`;
        
      const method = editTarget ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

if (response.ok) {
  const msg = editTarget ? '수정되었습니다' : '기록되었습니다';
  Alert.alert('성공', `배틀 전적이 성공적으로 ${msg}`, [
    {
      text: '확인',
      onPress: async () => {
        setModalVisible(false);
        
        await AsyncStorage.removeItem(`battle_data_${filterGame}`);
        await AsyncStorage.removeItem(`battle_data_time_${filterGame}`);
        await AsyncStorage.removeItem('battle_data_all');
        await AsyncStorage.removeItem('battle_data_time_all');

        setFilterGame('all');

        loadBattleData(true);
      }
    }
  ]);
} else {
        // 서버에서 에러가 나면 어떤 응답이 오는지 디버깅용 로그
        const errText = await response.text();
        console.log("서버 응답 에러 원문:", errText);
        Alert.alert('오류', '전적 저장에 실패했습니다.');
      }
    } catch (e) {
      console.error("저장 통신 에러:", e);
    }
  };

  const del = async (id) => {
    Alert.alert('삭제', '기록을 완전히 삭제하시겠습니까?', [
      { text: '취소' },
      { 
        text: '삭제', 
        style: 'destructive', 
        onPress: async () => { 
          try {
            // AsyncStorage에서 토큰 가져오기 (인증이 걸려있는 경우 대비)
            const savedUser = await AsyncStorage.getItem('userData');
            const token = savedUser ? JSON.parse(savedUser)?.accessToken : null;

            // 백엔드 Delete API로 해당 데이터 ID를 실어서 전송
            const response = await fetch(`${API_BASE_URL}/api/battle/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              Alert.alert('성공', '전적이 정상적으로 삭제되었습니다.');
              setModalVisible(false); // 모달 닫기
              loadBattleData(true);
            } else {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          } catch (e) {
            console.error("전적 삭제 통신 에러:", e);
          }
        } 
      },
    ]);
  };

  const moveGameOrder = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= gameList.length) return;
    const next = [...gameList];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setGameList(next);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* 상단 힙한 유틸 헤더 */}
        <View style={s.header}>
          <Text style={[s.headerLogoText, { color: textMain }]}>BATTLE DATA</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={() => onNavigate?.('Notifications')} hitSlop={8}>
              <Bell size={20} color={textMain} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate?.('Settings')} hitSlop={8}>
              <Settings size={20} color={textMain} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

  {/* 왼쪽: 승률을 시각화한 원형 프로그레스 링 */}
<View style={s.circleDashboardSection}>
  <CircleGauge
    percent={winRate}
    size={110}
    strokeWidth={6}
    trackColor={divider}
    fillColor="#5856D6"
    bgColor={bg}
  >
    <Text style={[s.circleLabel, { color: textMuted }]}>최근 승률</Text>
    <Text style={[s.circleNumber, { color: textMain }]}>{winRate}%</Text>
  </CircleGauge>

  {/* 오른쪽 스탯 영역 - 전체 테마 변수 연동 */}
  <View style={s.circleStatsBlock}>
    <View style={[s.inlineStatRow, { borderBottomColor: divider }]}>
      <Text style={[s.inlineStatLabel, { color: textMuted }]}>킬 / 데스</Text>
      <Text style={[s.inlineStatValue, { color: textMain }]}>{kd}</Text>
    </View>
    <View style={[s.inlineStatRow, { borderBottomColor: divider }]}>
      <Text style={[s.inlineStatLabel, { color: textMuted }]}>연승</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={[s.inlineStatValue, { color: streak > 0 ? '#FF9500' : textMain }]}>{streak}</Text>
        {streak > 0 && <Text style={{ fontSize: 12 }}>🔥</Text>}
      </View>
    </View>
    <View style={[s.inlineStatRow, { borderBottomWidth: 0 }]}>
      <Text style={[s.inlineStatLabel, { color: textMuted }]}>플레이 시간</Text>
      <Text style={[s.inlineStatValue, { color: textMain }]}>{formatDuration(totalMin)}</Text>
    </View>
  </View>
</View>

        {/* 비대칭 네비게이션 탭바 */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <View style={s.trendyTabBar}>
            {[
              { key: 'history', label: '최근 경기' },
              { key: 'week',    label: '주간 통계' },
              { key: 'stats',   label: '게임 통계' },
            ].map((t) => {
              const isAct = activeTab === t.key;
              return (
                <TouchableOpacity key={t.key} style={s.trendyTabItem} onPress={() => setActiveTab(t.key)}>
                  <Text style={[s.trendyTabLabel, { color: isAct ? textMain : textMuted }]}>
                    {t.label}
                  </Text>
                  {isAct && <View style={[s.trendyActiveBar, { backgroundColor: primary }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* MATCHES TAB */}
        {activeTab === 'history' && (
          <View style={{ paddingHorizontal: 24 }}>
            
            {/* 필터 칩 영역 + 플로팅이 아닌 미니멀 액션 링크 버튼 */}
            <View style={s.actionRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[{ id: 'all', short: 'ALL' }, ...gameList].map((g) => {
                  const isSel = filterGame === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[s.asymChip, isSel && { backgroundColor: textMain }]}
                      onPress={() => setFilterGame(g.id)}
                    >
                      <Text style={[s.asymChipText, { color: isSel ? white : textSub }]}>{g.short}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              <TouchableOpacity style={[s.hitBtn, { backgroundColor: primary }]} onPress={openNew} activeOpacity={0.8}>
                <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {filtered.length === 0 ? (
              <View style={s.emptyContainer}>
                <Text style={{ color: textMuted, fontSize: 13, fontWeight: '500' }}>아직 데이터가 없습니다.</Text>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                {filtered.map((session) => {
                  const gi = gameList.find((g) => g.id === session.gameId);
                  const isFF14Session = session.gameId === 'ff14';
                  // FF14이면 포스터에 표시할 레이블을 FF14 전용으로 변환
                  const displayResult = isFF14Session
                    ? (MAP_RESULT_TO_FF14[session.result] || '기록 없음')
                    : session.result;
                  const c = getResultColors(displayResult);
                  // FF14 포스터 약자 (긴 텍스트 대신 짧게)
                  const posterLabel = isFF14Session
                    ? ({ '진도 나감': 'PROG', '진도 못나감': 'FAIL', '똑같음': 'SAME', '기록 없음': 'ETC' }[displayResult] || 'ETC')
                    : c.eng;
                  return (
                    <TouchableOpacity key={session.id} style={s.magazineCard} onPress={() => openEdit(session)} activeOpacity={0.85}>
                      <View style={[s.posterSide, { backgroundColor: c.light }]}>
                        <Text style={[s.posterText, { color: c.main }]}>{posterLabel}</Text>
                      </View>

                      <View style={s.contentSide}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View>
                            <Text style={[s.gameLabel, { color: textMain }]}>{gi?.label}</Text>
                            <View style={s.metaDataRow}>
                              <Text style={[s.metaLabelText, { color: textMuted }]}>{formatDate(session.date)}</Text>
                              <Text style={{ color: divider }}>|</Text>
                              <Text style={[s.metaLabelText, { color: textMuted }]}>{formatDuration(session.durationMin)}</Text>
                            </View>
                          </View>
                          
                          {/* kills, deaths 둘 다 0이면 표시 안 함 */}
                          {gi?.hasKD && (parseInt(session.customRecord?.kills, 10) > 0 || parseInt(session.customRecord?.deaths, 10) > 0) && (
                            <Text style={[s.kdTypography, { color: textMain }]}>
                              {session.customRecord.kills}/{session.customRecord.deaths}
                            </Text>
                          )}
                        </View>

                        {/* 한줄 평도 폰트를 세련되게 */}
                        {!!session.memo && (
                          <Text style={[s.cleanMemo, { color: textSub, borderLeftColor: primary }]} numberOfLines={1}>
                            {session.memo}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/*  ANALYTICS TAB */}
        {activeTab === 'week' && (
          <View style={{ paddingHorizontal: 24, gap: 28 }}>
            <View style={s.analyticsDataBlock}>
              <Text style={[s.blockTitle, { color: textMuted }]}>주간 리포트</Text>
              <View style={s.analyticsRow}>
                <View>
                  <Text style={[s.bigHeadlineNum, { color: textMain }]}>{weekSessions.length}</Text>
                  <Text style={{ fontSize: 11, color: textSub, fontWeight: '600' }}>총 플레이 수</Text>
                </View>
                <View>
                  <Text style={[s.bigHeadlineNum, { color: primary }]}>
                    {formatDuration(weekSessions.reduce((a,s)=>a+(s.durationMin||0),0))}
                  </Text>
                  <Text style={{ fontSize: 11, color: textSub, fontWeight: '600' }}>총 플레이 시간</Text>
                </View>
              </View>
            </View>

            {/* 스트리트 브랜드 앱 스타일의 솔리드 막대 그래프 */}
            <View>
              <Text style={[s.blockTitle, { color: textMuted, marginBottom: 16 }]}>활동 그래프</Text>
              <View style={s.solidChartGrid}>
                {dayLabels.map((label, i) => {
                  const count = dayMap[i];
                  const barH = count > 0 ? Math.max(6, (count / maxDay) * 60) : 2;
                  const isToday = ((new Date().getDay() + 6) % 7) === i;
                  return (
                    <View key={i} style={s.solidChartColumn}>
                      <View style={s.solidBarWrapper}>
                        <View style={[s.solidBar, { height: barH, backgroundColor: count > 0 ? textMain : divider }]} />
                      </View>
                      <Text style={[s.solidChartLabel, { color: isToday ? primary : textMuted, fontWeight: isToday ? '700' : '500' }]}>
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* GAMES TAB */}
        {activeTab === 'stats' && (
          <View style={{ paddingHorizontal: 24, gap: 16 }}>
            {/* 데이터가 있을 때만 정렬 기준 버튼 보여주기 */}
            {gameList.filter((g) => sessions.some((s) => s.gameId === g.id)).length > 0 && (
              <TouchableOpacity style={s.minimalLinkRow} onPress={() => setOrderModalVisible(true)}>
                <GripVertical size={12} color={textMuted} />
                <Text style={{ color: textMuted, fontSize: 12, fontWeight: '600' }}>정렬 기준</Text>
              </TouchableOpacity>
            )}

            {/* 예외 처리 추가: 플레이한 게임 데이터가 아예 없을 때 */}
            {gameList.filter((g) => sessions.some((s) => s.gameId === g.id)).length === 0 ? (
              <View style={s.emptyContainer}>
                <Text style={{ color: textMuted, fontSize: 13, fontWeight: '500' }}>아직 데이터가 없습니다.</Text>
              </View>
            ) : (
              // 기존에 있던 게임 카드 리스트 출력 로직
              gameList.filter((g) => sessions.some((s) => s.gameId === g.id)).map((game) => {
                const gs = sessions.filter((s) => s.gameId === game.id);
                
                // ── [세부 연산 데이터 쪼개기] ──────────────────────────────────
                const gT = gs.length; // 전체 경기 수 (or 전체 트라이 수)
                const gW = gs.filter((s) => s.result === '승리').length; // 순수 승리 (or 진도 나감)
                const gD = gs.filter((s) => s.result === '무승부').length; // 순수 무승부
                const pureLoss = gs.filter((s) => s.result === '패배').length; // 순수 패배 (or 진도 못나감)
                
                // [수정 핵심] 무승부(DRAW)를 분모에서 완전히 제외하는 수식!
                // 순수하게 '승리(진도나감) + 패배(진도못나감)' 판수만 더해서 분모로 씁니다.
                const pureTotal = gW + pureLoss;
                const gWR = pureTotal > 0 ? Math.round((gW / pureTotal) * 100) : 0;
                
                const isFF14 = game.id === 'ff14';
                
                // ── [텍스트 포맷팅 분기] ─────────────────────────────────────
                let textProgress = '';
                if (isFF14) {
                  textProgress = gD > 0 
                    ? `${gT} 트라이 · ${gW}진도 ${pureLoss}실패 ${gD}유지`
                    : `${gT} 트라이 · ${gW}진도 ${pureLoss}실패`;
                } else {
                  textProgress = gD > 0
                    ? `${gT} 경기 · ${gW}승 ${pureLoss}패 ${gD}무`
                    : `${gT} 경기 · ${gW}승 ${pureLoss}패`;
                }

                return (
                  <View key={game.id} style={[s.asymGameCard, { borderBottomColor: divider }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <View>
                        <Text style={[s.asymGameTitle, { color: textMain }]}>{game.label}</Text>
                        <Text style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{textProgress}</Text>
                      </View>
                      
                      <View style={{ alignItems: 'flex-end' }}>
                        {/* {isFF14 && (
                          <Text style={{ fontSize: 9, color: textMuted, marginBottom: 2, fontWeight: '700', letterSpacing: 0.5 }}>
                            PROGRESS
                          </Text>
                        )} */}
                        <Text style={[s.asymGameRate, { color: primary }]}>{gWR}%</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

      </ScrollView>

      {/* ─── 입력 폼 모달 (심플 레이아웃 스무스 슬라이드) ────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[s.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <View style={[s.sheet, { backgroundColor: card }]}>
            <View style={s.sheetHeader}>
              <Text style={[s.sheetTitle, { color: textMain }]}>{editTarget ? '편집' : '전적 추가'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X size={20} color={textMain} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[s.inputLabel, { color: textMuted }]}>게임</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 6 }}>
                {gameList.map((g) => {
                  const isSel = form.gameId === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[s.sheetChip, { backgroundColor: isSel ? textMain : isDark ? '#222' : '#f1f5f9' }]}
                      // 게임 변경 시 결과값도 해당 게임 첫 번째 옵션으로 초기화
                      onPress={() => setForm((f) => ({
                        ...f,
                        gameId: g.id,
                        result: g.id === 'ff14' ? FF14_RESULT_OPTIONS[0] : RESULT_OPTIONS[0],
                      }))}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isSel ? white : textSub }}>{g.short}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[s.inputLabel, { color: textMuted }]}>결과</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
                {/* FF14 여부에 따라 결과 옵션 동적 분기 */}
                {activeResultOptions.map((r) => {
                  const isSel = form.result === r;
                  const c = getResultColors(r);
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[s.sheetResultChip, { backgroundColor: isSel ? c.light : isDark ? '#1a1a1a' : '#f8fafc', borderBottomWidth: isSel ? 2 : 0, borderBottomColor: c.main }]}
                      onPress={() => setForm((f) => ({ ...f, result: r }))}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isSel ? c.main : textSub }}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[s.inputLabel, { color: textMuted }]}>날짜</Text>
              <TextInput
                style={[s.sheetInput, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', color: textMain }]}
                value={form.date}
                onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
              />

              <Text style={[s.inputLabel, { color: textMuted }]}>경기 시간 (MIN)</Text>
              <TextInput
                style={[s.sheetInput, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', color: textMain }]}
                value={form.durationMin}
                onChangeText={(v) => setForm((f) => ({ ...f, durationMin: v }))}
                keyboardType="numeric"
              />

              {currentGameInfo?.hasKD && (
                <>
                  <Text style={[s.inputLabel, { color: textMuted }]}>킬 / 데스</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                    <TextInput
                      style={[s.sheetInput, { flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', color: textMain }]}
                      value={form.kills}
                      onChangeText={(v) => setForm((f) => ({ ...f, kills: v }))}
                      keyboardType="numeric"
                      placeholder="K"
                    />
                    <TextInput
                      style={[s.sheetInput, { flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', color: textMain }]}
                      value={form.deaths}
                      onChangeText={(v) => setForm((f) => ({ ...f, deaths: v }))}
                      keyboardType="numeric"
                      placeholder="D"
                    />
                  </View>
                </>
              )}

              <Text style={[s.inputLabel, { color: textMuted }]}>메모</Text>
              <TextInput
                style={[s.sheetInput, { height: 60, paddingTop: 10, backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', color: textMain }]}
                value={form.memo}
                onChangeText={(v) => setForm((f) => ({ ...f, memo: v }))}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {editTarget && (
                  <TouchableOpacity style={[s.sheetBtn, { backgroundColor: currentTheme.dangerLight }]} onPress={() => del(editTarget)}>
                    <Text style={{ color: danger, fontWeight: '700' }}>삭제</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[s.sheetBtn, { flex: 1, backgroundColor: textMain }]} onPress={save}>
                  <Text style={{ color: white, fontWeight: '700' }}>저장</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 순서 정렬 팝업 모달 */}
      <Modal visible={orderModalVisible} animationType="fade" transparent>
        <View style={[s.overlay, { justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[s.popup, { backgroundColor: card }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textMain, letterSpacing: 0.5 }}>정렬</Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}><X size={18} color={textMain} /></TouchableOpacity>
            </View>
            <ScrollView>
              {gameList.map((g, idx) => (
                <View key={g.id} style={[s.popupRow, { borderBottomColor: divider }]}>
                  <Text style={{ color: textMain, fontWeight: '600', fontSize: 13 }}>{g.short}</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity style={[s.arrow, { backgroundColor: bg }]} disabled={idx === 0} onPress={() => moveGameOrder(idx, 'up')}>
                      <Text style={{ color: idx === 0 ? textMuted : primary, fontSize: 9 }}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.arrow, { backgroundColor: bg }]} disabled={idx === gameList.length - 1} onPress={() => moveGameOrder(idx, 'down')}>
                      <Text style={{ color: idx === gameList.length - 1 ? textMuted : primary, fontSize: 9 }}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNavigation activeScreen="BattleDate" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

// ─── 힙스터 매거진 스타일 명세 ──────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerLogoText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  heroTypographySection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroLeftBlock: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  heroBigNumber: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 56,
  },
  heroRightBlock: {
    gap: 6,
    alignItems: 'flex-end',
  },
  miniStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  miniStatLine: {
    width: 30,
    height: 1,
    opacity: 0.5,
  },
  trendyTabBar: {
    flexDirection: 'row',
    gap: 24,
  },
  trendyTabItem: {
    paddingBottom: 4,
  },
  trendyTabLabel: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  trendyActiveBar: {
    height: 3,
    marginTop: 4,
    borderRadius: 2,
    width: '60%',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  asymChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  asymChipText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hitBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  magazineCard: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0,
  },
  posterSide: {
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  posterText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    transform: [{ rotate: '-90deg' }, { scale: 1.1 }],
  },
  contentSide: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  gameLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metaDataRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 2,
  },
  metaLabelText: {
    fontSize: 11,
    fontWeight: '500',
  },
  kdTypography: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cleanMemo: {
    fontSize: 12,
    marginTop: 10,
    paddingLeft: 8,
    borderLeftWidth: 2,
    fontStyle: 'italic',
  },
  analyticsDataBlock: {
    gap: 8,
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 4,
  },
  bigHeadlineNum: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  solidChartGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    paddingTop: 10,
  },
  solidChartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  solidBarWrapper: {
    height: 60,
    justifyContent: 'flex-end',
    width: 6,
  },
  solidBar: {
    width: '100%',
    borderRadius: 2,
  },
  solidChartLabel: {
    fontSize: 11,
    marginTop: 8,
  },
  minimalLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  asymGameCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  asymGameTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  asymGameRate: {
    fontSize: 22,
    fontWeight: '900',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sheetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  sheetResultChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 4,
  },
  sheetInput: {
    height: 40,
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 16,
  },
  sheetBtn: {
    height: 44,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  popup: {
    width: '75%',
    borderRadius: 12,
    padding: 20,
    alignSelf: 'center',
  },
  popupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  arrow: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDashboardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 28,
  },
  circleLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  circleNumber: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  circleStatsBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  inlineStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  inlineStatLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inlineStatValue: {
    fontSize: 14,
    fontWeight: '800',
  },
});

export default BattleDateScreen;