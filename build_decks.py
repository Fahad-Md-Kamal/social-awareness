#!/usr/bin/env python3
"""Builds Anki-importable decks (tab-separated, UTF-8) into ./decks/.
Anki: File > Import > pick the .tsv. Fields: Front, Back, Tags (last column)."""
import csv
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "decks")
os.makedirs(OUT, exist_ok=True)

# ---------- Kana: (hiragana, katakana, romaji, bangla sound) ----------
KANA = [
    ("あ", "ア", "a", "আ"), ("い", "イ", "i", "ই"), ("う", "ウ", "u", "উ"), ("え", "エ", "e", "এ"), ("お", "オ", "o", "ও"),
    ("か", "カ", "ka", "কা"), ("き", "キ", "ki", "কি"), ("く", "ク", "ku", "কু"), ("け", "ケ", "ke", "কে"), ("こ", "コ", "ko", "কো"),
    ("さ", "サ", "sa", "সা"), ("し", "シ", "shi", "শি"), ("す", "ス", "su", "সু"), ("せ", "セ", "se", "সে"), ("そ", "ソ", "so", "সো"),
    ("た", "タ", "ta", "তা"), ("ち", "チ", "chi", "চি"), ("つ", "ツ", "tsu", "ৎসু"), ("て", "テ", "te", "তে"), ("と", "ト", "to", "তো"),
    ("な", "ナ", "na", "না"), ("に", "ニ", "ni", "নি"), ("ぬ", "ヌ", "nu", "নু"), ("ね", "ネ", "ne", "নে"), ("の", "ノ", "no", "নো"),
    ("は", "ハ", "ha", "হা"), ("ひ", "ヒ", "hi", "হি"), ("ふ", "フ", "fu", "ফু (ঠোঁট দিয়ে হালকা)"), ("へ", "ヘ", "he", "হে"), ("ほ", "ホ", "ho", "হো"),
    ("ま", "マ", "ma", "মা"), ("み", "ミ", "mi", "মি"), ("む", "ム", "mu", "মু"), ("め", "メ", "me", "মে"), ("も", "モ", "mo", "মো"),
    ("や", "ヤ", "ya", "ইয়া"), ("ゆ", "ユ", "yu", "ইউ"), ("よ", "ヨ", "yo", "ইয়ো"),
    ("ら", "ラ", "ra", "রা (র/ল/ড় এর মাঝামাঝি)"), ("り", "リ", "ri", "রি"), ("る", "ル", "ru", "রু"), ("れ", "レ", "re", "রে"), ("ろ", "ロ", "ro", "রো"),
    ("わ", "ワ", "wa", "ওয়া"), ("を", "ヲ", "wo", "ও (শুধু কর্মকারক চিহ্ন)"), ("ん", "ン", "n", "ন্ / ঙ্"),
    ("が", "ガ", "ga", "গা"), ("ぎ", "ギ", "gi", "গি"), ("ぐ", "グ", "gu", "গু"), ("げ", "ゲ", "ge", "গে"), ("ご", "ゴ", "go", "গো"),
    ("ざ", "ザ", "za", "জা"), ("じ", "ジ", "ji", "জি"), ("ず", "ズ", "zu", "জু"), ("ぜ", "ゼ", "ze", "জে"), ("ぞ", "ゾ", "zo", "জো"),
    ("だ", "ダ", "da", "দা"), ("ぢ", "ヂ", "ji", "জি (じ এর মতো)"), ("づ", "ヅ", "zu", "জু (ず এর মতো)"), ("で", "デ", "de", "দে"), ("ど", "ド", "do", "দো"),
    ("ば", "バ", "ba", "বা"), ("び", "ビ", "bi", "বি"), ("ぶ", "ブ", "bu", "বু"), ("べ", "ベ", "be", "বে"), ("ぼ", "ボ", "bo", "বো"),
    ("ぱ", "パ", "pa", "পা"), ("ぴ", "ピ", "pi", "পি"), ("ぷ", "プ", "pu", "পু"), ("ぺ", "ペ", "pe", "পে"), ("ぽ", "ポ", "po", "পো"),
    ("きゃ", "キャ", "kya", "ক্যা"), ("きゅ", "キュ", "kyu", "ক্যু"), ("きょ", "キョ", "kyo", "ক্যো"),
    ("しゃ", "シャ", "sha", "শা"), ("しゅ", "シュ", "shu", "শু"), ("しょ", "ショ", "sho", "শো"),
    ("ちゃ", "チャ", "cha", "চা"), ("ちゅ", "チュ", "chu", "চু"), ("ちょ", "チョ", "cho", "চো"),
    ("にゃ", "ニャ", "nya", "ন্যা"), ("にゅ", "ニュ", "nyu", "ন্যু"), ("にょ", "ニョ", "nyo", "ন্যো"),
    ("ひゃ", "ヒャ", "hya", "হ্যা"), ("ひゅ", "ヒュ", "hyu", "হ্যু"), ("ひょ", "ヒョ", "hyo", "হ্যো"),
    ("みゃ", "ミャ", "mya", "ম্যা"), ("みゅ", "ミュ", "myu", "ম্যু"), ("みょ", "ミョ", "myo", "ম্যো"),
    ("りゃ", "リャ", "rya", "র্যা"), ("りゅ", "リュ", "ryu", "র্যু"), ("りょ", "リョ", "ryo", "র্যো"),
    ("ぎゃ", "ギャ", "gya", "গ্যা"), ("ぎゅ", "ギュ", "gyu", "গ্যু"), ("ぎょ", "ギョ", "gyo", "গ্যো"),
    ("じゃ", "ジャ", "ja", "জা"), ("じゅ", "ジュ", "ju", "জু"), ("じょ", "ジョ", "jo", "জো"),
    ("びゃ", "ビャ", "bya", "ব্যা"), ("びゅ", "ビュ", "byu", "ব্যু"), ("びょ", "ビョ", "byo", "ব্যো"),
    ("ぴゃ", "ピャ", "pya", "প্যা"), ("ぴゅ", "ピュ", "pyu", "প্যু"), ("ぴょ", "ピョ", "pyo", "প্যো"),
]

