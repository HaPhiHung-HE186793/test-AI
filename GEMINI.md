# 🎬 QUY TẮC BẮT BUỘC TOÀN DỰ ÁN GOOGLE FLOW & FLOW MUSIC (`GEMINI.md` — ALWAYS ACTIVE)

Mọi AI Agent làm việc trong dự án này bắt buộc phải tuân thủ tuyệt đối các quy chuẩn kiến trúc và quy trình dưới đây trong mọi phiên làm việc (Session):

---

## 1. 🔒 QUY TẮC BẢO VỆ 7 KHO TRI THỨC GỐC (`AI_EDIT_MODE: OFF` — CHỈ ĐỌC)

Trước khi thực hiện bất kỳ yêu cầu sản xuất video, âm nhạc hoặc viết code nào trên Google Flow (`flow.google.com`) và Flow Music (`flowmusic.app`), Agent bắt buộc phải đọc (`read_file`) 7 tài liệu gốc sau:
1. `GOOGLE_FLOW_SCENEBUILDER_CORE_DIRECTING_AND_AUTO_MERGE_BIBLE.md` — **Quy chuẩn Cốt lõi về Đạo diễn, Chỉnh sửa trực tiếp, Kéo dài không độ khựng & Auto-Merge trên màn `SceneBuilder` (`/scene/:sceneId`)**.
2. `GOOGLE_FLOW_CINEMATOGRAPHY_AND_DIRECTING_MASTERY_BIBLE.md` — **Quy chuẩn Ngữ pháp Chuyển cảnh Điện ảnh (`Same-Angle Whip-Pan` vs `Angle-Change-Only Cut >= 30°`) & 10 Kỹ thuật Đạo diễn Bậc thầy ánh xạ sang Veo 3.1 / Omni 1.2 Flash**.
3. `GOOGLE_FLOW_MASTER_KNOWLEDGE_BASE.md` — Bách khoa toàn thư Kiến trúc, Model, RPC & Tính năng của Google Flow.
4. `GOOGLE_FLOW_MASTER_EXECUTION_PIPELINE_AND_CASES.md` — Quy trình sản xuất 6 giai đoạn (5 Gates) & 11 Case xử lý tình huống thực chiến.
5. `GOOGLE_FLOW_PRODUCTION_CONTINUITY_SOP.md` — Quy chuẩn 4 trụ cột chống biến dạng, nối dài cảnh, chống khựng & âm thanh liền mạch.
6. `FLOW_MUSIC_MASTER_KNOWLEDGE_BASE.md` — Kho tri thức toàn diện về sáng tác nhạc, Stems, DSP trên `flowmusic.app`.
7. `AI_CINEMA_4_PILLARS_INDUSTRY_KNOWLEDGE_BASE.md` — **Bách khoa 4 Trụ cột Làm phim AI Chuẩn Studio Điện ảnh (`Atomic Beats 3–5s`, `Frames First Video Second`, `Model Routing 2025–2026`, `4-Layer Sound & DaVinci De-AI-ifying`) & Kiểm định Chất lượng Hậu kỳ 5 Lớp Hollywood (`Walter Murch Rule of Six`)**.

> **CẤM CHỈNH SỬA**: Khi cờ ở đầu các file trên đang là `AI_EDIT_MODE: OFF`, Agent **TUYỆT ĐỐI KHÔNG ĐƯỢC SỬA, XÓA HAY GHI ĐÈ** vào các file đó. Chỉ khi người dùng ra lệnh rõ ràng cho phép bật `AI_EDIT_MODE: ON` cho một file cụ thể thì mới được phép cập nhật, và sau khi cập nhật xong phải lập tức khóa lại về `AI_EDIT_MODE: OFF`.

---

## 2. 🎞️ QUY TRÌNH CỐT LÕI `SCENEBUILDER-FIRST` (CHỐNG ĐỘ KHỰNG 100% — CẤM GHÉP RỜI CƠ HỌC)

