export interface FileNode {
  name: string;
  path: string;
  language: string;
  content: string;
  description: string;
}

export const LEXAI_CODEBASE: FileNode[] = [
  {
    name: "requirements.txt",
    path: "requirements.txt",
    language: "text",
    description: "Defines the specific Python package dependencies required by the bot. Uses aiogram 3.x and google-generativeai.",
    content: `aiogram>=3.4.1
google-generativeai>=0.4.1
python-dotenv>=1.0.1
`
  },
  {
    name: ".env",
    path: ".env",
    language: "env",
    description: "Environment variables configuration. Put your Telegram Bot Token and Gemini API Key here.",
    content: `# Telegram Bot Token (obtained from Telegram's @BotFather)
TELEGRAM_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ

# Google Gemini API Key (obtained from Google AI Studio)
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
`
  },
  {
    name: "config.py",
    path: "config.py",
    language: "python",
    description: "Loads and validates application environment configurations from .env using dotenv.",
    content: `import os
from dotenv import load_dotenv

# Load key-value pairs from .env into environmental variables
load_dotenv()

# Extract variables safely
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Perform startup sanity check validation
if not TELEGRAM_TOKEN or TELEGRAM_TOKEN == "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ":
    raise ValueError("TELEGRAM_TOKEN is not configured correctly in .env. Please register an actual token using @BotFather.")

if not GEMINI_API_KEY or GEMINI_API_KEY == "AIzaSyYourGeminiApiKeyHere":
    raise ValueError("GEMINI_API_KEY is not configured correctly in .env. Please provide a real Google Gemini key from Google AI Studio.")
`
  },
  {
    name: "database.py",
    path: "database.py",
    language: "python",
    description: "Database model setup and connection pooling using SQLite. Creates tables and structures, records conversations and user state.",
    content: `import sqlite3
import os

DB_DIR = "data"
DB_PATH = os.path.join(DB_DIR, "lexai.db")

def init_db():
    """Initializes the SQLite database & bootstraps database schemas for users and chat history."""
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Create table 'users': stores user credentials and preferred languages
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            telegram_id INTEGER PRIMARY KEY,
            language TEXT DEFAULT 'uz',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 2. Create table 'messages': records the history of conversations for context retention
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER,
            role TEXT, -- 'user' or 'model'
            content TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
        )
    """)
    
    conn.commit()
    conn.close()

def get_connection():
    """Returns a standalone database connection handler."""
    return sqlite3.connect(DB_PATH)

def add_user(telegram_id: int, language: str = 'uz'):
    """Seeds a user on startup if they don't already exist in the system."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR IGNORE INTO users (telegram_id, language)
        VALUES (?, ?)
    """, (telegram_id, language))
    conn.commit()
    conn.close()

def update_user_language(telegram_id: int, language: str):
    """Sets/modifies the active interface language for the user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users SET language = ? WHERE telegram_id = ?
    """, (language, telegram_id))
    conn.commit()
    conn.close()

def get_user_language(telegram_id: int) -> str:
    """Retrieves the declared language preference for a given telegram_id."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT language FROM users WHERE telegram_id = ?", (telegram_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else 'uz'

def save_message(telegram_id: int, role: str, content: str):
    """Saves a message transmission context (user prompting or AI generated response)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO messages (telegram_id, role, content)
        VALUES (?, ?, ?)
    """, (telegram_id, role, content))
    conn.commit()
    conn.close()

def get_history(telegram_id: int, limit: int = 10):
    """Fetches a sequence list representing recent user-bot chat turns for context retrieval."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT role, content FROM messages 
        WHERE telegram_id = ? 
        ORDER BY timestamp DESC LIMIT ?
    """, (telegram_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return list(reversed(rows))
`
  },
  {
    name: "gemini_service.py",
    path: "services/gemini_service.py",
    language: "python",
    description: "Integrates Google Gemini model API, manages custom Uzbek law system instructions, and returns responses async.",
    content: `import google.generativeai as genai
from config import GEMINI_API_KEY
import logging

logger = logging.getLogger(__name__)

# Configure Google Gemini client with verified API key
genai.configure(api_key=GEMINI_API_KEY)

# Use the rapid, high-performing model for lightweight chatbot interactions
MODEL_NAME = "gemini-1.5-flash"

SYSTEM_INSTRUCTIONS = {
    'uz': (
        "Siz O'zbekiston Respublikasi qonunlari bo'yicha LexAI deb nomlangan professional yuridik yordamchisiz. "
        "Faqat O'zbekiston qonunchiligiga (Soliq kodeksi, Mehnat kodeksi, Fuqarolik kodeksi, Ma'muriy javobgarlik va boshqalar) asoslanib javob bering. "
        "Javoblaringiz mutlaqo aniq, qat’iy, rasmiy va imkon qadar lo'nda (qisqa, tushunarli) bo'lsin. "
        "Mavzuga aloqador qonun moddalarini tilga oling. "
        "Murakkab masalalarda bepul huquqiy portallar ('madad.uz') yoki litsenziyalangan advokatga murojaat qilishni tavsiya eting."
    ),
    'ru': (
        "Вы профессиональный юридический ассистент по имени LexAI, специализирующийся на законах Республики Узбекистан. "
        "Отвечайте исключительно на основе законодательства Узбекистана (Трудовой, Налоговый, Гражданский кодексы и др.). "
        "Ваши ответы должны быть абсолютно четкими, официальными, лаконичными и краткими. "
        "По возможности ссылайтесь на конкретные статьи законодательства. "
        "В сложных случаях рекомендуйте государственные центры правовой помощи ('madad.uz') или лицензированных адвокатов."
    ),
    'en': (
        "You are a professional legal assistant named LexAI, specializing in the laws of the Republic of Uzbekistan. "
        "Answer exclusively based on Uzbek legislation (Labor, Tax, Civil codes, etc.). "
        "Your responses must be highly accurate, professional, formal, and concise. "
        "Cite specific chapters or articles of the Uzbek legislation whenever relevant. "
        "For complex issues, advise consulting free public legal portals ('madad.uz') or a licensed attorney."
    )
}

async def generate_response(prompt: str, language: str, history=None) -> str:
    """Queries Google Gemini model asynchronously with contextual awareness and custom system roles."""
    try:
        instruction = SYSTEM_INSTRUCTIONS.get(language, SYSTEM_INSTRUCTIONS['uz'])
        
        # Build contents containing structured history + current user chat prompt
        formatted_contents = []
        
        if history:
            for role, content in history:
                formatted_contents.append({
                    "role": "user" if role == "user" else "model",
                    "parts": [content]
                })
        
        # Append latest prompt
        formatted_contents.append({
            "role": "user",
            "parts": [prompt]
        })
        
        # Configure model with system instructions
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=instruction
        )
        
        # Call GenerateContent asynchronously
        response = await model.generate_content_async(contents=formatted_contents)
        return response.text
    except Exception as e:
        logger.error(f"Error invoking Gemini API: {e}")
        error_msgs = {
            'uz': "Kechirasiz, tizim yuridik so'rovlarni tahlil qilishda xatolikka duch keldi. Iltimos, bir ozdan so'ng qayta urinib ko'ring.",
            'ru': "К сожалению, система столкнулась с ошибкой при анализе запроса. Пожалуйста, попробуйте позже.",
            'en': "Sorry, the system encountered an error processing your legal inquiry. Please try again in a moment."
        }
        return error_msgs.get(language, error_msgs['uz'])
`
  },
  {
    name: "language_keyboard.py",
    path: "keyboards/language_keyboard.py",
    language: "python",
    description: "Custom keyboard modules using Aiogram. Features inline keyboards for language picking and responsive markup panels.",
    content: `from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton

def get_language_keyboard() -> InlineKeyboardMarkup:
    """Builds Inline Grid buttons allowing users to select or switch their preferred communication language."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🇺🇿 O'zbekcha", callback_data="lang_uz"),
            InlineKeyboardButton(text="🇷🇺 Русский", callback_data="lang_ru")
        ],
        [
            InlineKeyboardButton(text="🇬🇧 English", callback_data="lang_en")
        ]
    ])
    return keyboard

def get_main_keyboard(lang: str) -> ReplyKeyboardMarkup:
    """Generates localized persistent custom command shortcuts displayed at the base of the Telegram frame."""
    buttons = {
        'uz': ["⚖️ Qonun so'rash", "🌐 Tilni o'zgartirish", "ℹ️ Yordam"],
        'ru': ["⚖️ Задать вопрос", "🌐 Сменить язык", "ℹ️ Помощь"],
        'en': ["⚖️ Ask Question", "🌐 Change Language", "ℹ️ Help"]
    }
    
    cb = buttons.get(lang, buttons['uz'])
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=cb[0])],
            [KeyboardButton(text=cb[1]), KeyboardButton(text=cb[2])]
        ],
        resize_keyboard=True,
        one_time_keyboard=False
    )
    return keyboard
`
  },
  {
    name: "start.py",
    path: "handlers/start.py",
    language: "python",
    description: "Handles the `/start` command. Creates user profiles with fallbacks and prompts language selection.",
    content: `from aiogram import Router, types
from aiogram.filters import CommandStart
from database import add_user, get_user_language
from keyboards.language_keyboard import get_language_keyboard

router = Router()

messages = {
    'uz': (
        "Assalomu alaykum! Men LexAI - O'zbekiston Qonunchiligi bo'yicha virtual yuridik yordamchiman. "
        "Men sizga yuridik atamalar, o'zgarishlar va kodekslar haqida maslahat bera olaman.\n\n"
        "Boshlash uchun muloqot tilini tanlang:"
    ),
    'ru': (
        "Здравствуйте! Я LexAI - ваш виртуальный юридический помощник по законодательству Республики Узбекистан. "
        "Я могу проконсультировать вас по юридическим терминам, кодексам и изменениям.\n\n"
        "Для начала выберите язык общения:"
    ),
    'en': (
        "Hello! I am LexAI - your virtual legal assistant on the legislation of the Republic of Uzbekistan. "
        "I can consult you on legal terms, codes, and recent regulatory amendments.\n\n"
        "Please select a communication language to start:"
    )
}

@router.message(CommandStart())
async def start_cmd(message: types.Message):
    """Answers /start command, initializes user table row and drops down language selector keys."""
    user_id = message.from_user.id
    
    # Safely write user to local SQLite
    add_user(user_id)
    lang = get_user_language(user_id)
    
    welcome_text = messages.get(lang, messages['uz'])
    await message.answer(
        text=welcome_text,
        reply_markup=get_language_keyboard()
    )
`
  },
  {
    name: "help.py",
    path: "handlers/help.py",
    language: "python",
    description: "Handles the `/help` command. Responds with localized tutorials on how to interact with the legal assistant.",
    content: `from aiogram import Router, types
from aiogram.filters import Command
from database import get_user_language

router = Router()

help_docs = {
    'uz': (
        "⚖️ **LexAI Botidan foydalanish bo'yicha qo'llanma**\n\n"
        "Siz menga O'zbekiston yuridik normalari bo'yicha har qanday savolni yuborishingiz mumkin. Masalan:\n"
        "• *'Ishdan bo'shatilganda qanday to'lovlar to'lanishi shart?'*\n"
        "• *'Yakka tartibdagi tadbirkor sifatida soliq stavkasi qancha?'*\n"
        "• *'Bolalar puli olish shartlari nimalardan iborat?'*\n\n"
        "**Tizim buyruqlari:**\n"
        "🔹 /start - Botni qayta ishga tushirish (tizimga kirish)\n"
        "🔹 /language - Muloqot tilini qayta tanlash\n"
        "🔹 /help - Quyidagi yo'riqnomani ko'rish\n"
        "🔹 /about - Loyiha maqsadi va texnologiyalari haqida"
    ),
    'ru': (
        "⚖️ **Справка по использованию бота LexAI**\n\n"
        "Вы можете отправить мне любой вопрос, касающийся законов РУз. Например:\n"
        "• *'Какие выплаты положены при увольнении по сокращению?'*\n"
        "• *'Какова ставка налога для индивидуального предпринимателя?'*\n"
        "• *'Каковы условия получения детских пособий?'*\n\n"
        "**Доступные команды:**\n"
        "🔹 /start - Перезапустить бота (вход в систему)\n"
        "🔹 /language - Изменить язык общения\n"
        "🔹 /help - Показать эту справку\n"
        "🔹 /about - О целях создания и технологиях проекта"
    ),
    'en': (
        "⚖️ **User Guide for LexAI Companion**\n\n"
        "You can send me any inquiry regarding the laws of the Republic of Uzbekistan. For example:\n"
        "• *'What compensations are mandated upon employee termination?'*\n"
        "• *'What is the standard tax rate for individual entrepreneurs?'*\n"
        "• *'What are the eligibility criteria for child welfare benefits?'*\n\n"
        "**System Commands:**\n"
        "🔹 /start - Restart the bot or initialize connection\n"
        "🔹 /language - Modify user language profile\n"
        "🔹 /help - View this helper guide\n"
        "🔹 /about - Learn about project scope and technical stack"
    )
}

@router.message(Command("help"))
async def help_cmd(message: types.Message):
    """Displays detailed instructions formatted elegantly in Markdown."""
    user_id = message.from_user.id
    lang = get_user_language(user_id)
    
    await message.answer(
        text=help_docs.get(lang, help_docs['uz']),
        parse_mode="Markdown"
    )
`
  },
  {
    name: "language.py",
    path: "handlers/language.py",
    language: "python",
    description: "Handles active language setting command (/language) and callbacks starting with 'lang_'. Updates database state recursively.",
    content: `from aiogram import Router, types, F
from aiogram.filters import Command
from database import update_user_language, get_user_language
from keyboards.language_keyboard import get_language_keyboard, get_main_keyboard

router = Router()

prompts = {
    'uz': "Muloqot tilini tanlang:",
    'ru': "Выберите язык общения:",
    'en': "Select your feedback language:"
}

success_messages = {
    'uz': "Muloqot tili muvaffaqiyatli tanlandi! 🇺🇿 Endi menga O'zbekiston yuridik munosabatlariga doir savollaringizni yuborishingiz mumkin.",
    'ru': "Язык общения успешно выбран! 🇷🇺 Теперь вы можете задавать вопросы по юриспруденции Узбекистана.",
    'en': "Communication language set successfully! 🇬🇧 Now you can send me your inquiries about Uzbekistan's laws."
}

@router.message(Command("language"))
async def language_cmd(message: types.Message):
    """Presents user with in-line language selection grid."""
    lang = get_user_language(message.from_user.id)
    await message.answer(
        text=prompts.get(lang, prompts['uz']),
        reply_markup=get_language_keyboard()
    )

@router.callback_query(F.data.startswith("lang_"))
async def process_lang_select(callback: types.CallbackQuery):
    """Saves chosen language to SQLite backend, replaces keyboard layouts, and notifies user of a successful profile update."""
    selected_lang = callback.data.split("_")[1]
    user_id = callback.from_user.id
    
    # Save selection state
    update_user_language(user_id, selected_lang)
    
    # Respond with success trigger
    success_text = success_messages.get(selected_lang, success_messages['uz'])
    await callback.message.delete()
    await callback.message.answer(
        text=success_text,
        reply_markup=get_main_keyboard(selected_lang)
    )
    await callback.answer()
`
  },
  {
    name: "about.py",
    path: "handlers/about.py",
    language: "python",
    description: "Handles the `/about` command. Provides contextual legal disclaimers and lists built-in technologies.",
    content: `from aiogram import Router, types
from aiogram.filters import Command
from database import get_user_language

router = Router()

about_texts = {
    'uz': (
        "⚖️ **LexAI — O'zbekiston Qonunchiligi bo'yicha virtual yuridik maslahatchi loyihasi**\n\n"
        "Ushbu bot insonlarning huquqiy ongini oshirish, konstitutsion normalar hamda me'yoriy qonun hujjatlarini "
        "yengilroq va qulay shaklda tushunishga ko'maklashuvchi sun'iy intellekt xizmati hisoblanadi.\n\n"
        "🛡️ **Rad etish (Disclaimer):**\n"
        "Bot tomonidan beriladigan ma'lumotlar faqatgina yuridik axborot xarakteriga ega bo'lib, professional advokatlik maslahati hisoblanmaydi.\n\n"
        "📋 **Texnologik asoslar:**\n"
        "• Dasturlash tili: Python 3.12\n"
        "• Telegram ramka: Aiogram 3.x\n"
        "• Ma'lumotlar ombori: SQLite 3\n"
        "• Neyrotarmoq: Google Gemini-1.5-Flash"
    ),
    'ru': (
        "⚖️ **LexAI — Виртуальный юридический консультант по законам Республики Узбекистан**\n\n"
        "Этот чат-бот разработан в качестве удобного инструмента искусственного интеллекта для повышения правовой "
        "грамотности граждан и облегчения доступа к нормативно-правовым актам.\n\n"
        "🛡️ **Отказ от ответственности (Disclaimer):**\n"
        "Предоставляемая ботом информация носит исключительно ознакомительный юридический характер и не заменяет "
        "лицензированную адвокатскую консультацию.\n\n"
        "📋 **Технический стек:**\n"
        "• Язык кодирования: Python 3.12\n"
        "• Библиотека Telegram: Aiogram 3.x\n"
        "• Локальная база данных: SQLite 3\n"
        "• Модель ИИ: Google Gemini-1.5-Flash"
    ),
    'en': (
        "⚖️ **LexAI — Virtual Legal Assistant for Uzbekistan Legislation**\n\n"
        "This agent serves as an accessible AI-backed companion to improve legal awareness among citizens, "
        "offering instantaneous, structured summaries of legislative norms and guidelines.\n\n"
        "🛡️ **Disclaimer:**\n"
        "All information rendered by the bot is for informational and educational purposes only, and does not "
        "constitute professional legal counsel.\n\n"
        "📋 **Engine Specifications:**\n"
        "• Engine: Python 3.12\n"
        "• Framework: Aiogram 3.x\n"
        "• Database: SQLite 3\n"
        "• AI Core: Google Gemini-1.5-Flash"
    )
}

@router.message(Command("about"))
async def about_cmd(message: types.Message):
    """Delivers disclaimers and technology stacks localized nicely in full Markdown."""
    user_id = message.from_user.id
    lang = get_user_language(user_id)
    
    await message.answer(
        text=about_texts.get(lang, about_texts['uz']),
        parse_mode="Markdown"
    )
`
  },
  {
    name: "chat.py",
    path: "handlers/chat.py",
    language: "python",
    description: "Core communication logic. Intercepts incoming messages, stores query transactions, looks up databases for history, fetches model results, and returns formatted outputs.",
    content: `from aiogram import Router, types, F
from database import get_user_language, save_message, get_history
from services.gemini_service import generate_response
from keyboards.language_keyboard import get_language_keyboard

router = Router()

wait_prompts = {
    'uz': "⚖️ *Savolingiz tahlil qilinmoqda, ozgina kuting...*",
    'ru': "⚖ *Выполняется юридический анализ вашего запроса, пожалуйста, подождите...*",
    'en': "⚖️ *Your inquiry is being legally processed, please wait a moment...*"
}

@router.message(F.text)
async def handle_user_query(message: types.Message):
    """Processes messages, performs SQLite writes for context logging, and responds via the Gemini Legal model."""
    # Disregard bot commands
    if message.text.startswith("/"):
        return
        
    user_id = message.from_user.id
    lang = get_user_language(user_id)
    
    # 1. Capture and handle navigation keywords sent from reply buttons
    if message.text in ["⚖️ Qonun so'rash", "⚖️ Задать вопрос", "⚖️ Ask Question"]:
        action_prompts = {
            'uz': "Sizni qiziqtirgan huquqiy savolni yozing. Masalan: 'Chet elda ishlovchi soliq rezidentlari...' Men batafsil javob beraman.",
            'ru': "Напишите интересующий вас юридический вопрос в деталях. Я проанализирую его на основе законодательства.",
            'en': "Type your legal question. I will dissect it and refer to relevant laws of Uzbekistan."
        }
        await message.answer(action_prompts.get(lang, action_prompts['uz']))
        return
        
    if message.text in ["🌐 Tilni o'zgartirish", "🌐 Сменить язык", "🌐 Change Language"]:
        lang_prompts = {
            'uz': "Quyidagilardan o'zingizga qulay tilni bosing:",
            'ru': "Выберите удобный для вас язык из меню ниже:",
            'en': "Please tap on your preferred language below:"
        }
        await message.answer(text=lang_prompts.get(lang, lang_prompts['uz']), reply_markup=get_language_keyboard())
        return
        
    if message.text in ["ℹ️ Yordam", "ℹ️ Помощь", "ℹ️ Help"]:
        tutorials = {
            'uz': "O'zbekiston kodekslariga daxldor savollar bering. Men ularni yuridik tahlil qilib, qonun moddalariga ko'ra tushuntiraman.",
            'ru': "Задавайте вопросы касательно кодексов Узбекистана. Чат-бот выполнит разбор и предоставит ссылки на законы.",
            'en': "Inquire about tax rates, labor standards, or property rights under Uzbek code. I will outline regulations precisely."
        }
        await message.answer(tutorials.get(lang, tutorials['uz']))
        return

    # 2. Traditional text input query flow
    user_prompt = message.text
    
    # Save the input query context into SQLite messages table
    save_message(user_id, "user", user_prompt)
    
    # Dispatch intermediate progress notification to the Telegram chat
    waiting_bubble = await message.answer(
        text=wait_prompts.get(lang, wait_prompts['uz']),
        parse_mode="Markdown"
    )
    
    # Retrieve last 6 nodes (3 complete conversation turns) for chat history
    chat_history = get_history(user_id, limit=6)
    
    # Retrieve response from Google Gemini backend
    ai_reply = await generate_response(user_prompt, lang, chat_history)
    
    # Committ model result into SQLite messages table
    save_message(user_id, "model", ai_reply)
    
    # Upgrade waiting message bubble with the fully processed legal advisory text
    await waiting_bubble.edit_text(
        text=ai_reply,
        parse_mode="Markdown"
    )
`
  },
  {
    name: "bot.py",
    path: "bot.py",
    language: "python",
    description: "The primary program entry point. Initializes SQLite, orchestrates routing instances, manages bot tasks, and spins up polling listeners.",
    content: `import asyncio
import logging
import sys
from aiogram import Bot, Dispatcher
from config import TELEGRAM_TOKEN
from database import init_db
from handlers import start, help, language, chat, about

# Coordinate basic logging output stream
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

async def main():
    # 1. Initialize DB file lexai.db and apply table schemas
    logger.info("Initializing LexAI SQLite storage engine...")
    init_db()
    
    # 2. Boot Bot Client with registered Token
    logger.info("Establishing connection with Telegram Telegram API...")
    bot = Bot(token=TELEGRAM_TOKEN)
    dp = Dispatcher()
    
    # 3. Mount Routers securely (Important: keep chat text parsing last to ensure command prioritization)
    dp.include_router(start.router)
    dp.include_router(help.router)
    dp.include_router(language.router)
    dp.include_router(about.router)
    dp.include_router(chat.router) # Chat wild-card listener sits at base of priority chain
    
    # 4. Spin up loop sequence
    logger.info("Purging pending updates and starting bot long-polling daemon...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("LexAI Telegram Bot terminated successfully.")
`
  }
];
