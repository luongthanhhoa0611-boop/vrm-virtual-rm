# VRM — Virtual Relationship Manager

**Trợ lý số hoá quan hệ khách hàng doanh nghiệp** — AI Agent đồng hành cùng RM, phục vụ Khách hàng Doanh nghiệp (KHDN) 24/7 và nâng năng lực vận hành nội bộ ngân hàng.

Dự thi: **MSB x GreenNode AI Hackathon 2026** — Track *AI for Customers*
Đội thi: Tổ Product — Ngân hàng số KHDN

🔗 **Live Demo:** https://vrm-demo.netlify.app/

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
- **Triển khai:** frontend tĩnh (HTML/CSS/JS, không framework) + một Netlify Function duy nhất; lớp gọi model kết nối trực tiếp tới GreenNode MaaS API.

> ⚠️ Toàn bộ dữ liệu khách hàng, giao dịch, số dư trong demo là **dữ liệu giả lập**, không sử dụng dữ liệu thật của MSB/TNEX/TNTalent, tuân thủ đúng thể lệ cuộc thi.

## 4. Lớp Giọng nói (Voice Layer)

### 4.1. Nghe (Speech-to-Text)

Dùng **Web Speech API** ngay trên trình duyệt — `SpeechRecognition` với `lang = vi-VN` và `interimResults` để hiển thị chữ theo thời gian thực khi người dùng đang nói.

### 4.2. Đọc (Text-to-Speech)

Trước khi đọc, văn bản đi qua bộ **chuẩn hoá tiếng Việt**: quy đổi số tiền sang chữ (`450.000.000 đ` → *"bốn trăm năm mươi triệu đồng"*), giãn viết tắt nghiệp vụ (KHDN, RM, OTP), loại bỏ emoji, cắt câu an toàn (không cắt nhầm ở dấu chấm trong số lớn).

Phần phát âm dùng **cơ chế 2 tầng**:

1. **Giọng tiếng Việt trực tuyến** — 3 lựa chọn: **Hoài My** (nữ, mặc định), **Nam Minh** (nam), **Google** (dự phòng) — không cần cài gì trên máy người dùng.
2. **Giọng tiếng Việt offline của hệ điều hành** — nếu máy đã cài gói giọng Việt (Windows: *Cài đặt → Thời gian & Ngôn ngữ → Giọng nói → Tiếng Việt*). Tầng này đọc được **kể cả khi mất mạng**.

### 4.3. Vì sao cần một Netlify Function chỉ để đọc?

Đây là điểm kỹ thuật đáng chú ý nhất của lớp Voice, và là **lỗi đã gặp thật rồi sửa**.

Ở bản đầu, trình duyệt gọi thẳng nguồn giọng bằng thẻ `<audio src="https://...">`. Cách này **hỏng trên môi trường thật**: bị chặn bởi CORS, cơ chế kiểm tra Referer của Google, AdBlock, hoặc firewall mạng doanh nghiệp. Tệ hơn, khi bị chặn thì `<audio>` chỉ báo `MediaError` chứ không ra tiếng — người dùng thấy app "im lặng" mà không hiểu vì sao.

Bản hiện tại đổi hướng đi: trình duyệt gọi tới **`/tts` của chính domain đang phục vụ trang**. Function tải hộ file MP3 rồi trả về, nên trình duyệt chỉ thấy một file nhạc cùng origin — **không thể bị chặn bởi CORS hay Referer**.

Endpoint `/tts` dùng **chung một đường dẫn** ở cả hai môi trường, nên mã nguồn `index.html` không cần biết nó đang chạy ở đâu:

| Môi trường | Ai phục vụ `/tts` |
|---|---|
| Deploy Netlify | `netlify/functions/tts.js` + luật rewrite trong `netlify.toml` |
| Chạy local | Một web server nhỏ có kèm proxy tương tự (xem mục 5.2) |

App tự dò `/tts` khi tải trang. Nếu không có (ví dụ mở bằng `file://`), nó tự quay về gọi trực tiếp; nếu `/tts` có mà tải không được, nó thử nốt đường trực tiếp trước khi chuyển sang giọng máy. Thông báo lỗi hiển thị **đúng nguyên nhân đang gặp** thay vì báo chung chung.

### 4.4. Nguyên tắc: không bao giờ âm thầm đổi giới tính giọng đọc

Người dùng chọn giọng bằng nút **🎚 cạnh icon loa trên Header**. Khi giọng đã chọn không phản hồi, thứ tự xử lý là:

1. Thử lại chính giọng đó (phòng lỗi mạng thoáng qua)
2. Tìm **giọng máy cùng giới tính**
3. Thử nguồn trực tuyến khác
4. Chỉ khi hết cách mới tạm dùng giọng khác giới — và **bắt buộc** hiện dòng cảnh báo ⚠️ trong thanh cài đặt

Lý do: một trợ lý ngân hàng tự ý đổi từ giọng nam sang giọng nữ giữa chừng mà không giải thích sẽ khiến người dùng nghĩ hệ thống bị lỗi hoặc bị mạo danh. Minh bạch quan trọng hơn việc "cứ đọc cho xong".

### 4.5. Giới hạn cần nói thẳng