Khi làm phim hoặc tạo chuỗi cảnh chiến đấu/hành động trên Google Flow, Agent **BẮT BUỘC** kích hoạt skill `flow-scenebuilder-director` (`.agents/skills/flow-scenebuilder-director/SKILL.md`) và tuân thủ nguyên lý cốt lõi của màn **`SceneBuilder` (`/project/:projectId/scene/:sceneId`)**:

1. **Tại sao KHÔNG tạo hàng loạt Shot rời ngoài màn chính rồi mới ghép vào Scene?**:
   - Tạo nhiều video 8 giây độc lập ngoài màn `Project Grid` rồi đem ghép nối đuôi vào Scene sẽ gây **độ khựng (`v = 0` tại điểm đầu và cuối mỗi shot)** vì mỗi video rời khởi xuất từ ảnh tĩnh và giảm tốc về ảnh tĩnh.
   - Các video tạo ở màn ngoài (`/project/:projectId`) thực chất chỉ là **"Video mẫu mồi" (`Seed Clip`)** để lấy đưa vào `SceneBuilder` (vì màn `SceneBuilder` chỉ có 2 giới hạn là không tạo được ảnh tĩnh và không thể tự tạo mới shot đầu tiên khi chưa có video mẫu).
2. **Sửa Trực Tiếp Các Shot Ngay Trong Màn `SceneBuilder` (`Tkc` / `U3`)**:
   - Sau khi đưa `Seed Clip` vào `SceneBuilder` (`oWTRd`), nếu có bất kỳ chi tiết nào chưa đúng hoặc chưa ưng ý, bạn **hoàn toàn sửa trực tiếp ngay trong màn `SceneBuilder`**: Chỉ cần click chọn shot đó trên Timeline và gõ vào ô Prompt bên dưới như lúc tạo shot bình thường (`generate_video_into_workflow` với `destination: { workflowId }`).
3. **Chu Trình `Kéo Dài (Extend)` ➔ `Kiểm Tra Logic Đầu Ngọn` ➔ `Tạo Lại/Sửa Tại Chỗ` ➔ `Auto-Merge`**:
   - **Bước A (`Extend` không độ khựng — hàm `Pkc` / `fZytfe`)**: Thay vì tách nhiều shot rời, hãy chọn cảnh trong `SceneBuilder`, bật **`Kéo dài` (`VIDEO_EXTEND`)** và nêu rõ yêu cầu bạn muốn nhân vật/cảnh đó làm gì tiếp theo trong Prompt. Hệ thống sẽ lấy 24 frames cuối (hoặc 10s cuối với Omni Extend) để tự động thực hiện tiếp với **0 độ khựng**.
   - **Bước B (`Verify & Redo/Edit Before Next Extend` — hàm `Kkc` / `Tkc` khi `sZ = true`)**: Ngay khi kéo dài xong (Lần $N$), **BẮT BUỘC kiểm tra ngay logic và nội dung** xem đã chuẩn và khớp chưa:
     - Nếu **chưa chuẩn hoặc thiếu chi tiết**: Bấm vào cảnh đó ngay trong `SceneBuilder` để **Tạo lại đoạn kéo dài (`Redo Extend` / `Kkc`)** hoặc **Sửa bằng Prompt bổ sung (`Tkc`)** ngay lập tức! Hệ thống sẽ sửa đúng đoạn dài vừa thêm cho đến khi chuẩn 100%.
     - Chỉ khi **đã chuẩn 100%**: Mới được bấm **`Kéo dài` tiếp (Lần $N+1$)**!
   - **Bước C (`Auto-Merge` vào Shot gốc khi Kéo dài tiếp)**: Ngay khi bạn bấm `Kéo dài` lần $N+1$, Google Flow sẽ **tự động Merge (`Auto-Merge`) đoạn kéo dài cũ ($N$) vào Shot gốc (`primaryMediaId`)** và cập nhật con trỏ gốc `ky`. Lúc này đoạn kéo dài cũ ($N$) không thể sửa lẻ được nữa — chỉ sửa được đoạn kéo dài mới nhất ($N+1$).
   - **Bước D (Tránh bẫy `Cắt đoạn / Split` — hàm `ukc`)**: Tuyệt đối không để Auto-Merge rồi mới dùng `Cắt đoạn (Split)` cắt khúc giữa ra để sửa, vì khi sửa khúc giữa sau khi cắt, mô hình không khóa cứng đầu–cuối với 2 cảnh trước/sau mà nó vừa cắt, dẫn đến **bị lệch cảnh (`Jump-Cut`)** tại vết cắt!

