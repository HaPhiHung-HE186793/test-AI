---
name: flow-scenebuilder-director
description: >-
  Use this skill whenever producing, directing, extending, or editing any video or film scene on Google Flow (flow.google.com). Enforces the SceneBuilder-First Zero-Hitch Continuous Filmmaking architecture (/project/:projectId/scene/:sceneId): using the outer project grid only for @Character, @Environment, and initial Seed Clips, then executing all direct shot editing (Tkc), continuous zero-hitch extensions (Pkc / VIDEO_EXTEND), mandatory head verification and redo/edit before auto-merge (Kkc / sZ=true), avoiding the middle-split jump-cut trap (ukc), and enforcing the Angle-Change-Only Cut vs Same-Angle Whip-Pan/Pan grammar plus 10 Master Directors' Cinematography techniques.
---

# 🎬 Google Flow `SceneBuilder` Core Director (`flow-scenebuilder-director`)

Skill này trang bị cho Agent quy trình **Đạo Diễn & Dựng Phim Cốt Lõi Không Độ Khựng (`SceneBuilder-First Zero-Hitch Continuous Filmmaking`)** và **Ngữ Pháp Chuyển Cảnh Điện Ảnh Đại Danh Sư (`Angle-Change-Only Cut & Master Directors Canon`)** trên Google Flow (`https://flow.google.com/project/:projectId/scene/:sceneId`), dựa trên toàn bộ kho tri thức gốc của dự án:
1. [GOOGLE_FLOW_SCENEBUILDER_CORE_DIRECTING_AND_AUTO_MERGE_BIBLE.md](../../../GOOGLE_FLOW_SCENEBUILDER_CORE_DIRECTING_AND_AUTO_MERGE_BIBLE.md) *(Kiến trúc `SceneBuilder` `m38dl`: Seed Clip ➔ In-Scene Edit `Tkc` ➔ Extend `Pkc` ➔ Verify/Redo Head `Kkc` ➔ Auto-Merge)*
2. [GOOGLE_FLOW_CINEMATOGRAPHY_AND_DIRECTING_MASTERY_BIBLE.md](../../../GOOGLE_FLOW_CINEMATOGRAPHY_AND_DIRECTING_MASTERY_BIBLE.md) *(Quy chuẩn Chuyển cảnh Đổi Góc Máy vs Lia Máy/Whip-Pan Cùng Góc & 10 Tuyệt kỹ Đạo diễn Đại Danh Sư ứng dụng vào Veo 3.1 / Flow)*
3. [GOOGLE_FLOW_MASTER_KNOWLEDGE_BASE.md](../../../GOOGLE_FLOW_MASTER_KNOWLEDGE_BASE.md)
4. [GOOGLE_FLOW_MASTER_EXECUTION_PIPELINE_AND_CASES.md](../../../GOOGLE_FLOW_MASTER_EXECUTION_PIPELINE_AND_CASES.md)
5. [GOOGLE_FLOW_PRODUCTION_CONTINUITY_SOP.md](../../../GOOGLE_FLOW_PRODUCTION_CONTINUITY_SOP.md)
6. [FLOW_MUSIC_MASTER_KNOWLEDGE_BASE.md](../../../FLOW_MUSIC_MASTER_KNOWLEDGE_BASE.md)
7. [AI_CINEMA_4_PILLARS_INDUSTRY_KNOWLEDGE_BASE.md](../../../AI_CINEMA_4_PILLARS_INDUSTRY_KNOWLEDGE_BASE.md) *(4 Trụ cột Làm phim AI Chuẩn Studio: `Atomic Beats 3–5s`, `Frames First Video Second` với `11-Frame Turnaround + 5-Layer Negative Stack`, `Anti-Glitch & Mouth-Closed Lock`, `Physical Camera Rig Syntax`, `4-Layer Sound Architecture`, và `5-Layer Hollywood Post-Production QC / Walter Murch Rule of Six`)*

> [!CAUTION]
> **QUY TẮC KHÓA BẢO VỆ TÀI LIỆU (`AI_EDIT_MODE: OFF`)**:
> Các file `.md` kho tri thức gốc trên đều đang ở trạng thái **`AI_EDIT_MODE: OFF` (CHỈ ĐỌC — CẤM CHỈNH SỬA)**. Agent chỉ được phép đọc (`read_file`) để áp dụng quy trình, tuyệt đối không được sửa hoặc ghi đè trừ khi người dùng ra lệnh mở khóa `AI_EDIT_MODE: ON` cho từng file cụ thể (và phải khóa lại về `OFF` ngay sau khi sửa xong).

