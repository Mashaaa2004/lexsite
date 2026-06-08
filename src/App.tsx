import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Languages, 
  Calculator, 
  BookOpen, 
  Check, 
  Copy, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  MessageSquare, 
  ShieldAlert, 
  Info,
  Scale
} from "lucide-react";

// Beautiful translations & clear content in simple words (O'ta sodda, tushunarli)
const LOCALIZATION = {
  uz: {
    title: "LexGlobal",
    subtitle: "Xalqaro & O'zbekiston virtual maslahatchisi",
    description: "Xalqaro huquqiy normalar va O'zbekiston qonunchiligini oson tushuntiruvchi aqlli yordamchi.",
    onlineStatus: "LexGlobal AI faol",
    
    // Simple Navigation Controls
    tabChat: "💬 Savol-Javob (AI)",
    tabCalc: "🧮 Soliq va Nafaqa",
    tabLaws: "📜 Muhim qoidalar",

    // Chat Interface
    chatHeader: "Yuridik suhbatdosh",
    chatSub: "Xalqaro normalar, oyliklar, soliqlar yoki mehnat huquqlari haqida so'rang.",
    chatPlaceholder: "Savolingizni yozing (Masalan: oylik kechiksa nima bo'ladi?)...",
    waitingText: "Qonunlar va xalqaro normalarni tahlil qilyapman...",
    quickInquiryHeader: "Tezkor milliy & xalqaro savollar:",

    // Tax Interface
    taxHeader: "Sodda Soliq va Nafaqa Hisoblagichi",
    taxSub: "Oylik daromadingizdan qancha soliq ushlab qolinishini tezkor bilib oling.",
    salaryLabel: "Sizning oylik ish haqingiz (soliqgacha):",
    taxResultLabel: "Soliq idorasi oladigan qismi (12% JShDS):",
    takeHomeLabel: "Sizning qo'lingizga tegadigan oyligingiz (Netto):",
    
    severanceLabel: "Sizning o'rtacha oyligingiz:",
    severanceTypeLabel: "Ishdan bo'shatilish sababini tanlang:",
    severanceResultLabel: "Sizga to'lanadigan kafolatlangan jami nafaqa summasi:",
    
    monthsBasic: "Tashkilot xohishi bilan bo'shatilganda (1 oylik)",
    monthsRedundancy: "Shtat qisqarganda (2 oylik maosh)",
    monthsHighExperience: "Uzoq yillik staj bo'lganda (3 oylik maosh)",

    // General Words
    copied: "Nusxa olindi!",
    copyBtn: "Nusxa olish",
    disclaimer: "Eslatma: Virtual yordamchi bergan javoblar tushuntirish va ma'lumot olish uchun xizmat qiladi.",
    moreResources: "Batafsil ma'lumot uchun bepul Davlat maslahat markazi: advice.uz",

    // Welcome Welcome Message
    initMsg: "Assalomu alaykum! Men **LexGlobal** – aqlli virtual yuridik maslahatchiman. Men ham xalqaro huquq, ham O'zbekiston Respublikasining rasmiy qonunchiligini yaxshi bilaman.\n\nMenga xalqaro shartnomalar, global qoidalar yoki O'zbekiston mehnat, soliq va ijara qonunlari haqida savol bering (masalan: *'O'zbekistonda oylik kechiksa nima qilinadi?'* yoki *'YTT ochsam qancha soliq to'layman?'*)."
  },
  ru: {
    title: "LexGlobal",
    subtitle: "Международный и Узбекистан юридический консультант",
    description: "Умный помощник, разъясняющий международное законодательство и законы Узбекистана.",
    onlineStatus: "ИИ советник LexGlobal онлайн",
    
    tabChat: "💬 Вопросы и ответы (ИИ)",
    tabCalc: "🧮 Расчет налогов",
    tabLaws: "📜 Важные правила",

    chatHeader: "Юридический чат",
    chatSub: "Спрашивайте о глобальных нормах, зарплатах, налогах или трудовых правах.",
    chatPlaceholder: "Введите ваш вопрос (например: задержали зарплату в Узбекистане, что делать?)...",
    waitingText: "Анализирую глобальные и национальные законы...",
    quickInquiryHeader: "Частые международные и национальные вопросы:",

    taxHeader: "Простой калькулятор налогов и пособий в Узбекистане",
    taxSub: "Узнайте, сколько налогов удерживается с вашей зарплаты по законодательству.",
    salaryLabel: "Ваша зарплата (до вычета налогов):",
    taxResultLabel: "Подоходный налог (12% НДФЛ):",
    takeHomeLabel: "Сумма, которую вы получите на руки (Нетто):",
    
    severanceLabel: "Ваша средняя зарплата:",
    severanceTypeLabel: "Причина увольнения:",
    severanceResultLabel: "Гарантированная сумма выходного пособия:",
    
    monthsBasic: "При обычном увольнении (1 оклад)",
    monthsRedundancy: "При сокращении штата (2 оклада)",
    monthsHighExperience: "При большом трудовом стаже (3 оклада)",

    copied: "Скопировано!",
    copyBtn: "Копировать",
    disclaimer: "Примечание: Ответы ИИ носят ознакомительный характер и базируются на праве Узбекистана и мировых нормах.",
    moreResources: "Официальный правительственный портал помощи: advice.uz",

    initMsg: "Здравствуйте! Я **LexGlobal** – ваш универсальный виртуальный юрист. Отлично разбираюсь как во всемирных юридических стандартах, так и в законах Республики Узбекистан.\n\nЗадайте вопрос по узбекскому праву (например: *'Какие налоги платит ИП?'* или *'Как зарегистрировать договор аренды?'*) либо по международным нормам."
  },
  en: {
    title: "LexGlobal",
    subtitle: "International & Uzbekistan Legal Advisor",
    description: "An intelligent advisor explaining global regulations and Uzbekistan legislation.",
    onlineStatus: "LexGlobal AI Active",
    
    tabChat: "💬 Q&A Consulting",
    tabCalc: "🧮 Tax Calculator",
    tabLaws: "📜 Simple Rules",

    chatHeader: "Legal Chatroom",
    chatSub: "Inquire about international standards, salaries, taxes, or employment codes.",
    chatPlaceholder: "Type your query (e.g., how to register a housing contract in Tashkent?)...",
    waitingText: "Analyzing global and Uzbek legislation...",
    quickInquiryHeader: "Common International & National Issues:",

    taxHeader: "Simple Tax & Severance Estimator (Uzbekistan)",
    taxSub: "Quickly view monthly PIT deductions and statutory redundancy cashouts.",
    salaryLabel: "Your gross monthly salary (before tax):",
    taxResultLabel: "Personal Income Tax (12% PIT):",
    takeHomeLabel: "Net take-home salary on hands (Net):",
    
    severanceLabel: "Your average monthly salary:",
    severanceTypeLabel: "Reason for termination:",
    severanceResultLabel: "Guaranteed statutory severance pay:",
    
    monthsBasic: "Standard employer dismissal (1 month)",
    monthsRedundancy: "Redundant / Staff lay-off (2 months)",
    monthsHighExperience: "Long-term work experience (3 months)",

    copied: "Copied!",
    copyBtn: "Copy Text",
    disclaimer: "Disclaimer: AI answers reflect global standards and official provisions for general reference.",
    moreResources: "For official government assistance check advice.uz",

    initMsg: "Hello! I am **LexGlobal**, your versatile virtual legal advisor. I cover global legal principles alongside targeted Uzbek statutes and digital codes.\n\nFeel free to ask about company setup, global IP rights, or Uzbekistan tax and labor regulations (e.g., *'maternity leave duration'* or *'sole trader taxes'*)."
  }
};