---

## 3. 🎥 QUY TẮC CHUYỂN CẢNH ĐIỆN ẢNH: `SAME-ANGLE WHIP-PAN` vs `ANGLE-CHANGE-ONLY CUT` (CHỐNG LỖI NHẢY KHUNG LÚC TO LÚC NHỎ)

1. **CẤM Cắt Cứng (`Hard Cut`) Giữa 2 Cảnh Cùng Góc Máy (`Same Camera Angle, Different Position`)**:
   - Nếu cùng 1 góc quay và cùng 1 cỡ cảnh (ví dụ đều là `24mm–35mm Eye-Level Wide`) mà chỉ đổi vị trí trong không gian (như từ Cổng Tây sang Cổng Đông hoặc ra Giữa Đấu Trường), việc dùng 2 shot rời cắt nối vào nhau sẽ gây lỗi **nhảy tỉ lệ trục (`Axial Scale-Pop` — nhân vật/kiến trúc lúc to lúc nhỏ)** và khựng thị giác.
   - **Giải pháp bắt buộc**: Dùng **`Kéo dài (Extend — Pkc)` kèm câu lệnh Lia máy (`Pan Left/Right`) / Lia máy tốc độ cao (`High-Velocity Horizontal Whip-Pan` + `Directional Motion Blur` + `Whoosh SFX`)**, hoặc dùng tính năng **`Nhảy đến (Jump To)`** để lia máy mượt mà sang vị trí mới mà không cắt cảnh.
2. **CHỈ Chuyển Cảnh (`Hard Cut`) Khi Đổi Góc Máy ($\ge 30^\circ$) VÀ Đổi Cỡ Cảnh / Tiêu Cự ($\ge 1.5\times\text{–}2.0\times$) (`Angle-Change-Only Cut`)**:
   - Mọi vết cắt chuyển cảnh giữa các Monolithic Cluster bắt buộc phải đi kèm sự thay đổi rõ rệt về **Góc máy ($\ge 30^\circ$)** và **Tiêu cự ống kính ($\ge 1.5\times\text{–}2.0\times$)**, ví dụ:
     - `24mm Wide Master (1.0x)` $\xrightarrow{\text{Cut}}$ `85mm Tight Telephoto Close-Up (2.0x)`
     - `85mm Close-Up` $\xrightarrow{\text{Whip-Pan / Cut}}$ `45° Side-Wall Low-Angle`
     - `45° Low-Angle (Đỉnh cú quật xuống)` $\xrightarrow{\text{Kurosawa Match-on-Action Cut}}$ `24mm Wide Center Arena (Đúng mili-giây chạm đất nổ bụi)`
     - `24mm Wide` $\xrightarrow{\text{Cut}}$ `85mm Extreme Worm's-Eye Hero Close-Up + Spielberg Slow Dolly Push-In`.
3. **Ứng dụng 10 Kỹ Thuật Đạo Diễn Điện Ảnh vào Veo Prompt & Tính Năng Google Flow**:
   - Luôn tham chiếu bảng ánh xạ trong `GOOGLE_FLOW_CINEMATOGRAPHY_AND_DIRECTING_MASTERY_BIBLE.md` (Spielberg Oner & Dolly Push-In, George Miller Crosshair Framing, Kurosawa Weather-as-Emotion & Match-on-Action Cut, Lubezki Wide-Lens Close-Up, Villeneuve Megalithic Scale, Edgar Wright Whip-Pan + Whoosh Bridge, Bong Joon-ho Vertical Power Blocking, Nolan Sub-Bass Weight, Snyder Impact Speed-Ramp, Cameron/Jackson 24Hz Seismic Micro-Tremor).

