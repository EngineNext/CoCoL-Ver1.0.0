import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Trophy, 
  Sparkles,
  Bot,
  Wand2,
  Loader2,
  Calendar,
  Clock,
  Coffee,
  CalendarDays,
  CalendarClock,
  RefreshCw,
  Gamepad2,
  Mic,
  MicOff,
  Send
} from 'lucide-react';

// --- 定数と設定 ---
const EXP_PER_TASK = 20;
const BASE_EXP_FOR_LEVEL_UP = 100;
const GEMINI_API_KEY = "";

const MESSAGES = {
  greeting: [
    "スケジュールとタスクの状況を確認します。",
    "システムの準備が完了しました。"
  ],
  taskAdded: [
    "タスクを登録しました。",
    "リストに追加しました。"
  ],
  taskCompleted: [
    "タスクの完了を記録しました。",
    "経験値を付与しました。"
  ],
  levelUp: [
    "規定の経験値に到達し、レベルが上がりました。",
    "ステータスが更新されました。"
  ]
};

// --- ユーティリティ ---
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const timeToMins = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const minsToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 24 && m === 0) return '24:00';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// 1日のスケジュールから、予定と余暇（空き時間）を算出して0:00〜24:00のタイムラインを生成する
const generateTimeline = (schedules) => {
  const timeline = [];
  let currentTime = 0; // 00:00 in minutes
  const endOfDay = 24 * 60;

  const sorted = [...schedules].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

  sorted.forEach(item => {
    const startMins = timeToMins(item.startTime);
    const endMins = timeToMins(item.endTime);

    if (startMins > currentTime) {
      const duration = startMins - currentTime;
      if (duration >= 10) { 
        let label = '小の余暇';
        if (duration >= 60) label = '大の余暇';
        else if (duration >= 30) label = '中の余暇';
        
        timeline.push({
          isFree: true,
          startTime: minsToTime(currentTime),
          endTime: minsToTime(startMins),
          duration,
          label
        });
      }
    }

    timeline.push({ ...item, isFree: false });
    currentTime = Math.max(currentTime, endMins);
  });

  if (currentTime < endOfDay) {
    const duration = endOfDay - currentTime;
    if (duration >= 10) {
      let label = '小の余暇';
      if (duration >= 60) label = '大の余暇';
      else if (duration >= 30) label = '中の余暇';
      
      timeline.push({
        isFree: true,
        startTime: minsToTime(currentTime),
        endTime: minsToTime(endOfDay),
        duration,
        label
      });
    }
  }

  return timeline;
};