# ---------- Vocab: (japanese, reading, english, bangla, tag) ----------
VOCAB = [
    # greetings
    ("おはようございます", "おはようございます", "good morning", "সুপ্রভাত", "greeting"),
    ("こんにちは", "こんにちは", "hello / good afternoon", "হ্যালো / শুভ দিন", "greeting"),
    ("こんばんは", "こんばんは", "good evening", "শুভ সন্ধ্যা", "greeting"),
    ("さようなら", "さようなら", "goodbye", "বিদায়", "greeting"),
    ("おやすみなさい", "おやすみなさい", "good night", "শুভ রাত্রি", "greeting"),
    ("ありがとうございます", "ありがとうございます", "thank you", "ধন্যবাদ", "greeting"),
    ("すみません", "すみません", "excuse me / sorry", "মাফ করবেন / দুঃখিত", "greeting"),
    ("ごめんなさい", "ごめんなさい", "I'm sorry", "আমি দুঃখিত", "greeting"),
    ("はい", "はい", "yes", "হ্যাঁ", "greeting"),
    ("いいえ", "いいえ", "no", "না", "greeting"),
    ("おねがいします", "おねがいします", "please", "অনুগ্রহ করে", "greeting"),
    ("はじめまして", "はじめまして", "nice to meet you (first meeting)", "পরিচিত হয়ে ভালো লাগলো", "greeting"),
    ("よろしくおねがいします", "よろしくおねがいします", "pleased to meet you / please treat me well", "ভালো সম্পর্ক রাখবেন (পরিচয়ে বলা হয়)", "greeting"),
    ("いただきます", "いただきます", "(said before eating)", "খাওয়ার আগে বলা হয়", "greeting"),
    ("ごちそうさまでした", "ごちそうさまでした", "(said after eating)", "খাওয়ার শেষে বলা হয়", "greeting"),
    # people
    ("わたし", "わたし", "I", "আমি", "people"),
    ("あなた", "あなた", "you", "আপনি / তুমি", "people"),
    ("ともだち", "ともだち", "friend", "বন্ধু", "people"),
    ("せんせい", "せんせい", "teacher", "শিক্ষক", "people"),
    ("がくせい", "がくせい", "student", "ছাত্র / ছাত্রী", "people"),
    ("かいしゃいん", "かいしゃいん", "company employee", "অফিসের কর্মী", "people"),
    ("エンジニア", "エンジニア", "engineer", "ইঞ্জিনিয়ার", "people"),
    ("にほんじん", "にほんじん", "Japanese person", "জাপানি মানুষ", "people"),
    ("バングラデシュじん", "バングラデシュじん", "Bangladeshi person", "বাংলাদেশি", "people"),
    ("ひと", "ひと", "person", "মানুষ", "people"),
    ("かぞく", "かぞく", "family", "পরিবার", "people"),
    ("おかあさん", "おかあさん", "mother", "মা", "people"),
    ("おとうさん", "おとうさん", "father", "বাবা", "people"),
    ("おにいさん", "おにいさん", "older brother", "বড় ভাই", "people"),
    ("おねえさん", "おねえさん", "older sister", "বড় বোন / আপা", "people"),
    ("おとうと", "おとうと", "younger brother", "ছোট ভাই", "people"),
    ("いもうと", "いもうと", "younger sister", "ছোট বোন", "people"),
    # numbers
    ("ゼロ / れい", "ゼロ / れい", "zero", "শূন্য", "number"),
    ("いち", "いち", "1", "এক", "number"),
    ("に", "に", "2", "দুই", "number"),
    ("さん", "さん", "3", "তিন", "number"),
    ("よん / し", "よん / し", "4", "চার", "number"),
    ("ご", "ご", "5", "পাঁচ", "number"),
    ("ろく", "ろく", "6", "ছয়", "number"),
    ("なな / しち", "なな / しち", "7", "সাত", "number"),
    ("はち", "はち", "8", "আট", "number"),
    ("きゅう / く", "きゅう / く", "9", "নয়", "number"),
    ("じゅう", "じゅう", "10", "দশ", "number"),
    ("ひゃく", "ひゃく", "100", "একশো", "number"),
    ("せん", "せん", "1000", "এক হাজার", "number"),
    ("まん", "まん", "10,000", "দশ হাজার", "number"),
    # time
    ("いま", "いま", "now", "এখন", "time"),
    ("なんじ", "なんじ", "what time", "কয়টা বাজে", "time"),
    ("ごぜん", "ごぜん", "AM", "পূর্বাহ্ন", "time"),
    ("ごご", "ごご", "PM", "অপরাহ্ন", "time"),
    ("きょう", "きょう", "today", "আজ", "time"),
    ("あした", "あした", "tomorrow", "আগামীকাল", "time"),
    ("きのう", "きのう", "yesterday", "গতকাল", "time"),
    ("まいにち", "まいにち", "every day", "প্রতিদিন", "time"),
    ("けさ", "けさ", "this morning", "আজ সকালে", "time"),
    ("こんばん", "こんばん", "tonight", "আজ রাতে", "time"),
    ("いつ", "いつ", "when", "কখন", "time"),
    ("げつようび", "げつようび", "Monday", "সোমবার", "time"),
    ("かようび", "かようび", "Tuesday", "মঙ্গলবার", "time"),
    ("すいようび", "すいようび", "Wednesday", "বুধবার", "time"),
    ("もくようび", "もくようび", "Thursday", "বৃহস্পতিবার", "time"),
    ("きんようび", "きんようび", "Friday", "শুক্রবার", "time"),
    ("どようび", "どようび", "Saturday", "শনিবার", "time"),
    ("にちようび", "にちようび", "Sunday", "রবিবার", "time"),
    # demonstratives / question words
    ("これ", "これ", "this (near me)", "এটা", "demonstrative"),
    ("それ", "それ", "that (near you)", "ওটা (তোমার কাছে)", "demonstrative"),
    ("あれ", "あれ", "that over there", "ওটা (দূরে)", "demonstrative"),
    ("どれ", "どれ", "which one", "কোনটা", "demonstrative"),
    ("ここ", "ここ", "here", "এখানে", "demonstrative"),
    ("そこ", "そこ", "there", "সেখানে", "demonstrative"),
    ("あそこ", "あそこ", "over there", "ওখানে (দূরে)", "demonstrative"),
    ("どこ", "どこ", "where", "কোথায়", "demonstrative"),
    ("だれ", "だれ", "who", "কে", "demonstrative"),
    ("なに / なん", "なに / なん", "what", "কী", "demonstrative"),
    ("いくら", "いくら", "how much", "কত (দাম)", "demonstrative"),
    # things
    ("ほん", "ほん", "book", "বই", "thing"),
    ("かばん", "かばん", "bag", "ব্যাগ", "thing"),
    ("ペン", "ペン", "pen", "কলম", "thing"),
    ("えんぴつ", "えんぴつ", "pencil", "পেন্সিল", "thing"),
    ("ノート", "ノート", "notebook", "খাতা", "thing"),
    ("とけい", "とけい", "clock / watch", "ঘড়ি", "thing"),
    ("かさ", "かさ", "umbrella", "ছাতা", "thing"),
    ("くつ", "くつ", "shoes", "জুতা", "thing"),
    ("ふく", "ふく", "clothes", "পোশাক", "thing"),
    ("さいふ", "さいふ", "wallet", "মানিব্যাগ", "thing"),
    ("けいたいでんわ", "けいたいでんわ", "mobile phone", "মোবাইল ফোন", "thing"),
    ("パソコン", "パソコン", "PC / laptop", "পিসি / ল্যাপটপ", "thing"),
    ("くるま", "くるま", "car", "গাড়ি", "thing"),
    ("じてんしゃ", "じてんしゃ", "bicycle", "সাইকেল", "thing"),
    ("でんしゃ", "でんしゃ", "train (electric)", "ট্রেন", "thing"),
    ("バス", "バス", "bus", "বাস", "thing"),
    ("ちかてつ", "ちかてつ", "subway", "পাতাল রেল", "thing"),
    ("ひこうき", "ひこうき", "airplane", "বিমান", "thing"),
    ("つくえ", "つくえ", "desk", "ডেস্ক / টেবিল", "thing"),
    ("いす", "いす", "chair", "চেয়ার", "thing"),
    ("まど", "まど", "window", "জানালা", "thing"),
    ("テレビ", "テレビ", "TV", "টিভি", "thing"),
    # food
    ("みず", "みず", "water", "পানি", "food"),
    ("おちゃ", "おちゃ", "tea", "চা", "food"),
    ("コーヒー", "コーヒー", "coffee", "কফি", "food"),
    ("ごはん", "ごはん", "rice / meal", "ভাত / খাবার", "food"),
    ("パン", "パン", "bread", "পাউরুটি", "food"),
    ("たまご", "たまご", "egg", "ডিম", "food"),
    ("さかな", "さかな", "fish", "মাছ", "food"),
    ("にく", "にく", "meat", "মাংস", "food"),
    ("やさい", "やさい", "vegetables", "সবজি", "food"),
    ("くだもの", "くだもの", "fruit", "ফল", "food"),
    ("りんご", "りんご", "apple", "আপেল", "food"),
    ("バナナ", "バナナ", "banana", "কলা", "food"),
    ("カレー", "カレー", "curry", "কারি / তরকারি", "food"),
    ("ぎゅうにゅう", "ぎゅうにゅう", "milk", "দুধ", "food"),
    # places
    ("がっこう", "がっこう", "school", "স্কুল", "place"),
    ("だいがく", "だいがく", "university", "বিশ্ববিদ্যালয়", "place"),
    ("かいしゃ", "かいしゃ", "company", "কোম্পানি", "place"),
    ("うち", "うち", "home / house", "বাড়ি", "place"),
    ("えき", "えき", "station", "স্টেশন", "place"),
    ("びょういん", "びょういん", "hospital", "হাসপাতাল", "place"),
    ("ぎんこう", "ぎんこう", "bank", "ব্যাংক", "place"),
    ("ゆうびんきょく", "ゆうびんきょく", "post office", "ডাকঘর", "place"),
    ("スーパー", "スーパー", "supermarket", "সুপারমার্কেট", "place"),
    ("コンビニ", "コンビニ", "convenience store", "কনভেনিয়েন্স স্টোর", "place"),
    ("レストラン", "レストラン", "restaurant", "রেস্তোরাঁ", "place"),
    ("トイレ", "トイレ", "toilet", "টয়লেট", "place"),
    ("としょかん", "としょかん", "library", "লাইব্রেরি", "place"),
    ("くうこう", "くうこう", "airport", "বিমানবন্দর", "place"),
    ("にほん", "にほん", "Japan", "জাপান", "place"),
    ("バングラデシュ", "バングラデシュ", "Bangladesh", "বাংলাদেশ", "place"),
    ("とうきょう", "とうきょう", "Tokyo", "টোকিও", "place"),
    ("ダッカ", "ダッカ", "Dhaka", "ঢাকা", "place"),
    ("くに", "くに", "country", "দেশ", "place"),
    # verbs
    ("たべる", "たべる", "to eat", "খাওয়া", "verb"),
    ("のむ", "のむ", "to drink", "পান করা", "verb"),
    ("みる", "みる", "to see / watch", "দেখা", "verb"),
    ("きく", "きく", "to listen / ask", "শোনা / জিজ্ঞাসা করা", "verb"),
    ("よむ", "よむ", "to read", "পড়া", "verb"),
    ("かく", "かく", "to write", "লেখা", "verb"),
    ("はなす", "はなす", "to speak", "কথা বলা", "verb"),
    ("いく", "いく", "to go", "যাওয়া", "verb"),
    ("くる", "くる", "to come", "আসা", "verb"),
    ("かえる", "かえる", "to return home", "বাড়ি ফেরা", "verb"),
    ("おきる", "おきる", "to wake up", "ঘুম থেকে ওঠা", "verb"),
    ("ねる", "ねる", "to sleep", "ঘুমানো", "verb"),
    ("する", "する", "to do", "করা", "verb"),
    ("べんきょうする", "べんきょうする", "to study", "পড়াশোনা করা", "verb"),
    ("はたらく", "はたらく", "to work", "কাজ করা", "verb"),
    ("かう", "かう", "to buy", "কেনা", "verb"),
    ("あう", "あう", "to meet", "দেখা করা", "verb"),
    ("あそぶ", "あそぶ", "to play", "খেলা / ঘুরে বেড়ানো", "verb"),
    ("のる", "のる", "to ride", "চড়া", "verb"),
    ("まつ", "まつ", "to wait", "অপেক্ষা করা", "verb"),
    ("つくる", "つくる", "to make", "বানানো", "verb"),
    ("あります", "あります", "there is (things)", "আছে (জড় বস্তু)", "verb"),
    ("います", "います", "there is (people/animals)", "আছে (প্রাণী/মানুষ)", "verb"),
    # i-adjectives
    ("おおきい", "おおきい", "big", "বড়", "i-adj"),
    ("ちいさい", "ちいさい", "small", "ছোট", "i-adj"),
    ("たかい", "たかい", "expensive / tall", "দামি / উঁচু", "i-adj"),
    ("やすい", "やすい", "cheap", "সস্তা", "i-adj"),
    ("あたらしい", "あたらしい", "new", "নতুন", "i-adj"),
    ("ふるい", "ふるい", "old (things)", "পুরনো", "i-adj"),
    ("いい / よい", "いい / よい", "good", "ভালো", "i-adj"),
    ("わるい", "わるい", "bad", "খারাপ", "i-adj"),
    ("おいしい", "おいしい", "delicious", "সুস্বাদু", "i-adj"),
    ("おもしろい", "おもしろい", "interesting", "মজাদার / আকর্ষণীয়", "i-adj"),
    ("つまらない", "つまらない", "boring", "বিরক্তিকর", "i-adj"),
    ("むずかしい", "むずかしい", "difficult", "কঠিন", "i-adj"),
    ("やさしい", "やさしい", "easy / kind", "সহজ / দয়ালু", "i-adj"),
    ("あつい", "あつい", "hot", "গরম", "i-adj"),
    ("さむい", "さむい", "cold", "ঠান্ডা (আবহাওয়া)", "i-adj"),
    ("いそがしい", "いそがしい", "busy", "ব্যস্ত", "i-adj"),
    ("たのしい", "たのしい", "fun", "আনন্দদায়ক", "i-adj"),
    ("ながい", "ながい", "long", "লম্বা / দীর্ঘ", "i-adj"),
    ("はやい", "はやい", "fast / early", "দ্রুত / আগে", "i-adj"),
    ("おそい", "おそい", "slow / late", "ধীর / দেরি", "i-adj"),
    ("あかい", "あかい", "red", "লাল", "i-adj"),
    ("しろい", "しろい", "white", "সাদা", "i-adj"),
    ("くろい", "くろい", "black", "কালো", "i-adj"),
    ("あおい", "あおい", "blue", "নীল", "i-adj"),
    # na-adjectives
    ("きれい", "きれい", "pretty / clean", "সুন্দর / পরিষ্কার", "na-adj"),
    ("しずか", "しずか", "quiet", "শান্ত / নিরিবিলি", "na-adj"),
    ("にぎやか", "にぎやか", "lively", "জমজমাট", "na-adj"),
    ("ゆうめい", "ゆうめい", "famous", "বিখ্যাত", "na-adj"),
    ("げんき", "げんき", "healthy / energetic", "সুস্থ / প্রাণবন্ত", "na-adj"),
    ("すき", "すき", "to like", "পছন্দ", "na-adj"),
    ("きらい", "きらい", "to dislike", "অপছন্দ", "na-adj"),
    ("じょうず", "じょうず", "good at", "দক্ষ", "na-adj"),
    ("へた", "へた", "bad at", "অদক্ষ", "na-adj"),
    ("べんり", "べんり", "convenient", "সুবিধাজনক", "na-adj"),
    ("ひま", "ひま", "free (not busy)", "অবসর", "na-adj"),
    ("たいへん", "たいへん", "tough / serious", "কষ্টকর / গুরুতর", "na-adj"),
    # tech (katakana practice)
    ("プログラム", "プログラム", "program", "প্রোগ্রাম", "tech"),
    ("ソフトウェア", "ソフトウェア", "software", "সফটওয়্যার", "tech"),
    ("ネットワーク", "ネットワーク", "network", "নেটওয়ার্ক", "tech"),
    ("データ", "データ", "data", "ডেটা", "tech"),
    ("インターネット", "インターネット", "internet", "ইন্টারনেট", "tech"),
    ("メール", "メール", "email", "ইমেইল", "tech"),
    ("アプリ", "アプリ", "app", "অ্যাপ", "tech"),
    ("サーバー", "サーバー", "server", "সার্ভার", "tech"),
    ("システム", "システム", "system", "সিস্টেম", "tech"),
    ("コンピューター", "コンピューター", "computer", "কম্পিউটার", "tech"),
    # misc
    ("なまえ", "なまえ", "name", "নাম", "misc"),
    ("でんわ", "でんわ", "telephone", "ফোন", "misc"),
    ("しごと", "しごと", "job / work", "চাকরি / কাজ", "misc"),
    ("しゅみ", "しゅみ", "hobby", "শখ", "misc"),
    ("しゅくだい", "しゅくだい", "homework", "হোমওয়ার্ক", "misc"),
    ("しけん", "しけん", "exam", "পরীক্ষা", "misc"),
    ("てんき", "てんき", "weather", "আবহাওয়া", "misc"),
    ("あめ", "あめ", "rain", "বৃষ্টি", "misc"),
    ("ゆき", "ゆき", "snow", "তুষার", "misc"),
    ("おかね", "おかね", "money", "টাকা", "misc"),
    ("じかん", "じかん", "time", "সময়", "misc"),
    ("とても", "とても", "very", "খুব", "misc"),
    ("あまり", "あまり", "not very (with negative)", "তেমন না", "misc"),
    ("ちょっと", "ちょっと", "a little", "একটু", "misc"),
    ("たくさん", "たくさん", "a lot", "অনেক", "misc"),
    ("すこし", "すこし", "a bit", "অল্প", "misc"),
    ("もう", "もう", "already / anymore", "ইতিমধ্যে", "misc"),
    ("まだ", "まだ", "not yet / still", "এখনও", "misc"),
    ("いつも", "いつも", "always", "সবসময়", "misc"),
    ("ときどき", "ときどき", "sometimes", "মাঝে মাঝে", "misc"),
    ("よく", "よく", "often / well", "প্রায়ই / ভালোভাবে", "misc"),
]