---

## 🛡️ 6 Nguyên Tắc Vàng Bắt Buộc Của `SceneBuilder-First` (Không Bao Giờ Được Vi Phạm)

1. **CẤM Tạo Hàng Loạt Shot Rời Ngoài Màn Chính Rồi Chỉ Dùng `SceneBuilder` Để Ghép Nối Cơ Học**:
   - Tạo 10–16 clip 8 giây độc lập ngoài màn `Project Grid` (`START_END_FRAMES` / `START_FRAME`) rồi xếp nối đuôi vào Scene sẽ gây **độ khựng (`v = 0` tại điểm đầu và cuối mỗi shot)** vì mỗi clip khởi động từ ảnh tĩnh và phanh về ảnh tĩnh.
   - Màn ngoài (`/project/:projectId`) **chỉ dùng để tạo**:
     1. **Thực thể `🧍 Nhân vật` (`@Character Entity`) chính thức trong tab `Nhân vật` (`/project/:projectId/character`)** gồm đủ **2 khe ảnh tham chiếu (`Khe 1: Chân dung cận mặt` + `Khe 2: Bảng xoay đa góc Turnaround`)** và **Ảnh bối cảnh gốc (`@Environment`)**. **TUYỆT ĐỐI CẤM** chỉ tạo ảnh tĩnh thường (`🖼️ Hình ảnh`) rồi bỏ qua bước tạo thực thể trong tab `🧍 Nhân vật`!
     2. **Video Mẫu Mồi (`Seed Clip` ban đầu) bằng cách gõ `@` chèn trực tiếp thẻ Chip `[tên-nhân-vật]` vào giữa câu lệnh Prompt**:
        - Trong ô nhập Prompt, gõ câu mô tả bối cảnh/hành động và tại vị trí nhân vật xuất hiện thì **gõ `@`** $\rightarrow$ chọn tab **`🧍 Nhân vật`** $\rightarrow$ chọn thực thể nhân vật (ví dụ: `t-rex`) $\rightarrow$ bấm **`Thêm vào câu lệnh`**.
        - Bắt buộc kiểm tra trên hộp Prompt có đủ **2 dấu hiệu**: **(a) Thẻ chip `[tên-nhân-vật]` (`flow-character-ingredient-chip`) nằm inline ngay trong dòng chữ** và **(b) Thumbnail nhân vật có icon hình người `🧍` (`accessibility_new`) ở phía trên**. Không viết đoạn văn dài 100 từ tả lại ngoại hình thay cho thẻ `@Nhân vật`!
        - Nếu tạo Shot mới trong cùng bối cảnh, bấm `+` (`@`) đính kèm thêm **Ảnh bối cảnh gốc (`🖼️ Hình ảnh`)** cùng với thẻ **`@Nhân vật`** để khóa đồng nhất 100% cả nhân vật lẫn bối cảnh.

2. **Màn `SceneBuilder` (`/project/:projectId/scene/:sceneId`) Là Trung Tâm Làm Phim & Chỉnh Sửa Trực Tiếp (`Tkc` / `U3`)**:
   - Ngay khi đã đưa `Seed Clip` vào `SceneBuilder` (`oWTRd`), mọi thao tác tinh chỉnh, sửa lại hoặc tạo lại shot **đều thực hiện trực tiếp ngay trong màn `SceneBuilder`**.
   - Chỉ cần click chọn shot đó trên Timeline (`this.Ja()` = `workflowId`, `this.Tk()` = `primaryMediaId`) và gõ yêu cầu vào thanh Prompt của `SceneBuilder` (như lúc tạo shot bình thường). Hàm `Tkc` sẽ gọi `generate_video_into_workflow` (`destination: { workflowId }`) để sửa trực tiếp shot đó ngay trong Scene và lưu mọi phiên bản vào cột History (`scene.Qf.get(workflowId)`).