// Simple visual data cards for "Muhim Qoidalar" tab to prevent cognitive fatigue
const CODES_DATA = {
  uz: [
    {
      title: "💼 Mehnat huquqlari (Yangi Mehnat Kodeksi)",
      overview: "Ish beruvchi xodimni shunchaki xohlagan payt asossiz hayday olmaydi. Ish qisqarsa, albatta to'lovlar va oldindan ogohlantirish berilishi shart.",
      rules: [
        "Ishdan bo'shatilganda kamida 1 oylik maosh miqdorida nafaqa beriladi.",
        "Har yili kamida 21 kun davomida haq to'lanadigan ta'til berilishi majburiy.",
        "Kasallik varaqasi (bolnichniy) ochilganda haq to'lash majburiy hisoblanadi."
      ]
    },
    {
      title: "🏢 Soliqlar va YTT Tadbirkorlik",
      overview: "Tadbirkor bo'lish hozir juda oson. Oila a'zolarini qo'shib kichik biznesni soliqsiz yuritish imkoniyatlari ko'p.",
      rules: [
        "Yillik aylanmangiz 100 mln so'mgacha bo'lsa, daromad solig'i 0% bo'ladi.",
        "YTTlar faqat o'z pensiyasi va ish staji uchun oyiga 1 BHM (340 000 so'm) ijtimoiy soliq to'laydi.",
        "Hunarmandlar uyushmasiga kirganlar uchun deyarli barcha soliqlar bepul."
      ]
    },
    {
      title: "🏠 Uyni ijaraga qo'yish qoidalari",
      overview: "Uyni ijaraga bersangiz yoki ijaraga tursangiz, albatta shartnomani bepul onlayn ro'yxatdan o'tkazing.",
      rules: [
        "Ijara shartnomasi E-ijara (soliq tizimi) orqali mutlaqo bepul ro'yxatdan o'tadi.",
        "Notariusga borish shart emas, onlayn shartnoma qonuniy kuchga ega.",
        "Ijara daromadidan jami 12% daromad solig'i to'lanadi."
      ]
    }
  ],
  ru: [
    {
      title: "💼 Трудовые права (Новый Трудовой Кодекс)",
      overview: "Работодатель не может увольнять сотрудников без веской причины. При сокращении штата обязательны выплаты пособий.",
      rules: [
        "При увольнении выплачивается минимум 1 средний оклад.",
        "Отказ в ежегодном отпуске (минимум 21 день) строго запрещен.",
        "Оплата больничного листа гарантируется законом."
      ]
    },
    {
      title: "🏢 Налоги и открытие ИП",
      overview: "Налоги для малого бизнеса в Узбекистане максимально упрощены для стимулирования граждан.",
      rules: [
        "До 100 млн сум оборота в год подоходный налог равен 0%.",
        "ИП платят только социальный налог в 1 БРВ (340 000 сум) в месяц для пенсионного стажа.",
        "Ремесленники освобождены от большинства стандартных налогов."
      ]
    },
    {
      title: "🏠 Правила аренды жилья",
      overview: "Защитите себя при аренде квартиры, зарегистрировав простой бесплатный договор.",
      rules: [
        "Регистрация договора на платформе E-ijara налоговой бесплатна.",
        "Заверение у нотариуса по закону больше не требуется.",
        "Налог на доход от аренды составляет фиксированные 12%."
      ]
    }
  ],
  en: [
    {
      title: "💼 Employment Rights (New Labor Code)",
      overview: "Employers cannot terminate employees arbitrarily. Redundancy guarantees legal severance support.",
      rules: [
        "Guaranteed 1 month salary minimum payment upon redundancy dismissal.",
        "Paid annual vacation leave of at least 21 calendar days is mandatory.",
        "Paid sick leaves (medical bill coverage) are legally required."
      ]
    },
    {
      title: "🏢 Small Business & Sole Proprietorship (IE/YTT)",
      overview: "Opening and running a small business registration is easy with high tax reliefs.",
      rules: [
        "0% Income tax applies for businesses with turnovers under 100M UZS per year.",
        "Sole Traders pay only 1 basic social fee (340,000 UZS) per month for state pension logs.",
        "Registered craftspeople pay 0% standard taxes on production of approved crafts."
      ]
    },
    {
      title: "🏠 Legal Property Lease & Rentals",
      overview: "Whether you rent out or move in, guarantee your civil protection via free system listings.",
      rules: [
        "Register rent contracts online for free on the state E-ijara website.",
        "Notary approvals are optional; digital registrations have full statutory validity.",
        "Flat 12% Personal Income Tax applies to verified lease payouts."
      ]
    }
  ]
};