# ---------- Kanji: (kanji, on, kun, english, bangla) ----------
KANJI = [
    ("一", "イチ", "ひと(つ)", "one", "এক"), ("二", "ニ", "ふた(つ)", "two", "দুই"), ("三", "サン", "み(っつ)", "three", "তিন"),
    ("四", "シ", "よん / よ(っつ)", "four", "চার"), ("五", "ゴ", "いつ(つ)", "five", "পাঁচ"), ("六", "ロク", "む(っつ)", "six", "ছয়"),
    ("七", "シチ", "なな(つ)", "seven", "সাত"), ("八", "ハチ", "や(っつ)", "eight", "আট"), ("九", "キュウ", "ここの(つ)", "nine", "নয়"),
    ("十", "ジュウ", "とお", "ten", "দশ"), ("百", "ヒャク", "—", "hundred", "একশো"), ("千", "セン", "ち", "thousand", "হাজার"),
    ("万", "マン", "—", "ten thousand", "দশ হাজার"),
    ("日", "ニチ・ジツ", "ひ・か", "day / sun", "দিন / সূর্য"), ("月", "ゲツ・ガツ", "つき", "month / moon", "মাস / চাঁদ"),
    ("火", "カ", "ひ", "fire", "আগুন"), ("水", "スイ", "みず", "water", "পানি"), ("木", "モク", "き", "tree", "গাছ"),
    ("金", "キン", "かね", "gold / money", "সোনা / টাকা"), ("土", "ド", "つち", "earth / soil", "মাটি"),
    ("本", "ホン", "もと", "book / origin", "বই / মূল"), ("人", "ジン・ニン", "ひと", "person", "মানুষ"),
    ("山", "サン", "やま", "mountain", "পাহাড়"), ("川", "セン", "かわ", "river", "নদী"), ("田", "デン", "た", "rice field", "ধানক্ষেত"),
    ("大", "ダイ", "おお(きい)", "big", "বড়"), ("小", "ショウ", "ちい(さい)", "small", "ছোট"), ("中", "チュウ", "なか", "middle / inside", "মধ্য / ভিতর"),
    ("上", "ジョウ", "うえ", "up / above", "উপর"), ("下", "カ", "した", "down / below", "নিচ"),
    ("右", "ウ", "みぎ", "right", "ডান"), ("左", "サ", "ひだり", "left", "বাম"),
    ("前", "ゼン", "まえ", "before / front", "আগে / সামনে"), ("後", "ゴ", "あと・うし(ろ)", "after / behind", "পরে / পিছনে"),
    ("先", "セン", "さき", "previous / ahead", "আগের / সামনের"), ("生", "セイ・ショウ", "い(きる)・う(まれる)", "life / birth", "জীবন / জন্ম"),
    ("学", "ガク", "まな(ぶ)", "study", "অধ্যয়ন"), ("校", "コウ", "—", "school", "স্কুল"), ("年", "ネン", "とし", "year", "বছর"),
    ("口", "コウ", "くち", "mouth", "মুখ"), ("目", "モク", "め", "eye", "চোখ"), ("手", "シュ", "て", "hand", "হাত"),
    ("足", "ソク", "あし", "foot / leg", "পা"), ("耳", "ジ", "みみ", "ear", "কান"), ("力", "リョク", "ちから", "power", "শক্তি"),
    ("女", "ジョ", "おんな", "woman", "নারী"), ("男", "ダン", "おとこ", "man", "পুরুষ"), ("子", "シ", "こ", "child", "শিশু"),
    ("父", "フ", "ちち", "father", "বাবা"), ("母", "ボ", "はは", "mother", "মা"), ("友", "ユウ", "とも", "friend", "বন্ধু"),
    ("食", "ショク", "た(べる)", "eat", "খাওয়া"), ("飲", "イン", "の(む)", "drink", "পান করা"), ("見", "ケン", "み(る)", "see", "দেখা"),
    ("行", "コウ", "い(く)", "go", "যাওয়া"), ("来", "ライ", "く(る)", "come", "আসা"), ("聞", "ブン", "き(く)", "hear / ask", "শোনা"),
    ("話", "ワ", "はな(す)", "speak / talk", "কথা বলা"), ("読", "ドク", "よ(む)", "read", "পড়া"), ("書", "ショ", "か(く)", "write", "লেখা"),
    ("買", "バイ", "か(う)", "buy", "কেনা"), ("休", "キュウ", "やす(む)", "rest", "বিশ্রাম"),
    ("高", "コウ", "たか(い)", "tall / expensive", "উঁচু / দামি"), ("安", "アン", "やす(い)", "cheap / safe", "সস্তা / নিরাপদ"),
    ("新", "シン", "あたら(しい)", "new", "নতুন"), ("古", "コ", "ふる(い)", "old", "পুরনো"), ("白", "ハク", "しろ(い)", "white", "সাদা"),
    ("気", "キ", "—", "spirit / mood", "মন / অনুভূতি"), ("雨", "ウ", "あめ", "rain", "বৃষ্টি"), ("電", "デン", "—", "electricity", "বিদ্যুৎ"),
    ("車", "シャ", "くるま", "car", "গাড়ি"), ("国", "コク", "くに", "country", "দেশ"), ("語", "ゴ", "—", "language", "ভাষা"),
    ("時", "ジ", "とき", "time / hour", "সময়"), ("今", "コン", "いま", "now", "এখন"), ("何", "カ", "なに・なん", "what", "কী"),
    ("円", "エン", "—", "yen / circle", "ইয়েন / বৃত্ত"),
]