3. **Dùng `Kéo Dài (Extend)` Trực Tiếp Trong `SceneBuilder` Để Triệt Tiêu 100% Độ Khựng (`Pkc` / `Cfc` / `fZytfe`)**:
   - Muốn cảnh diễn biến tiếp như thế nào, chọn ngay Shot đó trên Timeline của `SceneBuilder`, bật chế độ **`Kéo dài` (`VIDEO_EXTEND`)** và nêu rõ yêu cầu hành động tiếp theo trong ô Prompt.
   - Hệ thống sẽ lấy **24 frames cuối** (`Veo 3.1 Extend`) hoặc **tối đa 240 frames / 10s cuối** (`Omni 1.2 Flash Extend`) của cảnh đang chạy để nối tiếp với cùng vector vận tốc tức thời ($\vec{v}_{\text{cuối}} = \vec{v}_{\text{đầu}}$) $\implies$ **tự động thực hiện tiếp mà hoàn toàn 0 độ khựng**.

4. **Chốt Kiểm Duyệt Đầu Ngọn (`sZ = true`) & Tạo Lại/Sửa Ngay Trước Khi `Auto-Merge` (`Kkc` / `Tkc`)**:
   - **QUY TẮC SỐNG CÒN**: Ngay sau mỗi lần bấm `Kéo dài` (Lần $N$), đoạn vừa kéo dài vẫn đang ở trạng thái **đầu ngọn (`sZ = true`)** và giữ con trỏ `ky` trỏ về video gốc trước khi kéo dài (`e = b.uc.find(_.Uv).mediaId`).
   - Phải **kiểm tra ngay lập tức** xem đoạn vừa kéo dài đã đúng logic, khớp nội dung và đủ chi tiết chưa:
     - **Nếu CHƯA chuẩn hoặc thiếu chi tiết**: Bấm vào cảnh đó ngay trong `SceneBuilder`, bấm **Tạo lại đoạn kéo dài (`BV` $\rightarrow$ `Kkc` / `SceneBuilder.redoExtend`)** hoặc **Sửa bằng Prompt bổ sung (`Tkc`)** ngay tại thời điểm đó! Hệ thống sẽ sửa đúng đoạn dài vừa thêm cho đến khi chuẩn 100%.
     - **Chỉ khi ĐÃ chuẩn 100%**: Mới được phép bấm **`Kéo dài` bước tiếp theo (Lần $N+1$)**!
   - Vì ngay khi bấm `Kéo dài` lần $N+1$, hệ thống sẽ **tự động Merge (`Auto-Merge`) đoạn kéo dài cũ ($N$) vào Shot gốc (`primaryMediaId`)**, cập nhật con trỏ `ky` mới, khiến đoạn kéo dài cũ ($N$) bị khóa cứng vào Shot gốc và **không thể sửa lẻ được nữa** (chỉ sửa được đoạn kéo dài mới nhất $N+1$).

5. **Tránh Bẫy Cắt Đoạn (`Split` / `ukc`) Để Sửa Đoạn Cũ Đã Merge**:
   - Nếu đã để hệ thống Auto-Merge đoạn kéo dài cũ vào Shot gốc rồi mới dùng công cụ **Cắt đoạn (`Split` / `ukc`)** cắt khúc giữa ra để sửa bằng Prompt (`Tkc`), mô hình AI khi vẽ lại khúc giữa sẽ **không biết và không khóa cứng đồng thời cả đầu lẫn cuối với 2 cảnh trước/sau mà nó vừa cắt**, dẫn đến **bị lệch cảnh (`Jump-Cut`)** so với 2 cảnh trước và sau!

