# Dữ liệu bài học VSL 1 cho app dạy tiếng Việt

Dữ liệu này soạn theo **Giáo trình tiếng Việt cho người nước ngoài – VSL 1** (NXB ĐHQG TP.HCM, 2018), Phần hai: 12 bài học.

- `index.json`: danh sách 12 bài, dùng cho trang chủ.
- `lessons/bai-01.json` … `bai-12.json`: nội dung từng bài.

## Về nội dung

| Phần | Nguồn |
|---|---|
| Từ vựng, điểm ngữ pháp, mục tiêu | Lấy theo từng bài trong sách. Phần giải thích được viết lại song ngữ cho ngắn gọn. |
| `bookDialogues` | Tên và số trang các hội thoại gốc trong sách. Giáo viên mở sách để dạy hội thoại gốc. |
| `dialogues`, `reading`, `exercises` | Soạn mới, cùng tình huống, cùng mẫu câu và từ vựng của bài. Không chép nguyên văn từ sách. |
| `games` | Game tương tác, soạn mới. |

Mỗi bài có trường `syllabusLessons`, cho biết bài đó tương ứng với những bài nào trong giáo trình Excel của giáo viên. Riêng bài “sức khoẻ, bị/được” (Bài 26 trong giáo trình) không có trong sách nên chưa có dữ liệu.

## Cấu trúc một bài

```text
id, number, bookLesson, bookPages, syllabusLessons
topic / topicEn, title / titleEn
objectives[]        { vi, en }
bookDialogues[]     { page, title }
vocabulary[]        { word, meaning, type, example?, exampleEn?, image, audio }
grammar[]           { pattern, explainVi, explainEn, examples[{vi,en}], note }
dialogues[]         { title, titleEn, lines[{speaker, vi, en}] }
reading             { title, text, translation, trueFalse[{q, answer}], questions[{q, answers[]}] }
exercises[]         { type, title, titleEn, items[], wordBank?, freeAnswer? }
games[]             { type, title, titleEn, intro, introEn, config }
```

### Các dạng bài tập (`exercises[].type`)

| type | items | Ghi chú |
|---|---|---|
| `substitution` | `{ frame: "{0} có khoẻ không?", slots: [[...]], en }` | Bảng thay thế: bấm từng ô thì ghép câu và đọc to |
| `fill-blank` | `{ q: "... ___ ...", answers[] }` | Có `wordBank` thì hiển thị ngân hàng từ |
| `multiple-choice` | `{ q, options[], answer (số thứ tự, bắt đầu từ 0), explain }` | |
| `reorder` | `{ words[], answers[] }` | Kéo thả thẻ từ thành câu |
| `rewrite` | `{ q, answers[], instruction? }` | Có `freeAnswer: true` thì là bài viết tự do: hiện đáp án mẫu, không chấm tự động |
| `translate-en-vi` / `translate-vi-en` | `{ q, answers[] }` | Chấp nhận bất kỳ đáp án nào trong `answers` |
| `dictation` | `{ q, answers[] }` | App đọc `q` bằng giọng vi-VN, học viên gõ lại |
| `number-write` | `{ q, answers[] }` | Đọc số bằng chữ, viết bằng số |
| `clock` | `{ q: "07:30", answers[] }` | Vẽ đồng hồ theo `q`, học viên viết giờ |

### Quy tắc chấm câu gõ tay

1. Chuẩn hoá Unicode NFC, viết thường, bỏ dấu câu và khoảng trắng thừa.
2. Coi hai cách đặt dấu là như nhau: `oà/òa`, `oá/óa`, `oả/ỏa`, `oã/õa`, `oạ/ọa`, `oè/òe`, `oé/óe`, `oẻ/ỏe`, `oẽ/õe`, `oẹ/ọe`, `uý/úy`, `uỳ/ùy`, `uỷ/ủy`, `uỹ/ũy`, `uỵ/ụy`. Ví dụ “khoẻ” và “khỏe” đều đúng.
3. Coi các cặp từ đồng nghĩa sau là như nhau: `cám ơn/cảm ơn`, `nghìn/ngàn`, `lẻ/linh`.
4. Nếu câu khớp với một đáp án sau khi bỏ hết dấu thanh, báo “Gần đúng – kiểm tra dấu thanh” và tô các chữ sai dấu.