# ---------- Kanji spellings of vocabulary (reading -> usual kanji writing) ----------
KANJI_FORMS = """
わたし|私
ともだち|友達
せんせい|先生
がくせい|学生
かいしゃいん|会社員
にほんじん|日本人
バングラデシュじん|バングラデシュ人
ひと|人
かぞく|家族
おかあさん|お母さん
おとうさん|お父さん
おにいさん|お兄さん
おねえさん|お姉さん
おとうと|弟
いもうと|妹
いち|一
に|二
さん|三
よん / し|四
ご|五
ろく|六
なな / しち|七
はち|八
きゅう / く|九
じゅう|十
ひゃく|百
せん|千
まん|万
いま|今
なんじ|何時
ごぜん|午前
ごご|午後
きょう|今日
あした|明日
きのう|昨日
まいにち|毎日
けさ|今朝
こんばん|今晩
げつようび|月曜日
かようび|火曜日
すいようび|水曜日
もくようび|木曜日
きんようび|金曜日
どようび|土曜日
にちようび|日曜日
なに / なん|何
ほん|本
えんぴつ|鉛筆
とけい|時計
かさ|傘
くつ|靴
ふく|服
さいふ|財布
けいたいでんわ|携帯電話
くるま|車
じてんしゃ|自転車
でんしゃ|電車
ちかてつ|地下鉄
ひこうき|飛行機
つくえ|机
いす|椅子
まど|窓
みず|水
おちゃ|お茶
ごはん|ご飯
たまご|卵
さかな|魚
にく|肉
やさい|野菜
くだもの|果物
ぎゅうにゅう|牛乳
がっこう|学校
だいがく|大学
かいしゃ|会社
うち|家
えき|駅
びょういん|病院
ぎんこう|銀行
ゆうびんきょく|郵便局
としょかん|図書館
くうこう|空港
にほん|日本
とうきょう|東京
くに|国
たべる|食べる
のむ|飲む
みる|見る
きく|聞く
よむ|読む
かく|書く
はなす|話す
いく|行く
くる|来る
かえる|帰る
おきる|起きる
ねる|寝る
べんきょうする|勉強する
はたらく|働く
かう|買う
あう|会う
あそぶ|遊ぶ
のる|乗る
まつ|待つ
つくる|作る
おおきい|大きい
ちいさい|小さい
たかい|高い
やすい|安い
あたらしい|新しい
ふるい|古い
いい / よい|良い
わるい|悪い
おいしい|美味しい
おもしろい|面白い
むずかしい|難しい
あつい|暑い
さむい|寒い
いそがしい|忙しい
たのしい|楽しい
ながい|長い
はやい|早い
おそい|遅い
あかい|赤い
しろい|白い
くろい|黒い
あおい|青い
しずか|静か
ゆうめい|有名
げんき|元気
すき|好き
きらい|嫌い
じょうず|上手
へた|下手
べんり|便利
ひま|暇
たいへん|大変
なまえ|名前
でんわ|電話
しごと|仕事
しゅみ|趣味
しゅくだい|宿題
しけん|試験
てんき|天気
あめ|雨
ゆき|雪
おかね|お金
じかん|時間
すこし|少し
ときどき|時々
"""

