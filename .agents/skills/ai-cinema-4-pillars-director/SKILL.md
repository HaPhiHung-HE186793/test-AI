---
name: ai-cinema-4-pillars-director
description: >-
  Use this skill whenever planning, scripting, generating assets, directing video, designing sound, post-processing, or running quality control (QC) for any AI film, TVC commercial, trailer, or cinematic video project. Enforces the 4 Industry Pillars of AI Cinema from AI_CINEMA_4_PILLARS_INDUSTRY_KNOWLEDGE_BASE.md: (1) Atomic Beats 3-5s scripting (1 action + 1 physical camera rig vector), lens/lighting grammar, 10-14 syllable lip-sync budgeting & J/L-cuts; (2) 3-Tier "Frames First, Video Second" Asset Locking (11-angle Character Turnaround + 5-Layer Negative Prompt Stack + Environment Keyframes + Mouth-Closed VO lock); (3) Specialized Multi-Model Routing vs 100% Native Google Flow SceneBuilder mode; and (4) 4-Layer Sound Architecture, DaVinci Resolve 6-Node De-AI-ifying, Scene_ID governance & 5-Layer Hollywood Finishing QC (Walter Murch Rule of Six).
---

# 🎬 AI Cinema 4-Pillars Master Director & Hollywood QC (`ai-cinema-4-pillars-director`)

Skill này kích hoạt bộ quy chuẩn **4 Trụ Cột Làm Phim AI Chuẩn Studio Điện Ảnh & Kiểm Định Chất Lượng Hậu Kỳ 5 Lớp Hollywood** dựa trên kho tri thức gốc đã khóa:
- [AI_CINEMA_4_PILLARS_INDUSTRY_KNOWLEDGE_BASE.md](../../../AI_CINEMA_4_PILLARS_INDUSTRY_KNOWLEDGE_BASE.md) *(Chế độ `AI_EDIT_MODE: OFF` — Bắt buộc `read_file` trước khi thực thi)*
- Đồng bộ trực tiếp với [flow-scenebuilder-director](../flow-scenebuilder-director/SKILL.md) và [GEMINI.md](../../../GEMINI.md).

---

## 🛡️ Quy Trình Thực Thi Bắt Buộc Qua 5 Bước Chuẩn Studio

### Bước 1: Tiền Kỳ & Bóc Tách Kịch Bản Theo Nhịp Vi Mô (`Pillar 1 — Atomic Beats & Optics`)
1. **Chia nhịp vi mô `Atomic Beats (3–5s)`**:
   - Áp dụng nghiêm ngặt công thức: **`1 Nhịp = 1 Hành động chính duy nhất + 1 Chuyển động thiết bị quay vật lý`** để chống hiện tượng tan chảy vật lý (*Motion Soup*).
   - Trên `Google Flow SceneBuilder`: Mỗi bước `Seed Clip` hoặc `Kéo dài (Extend — Pkc)` chỉ thực thi đúng 1 hành động vật lý rõ ràng + 1 chỉ dẫn ống kính trước khi kiểm tra đầu ngọn (`sZ = true`).
2. **Gọi tên chính xác Cỡ cảnh, Tiêu cự & Ánh sáng**:
   - Mở bối cảnh: `Extreme Wide Shot, 24mm anamorphic, f/8, deep focus`.
   - Biểu cảm & tương tác: `Medium Close-Up, 50mm prime, f/2.8`.
   - Đặc tả cảm xúc / chi tiết: `Extreme Close-Up / Insert Shot, 85mm–100mm prime, f/1.4, shallow DoF`.
   - Ánh sáng điện ảnh: `Chiaroscuro high contrast`, `warm tungsten Rim/Kicker backlight separation`, `Volumetric fog & motivated practicals`.
   - Giữ chặt **Trục `180°`** và **Quy tắc góc cắt `30°` + đổi tiêu cự $\ge 1.5\times$**.
3. **Ngân sách Khẩu hình & Cầu Âm thanh**:
   - Thoại trực tiếp trên hình (*On-camera Lip-Sync*): Giới hạn **`10–14 âm tiết / cảnh 5 giây`** (`2.0–2.8 âm tiết/giây`).
   - Nối thoại mượt qua vết cắt bằng **`J-Cut`** (tiếng vào sớm `0.5–1.0s`) và **`L-Cut`** (tiếng ngân trễ `0.5–1.2s`).