const App = () => {
  // --- 状態管理 ---
  const [tasks, setTasks] = useState([
    { id: 1, title: 'メールの返信', completed: false },
    { id: 2, title: '企画書のドラフト作成', completed: false },
    { id: 3, title: '経費精算', completed: false }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  
  const [secretaryMessage, setSecretaryMessage] = useState(MESSAGES.greeting[0]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [breakingDownId, setBreakingDownId] = useState(null);

  // アシスタント入力関連の状態
  const [assistantInput, setAssistantInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [proposedData, setProposedData] = useState(null);
  const [isAssistantProcessing, setIsAssistantProcessing] = useState(false);
  const recognitionRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [schedule, setSchedule] = useState([
    { id: 1, date: getTodayStr(), startTime: '10:00', endTime: '11:00', title: '定例ミーティング', isTask: false, isBonus: false, completed: false },
    { id: 2, date: getTodayStr(), startTime: '13:00', endTime: '14:00', title: '昼食・休憩', isTask: false, isBonus: false, completed: false }
  ]);
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleStart, setNewScheduleStart] = useState('09:00');
  const [newScheduleEnd, setNewScheduleEnd] = useState('10:00');

  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      display: `${d.getMonth() + 1}/${d.getDate()}`,
      day: ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
    };
  });

  const expNeededForNextLevel = level * BASE_EXP_FOR_LEVEL_UP;
  const expProgressPercentage = Math.min(100, (exp / expNeededForNextLevel) * 100);

  // --- 音声入力 (Web Speech API) セットアップ ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        const newText = (recognition.baseText ? recognition.baseText + ' ' : '') + currentTranscript;
        setAssistantInput(newText);
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.baseText = assistantInput;
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch(e) { console.error(e); }
      } else {
        showMessage("お使いのブラウザは音声入力に対応していません。");
      }
    }
  };

  // --- Gemini API 呼び出しロジック ---
  const callGeminiAPI = async (prompt, systemInstruction = null, jsonSchema = null) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    if (systemInstruction) payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    if (jsonSchema) {
      payload.generationConfig = { responseMimeType: "application/json", responseSchema: jsonSchema };
    }

    let retries = 5;
    let delay = 1000;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        return jsonSchema ? JSON.parse(text) : text;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  };

  const showMessage = (messageArrayOrString) => {
    let message = typeof messageArrayOrString === 'string' 
      ? messageArrayOrString 
      : messageArrayOrString[Math.floor(Math.random() * messageArrayOrString.length)];
    
    setIsTyping(true);
    setSecretaryMessage(message);
    setTimeout(() => setIsTyping(false), 500);
  };

  useEffect(() => { showMessage(MESSAGES.greeting); }, []);

  useEffect(() => {
    if (exp >= expNeededForNextLevel) {
      setLevel(prev => prev + 1);
      setExp(exp - expNeededForNextLevel);
      showMessage(MESSAGES.levelUp);
    }
  }, [exp, expNeededForNextLevel]);

  // --- アシスタント入力の送信とAI解析 ---
  const handleAssistantSubmit = async () => {
    if (!assistantInput.trim()) return;
    setIsAssistantProcessing(true);
    if (isListening) toggleListening();
    
    const prompt = `
ユーザーからの話し言葉や自然言語の指示を解析し、「予定（スケジュール）」と「タスク」に分類して抽出してください。
指示に日付が明示されていない場合は対象日を「${selectedDate}」として扱ってください。
・時間の指定（何時から何時まで、何時に、など）があれば予定（schedules）に分類してください。
・時間指定がない「やるべきこと」「買っておくもの」などはタスク（tasks）に分類してください。

ユーザーの指示:
「${assistantInput}」
    `;

    const systemInstruction = "あなたは優秀なスケジュール管理アシスタントです。ユーザーの曖昧な指示を正確に構造化されたデータに変換してください。回答に装飾記号は使用しないでください。";
    const schema = {
      type: "OBJECT",
      properties: {
        schedules: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              date: { type: "STRING", description: "YYYY-MM-DD形式" },
              startTime: { type: "STRING", description: "HH:MM形式" },
              endTime: { type: "STRING", description: "HH:MM形式 (指定がなければ開始時刻の1時間後などを推測)" },
              title: { type: "STRING", description: "予定のタイトル" }
            },
            required: ["date", "startTime", "endTime", "title"]
          }
        },
        tasks: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING", description: "タスクのタイトル" }
            },
            required: ["title"]
          }
        }
      }
    };

    try {
      const result = await callGeminiAPI(prompt, systemInstruction, schema);
      if (result && (result.schedules?.length > 0 || result.tasks?.length > 0)) {
        setProposedData({
          schedules: result.schedules || [],
          tasks: result.tasks || []
        });
        showMessage("指示を解析し、予定とタスクを再編成しました。内容をご確認ください。");
      } else {
        showMessage("指示から具体的な予定やタスクを抽出できませんでした。もう少し具体的に教えてください。");
      }
    } catch (error) {
      showMessage("指示の解析処理に失敗しました。");
    } finally {
      setIsAssistantProcessing(false);
    }
  };

  // 提案の承認・破棄ハンドラ
  const handleAcceptProposal = () => {
    if (!proposedData) return;

    if (proposedData.tasks.length > 0) {
      const newTasks = proposedData.tasks.map((t, i) => ({
        id: Date.now() + i,
        title: t.title,
        completed: false
      }));
      setTasks(prev => [...prev, ...newTasks]);
    }

    if (proposedData.schedules.length > 0) {
      const newSchedules = proposedData.schedules.map((s, i) => ({
        id: Date.now() + 1000 + i,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        title: s.title,
        isTask: false,
        isBonus: false,
        completed: false
      }));
      setSchedule(prev => [...prev, ...newSchedules]);
    }

    setProposedData(null);
    setAssistantInput('');
    showMessage("提案を承認し、スケジュールとタスクに反映しました。");
  };

  const handleRejectProposal = () => {
    setProposedData(null);
    showMessage("提案を破棄しました。必要であれば再入力をお願いします。");
  };

  // --- AI機能群 ---
  const handleAskAdvice = async () => {
    setIsAiThinking(true);
    setSecretaryMessage("状況を分析しています...");
    
    const incompleteTasks = tasks.filter(t => !t.completed).map(t => t.title);
    const prompt = incompleteTasks.length > 0
      ? `以下の未完了タスクリストを確認し、客観的にどのタスクから着手すべきか、合理的な理由を添えて1〜2文で提案してください。\n\n未完了タスク:\n- ${incompleteTasks.join('\n- ')}`
      : `現在のタスクは全て完了しています。これからの時間を有効活用するための提案を1〜2文で行ってください。`;

    const systemInstruction = "あなたはユーザーをサポートする秘書です。過剰な称賛や感情的な表現は避け、事実と論理に基づいた簡潔な回答を提供してください。回答に装飾記号は使用しないでください。";

    try {
      const aiResponse = await callGeminiAPI(prompt, systemInstruction);
      if (aiResponse) showMessage(aiResponse.replace(/[*#]/g, ''));
    } catch (error) {
      showMessage("通信処理でエラーが発生しました。");
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleBreakdownTask = async (taskId, taskTitle) => {
    setBreakingDownId(taskId);
    
    const prompt = `タスク「${taskTitle}」を達成するために、実行可能で具体的なアクションアイテムを3つに分解して提示してください。`;
    const systemInstruction = "タスク管理の観点から、抽象的なタスクを具体的な手順に分解してください。";
    const schema = {
      type: "OBJECT",
      properties: { subtasks: { type: "ARRAY", items: { type: "STRING" } } },
      required: ["subtasks"]
    };

    try {
      const result = await callGeminiAPI(prompt, systemInstruction, schema);
      if (result && result.subtasks) {
        const newTasks = result.subtasks.map((title, index) => ({
          id: Date.now() + index,
          title: `[サブ] ${title}`,
          completed: false
        }));
        
        setTasks(prev => [...prev.filter(t => t.id !== taskId), ...newTasks]);
        showMessage(`タスクを${newTasks.length}つに分解しました。`);
      }
    } catch (error) {
      showMessage("タスクの分解処理に失敗しました。");
    } finally {
      setBreakingDownId(null);
    }
  };

  const handleAutoSchedule = async () => {
    setIsAiThinking(true);
    setSecretaryMessage("タスクの所要時間を推定し、本日の空き時間にスケジューリングしています...");
    
    const currentSchedule = schedule.filter(s => s.date === selectedDate);
    const scheduleText = currentSchedule.length > 0 
      ? currentSchedule.map(s => `${s.startTime} - ${s.endTime} : ${s.title}`).join('\n')
      : '予定なし';
      
    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) {
      showMessage("未完了のタスクがありません。");
      setIsAiThinking(false);
      return;
    }
    const taskText = incompleteTasks.map(t => `- ${t.title}`).join('\n');

    const prompt = `以下の既存のスケジュールと未完了のタスクリストを分析してください。
各タスクの一般的な所要時間を推測し、本日の既存のスケジュールの「空き時間枠（09:00〜18:00の間）」にタスクを配置してください。
既存の予定と重ならないように、開始時刻と終了時刻を決定して出力してください。

対象日: ${selectedDate}
既存のスケジュール:
${scheduleText}

スケジューリング対象の未完了タスク:
${taskText}
`;

    const systemInstruction = "あなたは論理的にタイムマネジメントを行うシステムです。要求されたJSON形式に厳密に従って出力してください。";
    const schema = {
      type: "OBJECT",
      properties: {
        allocatedSchedules: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              startTime: { type: "STRING", description: "HH:MM形式" },
              endTime: { type: "STRING", description: "HH:MM形式" },
              title: { type: "STRING", description: "タスクのタイトル" }
            },
            required: ["startTime", "endTime", "title"]
          }
        }
      },
      required: ["allocatedSchedules"]
    };

    try {
      const result = await callGeminiAPI(prompt, systemInstruction, schema);
      if (result && result.allocatedSchedules) {
        const newSchedules = result.allocatedSchedules.map((s, index) => ({
          id: Date.now() + index,
          date: selectedDate,
          startTime: s.startTime,
          endTime: s.endTime,
          title: `[タスク] ${s.title}`,
          isTask: true,
          isBonus: false,
          completed: false
        }));
        
        setSchedule(prev => [...prev, ...newSchedules]);
        showMessage(`${newSchedules.length}件のタスクをタイムラインにスケジューリングしました。`);
      }
    } catch (error) {
      showMessage("自動スケジューリングに失敗しました。");
    } finally {
      setIsAiThinking(false);
    }
  };

  const generateBonusActivity = async (freeSlot) => {
    setIsAiThinking(true);
    setSecretaryMessage(`${freeSlot.label}に最適なアクティビティを考案しています...`);

    const prompt = `
    以下の空き時間枠で実行可能な、QOLを向上させるゲーミフィケーション要素のあるアクティビティ（ボーナスクエスト）を提案してください。
    時間枠: ${freeSlot.startTime} - ${freeSlot.endTime} (${freeSlot.duration}分)
    `;

    const systemInstruction = "あなたはゲームマスター兼秘書です。時間に応じた現実的かつリフレッシュ可能なアクティビティを1つだけ出力してください。装飾記号は使用しないでください。";
    const schema = {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "アクティビティのタイトル（例：軽いストレッチでHPを回復する）" },
        expReward: { type: "NUMBER", description: "獲得経験値（10〜50の間で設定）" }
      },
      required: ["title", "expReward"]
    };

    try {
      const result = await callGeminiAPI(prompt, systemInstruction, schema);
      if (result && result.title) {
        const newSchedule = {
          id: Date.now(),
          date: selectedDate,
          startTime: freeSlot.startTime,
          endTime: freeSlot.endTime,
          title: `[ボーナス] ${result.title}`,
          isTask: false,
          isBonus: true,
          completed: false,
          expReward: result.expReward
        };
        setSchedule(prev => [...prev, newSchedule]);
        showMessage("ボーナスクエストをタイムラインに追加しました。完了で経験値を獲得できます。");
      }
    } catch(e) {
      showMessage("アクティビティの生成に失敗しました。");
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSyncGoogleCalendar = async () => {
    setIsSyncing(true);
    setSecretaryMessage("外部カレンダーAPIとの通信を試行しています...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    const dummyExternalData = [
      { id: Date.now() + 1, date: selectedDate, startTime: '15:00', endTime: '16:00', title: '【G-Cal】取引先オンライン面談', isTask: false, isBonus: false, completed: false }
    ];

    const newSchedules = dummyExternalData.filter(newEvent => 
      !schedule.some(existingEvent => 
        existingEvent.date === newEvent.date && 
        existingEvent.startTime === newEvent.startTime && 
        existingEvent.title === newEvent.title
      )
    );

    if (newSchedules.length > 0) {
      setSchedule(prev => [...prev, ...newSchedules]);
      showMessage(`外部カレンダーから予定を同期しました。（※シミュレーション機能）`);
    } else {
      showMessage("同期する新しい予定は見つかりませんでした。");
    }
    
    setIsSyncing(false);
  };

  // --- 基本イベントハンドラ ---
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: newTaskTitle.trim(), completed: false }]);
    setNewTaskTitle('');
  };

  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const isNowCompleted = !task.completed;
        if (isNowCompleted) {
          setExp(prev => prev + EXP_PER_TASK);
          showMessage(MESSAGES.taskCompleted);
        }
        return { ...task, completed: isNowCompleted };
      }
      return task;
    }));
  };

  const deleteTask = (id) => setTasks(tasks.filter(task => task.id !== id));

  const handleAddSchedule = (e) => {
    e.preventDefault();
    if (!newScheduleTitle.trim() || newScheduleStart >= newScheduleEnd) return;
    
    setSchedule([...schedule, {
      id: Date.now(),
      date: selectedDate,
      startTime: newScheduleStart,
      endTime: newScheduleEnd,
      title: newScheduleTitle.trim(),
      isTask: false,
      isBonus: false,
      completed: false
    }]);
    setNewScheduleTitle('');
  };

  const deleteSchedule = (id) => setSchedule(schedule.filter(item => item.id !== id));

  const toggleScheduleCompletion = (id) => {
    setSchedule(prev => prev.map(s => {
      if (s.id === id) {
        const isNowCompleted = !s.completed;
        if (isNowCompleted && s.expReward) {
          setExp(prevExp => prevExp + s.expReward);
          showMessage(`${s.expReward} EXPを獲得しました。`);
        }
        return { ...s, completed: isNowCompleted };
      }
      return s;
    }));
  };

  const currentDaySchedules = schedule.filter(s => s.date === selectedDate);
  const timelineData = generateTimeline(currentDaySchedules);

  // --- レンダリング ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* ヘッダー */}
        <header className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            LifeQuest OS
          </h1>
          <div className="text-sm text-slate-500">
            {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
        </header>

        {/* アシスタント入力UI */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-indigo-600" />
            </div>
            
            <div className="flex-1 w-full space-y-3">
              <h2 className="text-lg font-bold text-indigo-900">スマートアシスタント入力</h2>
              
              {!proposedData ? (
                <div className="relative">
                  <textarea
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    placeholder="「明日の14時から会議を入れて」「牛乳を買うタスクを追加して」など、だらだらと話すように入力してください..."
                    className="w-full min-h-[100px] p-4 pb-14 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm leading-relaxed"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`p-2.5 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      title={isListening ? '音声入力を停止' : '音声入力（マイク）を開始'}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleAssistantSubmit}
                      disabled={!assistantInput.trim() || isAssistantProcessing}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white p-2.5 rounded-full transition-colors flex items-center justify-center"
                      title="AIに解析を依頼する"
                    >
                      {isAssistantProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                    </button>
                  </div>
                  {isListening && (
                    <div className="absolute -bottom-6 left-2 text-xs font-bold text-red-500 flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      音声を録音中...
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                  <p className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    こんな予定でよろしいですか？
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500">抽出された予定 (スケジュール)</span>
                      {proposedData.schedules.length === 0 && <p className="text-sm text-slate-400">なし</p>}
                      {proposedData.schedules.map((s, idx) => (
                        <div key={idx} className="bg-white p-2 border border-slate-200 rounded-lg flex items-center gap-2 text-sm shadow-sm">
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">{s.startTime}-{s.endTime}</span>
                          <span className="text-slate-700 truncate">{s.title}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500">抽出されたタスク (クエスト)</span>
                      {proposedData.tasks.length === 0 && <p className="text-sm text-slate-400">なし</p>}
                      {proposedData.tasks.map((t, idx) => (
                        <div key={idx} className="bg-white p-2 border border-slate-200 rounded-lg flex items-center gap-2 text-sm shadow-sm">
                          <Circle className="w-4 h-4 text-indigo-300 flex-shrink-0" />
                          <span className="text-slate-700 truncate">{t.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-indigo-100">
                    <button 
                      onClick={handleRejectProposal}
                      className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-bold transition-colors"
                    >
                      やり直し
                    </button>
                    <button 
                      onClick={handleAcceptProposal}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      OK (反映する)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* 左カラム：ステータス＆秘書メッセージ */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="bg-slate-50 p-4 rounded-xl relative w-full border border-slate-100 mb-4">
                <p className="text-sm text-slate-700 min-h-[3rem] flex items-center justify-center">
                  {secretaryMessage}
                </p>
              </div>
              <button 
                onClick={handleAskAdvice}
                disabled={isAiThinking || isSyncing}
                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50 text-sm font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-indigo-200"
              >
                <Sparkles className="w-4 h-4" />
                <span>タスク優先度分析</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Status
              </h2>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-xs text-slate-500">Level</span>
                  <div className="text-3xl font-bold text-indigo-900">{level}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Next</span>
                  <div className="text-sm font-medium text-slate-700">{exp} / {expNeededForNextLevel}</div>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 mb-1 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${expProgressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 中央カラム：タスク管理 */}
          <div className="md:col-span-1 lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                クエストリスト
              </h2>
              <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="手動でタスク追加..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" disabled={!newTaskTitle.trim()} className="bg-indigo-600 text-white px-3 py-2 rounded-lg">
                  <Plus className="w-4 h-4" />
                </button>
              </form>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border ${task.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button onClick={() => toggleTaskCompletion(task.id)} className={task.completed ? 'text-green-500' : 'text-slate-300'}>
                        {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <span className={`text-sm truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</span>
                    </div>
                    <div className="flex items-center">
                      {!task.completed && (
                        <button onClick={() => handleBreakdownTask(task.id, task.title)} disabled={breakingDownId !== null} className="text-indigo-400 hover:bg-indigo-50 p-1.5 rounded-md">
                          {breakingDownId === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        </button>
                      )}
                      <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-md">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右カラム：スケジュール管理（24時間タイムライン） */}
          <div className="md:col-span-2 lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  24Hタイムライン
                </h2>
                
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleSyncGoogleCalendar}
                    disabled={isSyncing || isAiThinking}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50 text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors border border-blue-200"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>外部同期</span>
                  </button>
                  <button 
                    onClick={handleAutoSchedule}
                    disabled={isAiThinking || isSyncing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <CalendarClock className="w-4 h-4" />
                    <span>タスク自動割当</span>
                  </button>
                </div>
              </div>

              {/* 日付選択タブ */}
              <div className="flex overflow-x-auto gap-2 mb-6 pb-2 border-b border-slate-100 scrollbar-hide">
                {weekDates.map(w => (
                  <button
                    key={w.dateStr}
                    onClick={() => setSelectedDate(w.dateStr)}
                    className={`flex flex-col items-center min-w-[3.5rem] py-2 px-1 rounded-lg border transition-colors ${selectedDate === w.dateStr ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                  >
                    <span className="text-xs">{w.day}</span>
                    <span className="text-sm font-bold">{w.display}</span>
                  </button>
                ))}
              </div>

              {/* 手動スケジュール入力フォーム */}
              <form onSubmit={handleAddSchedule} className="flex flex-wrap gap-2 mb-6">
                <input
                  type="time"
                  value={newScheduleStart}
                  onChange={(e) => setNewScheduleStart(e.target.value)}
                  className="px-2 py-2 border border-slate-200 rounded-lg text-sm w-24"
                />
                <span className="flex items-center text-slate-400">-</span>
                <input
                  type="time"
                  value={newScheduleEnd}
                  onChange={(e) => setNewScheduleEnd(e.target.value)}
                  className="px-2 py-2 border border-slate-200 rounded-lg text-sm w-24"
                />
                <input
                  type="text"
                  value={newScheduleTitle}
                  onChange={(e) => setNewScheduleTitle(e.target.value)}
                  placeholder="手動で予定追加..."
                  className="flex-1 min-w-[120px] px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <button type="submit" disabled={!newScheduleTitle.trim() || newScheduleStart >= newScheduleEnd} className="bg-slate-800 text-white px-3 py-2 rounded-lg">
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* タイムライン描画エリア */}
              <div className="space-y-1 relative max-h-[600px] overflow-y-auto pr-2 pb-4">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-100 -z-10"></div>
                
                {timelineData.map((item, idx) => {
                  if (item.isFree) {
                    return (
                      <div key={`free-${idx}`} className="flex items-center gap-3 py-1">
                        <div className="w-12 text-right text-xs text-slate-400"></div>
                        <div className="flex-1 border-2 border-dashed border-teal-200 rounded-xl p-3 bg-teal-50/30 flex justify-between items-center transition-colors hover:bg-teal-50">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-teal-700">{item.label} <span className="text-xs font-normal">({item.duration}分)</span></span>
                            <span className="text-xs text-teal-600/70">{item.startTime} - {item.endTime}</span>
                          </div>
                          <button 
                            onClick={() => generateBonusActivity(item)}
                            disabled={isAiThinking}
                            className="text-xs bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-200 flex items-center gap-1 transition-colors font-medium shadow-sm disabled:opacity-50"
                          >
                            <Gamepad2 className="w-3 h-3" />
                            +αを追加
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-1">
                        <div className="w-12 text-right text-xs font-bold text-slate-500">
                          {item.startTime}
                        </div>
                        <div className={`flex-1 flex items-center justify-between p-3 rounded-xl border shadow-sm ${item.isBonus ? 'bg-amber-50 border-amber-200' : item.isTask ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            {item.isBonus && (
                              <button onClick={() => toggleScheduleCompletion(item.id)} className={`flex-shrink-0 transition-colors ${item.completed ? 'text-green-500' : 'text-slate-300 hover:text-amber-500'}`}>
                                {item.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                              </button>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className={`text-sm font-bold truncate ${item.completed ? 'line-through text-slate-400' : item.isBonus ? 'text-amber-800' : item.isTask ? 'text-indigo-900' : 'text-slate-700'}`}>
                                {item.title}
                              </span>
                              <span className="text-xs text-slate-500">
                                {item.startTime} - {item.endTime} {item.isBonus && !item.completed && <span className="ml-1 text-amber-600 font-medium">(+{item.expReward} EXP)</span>}
                              </span>
                            </div>
                          </div>
                          <button onClick={() => deleteSchedule(item.id)} className="text-slate-300 hover:text-red-500 p-1.5 ml-2 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;