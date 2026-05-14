import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// UI strings for both languages
const resources = {
  en: {
    translation: {
      // App title
      appTitle: 'Arcana Veil',
      appSubtitle: '秘境塔罗',

      // Auth Stage
      authTitle: 'Unveil the Tapestry of Fate',
      authSubtitle: 'Awaken spiritual perception to begin your journey',
      authSubtitleMouse: 'Enter the veil and uncover your fate',
      authButton: 'Begin Journey',

      // Intention Stage
      intentionTitle: 'What area would you like to inquire about?',
      intentionLove: 'Love & Relationships',
      intentionCareer: 'Career & Wealth',
      intentionStudy: 'Study & Growth',
      intentionSocial: 'Social & Family',
      intentionGeneral: 'General Guidance',
      authPermissionRequest: 'Requesting permission...',
      authPermissionDenied: 'Camera access denied. Please enable it in your browser settings.',

      // Shuffle Stage
      shuffleTitle: '命运之轮转动',
      shuffleInstruction: 'Point your index finger to awaken the cards',
      shuffleStopHint: 'Hover your finger to stop the shuffle',
      shuffleButton: 'Shuffle the Cards',
      shuffleInProgress: 'In the chaos, the threads of fate are realigning...',
      shuffleKeepGoing: 'Keep circling to channel energy...',
      shuffleCanStop: 'Hold your finger still to stop',
      shuffleComplete: 'The arrangement is complete...',

      // Draw Stage
      drawTitle: 'Choose Your Fate',
      drawInstruction: 'Hold your finger over a card to select it',
      drawInstructionMouse: 'Click a card to select it',
      drawSlot: 'Slot {{number}}',
      drawCardSelected: 'Card selected',
      edgeSwipeHint: 'Swipe down to close',
      drawProgress: '{{count}} / 3 cards chosen',

      // Reveal Stage
      revealTitle: 'Your Fate Revealed',
      revealPast: 'Past',
      revealPresent: 'Present',
      revealFuture: 'Future',
      revealLoading: 'The spirits are writing...',

      // Actions
      restart: 'Reshape Fate',
      export: 'Capture Stars',
      exporting: 'Capturing...',

      // Status
      statusTracking: 'Hand Tracking',
      statusConnected: 'Connected',
      statusDisconnected: 'Disconnected',
      statusDetecting: 'Detecting hand...',
      statusHandDetected: 'Hand detected',
      statusLost: 'Tracking lost',

      // Errors
      errorCamera: 'Camera Error',
      errorTracking: 'Tracking Error',
      errorGeneric: 'Something went wrong...',

      // Gestures
      gesturePointing: 'Point your finger',
      gestureCircle: 'Draw a circle',
      gestureCircleHint: 'Draw circle to shuffle',
      gestureStationaryHint: 'Hold still to stop',
      gestureSelecting: 'Selecting...',

      // Card positions
      positionPast: 'Past',
      positionPresent: 'Present',
      positionFuture: 'Future',

      // Orientation
      upright: 'Upright',
      reversed: 'Reversed',

      // Interaction modes
      modeMouse: 'Click/Tap',
      modeGesture: 'Gesture',
    }
  },
  zh: {
    translation: {
      // App title
      appTitle: '秘境塔罗',
      appSubtitle: 'Arcana Veil',

      // Auth Stage
      authTitle: '揭开命运帷幕',
      authSubtitle: '唤醒灵界感知，开启命运之旅',
      authSubtitleMouse: '步入帷幕，探寻命运',
      authButton: '开始旅程',

      // Intention Stage
      intentionTitle: '您想询问的领域是？',
      intentionLove: '爱情与缘分',
      intentionCareer: '事业与财富',
      intentionStudy: '学业与成长',
      intentionSocial: '人际与亲情',
      intentionGeneral: '整体运势',
      authPermissionRequest: '正在请求权限...',
      authPermissionDenied: '摄像头访问被拒绝，请在浏览器设置中启用。',

      // Shuffle Stage
      shuffleTitle: '命运之轮转动',
      shuffleInstruction: '伸出食指，画圈唤醒卡牌',
      shuffleStopHint: '手指悬停，结束洗牌',
      shuffleButton: '洗牌',
      shuffleInProgress: '混沌之中，命运的轨迹正在重组...',
      shuffleKeepGoing: '继续画圈，注入灵力...',
      shuffleCanStop: '手指静止即可停止',
      shuffleComplete: '排列已就绪...',

      // Draw Stage
      drawTitle: '选择你的命运',
      drawInstruction: '手指悬停在卡牌上即可选择',
      drawInstructionMouse: '点击卡牌即可选择',
      drawSlot: '第 {{number}} 张',
      drawCardSelected: '已选择',
      edgeSwipeHint: '向下滑动，收起牌面',
      drawProgress: '已选 {{count}} / 3 张牌',

      // Reveal Stage
      revealTitle: '命运揭示',
      revealPast: '过去',
      revealPresent: '现在',
      revealFuture: '未来',
      revealLoading: '灵体正在书写...',

      // Actions
      restart: '重塑命运',
      export: '凝结星轨',
      exporting: '凝结中...',

      // Status
      statusTracking: '手势追踪',
      statusConnected: '已连接',
      statusDisconnected: '未连接',
      statusDetecting: '检测手中...',
      statusHandDetected: '检测到手',
      statusLost: '追踪丢失',

      // Errors
      errorCamera: '摄像头错误',
      errorTracking: '追踪错误',
      errorGeneric: '出现了一些问题...',

      // Gestures
      gesturePointing: '伸出食指',
      gestureCircle: '画圈洗牌',
      gestureCircleHint: '画圈洗牌',
      gestureStationaryHint: '悬停停止',
      gestureSelecting: '选择中...',

      // Card positions
      positionPast: '过去',
      positionPresent: '现在',
      positionFuture: '未来',

      // Orientation
      upright: '正位',
      reversed: '逆位',

      // Interaction modes
      modeMouse: '点击',
      modeGesture: '手势',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
