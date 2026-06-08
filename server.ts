import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization function for the Gemini SDK to prevent startup crashes when the API key is not configured yet.
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined in Secrets or .env");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Prompt structures for LexGlobal Legal Assistant with international capability & Uzbekistan law depth
const SYSTEM_INSTRUCTIONS = {
  uz: (
    "Siz LexGlobal deb nomlangan xalqaro professional yuridik yordamchisiz. " +
    "Siz foydalanuvchilarga xalqaro huquqiy normalar va O'zbekiston Respublikasining rasmiy qonunchiligi bo'yicha javob bera olasiz. " +
    "Agar savol O'zbekistonga doir bo'lsa, albatta mamlakat qonunlari va Kodekslariga asosan batafsil yoki aniq qonun moddalari bilan (E-ijara, Mehnat Kodeksi, Soliq Kodeksi kabi rasmiy ma'lumotlardan foydalanib) javob bering. " +
    "Xalqaro savollarga esa tegishli xalqaro normalar bo'yicha javob bering. Javoblaringiz tushunarli, rasmiy va lo'nda bo'lsin."
  ),
  ru: (
    "Вы профессиональный юридический ассистент по имени LexGlobal, специализирующийся на международном праве и законодательстве Республики Узбекистан. " +
    "Вы можете консультировать пользователей как по международным правовым нормам, так и по законам Узбекистана. " +
    "Если вопрос касается Узбекистана, обязательно давайте ответ на основе законов страны и Кодексов (используя официальные данные, такие как Трудовой кодекс, Налоговый кодекс, система E-ijara и т.д.). " +
    "На международные вопросы отвечайте на основе применимых глобальных норм. Ваши ответы должны быть четкими, официальными и лаконичными."
  ),
  en: (
    "You are a professional legal assistant named LexGlobal, specializing in international law as well as the national legislation of the Republic of Uzbekistan. " +
    "You advise users on both global legal standards and Uzbekistan's legal codes. " +
    "For inquiries about Uzbekistan, answer specifically using the country's statutes and codes (leveraging national knowledge like the Labor Code, Tax Code, E-ijara platform, etc.). " +
    "For global queries, provide insights based on standard international law guidelines. Keep responses professional, clear, and concise."
  )
};