### Các loại game (`games[].type`)

| type | Bài | Mô tả |
|---|---|---|
| `name-party` | 1 | Chọn đại từ (ông/bà/anh/chị/cô/thầy/em) theo tuổi, giới tính, rồi hỏi tên |
| `polite-reply` | 1 | Chọn câu trả lời lễ phép; có thanh “lịch sự” |
| `passport-check` | 2 | Xem cờ trên hộ chiếu, nói quốc tịch; câu hỏi “phải không?” |
| `family-album` | 2 | Chọn đây/đó/kia theo khoảng cách |
| `job-fair` | 3 | Đoán nghề và nơi làm việc |
| `spy-camera` | 3 | Mô tả “… đang … ở …” |
| `address-delivery` | 4 | Sắp xếp địa chỉ; nghe số điện thoại |
| `talent-team` | 4 | Hỏi “… được không?” để chọn người |
| `number-bingo` | 4 | Bingo số 0–99 |
| `magic-clock` | 5 | Kéo kim đồng hồ; nền trời đổi màu theo buổi |
| `daily-routine` | 5 | Dòng thời gian; thanh trượt tần suất |
| `market-shopping` | 5 | Hỏi giá, trả bằng tờ tiền Việt Nam |
| `hide-and-seek` | 6 | Chọn “đi đâu?” hay “ở đâu?” |
| `quick-count` | 6 | Chọn “mấy” hay “bao nhiêu”; cảm thán với “quá” |
| `time-machine` | 7 | Vị trí của “bao giờ” trong câu: tương lai hay quá khứ |
| `trip-calendar` | 7 | Kéo hoạt động vào lịch tuần |
| `duration-bar` | 7 | Kéo thanh dài đúng khoảng thời gian (bao lâu) |
| `direction-map` | 8, 12 | Chỉ đường trên bản đồ lưới (xem bên dưới) |
| `argue-back` | 8 | Bác bỏ ý kiến bằng “không … lắm đâu” |
| `ticket-booking` | 9 | Bán vé: chọn ngày, chuyến, loại vé |
| `dress-up` | 9 | Mặc đồ cho nhân vật theo thời tiết; động từ mặc/đội/đeo/quàng/đi/cầm |
| `neighbour-chat` | 10 | Hỏi “đã … chưa?”, trả lời rồi/chưa/còn |
| `family-tree` | 10 | Cây gia đình |
| `who-is-we` | 10 | Chọn “chúng tôi” hay “chúng ta” |
| `restaurant-order` | 11 | Phục vụ khách dễ tính, khó tính, khách vội |
| `review-board` | 12 | Cờ cá ngựa ôn tập: câu hỏi lấy ngẫu nhiên từ bài 1–12 |

### Bản đồ chỉ đường (`direction-map`)

- Lưới 7×7. Ô (x, y) là đường nếu x chẵn hoặc y chẵn; ô là ngã tư nếu cả x và y đều chẵn. Các toà nhà nằm ở ô có x và y đều lẻ.
- Hướng nhân vật: N (lên trên), E (sang phải), S (xuống dưới), W (sang trái).
- Các lệnh:
  - `đi thẳng`: đi 2 ô.
  - `đi thêm một chút`: đi 1 ô.
  - `rẽ trái` / `rẽ phải`: quay theo hướng nhân vật đang nhìn, không theo màn hình.
- Qua màn khi nhân vật dừng đúng ô `door` của màn đó. Sau đó học viên trả lời toà nhà ở `side` (bên trái/bên phải) so với hướng nhân vật đang nhìn.
- Lời giải của cả 4 màn đã được chạy mô phỏng và đều đúng.