# ---------- Story: how the kanji combine into the meaning (kanji form | English | Bangla) ----------
STORIES = """
先生|before + born: the one born before you|আগে জন্মানো ব্যক্তি = শিক্ষক
学生|study + life: a person who studies|যে পড়াশোনা করে
学校|study + school building|শেখার স্থান
大学|big + study: the big school|বড় শিক্ষা-প্রতিষ্ঠান
会社|meeting + society: people gathering for work|কাজের জন্য মিলিত মানুষের সংগঠন
会社員|company + member|কোম্পানির সদস্য
日本|sun + origin: where the sun comes from|সূর্যের উৎস
電車|electric + vehicle|বিদ্যুতে চলা যান
電話|electric + talk|বিদ্যুতে কথা
自転車|self + turn + vehicle: a cart you turn yourself|নিজে ঘোরানো গাড়ি
地下鉄|ground + below + iron: iron under the ground|মাটির নিচের লোহা (রেল)
飛行機|fly + go + machine|উড়ে যাওয়া যন্ত্র
図書館|diagram + book + building|বই-চিত্রের ভবন
郵便局|mail + convenience + office|ডাক-সুবিধার দপ্তর
携帯電話|carry + belt + electric + talk|বহনযোগ্য ফোন
時計|time + measure|সময় মাপার যন্ত্র
毎日|every + day|প্রতিদিন
今日|now + day: this day|এই দিন = আজ
明日|bright + day: the bright day ahead|আগামী উজ্জ্বল দিন
昨日|previous + day|গত দিন
今朝|now + morning|এই সকাল
元気|origin + spirit: original energy|মূল প্রাণশক্তি
天気|sky + spirit: the mood of the sky|আকাশের অবস্থা = আবহাওয়া
牛乳|cow + milk|গরুর দুধ
果物|fruit + thing|ফলের জিনিস
野菜|field + greens|মাঠের শাক-সবজি
空港|sky + harbor|আকাশের বন্দর
病院|illness + institution|অসুখের প্রতিষ্ঠান
勉強|effort + strong|শক্ত করে চেষ্টা = পড়াশোনা
午前|noon + before: AM|দুপুরের আগে
午後|noon + after: PM|দুপুরের পরে
何時|what + hour|কয়টা বাজে
"""

