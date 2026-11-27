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