6. **Ngữ Pháp Chuyển Cảnh Bất Di Bất Dịch: Cấm Cắt Cùng Góc Máy (`Zero Scale-Pop`) — Khi Nào Lia Máy / `Whip-Pan` vs Khi Nào Đổi Cảnh Đổi Góc Máy (`Angle-Change-Only Cut`)**:
   - **Tại sao CẤM dùng 2 Shot rời ở cùng 1 góc quay?**: Nếu 2 Shot liên tiếp có cùng góc máy và cỡ cảnh (ví dụ cùng là `Wide 35mm` nhìn vào võ đài), việc cắt giữa 2 Shot sẽ gây **sai khung lúc to lúc nhỏ (`Scale-Pop`)** và **bị khựng (`Axial Jump-Cut`)**.
   - **Nếu cùng 1 góc máy / cùng góc quay mà chỉ đổi vị trí hoặc chuyển sang đối tượng khác trong không gian**:
     - **KHÔNG cắt cảnh thô (`No Hard Cut`)!**
     - Bắt buộc dùng **Lia máy (`Camera Pan / Tracking`)** ngay trong lệnh `Extend` (`Pkc`), hoặc dùng **Hiệu ứng lia máy nhanh (`Whip-Pan / Swish-Pan` kèm `Directional Horizontal Motion Blur + Whoosh SFX`)**, hoặc tính năng **`Nhảy đến (Jump To - veo_3_1_jump_to_fast_landscape_fl)`**.
   - **Chỉ chuyển cảnh (`Cut` sang Shot mới) khi ĐỔI HẲN GÓC MÁY ($\ge 30^\circ$) VÀ ĐỔI CỠ CẢNH / TIÊU CỰ ($\ge 1.5\times$)**:
     - Ví dụ: Từ **`Toàn cảnh (24mm Wide Master)`** $\rightarrow$ cắt trên đà hành động (`Match-on-Action`) vào **`Cận cảnh tiêu cự dài (85mm Tight Telephoto Close-Up + Dutch Tilt)`** $\rightarrow$ cắt sang **`Góc thấp sát đất xoay 45° (28mm Worm's-Eye Torch-Wall Angle)`** $\rightarrow$ cắt `Match-on-Action` ra **`Toàn cảnh cú quật (24mm Wide Slam)`** $\rightarrow$ cắt vào **`Đặc tả góc thấp hất lên nhà vô địch (85mm Extreme Worm's-Eye Hero Close-Up + Spielberg Dolly Push-In)`**.

7. **Ngữ Pháp Vật Lý Khối Rắn Chống Xuyên Thấu Nhân Vật, Sàn & Tường Hậu Cảnh (`Zero-Clipping Rigid-Body Physics & Spatial Clearance Grammar`)**:
   - **Luật 7.1 — CẤM dùng `START_END_FRAMES` (`hX` + `xsa`) cho các `Seed Clip` giao chiến 2 nhân vật áp sát**:
     - Khi ép mô hình nội suy giữa 2 bức ảnh tĩnh đầu–cuối có tư thế chồng lấn hoặc đảo chiều (ví dụ đầu nhân vật A đè lên cổ nhân vật B, hoặc nhân vật B đang quay mặt sang trái ở `Start Frame` nhưng lại nằm quay mặt sang phải ở `End Frame`), mô hình bắt buộc phải **cho lưới 3D đi xuyên qua nhau (`Mesh Interpenetration`), lún xuyên xuống sàn (`Floor Sinking`) hoặc xoay ngang 180° xuyên qua chân đối phương**.
     - **Giải pháp bắt buộc**: Mọi `Seed Clip` cận chiến tạo mới hoặc sửa trực tiếp trong `SceneBuilder` (`Tkc` / `zq.dr`) phải dùng **`Wu: "START_FRAME"` (`veo_3_1_i2v_s_fast_ultra`)** xuất phát từ **1 khung hình đầu sạch, tách biệt rõ vị trí Trái–Phải**, để bộ mô phỏng vật lý nhân quả tự dẫn xuất va chạm mà không ép biến dạng lưới.
   - **Luật 7.2 — Khóa Tiếp Xúc Biên & Bật Lùi Đàn Hồi (`Surface-Boundary Contact & Elastic Recoil`)**:
     - Trong Prompt của cả `Seed Clip` lẫn `Extend` (`Pkc`), luôn quy định rõ tâm khối lượng của Nhân vật 1 ở bên trái (`left side`) và Nhân vật 2 ở bên phải (`right side`); ngay sau khi va chạm ở đường tâm (`center line`), bắt buộc có lệnh **bật lùi đàn hồi (`immediate physical recoil, skidding backward half a step so both solid impenetrable bodies remain separated, zero mesh interpenetration, heads and bodies never pass through each other`)** và **khóa mặt phẳng sàn (`all feet firmly planted on top of the solid impenetrable floor, zero sinking into the ground`)**.
   - **Luật 7.3 — Khoảng Cách An Toàn 30m Với Tường Hậu Cảnh (`30-Meter Open Arena Center Clearance`)**:
     - Với các nhân vật khổng lồ có đuôi dài hoặc vây lưng lớn, nếu đẩy giao tranh sát vách tường hậu cảnh thì đuôi/vây lưng sẽ đâm xuyên vào tường đá và ngọn lửa đuốc trên tường sẽ đè lên mặt nhân vật (`depth-buffer confusion`). Bắt buộc neo vị trí giao chiến tại **trung tâm thông thoáng (`at the wide-open center of the arena, 30 meters away from the distant blurred background stone walls, zero wall clipping, zero tail or sail touching the wall`)**.
   - **Luật 7.4 — Giữ Nguyên Trục Hướng Đầu Khi Ngã & Tư Thế Đứng Cạnh Chiến Thắng (`Consistent 180° Axis & Beside-Body Victory Stance`)**:
     - Khi nhân vật B bị quật ngã xuống sàn, phải giữ nguyên hướng đầu như lúc đang đứng (ví dụ: đứng ở bên phải quay đầu sang trái $\rightarrow$ ngã xuống bên phải đầu vẫn hướng sang trái), và nhân vật A chiến thắng phải **đứng hai chân trên mặt đất rắn chắc bên cạnh đối thủ (`both hind feet planted firmly on the solid ground beside the fallen opponent, zero legs passing through or clipping into the opponent's body`)**.

