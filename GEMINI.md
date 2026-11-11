# 🎬 QUY TẮC BẮT BUỘC TOÀN DỰ ÁN GOOGLE FLOW & FLOW MUSIC (`GEMINI.md` — ALWAYS ACTIVE)

Mọi AI Agent làm việc trong dự án này bắt buộc phải tuân thủ tuyệt đối các quy chuẩn kiến trúc và quy trình dưới đây trong mọi phiên làm việc (Session):

---

## 1. 🔒 QUY TẮC BẢO VỆ 6 KHO TRI THỨC GỐC (`AI_EDIT_MODE: OFF` — CHỈ ĐỌC)

Trước khi thực hiện bất kỳ yêu cầu sản xuất video, âm nhạc hoặc viết code nào trên Google Flow (`flow.google.com`) và Flow Music (`flowmusic.app`), Agent bắt buộc phải đọc (`read_file`) 6 tài liệu gốc sau:
1. `GOOGLE_FLOW_SCENEBUILDER_CORE_DIRECTING_AND_AUTO_MERGE_BIBLE.md` — **Quy chuẩn Cốt lõi về Đạo diễn, Chỉnh sửa trực tiếp, Kéo dài không độ khựng & Auto-Merge trên màn `SceneBuilder` (`/scene/:sceneId`)**.
2. `GOOGLE_FLOW_CINEMATOGRAPHY_AND_DIRECTING_MASTERY_BIBLE.md` — **Quy chuẩn Ngữ pháp Chuyển cảnh Điện ảnh (`Same-Angle Whip-Pan` vs `Angle-Change-Only Cut >= 30°`) & 10 Kỹ thuật Đạo diễn Bậc thầy ánh xạ sang Veo 3.1 / Omni 1.2 Flash**.
3. `GOOGLE_FLOW_MASTER_KNOWLEDGE_BASE.md` — Bách khoa toàn thư Kiến trúc, Model, RPC & Tính năng của Google Flow.
4. `GOOGLE_FLOW_MASTER_EXECUTION_PIPELINE_AND_CASES.md` — Quy trình sản xuất 6 giai đoạn (5 Gates) & 11 Case xử lý tình huống thực chiến.
5. `GOOGLE_FLOW_PRODUCTION_CONTINUITY_SOP.md` — Quy chuẩn 4 trụ cột chống biến dạng, nối dài cảnh, chống khựng & âm thanh liền mạch.
6. `FLOW_MUSIC_MASTER_KNOWLEDGE_BASE.md` — Kho tri thức toàn diện về sáng tác nhạc, Stems, DSP trên `flowmusic.app`.

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
