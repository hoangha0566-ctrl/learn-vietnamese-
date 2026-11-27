/*
 * DỮ LIỆU NỘI DUNG — sửa nội dung ở đây, không cần sửa code.
 * "answer" có thể là một chuỗi hoặc một mảng nhiều đáp án đúng, ví dụ ["đi", "đeo"].
 * "alt" (thẻ flashcard, món đồ trong game): các động từ khác cũng đúng.
 * Phần bên phải dấu "=" là JSON thuần (có thể copy sang file .json).
 * Dùng .js thay vì .json để trang chạy được cả khi mở trực tiếp file index.html
 * (trình duyệt chặn fetch() file .json khi mở bằng file://).
 */
window.APP_DATA = {
  "flashcards": [
    { "word": "áo",       "emoji": "👕", "en": "shirt, top",               "verb": "mặc",  "example": "Áo này đẹp quá!",                    "exampleEn": "This top is so pretty!" },
    { "word": "áo khoác", "emoji": "🧥", "en": "coat, jacket",             "verb": "mặc",  "example": "Trời lạnh, mặc áo khoác vào.",       "exampleEn": "It's cold, put your coat on." },
    { "word": "áo cộc",   "emoji": "👕", "en": "short-sleeved top",        "verb": "mặc",  "example": "Mùa hè, tôi hay mặc áo cộc.",        "exampleEn": "In summer I often wear short sleeves." },
    { "word": "quần",     "emoji": "👖", "en": "trousers, pants",          "verb": "mặc",  "example": "Tôi mới mua một cái quần.",          "exampleEn": "I just bought a pair of trousers." },
    { "word": "quần dài", "emoji": "👖", "en": "long trousers",            "verb": "mặc",  "example": "Đi làm, anh ấy mặc quần dài.",       "exampleEn": "He wears long trousers to work." },
    { "word": "quần đùi", "emoji": "🩳", "en": "shorts",                   "verb": "mặc",  "example": "Ở nhà, em mặc quần đùi cho mát.",    "exampleEn": "At home I wear shorts to stay cool." },
    { "word": "váy",      "emoji": "👗", "en": "skirt, dress",             "verb": "mặc",  "example": "Mẹ mặc váy hoa.",                    "exampleEn": "Mum is wearing a floral dress." },
    { "word": "mũ",       "emoji": "🧢", "en": "cap, hat",                 "verb": "đội",  "example": "Anh ấy đội mũ lưỡi trai.",           "exampleEn": "He is wearing a baseball cap." },
    { "word": "nón",      "emoji": "👒", "en": "hat (conical, wide brim)", "verb": "đội",  "example": "Bà đội nón lá đi chợ.",              "exampleEn": "Grandma wears a conical hat to the market." },
    { "word": "khăn",     "emoji": "🧣", "en": "scarf",                    "verb": "quàng","example": "Trời lạnh, quàng khăn vào nhé.",     "exampleEn": "It's cold, put a scarf on." },
    { "word": "cà vạt",   "emoji": "👔", "en": "necktie",                  "verb": "thắt", "example": "Bố thắt cà vạt đi làm.",             "exampleEn": "Dad wears a tie to work." },
    { "word": "giày",     "emoji": "👟", "en": "shoes",                    "verb": "đi",   "example": "Cởi giày ra trước khi vào nhà.",     "exampleEn": "Take your shoes off before going inside." },
    { "word": "tất",      "emoji": "🧦", "en": "socks",                    "verb": "đi",   "example": "Em đi tất trước khi đi giày.",       "exampleEn": "I put on socks before shoes." },
    { "word": "găng tay", "emoji": "🧤", "en": "gloves",                   "verb": "đi", "alt": ["đeo"], "example": "Mùa đông, tôi đi găng tay.",         "exampleEn": "In winter I wear gloves." },
    { "word": "đồng hồ",  "emoji": "⌚", "en": "watch",                    "verb": "đeo",  "example": "Cô ấy đeo đồng hồ đẹp lắm.",         "exampleEn": "She wears a very nice watch." },
    { "word": "kính",     "emoji": "👓", "en": "glasses",                  "verb": "đeo",  "example": "Bạn ấy đeo kính để đọc sách.",       "exampleEn": "He wears glasses to read." },
    { "word": "nhẫn",     "emoji": "💍", "en": "ring",                     "verb": "đeo",  "example": "Chị ấy đeo nhẫn cưới.",              "exampleEn": "She wears a wedding ring." }
  ],

  "verbs": [
    { "verb": "mặc",   "color": "#3b82f6", "en": "to wear (clothes)",                 "tip": "Đồ mặc lên người: quần, áo, váy.",
      "items": [ { "name": "quần", "emoji": "👖" }, { "name": "áo", "emoji": "👕" }, { "name": "váy", "emoji": "👗" } ],
      "example": "Mẹ mặc váy hoa.", "exampleEn": "Mum is wearing a floral dress." },
    { "verb": "đội",   "color": "#10b981", "en": "to wear (on the head)",             "tip": "Đồ đội trên đầu.",
      "items": [ { "name": "mũ", "emoji": "🧢" }, { "name": "nón", "emoji": "👒" } ],
      "example": "Anh ấy đội mũ rộng vành.", "exampleEn": "He is wearing a wide-brimmed hat." },
    { "verb": "đi",    "color": "#f59e0b", "en": "to put on (shoes, socks, gloves)",  "tip": "Đồ xỏ vào chân, vào tay. Găng tay: “đi” hoặc “đeo” đều được.",
      "items": [ { "name": "giày", "emoji": "👟" }, { "name": "tất", "emoji": "🧦" }, { "name": "găng tay", "emoji": "🧤" } ],
      "example": "Em đi tất trước khi đi giày.", "exampleEn": "I put on socks before shoes." },
    { "verb": "đeo",   "color": "#8b5cf6", "en": "to wear (accessories)",             "tip": "Phụ kiện: đồng hồ, kính, nhẫn…",
      "items": [ { "name": "đồng hồ", "emoji": "⌚" }, { "name": "kính", "emoji": "👓" }, { "name": "nhẫn", "emoji": "💍" }, { "name": "vòng tay", "emoji": "📿" }, { "name": "găng tay", "emoji": "🧤" } ],
      "example": "Cô ấy đeo kính.", "exampleEn": "She wears glasses." },
    { "verb": "quàng", "color": "#ef4444", "en": "to put on (scarf)",                 "tip": "Vòng quanh cổ.",
      "items": [ { "name": "khăn", "emoji": "🧣" } ],
      "example": "Trời lạnh, quàng khăn vào nhé.", "exampleEn": "It's cold, put a scarf on." },
    { "verb": "thắt",  "color": "#ec4899", "en": "to wear (necktie)",                 "tip": "Thắt nút cà vạt.",
      "items": [ { "name": "cà vạt", "emoji": "👔" } ],
      "example": "Anh ấy thắt cà vạt đỏ.", "exampleEn": "He is wearing a red tie." },
    { "verb": "cởi",   "color": "#64748b", "en": "to take off",                       "tip": "Bỏ đồ ra khỏi người — dùng cho hầu hết các món.",
      "items": [ { "name": "áo", "emoji": "👕" }, { "name": "mũ", "emoji": "🧢" }, { "name": "giày", "emoji": "👟" }, { "name": "…", "emoji": "" } ],
      "example": "Trước khi vào nhà, cởi giày ra.", "exampleEn": "Take your shoes off before going inside." }
  ],

  "verbNote": "Chú ý: <b>“đi”</b> trong bài này nghĩa là <b>mang / xỏ</b> (giày, tất, găng tay), <u>không phải</u> “đi bộ”. Giày, tất dùng <b>“đi”</b>, không dùng “đeo”. Riêng <b>găng tay</b> thì dùng <b>“đi”</b> hoặc <b>“đeo”</b> đều được.",

  "exercises": {
    "fill": {
      "title": "Bài 1 · Điền động từ",
      "instruction": "Chọn động từ đúng cho mỗi chỗ trống.",
      "items": [
        { "text": "Trời lạnh, bạn nhớ ___ khăn quàng vào nhé.",        "answer": "quàng" },
        { "text": "Nắng quá, anh ấy ___ mũ rộng vành.",                 "answer": "đội" },
        { "text": "Trước khi vào nhà, hãy ___ giày ra.",                "answer": "cởi" },
        { "text": "Cô ấy ___ đồng hồ đẹp lắm.",                         "answer": "đeo" },
        { "text": "Hôm nay tôi phải ___ cà vạt vì có cuộc họp.",        "answer": "thắt" },
        { "text": "Em ___ tất trước khi đi giày.",                      "answer": "đi" },
        { "text": "Hôm nay trời nóng, tôi ___ áo sơ mi ngắn tay.",      "answer": "mặc" }
      ]
    },
    "match": {
      "title": "Bài 2 · Ghép cột",
      "instruction": "Chọn động từ đi với từng món đồ.",
      "items": [
        { "item": "áo khoác", "emoji": "🧥", "answer": "mặc" },
        { "item": "mũ",       "emoji": "🧢", "answer": "đội" },
        { "item": "giày",     "emoji": "👟", "answer": "đi" },
        { "item": "kính",     "emoji": "👓", "answer": "đeo" },
        { "item": "khăn",     "emoji": "🧣", "answer": "quàng" },
        { "item": "cà vạt",   "emoji": "👔", "answer": "thắt" },
        { "item": "đồng hồ",  "emoji": "⌚", "answer": "đeo" },
        { "item": "tất",      "emoji": "🧦", "answer": "đi" },
        { "item": "váy",      "emoji": "👗", "answer": "mặc" },
        { "item": "nón",      "emoji": "👒", "answer": "đội" }
      ]
    },
    "picture": {
      "title": "Bài 3 · Nhìn hình, chọn động từ",
      "instruction": "Nhìn hình và chọn động từ. Tên món đồ sẽ hiện sau khi kiểm tra.",
      "items": [
        { "emoji": "🧥", "item": "áo khoác",      "answer": "mặc" },
        { "emoji": "🧢", "item": "mũ lưỡi trai",  "answer": "đội" },
        { "emoji": "🧤", "item": "găng tay",      "answer": ["đi", "đeo"] },
        { "emoji": "⌚", "item": "đồng hồ",       "answer": "đeo" },
        { "emoji": "🧣", "item": "khăn",          "answer": "quàng" },
        { "emoji": "👔", "item": "cà vạt",        "answer": "thắt" },
        { "emoji": "👟", "item": "giày",          "answer": "đi" },
        { "emoji": "👓", "item": "kính",          "answer": "đeo" }
      ]
    },
    "mcq": {
      "title": "Bài 4 · Trắc nghiệm",
      "instruction": "Chọn một đáp án. Kết quả hiện ngay sau mỗi câu.",
      "items": [
        { "text": "Bạn ấy ___ kính để đọc sách.",          "options": ["đeo", "đội", "mặc"],   "answer": "đeo" },
        { "text": "Trước khi ngủ, em ___ áo khoác ra.",    "options": ["đội", "cởi", "thắt"],  "answer": "cởi" },
        { "text": "Anh ấy ___ cà vạt đỏ đi làm.",          "options": ["quàng", "thắt", "đi"], "answer": "thắt" },
        { "text": "Hôm nay lạnh, tôi ___ găng tay.",       "options": ["đi", "đeo", "cởi"],    "answer": ["đi", "đeo"], "note": "“đi găng tay” và “đeo găng tay” đều đúng." },
        { "text": "Mẹ ___ chiếc váy hoa rất đẹp.",         "options": ["mặc", "đội", "quàng"], "answer": "mặc" },
        { "text": "Cô bé ___ mũ len đỏ trong trời tuyết.", "options": ["thắt", "đội", "đi"],   "answer": "đội" }
      ]
    }
  },

  "game": {
    "verbs": ["mặc", "đội", "đi", "đeo", "quàng", "thắt", "cởi"],
    "items": {
      "aoKhoac": { "name": "áo khoác", "en": "coat",        "emoji": "🧥", "verb": "mặc" },
      "quanDai": { "name": "quần dài", "en": "long pants",  "emoji": "👖", "verb": "mặc" },
      "khan":    { "name": "khăn",     "en": "scarf",       "emoji": "🧣", "verb": "quàng" },
      "mu":      { "name": "mũ len",   "en": "woolly hat",  "emoji": "🧢", "verb": "đội" },
      "gangTay": { "name": "găng tay", "en": "gloves",      "emoji": "🧤", "verb": "đi", "alt": ["đeo"] },
      "tat":     { "name": "tất",      "en": "socks",       "emoji": "🧦", "verb": "đi" },
      "giay":    { "name": "giày",     "en": "shoes",       "emoji": "👟", "verb": "đi" },
      "dongHo":  { "name": "đồng hồ",  "en": "watch",       "emoji": "⌚", "verb": "đeo" },
      "kinh":    { "name": "kính",     "en": "glasses",     "emoji": "👓", "verb": "đeo" },
      "quanDui": { "name": "quần đùi", "en": "shorts",      "emoji": "🩳", "verb": "mặc" },
      "aoCoc":   { "name": "áo cộc",   "en": "T-shirt",     "emoji": "👕", "verb": "mặc" }
    },
    "scenes": {
      "A": {
        "title": "Màn A · Mùa đông",
        "meter": "🌡️ Độ ấm",
        "intro": "Tuyết rơi, bạn Nam đang <b>rất lạnh</b> 🥶. Hãy mặc đồ cho Nam đến khi <b>độ ấm đạt 100%</b>.",
        "startWorn": [],
        "items": [
          { "id": "aoKhoac", "points": 20 },
          { "id": "quanDai", "points": 20 },
          { "id": "khan",    "points": 15 },
          { "id": "mu",      "points": 15 },
          { "id": "gangTay", "points": 10 },
          { "id": "tat",     "points": 10 },
          { "id": "giay",    "points": 10 },
          { "id": "dongHo",  "points": 0 },
          { "id": "kinh",    "points": 0 }
        ],
        "winEmoji": "😊",
        "winTitle": "Ấm rồi!",
        "winText": "Bạn đã mặc đủ đồ cho Nam."
      },
      "B": {
        "title": "Màn B · Mùa hè",
        "meter": "🍃 Độ mát",
        "intro": "Nắng gắt mà Nam vẫn mặc đồ mùa đông, <b>nóng quá</b> 🥵! Bước 1: <b>cởi</b> hết đồ ấm. Bước 2: <b>mặc</b> đồ mát.",
        "hint": "💡 <b>Quần đùi</b> và <b>áo cộc</b> là đồ mát cho mùa hè. Áo khoác, khăn, mũ len… là đồ ấm — mùa hè không mặc.",
        "startWorn": ["aoKhoac", "quanDai", "khan", "mu", "gangTay", "tat", "giay"],
        "removeItems": ["aoKhoac", "quanDai", "khan", "mu", "gangTay", "tat", "giay"],
        "wearItems": ["quanDui", "aoCoc"],
        "winEmoji": "😎",
        "winTitle": "Mát rồi!",
        "winText": "Bạn đã cởi hết đồ ấm và mặc quần đùi, áo cộc.",
        "bonus": {
          "question": "Câu hỏi phụ: Tại sao mùa hè không đội mũ len?",
          "options": [
            { "text": "Vì mũ len giữ ấm, trời nóng đội vào sẽ càng nóng hơn.", "correct": true },
            { "text": "Vì mũ len chỉ dùng để đeo, không dùng để đội.", "correct": false },
            { "text": "Vì mùa hè không được đội bất cứ thứ gì.", "correct": false }
          ],
          "explain": "Mũ len là đồ ấm cho mùa đông. Mùa hè nắng, nên <b>đội nón</b> hoặc <b>mũ rộng vành</b> để che nắng."
        }
      }
    }
  }
};
