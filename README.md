# VRM — Virtual Relationship Manager

**Trợ lý số hoá quan hệ khách hàng doanh nghiệp** — AI Agent đồng hành cùng RM, phục vụ Khách hàng Doanh nghiệp (KHDN) 24/7 và nâng năng lực vận hành nội bộ ngân hàng.

Dự thi: **MSB x GreenNode AI Hackathon 2026** — Track *AI for Customers*
Đội thi: Tổ Product — Ngân hàng số KHDN

🔗 **Live Demo:** https://vrm-po-dc-eb.netlify.app/

---

## 1. Bài toán

- KHDN phải gọi điện/ra quầy chỉ để tra số dư, hạn mức, biểu phí — ước tính hàng nghìn lượt liên hệ/tháng.
- Phê duyệt giao dịch bị chậm vì người duyệt (chủ DN, kế toán trưởng) khó thao tác nhanh trên điện thoại.
- Mỗi RM quản lý trung bình 150–300 KHDN, quá tải để chủ động cảnh báo rủi ro dòng tiền.
- Tra cứu quy định mất thời gian, rủi ro áp dụng nhầm văn bản cũ khi thông tư NHNN thay đổi liên tục.

## 2. Giải pháp

VRM là một **AI Agent** (không phải chatbot kịch bản cố định) gồm 6 lớp trí tuệ:

| Lớp | Chức năng |
|---|---|
| **NLU** | Hiểu ngôn ngữ tự nhiên tiếng Việt nghiệp vụ |
| **RAG** | Truy xuất tăng cường — trả lời theo quy định/biểu phí mới nhất, có nguồn trích dẫn, không bịa |
| **ML** | Dự báo dòng tiền, phát hiện rủi ro thanh khoản sớm |
| **RCM** | Gợi ý sản phẩm theo hành vi và đặc thù ngành của DN |
| **AGT** | Hành động có kiểm soát (tạo lệnh nháp, nhắc duyệt) trong khung guardrail |
| **CPL** | Copilot cho RM — tóm tắt khách hàng, soạn nháp kịch bản tư vấn bán chéo |

Sản phẩm có 2 giao diện trong cùng một ứng dụng:
- **KHDN View** — khách hàng tự tra cứu, duyệt giao dịch (bắt buộc xác thực Face ID/Soft OTP — Human-in-the-loop).
- **RM Workspace Copilot** — RM xem AI tóm tắt sức khỏe tài chính khách hàng và kịch bản tư vấn do AI soạn sẵn.

Sản phẩm hỗ trợ **2 phương thức giao tiếp song song trong cùng một khung chat**:
- **Văn bản (Text)** — gõ câu hỏi như thường lệ.
- **Giọng nói (Voice)** — bấm icon micro trên thanh Chatbar để nói trực tiếp. Nội dung nói được hiểu **y hệt** nội dung gõ (đi qua đúng một lớp NLU/RAG), và VRM phản hồi **đồng thời** bằng tin nhắn trên màn hình lẫn **giọng nói tiếng Việt**.

## 3. Công nghệ AI sử dụng

