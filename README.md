# Học tiếng Việt – VSL 1

Web app dạy tiếng Việt cho người nước ngoài (sơ cấp), bám theo khung **“Giáo trình tiếng Việt cho người nước ngoài – VSL 1”**.
Dùng để giáo viên chiếu lên lớp (chế độ giáo viên) và để học viên tự ôn ở nhà (chế độ học viên).

React + Vite + TypeScript + Tailwind CSS. Không cần backend: tiến độ, điểm, sổ từ lưu trong `localStorage` của trình duyệt.

## 1. Chạy app

Cần Node.js 18 trở lên.

```bash
npm install
npm run dev        # mở http://localhost:5173
npm run build      # tạo web tĩnh trong thư mục dist/
npm run preview    # xem thử bản build
```

## 2. App có gì

| Khu | Nội dung |
|---|---|
| **Trang chủ** | Lưới 12 bài theo sách + Bài 26 (bị/được, tự soạn). Tìm kiếm, lọc chủ đề, thanh tiến độ. Nút **📘 Theo sách / 🗂️ Theo giáo trình của tôi** (bảng 27 bài, trỏ tới bài sách tương ứng). |
| **Phần một: Phát âm** | 9 đơn vị: âm và chữ, nghe chọn cặp tối thiểu, chọn dấu thanh, ghép phụ âm + vần + thanh, chính tả. Game **Bắt thanh điệu** (từ rơi, phím 1–6) và **Biểu đồ 6 thanh** (đường cao độ, có thể nói vào micro để vẽ đường của mình). |
| **Trang bài học** | 🎯 Mục tiêu · 📚 Từ vựng · 🃏 Flashcard · 🧩 Ngữ pháp · 💬 Hội thoại (nghe từng câu, ẩn/hiện bản dịch, đóng vai) · 🗣️ Thực hành nói (bảng thay thế) · 👂 Nghe · 📖 Bài đọc · ✏️ Bài tập · 🎮 Game · 🏆 Tổng kết. Phần nào không có dữ liệu thì tự ẩn. |
| **Sổ từ của tôi** | Tất cả từ vựng, đánh dấu “đã thuộc / cần ôn”, ôn tập ngắt quãng (Leitner 5 hộp: 1 → 2 → 4 → 7 → 14 ngày). |
| **⚙️ Quản lý nội dung** | Sửa từ vựng dạng bảng, sửa toàn bộ bài bằng JSON, tạo bài mới, xuất/nhập JSON, sao lưu/khôi phục tiến độ. |
| **🖨️ In / PDF** | Phiếu từ vựng + bài tập của từng bài (có tuỳ chọn kèm đáp án). |
| **📽️ Trình chiếu** | Toàn màn hình, chữ to, nút chuyển phần như slide. |
| **Mặc gì hôm nay?** | Trang web cũ (động từ mặc/đội/đeo…, trình độ trung cấp) vẫn giữ nguyên ở `public/mac-gi/`. |

**Thanh trên cùng:** `EN` bật/tắt tiếng Anh · `🔊 1× / 🐢 0.7×` tốc độ đọc · `🔔` âm thanh hiệu ứng · `A− A+` cỡ chữ · `Giáo viên / Học viên`.

**Chế độ giáo viên:** chữ to hơn, nút **👁 Hiện đáp án**, phím tắt `→` câu tiếp / `←` câu trước / `Space` hiện đáp án (lật thẻ trong flashcard), và thanh công cụ góc phải dưới: **🏅 bảng điểm đội**, **⏱️ đồng hồ đếm ngược** (30s, 60s, 2 phút, tuỳ chỉnh), **🎲 chọn ngẫu nhiên học viên**.

**Chế độ học viên:** chấm điểm ngay, sao ⭐ cho mỗi phần, huy hiệu khi xong 100% bài, chuỗi ngày học 🔥.

### Chấm câu gõ tay
- Bỏ qua chữ hoa/thường, khoảng trắng thừa, dấu câu; chuẩn hoá Unicode NFC.
- Coi như nhau: `hoà/hòa`, `khoẻ/khỏe`, `thuý/thúy`…; `cám ơn/cảm ơn`, `nghìn/ngàn`, `lẻ/linh`, `quẹo/rẽ`.
- Mỗi câu có thể có nhiều đáp án đúng (`answers`).
- Đúng chữ nhưng **thiếu / sai dấu** → “🟡 Gần đúng! Kiểm tra lại dấu” và tô màu chữ sai dấu.
- Nút `⌨️ ă` mở bàn phím ảo chèn chữ có dấu và dấu thanh (cho máy không có bộ gõ tiếng Việt).

### Phát âm
Dùng giọng `vi-VN` có sẵn của trình duyệt (Chrome/Edge có giọng Google/Microsoft tiếng Việt). Nếu máy không có giọng tiếng Việt, app hiện cảnh báo.
Nếu có file mp3: đặt vào `public/audio/` và điền `"audio": "audio/ten-file.mp3"` cho từ vựng hoặc câu hội thoại – app sẽ ưu tiên phát file này.
Luyện nói dùng nhận diện giọng nói (Chrome/Edge); trình duyệt không hỗ trợ thì học viên tự đánh giá.

## 3. Dữ liệu – sửa bài không cần sửa code

```
src/data/
  vsl1/index.json              danh sách 12 bài
  vsl1/lessons/bai-01..12.json nội dung từng bài (cấu trúc: src/data/vsl1/README.md)
  vsl1/README.md               mô tả cấu trúc dữ liệu, dạng bài tập, loại game
  extra/bai-26.json            Bài 26 (bị/được) – không có trong sách
  syllabus.json                27 bài trong giáo trình của giáo viên → bài trong app
  meta.json                    icon + huy hiệu của từng bài
  pronunciation.json           9 đơn vị phát âm + danh sách từ cho game thanh điệu
public/images/                 ảnh minh hoạ (điền "image": "images/ten.png")
```