8. **CẤM TUYỆT ĐỐI DÙNG `FFMPEG` ĐỂ DỰNG HẬU KỲ — BẮT BUỘC THỰC HIỆN & XUẤT VIDEO NGUYÊN BẢN 100% TRỰC TIẾP TỪ `SCENEBUILDER` (`100% NATIVE FLOW EXPORT + NATIVE MUSIC & SFX`)**:
   - **CẤM tự nghĩ quy trình hậu kỳ bằng `ffmpeg`**:
     - **0% `ffmpeg` crop / scale / zoom** (không được lấy cảnh rộng cắt cúp giả làm cảnh cận).
     - **0% `ffmpeg` blur / pan giả** (`avgblur`, dịch khung `x/y`).
     - **0% `ffmpeg` cắt ghép cơ học ngoài luồng** (`concat`, `-ss`, `-t`, `setpts`, `atempo`).
     - **0% đè chữ HUD giải đấu (`.ass`), phụ đề cứng (`.srt`), hay lồng tiếng `edge-tts` / ghép nhạc ngoài luồng**.
   - **Cách thực hiện chuẩn 100% trên màn `SceneBuilder` (`/project/:projectId/scene/:sceneId`)**:
     1. Khởi tạo từ **1 `Seed Clip` mồi** đưa vào Timeline của `SceneBuilder`.
     2. Thực hiện liên hoàn **`Kéo dài (Extend — Pkc / VIDEO_EXTEND)`** và **`Nhảy đến (Jump To — veo_3_1_jump_to_fast_landscape_fl)`** trực tiếp ngay trên Timeline của `SceneBuilder`.
     3. Ngay trong Prompt của mỗi bước `Seed` / `Extend` / `Jump To`, mô tả đầy đủ cả **Chuyển động máy quay (Cận cảnh `85mm` / Lia máy `Whip-Pan` / Đổi góc máy)**, **Hiệu ứng âm thanh vật lý (`SFX`)**, và **Nhạc nền giao hưởng điện ảnh (`Cinematic Orchestral Score`)** để mô hình của Google Flow tự sinh đồng bộ cả hình ảnh, hiệu ứng lẫn âm nhạc.
     4. Sau khi hoàn tất chuỗi `Extend` / `Jump To` trên Timeline của `SceneBuilder`, **xuất thẳng file video `.mp4` nguyên bản từ chính Google Flow (`Auto-Merged Native MP4` / `SceneBuilder Export`)** và nhúng trực tiếp file nguyên bản đó vào báo cáo nghiệm thu!