# ---------- Extra kanji not in the 77-kanji deck (kanji | English | Bangla) ----------
KANJI_EXTRA = """
私|I; private|আমি; ব্যক্তিগত
達|group marker (plural for people)|বহুবচন-সূচক
会|meet; society|সাক্ষাৎ; সমাজ
社|company; shrine|কোম্পানি; মন্দির
員|member; staff|সদস্য; কর্মী
家|house; family|বাড়ি; পরিবার
族|tribe; family|গোষ্ঠী; বংশ
兄|older brother|বড় ভাই
姉|older sister|বড় বোন
弟|younger brother|ছোট ভাই
妹|younger sister|ছোট বোন
午|noon|দুপুর
明|bright; tomorrow|উজ্জ্বল; আগামী
昨|previous; yesterday|গত
毎|every|প্রতি
朝|morning|সকাল
晩|evening; night|সন্ধ্যা; রাত
曜|day of the week|সপ্তাহের বার
鉛|lead (metal)|সীসা
筆|writing brush; pen|লেখার তুলি; কলম
計|measure; plan|মাপা
傘|umbrella|ছাতা
靴|shoes|জুতা
服|clothes|পোশাক
財|wealth|সম্পদ
布|cloth|কাপড়
携|carry in hand|হাতে বহন
帯|belt; carry|ফিতা; বহন
自|self|নিজ
転|turn; roll|ঘোরা
地|ground; earth|ভূমি
鉄|iron|লোহা
飛|fly|ওড়া
機|machine; opportunity|যন্ত্র; সুযোগ
机|desk|ডেস্ক
椅|chair|চেয়ার
窓|window|জানালা
茶|tea|চা
飯|cooked rice; meal|ভাত; খাবার
卵|egg|ডিম
魚|fish|মাছ
肉|meat|মাংস
野|field; wild|মাঠ; বন্য
菜|greens; vegetables|শাক-সবজি
果|fruit; result|ফল
物|thing|জিনিস
牛|cow|গরু
乳|milk|দুধ
駅|station|স্টেশন
病|illness|অসুখ
院|institution; hall|প্রতিষ্ঠান
銀|silver|রুপা
郵|mail|ডাক
便|convenience; mail|সুবিধা; ডাক
局|bureau; office|দপ্তর
図|diagram; plan|চিত্র
館|building; hall|ভবন
空|sky; empty|আকাশ; ফাঁকা
港|harbor; port|বন্দর
東|east|পূর্ব
京|capital|রাজধানী
帰|return home|ফেরা
起|wake; rise|ওঠা
寝|sleep|ঘুমানো
勉|effort|চেষ্টা
強|strong|শক্ত
働|work|কাজ করা
遊|play|খেলা
乗|ride|চড়া
待|wait|অপেক্ষা
作|make|বানানো
良|good|ভালো
悪|bad|খারাপ
美|beautiful|সুন্দর
味|taste|স্বাদ
面|face; surface|মুখ; দিক
難|difficult|কঠিন
暑|hot weather|গরম
寒|cold|ঠান্ডা
忙|busy|ব্যস্ত
楽|fun; comfortable|আনন্দ; আরাম
長|long|লম্বা
早|early; fast|আগে; দ্রুত
遅|slow; late|ধীর; দেরি
赤|red|লাল
黒|black|কালো
青|blue; green|নীল
静|quiet|শান্ত
有|have; exist|থাকা
名|name; famous|নাম; বিখ্যাত
元|origin; source|মূল
好|like|পছন্দ
嫌|dislike|অপছন্দ
暇|free time|অবসর
変|strange; change|অদ্ভুত; বদল
利|benefit; use|সুবিধা
仕|serve; work|সেবা; কাজ
事|matter; thing|বিষয়
趣|taste; charm|রুচি
宿|lodging|আবাস
題|topic; subject|বিষয়
試|try; test|পরীক্ষা
験|verify; test|যাচাই
天|heaven; sky|আকাশ
雪|snow|তুষার
間|interval; between|মধ্যে; বিরতি
少|few; little|অল্প
々|repeat the previous kanji|আগের কানজি আবার
"""