### Bước 2: Khóa Tĩnh Trước, Tạo Động Sau & Dùng Thực Thể `🧍 Nhân Vật` Chuẩn Google Flow (`Pillar 2 — Frames First, Video Second & @Character Chip`)
1. **Bắt buộc đóng gói Thực thể `🧍 Nhân vật` Chuẩn 6 Bước trên `/project/:projectId/character` — Cấm đi đường vòng bằng ảnh tĩnh rời**:
   - **Bước 2.1 (Chuẩn bị `Character Bible` + `Character Anchor` + 2 Prompt)**: Soạn Hồ sơ nhân vật cố định (Chủng loại, Kích thước cố định, Đặc điểm nhận dạng khóa cứng 1–4, Tính cách & Khí chất) và chuỗi `Character Anchor` tiếng Anh dùng chung cho cả 2 Prompt.
   - **Bước 2.2 (Tạo `[Chân dung]` bằng `🍌 Nano Banana Pro`)**: Vào tab **`🧍 Nhân vật`** $\rightarrow$ bấm **`+ Nhân vật mới`** (`/project/:projectId/character`) $\rightarrow$ dán **Prompt 1 (`Close-Up Avatar Portrait 1:1` chứa `Character Anchor`)** $\rightarrow$ **đổi model từ `🍌 Nano Banana 2.1` sang `🍌 Nano Banana Pro`** $\rightarrow$ bấm **`→`**.
   - **Bước 2.3 (Bấm `[🧍 Tạo cơ thể]` kế thừa ảnh `[Chân dung]` & Đổi lại sang `🍌 Nano Banana Pro`)**: Trên trang `/project/:projectId/character/:characterId`, bấm nút **`[🧍 Tạo cơ thể]`** (Flow tự động đính kèm sẵn thumbnail `[Chân dung]` vào hộp Prompt `Mô tả cơ thể và trang phục...`) $\rightarrow$ dán **Prompt 2 (`3 full-body views side-by-side: [Left: Front View], [Center: 45-degree Three-Quarter View], [Right: 90-degree Side Profile View]` trên nền xám phẳng `#808080`, `16:9`, chứa cùng `Character Anchor`)** $\rightarrow$ **bắt buộc đổi lại model từ `🍌 Nano Banana 2.1` sang `🍌 Nano Banana Pro`** $\rightarrow$ bấm **`→`**.
   - **Bước 2.4 (Điền ô `Thông tin nhân vật: Mô tả tính cách của nhân vật...` + Đổi tên `✏️` + Bấm `Xong`)**: Dán toàn bộ **Hồ sơ nhân vật gốc** vào ô `Mô tả tính cách của nhân vật...` ở cột trái $\rightarrow$ bấm `✏️` đặt tên nhân vật $\rightarrow$ bấm **`✓`** $\rightarrow$ bấm **`Xong`**.
   - **Bước 2.5 (Khóa Bối cảnh)**: Tạo **Environment Master Keyframes** khóa cứng kiến trúc, số tầng, hướng nắng và bảng màu `60-30-10`.
2. **Cách gọi Nhân vật & Bối cảnh khi tạo Video mới VÀ khi Kéo dài Video (`Gõ @ ➔ Chọn Nhân vật / Video ➔ Thêm vào câu lệnh`)**:
   - **Khi tạo Video mới**: Bắt buộc gõ **`@`** ngay tại vị trí chủ ngữ $\rightarrow$ chọn tab **`🧍 Nhân vật`** $\rightarrow$ chọn nhân vật $\rightarrow$ bấm **`Thêm vào câu lệnh`** để chèn **thẻ chip `[tên-nhân-vật]` inline vào giữa câu lệnh** kèm **thumbnail có icon `🧍` trên hộp Prompt** (cùng với `[Ảnh Bối Cảnh Gốc]`).
   - **Khi Kéo dài Video (`Video 🎥 00:00:00–00:10:00 + Chip @Nhân vật`)**: **Bắt buộc giữ thẻ chip `[tên-nhân-vật]` trong ô chữ**, đồng thời bấm **`+`** mở `Tìm kiếm thành phần` $\rightarrow$ chọn **đoạn `Video` cần kéo dài (`00:00:00 ▷ 00:10:00`)** $\rightarrow$ bấm **`Thêm vào câu lệnh`** (để trên hộp Prompt có **thumbnail Video icon `🎥`** + dưới dòng chữ có **chip `[tên-nhân-vật]`**), rồi gõ: **`[tên-nhân-vật] kéo dài video này khi mà [hành động cuối của video trước] rồi thì [hành động tiếp theo...]`** và bấm **`→`** cho `Tác nhân` thực thi.
   - **Khóa miệng khi chạy Voiceover (`Mouth-Closed Lock`)**: Mọi cảnh không có thoại trực tiếp phải có cụm `"mouth firmly closed, relaxed neutral jaw, silent contemplative expression, zero lip movement"`.
   - **Neo thiết bị quay vật lý (`Physical Camera Rig`)**: Chỉ định rõ `"locked-off heavy fluid-head tripod"`, `"heavy gimbal tracking shot"`, `"damped hydraulic dolly push-in"`, hoặc `"slow Technocrane vertical rise"` — cấm viết *"cinematic camera"* chung chung gây trôi máy bồng bềnh.