---

## 4. ⚛️ QUY TẮC VẬT LÝ CHỐNG XUYÊN KHUNG (`ZERO-CLIPPING RIGID-BODY PHYSICS` — CẤM XUYÊN NHAU / LÚN ĐẤT / XUYÊN TƯỜNG)

Khi tạo hoặc kéo dài bất kỳ cảnh hành động, va chạm, vật lộn hoặc di chuyển nào trên Google Flow, Agent **BẮT BUỘC** tuân thủ 4 Định luật Vật lý Khối rắn (`Rigid-Body Physics`) sau để ngăn chặn tuyệt đối hiện tượng nhân vật xuyên qua nhau, lún xuống đất hoặc xuyên qua tường/background:

1. **CẤM Dùng `START_END_FRAMES` (`First + Last Frame`) Cho Các Pha Cận Chiến Phức Tạp — BẮT BUỘC Dùng `START_FRAME` (`veo_3_1_i2v_s_fast_ultra`) + `EXTEND_VIDEO`**:
   - Khi ép Veo nội suy giữa 2 ảnh tĩnh (`hX` + `xsa`) có tư thế chồng lấp, chênh lệch độ cao mặt đất, hoặc đảo chiều $180^\circ$, mô hình sẽ **biến hình ("morph") các khối 3D xuyên thẳng qua nhau**, mọc đầu từ dưới ngực đối phương, hoặc xoay xác $180^\circ$ cắt ngang qua chân trụ.
   - **Giải pháp bắt buộc**: Khởi xuất `Seed Clip` của cảnh cận chiến bằng **`Wu: "START_FRAME"` (`Vf: "veo_3_1_i2v_s_fast_ultra"`)** từ **1 ảnh đầu tách biệt rõ ràng**, sau đó dùng **`Kéo dài (Extend — Wu: "EXTEND_VIDEO")`** để mô hình tự diễn hoạt va chạm theo động lực học tự nhiên.
2. **Định Luật Phản Lực Đàn Hồi (`Elastic Recoil Law` — Chống Xuyên Đầu/Thân Khi Lao Vào Nhau)**:
   - Hai thực thể khổng lồ lao vào nhau **KHÔNG BAO GIỜ** được đi xuyên qua không gian 3D của nhau. Trong Prompt bắt buộc phải mô tả rõ: **`collide shoulder-to-shoulder with solid rigid-body mass and immediately recoil/push back 1.5 meters apart upon impact — ZERO mesh interpenetration, bodies NEVER pass through each other`**.
3. **Định Luật Khóa Mặt Phẳng Sàn & Khoảng Cách Tường `30m` (`Hard Ground-Plane Contact & 30m Arena Wall Clearance` — Chống Lún Đất & Xuyên Tường)**:
   - **Chống lún sàn (`Zero Ground Sinking`)**: Bàn chân nhân vật phải luôn khóa cứng trên mặt phẳng sàn (`Both feet remain firmly planted on top of the solid sand floor at all times — ZERO feet or legs sinking into the ground`).
   - **Chống xuyên tường/cột đuốc (`30m Wall Clearance`)**: Với các sinh vật có đuôi dài hoặc vũ khí lớn, mọi pha quần thảo/vật lộn bắt buộc phải đặt tại **Tâm Đấu Trường Rộng Mở cách tường ít nhất `30m` (`in the wide-open center of the arena at least 30 meters away from the stone walls — tails, sails, and bodies NEVER touch or clip into background walls or torches`)**.
