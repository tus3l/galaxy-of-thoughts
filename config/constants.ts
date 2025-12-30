import type { AppConfig, StarColors } from '@/types';

// ==================== Application Configuration ====================

export const APP_CONFIG: AppConfig = {
  maxStars: 10000,
  galaxyRadius: 150,
  autoRotateSpeed: 0.3,
  cameraTransitionDuration: 2.5,
  bloomIntensity: 1.5,
  postProcessingEnabled: true,
};

// ==================== Star Color Palette ====================

export const STAR_COLORS: StarColors = {
  dream: '#3b82f6',    // Blue - Dreams and aspirations
  secret: '#ef4444',   // Red - Secrets and confessions
  advice: '#fbbf24',   // Gold - Advice and wisdom
  wish: '#a855f7',     // Purple - Wishes and desires
  love: '#ec4899',     // Pink - Love and affection
  hope: '#10b981',     // Green - Hope and optimism
  thought: '#06b6d4',  // Cyan - Random thoughts
  pure: '#f8fafc',     // White - Pure and neutral
};

// ==================== Messages & Labels ====================

export const UI_TEXT = {
  title: 'Galaxy of Thoughts',
  tagline: 'Every star is a thought waiting to be discovered',
  
  instructions: {
    click: 'Click any star to read a thought',
    drag: 'Drag to rotate',
    scroll: 'Scroll to zoom',
  },
  
  buttons: {
    addStar: '✨ Add Your Star',
    submit: 'Launch Your Star',
    cancel: 'Cancel',
    close: 'Close',
  },
  
  placeholders: {
    message: 'Share your thought with the universe...',
  },
  
  errors: {
    alreadySubmitted: 'You have already placed your star in the galaxy. ✨',
    moderationFailed: 'Your message cannot be published. Please be respectful.',
    tooShort: 'Your message is too short. Minimum 10 characters.',
    tooLong: 'Your message is too long. Maximum 280 characters.',
    networkError: 'Failed to connect to the universe. Please try again.',
    generic: 'Something went wrong. Please try again later.',
  },
  
  success: {
    submitted: 'Your star has been added to the galaxy! ✨',
  },
};

// ==================== Validation Rules ====================

export const VALIDATION = {
  message: {
    minLength: 10,
    maxLength: 280,
  },
  rateLimit: {
    maxRequestsPerMinute: 5,
    windowMs: 60000,
  },
};

// ==================== Animation Timings ====================

export const ANIMATION = {
  camera: {
    flyToDuration: 2.5,
    easing: 'power2.inOut',
    offsetDistance: 8,
  },
  ui: {
    fadeInDuration: 0.6,
    fadeOutDuration: 0.3,
    modalScale: { from: 0.9, to: 1 },
  },
  stars: {
    pulsationSpeed: [0.5, 2.0], // min, max
    hoverScale: 2.5,
    birthAnimationDuration: 1.5,
  },
};

// ==================== Performance Settings ====================

export const PERFORMANCE = {
  instancedMeshCount: 5000, // Default for development
  productionStarCount: 10000,
  maxFPS: 60,
  pixelRatioLimit: 2,
  enableFrustumCulling: false,
};

// ==================== Camera Settings ====================

export const CAMERA = {
  defaultPosition: [0, 0, 50] as [number, number, number],
  fov: 75,
  near: 0.1,
  far: 1000,
  controls: {
    minDistance: 20,
    maxDistance: 150,
    dampingFactor: 0.05,
    rotateSpeed: 0.5,
    zoomSpeed: 0.8,
  },
};

// ==================== Post-Processing Settings ====================

export const POST_PROCESSING = {
  bloom: {
    intensity: 1.5,
    luminanceThreshold: 0.2,
    luminanceSmoothing: 0.9,
    radius: 0.8,
  },
  noise: {
    opacity: 0.025,
  },
  vignette: {
    offset: 0.3,
    darkness: 0.8,
  },
  dof: {
    focusDistance: 0.01,
    focalLength: 0.1,
    bokehScale: 3,
    height: 480,
  },
};

// ==================== Mood Descriptions ====================

export const MOOD_DESCRIPTIONS = {
  dream: 'A dream or aspiration',
  secret: 'A secret confession',
  advice: 'Wisdom or advice',
  wish: 'A wish or desire',
  love: 'Love and affection',
  hope: 'Hope and optimism',
  thought: 'A random thought',
  pure: 'Pure and neutral',
};

// ==================== Sample Messages (for dummy data) ====================

export const SAMPLE_MESSAGES = [
  'اتبع أحلامك بلا خوف',
  'الكون يستمع إليك',
  'كل لحظة هي بداية جديدة',
  'أنت مصنوع من غبار النجوم',
  'آمن بالسحر الذي بداخلك',
  'الحب هو الجواب على كل شيء',
  'ثق بتوقيت حياتك',
  'قصتك لا تزال تُكتب',
  'اللطف لغة عالمية',
  'الأفضل لم يأتِ بعد',
  'أنت بالضبط حيث يجب أن تكون',
  'احتضن الرحلة، وليس الوجهة فقط',
  'النجوم لا تتألق بدون ظلام',
  'كن النور في ظلام شخص ما',
  'الأحلام لا تعمل إلا إذا عملت أنت',
  'السعادة قرار، وليست وجهة',
  'كن نفسك، الجميع مشغولون',
  'الصبر مفتاح الفرج',
  'في كل نهاية، بداية جديدة',
  'أنت أقوى مما تعتقد',
  'الحياة أجمل عندما تبتسم',
  'لا تستسلم، المعجزات تحدث',
  'قلبك يعرف الطريق',
  'الجمال في التفاصيل الصغيرة',
  'اليوم هدية، لذلك يسمى الحاضر',
  'كن التغيير الذي تريد رؤيته',
  'النجاح يبدأ بخطوة واحدة',
  'أنت كافٍ تماماً كما أنت',
  'الامتنان يجذب المزيد من النعم',
  'السلام الداخلي هو القوة الحقيقية',
  'كل شيء ممكن إذا آمنت',
  'الوقت يشفي كل شيء',
  'حلمك ينتظرك',
  'الحياة مغامرة جميلة',
  'أنت محبوب أكثر مما تعرف',
  'التفاؤل يصنع المستحيل',
  'غداً فرصة جديدة',
  'ثق بحدسك دائماً',
  'أنت نجمة في سماء شخص ما',
  'العالم بحاجة لنورك الفريد',
];
