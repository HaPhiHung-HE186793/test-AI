<!-- ===================================================================== -->
<!-- 🔒 AI_EDIT_MODE: OFF                                                   -->
<!-- ===================================================================== -->
<!-- CHẾ ĐỘ BẢO VỆ FILE (READ-ONLY GUARDRAIL CHO AI AGENT):                -->
<!-- - Khi `AI_EDIT_MODE: OFF`: AI TUYỆT ĐỐI KHÔNG ĐƯỢC SỬA, XÓA, GHI ĐÈ  -->
<!--   hoặc cập nhật bất kỳ nội dung nào trong file này dưới mọi hình thức,-->
<!--   dù người dùng có nhắn gì hay thay đổi yêu cầu khác. AI chỉ được     -->
<!--   phép ĐỌC (`read_file`) để tra cứu tính năng và đề xuất quy trình.   -->
<!-- - Khi `AI_EDIT_MODE: ON`: AI mới được phép chỉnh sửa hoặc bổ sung     -->
<!--   nội dung vào file này.                                              -->
<!-- - Chỉ khi nào người dùng ra lệnh rõ ràng: "bật ON cho phép sửa file   -->
<!--   FLOW_MUSIC_MASTER_KNOWLEDGE_BASE.md" thì mới được chuyển sang ON.   -->
<!-- ===================================================================== -->

# 🎵 GOOGLE FLOW MUSIC (`flowmusic.app` / PRODUCER AI) — MASTER KNOWLEDGE BASE & CREATIVE AUDIO BIBLE

> **Tài liệu chuẩn hóa toàn diện về hệ sinh thái âm nhạc, hiệu ứng âm thanh (DSP), tách Stems, Lyria RealTime & Music Video của Google Flow (`https://www.flowmusic.app` — tên trước đây: ProducerAI / Riffusion)**
> **Cập nhật lần cuối**: 2026 (Trích xuất trực tiếp từ 6 URL thực tế trên tài khoản Google One AI Ultra `haphihung1704@gmail.com` & 73 gói mã nguồn Next.js Build `VrAhsNS3bX62ukGUCH8R0` của `flowmusic.app`).
> **Mục đích sử dụng**: Bất kỳ khi nào người dùng yêu cầu **sáng tác nhạc nền (BGM), làm bài hát có lời (Vocal Song) tiếng Việt/Anh, tạo hiệu ứng âm thanh (SFX/DSP), tách nhạc/tách lời (Stem Splitting / Remove Vocals), nối dài nhạc theo thời lượng video, tạo Audio Visualizer / Synth / VST Plugin, hoặc xuất Music Video**, AI Agent phải **tra cứu trực tiếp file này** để đề xuất công cụ, chế độ Compose, Node DSP và lệnh Prompt chuẩn xác nhất.

---

## MỤC LỤC NHANH (QUICK INDEX)