4. **Định Luật Tư Thế Chiến Thắng Đứng Cạnh Xác (`Beside-Body Victory Stance` — Chống Đứng Xuyên Lồng Ngực)**:
   - Khi một nhân vật quật ngã đối thủ và đứng gầm chiến thắng, **TUYỆT ĐỐI KHÔNG** đặt nhân vật chiến thắng đứng đè hai chân lên giữa thân xác đối thủ (vì AI sẽ vẽ chân cắm xuyên qua lồng ngực/buồm lưng xác nằm dưới).
   - **Giải pháp bắt buộc**: Quật đối thủ ngã sang một bên (giữ nguyên hướng đầu gốc, không xoay $180^\circ$) và đặt nhân vật chiến thắng **đứng trên nền đất trống ngay bên cạnh xác (`standing firmly on the open sand floor BESIDE the fallen opponent — legs NEVER straddle or clip through the fallen body`)**.

---

## 5. 🚫 QUY TẮC CẤM TUYỆT ĐỐI DÙNG `FFMPEG` DỰNG HẬU KỲ — BẮT BUỘC XUẤT VIDEO NGUYÊN BẢN 100% TỪ GOOGLE FLOW (`100% NATIVE SCENEBUILDER & NATIVE AUDIO/MUSIC`)

> [!CAUTION]
> **NGHIÊM CẤM TỰ NGHĨ QUY TRÌNH DỰNG HẬU KỲ BẰNG `FFMPEG` NGOÀI LUỒNG**:
> Dù cuộc trò chuyện dài hay qua phiên mới, AI Agent **BẮT BUỘC** đọc và kích hoạt skill `flow-scenebuilder-director` (`.agents/skills/flow-scenebuilder-director/SKILL.md`) và **TUYỆT ĐỐI KHÔNG ĐƯỢC**:
> 1. **CẤM dùng `ffmpeg` để cắt ghép cơ học (`concat`, `-ss`, `-t`, `setpts`, `atempo`)** các đoạn video rời ở ngoài.
> 2. **CẤM dùng `ffmpeg` để phóng to/cắt khung hình (`scale`, `crop`)** giả làm góc cận cảnh, hoặc dùng bộ lọc làm mờ (`avgblur`) giả làm hiệu ứng lia máy Whip-Pan.
> 3. **CẤM dùng `ffmpeg` đè chữ HUD giải đấu (`.ass`), đốt phụ đề cứng (`.srt`), hay chèn giọng đọc `edge-tts` / ghép nhạc ngoài luồng**.
>
> **QUY TRÌNH BẮT BUỘC 100% TRÊN MÀN `SCENEBUILDER` CỦA GOOGLE FLOW**:
> 1. **Liên hoàn trên Timeline `SceneBuilder` (`Seed Clip` $\rightarrow$ `Kéo dài (Extend)` / `Nhảy đến (Jump To)`)**:
>    - Khởi tạo từ `Seed Clip` mồi trong `SceneBuilder`, sau đó thực hiện liên hoàn **`Kéo dài (Extend — Pkc / VIDEO_EXTEND)`** và **`Nhảy đến (Jump To — veo_3_1_jump_to_fast_landscape_fl)`** ngay trên Timeline của `SceneBuilder`.
>    - Mọi chuyển động máy quay (Lia máy `Whip-Pan`, Đổi góc cận cảnh `85mm ECU` / `50mm MCU`, Cú quật `Seismic Slam`, K.O. bất động 100%) đều phải do chính mô hình AI của Google Flow thực hiện thông qua `Extend` / `Jump To`.
> 2. **Âm thanh, Hiệu ứng (`SFX`) & Nhạc nền (`Cinematic Score`) Nguyên Bản Từ Google Flow**:
>    - Mô tả trực tiếp cả **Hiệu ứng âm thanh (`SFX`)** lẫn **Nhạc nền giao hưởng điện ảnh (`Cinematic Orchestral Score`)** ngay trong câu lệnh Prompt của từng bước `Seed` / `Extend` / `Jump To` trên `SceneBuilder` để mô hình Veo 3.1 / Omni 1.2 Flash tự sinh âm thanh và nhạc nền đồng bộ 100% với chuyển động hình ảnh.
> 3. **Xuất thẳng file Video Nguyên Bản (`100% Native Export`) từ chính Google Flow**:
>    - Tải trực tiếp file `.mp4` nguyên bản đã được chính Google Flow tự động nối liền (`Auto-Merge` / `Native Scene Export`) từ `SceneBuilder` — giữ nguyên 100% luồng video và âm thanh gốc của Google Flow (`0% ffmpeg` can thiệp vào video/audio).