// Immediate clickable simple questions for quick usage
const PRESET_TOPICS = {
  uz: [
    { label: "💼 Ishdan bo'shatish to'lovlari", text: "Tashkilot qisqarganda xodimga qonun bo'yicha qanday kompensatsiyalar berilishi shart?" },
    { label: "🏢 YTT soliq va imtiyozlari", text: "Yakka tartibdagi tadbirkor ochsam qancha soliq to'layman va qanday oson imtiyozlar bormi?" },
    { label: "🏠 Ijara shartnomasini tuzish", text: "Uyni ijaraga bersam soliq idorasida qanday bepul ro'yxatdan o'tkazaman? Tartibi sodda tilidami?" },
    { label: "🤰 Dekret va bola nafaqasi", text: "Ayollarga homiladorlik nafaqasi va bola 2 yoshga to'lguncha beriladigan pullar qanday hal bo'ladi?" }
  ],
  ru: [
    { label: "💼 Выплаты при увольнении", text: "Какое выходное пособие положено работнику по закону при сокращении штата?" },
    { label: "🏢 Налоги для открытия ИП", text: "Какие налоги платит индивидуальный предприниматель в Узбекистане простыми словами?" },
    { label: "🏠 Регистрация аренды жилья", text: "Как бесплатно зарегистрировать аренду квартиры в налоговой через интернет?" },
    { label: "🤰 Пособие по беременности (Декрет)", text: "Как рассчитываются декретные выплаты и отпуск по уходу за ребенком?" }
  ],
  en: [
    { label: "💼 Redundancy Severance Pay", text: "How much severance allowance should an employee receive under the new labor regulations?" },
    { label: "🏢 Business flat taxes (Sole Trader)", text: "What flat taxes apply for a Sole Proprietorship (YTT) and how is pension monitored?" },
    { label: "🏠 Registering a Lease on E-ijara", text: "How can I register my apartment rental contract online without spending money on a notary?" },
    { label: "🤰 Maternity support allowances", text: "What are the rules and financial terms for pregnancy leaves and child support?" }
  ]
};

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<"uz" | "ru" | "en">("uz");
  const [activeTab, setActiveTab] = useState<"chat" | "calc" | "laws">("chat");
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);

  // Chat engine
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    role: "user" | "model";
    text: string;
    timestamp: string;
  }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Quick calculator values
  const [grossInput, setGrossInput] = useState<number>(3500000);
  const [severanceBase, setSeveranceBase] = useState<number>(3500000);
  const [severanceMultiplier, setSeveranceMultiplier] = useState<number>(1);

  const endOfChatRef = useRef<HTMLDivElement>(null);
  const t = LOCALIZATION[selectedLanguage];

  // Initialize and refresh greeting messages when user switches language
  useEffect(() => {
    setChatMessages([
      {
        id: 1,
        role: "model",
        text: t.initMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, [selectedLanguage]);

  // Handle immediate scrolling down when new message is typed or tab switches
  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping, activeTab]);

  // Calculate taxes instantly
  const calcTax = Math.round(grossInput * 0.12);
  const calcNet = grossInput - calcTax;

  // Calculate severance instantly
  const calcSeveranceTotal = severanceBase * severanceMultiplier;

  // Simple preset prompt selection
  const handleSelectPreset = (text: string) => {
    setInputMessage(text);
  };

  // Chat message submit handler
  const handleSendPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage.trim();
    setInputMessage("");

    // Add user question to dialog list
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);

    setIsTyping(true);

    try {
      // Package last 4 turns for conversational context
      const chatHistorySubset = chatMessages
        .slice(-4)
        .map(msg => ({
          role: msg.role,
          content: msg.text
        }));

      const res = await fetch("/api/simulate-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          language: selectedLanguage,
          history: chatHistorySubset
        })
      });

      if (!res.ok) {
        throw new Error(`Server status: ${res.status}`);
      }

      const bodyData = await res.json();
      const answerReply = bodyData.reply || "Hech qanday ma'lumot topilmadi.";

      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now() + 50,
          role: "model",
          text: answerReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err: any) {
      console.error("Legal counsel api failed, loading custom local advice draft", err);
      
      // Friendly, robust offline explanation
      const systemCrashFallbacks = {
        uz: `⚠️ **Bog'lanishda kichik nosozlik yuz berdi.** Biz tezkor offline-yordamchini faollashtirdik:\n\n*   **O'zbekiston Qonunchiligi qoidasi:** Har qanday mehnat munosabati, ijara yoki tadbirkorlik albatta yozma shartnoma orqali rasmiylashtirilishi kerak. Bu sizning huquqlaringizni 100% kafolatlaydi.\n*   **Kafolatlangan imtiyozlar:** Oyliklarning asossiz kechikishi jarimaga sabab bo'ladi.\n*   *Tegishli bepul xizmat:* Batafsil ko'rsatmalar uchun bitta qo'ng'iroq bilan ishlatiladigan **advice.uz** portalidan bepul foydalanishingiz mumkin.`,
        ru: `⚠️ **Возникла небольшая задержка соединения.** Мы активировали надежного автономного помощника:\n\n*   **Закон Узбекистана:** Любые трудовые отношения или аренда должны строго закрепляться в письменной форме. Это гарантирует вашу безопасность.\n*   **Совет:** При задержке выплат работодатель несет установленную денежную ответственность.\n*   *Бесплатные ресурсы:* Вы можете обратиться на официальный государственный ресурс **advice.uz** для живой консультации.`,
        en: `⚠️ **A brief connection blip occurred.** We loaded our safe offline advisor immediately:\n\n*   **Uzbekistan Law Rule:** All official arrangements, rental logs, and employment careers should be backed by signed written contracts to protect your legal outcomes.\n*   **Recommendations:** If salary is delayed, statutory financial offsets generate automatically.\n*   *Referral support:* Browse the national public consulting board **advice.uz** for free, state-guaranteed guidance.`
      };

      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now() + 55,
          role: "model",
          text: systemCrashFallbacks[selectedLanguage],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Convert markdown bold and code to HTML representation easily
  const renderResponseMarkdown = (rawText: string) => {
    if (!rawText) return "";
    let safeHtml = rawText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    safeHtml = safeHtml.replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-slate-900'>$1</strong>");
    safeHtml = safeHtml.replace(/\*(.*?)\*/g, "<strong class='font-bold text-slate-900'>$1</strong>");
    safeHtml = safeHtml.replace(/`(.*?)`/g, "<span class='bg-emerald-50 text-emerald-800 font-mono text-xs px-1 py-0.5 rounded'>$1</span>");
    safeHtml = safeHtml.replace(/\n/g, "<br/>");
    return <span dangerouslySetInnerHTML={{ __html: safeHtml }} />;
  };

  // Save specific text to clipboard
  const handleCopyClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F2] text-slate-800 antialiased font-sans flex flex-col justify-between selection:bg-emerald-600 selection:text-white" id="legal-layout-app">
      
      {/* 🏛️ Simplified, Academic & Elegant Header */}
      <header className="bg-white border-b border-emerald-100 py-5 px-4 shadow-xs" id="master-header">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-sm shadow-emerald-600/25">
              ⚖️
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">{t.title}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  Bepul Virtual Advokat
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{t.subtitle}</p>
            </div>
          </div>

          {/* Clean Academic Language Selectors */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Languages className="w-4 h-4 text-slate-400 ml-1.5 shrink-0" />
            <button 
              onClick={() => setSelectedLanguage("uz")}
              className={`px-3 py-1 rounded text-xs font-extrabold transition-all cursor-pointer uppercase ${
                selectedLanguage === "uz" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Uz
            </button>
            <button 
              onClick={() => setSelectedLanguage("ru")}
              className={`px-3 py-1 rounded text-xs font-extrabold transition-all cursor-pointer uppercase ${
                selectedLanguage === "ru" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Ru
            </button>
            <button 
              onClick={() => setSelectedLanguage("en")}
              className={`px-3 py-1 rounded text-xs font-extrabold transition-all cursor-pointer uppercase ${
                selectedLanguage === "en" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              En
            </button>
          </div>

        </div>
      </header>

      {/* 🧭 Super Clear and Big Navigation Tags. Absolutely zero confusion! */}
      <nav className="max-w-2xl mx-auto w-full px-4 mt-6" id="uncluttered-navigation">
        <div className="bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs flex justify-between gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-3 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t.tabChat}</span>
          </button>
          <button
            onClick={() => setActiveTab("calc")}
            className={`flex-1 py-3 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "calc"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{t.tabCalc}</span>
          </button>
          <button
            onClick={() => setActiveTab("laws")}
            className={`flex-1 py-3 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "laws"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.tabLaws}</span>
          </button>
        </div>
      </nav>

      {/* 📋 Central Main Workspace */}
      <main className="max-w-2xl mx-auto w-full px-4 py-4 flex-1 flex flex-col justify-start" id="simplistic-workspace">
        
        {/* Intro explanatory paragraph - minimal and neat */}
        <div className="mb-5 bg-white rounded-xl p-4 border border-emerald-100/50 shadow-xs flex items-center gap-3">
          <Scale className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="text-xs text-slate-600 leading-relaxed font-medium">
            <strong className="text-slate-900 block font-extrabold">{t.description}</strong>
            O'zbekistonda tadbirkorlik, mehnat kodeksi va turli to'lov va qoidalar oddiy tilda.
          </div>
        </div>

        {/* ==================== SCREEN 1: 💬 SUHBAT SCREEN ==================== */}
        {activeTab === "chat" && (
          <div className="flex flex-col gap-4 flex-1" id="chat-frame">
            
            {/* The main elegant conversation box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden max-w-full">
              
              {/* Online indicator header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-bold text-slate-700">{t.onlineStatus}</span>
                </div>
                <span className="text-[10px] bg-slate-200/80 text-slate-500 px-2 py-0.5 rounded font-bold font-mono uppercase">
                  LexGlobal AI v1.5
                </span>
              </div>

              {/* Message scroll container */}
              <div className="p-4 overflow-y-auto space-y-4 max-h-[400px] min-h-[300px] bg-slate-50/50 border-b border-slate-100" id="scrollable-messages">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-xl px-4 py-3 border text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.role === "user" 
                        ? "bg-emerald-600 border-emerald-500 text-white rounded-tr-none" 
                        : "bg-white border-slate-200 text-slate-800 rounded-tl-none"
                    }`}>
                      
                      {/* Name of sender under the balloon */}
                      <div className="flex justify-between items-center gap-3 mb-1 text-[9px] font-bold tracking-wider uppercase">
                        <span className={msg.role === "user" ? "text-emerald-100" : "text-emerald-700"}>
                          {msg.role === "user" ? "Siz" : "LexGlobal Advisor"}
                        </span>
                        {msg.role === "model" && (
                          <button
                            onClick={() => handleCopyClipboard(msg.text, msg.id)}
                            className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold cursor-pointer transition-all"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>{t.copied}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{t.copyBtn}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="whitespace-pre-line font-medium text-slate-900 leading-normal">
                        {msg.role === "user" ? (
                          msg.text
                        ) : (
                          renderResponseMarkdown(msg.text)
                        )}
                      </div>

                      <div className={`text-[8.5px] text-right mt-1 font-mono ${msg.role === "user" ? "text-emerald-200" : "text-slate-400"}`}>
                        {msg.timestamp}
                      </div>

                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none px-4 py-3.5 text-xs shadow-xs flex items-center gap-2">
                      <span className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-bold">{t.waitingText}</span>
                    </div>
                  </div>
                )}
                
                <div ref={endOfChatRef} />
              </div>

              {/* Touch-Friendly instant prompt selectors. Absolutely no coding or tech knowledge needed! */}
              <div className="p-3 bg-slate-50 border-b border-slate-200" id="clickable-presets">
                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>{t.quickInquiryHeader}</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_TOPICS[selectedLanguage].map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(topic.text)}
                      className="p-3 bg-white hover:bg-emerald-50/50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-all cursor-pointer duration-150"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[11px] font-black text-slate-800 truncate">{topic.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{topic.text}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean, Simple Input Form */}
              <form onSubmit={handleSendPrompt} className="p-3 bg-white flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={t.chatPlaceholder}
                  className="flex-1 bg-slate-100 hover:bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 px-3 py-3 text-xs sm:text-sm text-slate-800 rounded-xl focus:outline-none transition-all font-semibold"
                  disabled={isTyping}
                  id="user-input-box"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
                    inputMessage.trim() && !isTyping 
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 cursor-pointer" 
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  }`}
                  id="send-button-control"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Simple Footer disclaimer */}
              <div className="bg-slate-50/70 border-t border-slate-150 px-4 py-2.5 text-center text-[9.5px] text-slate-400 leading-normal font-sans">
                {t.disclaimer} • <span className="font-bold text-slate-500">{t.moreResources}</span>
              </div>

            </div>

          </div>
        )}


        {/* ==================== SCREEN 2: 🧮 TAX CALCULATOR ==================== */}
        {activeTab === "calc" && (
          <div className="space-y-6 animate-fade-in" id="calculator-frame">
            
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-emerald-900 text-xs sm:text-sm uppercase">{t.taxHeader}</h4>
                <p className="text-emerald-800 text-xs leading-relaxed mt-0.5">{t.taxSub}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card A: 12% Flat Income tax */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">💸 Ish haqi solig'i (12% JShDS)</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded">Daromad Solig'i</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">{t.salaryLabel}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="100000"
                      min="0"
                      value={grossInput}
                      onChange={(e) => setGrossInput(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl text-sm font-black font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400 font-mono">so'm</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-150">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold">{t.taxResultLabel}</span>
                    <span className="font-extrabold text-red-600 font-mono">-{calcTax.toLocaleString()} so'm</span>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="font-extrabold text-slate-800">{t.takeHomeLabel}</span>
                    <span className="font-black text-emerald-700 font-mono text-base">{calcNet.toLocaleString()} so'm</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">
                  O'zbekiston Soliq kodeksiga binoan barcha shaxslar uchun daromad solig'i stavkasi bir xil — tekis 12% etib belgilangan.
                </p>
              </div>

              {/* Card B: Redundancy Severance pay */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">💼 Ishdan bo'shatish nafaqasi</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded">Kompensatsiya</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">{t.severanceLabel}</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="100000"
                        min="0"
                        value={severanceBase}
                        onChange={(e) => setSeveranceBase(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl text-sm font-black font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400 font-mono">so'm</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">{t.severanceTypeLabel}</label>
                    <select
                      value={severanceMultiplier}
                      onChange={(e) => setSeveranceMultiplier(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none"
                    >
                      <option value={1}>{t.monthsBasic}</option>
                      <option value={2}>{t.monthsRedundancy}</option>
                      <option value={3}>{t.monthsHighExperience}</option>
                    </select>
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center">
                    <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wide">{t.severanceResultLabel}</span>
                    <span className="text-lg font-black text-emerald-700 font-mono mt-1">{calcSeveranceTotal.toLocaleString()} so'm</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">
                  Asos: O'zbekiston Respublikasining yangi Mehnat kodeksi 109-moddasi.
                </p>
              </div>

            </div>

            {/* Banner info rule message */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 text-slate-600">
              <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-extrabold text-slate-900 block uppercase tracking-wide text-[10px] mb-1">Hunarmand va YTT uchun soliq yengilligi:</span>
                Yillik aylanma 100 mln so'mdan oshmasa, daromad solig'i muvofiq ravishda **0%** hisoblanadi. Yakka tartibdagi tadbirkor faqat oyiga 1 marta ijtimoiy soliq (340 000 so'm) to'lab boradi.
              </div>
            </div>

          </div>
        )}

        {/* ==================== SCREEN 3: 📜 EXPLAINED LAWS SCREEN ==================== */}
        {activeTab === "laws" && (
          <div className="space-y-4 animate-fade-in" id="laws-frame">
            
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">O'zbekiston Qonunlarining Oddiy Tushuntirishi</h3>
              <p className="text-xs text-slate-500 mt-1">Har bir inson bilishi shart bo'lgan eng muhim huquqlar oddiy va tushunarli tilda.</p>
            </div>

            <div className="space-y-3">
              {CODES_DATA[selectedLanguage].map((item, id) => (
                <div key={id} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">{item.title}</h4>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed font-semibold">{item.overview}</p>
                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Asosiy 3 ta qoida:</span>
                    <ul className="space-y-1.5">
                      {item.rules.map((rule, keyId) => (
                        <li key={keyId} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                          <span className="text-emerald-600 font-extrabold">•</span>
                          <span className="font-medium">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* 🏛️ Modern Minimalist Footer */}
      <footer className="bg-white border-t border-emerald-100 py-6 mt-12 text-center" id="master-footer">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 font-sans justify-center">
            <span className="text-sm font-black text-slate-900 tracking-tight">LexGlobal AI</span>
            <span className="text-xs text-slate-400">| Global & Uzbek Law Advisory</span>
          </div>
          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} LexGlobal AI. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </footer>

    </div>
  );
}
