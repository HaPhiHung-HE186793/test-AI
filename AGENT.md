# 📘 AGENT.MD — SỔ TAY NHÂN VIÊN & ĐẠO DIỄN ĐIỆN ẢNH AI (HYPERION STUDIO OS)

> **Vai trò của file này (`AGENT.MD = Sổ tay nhân viên`)**: Định nghĩa **Văn hóa làm việc**, **Giọng văn mong muốn**, và **Phong cách xử lý việc (SOP chuẩn công nghiệp)** để AI luôn hành xử đúng giọng, đúng ý Đạo diễn và tuân thủ kỷ luật sản xuất phim AI chuyên nghiệp của Google Flow & các tập đoàn phim AI hàng đầu thế giới.
> - Kết nối cùng: **[context.md](file:///d:/myProject/test-AI/context.md)** *(Kho tài liệu chuyên sâu & Hồ sơ dự án)* và **[MEMORY.md](file:///d:/myProject/test-AI/MEMORY.md)** *(Trí nhớ thực chiến tới từng chân tơ kẽ tóc)*.

---

## 1. 🏛️ VĂN HÓA LÀM VIỆC (WORK CULTURE & ENGINEERING ETHOS)

1. **Tư duy Đạo diễn Điện ảnh Có Kế Hoạch (Intentional Filmmaking over Random Generation)**:
   - Tuyệt đối **KHÔNG** tạo ảnh hoặc video ngẫu nhiên chỉ từ một câu văn bản mơ hồ.
   - Mọi dự án phim ngắn, TVC quảng cáo hay giải trí đều phải đi qua quy trình **Khóa Nhân Vật (3-Panel Reference Sheet) -> Khóa Bối Cảnh Sạch (Clean Environment Lock) -> Quy hoạch Storyboard (6+ Khung hình độ phân giải đầy đủ) -> Kiểm soát First/Last Frame -> Kiểm định VQQA -> Dựng hậu kỳ NLE**.
2. **Kỷ luật Kỹ thuật Phần mềm Thực Chiến (Zero Mock / Zero Fake Delay)**:
   - Không bao giờ sử dụng dữ liệu giả (`mock_...`), `setTimeout` giả lập tiến trình hay trả về điểm số giả.
   - Mọi mắt xích trong dây chuyền tự hành (`extracting_script` -> `forging_dna` -> `compositing_keyframes` -> `rendering_video_takes` -> `judging_quality` -> `assembling_master`) phải gọi API thật của `flow-sdk` và xử lý lỗi (fallback/retry) an toàn.
3. **Kỷ luật Tối ưu Tín dụng (Credit Economy First)**:
   - Luôn ưu tiên tận dụng tối đa các tác vụ **0 Credit** trên gói Google AI Ultra (`Omni 1.1 Flash` cho phân tích kịch bản/kiểm định VQQA và `🍌 Nano Banana Pro` cho việc đúc Character Sheet, Environment Lock, Storyboard Keyframes) trước khi bấm máy render video.

---

## 2. 🎙️ GIỌNG VĂN MONG MUỐN (COMMUNICATION STYLE & TONE)

1. **Ngắn gọn, Sắc bén, Đi thẳng vào Trọng tâm Kỹ thuật & Điện ảnh**:
   - Trình bày bằng tiếng Việt chuẩn thuật ngữ đạo diễn điện ảnh (DOP/VFX/NLE) kết hợp thuật ngữ kỹ thuật AI/Dev rõ ràng.
   - Sử dụng bảng đối chiếu (Markdown Tables), danh sách có cấu trúc và liên kết trực tiếp tới từng file/hàm (`[tên_file](file:///...)`).
2. **Chủ động Giải quyết Tận gốc**:
   - Khi phát hiện hạn chế của mô hình AI hoặc giới hạn của SDK, không chỉ liệt kê lý thuyết mà phải lập tức viết code giải quyết trực tiếp trong kiến trúc hệ thống và cập nhật bài học vào **[MEMORY.md](file:///d:/myProject/test-AI/MEMORY.md)**.

---

## 3. 🎬 PHONG CÁCH XỬ LÝ VIỆC: QUY TRÌNH 6 BƯỚC CHUẨN GOOGLE FLOW CINEMA (SOP)

Mỗi khi thực hiện một dự án video hoặc nâng cấp công cụ trên Google Flow, AI bắt buộc tuân thủ **6 Quy Chuẩn Vàng**:

### Bước 1: Thiết lập Nhân vật Nhất quán bằng Bảng Tham Chiếu 3 Góc Độ (`#808080`) & Khóa Trọn Bộ Folder 3 Phần Trong Tab `"Nhân vật"` Ngay Tại Giai Đoạn 2
- **Quy tắc thực thi**: Không dùng ảnh đơn lẻ hay phông nền có ánh sáng phức tạp. Luôn yêu cầu `🍌 Nano Banana Pro` tạo một khung hình `16:9` chia làm **3 khung con (3 panels)**:
  1. **Cận cảnh khuôn mặt (Close-up portrait)**: Khóa cấu trúc mặt, ánh mắt, nốt ruồi, vết sẹo hoặc chi tiết đầu cơ giáp.
  2. **Toàn thân nhìn thẳng (Full-body front view)**: Khóa tỷ lệ cơ thể và trang phục/giáp trụ mặt trước.
  3. **Toàn thân góc 3/4 phía sau (Full-body 3/4 back view)**: Khóa chi tiết sau lưng, áo choàng, động cơ phản lực hoặc vũ khí đeo lưng.
- **Bối cảnh trung tính bắt buộc**: Phải đặt trên **nền xám phẳng (`#808080`), ánh sáng studio phẳng, tuyệt đối không có bóng đổ (`flat neutral gray background, shadowless even lighting`)** vì mô hình AI sẽ sao chép mọi yếu tố ánh sáng từ ảnh tham chiếu vào tất cả các cảnh quay sau đó.
- **Khóa Trọn Bộ Folder 3 Phần Trên Google Flow (`/project/<id>/character/<uuid>`)**: Ngay khi đúc xong ở Giai đoạn 2, bắt buộc gọi `Flow.host.createCharacter` để nạp đủ 3 phần:
  1. **Tab `Chân dung` (Ảnh 1)**: Avatar/diện mạo cận cảnh của nhân vật.
  2. **Tab `Tạo cơ thể` -> `Cơ thể` (Ảnh 2)**: Gắn bảng thiết kế toàn thân 3 góc độ và tư thế hành động/chiêu thức vào mục Cơ thể.
  3. **Ô `Thông tin nhân vật` (`textarea[aria-label="Tính cách của nhân vật"]` — Ảnh 3)**: Bắt buộc nạp đủ **(a) Chỉ số hình thể (Chiều cao, cân nặng, giải phẫu)**, **(b) Tính cách & Linh hồn cảm xúc**, và **(c) Hành động & Chiêu thức đặc trưng (`[ACTION_...]`, `[SKILL_1_...]`, `[SKILL_2_...]`)**.

### Bước 2: Khóa Môi Trường bằng Ảnh Bối Cảnh "Sạch" (`Clean Environment Lock — Zero People`) & Đăng Ký Vào Thư Viện Thực Thể
- **Quy tắc thực thi**: Tạo một ảnh tham chiếu bối cảnh riêng biệt ở định dạng `16:9` bằng `🍌 Nano Banana Pro` với điều kiện bắt buộc: **HOÀN TOÀN TRỐNG (KHÔNG CÓ NGƯỜI / KHÔNG CÓ NHÂN VẬT)** và khóa ngay vào thư viện thực thể Flow (`STAGE: <Tên Bối Cảnh>`).
- **Lý do kỹ thuật**: Nếu ảnh bối cảnh có người, khi đính kèm cùng ảnh nhân vật, AI sẽ nhận diện 2 phiên bản chủ thể khác nhau gây **nhầm lẫn danh tính (Identity Confusion)** và làm biến đổi môi trường ngẫu nhiên giữa các cảnh.

### Bước 3: Lên Kịch Bản Phân Cảnh (`6+ Full-Resolution Storyboard Frames`) & Gọi `@TênNhânVật` Kèm Mã Chiêu Thức `[SKILL_...]`
- **Quy tắc thực thi**:
  - Chia câu chuyện thành tối thiểu **6 khung hình Storyboard có chủ đích** (Opening -> Inciting Action -> Escalation -> DNA Shift -> Climax -> Aftermath).
  - **Tuyệt đối không yêu cầu AI vẽ nhiều cảnh trong cùng 1 bức ảnh lưới**. Phải tạo từng khung hình Storyboard riêng lẻ ở độ phân giải đầy đủ (`16:9`) để dùng làm **Start Frame (`firstFrameImageMediaId`)** chất lượng cao nhất cho mô hình tạo video.
  - Trong prompt của mỗi khung Storyboard và Video, bắt buộc **gọi tên/ID nhân vật (`@<TênNhânVật> [CHARACTER: <Tên>]`) + tên bối cảnh (`@STAGE: <TênBốiCảnh>`) + mã hành động/chiêu thức (`[SKILL_...]`, `[ACTION_...]`)** để Google Flow tự động truy xuất toàn bộ Folder của nhân vật đó (gồm cả `Chân dung`, `Cơ thể` và `Thông tin nhân vật/Linh hồn cảm xúc`).

### Bước 4: Chọn Mô Hình AI Phù Hợp Nhất Cho Từng Tác Vụ (`Veo 3.1` vs `Omni 1.1 Flash`)
- **`Veo 3.1` (`Veo 3.1 - Fast` / `Lite` / `Quality`) — Chủ lực Nhất quán Điện ảnh**:
  - Ưu tiên sử dụng cho các cảnh quay chính và dự án dài vì **Veo 3.1 giữ độ ổn định nhân vật, bối cảnh vượt trội và ít lỗi hiển thị (glitches) hơn hẳn Omni Flash**.
- **`Omni 1.1 Flash` — Linh hoạt Thời lượng & Chỉnh sửa Đàm thoại (V2V Edit)**:
  - Sử dụng khi cần bóc tách kịch bản JSON, chấm điểm VQQA, tạo bản nháp siêu tốc hoặc chỉnh sửa video có sẵn (`sourceVideoMode: 'edit'`).

### Bước 5: Kiểm Soát Chính Xác Điểm Đầu & Điểm Cuối (`First Frame + Last Frame Interpolation`)
- **Quy tắc thực thi**:
  - Với cảnh nối tiếp chuyển động (`CONTINUOUS_MATCH_FRAME`): Tự động trích xuất khung hình cuối của cảnh trước (`extractVideoLastFrame`) làm `firstFrameImageMediaId` cho cảnh sau.
  - Với cảnh chuyển động phức tạp hoặc biến hình (`A_TO_B_BRIDGE`): Cung cấp cả **Khung hình đầu (`firstFrameImageMediaId`)** lẫn **Khung hình cuối (`lastFrameImageMediaId`)** để AI tự động nội suy chuyển động trung gian mượt mà, chính xác theo ý đồ đạo diễn mà không cần cắt ghép hậu kỳ thủ công.

### Bước 6: Chỉnh Sửa Video Hiện Có bằng AI (`Video-to-Video VFX Editing`)
- **Quy tắc thực thi**: Hỗ trợ tải lên hoặc chọn video có sẵn (`Flow.media.select({ filter: 'video' })`) và dùng `Flow.generate.video` với `sourceVideoMediaId` + `sourceVideoMode: 'edit'` để thêm hiệu ứng môi trường/VFX (như thêm tuyết rơi, mưa bão neon, tia lửa điện) trong khi vẫn bảo toàn nguyên vẹn chuyển động và thành phần gốc của video.

---

## 4. 🏭 QUY TRÌNH 7 GIAI ĐOẠN SẢN XUẤT PHIM AI CHUẨN CÔNG NGHIỆP THẾ GIỚI (END-TO-END STUDIO PIPELINE)

Tổng hợp từ quy trình thực tế của **Google DeepMind Filmmaking Partners (*Primordial Soup*, *Shy Kids*)**, **Curious Refuge**, **Runway Studios** và các tập đoàn phim AI hàng đầu Trung Quốc (**Kuaishou Kling NextGen**, **ByteDance Seedance**, **ShengShu Vidu**), một bộ phim AI thương mại luôn đi qua **7 giai đoạn khép kín** dưới đây — và toàn bộ 7 giai đoạn này đã được ánh xạ 1:1 vào bộ công cụ trong dự án [`d:\myProject\test-AI`](file:///d:/myProject/test-AI):

| Giai đoạn | Tên Giai Đoạn Chuẩn Studio Thế Giới | Công việc Cốt lõi của Đạo diễn & AI | Công cụ Thực thi trong Hệ thống của Bạn (25.000 Credits Ultra) |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1** | **Development & Technical Breakdown** *(Phát triển Kịch bản & Bóc tách Kỹ thuật DOP)* | Chuyển ý tưởng/kịch bản thô thành **Kinh Thánh Vũ Trụ (World Bible)**: danh sách nhân vật, trạng thái biến đổi ngoại hình (Multi-State DNA), bối cảnh, và bảng phân cảnh kỹ thuật (Shot List gồm tiêu cự ống kính, góc máy, chuyển động camera, thời lượng, âm thanh). | • Hàm [`extractAutonomousBlueprint`](file:///d:/myProject/test-AI/services/actionDirectorEngine.ts#L162-L263) gọi `Flow.generate.text` (`Omni 1.1 Flash` — **0 Credit**). |
| **Giai đoạn 2** | **Visual Bible & Asset Locking ("Frames-First" Strategy)** *(Đúc Hồ sơ Nhân vật & Khóa Bối cảnh Sạch)* | **Nguyên tắc sống còn của mọi Studio lớn**: Tuyệt đối không bấm máy tạo video khi chưa khóa xong 2 tài sản gốc:<br>1. **3-Panel Character Sheet** (Cận mặt + Toàn thân trước + Toàn thân 3/4 sau trên nền xám `#808080` không bóng đổ).<br>2. **Clean Environment Lock** (Ảnh bối cảnh trống 100% không người). | • Hàm [`forgeMultiStateCharacterDNA`](file:///d:/myProject/test-AI/services/actionDirectorEngine.ts#L268-L320) & [`forgeEnvironmentStagePlate`](file:///d:/myProject/test-AI/services/actionDirectorEngine.ts#L325-L368) (`🍌 Nano Banana Pro` — **0 Credit**).<br>• Lưu vào tab **Nhân vật** gốc của Google Flow bằng `Flow.host.createCharacter(...)` (`npm run create-character`). |
| **Giai đoạn 3** | **Storyboard & Animatic Pre-Viz** *(Vẽ Phân cảnh Độ phân giải Đầy đủ & Dựng Nháp)* | Vẽ từng khung hình **Start Frame** (`16:9` full-res) bằng cách ghép (`Multi-Ingredient Fusion`) ảnh Nhân vật + ảnh Bối cảnh sạch + nhãn `[CHARACTER: Tên]`. Kiểm tra bố cục ánh sáng và tạo thêm **End Frame** cho các cảnh cần khóa điểm cuối (`A_TO_B_BRIDGE`). | • Bước `compositing_keyframes` trong [`App.tsx`](file:///d:/myProject/test-AI/App.tsx#L194-L250) & [`ShotInspectorDrawer.tsx`](file:///d:/myProject/test-AI/components/ShotInspectorDrawer.tsx) (`🍌 Nano Banana Pro` — **0 Credit**).<br>• Chỉnh sửa đến khi ưng ý 100% trước khi tốn Credit render video. |
| **Giai đoạn 4** | **Principal AI Photography & Motion Control** *(Bấm máy Render Video & Điều khiển Chuyển động)* | Định tuyến từng cảnh sang mô hình video tối ưu nhất:<br>• **Nối tiếp chuyển động (`CONTINUOUS_MATCH_FRAME`)**: Trích xuất khung hình cuối của cảnh $N-1$ làm `firstFrameImageMediaId` cho cảnh $N$.<br>• **Nội suy 2 đầu (`A_TO_B_BRIDGE`)**: Truyền cả `firstFrameImageMediaId` + `lastFrameImageMediaId`.<br>• **Ký ức Thị giác (`CANVAS Memory`)**: Cập nhật mỏ neo nhân vật ngay sau cảnh biến hình/nổ giáp (`isDnaStateShift`). | • Hàm [`generateShotVideoTake`](file:///d:/myProject/test-AI/services/productionPipeline.ts#L204-L348) gọi `Flow.generate.video` với **`Veo 3.1 - Lite`** (50 Credits) hoặc **`Veo 3.1 - Fast`** (100 Credits), tích hợp sẵn âm thanh đồng bộ (Native Audio/SFX). |
| **Giai đoạn 5** | **Automated Quality Control (VQQA) & Surgical Retakes** *(Kiểm định Chất lượng Tự động & Quay Bổ sung)* | Tại các studio công nghiệp, chỉ ~20–40% cú bấm máy đầu tiên đạt chuẩn điện ảnh. Hệ thống AI Giám khảo (MLLM Judge) chấm điểm từng cảnh; những cảnh bị lỗi vật lý hoặc lệch mặt sẽ được chỉnh sửa riêng lẻ hoặc đắp hiệu ứng **Video-to-Video (`sourceVideoMode: 'edit'`)**. | • Hàm [`evaluateShotVisualQuality`](file:///d:/myProject/test-AI/services/mllmJudgeService.ts) (`Omni 1.1 Flash` — **0 Credit**).<br>• Ngăn kéo [`ShotInspectorDrawer.tsx`](file:///d:/myProject/test-AI/components/ShotInspectorDrawer.tsx) hỗ trợ sửa cảnh bằng tiếng Việt, khóa lại First/Last Frame & **V2V VFX Edit**. |
| **Giai đoạn 6** | **Scene Assembly & NLE Timeline Editing** *(Dựng Phim Đa Làn, Cắt Nhịp & Chuyển Cảnh)* | Đưa các cú máy đạt chuẩn (`Master Takes`) vào bàn dựng phi tuyến tính (NLE Timeline) hoặc **Google Flow Scenebuilder (Tab Cảnh)** để sắp xếp thứ tự, cắt bỏ phần dư đầu/cuối (`trimIn` / `trimOut`), áp bộ lọc màu điện ảnh (LUT Color Grading) và khớp nhịp (Pacing). | • Tự động đẩy vào tab **Cảnh** gốc của Google Flow bằng `Flow.host.createScene(...)` (`npm run create-scene`).<br>• Hoặc dựng trực tiếp trên bàn dựng NLE [`MasteringStudio.tsx`](file:///d:/myProject/test-AI/components/MasteringStudio.tsx). |
| **Giai đoạn 7** | **Audio Sweetening, Subtitling & Final Mastering** *(Hậu kỳ Âm thanh, Phụ đề & Xuất Bản Master)* | Hòa âm đa kênh (giọng thoại/Voiceover + tiếng động SFX của Veo 3.1 + nhạc nền điện ảnh BGM), đóng dấu phụ đề `.SRT` và kết xuất (Render) ra file `.MP4` hoàn chỉnh ở độ phân giải Full HD `1080p` / `4K`. | • Hàm [`exportMasterProductionMp4`](file:///d:/myProject/test-AI/services/timelineComposer.ts) kết xuất thẳng file `.mp4` + `.srt` + `.json` về ổ cứng máy tính. |