---

## 6. 📺 QUY TẮC BẮT BUỘC NHÚNG VIDEO TRỰC TIẾP VÀO BÁO CÁO NGHIỆM THU (`EMBEDDED PLAYABLE VIDEO IN ARTIFACT REPORT`)

Khi hoàn thành bất kỳ quy trình sản xuất hoặc chỉnh sửa video nào:
1. Agent **BẮT BUỘC** copy file video nguyên bản xuất trực tiếp từ Google Flow vào thư mục Artifact của phiên làm việc hiện tại (`<appDataDir>/brain/<conversation-id>/`).
2. Nhúng trực tiếp trình phát video bằng cú pháp `![Tên Video](/absolute/path/in/artifact_dir/video.mp4)` ngay ở **Mục 1 đầu báo cáo nghiệm thu (`.md` Artifact)** để người dùng bấm xem trực tiếp cả video lẫn báo cáo trên cùng một màn hình mà không phải mở thư mục ngoài tìm file.

---

## 7. 🏆 QUY CHUẨN 4 TRỤ CỘT ĐIỆN ẢNH AI & KIỂM ĐỊNH CHẤT LƯỢNG 5 LỚP HOLLYWOOD (`AI_CINEMA_4_PILLARS_INDUSTRY_KNOWLEDGE_BASE.md`)

Mọi dự án sản xuất phim ngắn, TVC, hoạt hình hoặc trailer bắt buộc kích hoạt đồng thời skill `ai-cinema-4-pillars-director` (`.agents/skills/ai-cinema-4-pillars-director/SKILL.md`) và tuân thủ:

1. **Tư duy Đạo diễn Nhịp Vi Mô (`Atomic Beats 3–5s`) & Khẩu hình**:
   - Mỗi nhịp quay (`Seed Clip` hoặc `Extend`) chỉ thực hiện **1 hành động chính duy nhất + 1 chuyển động thiết bị máy quay vật lý** để chống hiện tượng tan chảy vật lý (`Motion Soup`).
   - Gọi tên chính xác cỡ cảnh (`EWS`, `MCU`, `ECU`, `Insert Shot`), tiêu cự (`24mm` chiều sâu kịch tính vs `85mm` xóa phông cô lập cảm xúc), ánh sáng (`Chiaroscuro`, `Rim Light`, `Volumetric Fog`), định mức **`10–14 âm tiết / 5s`** cho thoại khớp môi và cầu âm thanh `J-Cut / L-Cut`.
