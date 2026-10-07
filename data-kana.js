/* Memory aids for kana. Hand-editable: no build step.
   rowSentences: [row, Bangla sentence whose key words start with the row's five sounds]
   hooksK: picture hooks for katakana, only where the shape truly matches (hiragana hooks live in data.js)
   lookalikes: pairs/groups that are easy to confuse, with the one detail that separates them */
window.KANA_TIPS = {
  rowSentences: [
    ["あ い う え お", "আয়, ইলিশ উঠেছে, এখনই ওঠো!", "আয় · ইলিশ · উঠেছে · এখনই · ওঠো"],
    ["か き く け こ", "কাকা কিনল কুকুর, কেন? কোথায়?", "কাকা · কিনল · কুকুর · কেন · কোথায়"],
    ["さ し す せ そ", "সাপ শিশুর সুতো সেলাই করে সোনার", "সাপ · শিশু · সুতো · সেলাই · সোনা"],
    ["た ち つ て と", "তালগাছে চিতা, সুনামি, তেল, তোতা", "তাল · চিতা · সুনামি · তেল · তোতা"],
    ["な に ぬ ね の", "নাক নিল নুডল, নেয় নোনতা", "নাক · নিল · নুডল · নেয় · নোনতা"],
    ["は ひ ふ へ ほ", "হাতি হিহি হেসে ফুঁ দেয়, হেলান দিয়ে হোটেলে", "হাতি · হিহি · ফুঁ · হেলান · হোটেল"],
    ["ま み む め も", "মা মিষ্টি মুখে মেখে মোম জ্বালায়", "মা · মিষ্টি · মুখ · মেখে · মোম"],
    ["や ゆ よ", "ইয়াক ইউ-টার্ন নিয়ে ইয়োগা করে", "ইয়াক · ইউ · ইয়োগা"],
    ["ら り る れ ろ", "রাতে রিকশায় রুটি, রেল, রোদ", "রাত · রিকশা · রুটি · রেল · রোদ"],
    ["わ を ん", "ওয়াও! ওহো! নুন!", "ওয়া · ও · ন"]
  ],
  hooksK: {
    "エ": "এলিভেটর I-beam: looks exactly like the kanji 工", "カ": "looks like the kanji 力 (power) with a shorter hook",
    "キ": "কি = key: three bars on a stem", "コ": "কোণ: a square corner bracket",
    "テ": "টেবিল: a flat top and a bent leg", "ト": "টোটেম: a pole with one branch",
    "ニ": "দুই = 二: two horizontal lines, the kanji for 2", "ノ": "নো-এন্ট্রি slash: just one slanted stroke",
    "ハ": "আট = 八: the kanji for 8", "ヘ": "হেলান: the same slope as へ",
    "ミ": "তিন = 三: three slanted lines, like 3", "メ": "মেরামত: an × repair mark",
    "ヨ": "ইয়োগা: a backwards E", "リ": "রিড: two reeds, same as り",
    "レ": "রেল: a checkmark ✓ shape", "ロ": "রো = 口 (mouth): a square box",
    "ワ": "ওয়াও!: ウ without the small cap on top"
  },
  lookalikes: {
    h: [
      ["ぬ / め", "ぬ ends in a loop (noodle); め is a plain eye."],
      ["る / ろ", "る has a loop at the end (root); ろ is open (road)."],
      ["は / ほ", "ほ has an extra bar (Santa's hat)."],
      ["わ / れ / ね", "わ curves back, れ has a tail, ね has a loop (cat tail)."],
      ["あ / お", "お has an extra stroke on the right side."],
      ["さ / き", "き has two bars and a hook; さ has one bar (snake)."],
      ["い / り", "い stands as two eels; り has the second stroke longer."]
    ],
    k: [
      ["シ / ツ", "シ: drops sweep sideways (dew); ツ: drops fall straight down (tsunami)."],
      ["ソ / ン", "ソ: short stroke stands up; ン: both strokes lean from bottom-left."],
      ["ク / ケ / タ", "ク is one hook; ケ adds a bar on the left; タ adds a cross."],
      ["ウ / ワ", "ウ has a small cap on top; ワ has none."],
      ["コ / ユ", "ユ has an extra bar sticking out at the bottom right."],
      ["マ / ム", "マ is a flat fold; ム is a small pointed crown."],
      ["ス / ヌ", "ヌ is ス with an extra short stroke."],
      ["チ / テ", "チ has a slanted top bar; テ has a flat top bar and a longer second bar."]
    ]
  }
};