> ⚠️ **Đây là cấu hình cho demo/hackathon, không phải cho sản phẩm thật.** Hai nguồn giọng đang dùng (StreamElements, Google Translate) là **API không chính thức, không có SLA** — có thể ngừng hoạt động bất kỳ lúc nào. Chúng được chọn vì cho phép demo chạy mà không cần API key, không cần thẻ tín dụng, không phát sinh chi phí.
>
> Khi lên sản phẩm thật, lớp này phải thay bằng nhà cung cấp TTS/STT tiếng Việt có cam kết dịch vụ — ưu tiên **FPT.AI, Zalo AI, hoặc Viettel AI** (hạ tầng trong nước, phù hợp yêu cầu bảo vệ dữ liệu cá nhân theo NĐ 13/2023). Kiến trúc hiện tại đã sẵn sàng cho việc đó: chỉ cần sửa danh sách nguồn trong `netlify/functions/tts.js`, phần còn lại của ứng dụng không phải đổi một dòng nào.
>
> Lưu ý về nền tảng: **GreenNode MaaS không cung cấp model TTS/STT** — danh mục hiện chỉ có Chat, Image Generation, Embedding, Completion. GreenNode đảm nhiệm phần "bộ não" (NLU/RAG), phần "giọng nói" vẫn cần một nhà cung cấp riêng. Hai thứ này bổ trợ chứ không thay thế nhau.

## 5. Cách chạy thử

### 5.1. Xem demo trực tiếp (khuyến nghị)

Truy cập **https://vrm-demo.netlify.app/**

Thử tính năng Giọng nói: bấm icon 🎤 trên thanh Chatbar → nói *"Cho anh xem số dư tài khoản"* → chữ tự điền vào khung chat và VRM đọc câu trả lời bằng tiếng Việt. Bật/tắt phản hồi giọng nói tại **icon loa 🔊 trên Header**; đổi giọng tại nút **🎚 ngay cạnh**.

### 5.2. Chạy local từ mã nguồn

```bash
git clone https://github.com/<tài-khoản>/vrm-virtual-rm.git
cd vrm-virtual-rm
npx netlify-cli dev
```

`netlify dev` dựng cả web server lẫn Netlify Function, nên `/tts` hoạt động y hệt môi trường thật. Truy cập địa chỉ `http://localhost:8888` mà nó in ra.

> 💡 **Vì sao không mở thẳng `index.html`?** Chrome/Edge chỉ cấp quyền micro trên `https://` hoặc `localhost`. Mở bằng `file://` thì tính năng vẫn chạy ở **chế độ mô phỏng** (tự sinh câu thoại mẫu để demo không gián đoạn), nhưng không nhận dạng giọng nói thật và không có `/tts`.

**Kích hoạt luồng RAG gọi model thật:** mở `index.html` bằng trình soạn thảo, tìm khối `GREENNODE_CONFIG` ở đầu script và điền `apiUrl`, `apiKey`, `model` lấy từ [GreenNode AI Portal](https://aiplatform.console.greennode.ai/). Thử gõ *"phí chuyển tiền napas là bao nhiêu"* trong khung chat.

### 5.3. Kiểm tra bộ chuyển tiếp giọng đọc

Mở trên trình duyệt (thay `<địa-chỉ>` bằng domain đang chạy):

```
https://<địa-chỉ>/tts?voice=hoaimy&text=xin chao
```

| Kết quả | Nghĩa là |
|---|---|
| 🔊 Nghe được tiếng | Bộ chuyển tiếp hoạt động bình thường |
| `{"error": ...}` | Function chạy nhưng nguồn giọng lỗi — đọc phần `detail` để biết nguồn nào chết |
| **404** | Function chưa được deploy — kiểm tra `netlify/functions/tts.js` đã có trong repo chưa |

## 6. Cấu trúc repo

```
├── index.html                 # Toàn bộ giao diện + logic (KHDN View, RM Workspace, RAG, Voice)
├── netlify.toml               # Cấu hình deploy + luật rewrite /tts
├── netlify/functions/tts.js   # Bộ chuyển tiếp giọng đọc (không cần API key)
└── README.md                  # Tài liệu này
```

Toàn bộ ứng dụng nằm trong **một file `index.html`** — không framework, không bước build, không dependency. Chủ ý để bất kỳ ai cũng mở lên đọc và chạy được ngay, phù hợp bối cảnh prototype thi đấu.

**Deploy:** Netlify tự đọc `netlify.toml`, không cần khai build command hay publish directory. Lưu ý: Netlify Functions **chỉ hoạt động khi deploy qua Git hoặc Netlify CLI** — cách kéo-thả thư mục (Netlify Drop) chỉ đăng file tĩnh, `/tts` sẽ trả 404 và giọng đọc sẽ không chạy.

## 7. Lộ trình phát triển tiếp theo

| Giai đoạn | Nội dung | Mức rủi ro |
|---|---|---|
| GĐ1 (MVP hiện tại) | Tra cứu số dư, biểu phí, RAG quy định, xem giao dịch chờ duyệt, **giao tiếp bằng giọng nói tiếng Việt (Voice ↔ Text)** | Thấp |
| GĐ2 | Dự báo dòng tiền, cảnh báo rủi ro thanh khoản, gợi ý sản phẩm cá nhân hoá | Trung bình |
| GĐ3 | Hành động có kiểm soát, Human-in-the-loop bắt buộc với giao dịch lớn, copilot đầy đủ cho RM | Cần quản trị chặt |

## 8. Đội thi

Tổ Product — Ngân hàng số KHDN, MSB x GreenNode AI Hackathon 2026, Track *AI for Customers*.