Mọi file `.json` đặt trong `src/data/vsl1/lessons/` hoặc `src/data/extra/` đều được nạp tự động.

### Thêm bài mới
1. Cách nhanh: **⚙️ Quản lý nội dung → + Bài mới**, sửa trong trình duyệt, rồi **⬇ Xuất bài này**.
2. Chép file JSON vừa xuất vào `src/data/extra/` (hoặc `src/data/vsl1/lessons/`), chạy lại `npm run build`.
3. Muốn bài hiện trong chế độ “Theo giáo trình”: thêm/sửa dòng trong `src/data/syllabus.json` (trường `lesson` = `id` của bài).
4. Đổi thứ tự bài: chỉ cần sửa trường `number`.

> Bản sửa trong trang Quản lý nội dung chỉ lưu ở trình duyệt đó. Muốn mọi người cùng thấy: xuất JSON → chép vào thư mục dữ liệu → build lại.

### Thêm câu hỏi
Thêm phần tử vào `items` của bài tập trong file bài, ví dụ:

```json
{ "type": "fill-blank", "title": "Điền từ", "titleEn": "Fill in", "wordBank": ["là", "gì"],
  "items": [ { "q": "Anh tên ___ gì?", "answers": ["là"] } ] }
```

Các dạng: `substitution`, `fill-blank`, `multiple-choice`, `reorder`, `rewrite`, `translate-en-vi`, `translate-vi-en`, `dictation`, `number-write`, `clock`, `true-false`, `listen-choose`, `tone-pick`, `speaking`, `vocab-match`.
App còn **tự sinh** thêm cho mỗi bài: nối từ, chọn dấu thanh, nghe và chọn, chính tả, luyện nói (từ từ vựng và hội thoại).

### Thêm màn game
Mỗi game đọc `config` trong mảng `games` của bài. Ví dụ thêm màn cho **Dẫn đường** (`bai-08.json` → `games[0].config.levels`):

```json
{ "level": 5, "tourist": "Anh Tom 👨", "ask": "Xin lỗi, nhà hàng ở đâu ạ?",
  "start": { "x": 6, "y": 0, "facing": "S" }, "goal": "nha-hang", "door": { "x": 2, "y": 3 },
  "solution": ["đi thẳng", "rẽ phải", "đi thẳng", "đi thẳng", "rẽ trái", "đi thêm một chút"],
  "side": "bên phải",
  "modelAnswer": "Anh đi thẳng, đến ngã tư thì rẽ phải. Đi thẳng đến ngã tư thứ hai thì rẽ trái, đi thêm một chút. Nhà hàng ở bên phải." }
```

Bản đồ 7×7: ô (x, y) là đường nếu x chẵn hoặc y chẵn; toà nhà ở ô x, y đều lẻ. `đi thẳng` = đến ngã tư kế tiếp, `đi thêm một chút` = 1 ô, rẽ trái/phải theo hướng nhân vật. Ở chế độ khó, app hiểu câu gõ như “Anh đi thẳng, đến ngã tư thứ hai thì rẽ phải…”.

**Mặc đồ cho nhân vật** (`bai-09.json`, `dress-up`): thêm món vào `items` (`id, name, emoji, verb, alsoAccept`) và cảnh vào `scenes` (`needs` là các `id` món cần mặc, `nếuThì` là câu “Nếu … thì …”).

**Game mới:** viết component trong `src/games/` nhận `{ config }`, dùng `RoundPlayer` (khung nhiều lượt: bối cảnh → chọn/gõ câu → phản hồi) nếu phù hợp, rồi đăng ký `type` trong `src/games/registry.ts`.
26 loại game đã có: `name-party, polite-reply, passport-check, family-album, job-fair, spy-camera, address-delivery, talent-team, number-bingo, magic-clock, daily-routine, market-shopping, hide-and-seek, quick-count, time-machine, trip-calendar, duration-bar, direction-map, argue-back, ticket-booking, dress-up, neighbour-chat, family-tree, who-is-we, restaurant-order, review-board`, và `clinic` (Bài 26).
Mỗi game có 2 chế độ: **🟢 Chọn đáp án** (dễ) và **🔴 Tự gõ câu** (khó).

## 4. Đưa web lên mạng

`npm run build` tạo thư mục `dist/` (web tĩnh, đường dẫn tương đối nên chạy được ở thư mục con).

- **GitHub Pages:** repo đã có `.github/workflows/deploy.yml`. Vào *Settings → Pages → Source: GitHub Actions*. Mỗi lần push lên nhánh `main`, web tự build và đăng.
- **Netlify:** kéo thả thư mục `dist/` vào app.netlify.com/drop, hoặc kết nối repo với build command `npm run build`, publish directory `dist`.
- **Vercel:** Import repo → Framework “Vite” → Deploy.

App dùng địa chỉ dạng `#/lesson/bai-01`, nên không cần cấu hình chuyển hướng trên server.

## 5. Bản quyền nội dung

Từ vựng và điểm ngữ pháp theo khung sách; hội thoại, bài đọc, bài tập trong app được soạn mới (trường `bookDialogues` chỉ ghi số trang hội thoại gốc để giáo viên mở sách).
Nếu đưa app lên mạng công khai, không chép nguyên văn hội thoại/bài đọc của sách vào dữ liệu.
