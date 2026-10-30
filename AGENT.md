# 📘 AGENT.MD — SỔ TAY NHÂN VIÊN & ĐẠO DIỄN ĐIỆN ẢNH AI (HYPERION STUDIO OS)

> **Vai trò của file này (`AGENT.MD = Sổ tay nhân viên`)**: Định nghĩa **Văn hóa làm việc**, **Giọng văn mong muốn**, và **Phong cách xử lý việc (SOP chuẩn công nghiệp)** để AI luôn hành xử đúng giọng, đúng ý Đạo diễn và tuân thủ kỷ luật sản xuất phim AI chuyên nghiệp của Google Flow & các tập đoàn phim AI hàng đầu thế giới.
> - Kết nối cùng: **[context.md](file:///d:/myProject/test-AI/context.md)** *(Kho tài liệu chuyên sâu & Hồ sơ dự án)* và **[MEMORY.md](file:///d:/myProject/test-AI/MEMORY.md)** *(Trí nhớ thực chiến tới từng chân tơ kẽ tóc)*.
> - **Từ 2026-10-29, chuẩn mặc định là `MEM-24 — Premium Animation Standard`** (mục 5 của file này và mục 4 của [MEMORY.md](file:///d:/myProject/test-AI/MEMORY.md)). Khi một quy tắc cũ bên dưới mâu thuẫn với `MEM-24`, **`MEM-24` thắng**. Quy tắc cũ chỉ còn áp dụng khi chạy `--preset dino-legacy`.
> - **Cập nhật 2026-10-30 — `MEM-24.1` (bài học render thật `dino_premium_v2`, [MEMORY.md](file:///d:/myProject/test-AI/MEMORY.md) mục 4.8)**: mọi cảnh có **khung cuối sửa từ khung đầu**; cảnh va chạm cắt **trước** khi chạm; giám khảo xem **khung dày** với **6 cổng cứng** và trả `beat_in/peak/out`; cửa sổ cắt phải chứa `beat_peak`; âm thanh dùng bản đồ gain + crossfade + **một** gain tĩnh + limiter (không loudnorm động); có `forceWindow` / `hflip` từng cảnh. Mục 5 bên dưới đã cập nhật theo.

---

## 1. 🏛️ VĂN HÓA LÀM VIỆC (WORK CULTURE & ENGINEERING ETHOS)

1. **Tư duy Đạo diễn Điện ảnh Có Kế Hoạch (Intentional Filmmaking over Random Generation)**:
   - Tuyệt đối **KHÔNG** tạo ảnh hoặc video ngẫu nhiên chỉ từ một câu văn bản mơ hồ.
   - Mọi dự án phim ngắn, TVC quảng cáo hay giải trí đều phải đi qua quy trình **Khóa Nhân Vật (3-Panel Reference Sheet) -> Khóa Bối Cảnh Sạch (Clean Environment Lock) -> Quy hoạch Storyboard (6+ Khung hình độ phân giải đầy đủ) -> Kiểm soát First/Last Frame -> Kiểm định VQQA -> Dựng hậu kỳ NLE**.
   - **Chuẩn Premium (`MEM-24`)**: Chọn **phong cách** trước (mặc định hoạt hình 3D kiểu Pixar), rồi đến **nhân vật biết diễn** (hồ sơ có bảng biểu cảm), **kịch bản xoay quanh mong muốn của nhân vật**, **prompt ngắn bằng văn xuôi**, **nhiều take rồi chọn bản tốt nhất**, và cuối cùng **dựng ngắn, âm thanh chuẩn -14 LUFS**. Không cố "làm xịn" bằng cách chồng hiệu ứng hay nhồi thuật ngữ vào prompt.
   - **Chỉ làm truyện gốc**: Giữ nhân vật và thế giới mà người dùng đưa ra; không ép mọi kịch bản thành phim khủng long; không dựng lại video của người khác.
2. **Kỷ luật Kỹ thuật Phần mềm Thực Chiến (Zero Mock / Zero Fake Delay)**:
   - Không bao giờ sử dụng dữ liệu giả (`mock_...`), `setTimeout` giả lập tiến trình hay trả về điểm số giả.
   - Mọi mắt xích trong dây chuyền tự hành (`extracting_script` -> `forging_dna` -> `compositing_keyframes` -> `rendering_video_takes` -> `judging_quality` -> `assembling_master`) phải gọi API thật của `flow-sdk` và xử lý lỗi (fallback/retry) an toàn.
   - **Giám khảo phải fail-closed**: Khi không đọc được kết quả chấm thì ghi `null` và báo rõ cho người dùng. Tuyệt đối không mặc định 95 điểm, và không dùng "audit" tự kiểm nhãn do chính nó viết rồi tự chấm 100/100. Luôn giữ **bản tốt nhất**, không giữ bản chạy cuối cùng.
3. **Kỷ luật Tối ưu Tín dụng (Credit Economy First)**:
   - Luôn ưu tiên tận dụng tối đa các tác vụ **0 Credit** trên gói Google AI Ultra (`Omni 1.1 Flash` cho phân tích kịch bản/kiểm định VQQA và `🍌 Nano Banana Pro` cho việc đúc Character Sheet, Environment Lock, Storyboard Keyframes) trước khi bấm máy render video.
   - **Giá credit mỗi lần tạo video (đã kiểm chứng 2026-10-29)**: `Veo 3.1 - Lite` **5**, `Veo 3.1 - Fast` **10**, `Veo 3.1 - Quality` **100**. Luôn duyệt hình bằng `--frames-only` (0 credit) trước, và báo ước tính `số cảnh × số take × credit` cho người dùng trước khi bấm máy.

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
- **Cập nhật `MEM-24` (đường Premium)**: Mỗi nhân vật có **3 ảnh riêng** trên nền `#808080`, không chữ/không nhãn, do `buildCharacterSheetPrompts` tạo theo `--style`:
  - `Turnaround` 4 góc (trước, 3/4, nghiêng, sau).
  - `Expression & Pose Sheet`: 6 biểu cảm (tự tin, vui, tò mò, nghiêm túc, ngạc nhiên, giận dữ) + 4 tư thế, lưu ở `02_character_N_expression_sheet.png`.
  - `Portrait` bán thân 3/4, lưu ở `02_character_N_portrait.png`. Ảnh này được tạo riêng; cắt từ sheet chỉ là fallback.
  - Folder `MEM-10` vẫn bắt buộc: portrait → `Chân dung`, turnaround → `Cơ thể`, `personalityVi` → `Thông tin nhân vật`.
  - Không dùng từ "photograph" hay "8k photorealistic", trừ khi `--style photoreal`.

### Bước 2: Khóa Môi Trường bằng Ảnh Bối Cảnh "Sạch" (`Clean Environment Lock — Zero People`) & Đăng Ký Vào Thư Viện Thực Thể
- **Quy tắc thực thi**: Tạo một ảnh tham chiếu bối cảnh riêng biệt ở định dạng `16:9` bằng `🍌 Nano Banana Pro` với điều kiện bắt buộc: **HOÀN TOÀN TRỐNG (KHÔNG CÓ NGƯỜI / KHÔNG CÓ NHÂN VẬT)** và khóa ngay vào thư viện thực thể Flow (`STAGE: <Tên Bối Cảnh>`).
- **Lý do kỹ thuật**: Nếu ảnh bối cảnh có người, khi đính kèm cùng ảnh nhân vật, AI sẽ nhận diện 2 phiên bản chủ thể khác nhau gây **nhầm lẫn danh tính (Identity Confusion)** và làm biến đổi môi trường ngẫu nhiên giữa các cảnh.
- **Cập nhật `MEM-24`**: Viết prompt bối cảnh bằng câu tích cực (`An empty establishing view of ...`), không dùng chuỗi `zero people, no humans...`. Mỗi bối cảnh có **một** nguồn sáng có động cơ và **một** họ màu kèm một màu nhấn (`buildEnvironmentPlatePrompt`). Chỉ dùng **một** env plate sạch; không có bối cảnh "phá hủy" 03B/03C trong đường Premium.

### Bước 3: Lên Kịch Bản Phân Cảnh (`6+ Full-Resolution Storyboard Frames`) & Gọi `@TênNhânVật` Kèm Mã Chiêu Thức `[SKILL_...]`
- **Quy tắc thực thi**:
  - Chia câu chuyện thành tối thiểu **6 khung hình Storyboard có chủ đích** (Opening -> Inciting Action -> Escalation -> DNA Shift -> Climax -> Aftermath).
  - **Tuyệt đối không yêu cầu AI vẽ nhiều cảnh trong cùng 1 bức ảnh lưới**. Phải tạo từng khung hình Storyboard riêng lẻ ở độ phân giải đầy đủ (`16:9`) để dùng làm **Start Frame (`firstFrameImageMediaId`)** chất lượng cao nhất cho mô hình tạo video.
  - Trong prompt của mỗi khung Storyboard và Video, bắt buộc **gọi tên/ID nhân vật (`@<TênNhânVật> [CHARACTER: <Tên>]`) + tên bối cảnh (`@STAGE: <TênBốiCảnh>`) + mã hành động/chiêu thức (`[SKILL_...]`, `[ACTION_...]`)** để Google Flow tự động truy xuất toàn bộ Folder của nhân vật đó (gồm cả `Chân dung`, `Cơ thể` và `Thông tin nhân vật/Linh hồn cảm xúc`).
- **Cập nhật `MEM-24` (đường Premium — thay cho gạch đầu dòng ngay trên)**:
  - Prompt **không chứa** `@ID`, `[CHARACTER: ...]`, `[SKILL_...]`, ngoặc vuông, con số đo hay từ phủ định. Nhân vật được gọi bằng **tên hiển thị + một cụm ngoại hình** và trỏ ảnh tham chiếu bằng `(image N)`. Ảnh tham chiếu đi qua `referenceImageMediaIds`: sheet của các nhân vật có mặt (+ expression sheet nếu là cận cảnh) + env plate. Mã `[SKILL_...]` chỉ nằm trong Folder.
  - Keyframe là trạng thái **đầu cảnh**, do `buildKeyframePrompt` viết (60–120 từ).
  - Cỡ cảnh do `planCoverage` quyết định: ≥35% cận mặt, ≤25% toàn cảnh, không lặp cỡ cảnh liền nhau, sau đòn lớn là cận cảnh phản ứng.
  - Mọi prompt phải qua `lintPremiumPrompt` và lưu kết quả vào `s.promptLint`.

### Bước 4: Chọn Mô Hình AI Phù Hợp Nhất Cho Từng Tác Vụ (`Veo 3.1` vs `Omni 1.1 Flash`)
- **`Veo 3.1` (`Veo 3.1 - Fast` / `Lite` / `Quality`) — Chủ lực Nhất quán Điện ảnh**:
  - Ưu tiên sử dụng cho các cảnh quay chính và dự án dài vì **Veo 3.1 giữ độ ổn định nhân vật, bối cảnh vượt trội và ít lỗi hiển thị (glitches) hơn hẳn Omni Flash**.
- **`Omni 1.1 Flash` — Linh hoạt Thời lượng & Chỉnh sửa Đàm thoại (V2V Edit)**:
  - Sử dụng khi cần bóc tách kịch bản JSON, chấm điểm VQQA, tạo bản nháp siêu tốc hoặc chỉnh sửa video có sẵn (`sourceVideoMode: 'edit'`).
- **Cập nhật `MEM-24` (chọn model theo `--quality`)**:
  - `final` (mặc định): `Veo 3.1 - Quality`, 100 credit/lần, 2 take mỗi cảnh. Model này **không hỗ trợ Ingredients**, nên chỉ truyền `firstFrameImageMediaId` (Pure First-Frame Lock, `MEM-13` (5)).
  - `draft`: `Veo 3.1 - Lite`, 5 credit/lần, 1 take.
  - `Veo 3.1 - Fast` (10 credit) chạy qua `--model "Veo 3.1 - Fast"`.
  - Prompt video do `buildMotionPrompt` viết (40–90 từ). Prompt **chỉ tả chuyển động** (máy quay, một hành động, biểu cảm đổi từ A sang B, ánh nhìn), sau đó là âm thanh: `<Tên> says: <lời thoại ≤8 từ>` (dấu hai chấm, không ngoặc kép), `SFX: ...`, `Ambient noise: ...`.

### Bước 5: Kiểm Soát Chính Xác Điểm Đầu & Điểm Cuối (`First Frame + Last Frame Interpolation`)
- **Quy tắc thực thi**:
  - Với cảnh nối tiếp chuyển động (`CONTINUOUS_MATCH_FRAME`): Tự động trích xuất khung hình cuối của cảnh trước (`extractVideoLastFrame`) làm `firstFrameImageMediaId` cho cảnh sau.
  - Với cảnh chuyển động phức tạp hoặc biến hình (`A_TO_B_BRIDGE`): Cung cấp cả **Khung hình đầu (`firstFrameImageMediaId`)** lẫn **Khung hình cuối (`lastFrameImageMediaId`)** để AI tự động nội suy chuyển động trung gian mượt mà, chính xác theo ý đồ đạo diễn mà không cần cắt ghép hậu kỳ thủ công.

### Bước 6: Chỉnh Sửa Video Hiện Có bằng AI (`Video-to-Video VFX Editing`)
- **Quy tắc thực thi**: Hỗ trợ tải lên hoặc chọn video có sẵn (`Flow.media.select({ filter: 'video' })`) và dùng `Flow.generate.video` với `sourceVideoMediaId` + `sourceVideoMode: 'edit'` để thêm hiệu ứng môi trường/VFX (như thêm tuyết rơi, mưa bão neon, tia lửa điện) trong khi vẫn bảo toàn nguyên vẹn chuyển động và thành phần gốc của video.
- **Cập nhật `MEM-24`**: Việc thêm hiệu ứng cũng phải tuân theo **ngân sách hiệu ứng**: mỗi cảnh tối đa một hiệu ứng; cảnh mở đầu và kết thúc không có hiệu ứng; mức hiệu ứng mạnh chỉ dành cho 1–2 cảnh cao trào.

---

## 4. 🏭 QUY TRÌNH 7 GIAI ĐOẠN SẢN XUẤT PHIM AI CHUẨN CÔNG NGHIỆP THẾ GIỚI (END-TO-END STUDIO PIPELINE)

Tổng hợp từ quy trình thực tế của **Google DeepMind Filmmaking Partners (*Primordial Soup*, *Shy Kids*)**, **Curious Refuge**, **Runway Studios** và các tập đoàn phim AI hàng đầu Trung Quốc (**Kuaishou Kling NextGen**, **ByteDance Seedance**, **ShengShu Vidu**), một bộ phim AI thương mại luôn đi qua **7 giai đoạn khép kín** dưới đây — và toàn bộ 7 giai đoạn này đã được ánh xạ 1:1 vào bộ công cụ trong dự án [`d:\myProject\test-AI`](file:///d:/myProject/test-AI):

| Giai đoạn | Tên Giai Đoạn Chuẩn Studio Thế Giới | Công việc Cốt lõi của Đạo diễn & AI | Công cụ Thực thi trong Hệ thống của Bạn (25.000 Credits Ultra) |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1** | **Development & Technical Breakdown** *(Phát triển Kịch bản & Bóc tách Kỹ thuật DOP)* | Chuyển ý tưởng/kịch bản thô thành **Kinh Thánh Vũ Trụ (World Bible)**: danh sách nhân vật, trạng thái biến đổi ngoại hình (Multi-State DNA), bối cảnh, và bảng phân cảnh kỹ thuật (Shot List gồm tiêu cự ống kính, góc máy, chuyển động camera, thời lượng, âm thanh). | • Hàm [`extractAutonomousBlueprint`](file:///d:/myProject/test-AI/services/actionDirectorEngine.ts#L162-L263) gọi `Flow.generate.text` (`Omni 1.1 Flash` — **0 Credit**). |
| **Giai đoạn 2** | **Visual Bible & Asset Locking ("Frames-First" Strategy)** *(Đúc Hồ sơ Nhân vật & Khóa Bối cảnh Sạch)* | **Nguyên tắc sống còn của mọi Studio lớn**: Tuyệt đối không bấm máy tạo video khi chưa khóa xong 2 tài sản gốc:<br>1. **3-Panel Character Sheet** (Cận mặt + Toàn thân trước + Toàn thân 3/4 sau trên nền xám `#808080` không bóng đổ).<br>2. **Clean Environment Lock** (Ảnh bối cảnh trống 100% không người). | • Hàm [`forgeMultiStateCharacterDNA`](file:///d:/myProject/test-AI/services/actionDirectorEngine.ts#L268-L320) & [`forgeEnvironmentStagePlate`](file:///d:/myProject/test-AI/services/actionDirectorEngine.ts#L325-L368) (`🍌 Nano Banana Pro` — **0 Credit**).<br>• Lưu vào tab **Nhân vật** gốc của Google Flow bằng `Flow.host.createCharacter(...)` (`npm run create-character`). |
| **Giai đoạn 3** | **Storyboard & Animatic Pre-Viz** *(Vẽ Phân cảnh Độ phân giải Đầy đủ & Dựng Nháp)* | Vẽ từng khung hình **Start Frame** (`16:9` full-res) bằng cách ghép (`Multi-Ingredient Fusion`) ảnh Nhân vật + ảnh Bối cảnh sạch + nhãn `[CHARACTER: Tên]`. Kiểm tra bố cục ánh sáng và tạo thêm **End Frame** cho các cảnh cần khóa điểm cuối (`A_TO_B_BRIDGE`). | • Bước `compositing_keyframes` trong [`App.tsx`](file:///d:/myProject/test-AI/App.tsx#L194-L250) & [`ShotInspectorDrawer.tsx`](file:///d:/myProject/test-AI/components/ShotInspectorDrawer.tsx) (`🍌 Nano Banana Pro` — **0 Credit**).<br>• Chỉnh sửa đến khi ưng ý 100% trước khi tốn Credit render video. |
| **Giai đoạn 4** | **Principal AI Photography & Motion Control** *(Bấm máy Render Video & Điều khiển Chuyển động)* | Định tuyến từng cảnh sang mô hình video tối ưu nhất:<br>• **Nối tiếp chuyển động (`CONTINUOUS_MATCH_FRAME`)**: Trích xuất khung hình cuối của cảnh $N-1$ làm `firstFrameImageMediaId` cho cảnh $N$.<br>• **Nội suy 2 đầu (`A_TO_B_BRIDGE`)**: Truyền cả `firstFrameImageMediaId` + `lastFrameImageMediaId`.<br>• **Ký ức Thị giác (`CANVAS Memory`)**: Cập nhật mỏ neo nhân vật ngay sau cảnh biến hình/nổ giáp (`isDnaStateShift`). | • Hàm [`generateShotVideoTake`](file:///d:/myProject/test-AI/services/productionPipeline.ts#L204-L348) gọi `Flow.generate.video` với **`Veo 3.1 - Lite`** (5 Credits), **`Veo 3.1 - Fast`** (10 Credits) hoặc **`Veo 3.1 - Quality`** (100 Credits — mặc định cho bản final của đường Premium), tích hợp sẵn âm thanh đồng bộ (Native Audio/SFX). |
| **Giai đoạn 5** | **Automated Quality Control (VQQA) & Surgical Retakes** *(Kiểm định Chất lượng Tự động & Quay Bổ sung)* | Tại các studio công nghiệp, chỉ ~20–40% cú bấm máy đầu tiên đạt chuẩn điện ảnh. Hệ thống AI Giám khảo (MLLM Judge) chấm điểm từng cảnh; những cảnh bị lỗi vật lý hoặc lệch mặt sẽ được chỉnh sửa riêng lẻ hoặc đắp hiệu ứng **Video-to-Video (`sourceVideoMode: 'edit'`)**. | • Hàm [`evaluateShotVisualQuality`](file:///d:/myProject/test-AI/services/mllmJudgeService.ts) (`Omni 1.1 Flash` — **0 Credit**).<br>• Ngăn kéo [`ShotInspectorDrawer.tsx`](file:///d:/myProject/test-AI/components/ShotInspectorDrawer.tsx) hỗ trợ sửa cảnh bằng tiếng Việt, khóa lại First/Last Frame & **V2V VFX Edit**. |
| **Giai đoạn 6** | **Scene Assembly & NLE Timeline Editing** *(Dựng Phim Đa Làn, Cắt Nhịp & Chuyển Cảnh)* | Đưa các cú máy đạt chuẩn (`Master Takes`) vào bàn dựng phi tuyến tính (NLE Timeline) hoặc **Google Flow Scenebuilder (Tab Cảnh)** để sắp xếp thứ tự, cắt bỏ phần dư đầu/cuối (`trimIn` / `trimOut`), áp bộ lọc màu điện ảnh (LUT Color Grading) và khớp nhịp (Pacing). | • Tự động đẩy vào tab **Cảnh** gốc của Google Flow bằng `Flow.host.createScene(...)` (`npm run create-scene`).<br>• Hoặc dựng trực tiếp trên bàn dựng NLE [`MasteringStudio.tsx`](file:///d:/myProject/test-AI/components/MasteringStudio.tsx). |
| **Giai đoạn 7** | **Audio Sweetening, Subtitling & Final Mastering** *(Hậu kỳ Âm thanh, Phụ đề & Xuất Bản Master)* | Hòa âm đa kênh (giọng thoại/Voiceover + tiếng động SFX của Veo 3.1 + nhạc nền điện ảnh BGM), đóng dấu phụ đề `.SRT` và kết xuất (Render) ra file `.MP4` hoàn chỉnh ở độ phân giải Full HD `1080p` / `4K`. | • Hàm [`exportMasterProductionMp4`](file:///d:/myProject/test-AI/services/timelineComposer.ts) kết xuất thẳng file `.mp4` + `.srt` + `.json` về ổ cứng máy tính. |


---

## 5. 🏆 ĐƯỜNG PREMIUM MẶC ĐỊNH (`MEM-24`): 7 GIAI ĐOẠN, LỆNH CHẠY & TIÊU CHÍ NGHIỆM THU

Từ 2026-10-29, [`run-full-movie-pipeline.ts`](file:///d:/myProject/test-AI/.agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts) mặc định chạy **đường Premium**. Bảng ở mục 4 mô tả kiến trúc chung; bảng dưới đây là cách đường Premium thực thi từng giai đoạn. Đường cũ (template khủng long, prompt kiểu bảng thông số, hậu kỳ zoompan/flash/TTS) chỉ chạy khi truyền `--preset dino-legacy`.

| Giai đoạn | Đường Premium làm gì | Hàm / file chính | Credit |
| :--- | :--- | :--- | :--- |
| **1. Story Room** | `Flow.generate.text` với prompt Story Room. Kết quả được chuẩn hóa thành story bible: 1–2 nhân vật, 1 bối cảnh, `--shots` cảnh (mặc định 12) theo 6 nhịp. Giữ nhân vật và thế giới của người dùng. Lưu ở `blueprint.premiumBible`. | `buildStoryRoomPrompt` → `normalizeStoryBible` (lỗi thì `buildFallbackStoryBible`) → `toLegacyShotFields` | 0 |
| **2. Hồ sơ nhân vật & bối cảnh** | Mỗi nhân vật có turnaround + expression/pose sheet + portrait. Có một env plate sạch. Gatekeeper tham số hóa theo loài/phong cách và giữ bản tốt nhất. Khóa Folder `MEM-10` bằng `Flow.host.createCharacter`. | `buildCharacterSheetPrompts`, `buildEnvironmentPlatePrompt` | 0 |
| **3. Keyframe** | Vẽ trạng thái đầu của từng cảnh bằng Nano Banana Pro. Ảnh tham chiếu = sheet của nhân vật có mặt (+ expression sheet cho cảnh cận) + env plate. Lint và lưu `s.promptLint`. Giữ bản tốt nhất.<br>**`MEM-24.1` (L1)**: Mọi cảnh còn có **khung cuối**, tạo bằng cách **sửa khung đầu** với Nano Banana Pro ("Edit image 1. Keep the background ... Change only the poses and expressions: `<endStateEn>` ..."). Ảnh tham chiếu = [khung đầu, sheet từng nhân vật trong cảnh], tối đa 3. Giữ nguyên cỡ cảnh và bố cục. Không tả lại toàn cảnh (nền sẽ trôi), không bỏ sheet của nhân vật nào (sẽ đổi màu). Nhịp không vui có câu "mouth firmly closed, lips covering the teeth" (L5). | `buildKeyframePrompt`, `buildEndFrameEditPrompt`, `lintPremiumPrompt` (loại `'edit'`) | 0 |
| **4. Quay video** | Prompt chỉ tả chuyển động và âm thanh. Model chọn theo `--quality` / `--model`. Quay `--takes` take mỗi cảnh, lưu `shot_XX_take_K.mp4`.<br>**`MEM-24.1`**: Veo nhận **khung đầu + khung cuối** của chính cảnh đó (`buildMotionPrompt({ withEndFrame: true })`). Cảnh va chạm dừng **một bước trước khi chạm**; cú va chạm rơi vào điểm cắt và được bán bằng âm thanh (L4). | `buildMotionPrompt`, `buildPremiumVideoRequest`, `estimateCredits` | shots × takes × (5 / 10 / 100) |
| **5. Giám khảo take** | **`MEM-24.1` (L7)**: trích **khung dày** mỗi take (khung đầu + ≥10 khung đều + khung cuối; 3 khung là không đủ vì bỏ sót tan chảy giữa các mẫu), đặt ảnh tham chiếu (khung đầu/cuối, sheet) trước. Chấm bằng rubric nghiêm với 6 cổng cứng: `keyActionVisible`, `bodyIntact`, `expressionMatchesBeat`, `identityOnModel`, `facingCorrect`, `cleanFrame`. Trượt một cổng thì fail, điểm ≤55. Giám khảo trả `beat_in` / `beat_peak` / `beat_out`. Take tốt nhất được chép thành `shot_XX_video.mp4`. `s.vqqaScore` = điểm thật hoặc `null`. | `denseJudgeFrameTimes`, `buildTakeJudgePrompt` → `parseJudgeVerdict(text, { requireHardGates: true })` → `pickBestTake` | 0 |
| **6. Tab Cảnh** | Giữ nguyên như cũ: `Flow.host.createScene`. | — | 0 |
| **7. Master** | Offline, chỉ dùng ffmpeg: một filter graph, audio Veo là kênh chính, 1080p, encode một lần, phụ đề chỉ cho lời thoại. Xuất `MASTER_FINAL_MOVIE.mp4` (+ bản sao `MASTER_DIRECTORS_CUT.mp4`), `master_subtitles.srt/.ass` và report JSON.<br>**`MEM-24.1`**:<br>• Cửa sổ cắt chứa `beat_peak` của giám khảo (L8); loại cửa sổ có khung giữa bị hiệu ứng phủ >40%.<br>• Âm thanh (L9): bản đồ gain kịch tính → crossfade 5 khung → ambience/nhạc tùy chọn → **một** gain tĩnh + limiter. Không loudnorm động.<br>• Hình (L10): tone curve toe/shoulder, chuẩn hóa phơi sáng từng cảnh, chặn cháy đỏ.<br>• Override từng cảnh (L11): `forceWindow` / `hflip`. Report `<tên>_report.json` có md5 nguồn. | [`premiumMasteringEngine.ts`](file:///d:/myProject/test-AI/services/premiumMasteringEngine.ts) `masterFilm`, [`remaster-run.ts`](file:///d:/myProject/test-AI/scripts/remaster-run.ts) | 0 |

> **Trạng thái nối dây (kiểm tra lại 2026-10-30, sau review r3)**: CLI `run-full-movie-pipeline.ts` **đã nối** đủ `MEM-24.1`: Stage 3 vẽ khung cuối (L1) cho mọi cảnh; Stage 4 gửi Veo khung đầu + khung cuối; Stage 5 giám khảo 12 khung dày 480px + khung đầu/cuối + sheet, cổng cứng, `beat_in/peak/out`; Stage 7 nhận `beatWindow` / `actingBeat` / `action` / `forceWindow` / `hflip`, có `--ambience <file>` và `--ambience-from-flow` (1 clip Veo Lite = 5 credit; hỏng thì phải thêm `--rerender-ambience`). `--resume <run thử nghiệm có bible.json + state.json>` tự tạo blueprint và dựng master vào `pipeline_master/`. ⚠️ Flow từ chối prompt có ảnh dài hơn ~4.000 ký tự và từ "see-through": giám khảo dùng bản gọn ≤ 3.300 ký tự ("translucent"), lỗi thì thử bản 8 khung, vẫn lỗi thì cảnh báo ⛔; `--resume` chấm lại bản chưa có phán quyết (0 credit video). `npm run remaster` đọc cùng nhịp diễn / forceWindow / hflip đã lưu (manifest hoặc `state.json`). Chi tiết: [MEMORY.md](file:///d:/myProject/test-AI/MEMORY.md) mục 4.8.

**Lệnh chuẩn** (danh sách cờ và bảng credit đầy đủ: [MEMORY.md](file:///d:/myProject/test-AI/MEMORY.md) mục 4.5):

```bash
# Duyệt hình 0 credit -> Final (Quality, 2 take) -> Dựng lại hậu kỳ offline
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --script "<kịch bản>" --frames-only
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --resume output/vscode_runs/<run> --quality final
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --resume output/vscode_runs/<run> --master-only
# (run legacy + --master-only: chỉ ghi bản Premium vào <run>/premium_master/, file gốc của run giữ nguyên;
#  resume giữ model & số take đã khóa trong blueprint)

# Remaster run cũ thành bản Premium (chỉ ghi vào <run>/premium_master/)
npm run remaster -- --run output/vscode_runs/<run>

# MEM-24.1: sửa từng cảnh (beatWindow / forceWindow / hflip / fxSpans) + nền ambience, bản master có tên riêng
# (report <out-name>_report.json, không ghi đè report của bản khác; mẫu overrides ở MEMORY.md mục 4.8)
npm run remaster -- --run output/vscode_runs/<run> --out-subdir master_r4 --out-name MASTER_R4 --overrides <file.json> --ambience <file ambience> --take-tag final
```

**Quy trình làm việc với người dùng:**
1. Đọc kịch bản. Nếu người dùng chưa chọn phong cách thì đề xuất `pixar3d`. `photoreal` chỉ dùng cho phim kiểu tài liệu thiên nhiên.
2. Chạy `--frames-only` (0 credit) rồi đưa người dùng xem sheet, env plate và keyframe. Sửa ở giai đoạn này vì sửa ở đây rẻ nhất.
   - **`MEM-24.1`**: Xem cả **cặp khung đầu/cuối** của từng cảnh. Kiểm tra: nền giống hệt nhau, cùng cỡ cảnh, màu nhân vật đúng sheet, đúng hướng màn hình, đúng tư thế loài (T-rex đứng hai chân), nhịp không vui thì miệng khép, cảnh va chạm còn khe hở, không có nước ở chỗ khô.
3. Báo ước tính credit (`số cảnh × số take × 5/10/100`), rồi mới chạy `--quality final` (hoặc `draft` nếu người dùng chỉ muốn thử chuyển động).
4. Giao phim kèm số liệu từ report: thời lượng, ASL, LUFS, LRA, true peak, nhảy tiếng ở điểm cắt, p50 luma, cháy đỏ, độ phân giải, điểm giám khảo và cổng trượt từng cảnh (nêu rõ cảnh nào `null`), credit đã dùng và các cảnh báo (ví dụ: nguồn 720p đã được upscale; nên tải bản upscale 1080p từ Flow cho các cảnh quan trọng). Nếu master dừng dưới -14 LUFS vì giới hạn limiter, báo rõ và để người dùng chọn: cho ép thêm (`limiterSlackDb`) hay thêm nhạc nền.
5. **`MEM-24.1`**: Lỗi diễn xuất (cười sai nhịp, thiếu hành động chính, thân tan chảy) **không sửa được bằng dựng**. Đề xuất quay lại đúng cảnh đó (`--rerender-shots`) với khung cuối mới, thay vì cố chọn cửa sổ khác.

**Tiêu chí nghiệm thu (Definition of Done)**:
- **Âm thanh**: -14 ±0.5 LUFS, true peak ≤ -1.5 dBTP.
  - **`MEM-24.1`**: Nếu đạt -14 phải ép limiter quá ~3 dB thì -15/-16 LUFS vẫn đạt; báo rõ cho người dùng. LRA 8–11. Median nhảy tiếng ở điểm cắt < 5 dB. Không dùng loudnorm động.
- **Hình**: 1920x1080 hoặc 1080x1920, 24fps CFR, số khung đúng với dự kiến, 0 khung lặp.
  - **`MEM-24.1`**: p50 luma ~75–84, cháy kênh đỏ gần 0, hướng màn hình đúng trục (dùng `hflip` khi cần).
- **Giám khảo & cửa sổ (`MEM-24.1`)**: Mỗi cảnh qua đủ 6 cổng cứng trên khung dày; cửa sổ cắt chứa `beat_peak`. Không có cười ở nhịp không vui, không có thân tan chảy hay dính nhau, không có tia nước từ hư không.
- **Nhịp dựng**: ASL ~1.5–3s với `viral-reel`. Không có zoompan, flash trắng hay tăng saturation theo hồi.
- **Coverage**: ≥35% cận mặt. Mỗi cảnh có một hành động và một thay đổi biểu cảm thấy được.
- **Phụ đề**: Chỉ cho lời thoại, một dòng ≤42 ký tự, không ID kỹ thuật.
- **Prompt**: Mọi prompt qua `lintPremiumPrompt` (`ok: true`). File `00B` chứa kết quả lint thật.
- **Folder `MEM-10`**: Đủ 3 phần cho mọi nhân vật.
- **Nội dung**: Là truyện gốc, không sao chép video hay nhân vật của người khác.