// API Endpoint to simulate LexAI Telegram Bot responses with Gemini 3.5 Flash
app.post("/api/simulate-chat", async (req, res) => {
  try {
    const { prompt, language = "uz", history = [] } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    let ai: any = null;
    try {
      ai = getGeminiClient();
    } catch (e: any) {
      console.warn("Gemini client initialization was bypassed due to missing API Key:", e.message);
    }

    const systemInstruction = SYSTEM_INSTRUCTIONS[language as keyof typeof SYSTEM_INSTRUCTIONS] || SYSTEM_INSTRUCTIONS.uz;

    // Map conversation history to cleaned alternating turns to guarantee API compatibility
    const rawTurns: Array<{ role: "user" | "model"; text: string }> = [];
    if (Array.isArray(history)) {
      history.forEach((msg: { role: string; content: string }) => {
        if (msg.content && (msg.role === "user" || msg.role === "model")) {
          rawTurns.push({
            role: msg.role === "user" ? "user" : "model",
            text: msg.content
          });
        }
      });
    }
    
    // Append current prompt
    rawTurns.push({ role: "user", text: prompt });

    // Deduplicate and merge consecutive roles of the same type to avoid validation errors
    const alternatingTurns: Array<{ role: "user" | "model"; text: string }> = [];
    for (const turn of rawTurns) {
      if (alternatingTurns.length === 0) {
        alternatingTurns.push(turn);
      } else {
        const lastTurn = alternatingTurns[alternatingTurns.length - 1];
        if (lastTurn.role === turn.role) {
          lastTurn.text += "\n" + turn.text;
        } else {
          alternatingTurns.push(turn);
        }
      }
    }

    // Standard Gemini requires the interaction chain to start with the "user" role
    while (alternatingTurns.length > 0 && alternatingTurns[0].role !== "user") {
      alternatingTurns.shift();
    }

    if (alternatingTurns.length === 0) {
      res.status(400).json({ error: "No valid user query turns were provided." });
      return;
    }

    // Build standard contents payload
    const chatParts = alternatingTurns.map(turn => ({
      role: turn.role,
      parts: [{ text: turn.text }]
    }));

    // List of reliable models to fall back to if the default is unavailable/overloaded
    const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-pro-preview"];
    let lastError: any = null;
    let reply = "";

    // Offline Law Advisor Helper: Local highly-detailed databases of questions in Uz, Ru, En
    const LOCAL_LAW_DB = {
      uz: [
        {
          keys: ["bosh", "bo'sh", "bo'shatish", "kompensatsiya", "nafaqa", "imtioz", "shartnoma bekor", "ishdan"],
          reply: "**Mehnat Kodeksiga muvofiq ishdan bo'shatilganda beriladigan to'lovlar:**\n\n" +
            "1. **Asosiy qoidalar (109-modda):** Tashkilot qisqarganda yoki tugatilganda xodimga kamida **1 oylik o'rtacha ish haqi** miqdorida kafolatlangan ishdan bo'shatish nafaqasi to'lanadi.\n\n" +
            "2. **Qo'shimcha kafolatlar (67-modda):** Agar yangi ishga joylashmasangiz, ikkinchi oy uchun ham o'rtacha oylik maosh saqlanadi (tuman bandlik markazi tomonidan tasdiqlansa, uchinchi oy uchun ham).\n\n" +
            "3. **Ogohlantirish muddati:** Ish beruvchi sizni kamida **2 oy oldin** yozma ravishda ogohlantirishi yoki buning o'rniga kelishuv bo'yicha mos mutanosib kompensatsiya to'lashi shart.\n\n" +
            "4. **Foydalanilmagan ta'tillar:** Barcha foydalanilmagan mehnat ta’tillari uchun to'liq pul kompensatsiyasi majburiy ravishda to'lab beriladi."
        },
        {
          keys: ["ytt", "yatt", "tadbirkor", "hunarmand", "biznes", "ochish", "firma", "patent"],
          reply: "**Yakka Tartibdagi Tadbirkor (YTT) bo'yicha soliqlar va qoidalar:**\n\n" +
            "1. **Ijtimoiy soliq:** YTTlar o'z staji va pensiyasi uchun oyiga kamida **1 baravar BHM** (hozirda statusga ko'ra 340 000 so'm) ijtimoiy soliq to'laydi.\n\n" +
            "2. **Daromad solig'i:** Yillik aylanma (tushum) **100 million so'mgacha** bo'lsa, jismoniy shaxs daromad solig'idan to'liq ozod qilinadi (0%).\n\n" +
            "3. **Aylanma hajmi oshganda:** Yillik tushum 100 million so'mdan 1 milliard so'mgacha bo'lsa, tadbirkor ixtiyoriy ravishda aylanmadan olinadigan soliqni **4% tekis stavka**da yoki qat'iy belgilangan soliq ko'rinishida to'lashi mumkin.\n\n" +
            "4. **Hunarmandlar uchun imtiyoz:** Respublika Hunarmand uyushmasiga a'zo bo'lganlar ko'plab soliq to'lovlaridan to'liq ozod etilgan."
        },
        {
          keys: ["ijara", "uyni", "ijaraga", "e-ijara", "shartnoma", "soliq chek", "propiska"],
          reply: "**Uyni ijaraga berish va rasmiylashtirish tartibi:**\n\n" +
            "1. **Majburiy ro'yxatdan o'tkazish:** Turar joy ijara shartnomasi E-ijara (soliq organlari tizimi) portalida bepul, onlayn tarzda ro'yxatdan o'tkazilishi shart. Notariusda tasdiqlash majburiy EMAS.\n\n" +
            "2. **Daromad solig'i stavkasi:** Saytingiz va uyingiz ijara daromadidan **12% jismoniy shaxslar daromad solig'i** (JShDS) to'lanadi.\n\n" +
            "3. **Eng kam soliq chegarasi:** Soliq idorasi har bir kv.m uchun eng kam ijara miqdorini belgilagan bo'lib, hisob-kitob shundan kam bo'lmagan stavkada amalga oshiriladi.\n\n" +
            "4. **Ro'yxatdan o'tkazmaslik oqibati:** Jarimalar xavfi mavjud. Shuning uchun bepul soliq ilovasi orqali onlayn e-ijara shartnomasini tuzish tavsiya etiladi."
        },
        {
          keys: ["dekret", "bola", "homilador", "tug'ruq", "nafaqa", "ayol"],
          reply: "**Maternity (Dekret) va bola parvarishi bo'yicha qonuniy huquqlar:**\n\n" +
            "1. **Tug'ruq ta'tili muddati:** Homilador ayollarga tug'ruqdan oldin **70 kun** va tug'ruqdan keyin **56 kun** (murakkab tug'ruqda 70 kun) haq to'lanadigan ta'til kafolatlanadi.\n\n" +
            "2. **Homiladorlik nafaqasi:** Davlat ijtimoiy suhbat jamg'armasi yoki ish beruvchi tomonidan ta'til davri uchun tibbiy varaqaga muvofiq nafaqa to'lanadi.\n\n" +
            "3. **Bola parvarishlash ta'tili:** Bola **2 yoshga** to'lgunga qadar har oylik bolalar nafaqasi oilaning umumiy daromadididan kelib chiqib Kambag'allikni qisqartirish vazirligi tomonidan ajratiladi. Ish joyi esa saqlanib qoladi.\n\n" +
            "4. **Ishdan bo'shatmaslik kafolati:** Mehnat kodeksiga ko'ra homilador va 3 yoshgacha bolasi bor ayollarni ish beruvchi tashabbusi bilan ishdan bo'shatish qat'iyan taqiqlanadi (korxona to'liq tugatilgan hollar bundan mustasno)."
        },
        {
          keys: ["soliq", "foiz", "daromad", "jshds", "oylik", "daromad solig'i", "nds", "pension"],
          reply: "**Soliq tizimi va Jismoniy shaxslar daromad solig'i (JShDS):**\n\n" +
            "1. **Asosiy stavka:** O'zbekiston Respublikasida jismoniy shaxslarning deyarli barcha mehnat daromadlari uchun **12% tekis soliq stavkasi** amal qiladi.\n\n" +
            "2. **Ijtimoiy soliq:** Ishlovchi fuqarolar uchun oylikdan qo'shimcha ravishda fuqarolar jamg'armalariga ijtimoiy ajratmalar korxona hisobidan to'lanadi.\n\n" +
            "3. **Soliq imtiyozlari:** Ta'lim shartnomalari (kontrakt), uylarni ipotekaga sotib olish kabi xarajatlarga yo'naltirilgan oylik maoshlar daromad solig'idan ozod qilinadi (soliq qaytarib beriladi).\n\n" +
            "4. **Hisob-kitob qilish:** Ish beruvchi (soliq agenti o'laroq) soliqni sizga oylik berishdan oldin ushlab qoladi, siz qo'lingizgacha sof pul (Netto) olasiz."
        }
      ],
      ru: [
        {
          keys: ["сокраще", "увольнение", "уволить", "выходное", "пособие", "компенс", "кодекс", "работа"],
          reply: "**Выплаты при увольнении согласно Трудовому кодексу РУз:**\n\n" +
            "1. **Основное пособие (Статья 109):** При сокращении штата или ликвидации сотруднику гарантируется выплата выходного пособия в размере не менее **одного среднемесячного оклада**.\n\n" +
            "2. **Дополнительные гарантии (Статья 67):** На период поиска работы за сотрудником сохраняется средняя зарплата на второй месяц (и даже на третий месяц при регистрации в центре содействия занятости в течение 30 дней).\n\n" +
            "3. **Сроки предупреждения:** Работодатель обязан письменно уведомить вас минимум за **2 месяца** до сокращения, либо выплатить соразмерную денежную компенсацию вместо этого срока.\n\n" +
            "4. **Компенсация за отпуска:** Обязательна полная выплата компенсации за все неиспользованные ежегодные трудовые отпуска."
        },
        {
          keys: ["ип", "бизнес", "предпринима", "налог", "патент", "социальный", "открыть"],
          reply: "**Налогообложение и условия для Индивидуальных Предпринимателей (ИП):**\n\n" +
            "1. **Социальный налог:** ИП уплачивает обязательный социальный налог для начисления трудового стажа в размере **1 БРВ в месяц** (на сегодня это 340 000 сум).\n\n" +
            "2. **Подоходный налог (0%):** Если годовой оборот (выручка) составляет **до 100 миллионов сум**, доход ИП полностью освобождается от налога.\n\n" +
            "3. **Превышение 100 млн сум:** Если оборот составляет от 100 млн до 1 млрд сум, предприниматель может выбрать уплату налога с оборота по **фиксированной ставке 4%** либо в фиксированной форме."
        },
        {
          keys: ["аренда", "квартира", "сдать", "договор", "е-ижара", "налоги", "жилье"],
          reply: "**Правила аренды жилья и регистрации договора в Узбекистане:**\n\n" +
            "1. **Регистрация договора:** Договор аренды жилого помещения или квартиры должен быть обязательно зарегистрирован онлайн через государственный сервис E-ijara. Нотариальное заверение НЕ требуется.\n\n" +
            "2. **Налог на доходы:** С доходов от сдачи имущества в аренду уплачивается **налог на доходы физических лиц в размере 12%**.\n\n" +
            "3. **Минимальная планка:** Налоговые органы устанавливают минимальный размер аренды за 1 кв.м площади в зависимости от города, ниже которого расчет налога не производится.\n\n" +
            "4. **Штрафы:** Отсутствие зарегистрированного договора влечет административные штрафы, поэтому регистрация настоятельно рекомендуется для правовой безопасности."
        },
        {
          keys: ["декрет", "беремен", "роды", "пособие", "ребенок", "женщин", "мама"],
          reply: "**Декретные выплаты и трудовые гарантии для матерей:**\n\n" +
            "1. **Продолжительность отпуска:** Женщинам предоставляется отпуск по беременности и родам продолжительностью **70 дней до родов** и **56 дней после родов** с выплатой пособия.\n\n" +
            "2. **Расчет пособия:** Пособие выплачивается на основе листка нетрудоспособности из средств социального страхования или работодателем.\n\n" +
            "3. **Отпуск по уходу за ребенком:** До достижения ребенком возраста **2 лет** выплачивается ежемесячное социальное пособие, назначаемое органами соцзащиты семьям на основе оценки нуждаемости.\n\n" +
            "4. **Запрет на увольнение:** Законодательство строго запрещает увольнение беременных женщин и женщин с детьми до 3 лет по инициативе работодателя."
        }
      ],
      en: [
        {
          keys: ["severance", "layoff", "dismissal", "termination", "rights", "work", "compensation", "employer"],
          reply: "**Severance benefits and rights upon dismissal under the Labor Code:**\n\n" +
            "1. **Statutory Severance (Article 109):** In case of redundancy or organization closure, the employee is guaranteed severance pays worth at least **1 month's average wage**.\n\n" +
            "2. **Extended Unemployment Safety (Article 67):** If no job is found, average salary is preserved for the 2nd month (and up to the 3rd if registered under the labor exchange within 30 days).\n\n" +
            "3. **Notice Periods:** The supervisor must notify you in writing **2 months** in advance or pay equal cash offsets.\n\n" +
            "4. **Vacation Cashouts:** Cash compensation for all unused annual paid leave balances must be fully resolved upon checkout."
        },
        {
          keys: ["sole trader", "ie", "entrepreneur", "business", "tax", "registration", "opening"],
          reply: "**Sole Proprietor (IE/YTT) taxation rules in Uzbekistan:**\n\n" +
            "1. **Social Contribution Fee:** Entrepreneurs pay a basic social levy of **1 x Basic Reference Value (BRV)** monthly (currently 340,000 UZS) to gain state pension credits.\n\n" +
            "2. **Tax Indemnity (0%):** If your yearly turnover is **under 100 Million UZS**, you are fully exempt from individual income tax (0% PIT).\n\n" +
            "3. **Turnovers exceeding 100M:** For yearly earnings between 100M and 1 Billion UZS, Sole Traders pay flat **4% turnover tax** or choose fixed monthly fiscal installments.\n\n" +
            "4. **Artisan Privileges:** Craftsmen registered with the national association enjoy total exemptions from prime taxations."
        },
        {
          keys: ["rental", "lease", "apartment", "home", "e-ijara", "housing", "notary"],
          reply: "**Home rental rules and registration updates:**\n\n" +
            "1. **Mandatory Logging:** Housing leases must use an active contract filed on the national E-ijara tax platform. NOTARY seals are not mandatory.\n\n" +
            "2. **Rental Income tax:** Personal income gained from properties is taxed at the flat rate of **12% Personal Income Tax (PIT)**.\n\n" +
            "3. **Statutory floor pricing:** The target rental base is compiled by square meter minimum thresholds set for metropolitan centers."
        },
        {
          keys: ["maternity", "pregnant", "child", "allowance", "women", "mother"],
          reply: "**Maternity leaves and mother protection codes:**\n\n" +
            "1. **Paid Absences:** Women are entitled to **70 days pre-birth** and **56 days post-birth** fully paid maternity leave cycles.\n\n" +
            "2. **Termination Ban:** Employers are strictly legally prohibited from terminating pregnant workers or mothers with kids younger than 3 years."
        }
      ]
    };

    // Fast local rule matcher to prioritize instant/reliable responses and prevent 503s
    const normalizedPrompt = prompt.toLowerCase();
    const currentLang = (language === "ru" || language === "en") ? language : "uz";
    const localMatches = LOCAL_LAW_DB[currentLang];
    let matchedOfflineResponse = "";

    for (const item of localMatches) {
      if (item.keys.some(key => normalizedPrompt.includes(key))) {
        matchedOfflineResponse = item.reply;
        break;
      }
    }

    if (ai) {
      // Try Gemini models sequentially
      for (const modelToUse of modelsToTry) {
        let modelSuccess = false;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`Sending prompt to Gemini using model: ${modelToUse} (Attempt ${attempt}/2)`);
            const response = await ai.models.generateContent({
              model: modelToUse,
              contents: chatParts,
              config: {
                systemInstruction: systemInstruction,
                temperature: 0.3, // Lower temp for factual accuracy
                topP: 0.95,
              }
            });

            if (response && response.text) {
              reply = response.text;
              modelSuccess = true;
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`Model ${modelToUse} failed on attempt ${attempt}:`, err.message || err);
            await new Promise(resolve => setTimeout(resolve, 800)); // Small pause before retrying
          }
        }

        if (modelSuccess) {
          break;
        }
      }
    } else {
      console.warn("AI Client is not available or failed to initialize. Relying on local legal database.");
    }

    // Ultimate fallback handler
    if (!reply) {
      console.warn("Gemini service failed or was unavailable. Activating offline rule engine.");
      if (matchedOfflineResponse) {
        reply = matchedOfflineResponse + "\n\n*(Eslatma: Ushbu ma'lumot O'zbekiston Respublikasining 2026-yilgi qonunchilik normalari asosida offline-baza tomonidan tezkor taqdim etildi.)*";
      } else {
        const universalFallbacks = {
          uz: "Ushbu yuridik masala bo'yicha LexGlobal yuridik yordamchi tavsiyasi:\n\n1. **Qonuniy munosabatlar:** Amaldagi qonunlarga binoan har qanday mehnat, ijara yoki tadbirkorlik shartnomalari faqat **yozma shaklda** tuzilib shakllantirilishi lozim. Bu sizning huquqlaringizni kafolatlaydi.\n2. **O'zbekiston qonunlari:** Yangi Mehnat kodeksi va Soliq normalari xodimlarning barcha huquqlarini ishonchli himoya qiladi.\n3. **Amaliy tavsiya:** O'zbekiston bo'yicha aniq tushuntirishlar va bepul huquqiy maslahat uchun rasmiy `advice.uz` tizimidan ham foydalanishingiz mumkin.",
          ru: "Правовая рекомендация LexGlobal по вашему обращению:\n\n1. **Официальные контракты:** Согласно применимому законодательству, любые отношения (работа, аренда, бизнес) требуют обязательного заключения в **письменной форме**.\n2. **Законы Узбекистана:** Новый Трудовой и Налоговый кодексы гарантируют надежную защиту прав граждан.\n3. **Рекомендация:** Для детального разбора в Узбекистане вы можете также бесплатно обратиться на официальный правительственный портал `advice.uz`.",
          en: "LexGlobal guidance on your legal request:\n\n1. **Formal agreements:** Under standard legislation, all mutual arrangements, business licenses, or property leases must be documented in a physical or digital **written contract** for valid enforcement.\n2. **National statutes:** The modern Labor Code guards employee rights and businesses securely.\n3. **Alternative resource:** For free specialized consulting inside Uzbekistan, you can also browse the state-backed portal `advice.uz`."
        };
        reply = universalFallbacks[currentLang] + "\n\n*(Tizim offline rejimda ishlamoqda.)*";
      }
    }

    res.json({ reply });
  } catch (err: any) {
    console.error("Critical server endpoint failure:", err);
    res.status(500).json({ 
      error: "Tizimda kutilmagan xatolik yuz berdi. Iltimos qaytadan urining.",
      details: err.message
    });
  }
});

// Configure Vite or Static File Serving
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error("Error starting app:", err);
});
