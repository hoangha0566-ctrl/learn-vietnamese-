# Mặc gì hôm nay? — Động từ đi với trang phục

Web học tiếng Việt (trung cấp / đầu B2): **mặc, đội, đi, đeo, quàng, thắt, cởi**.

Luồng học: **Flashcard → Học động từ → Bài tập → Game**.

## Chạy
Mở `index.html` bằng trình duyệt (không cần server, không cần cài gì).
Có thể đưa lên GitHub Pages nguyên thư mục.

## Cấu trúc
| File | Nội dung |
|---|---|
| `data/data.js` | **Toàn bộ nội dung**: thẻ, động từ, câu hỏi, bảng điểm ấm, màn game. Sửa ở đây. |
| `js/app.js` | Điều hướng, flashcard, học động từ, 4 bài tập, âm thanh, phát âm |
| `js/game.js` | Game mặc đồ (nhân vật SVG nhiều lớp, kéo thả / chạm, 7 động từ) |
| `css/style.css` | Giao diện, chế độ sáng/tối tự động, responsive |

## Game
- **Máy tính:** kéo món đồ thả vào nhân vật (hoặc bấm món đồ rồi bấm nhân vật).
- **Điện thoại:** chạm món đồ rồi chạm nhân vật. Khung nhân vật dính ở trên khi cuộn.
- Chọn 1 trong 7 động từ. Sai: không trừ điểm, ghi 1 lỗi, hiện “Với [món], ta dùng [động từ]”, cho thử lại.
- **Màn A (mùa đông):** độ ấm 0 → 100%. Đồng hồ, kính đeo đúng nhưng +0%.
- **Màn B (mùa hè):** cởi 7 món đồ ấm (có thể chạm thẳng vào đồ trên người), rồi mặc quần đùi + áo cộc. Có câu hỏi phụ “Tại sao không đội mũ len?”.

Muốn thêm món đồ vào game: thêm vào `game.items` trong `data/data.js` **và** thêm một nhóm
`<g class="wear" data-item="...">` trong hàm `charSVG()` của `js/game.js`.

## Tiến độ
Lưu bằng `localStorage` (thẻ đã thuộc, phần đã học, kỷ lục số lỗi, bật/tắt âm thanh).
Phát âm dùng giọng tiếng Việt có sẵn của máy (Web Speech API), nếu máy có.

---

# The Mystery of the Blue Jar — đọc song ngữ (thư mục `blue-jar/`)

App đọc truyện *The Mystery of the Blue Jar* (Agatha Christie, TAP II · Session 12, phần 1 + 2) kiểu trò chơi.
Mở `blue-jar/index.html` — một file duy nhất, không cần cài gì.

- **27 cảnh ngắn** (Phần 1: 10, Phần 2: 17). Chế độ **Từng cảnh** hoặc **Toàn bộ**.
- **Chạm vào từ bất kỳ** → nghĩa tiếng Việt, từ loại, từ gốc, phát âm; cụm từ/thành ngữ được nhận ra tự động.
- **Dịch tiếng Việt**: bản dịch hiện dưới từng đoạn (bật cho từng cảnh hoặc cả bài).
- Đọc xong mỗi cảnh nhận **1 manh mối**, làm đầy chiếc bình xanh.
- **Thử thách từ vựng** mỗi phần: 12 câu (Anh→Việt, Việt→Anh, điền từ vào câu trong truyện), có chuỗi đúng, sao, kỷ lục.
- **Sổ từ vựng**: lưu từ khó, ôn bằng thử thách riêng.
- **Game “Phá án cùng Jack”**: 4 chương nhập vai với Jack, Felise, Dr Lavington (chân dung đổi nét mặt, cảnh nền, hội thoại chạm-để-tra-từ). Câu hỏi từ vựng/hiểu truyện, mini-game: chọn đồng hồ đúng giờ, xếp lai lịch Heather Cottage, tìm bức tranh trong phòng, chọn đúng chiếc bình, tắt đèn. 3 tim mỗi chương, mở khóa lần lượt.

Nội dung (bài đọc, bản dịch, từ trọng tâm, cụm từ, từ điển) nằm ở đầu thẻ `<script>` trong `blue-jar/index.html`.