def _table(text, n):
    rows = {}
    for line in text.strip().splitlines():
        parts = line.split("|")
        if len(parts) == n:
            rows[parts[0]] = parts[1:]
    return rows


FORMS = {j: v[0] for j, v in _table(KANJI_FORMS, 2).items()}
STORY = {k: v for k, v in _table(STORIES, 3).items()}
EXTRA = {k: v for k, v in _table(KANJI_EXTRA, 3).items()}

def write_tsv(name, rows):
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8", newline="") as f:
        csv.writer(f, delimiter="\t").writerows(rows)
    print(f"{name}: {len(rows)} cards")


# kana: two directions of recognition: kana -> sound; plus both scripts in one card
def load_hooks():
    """Picture hooks from the table in MNEMONICS_HIRAGANA.md: | あ | a / আ | hook |"""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "MNEMONICS_HIRAGANA.md")
    hooks = {}
    if not os.path.exists(path):
        return hooks
    with open(path, encoding="utf-8") as f:
        for line in f:
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) == 3 and len(cells[0]) == 1 and "ぁ" <= cells[0] <= "ん":
                hooks[cells[0]] = cells[2]
    return hooks


HOOKS = load_hooks()
write_tsv("kana_hiragana.tsv", [
    (h, f"{r}  |  {b}" + (f"<br>🧠 {HOOKS[h]}" if h in HOOKS else ""), "hiragana")
    for h, k, r, b in KANA
])
def write_data_js():
    """Data for the website: window.DATA = {kana, vocab, kanji, kinfo} -> data.js"""
    import json
    deck = {k: (e, b) for k, on, kun, e, b in KANJI}
    kinfo = {k: {"e": e, "b": b, "deck": True} for k, (e, b) in deck.items()}
    vocab = []
    for j, r, e, b, t in VOCAB:
        kf = FORMS.get(j, "")
        story = STORY.get(kf)
        vocab.append({"j": j, "r": r, "e": e, "b": b, "t": t, "kf": kf,
                      "se": story[0] if story else "", "sb": story[1] if story else ""})
        for ch in kf:
            if ch not in kinfo and ch in EXTRA:
                kinfo[ch] = {"e": EXTRA[ch][0], "b": EXTRA[ch][1], "deck": False}
    data = {
        "kana": [{"h": h, "k": k, "r": r, "b": b, "hook": HOOKS.get(h, "")} for h, k, r, b in KANA],
        "vocab": vocab,
        "kanji": [{"k": k, "on": on, "kun": kun, "e": e, "b": b} for k, on, kun, e, b in KANJI],
        "kinfo": kinfo,
    }
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.js")
    with open(path, "w", encoding="utf-8") as f:
        f.write("window.DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    print(f"data.js: {len(data['kana'])} kana, {len(vocab)} vocab ({sum(1 for v in vocab if v['kf'])} with kanji), {len(data['kanji'])} kanji, {len(kinfo)} kanji described")
    missing = sorted({ch for kf in FORMS.values() for ch in kf if "\u4e00" <= ch <= "\u9fff" or ch == "々"} - set(kinfo))
    if missing:
        print("WARNING kanji without a description:", " ".join(missing))


write_data_js()
write_tsv("kana_katakana.tsv", [(k, f"{r}  |  {b}", "katakana") for h, k, r, b in KANA])
write_tsv("n5_vocab.tsv", [(j, f"{r}<br>{e}<br>{b}" + (f"<br>漢字: {FORMS[j]}" if j in FORMS else ""), t) for j, r, e, b, t in VOCAB])
write_tsv("n5_kanji.tsv", [(k, f"音: {on}<br>訓: {kun}<br>{e}<br>{b}", "kanji") for k, on, kun, e, b in KANJI])