### Bước 3: Định Tuyến Mô Hình Thông Minh (`Pillar 3 — Dual-Mode Model Routing`)
- **Chế độ Mặc định của Dự án (`100% Native Google Flow SceneBuilder` theo `GEMINI.md` Mục 5)**:
  - Khóa tĩnh bằng `🍌 Nano Banana Pro` $\rightarrow$ Quay & nối liên hoàn bằng `Veo 3.1 / Omni 1.2 Flash` ngay trên Timeline `SceneBuilder` (`Seed` $\rightarrow$ `Extend` / `Jump To`) $\rightarrow$ Sinh đồng bộ 4 lớp âm thanh gốc và xuất thẳng `.mp4` nguyên bản từ Google Flow (`0% ffmpeg` can thiệp).
- **Chế độ Mở rộng Khi Người Dùng Yêu Cầu Đa Công Cụ Thương Mại (`Multi-Model Studio Pipeline`)**:
  - Tiền kỳ: `Gemini / Claude / LTX Studio / Studiovity`.
  - Keyframe: `Nano Banana Pro` (đồng nhất chỉnh sửa 4K) + `Recraft V4` (lỗ chân lông/da thật) + `Midjourney / FLUX`.
  - Video Vật lý & Cảnh Hero: `Google Flow (Veo 3.1)` / `Luma Ray 3.2` (`16-bit EXR ACES`).
  - Video Diễn xuất, Lip-Sync & Hành động dài: `Kling 3.0` (`Motion Control`) / `Seedance 2.0–2.5` (khóa kép nhân vật + bối cảnh) / `Runway Gen-4.5`.
  - Giọng nói & Nhạc: `ElevenLabs / MiniMax Audio` + `Sync Labs / Hedra` + `Flow Music / Suno / Artlist`.

### Bước 4: Hòa Âm 4 Lớp, Hậu Kỳ "Khử Mùi AI" & Quản Trị `Scene_ID` (`Pillar 4`)
1. **Kiến trúc Âm thanh 4 Lớp**:
   - `(1) Dialogue/Voiceover` có độ vang không gian thật (*Convolution Reverb*) + `(2) Foley` chi tiết từng bước chân/va chạm + `(3) Ambience/Room Tone` chạy xuyên suốt mọi vết cắt không bao giờ đứt tiếng + `(4) Cinematic Score` có `Sidechain Ducking` nhường lời thoại.
2. **Hậu kỳ `De-AI-ifying` (cho chế độ Studio đa mô hình trên DaVinci Resolve)**:
   - Cây 6 Node: `CST Input` $\rightarrow$ `Color Matching` $\rightarrow$ `Midtone Detail (-10 đến -18)` khử da nhựa $\rightarrow$ `Optical Halation (~650nm)` $\rightarrow$ `35mm Kodak 5219 Film Grain @ 24fps` $\rightarrow$ `Soft Highlight Roll-off`.
3. **Quản trị Thư mục `Scene_ID` & Bản quyền**:
   - Tách bạch thư mục `01_LOCKED_ASSETS` và `02_SCENES/SCxx_SHxx` để sửa hỏng đâu vá đúng cảnh đó; đảm bảo gói thuê bao thương mại và nhạc có giấy phép sạch.

### Bước 5: Kiểm Định Chất Lượng Hậu Kỳ 5 Lớp Hollywood Trước Khi Bàn Giao (`Mandatory 5-Layer QC`)
Không bao giờ bàn giao video nếu chưa vượt qua đủ **5 Lớp Kiểm Định Hậu Kỳ** và **Walter Murch's *Rule of Six*** (`Cảm xúc 51% > Câu chuyện 23% > Nhịp điệu 10% > Eye-Trace 7% > Trục 2D 5% > Không gian 3D 4%`):
1. **Lightbox Contact-Sheet Strip Test**: Xuất bảng lưới ảnh toàn bộ video cách đều `2–4s/frame` để kiểm tra bằng mắt xem 100% cảnh có đồng nhất kiến trúc, ánh sáng và màu sắc nhân vật không.
2. **1-Second Handover Check**: Kiểm tra điểm chuyển giao giữa các đoạn nối không bị khựng tốc độ (`v = 0`) hay nhảy tư thế.
3. **Physics & Biological Artifact Sweep**: Đảm bảo `0%` xuyên khung 3D, `0%` lún đất, `0%` mấp máy môi vô nghĩa, `0%` khói/lửa hoạt hình giả tạo.
4. **ITU-R BS.1770 Acoustic Continuity**: Đảm bảo âm lượng liền mạch xuyên suốt, không tụt hố âm thanh tại điểm nối.
5. **SMPTE Technical & Playable Report**: Khớp đúng độ phân giải, `24 fps`, thời lượng kịch bản và nhúng trực tiếp video phát ngay ở Mục 1 của Báo cáo Nghiệm thu.