9. **Tuân Thủ 4 Trụ Cột Điện Ảnh AI & Kiểm Định Hậu Kỳ 5 Lớp Hollywood (`AI_CINEMA_4_PILLARS_INDUSTRY_KNOWLEDGE_BASE.md` + Skill `ai-cinema-4-pillars-director`)**:
   - **Nhịp vi mô `Atomic Beats` (`1 Hành động chính + 1 Thiết bị quay vật lý`)**: Mỗi lệnh `Seed Clip` hoặc `Extend` chỉ giao đúng 1 hành động vật lý chủ đạo + 1 thiết bị cơ khí máy quay thật (`locked-off heavy fluid-head tripod`, `heavy Ronin gimbal tracking`, `damped hydraulic dolly push-in`, `slow Technocrane rise`) để chống `Motion Soup` và chống trôi camera.
   - **Khóa Thực Thể `🧍 Nhân Vật` Chuẩn 6 Bước & Gắn Chip `@Nhân-Vật` Inline (`Frames First, Video Second & @Character Chip`)**:
     1. **Chuẩn bị Hồ sơ Nhân vật gốc (`Character Bible`) + Chuỗi Neo (`Character Anchor`) + 2 Prompt**: Soạn hồ sơ chi tiết (Chủng loại, Kích thước cố định, Đặc điểm nhận dạng khóa cứng, Tính cách & Khí chất) và chuỗi `Character Anchor` tiếng Anh cố định.
     2. **Tạo Khe 1 `[Chân dung]` với `🍌 Nano Banana Pro`**: Vào tab **`🧍 Nhân vật`** $\rightarrow$ bấm **`+ Nhân vật mới` (`/project/:projectId/character`)** $\rightarrow$ dán **Prompt 1 (`Extreme cinematic close-up avatar portrait 1:1` chứa `Character Anchor`)** vào ô `Mô tả nhân vật của bạn...` $\rightarrow$ **đổi model từ `🍌 Nano Banana 2.1` sang `🍌 Nano Banana Pro`** $\rightarrow$ bấm **`→`**.
     3. **Bấm nút `[🧍 Tạo cơ thể]` (có sẵn thumbnail `[Chân dung]` đính kèm) & Đổi lại sang `🍌 Nano Banana Pro`**: Trên trang `/project/:projectId/character/:characterId`, bấm nút **`[🧍 Tạo cơ thể]`** bên dưới ảnh chân dung $\rightarrow$ dán **Prompt 2 (`3 full-body views side-by-side: [Left: Front View], [Center: 45-degree Three-Quarter View], [Right: 90-degree Side Profile View]` trên nền xám phẳng `#808080`, `16:9`, chứa cùng `Character Anchor` — với loài có cánh thì khóa tư thế đứng 4 chi xếp cánh gọn `grounded quadrupedal stance`)** vào ô `Mô tả cơ thể và trang phục...` $\rightarrow$ **bắt buộc đổi lại dropdown từ `🍌 Nano Banana 2.1` sang `🍌 Nano Banana Pro`** $\rightarrow$ bấm **`→`**.
     4. **Điền ô `Thông tin nhân vật (không bắt buộc): Mô tả tính cách của nhân vật...`**: Dán toàn bộ **Hồ sơ nhân vật gốc** (Chủng loại, Thông số hình thể, Đặc điểm nhận dạng khóa cứng, Tính cách & Khí chất) vào ô văn bản bên trái để Tác nhân Flow sử dụng khi tạo cảnh.
     5. **Đổi tên (`✏️` $\rightarrow$ `✓`) & Bấm `Xong`**: Bấm icon bút chì `✏️` đổi tên từ `Nhân vật chưa có tên` sang tên định danh $\rightarrow$ bấm **`✓`** $\rightarrow$ bấm nút **`Xong`** ở góc phải trên cùng.
     6. **Gọi Nhân vật & Bối cảnh khi tạo Video**: Khi tạo Video, bắt buộc **gõ `@` ngay tại vị trí chủ ngữ $\rightarrow$ chọn tab `🧍 Nhân vật` $\rightarrow$ bấm `Thêm vào câu lệnh`** để chèn thẻ chip `[tên-nhân-vật]` inline vào dòng chữ kèm thumbnail `🧍` trên hộp Prompt (và đính kèm thêm `[Ảnh Bối Cảnh Gốc]` nếu tạo shot mới trong cùng bối cảnh). Thêm `"mouth firmly closed, zero lip movement"` ở các cảnh không thoại; giới hạn `10–14 âm tiết / 5s` nếu có thoại khớp môi.
   - **Thiết kế Âm thanh 4 Lớp & Kiểm định 5 Lớp Hollywood trước bàn giao**: Mô tả đầy đủ 4 lớp âm thanh (`Dialogue/VO`, `Foley`, `Continuous Ambience/Room Tone`, `Cinematic Score`) trong Prompt và chạy đủ **5 Lớp Kiểm Định Chất Lượng Hậu Kỳ** (`Lightbox Contact-Sheet Strip Test`, `1s Handover Check`, `Biological/Physics Artifact Sweep`, `ITU-R BS.1770 Acoustic Continuity`, `SMPTE Mastering Probe` theo **Walter Murch's *Rule of Six***) trước khi bàn giao video cho người dùng.

---

## 🚀 Quy Trình Thực Thi Từng Bước Khi Nhận Yêu Cầu Làm Video Trên Google Flow

1. **Bước 1 — Đọc Đầy Đủ Các Kho Tri Thức Gốc**:
   - Đọc `GOOGLE_FLOW_SCENEBUILDER_CORE_DIRECTING_AND_AUTO_MERGE_BIBLE.md`, `GOOGLE_FLOW_CINEMATOGRAPHY_AND_DIRECTING_MASTERY_BIBLE.md`, `GOOGLE_FLOW_MASTER_EXECUTION_PIPELINE_AND_CASES.md`, `GOOGLE_FLOW_PRODUCTION_CONTINUITY_SOP.md`, `AI_CINEMA_4_PILLARS_INDUSTRY_KNOWLEDGE_BASE.md` và `FLOW_PRODUCTION_BUGS_AND_LESSONS_LEARNED.md`.
2. **Bước 2 — Thiết Kế Kịch Bản Liên Hoàn Trên `SceneBuilder` (`Seed Clip` ➔ Chuỗi `Extend` / `Jump To`)**:
   - Thiết kế rõ từng nhịp nối tiếp nhau trên Timeline của `SceneBuilder`: Mở đầu `Cold Open` cận cảnh (`85mm` Foot Stomp) ➔ `Extend` / `Jump To` ra toàn cảnh giao chiến ➔ `Extend` / `Jump To` vào cận cảnh vung vuốt (`85mm`) ➔ `Extend` / `Jump To` đặc tả mắt hổ phách bừng sáng & khóa hàm (`50mm`) ➔ `Extend` cú quật địa chấn K.O. bất động 100% & gầm chiến thắng, kèm chỉ dẫn **SFX + Nhạc nền giao hưởng (`Cinematic Score`)** xuyên suốt trong từng Prompt.
3. **Bước 3 — Tạo Thực Thể `🧍 Nhân Vật` (2 Khe Ảnh) & Gõ `@` Chèn Chip `[Nhân-Vật]` Để Tạo `Seed Clip` Đưa Vào `SceneBuilder`**:
   - Vào tab **`🧍 Nhân vật` (`/project/:projectId/character`)** tạo thực thể nhân vật chính thức có đủ 2 khe ảnh (`Khe 1: Chân dung cận mặt` + `Khe 2: Turnaround Sheet`) và tạo ảnh gốc cho bối cảnh (`@Environment`).
   - Khi tạo `Seed Clip`, gõ **`@`** tại vị trí chủ ngữ trong câu lệnh $\rightarrow$ chọn tab **`🧍 Nhân vật`** $\rightarrow$ bấm **`Thêm vào câu lệnh`** để gắn thẻ chip `[tên-nhân-vật]` inline vào câu văn (kèm `[Ảnh Bối Cảnh Gốc]` trên hộp Prompt), sau đó đưa `Seed Clip` vào `SceneBuilder` (`/project/:projectId/scene/:sceneId`).
4. **Bước 4 — Chạy Chuỗi `Extend` (`Pkc` / `qoc`) / `Jump To` Liên Hoàn Ngay Trên Timeline Của `SceneBuilder` & Xuất Thẳng File Nguyên Bản (`export-native-scene.mjs`)**:
   - Ở mỗi nhịp `Extend` / `Jump To` trên Timeline `SceneBuilder`, kiểm tra ngay đầu ngọn (`sZ = true`); nếu chưa đạt thì bấm `Redo Extend` (`Kkc` / `loc`) hoặc sửa trực tiếp (`Tkc` / `uoc`) ngay trong `SceneBuilder`.
   - Khi đã đạt chuẩn 100%, tiếp tục `Extend` / `Jump To` nhịp kế tiếp để Google Flow tự động **Auto-Merge** liền mạch.
   - Cuối cùng, gọi trình xuất cảnh nguyên bản của `SceneBuilder` (`window.__flowSB.download()` / `ns.hsb(sb.Bf, { I1 })` tương ứng RPC máy chủ `GjQLTd` + `IxdSwd` qua script [export-native-scene.mjs](./scripts/export-native-scene.mjs)) để **tải thẳng file video `.mp4` nguyên bản từ chính máy chủ Google Flow** (`0% ffmpeg` chỉnh sửa, `0%` crop/zoom/blur, `0%` đè chữ HUD) và nhúng trực tiếp vào báo cáo nghiệm thu!