1. [Tổng quan Kiến trúc, Định danh & Hạn mức Google One AI Ultra (`Credits & Billing`)](#1-tổng-quan-kiến-trúc-định-danh--hạn-mức-google-one-ai-ultra-credits--billing)
2. [Bản đồ 6 URL Hệ sinh thái Flow Music (`flowmusic.app`)](#2-bản-đồ-6-url-hệ-sinh-thái-flow-music-flowmusicapp)
3. [URL 1: Không gian Phòng Thu AI (`/session/[id]`) — Producer Agent & 5 Chế độ Compose](#3-url-1-không-gian-phòng-thu-ai-sessionid--producer-agent--5-chế-độ-compose)
4. [Hệ thống Mô hình Âm nhạc (`Lyria 3.5 Frontier` vs `Classic Riffusion FUZZ` vs `Lyria RealTime`)](#4-hệ-thống-mô-hình-âm-nhạc-lyria-35-frontier-vs-classic-riffusion-fuzz-vs-lyria-realtime)
5. [Đồ thị Xử lý Âm thanh 27 Node (`Agentic Audio Editing` / `Recipe Graph` & DSP Effects)](#5-đồ-thị-xử-lý-âm-thanh-27-node-agentic-audio-editing--recipe-graph--dsp-effects)
6. [Danh mục Đầy đủ 51 Công cụ Nội bộ của Producer AI (`51 Agent Tools`)](#6-danh-mục-đầy-đủ-51-công-cụ-nội-bộ-của-producer-ai-51-agent-tools)
7. [URL 2: Thư viện Bài hát & Tệp tải lên (`/library/my-songs`) — Stems, Remove Vocals & Batch Export](#7-url-2-thư-viện-bài-hát--tệp-tải-lên-librarymy-songs--stems-remove-vocals--batch-export)
8. [URL 3: Không gian Tương tác, Audio Visualizer & VST/AU DAW Plugins (`/library/spaces` & `/library/plugins`)](#8-url-3-không-gian-tương-tác-audio-visualizer--vstau-daw-plugins-libraryspaces--libraryplugins)
9. [URL 4: Danh sách phát (`/library/playlists` & `/library/favorite-playlists`)](#9-url-4-danh-sách-phát-libraryplaylists--libraryfavorite-playlists)
10. [URL 5: Phòng dựng Music Video & Social Video (`/library/videos`)](#10-url-5-phòng-dựng-music-video--social-video-libraryvideos)
11. [URL 6: Quản lý Dự án Đa phiên (`/projects` & `/project/[id]`) và Chế độ Ngầm `After Hours`](#11-url-6-quản-lý-dự-án-đa-phiên-projects--projectid-và-chế-độ-ngầm-after-hours)
12. [Hệ thống REST API & WebSocket Nội bộ (`/__api/*` & `/ws/realtime`)](#12-hệ-thống-rest-api--websocket-nội-bộ-__api--wsrealtime)
13. [Chiến lược Phối hợp Song kiếm Hợp bích: `flowmusic.app` (Âm nhạc) + `flow.google.com` (Hình ảnh & Video)](#13-chiến-lược-phối-hợp-song-kiếm-hợp-bích-flowmusicapp-âm-nhạc--flowgooglecom-hình-ảnh--video)

---

## 1. Tổng quan Kiến trúc, Định danh & Hạn mức Google One AI Ultra (`Credits & Billing`)

### 1.1. Nguồn gốc & Kiến trúc Nền tảng
- **Tên chính thức**: **Flow Music** (`https://www.flowmusic.app`), thuộc **Google Labs** (tiền thân là **ProducerAI** / **Riffusion**, mã gói ứng dụng di động `com.google.android.apps.labs.reuben`, iOS App ID `6760315723`).
- **Cơ chế Xác thực & Proxy**:
  - Frontend chạy Next.js (`buildId: VrAhsNS3bX62ukGUCH8R0`), mọi lệnh gọi `/__api/:path*` được proxy sang `/api/backend/:path*`.
  - Xác thực qua **Supabase Auth** (`https://ednjccqcmbxeaxbidinr.supabase.co/auth/v1`) liên kết trực tiếp với Google OAuth và quyền lợi thuê bao Google One (`https://www.googleapis.com/auth/subscriptions.thirdparty.googleone.eligibility`).
- **Thông tin Tài khoản Đã Kết nối**:
  - **Email**: `haphihung1704@gmail.com` (`user_id`: `03bfe983-b648-4286-9267-9841cf51e23d`, Username: `QuaintTurban`).
  - **Gói Thuê bao**: **Google One AI Ultra Entitlement** (`provider: "g1_entitlement"`, `subscription_tier: "member"`, `subscription_plan: "member-monthly"`).

### 1.2. Bảng Hạn mức Credits & Quy đổi Thời lượng Nhạc (`/__api/billing/credits`)

| Hạng mục Hạn mức (`Credit Grant`) | Số Credits | Số Tokens Nội bộ (`1 Credit = 12 Tokens`) | Thời lượng Nhạc quy đổi (`~300 Credits = 1 Giờ nhạc`) | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Tổng Số dư Khả dụng (`Available Credits`)** | **`30,500 Credits`** | `366,000 Tokens` | **`101.1 Giờ nhạc`** | Tổng hợp tất cả các nguồn bên dưới |
| **Hạn mức Làm mới Hàng tháng (`Monthly Refill`)** | **`30,000 Credits`** | `360,000 Tokens` | **`100.0 Giờ nhạc`** | Cấp theo gói Google One AI Ultra mỗi tháng |
| **Quà tặng Khởi tạo (`Initial Grant`)** | **`500 Credits`** | `6,000 Tokens` | **`1.0 Giờ nhạc`** | Cấp vĩnh viễn khi mở tài khoản |
| **Tặng thêm Hàng ngày (`Daily Free`)** | **`30 Credits/ngày`** | `360 Tokens/ngày` | **`0.1 Giờ nhạc/ngày`** | Tự động reset mỗi 24 giờ |
| **Chi phí Xuất Music Video Full-length** | **`12.5 Credits / giây`** | `150 Tokens / giây` | ~`750 Credits` cho MV 60s | Có cảnh báo `long-video-credit-warning` trước khi xuất |

---

## 2. Bản đồ 6 URL Hệ sinh thái Flow Music (`flowmusic.app`)

| STT | Đường dẫn URL thực tế | Tên Phân khu | Chức năng Cốt lõi trong Quy trình Sản xuất |
| :--- | :--- | :--- | :--- |
| **1** | `https://www.flowmusic.app/session/[sessionId]?t=true` | **Session Studio (Phòng thu AI & Compose)** | Trò chuyện trực tiếp với **Producer AI Agent**, gửi link YouTube / tải file âm thanh / nhập lời bài hát, dùng **5 chế độ Compose (`Create`, `Cover`, `Extend`, `Replace`, `Advanced Node Graph`)** để sáng tác, phối lại, nối dài, sửa lỗi phát âm từng câu, tách Stems hoặc viết code Visualizer. |
| **2** | `https://www.flowmusic.app/library/my-songs` | **My Songs & Uploads (Kho Nhạc & Tệp Tải lên)** | Quản lý toàn bộ bài hát đã tạo (`My songs`) và file âm thanh người dùng tải lên (`Uploads`). Hỗ trợ lọc bài (`Hide disliked`), chọn nhiều bài tải xuống hàng loạt dạng `.zip` (`Batch Download`), tách lời/nhạc (`Split Stems` / `Remove Vocals`), cắt ngắn (`Trim`) và đẩy ngược vào Compose. |
| **3** | `https://www.flowmusic.app/library/spaces` *(kèm `/library/plugins`)* | **Interactive Spaces & VST/AU Plugins** | Kho lưu trữ các ứng dụng âm thanh tương tác (`ReactFlow` / `WebAudio` / `Canvas` / `Three.js` / `Lyria RealTime` chạy trên sandbox `jitterbug.riffusion.com`) và các **Plugin VST3/AU** (`vst_instrument`, `vst_effect`) biên dịch ra file cài đặt `.dmg`/`.exe` để nhúng thẳng vào DAW (Ableton, Logic Pro, FL Studio). |
| **4** | `https://www.flowmusic.app/library/playlists` *(kèm `/library/favorite-playlists`)* | **Playlists (Danh sách phát & Album)** | Gom các bản nhạc theo chủ đề phim/dự án thành Album/Playlist, đổi ảnh bìa, mô tả, kéo thả sắp xếp thứ tự bài (`reorder`) và chia sẻ link công khai. |
| **5** | `https://www.flowmusic.app/library/videos` *(kèm `/library/favorite-videos`)* | **Videos (Music Videos & Social Videos)** | Quản lý các video âm nhạc tạo bằng `veo3-1-fast` (`Full Music Video` ghép nhiều cảnh tự động theo nhịp bài hát, `Social Video` kèm lời Karaoke/Waveform theo 3 template `modern`, `player`, `simple`, và `Video Clip` ngắn). |
| **6** | `https://www.flowmusic.app/projects` *(kèm `/project/[id]`)* | **Projects (Quản lý Dự án Đa phiên)** | Gom nhiều phiên làm việc (`Sessions / Conversations`) vào chung một Dự án lớn (ví dụ: 1 bộ phim hoặc 1 chiến dịch TVC gồm nhiều bài nhạc nền và SFX khác nhau), hỗ trợ ảnh bìa riêng, mô tả 250 ký tự và kéo thả sắp xếp. |

> **2 Phân khu Ẩn Bổ trợ khác trong Hệ thống**:
> - `https://www.flowmusic.app/after-hours` (**After Hours**): Chế độ Producer tự hành ban đêm — AI tự động phối lại và sinh thêm các ý tưởng bài hát mới dựa trên gu của bạn khi bạn vắng mặt (`synthetic__after_hours_generation`).
> - `https://www.flowmusic.app/turntable` (**Turntable**): Đấu trường nghe mù (Blind A/B Testing) giữa 2 bản nhạc để chấm điểm huấn luyện mô hình.

---

## 3. URL 1: Không gian Phòng Thu AI (`/session/[id]`) — Producer Agent & 5 Chế độ Compose

Qua phân tích trực tiếp phiên làm việc mẫu `https://www.flowmusic.app/session/43a8c89f-84dd-4dad-9639-50ec192bfb90?t=true` (Chủ đề: **"Vietnamese Future Pop"** — nơi người dùng gửi link YouTube `https://www.youtube.com/watch?v=R8CRG6iFi-Q` và lời bài hát tiếng Việt *"Cứ Nhảy Đi"* / *"Không Tiếc Nuối"*), toàn bộ cơ chế hoạt động của Phòng thu AI như sau:

### 3.1. Quy trình 4 Bước Tự động của Producer AI Agent trong 1 Lượt Chat (`Turn`)
Khi người dùng gửi một tin nhắn (văn bản, link YouTube, lời bài hát, hoặc đính kèm file âm thanh/hình ảnh):
1. **Bước 1 — Phân tích & Lập Kế hoạch Lời + Phối khí (`lyrics__create` / `lyrics__register` hoặc `lyria__write_song_plan`)**:
   - Nếu bạn dán sẵn lời bài hát (ví dụ tiếng Việt), Agent gọi `lyrics__register` để chuẩn hóa cấu trúc phân đoạn: `[Intro]`, `[Verse 1]`, `[Pre-Chorus]`, `[Chorus]`, `[Post-Chorus]`, `[Verse 2]`, `[Bridge]`, `[Drop]`, `[Outro]`.
   - Nếu bạn chỉ nêu ý tưởng hoặc gửi link YouTube tham khảo, Agent tự động suy luận (`reasoning_traces`) về thể loại, nhịp độ (BPM), âm giai (Key), nhạc cụ chủ đạo và viết bộ lời hoàn chỉnh kèm **`sound_prompt`**.
2. **Bước 2 — Sinh Song song 2 Bản thu A/B (`Dual-Take Generation` ~35 giây)**:
   - Mặc định trong mỗi lượt yêu cầu tạo nhạc, Producer Agent luôn gọi **2 lệnh sinh nhạc song song** (`audio__create_song` hoặc `lyria__generate_song`) với 2 biến thể phối khí/giọng hát khác nhau (ví dụ: **Bản 1: Main Vocal / Energetic Mix** và **Bản 2: Alt Vocal / Deep Club Mix**) để người dùng so sánh chọn bản ưng ý nhất.
3. **Bước 3 — Hiển thị Thẻ Bài hát Tương tác (`Clip Card` & `Space Activity`)**:
   - Hiển thị trực tiếp trình phát nhạc kèm ảnh bìa, nút Play/Pause, thanh tiến trình, lời bài hát đồng bộ thời gian thực (Karaoke Timestamps) và nút mở bảng chi tiết (`Details Panel`).
4. **Bước 4 — Đề xuất 3 Hành động Tiếp theo bằng Tiếng Việt (`synthetic__suggest_actions`)**:
   - Cuối mỗi lượt phản hồi, Agent tự động tạo 3 nút gợi ý thông minh (`Quick Action Chips`) khớp với ngữ cảnh, ví dụ:
     - `[Nghe và góp ý]`
     - `[Thêm đoạn điệp khúc]` / `[Đổi giọng ca sĩ]`
     - `[Tạo Music Video]` / `[Tách nhạc và lời (Split Stems)]`

### 3.2. Chi tiết 5 Chế độ trong Bảng Compose (`composeState.mode`)
Bạn có thể mở bảng **Compose** ở thanh công cụ bên dưới hoặc nhấn nút **"Send to compose"** trên bất kỳ bài hát nào để can thiệp thủ công bằng 5 chế độ chuyên sâu:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        5 CHẾ ĐỘ COMPOSE TRÊN FLOW MUSIC                        │
├──────────────┬─────────────────────────────────────────────────────────────────┤
│ 1. CREATE    │ Sáng tác bài hát mới từ đầu (Lyrics + Sound Prompt + BPM/Seed)  │
│ 2. COVER     │ Phối lại bài hát gốc sang thể loại/giọng hát mới (giữ giai điệu)│
│ 3. EXTEND    │ Nối dài bài hát về phía sau (từ mốc giây bất kỳ thêm 5s–180s)   │
│ 4. REPLACE   │ Khoanh vùng sóng âm (Inpaint) để sửa lỗi phát âm hoặc đổi 1 đoạn│
│ 5. ADVANCED  │ Đồ thị Node âm thanh (Recipe Graph) kết hợp 27 hiệu ứng DSP & AI│
└──────────────┴─────────────────────────────────────────────────────────────────┘
```

#### Chế độ 1: `create` (Tạo bài hát / nhạc nền mới)
- **`title`**: Tên bài hát.
- **`soundPrompt` (`Sound`)**: Mô tả chi tiết thể loại (Genre), nhạc cụ (Instruments), màu giọng (Vocal timbre: *warm female vocal, airy falsetto, energetic male rap*), không gian âm nhạc (Mood/Mix).
- **`lyrics` (`Lyrics` + AI Lyrics Editor)**:
  - Nhập lời bài hát có thẻ cấu trúc (`[Verse]`, `[Chorus]`, `[Instrumental Break]`, `[End]`).
  - Tích hợp **AI Lyrics Editor Modal**: Chỉ cần gõ yêu cầu vào ô *"Describe how to edit the lyrics..."* (ví dụ: *"Đổi lời đoạn Chorus sang chủ đề mùa hè rực rỡ hơn"*), AI sẽ sửa lời và hiển thị chế độ **So sánh Thay đổi (`Diff View` xanh/đỏ)** kèm nút `Undo` / `Redo`.
- **`instrumental` Toggle**: Bật công tắc này (tương đương thẻ `[Instrumental]`) khi cần tạo **nhạc nền (BGM) thuần túy không lời** cho video thuyết minh để không đụng độ giọng Voiceover.
- **Tham số Nâng cao (`Advanced Parameters`)**:
  - **`bpm`**: Tốc độ nhịp (Beats Per Minute, ví dụ `124` cho Future Pop/House, `75` cho Ballad).
  - **`length` (`length_s`)**: Độ dài mong muốn tính bằng giây (hệ thống tự động chèn thẻ `[End - m:ss]` vào kịch bản âm thanh).
  - **`seed`**: Mã số nguyên **6 chữ số** (`100000` – `999999`). **Mẹo cực kỳ quan trọng**: Giữ nguyên `seed` + `soundPrompt` giúp **khóa màu giọng ca sĩ (Vocal Identity) và âm sắc nhạc cụ** đồng nhất giữa nhiều bài nhạc trong cùng một bộ phim!
  - **`promptStrength`**: Độ bám sát mô tả âm thanh (`0.0` – `1.0`).

#### Chế độ 2: `cover` (Phối lại / Đổi phong cách & Giọng hát — `CoverSong`)
- Dùng khi bạn đã có một bài hát gốc (`inputClipId` — có thể là bài AI tạo hoặc file bạn tự hát/đàn tải lên) và muốn **giữ nguyên giai điệu/cấu trúc hợp âm nhưng đổi sang thể loại khác hoặc giọng ca sĩ khác**.
- **Tham số**:
  - `inputClipId`: Bài hát gốc.
  - `instruction` / `soundPrompt`: Phong cách mới (ví dụ: *"Acoustic guitar ballad with emotional female vocals"* hoặc *"Cyberpunk synthwave remix"*).
  - `strength` (`Variation Strength`): Từ `0.0` đến `1.0` (mặc định `0.5`). Giá trị càng thấp càng giữ sát bản gốc; giá trị càng cao AI càng biến tấu mạnh.
  - `lyrics`: Cho phép giữ lời cũ hoặc thay lời mới trên nền giai điệu cũ.

#### Chế độ 3: `extend` (Nối dài bài hát — `ExtendSection`)
- Dùng khi bài nhạc hiện tại quá ngắn so với cảnh phim hoặc bạn muốn viết tiếp đoạn `Verse 2`, `Bridge`, `Outro`.
- **Tham số**:
  - `inputClipId`: Bài hát cần nối dài.
  - `extend_from_s` (`Extend From`): Mốc thời gian (giây) trên sóng âm nơi bắt đầu nối tiếp (nếu để trống sẽ nối từ cuối bài).
  - `extend_s` (`Extend Length`): Số giây muốn nối thêm (từ `5s` đến cửa sổ tối đa `150s–180s`).
  - `instruction` & `lyrics`: Mô tả hướng phát triển âm nhạc và lời hát của phần nối thêm.

#### Chế độ 4: `replace` (Thay thế phân đoạn / Sửa lỗi phát âm bằng WaveSurfer — `ReplaceSection` / `Inpaint`)
- **Vũ khí tối thượng khi làm nhạc tiếng Việt**: Khi một bài hát rất hay từ đầu đến cuối nhưng bị **hát sai dấu tiếng Việt ở 1–2 chữ** hoặc bạn muốn tạo một đoạn **Drop / Ngắt nhạc 5 giây** ngay giữa bài để nhường chỗ cho nhân vật trong video nói chuyện.
- **Cách hoạt động**:
  - Giao diện mở trình duyệt sóng âm **WaveSurfer (`kickboard_wavesurfer`)**.
  - Bạn kéo thanh chọn vùng thời gian cần sửa (`masks: [{ start_s, end_s }]`, hỗ trợ chọn một hoặc nhiều vùng).
  - Nhập `instruction` (mô tả âm thanh mới cho vùng đó) và sửa lại đúng câu `lyrics` tại vùng đó ➔ AI chỉ tái tạo đúng đoạn nằm trong khung chọn và hàn mượt vào 2 đầu sóng âm gốc!

#### Chế độ 5: `advanced` (Chỉnh sửa Âm thanh bằng Đồ thị Node — `Agentic Audio Editing`)
- Cho phép kết hợp cả **AI Tạo sinh** lẫn **27 Hiệu ứng Phòng thu (DSP)** theo dạng chuỗi hoặc song song (`Recipe Graph`). Xem chi tiết toàn bộ 27 Node tại **Mục 5**.

---

## 4. Hệ thống Mô hình Âm nhạc (`Lyria 3.5 Frontier` vs `Classic Riffusion FUZZ` vs `Lyria RealTime`)

Trong menu chọn **Instrument (`Frontier music models` vs `Classic`)**, Flow Music vận hành 3 thế hệ mô hình âm nhạc của Google DeepMind & Google Labs:

| Hệ Mô hình | Định danh Nội bộ (`Model / Tool`) | Đặc điểm & Thế mạnh Cốt lõi | Khi nào nên chọn? |
| :--- | :--- | :--- | :--- |
| **1. Frontier Music Models (`Lyria` / `Lyria 3.5`)** | `model: "producer"` (`lyria__write_song_plan` ➔ `lyria__generate_song`) | - Lập kế hoạch bài hát đa tầng (`song_plan_id`) trước khi render âm thanh.<br>- Độ trung thực âm thanh chuẩn phòng thu (Studio Mastering), tách bạch từng nhạc cụ, hỗ trợ đa ngôn ngữ (bao gồm **tiếng Việt có dấu** cực kỳ rõ chữ).<br>- Hỗ trợ `region_edits` và `reference_clip_ids`. | **Mặc định khuyên dùng (Recommended)** cho mọi tác vụ sáng tác bài hát có lời tiếng Việt/Anh, nhạc TVC quảng cáo và nhạc phim điện ảnh. |
| **2. Classic Models (`Riffusion FUZZ`)** | `audio__create_song` / `audio__modify_song` | - Kiến trúc spectrogram-diffusion truyền thống của Riffusion.<br>- Tốc độ phản hồi nhanh, mạnh về biến tấu loop điện tử, EDM, Lo-Fi, Hip-Hop beat và morphing giữa các âm sắc. | Khi cần tạo nhanh các bản beat điện tử, loop nền hoặc thử nghiệm biến đổi âm thanh (`Prompt Strength` + `Seed`). |
| **3. Lyria RealTime (`WebSocket Streaming`)** | `wss://<backend>/ws/realtime` (`FLOWMUSIC_REALTIME_*`) | - Sinh nhạc **luồng thời gian thực (Real-time Infinite Stream)** không có điểm dừng.<br>- Cho phép đổi `prompts` (trọng số từng thể loại/nhạc cụ) và `config` (BPM, Density, Brightness, Scale) ngay trong lúc nhạc đang phát mà không bị ngắt nhịp! | Khi dùng trong **Spaces (`/library/spaces`)** để biểu diễn DJ Live, tạo nhạc nền biến đổi linh hoạt theo hành động hoặc thu âm trực tiếp đoạn jam dài bất tận. |

---

## 5. Đồ thị Xử lý Âm thanh 27 Node (`Agentic Audio Editing` / `Recipe Graph` & DSP Effects)

Khác với các công cụ tạo nhạc AI thông thường chỉ xuất ra 1 file MP3 đóng kín, Flow Music sở hữu một **Engine Xử lý Tín hiệu Số (DSP) & Đồ thị Node (`Recipe Graph` — Module `98807`)** được điều khiển trực tiếp bằng ngôn ngữ tự nhiên thông qua bộ đôi công cụ `audio__plan_edit` ➔ `audio__render_edit` (hoặc `audio__apply_effect`).

Dưới đây là **danh sách đầy đủ 27 loại Node (`node_type`)** mà bạn có thể yêu cầu Producer AI áp dụng lên bất kỳ bài nhạc hoặc giọng thu âm nào:

### 5.1. Nhóm Node Đầu vào, Đầu ra & Định tuyến Cắt ghép (`I/O & Routing` — 8 Nodes)
1. **`Input`**: Nạp 1 file âm thanh đầu vào (`clip_id`).
2. **`Output`**: Xuất kết quả âm thanh đầu ra cuối cùng.
3. **`Trim` (Cắt xén đầu/đuôi)**: Cắt chính xác từ giây `start_s` đến `end_s`.
4. **`Join` (Nối tiếp chuỗi)**: Ghép nối nhiều đoạn âm thanh liên tiếp nhau trên trục thời gian.
5. **`Mix` (Hòa trộn đa kênh)**: Trộn 2 hoặc nhiều luồng âm thanh phát cùng lúc (ví dụ trộn Stem Nhạc nền + Stem Giọng hát).
6. **`Fade` (Làm mượt âm lượng đầu/cuối)**: Tạo hiệu ứng **Fade In** (tăng dần âm lượng mở đầu) và **Fade Out** (giảm dần âm lượng kết thúc) để **chống cụt nhạc khi hết video**.
7. **`Pan` (Định vị Không gian Trái/Phải)**: Đẩy âm thanh sang loa trái (`Left`) hoặc loa phải (`Right`) để tạo hiệu ứng âm thanh nổi 3D.
8. **`Reverse` (Đảo ngược sóng âm)**: Phát ngược đoạn âm thanh (rất hay dùng để tạo hiệu ứng *Reverse Cymbal / Riser* dẫn vào cảnh cao trào).

### 5.2. Nhóm Node Lọc Tần số & Cân bằng Âm sắc (`EQ & Filtering` — 5 Nodes)
9. **`Gain` (Khuếch đại / Giảm âm lượng)**: Tăng hoặc giảm âm lượng theo đơn vị dB.
10. **`Equalizer` (EQ Cơ bản)**: Chỉnh Bass / Mid / Treble.
11. **`AdvancedEqualizer` (EQ Tham số Chuyên sâu)**: Cắt/nâng chính xác từng dải tần số (Hz) và hệ số Q (ví dụ: dọn bớt dải `300Hz–2500Hz` của nhạc nền để nhường chỗ cho giọng thuyết minh video).
12. **`LowPass` (Bộ lọc Thông thấp — Hiệu ứng "Nghe qua tường / Dưới nước")**: Cắt bỏ toàn bộ tần số cao, chỉ giữ âm trầm ấm (cực kỳ hữu ích cho các cảnh hồi tưởng *Flashback*, cảnh dưới nước hoặc nhạc vọng ra từ bên ngoài phòng).
13. **`HighPass` (Bộ lọc Thông cao — Hiệu ứng "Loa điện thoại / Radio cũ")**: Cắt bỏ âm trầm, tạo cảm giác âm thanh phát ra từ điện thoại, bộ đàm hoặc TV cổ điển.

### 5.3. Nhóm Node Không gian, Động lực học & Biến dạng (`Dynamics & Spatial Effects` — 7 Nodes)
14. **`Reverb` (Tiếng vang Không gian)**: Giả lập độ vang của phòng nhỏ, hội trường lớn (Hall) hoặc nhà thờ (Cathedral) — dùng để hòa quyện âm thanh vào đúng bối cảnh 3D của video.
15. **`Delay` (Tiếng vọng Lặp lại / Echo)**: Tạo tiếng vọng nhại lại theo nhịp thời gian.
16. **`Chorus` (Làm dày âm thanh)**: Nhân bản và làm lệch pha nhẹ giúp giọng hát hoặc đàn synth nghe dày và rộng hơn.
17. **`Distortion` (Làm méo tiếng / Overdrive)**: Tạo độ gằn, rè mạnh mẽ cho guitar điện, bass hoặc giọng hét robot.
18. **`Bitcrusher` (Giảm độ phân giải âm thanh 8-bit)**: Biến âm thanh thành tiếng điện tử Pixel / Game Retro 8-bit cổ điển.
19. **`Compressor` (Nén Động lực học)**: Làm đều âm lượng giữa chỗ hát nhỏ và chỗ hát lớn, giúp âm thanh chắc và nổi lên phía trước.
20. **`Limiter` (Giới hạn Đỉnh âm)**: Chống vỡ tiếng (Clipping) ở ngưỡng `0 dB` khi Mastering.

### 5.4. Nhóm Node Cao độ & Tốc độ (`Pitch & Time` — 2 Nodes)
21. **`PitchShift` (Đổi Cao độ / Tone nhạc)**: Nâng hoặc hạ tone bài hát/giọng nói theo bán âm (Semitones) mà không làm đổi tốc độ.
22. **`TempoShift` (Đổi Tốc độ / Time-Stretch)**: Tăng nhanh hoặc kéo giãn chậm bài nhạc cho **khớp chính xác từng giây với độ dài cảnh video** (ví dụ: kéo bài nhạc từ `58s` thành đúng `60s`) mà không làm biến dạng giọng!

### 5.5. Nhóm Node AI Tạo sinh Chuyên biệt (`AI Generative Nodes` — 5 Nodes)
23. **`ReplaceSection`**: Thay thế 1 phân đoạn trong bài bằng AI.
24. **`ExtendSection`**: Nối dài bài nhạc bằng AI.
25. **`CoverSong`**: Phối lại bài nhạc sang phong cách mới bằng AI.
26. **`AdvancedInpaint`**: Hàn nối/tái tạo thông minh phân đoạn phức tạp giữa bài.
27. **`StemSplit`**: Tách riêng từng lớp nhạc cụ và giọng hát (`Vocals`, `Drums`, `Bass`, `Other/Instruments`).

> **Cách ra lệnh trong khung Chat**: Bạn không cần tự nối dây phức tạp! Chỉ cần nhắn cho Producer AI trong Session:
> *"Hãy lấy bài hát vừa tạo, cắt từ giây 0:00 đến 0:30 (`Trim`), thêm hiệu ứng `LowPass` ở 3 giây đầu như đang nghe ngoài cửa phòng, sau đó mở rộng bình thường và `Fade` out 3 giây cuối"*, AI sẽ tự gọi `audio__plan_edit` ➔ dựng đồ thị Node ➔ gọi `audio__render_edit` xuất ra file hoàn chỉnh!

---

## 6. Danh mục Đầy đủ 51 Công cụ Nội bộ của Producer AI (`51 Agent Tools`)

Khi bạn trò chuyện trong `/session/[id]`, Producer AI có quyền gọi **51 công cụ chuyên biệt** (trích xuất từ `module 25670`). Nắm rõ danh sách này giúp bạn biết chính xác những gì có thể sai khiến AI làm trực tiếp trong khung chat:

### 6.1. Nhóm Sáng tác Âm nhạc, Lyria & Xử lý DSP (`11 Tools`)
| Tên Tool Nội bộ | Nhãn Hiển thị trên UI | Chức năng Chi tiết |
| :--- | :--- | :--- |
| `lyria__write_song_plan` | *Writing song plan* | Lập bản thiết kế chi tiết cho mô hình **Lyria Frontier** (gồm cấu trúc bài, lời, mô tả phối khí, `reference_clip_ids`, `region_edits`). |
| `lyria__generate_song` | *Creating song* | Render âm thanh chất lượng cao từ `song_plan_id` của Lyria (hỗ trợ `prompt_strength`, `seed`, `space_version_id`). |
| `audio__create_song` | *Creating song* | Tạo bài hát mới (hoặc nhạc không lời) với `title`, `sound_prompt`, `lyrics`, `bpm`, `length_s`, `seed`. |
| `audio__modify_song` | *Modifying song* | Thực hiện `Cover`, `Extend` hoặc `Replace` trực tiếp trên một bài hát có sẵn. |
| `audio__plan_edit` | *Planning audio edit* | Thiết kế đồ thị **Recipe Graph (27 Nodes)** để chỉnh sửa/mix nhiều lớp âm thanh. |
| `audio__render_edit` | *Rendering edit* | Chạy đồ thị `recipe_id` và xuất ra bản thu âm hoàn chỉnh (`clip_outputs`). |
| `audio__apply_effect` | *Applying audio effect* | Áp nhanh một hiệu ứng DSP (Reverb, EQ, PitchShift, TempoShift, Fade, Trim...) lên bài hát. |
| `audio__split_stems` | *Splitting stems* | Tách một bài hát thành các rãnh âm thanh riêng biệt (`vocals`, `drums`, `bass`, `other`). |
| `audio__convert_format` | *Converting format* | Chuyển đổi định dạng tệp âm thanh (`.wav`, `.mp3`, `.m4a`). |
| `audio__caption` | *Analyzing audio* | Nghe và phân tích một file âm thanh (từ máy tính tải lên hoặc link) để mô tả chi tiết thể loại, nhạc cụ, BPM, tâm trạng. |
| `audio__transcribe` | *Transcribing audio* | Bóc tách lời bài hát / giọng nói từ file âm thanh thành văn bản kèm mốc thời gian (`Timestamps`). |

### 6.2. Nhóm Sáng tác & Chỉnh sửa Lời bài hát (`3 Tools`)
| Tên Tool Nội bộ | Nhãn Hiển thị trên UI | Chức năng Chi tiết |
| :--- | :--- | :--- |
| `lyrics__create` | *Writing lyrics* | Sáng tác lời bài hát mới kèm `sound_prompt` và suy luận cấu trúc (`reasoning_traces`). |
| `lyrics__edit` | *Editing lyrics* | Chỉnh sửa một phần hoặc toàn bộ lời bài hát theo yêu cầu. |
| `lyrics__register` | *Registering lyrics* | Đăng ký bộ lời do người dùng cung cấp vào phiên làm việc để chuẩn bị phổ nhạc. |

### 6.3. Nhóm Đạo diễn & Xuất Video Âm nhạc (`4 Tools`)
| Tên Tool Nội bộ | Nhãn Hiển thị trên UI | Chức năng Chi tiết |
| :--- | :--- | :--- |
| `video__propose_music_video` | *Proposing music video* | Lên kịch bản phân cảnh (Storyboard Proposal) cho Music Video khớp với cấu trúc bài hát. |
| `video__create_music_video` | *Creating music video* | Dựng **Full Music Video** nhiều cảnh tự động bằng mô hình **`veo3-1-fast`** (trải qua 6 bước: `01..04_generating_shot` ➔ `05_stitch_clips` ➔ `06_postprocess`, chi phí `12.5 credits/s`). |
| `video__create_social_video` | *Creating social video* | Xuất video ngắn đăng TikTok/Reels/Shorts với hiệu ứng đĩa nhạc/lời bài hát theo 3 giao diện: `modern`, `player`, `simple`. |
| `video__create_video_clip` | *Generating video* | Tạo một video clip đơn lẻ (`mp4`) minh họa cho bài hát hoặc Space. |

### 6.4. Nhóm Lập trình Không gian Tương tác, Visualizer & VST Plugin (`3 Tools`)
| Tên Tool Nội bộ | Nhãn Hiển thị trên UI | Chức năng Chi tiết |
| :--- | :--- | :--- |
| `code__create_space` | *Designing space* | Viết mã nguồn tạo ứng dụng WebAudio / Synth / Drum Machine / Trò chơi âm nhạc / Plugin VST3 mới. |
| `code__edit_space` | *Updating space* | Cập nhật mã nguồn, giao diện hoặc thuật toán DSP của một Space đang mở (tạo version mới `v2, v3...`). |
| `code__create_audio_visualizer` | *Creating visualizer* | Lập trình **Trình diễn Sóng âm / Hạt 3D (Audio Visualizer)** phản ứng theo nhịp Bass/Mid/Treble của bài hát theo thời gian thực! |

### 6.5. Nhóm Thiết kế Ảnh bìa (`4 Tools`)
- `image__create_image` (*Generating image*): Tạo ảnh bìa Album/Single nghệ thuật cho bài hát hoặc Playlist.
- `image__caption`: Phân tích một bức ảnh bạn tải lên để **sáng tác nhạc khớp với tâm trạng và bối cảnh của bức ảnh đó** (cực kỳ hữu ích khi bạn gửi ảnh Keyframe từ `flow.google.com` sang `flowmusic.app` để làm nhạc nền!).
- `image__display_image`: Hiển thị ảnh trong cuộc trò chuyện.
- `image__resize`: Cắt/đổi kích thước ảnh bìa theo chuẩn vuông `1:1` hoặc khung hình video.

### 6.6. Nhóm Điều khiển Trình phát, Quản lý Kho nhạc, Playlist & Hệ thống (`26 Tools`)
- **Điều khiển Player (`8 tools`)**: `player__play_song`, `player__pause_song`, `player__next_song`, `player__previous_song`, `player__play_playlist`, `player__queue_songs`, `player__set_volume`, `player__get_playing_song`.
- **Truy vấn & Quản lý Bài hát (`7 tools`)**: `songs__display_songs`, `songs__get_lyrics_timestamps`, `songs__get_metadata`, `songs__get_raw_audio_url`, `songs__list_songs`, `songs__list_trending`, `songs__update_metadata`.
- **Quản lý Playlist (`5 tools`)**: `playlists__create`, `playlists__display_playlist`, `playlists__get_details`, `playlists__list`, `playlists__update`.
- **Tương tác Hệ thống & Người dùng (`6 tools`)**: `users__display_profile`, `users__get_user_info`, `users__update_after_hours_settings`, `system__random_integer`, `system__report_feedback`, `synthetic__suggest_actions` (+ 4 trigger sự kiện: `synthetic__upload_audio`, `synthetic__upload_image`, `synthetic__compose_form_edited`, `synthetic__after_hours_generation`).

---

## 7. URL 2: Thư viện Bài hát & Tệp tải lên (`/library/my-songs`) — Stems, Remove Vocals & Batch Export

Khi truy cập `https://www.flowmusic.app/library/my-songs`, đây là trung tâm quản lý toàn bộ tài sản âm thanh của bạn:

1. **Bộ lọc Kép (`My songs` vs `Uploads` + `Hide disliked`)**:
   - **Tab `My songs`**: Toàn bộ bài hát do AI tạo ra từ tất cả các Sessions.
   - **Tab `Uploads`**: Toàn bộ file âm thanh gốc (`.mp3`, `.wav`, `.m4a`, `.flac`) mà bạn đã tải lên từ máy tính (giọng thu âm, bản demo guitar, nhạc mẫu...).
   - **Công tắc `Hide disliked`**: Tự động ẩn các bản nháp bạn đã bấm nút `Dislike` (Thumbs down) để kho nhạc luôn gọn gàng.
2. **Thao tác Hàng loạt (`Multi-Select Batch Actions`)**:
   - Khi tích chọn nhiều bài hát cùng lúc, thanh công cụ nổi hiện ra cho phép:
     - **Add to playlist**: Đưa hàng loạt bài vào 1 Playlist dự án.
     - **Batch Download (`POST /__api/batch-download-clip`)**: Nén toàn bộ các bài đã chọn thành **1 file `.zip` chứa các tệp `.m4a` chất lượng cao** để tải về máy chỉ với 1 cú nhấp chuột!
     - **Delete**: Xóa hàng loạt bản nháp không dùng.
3. **Menu Thao tác Chuyên sâu trên Từng Bài hát (`Track Context Menu & Details Panel`)**:
   - **Split Stems (`GET /__api/stems/clip/:id` / `audio__split_stems`)**: Tách bài hát thành các rãnh âm thanh độc lập (**Vocals**, **Drums**, **Bass**, **Other**). Khi dựng phim, bạn có thể tải riêng rãnh **Instrumental / Other + Drums + Bass** để làm nhạc nền, hoặc tải riêng rãnh **Vocals** để làm hiệu ứng.
   - **Remove Vocals (`POST /__api/producer/upload-audio` ➔ `/remove-vocals`)**: Tách bỏ giọng hát khỏi một bản nhạc bất kỳ để lấy nhạc Beat sạch 100%.
   - **Download Audio / Video**: Tải xuống file âm thanh gốc (`.m4a` / `.wav` / `.mp3` qua `songs__get_raw_audio_url`) hoặc tải xuống Video kèm nhạc.
   - **Send to Compose (`Cover` / `Replace` / `Extend` / `Trim`)**: Đẩy bài hát thẳng vào bảng Compose để sửa tiếp.

---

## 8. URL 3: Không gian Tương tác, Audio Visualizer & VST/AU DAW Plugins (`/library/spaces` & `/library/plugins`)

Khi truy cập `https://www.flowmusic.app/library/spaces` (và nhánh `/library/plugins`), bạn mở ra một tính năng độc nhất vô nhị của Google Flow Music: **Vibe-Coding cho Âm nhạc (Lập trình Ứng dụng & Plugin Âm thanh bằng AI)**.

### 8.1. Hai Loại hình Không gian (`space_type`)
1. **`frontend_component` (WebAudio Apps, Synths & Audio Visualizers — Tab `Spaces`)**:
   - Chạy trong môi trường sandbox bảo mật `https://jitterbug.riffusion.com/space/:versionId?token=:token` được cấp quyền truy cập **WebMIDI (bàn phím MIDI thật), Microphone, Camera, Con quay hồi chuyển (Gyroscope) và Lyria RealTime WebSocket**.
   - **Ứng dụng thực chiến cho sản xuất Video**:
     - Yêu cầu AI: *"Create a 3D Cyberpunk Neon Audio Visualizer that reacts to the bass and vocals of my song"* (`code__create_audio_visualizer`).
     - AI sẽ code ngay một ứng dụng đồ họa phản ứng theo nhịp nhạc ➔ Bạn phát bài hát của mình trong Space đó và quay màn hình / xuất video làm cảnh nền LED sân khấu hoặc MV Visualizer cực chất!
     - Ngoài ra có thể tạo: **Bàn DJ trộn nhạc trực tiếp với Lyria RealTime**, **Máy gõ nhịp (Drum Machine)**, **Bộ biến đổi giọng nói qua Micro (Voice Changer)**, hoặc **Bàn tạo hiệu ứng âm thanh Foley (Tiếng bước chân, tiếng mưa, tiếng gió, tiếng kiếm chém, tiếng laser)** có thanh trượt điều chỉnh trực tiếp!
2. **`vst_instrument` & `vst_effect` (Plugin DAW Chuyên nghiệp — Tab `Plugins`)**:
   - Flow Music cho phép bạn mô tả bằng lời một nhạc cụ ảo (Synthesizer) hoặc một cục hiệu ứng âm thanh (Reverb/Distortion/Granular FX) ➔ Hệ thống tự động biên dịch mã nguồn (`compile_status: "success" | "failure"`) thành **Plugin chuẩn VST3 / AU**!
   - Có thể tải bộ cài đặt **FlowMusic DAW Plugin Wrapper** (`FlowMusic-0.6.4-mac.dmg` qua endpoint `/__api/daw-plugin/releases`) để mở trực tiếp các nhạc cụ và hiệu ứng AI do bạn tạo ra ngay bên trong **Ableton Live, Logic Pro, FL Studio, Reaper**.

### 8.2. Quản lý Phiên bản (`Version Control v1, v2, v3...`)
- Mỗi khi bạn yêu cầu Producer AI sửa giao diện hoặc thêm nút vặn cho Space (`code__edit_space`), hệ thống lưu thành một `version_id` mới (`v1`, `v2`, `v3` kèm `change_note`), cho phép chuyển đổi qua lại hoặc khôi phục phiên bản cũ bất kỳ lúc nào.

---

## 9. URL 4: Danh sách phát (`/library/playlists` & `/library/favorite-playlists`)

Khi truy cập `https://www.flowmusic.app/library/playlists`:
- **Tạo & Đóng gói Album theo Dự án Phim (`POST /__api/playlists`)**:
  - Khi sản xuất một bộ phim hoặc một series video gồm nhiều cảnh (Cảnh Mở đầu, Cảnh Cao trào, Cảnh Cảm động, Nhạc Kết thúc End-Card), bạn có thể tạo một Playlist riêng cho bộ phim đó.
- **Tính năng Quản trị Playlist**:
  - Đổi tên, viết mô tả chi tiết, tải lên hoặc dùng AI tạo ảnh bìa riêng.
  - Thêm bài hát hàng loạt (`POST /__api/playlists/add`), xóa bài (`DELETE /__api/playlists/:id/songs`).
  - **Kéo thả sắp xếp thứ tự bài hát (`POST /__api/playlists/clips/reorder`)** theo đúng thứ tự xuất hiện từ Cảnh 1 đến Cảnh cuối của kịch bản phim.
  - Lưu các Playlist mẫu hay từ cộng đồng vào tab **Favorite Playlists (`/library/favorite-playlists`)** để làm kho nhạc tham chiếu (`reference_clip_ids`).

---

## 10. URL 5: Phòng dựng Music Video & Social Video (`/library/videos`)

Khi truy cập `https://www.flowmusic.app/library/videos`, toàn bộ các sản phẩm hình ảnh hóa từ âm nhạc được lưu trữ và quản lý tại đây. Flow Music cung cấp **3 cấp độ tạo Video trực tiếp từ Bài hát**:

| Cấp độ Video | Công cụ Nội bộ (`Tool`) | Cơ chế Hoạt động & Quy trình Xử lý | Chi phí & Ứng dụng |
| :--- | :--- | :--- | :--- |
| **1. Full Music Video (MV Đa cảnh tự động)** | `video__propose_music_video` ➔ `video__create_music_video` | - Đầu tiên AI đọc lời bài hát và mốc thời gian (`Lyrics Timestamps`) để đề xuất kịch bản phân cảnh (`Proposal`).<br>- Khi duyệt, hệ thống gọi mô hình **`veo3-1-fast`** chạy qua **6 công đoạn tự động**:<br>  1–4. `01_generating_shot` .. `04_generating_shot` (Quay các cảnh theo nhịp nhạc)<br>  5. `05_stitch_clips` (Dựng cắt cảnh khớp nhịp beat)<br>  6. `06_postprocess` (Hậu kỳ & xuất file `.mp4`). | - **`12.5 Credits / giây`** (Có hộp thoại xác nhận `long-video-credit-warning`).<br>- Dùng khi muốn xuất nhanh 1 MV ca nhạc hoàn chỉnh ngay trong Flow Music. |
| **2. Social Video (Video Ngắn kèm Lời / Đĩa nhạc)** | `video__create_social_video` | - Tự động đóng gói bài hát + ảnh bìa + lời Karaoke chạy theo nhạc thành video ngắn đăng mạng xã hội.<br>- Hỗ trợ **3 Template giao diện**:<br>  - `modern`: Phong cách hiện đại, chữ nổi bật.<br>  - `player`: Giao diện máy phát nhạc.<br>  - `simple`: Tối giản, tập trung vào ảnh bìa và âm nhạc. | - Rất nhẹ và nhanh.<br>- Dùng để đăng демо bài hát lên TikTok, YouTube Shorts, Instagram Reels, Facebook. |
| **3. Single Video Clip (Cảnh Video đơn lẻ)** | `video__create_video_clip` | - Tạo 1 đoạn video ngắn minh họa chuyển động cho ảnh bìa bài hát (Animated Cover Art / Canvas kiểu Spotify). | - Dùng làm Background động hoặc vòng lặp hình ảnh cho bài nhạc. |

---

## 11. URL 6: Quản lý Dự án Đa phiên (`/projects` & `/project/[id]`) và Chế độ Ngầm `After Hours`

### 11.1. Phân khu Quản lý Dự án (`https://www.flowmusic.app/projects`)
- **Vấn đề giải quyết**: Khi làm một dự án lớn (ví dụ: Phim ngắn 5 phút hoặc Chiến dịch Quảng cáo Tết), bạn sẽ có rất nhiều cuộc trò chuyện (`Sessions`) khác nhau: Session 1 làm nhạc nền mở đầu, Session 2 làm bài hát chủ đề (Theme Song), Session 3 thiết kế bộ hiệu ứng âm thanh (SFX Space), Session 4 tách Stems.
- **Cơ chế của `/projects`**:
  - Cho phép tạo một **Project (`POST /__api/projects`)** với Tên dự án, Mô tả (tối đa 250 ký tự) và Ảnh bìa riêng.
  - Gom bất kỳ số lượng `Sessions / Conversations` nào vào chung 1 Project (`POST /__api/projects/:id/add`).
  - Truy cập nhanh toàn bộ các bài hát đã sinh ra từ mọi Session bên trong Project đó (`GET /__api/projects/:id/clips/ids`).
  - Hỗ trợ kéo thả sắp xếp thứ tự ưu tiên các Project (`POST /__api/projects/reorder`).

### 11.2. Chế độ Sáng tác Tự hành Ban đêm (`After Hours` — `/after-hours`)
- Được cấu hình qua `users__update_after_hours_settings` và `/__api/users/settings/after-hours`.
- Khi bật **After Hours**, ngay cả khi bạn đóng trình duyệt đi ngủ, Producer AI vẫn tự động làm việc ngầm (`synthetic__after_hours_generation`): dựa trên lịch sử các bài hát bạn từng thích (`Personalization Stats` & `Favorite Clips`), AI tự phối ra các bản Demo/Remix mới và gửi sẵn vào hộp thư phiên làm việc để sáng hôm sau bạn chỉ việc nghe và chọn!

---

## 12. Hệ thống REST API & WebSocket Nội bộ (`/__api/*` & `/ws/realtime`)

Dành cho việc tự động hóa hoặc kiểm tra trạng thái bằng Script khi cần thiết, toàn bộ các Endpoint chính thức của `https://www.flowmusic.app/__api` (yêu cầu Header `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`) bao gồm:

| Nhóm Chức năng | Phương thức & Endpoint | Mô tả Dữ liệu Trả về / Tác vụ |
| :--- | :--- | :--- |
| **Tài khoản & Hạn mức** | `GET /__api/users/me`<br>`GET /__api/billing/summary`<br>`GET /__api/billing/credits`<br>`GET /__api/billing/subscription` | Thông tin người dùng, gói Google One AI Ultra (`g1_entitlement`) và số dư Credits chi tiết (`30,500 credits`). |
| **Phiên Chat & Producer AI** | `GET /__api/conversations`<br>`POST /__api/conversations`<br>`GET /__api/conversations/:id`<br>`POST /__api/messages` ➔ `GET /__api/messages/:jobId/stream` | Danh sách phiên làm việc, tạo phiên mới, gửi tin nhắn/tool call và nhận luồng phản hồi thời gian thực qua **Server-Sent Events (SSE)**. |
| **Kho Nhạc & Tải xuống** | `GET /__api/clips/auth-user`<br>`POST /__api/batch-download-clip`<br>`GET /__api/stems/clip/:clipId`<br>`GET /__api/v2/clip/:clipId/transcription-status` | Lấy danh sách bài hát đã tạo, tải hàng loạt dạng `.zip`, lấy các rãnh Stems đã tách, kiểm tra trạng thái bóc tách lời. |
| **Tải lên & Tách Lời** | `POST /__api/producer/upload-audio`<br>`POST /__api/producer/remove-vocals` | Tải tệp âm thanh từ máy lên hệ thống và chạy tác vụ xóa giọng hát lấy nhạc nền sạch. |
| **Spaces & DAW Plugins** | `GET /__api/spaces/get`<br>`POST /__api/space/:versionId/auth`<br>`GET /__api/daw-plugin/releases` | Lấy danh sách Spaces/Plugins, cấp token nhúng iframe `jitterbug.riffusion.com`, lấy link tải bộ cài VST/AU (`FlowMusic-0.6.4-mac.dmg`). |
| **Projects & Playlists** | `GET /__api/projects` / `POST /__api/projects`<br>`GET /__api/playlists` / `POST /__api/playlists` | Quản lý danh sách Dự án và Danh sách phát. |
| **Video Âm nhạc** | `POST /__api/video/generate`<br>`GET /__api/video/status/:jobId`<br>`POST /__api/video/clip` | Khởi chạy tiến trình dựng Music Video (`veo3-1-fast`), kiểm tra tiến độ 6 bước và tải file `.mp4`. |
| **Lyria RealTime WebSocket** | `wss://<backend_host>/ws/realtime` | Luồng WebSocket sinh nhạc thời gian thực (Gửi frame `authenticate`, `setPrompts`, `setConfig`, `command`, `pull` ➔ Nhận luồng `audio` liên tục). |

---

## 13. Chiến lược Phối hợp Song kiếm Hợp bích: `flowmusic.app` (Âm nhạc) + `flow.google.com` (Hình ảnh & Video)

Khi sản xuất một bộ phim hoạt hình 3D, TVC quảng cáo hoặc MV ca nhạc chuyên nghiệp bằng hệ sinh thái Google AI Ultra, chúng ta sẽ phối hợp **2 kho kiến thức (`GOOGLE_FLOW_MASTER_KNOWLEDGE_BASE.md` + `FLOW_MUSIC_MASTER_KNOWLEDGE_BASE.md`)** và **Quy chuẩn 4 Trụ cột (`google-flow-continuity-sop`)** theo quy trình chuẩn sau:

### 13.1. Kịch bản A: Sản xuất Video Thuyết minh / Phim Ngắn / TVC Quảng cáo (Có thoại nhân vật)
1. **Hình ảnh & Thoại + Foley (`flow.google.com`)**:
   - Dùng `🍌 Nano Banana Pro` tạo bộ ảnh Nhân vật (`@Character`) và `Start/End Frames` (0 Credit).
   - Dùng `Veo 3.1` quay từng cảnh 8 giây, nhúng trực tiếp **Lời thoại (Dialogue)** và **Tiếng động môi trường (Foley/SFX)** vào Đoạn 4 của Prompt.
2. **Nhạc nền BGM Chuẩn Thời lượng & Không đè Giọng nói (`flowmusic.app`)**:
   - Chụp 1 ảnh Keyframe bối cảnh chính từ `flow.google.com` tải vào `flowmusic.app/session` (`image__caption`) để Producer AI cảm nhận đúng màu sắc và cảm xúc của bộ phim.
   - Bật chế độ **`Instrumental` (Nhạc không lời)** với mô hình **Lyria Frontier (`producer`)**, đặt đúng thời lượng tổng của video (ví dụ `length_s: 45`).
   - Dùng **Agentic Audio Editing (`Recipe Graph`)** ngay trên `flowmusic.app` để hậu kỳ bản nhạc trước khi tải về:
     - Chèn Node **`AdvancedEqualizer`**: Hạ nhẹ dải tần `300Hz – 3000Hz` khoảng `-3dB` đến `-4dB` để khi ghép vào video, nhạc nền ôm trọn xung quanh mà **giọng nhân vật vẫn rõ mồn một 100%**.
     - Chèn Node **`Fade`**: Tự động `Fade In` 1.5s ở đầu và `Fade Out` 2.5s ở cuối để nhạc kết thúc êm ái tại màn hình End-Card.
     - Nếu độ dài video thay đổi vài giây sau khi cắt dựng (`Trim Handles`), dùng Node **`TempoShift`** hoặc chế độ **`Extend` / `Replace`** để co giãn bản nhạc khớp chuẩn từng khung hình!

### 13.2. Kịch bản B: Sản xuất MV Ca nhạc (Music Video) hoặc Video TikTok/Reels Theo Nhịp Beat
1. **Sáng tác Bài hát Chủ đề (`flowmusic.app`)**:
   - Viết lời tiếng Việt/Anh hoàn chỉnh trong `/session`, khóa **`Seed` 6 chữ số** để giữ chất giọng ca sĩ, sinh 2 bản A/B bằng **Lyria Frontier**.
   - Nếu có câu nào phát âm tiếng Việt chưa tròn vành rõ chữ, mở bảng Compose ➔ chọn **`Replace` (Inpaint)** ➔ quét chọn đúng 3–4 giây câu hát đó trên sóng âm WaveSurfer và bấm tạo lại cho đến khi hoàn hảo 100%.
   - Gọi **`Split Stems` (`audio__split_stems`)** để lấy cả bản Full lẫn các rãnh `Vocals`, `Drums`, `Bass` và trích xuất bảng mốc thời gian từng câu hát (`songs__get_lyrics_timestamps`).
2. **Quay Hình ảnh & Đồng bộ Nhịp (`flow.google.com` hoặc `flowmusic.app/library/videos`)**:
   - **Cách 1 (Nhanh tự động)**: Gọi `video__propose_music_video` ➔ `video__create_music_video` ngay trên `flowmusic.app` để `veo3-1-fast` tự động quay và dựng MV khớp nhịp bài hát.
   - **Cách 2 (Đạo diễn Điện ảnh Kiểm soát 100% nhân vật)**: Đưa bảng mốc thời gian bài hát (`Lyrics Timestamps`) sang quy trình **Google Flow (`flow.google.com`)**, thiết kế `@Character` + `Start/End Frames` theo từng đoạn `[Verse]`, `[Chorus]`, `[Drop]` và ghép nhạc Master từ `flowmusic.app` vào bản dựng cuối cùng!