2. **Quy trình 3 Tầng "Khóa Tĩnh trước, Tạo Động sau" (`Frames First, Video Second`) & Thực Thể `🧍 Nhân Vật` (`@Character Entity`)**:
   - **BẮT BUỘC Tạo Thực Thể `🧍 Nhân Vật` Khe Kép (`/project/:projectId/character`) — CẤM Chỉ Dùng Ảnh Tĩnh Rời (`Start Frame`) Thay Cho `@Nhân Vật`**:
     1. Vào tab **`🧍 Nhân vật` (`accessibility_new`)**, đóng gói mỗi nhân vật thành một **Thực thể Nhân vật (`Character Entity`) chính thức** (ví dụ: `t-rex`, `spinosaurus`...) gồm đủ **2 khe ảnh tham chiếu**:
        - **Khe 1 (`Portrait / Close-Up`)**: Ảnh chân dung cận mặt khóa cấu trúc sọ, gờ xương mắt, sẹo, răng, màu da.
        - **Khe 2 (`Turnaround Sheet`)**: Bảng xoay đa góc toàn thân trên nền trắng/xám phẳng khóa tỷ lệ hình học 3D.
     2. **Cách gọi Nhân vật khi tạo Video (`Gõ @ ➔ Chọn Nhân vật ➔ Thêm vào câu lệnh`)**:
        - Trong ô nhập Prompt, gõ **`@`** tại đúng vị trí chủ ngữ nhân vật xuất hiện $\rightarrow$ mở popup **`Tìm kiếm thành phần`** $\rightarrow$ chọn tab **`🧍 Nhân vật`** $\rightarrow$ click chọn nhân vật $\rightarrow$ bấm **`Thêm vào câu lệnh`**.
        - Phải đảm bảo trên hộp Prompt xuất hiện đồng thời: **(a) Thẻ chip inline `[tên-nhân-vật]` (`flow-character-ingredient-chip`) nằm ngay giữa câu văn** và **(b) Ô thumbnail nhân vật có icon hình người `🧍` ở hàng nguyên liệu phía trên**.
        - Nhờ Google Flow truyền trực tiếp cả 2 khe ảnh của `@Nhân vật` xuống bộ sinh video, câu lệnh Prompt chỉ cần viết ngắn gọn, tập trung vào **diễn biến hành động & góc máy** (không nhồi nhét hàng trăm từ tả lại ngoại hình gây quá tải Prompt và mất Voiceover).
     3. **Đồng nhất cả Bối cảnh qua các Shot**: Cùng với thẻ `@Nhân vật`, bấm `+` (`@`) đính kèm thêm **Ảnh gốc của Bối cảnh (`🖼️ Hình ảnh`)** hoặc nối tiếp trực tiếp bằng **`Kéo dài (Extend)`** trong `SceneBuilder` để bối cảnh không bị vẽ lại ngẫu nhiên.
   - Kỹ thuật `Anti-Glitch`: Chỉ định rõ `"mouth firmly closed, zero lip movement"` ở mọi cảnh chỉ chạy Voiceover; neo thiết bị quay vật lý (`locked-off fluid-head tripod`, `heavy gimbal tracking`, `slow Technocrane rise`).
3. **Định tuyến Mô hình (`Model Routing`) & Hòa âm 4 Lớp / Hậu kỳ `De-AI-ifying`**:
   - Mặc định tuân thủ `100% Native Google Flow SceneBuilder` (Mục 5); khi người dùng yêu cầu quy trình thương mại đa mô hình thì định tuyến chuẩn theo bảng `AI_CINEMA_4_PILLARS_INDUSTRY_KNOWLEDGE_BASE.md` (kết hợp `DaVinci Resolve 6-Node De-AI-ifying`: `Color Match`, `Midtone Detail -10..-18`, `Halation`, `35mm Film Grain`) và đảm bảo **Kiến trúc Âm thanh 4 Lớp** (`Dialogue/VO` + `Foley` + `Continuous Room Tone` + `Cinematic Score`) cùng quản trị thư mục `Scene_ID`.
4. **Kiểm định Chất lượng Hậu kỳ 5 Lớp Hollywood (`5-Layer Finishing QC` & Walter Murch *Rule of Six*)**:
   - Trước khi bàn giao bất kỳ video nào, bắt buộc chạy kiểm định đủ 5 lớp: (1) `Lightbox Contact-Sheet Strip Test` kiểm tra đồng nhất bối cảnh/nhân vật toàn tuyến, (2) `1-Second Handover Check` chống khựng điểm nối, (3) `Biological & Physics Artifact Sweep`, (4) `ITU-R BS.1770 Acoustic Continuity` chống hụt tiếng, và (5) `SMPTE Technical Mastering Probe`.



