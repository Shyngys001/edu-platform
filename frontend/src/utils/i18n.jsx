import { createContext, useContext } from 'react';

const translations = {
  appName: 'PyStart',
  appTagline: 'Python-ды қазақша үйрен',
  student: 'Оқушы',
  teacher: 'Мұғалім',
  logout: 'Шығу',
  save: 'Сақтау',
  saved: 'Сақталды',
  cancel: 'Бас тарту',
  create: 'Құру',
  created: 'Жасалды',
  delete: 'Жою',
  edit: 'Өзгерту',
  editTask: 'Тапсырманы өзгерту',
  close: 'Жабу',
  loading: 'Жүктелуде...',
  saving: 'Сақталуда...',
  sending: 'Жіберілуде...',
  notFound: 'Табылмады',
  noData: 'Деректер жоқ',
  actions: 'Әрекеттер',
  type: 'Түрі',

  // Auth
  welcomeBack: 'Қош келдіңіз',
  signInSubtitle: 'Аккаунтыңызға кіріңіз',
  signIn: 'Кіру',
  signingIn: 'Кіру...',
  createAccount: 'Тіркелу',
  registerSubtitle: 'PyStart-пен Python үйренуді бастаңыз',
  creating: 'Құрылуда...',
  username: 'Логин',
  password: 'Құпия сөз',
  fullName: 'Толық аты-жөні',
  gradeClass: 'Сынып',
  role: 'Рөл',
  noAccount: 'Аккаунтыңыз жоқ па?',
  register: 'Тіркелу',
  haveAccount: 'Аккаунтыңыз бар ма?',

  // Sidebar
  dashboard: 'Басты бет',
  lessons: 'Сабақтар',
  tests: 'Тесттер',
  codeTasks: 'Тапсырмалар',
  leaderboard: 'Рейтинг',
  aiHelper: 'AI Көмекші',
  statistics: 'Статистика',
  inbox: 'Хабарламалар',
  students: 'Оқушылар',
  analytics: 'Аналитика',
  feedback: 'Кері байланыс',
  export: 'Экспорт',
  messenger: 'Мессенджер',
  topics: 'Тақырыптар',

  // Student Dashboard
  welcome: 'Қош келдіңіз',
  level: 'Деңгей',
  totalPoints: 'Жалпы ұпай',
  progress: 'Прогресс',
  streak: 'Серия',
  days: 'күн',
  grade: 'Сынып',
  myBadges: 'Менің белгілерім',
  continueLearning: 'Оқуды жалғастыру',
  lessonsRemaining: 'сабақ қалды',
  takeTest: 'Тест тапсыру',
  testYourKnowledge: 'Білімдеріңізді тексеріңіз',

  // Lessons
  theoryLessons: 'Теориялық сабақтар',
  backToLessons: 'Сабақтарға оралу',
  watchVideo: 'Бейнені көру',
  markCompleted: 'Аяқталды деп белгілеу',
  lessonCompleted: 'Сабақ аяқталды! +10 ұпай',
  badgeUnlocked: 'Жаңа белгі алынды!',

  // Tests
  questions: 'сұрақ',
  notAttempted: 'Әлі тапсырылмаған',
  bestScore: 'Ең жақсы нәтиже',
  submitTest: 'Тестті жіберу',
  submitting: 'Жіберілуде...',
  answerAll: 'Барлық сұрақтарға жауап беріңіз',
  score: 'Ұпай',
  percentage: 'Пайыз',
  time: 'Уақыт',
  wrongAnswersReview: 'Қателерді талдау',
  yourAnswer: 'Сіздің жауабыңыз',
  correct: 'Дұрыс жауап',
  backToTests: 'Тесттерге оралу',
  question: 'Сұрақ',
  selectMatch: 'Сол жақтағы элементтерді оң жақтағылармен сәйкестендіріңіз',
  select: 'Таңдаңыз...',
  results: 'Нәтижелер',

  // Code Tasks
  codeEditor: 'Код редакторы',
  run: 'Іске қосу',
  running: 'Жұмыс істеуде...',
  submit: 'Жіберу',
  checking: 'Тексерілуде...',
  output: 'Нәтиже',
  testResults: 'Тест нәтижелері',
  passed: 'ӨТТІ',
  failed: 'ҚАТЕ',
  testCases: 'тест-кейс',
  input: 'Кіріс',
  expected: 'Күтілген',
  got: 'Алынған',

  // Leaderboard
  rank: 'Орын',
  name: 'Аты',
  points: 'Ұпай',

  // Chat
  aiPythonHelper: 'AI Python Көмекшісі',
  askAboutPython: 'Python туралы кез келген сұрақ қойыңыз!',
  typeMessage: 'Python туралы сұраңыз...',
  send: 'Жіберу',

  // Statistics
  myStatistics: 'Менің статистикам',
  completedLessons: 'Аяқталған сабақтар',
  testScoresOverTime: 'Тест нәтижелері',
  performanceByModule: 'Модульдер бойынша нәтижелер',

  // Inbox
  noMessages: 'Хабарламалар жоқ',

  // Messenger
  directMessages: 'Жеке',
  groupChat: 'Топ',
  classChat: 'Сынып чаты',
  classChatDesc: 'Сыныптастарыңызбен және мұғаліммен сөйлесіңіз',
  selectContact: 'Контактты таңдаңыз',
  typeYourMessage: 'Хабарлама жазыңыз...',
  noStudentsFound: 'Оқушылар табылмады',
  attachFile: 'Файл тіркеу',
  voiceMessage: 'Дауыстық хабарлама',
  recording: 'Жазылуда...',
  fileTooBig: 'Файл тым үлкен (макс. 10МБ)',
  microphoneError: 'Микрофонға қол жетімді емес',

  // Teacher Dashboard
  teacherDashboard: 'Мұғалім панелі',
  totalStudents: 'Жалпы оқушылар',
  averageScore: 'Орташа ұпай',
  recentActivity: 'Соңғы белсенділік',
  date: 'Күні',

  // Teacher Students
  studentManagement: 'Оқушыларды басқару',
  editStudent: 'Оқушыны өзгерту',
  confirmDeleteStudent: 'Оқушы мен оның барлық деректерін жою? Бұл әрекетті болдырмау мүмкін емес.',
  studentDeleted: 'Оқушы жойылды',
  newPassword: 'Жаңа құпия сөз',
  leaveBlankToKeep: 'Бос қалдыру — өзгертпеу',
  allGrades: 'Барлық сыныптар',
  avgTestScore: 'Орт. ұпай',
  weakTopics: 'Әлсіз тақырыптар',
  recentTests: 'Соңғы тесттер',

  // Teacher CMS — Lessons
  lessonsCMS: 'Сабақтарды басқару',
  module: 'Модуль',
  order: 'Реті',
  video: 'Бейне',
  content: 'Мазмұны (Markdown)',
  imageUrl: 'Сурет URL',
  videoUrl: 'Бейне URL (YouTube)',
  editLesson: 'Сабақты өзгерту',
  createLesson: 'Сабақ құру',
  moduleTitle: 'Модуль атауы:',
  lessonsTitle: 'Сабақтар',
  newLesson: 'Жаңа сабақ',

  // Teacher CMS — Tests
  testsManagement: 'Тесттерді басқару',
  testsTitle: 'Тесттер',
  newTest: 'Жаңа тест',
  createNewTest: 'Жаңа тест құру',
  editTest: 'Тестті өзгерту',
  createTest: 'Тест құру',
  difficulty: 'Күрделілігі',
  easy: 'Жеңіл',
  medium: 'Орташа',
  hard: 'Қиын',
  addQuestion: 'Сұрақ қосу',
  questionType: 'Сұрақ түрі',
  mcq: 'Таңдамалы',
  findBug: 'Қатені табу',
  chooseCode: 'Код таңдау',
  matching: 'Сәйкестендіру',
  questionText: 'Сұрақ мәтіні',
  options: 'Нұсқалар (әрбірі бөлек)',
  correctAnswer: 'Дұрыс жауап',
  explanation: 'Түсіндірме',
  addAtLeastOne: 'Кем дегенде бір сұрақ қосыңыз',

  // Teacher CMS — Code Tasks
  codeTasksTitle: 'Код тапсырмалары',
  newTask: 'Жаңа тапсырма',
  createCodeTask: 'Тапсырма құру',
  description: 'Сипаттама (Markdown)',
  starterCode: 'Бастапқы код',
  testCasesJson: 'Тест-кейстер (JSON массив)',
  testCaseFormat: 'Формат: [{"input": "...", "expected_output": "..."}, ...]',

  // Templates
  useTemplate: 'Шаблон',
  templateBasic: 'Базалық енгізу/шығару',
  templateString: 'Жолдармен жұмыс',
  templateList: 'Тізіммен жұмыс',
  templateMath: 'Математика',
  customTask: 'Өз тапсырмасы',

  // AI Generation
  aiGenerateTest: 'ЖИ арқылы жасау',
  aiGenerateTestDesc: 'ЖИ модуль мен қиындыққа байланысты сұрақтар жасайды',
  aiGenerateLesson: 'ЖИ арқылы жасау',
  aiGenerateLessonDesc: 'ЖИ мысалдар мен тапсырмалармен толық сабақ жазады',
  aiGenerateTask: 'ЖИ арқылы жасау',
  aiGenerateTaskDesc: 'ЖИ тест-кейстермен тапсырма жасайды',
  aiGenerated: 'Мазмұн сәтті жасалды!',
  generating: 'Жасалуда...',
  generate: 'Жасау',
  enterTopic: 'Сабақ тақырыбын енгізіңіз:',
  addCase: 'Кейс қосу',

  // Analytics
  analyticsTitle: 'Аналитика',
  avgScoreByModule: 'Модульдер бойынша орташа ұпай',
  weakTopicsLowest: 'Әлсіз тақырыптар',
  attempts: 'Тапсырылды',
  avgScore: 'Орташа ұпай',
  avgProgress: 'Орташа прогресс',
  totalGrades: 'Сыныптар',
  gradeOverview: 'Сыныптар бойынша үлгерім',
  studentsCount: 'оқушы',
  studentPerformance: 'Оқушылар үлгерімі',
  showAll: 'Барлығын көрсету',
  testHistory: 'Тест тарихы',
  noTests: 'Тесттер әлі тапсырылмаған',
  showPreview: 'Есепті алдын ала көру',
  hidePreview: 'Жасыру',
  reportPreview: 'Есепті алдын ала көру',

  // Feedback
  studentFeedback: 'Кері байланыс',
  sendFeedback: 'Хабарлама жіберу',
  selectStudent: 'Оқушыны таңдаңыз...',
  yourFeedback: 'Хабарламаңыз...',
  sentMessages: 'Жіберілген хабарламалар',
  noFeedback: 'Хабарламалар жоқ',
  read: 'Оқылды',
  unread: 'Оқылмады',
  feedbackSent: 'Хабарлама жіберілді',
  selectStudentAndMessage: 'Оқушыны таңдаңыз және хабарлама жазыңыз',

  // Export
  madeInKZ: 'Қазақстанда жасалған',
  noActivityYet: 'Әзірше белсенділік жоқ',
  noTestsAvailable: 'Әзірше қолжетімді тесттер жоқ',
  test: 'Тест',
  lessonsLabel: 'Сабақтар',
  levelBeginner: 'Бастауыш',
  levelIntermediate: 'Орта',
  levelAdvanced: 'Жоғары',
  noCodeTasksAvailable: 'Әзірше код тапсырмалары жоқ',
  noStudentsYet: 'Әзірше оқушылар жоқ',
  best: 'Ең жақсы',
  exportReports: 'Есептерді экспорттау',
  csvReport: 'CSV есеп',
  csvDesc: 'Оқушылардың деректерін CSV форматында жүктеңіз.',
  downloadCSV: 'CSV жүктеу',
  pdfReport: 'PDF есеп',
  pdfDesc: 'Оқушылардың үлгерімі туралы PDF есепті жүктеңіз.',
  downloadPDF: 'PDF жүктеу',

  // Grades & Topics
  grade6to11: 'Сынып 6-11',
  gradeProgress: 'Сынып прогресі',
  topic: 'Тақырып',
  topicManagement: 'Тақырыптарды басқару',
  currentGrade: 'Ағымдағы сынып',
  lockedGrade: 'Ағымдағыны аяқтаңыз',
  globalFinal: 'Жалпы қорытынды',
  isFinal: 'Қорытынды тапсырмалар',
  isGlobalFinal: 'Жалпы қорытынды',
  createTopic: 'Тақырып құру',
  editTopic: 'Тақырыпты өзгерту',
  orderIndex: 'Реті',
  gradeLabel: 'Сынып',
  unlocked: 'Ашылды',
  locked: 'Жабық',
  completed: 'Аяқталды',
  noTopic: 'Тақырыпсыз',
  noTopicsYet: 'Тақырыптар жоқ. Біріншісін жасаңыз.',
  noLessonsForGrade: 'Бұл сынып үшін сабақтар жоқ.',
  noContent: 'Мазмұн жоқ',
  update: 'Жаңарту',
};

const LangContext = createContext();

export function LangProvider({ children }) {
  const t = (key) => translations[key] ?? key;
  return (
    <LangContext.Provider value={{ lang: 'kz', setLang: () => {}, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  const { t } = useContext(LangContext);
  return t;
}