- **Nền tảng:** [GreenNode AI Platform](https://aiplatform.console.greennode.ai/) — MaaS (Model as a Service), chuẩn API tương thích OpenAI.
- **Model:** `Qwen Flash 3.6` cho các tác vụ tra cứu/RAG cần độ trễ thấp (< 5 giây); có thể chuyển sang `GLM 5.2` cho các tác vụ suy luận phức tạp hơn (dự báo, phân tích).
- **Kiến trúc RAG:** truy xuất theo từ khóa từ kho tri thức biểu phí/quy định nội bộ (`FEE_KNOWLEDGE_BASE`) → đưa vào system prompt buộc model chỉ trả lời dựa trên ngữ cảnh cung cấp → trả JSON có cấu trúc để render trực tiếp vào thẻ dữ liệu (data-card) trên giao diện.
- **Triển khai:** frontend tĩnh (HTML/CSS/JS, không framework) deploy trên Netlify; lớp gọi model kết nối trực tiếp tới GreenNode MaaS API.
- **Voice Layer (Giọng nói):** dùng **Web Speech API** ngay trên trình duyệt — `SpeechRecognition` (STT, `lang = vi-VN`, `interimResults` để hiển thị chữ theo thời gian thực) và `speechSynthesis` (TTS, giọng đọc `vi-VN`). Có bộ chuẩn hoá tiếng Việt trước khi đọc: quy đổi số tiền sang chữ (`450.000.000 đ` → *"bốn trăm năm mươi triệu đồng"*), giãn viết tắt nghiệp vụ (KHDN, RM, OTP), loại bỏ emoji. Riêng phần đọc, dùng **cơ chế 2 tầng để đảm bảo luôn phát âm đúng tiếng Việt**:
  1. **Giọng tiếng Việt trực tuyến** — 3 lựa chọn: **Hoài My** (nữ, mặc định), **Nam Minh** (nam), hoặc **Google** (dự phòng) — không cần cài đặt gì trên máy;
  2. **Giọng tiếng Việt offline của hệ điều hành** — nếu máy đã cài gói giọng Việt (Windows: *Cài đặt → Thời gian & Ngôn ngữ → Giọng nói → Tiếng Việt*).

  **Cách nguồn trực tuyến được gọi (điểm sửa quan trọng):** trình duyệt **không** gọi thẳng ra `api.streamelements.com` / `translate.google.com` nữa — cách đó hay bị chặn bởi CORS, kiểm tra Referer của Google, AdBlock hoặc firewall mạng công ty, và khi bị chặn thì thẻ `<audio>` chỉ báo lỗi chứ không ra tiếng. Thay vào đó app gọi tới **`/tts` của chính server đang phục vụ trang** — server tải hộ file MP3 rồi trả về, nên trình duyệt chỉ thấy một file nhạc bình thường. Endpoint `/tts` này có ở cả hai môi trường và **dùng chung một đường dẫn**:
  - **Chạy local:** `START_VRM.bat` khởi động `vrm_server.py` (vừa phục vụ file tĩnh vừa làm bộ chuyển tiếp `/tts`). Cần **Python** trên máy.
  - **Deploy Netlify:** `netlify/functions/tts.js` + luật rewrite `/tts` trong `netlify.toml`. **Không cần API key, không tốn phí.**

  Nếu `/tts` không có (mở bằng `file://`, hoặc chạy server cơ bản không có Python), app tự động quay về gọi trực tiếp; nếu `/tts` có mà không tải được, app cũng thử nốt đường trực tiếp trước khi chuyển sang giọng máy — và thông báo lỗi sẽ nói đúng nguyên nhân đang gặp thay vì báo chung chung.

  Người dùng chọn giọng ngay trên app bằng nút **🎚 cạnh icon loa trên Header**. Nguyên tắc dự phòng bắt buộc: hệ thống **không bao giờ âm thầm đổi giới tính giọng đọc**. Nếu giọng đã chọn không phản hồi, thứ tự xử lý là (1) thử lại chính giọng đó, (2) tìm giọng máy **cùng giới tính**, (3) thử nguồn trực tuyến khác, (4) chỉ khi không còn cách nào mới tạm dùng giọng khác giới — và luôn hiển thị dòng cảnh báo ⚠️ ngay trong thanh cài đặt để người dùng biết rõ vì sao giọng nghe được khác với lựa chọn ban đầu.

> ⚠️ **Đây là giải pháp cho demo/hackathon, không phải cấu hình production.** Hai nguồn trực tuyến (StreamElements, Google Translate) là API không chính thức, không có SLA, có thể ngừng hoạt động hoặc bị AdBlock/tường lửa chặn bất kỳ lúc nào — **không dùng trực tiếp trong sản phẩm ngân hàng thật**. Khi triển khai chính thức, cần: (1) một backend/API gateway riêng để giữ API key an toàn (không thể nhúng key trả phí vào JS phía trình duyệt), (2) một nhà cung cấp TTS/STT tiếng Việt có SLA thật — ưu tiên **FPT.AI, Zalo AI, hoặc Viettel AI**, hoặc Azure/Google Cloud Speech nếu chấp nhận xử lý dữ liệu ở nước ngoài.

> ⚠️ Toàn bộ dữ liệu khách hàng, giao dịch, số dư trong demo là **dữ liệu giả lập**, không sử dụng dữ liệu thật của MSB/TNEX/TNTalent, tuân thủ đúng thể lệ cuộc thi.

## 4. Cách chạy thử

**Cách 1 — Xem trực tiếp (khuyến nghị):**
Truy cập link demo: https://vrm-po-dc-eb.netlify.app/

**Cách 2 — Chạy 1 chạm bằng file `START_VRM.bat` (Windows, khuyên dùng khi demo):**
Nhấp đúp vào `START_VRM.bat` đặt cùng thư mục với `index.html`. File này tự động: chọn cổng còn trống → dựng web server local → mở Chrome/Edge tới `http://localhost:<cổng>/index.html`. Chạy qua `localhost` là **bắt buộc để trình duyệt cấp quyền micro** và tải được giọng đọc tiếng Việt. Nhấn phím bất kỳ trong cửa sổ đen để tắt server khi demo xong.

> ⚠️ **Cần cài Python để giọng đọc chạy.** `START_VRM.bat` ưu tiên chạy `vrm_server.py` — đây là server có kèm bộ chuyển tiếp `/tts`, thứ khiến giọng đọc trực tuyến hoạt động được. Nếu máy chưa có Python, file `.bat` vẫn dựng được web server (để test micro và giao diện) nhưng **không có `/tts`**, giọng đọc trực tuyến nhiều khả năng bị chặn. Cài Python miễn phí tại [python.org](https://www.python.org/downloads/) — khi cài nhớ tick **"Add python.exe to PATH"**.

**Cách kiểm tra nhanh bộ chuyển tiếp có chạy không:** mở `http://localhost:<cổng>/tts?voice=hoaimy&text=xin chao` trên trình duyệt — nếu nghe được tiếng là đã đúng; nếu ra chữ JSON báo lỗi thì đọc phần `detail` để biết nguồn nào chết.

**Cách 3 — Chạy local từ mã nguồn:**
1. Clone repo này về máy
2. Mở file `index.html` bằng bất kỳ trình duyệt nào (không cần cài đặt gì thêm)
3. Để kích hoạt luồng RAG gọi model GreenNode thật, mở file bằng trình soạn thảo văn bản, tìm khối `GREENNODE_CONFIG` ở đầu script và điền `apiUrl`, `apiKey`, `model` lấy từ [GreenNode AI Portal](https://aiplatform.console.greennode.ai/)
4. Lưu file và mở lại bằng trình duyệt — thử gõ "phí chuyển tiền napas là bao nhiêu" trong khung chat
5. **Thử tính năng Giọng nói:** bấm icon 🎤 trên thanh Chatbar → nói *"Cho anh xem số dư tài khoản"* → chữ tự điền vào khung chat và VRM đọc câu trả lời bằng tiếng Việt. Bật/tắt phản hồi bằng giọng nói tại **icon loa 🔊 trên Header**; đổi giọng đọc tại nút **🎚 ngay cạnh**.

> 💡 **Lưu ý về micro:** Chrome/Edge chỉ cấp quyền micro trên `https://` hoặc `localhost`. Nếu mở trực tiếp bằng `file://`, tính năng vẫn chạy ở **chế độ mô phỏng** (tự sinh câu thoại mẫu) để demo không bị gián đoạn. Để test nhận dạng giọng nói thật, chạy `python -m http.server` trong thư mục dự án rồi truy cập `http://localhost:8000`, hoặc dùng thẳng link demo Netlify.

## 5. Cấu trúc thư mục

```
├── index.html                 # Toàn bộ giao diện + logic (KHDN View, RM Workspace, RAG, Voice)
├── vrm_server.py              # Server local: file tĩnh + bộ chuyển tiếp giọng đọc /tts
├── START_VRM.bat              # Chạy demo 1 chạm trên Windows
├── netlify.toml               # Cấu hình deploy + rewrite /tts
├── netlify/functions/tts.js   # Bộ chuyển tiếp /tts khi chạy trên Netlify (không cần API key)
├── README.md                  # Tài liệu này
└── backup/                    # Các bản lưu trước mỗi lần sửa
```

## 6. Lộ trình phát triển tiếp theo

| Giai đoạn | Nội dung | Mức rủi ro |
|---|---|---|
| GĐ1 (MVP hiện tại) | Tra cứu số dư, biểu phí, RAG quy định, xem giao dịch chờ duyệt, **giao tiếp bằng giọng nói tiếng Việt (Voice ↔ Text)** | Thấp |
| GĐ2 | Dự báo dòng tiền, cảnh báo rủi ro thanh khoản, gợi ý sản phẩm cá nhân hoá | Trung bình |
| GĐ3 | Hành động có kiểm soát, Human-in-the-loop bắt buộc với giao dịch lớn, copilot đầy đủ cho RM | Cần quản trị chặt |

## 7. Đội thi

Tổ Product — Ngân hàng số KHDN, MSB x GreenNode AI Hackathon 2026, Track *AI for Customers*.
