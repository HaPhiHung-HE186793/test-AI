# PROJECT CONTEXT: HYPERION STUDIO OS (GOOGLE FLOW CUSTOM TOOL)

## 1. Mục tiêu Dự án & Bối cảnh Hệ thống
- **Nền tảng chạy (Runtime Environment):** Google Flow Tools (Trình tạo công cụ Micro-App chạy trên trình duyệt với React + TypeScript, gọi trực tiếp các API tạo ảnh/video nội bộ của Google Flow)[cite: 1, 3, 11].
- **Gói tài nguyên (Subscription Tier):** Google AI Ultra (25.000 credits/tháng, số dư thực tế đang hiển thị: ~21.580 credits)[cite: 3, 10].
- **Mục tiêu sản phẩm:** Xây dựng hệ điều hành làm phim AI tự hành **Hyperion Studio OS** (nâng cấp từ kiến trúc mẫu **CineFlow Studio**[cite: 1, 2]) phục vụ 2 nhu cầu:
  1. Sản xuất phim Hành động / Viễn tưởng (Mecha, Sci-Fi, Cyberpunk) dài tập giữ đồng nhất DNA nhân vật và cơ giáp xuyên suốt nhiều tập (`action_scifi`)[cite: 3, 10, 11].
  2. Sản xuất Video Quảng cáo bán hàng (`tvc_commercial`) và Video Giải trí ngắn (`short_entertainment`)[cite: 10, 11].
- **Triết lý Giao diện (v5.0 Single-Screen Autonomous Workspace):** Gom toàn bộ quy trình về **1 Màn Hình Duy Nhất (Zero-Tab Active)**[cite: 10] theo chuẩn LTX Studio & Google Research AI Video Co-Director — người dùng chỉ cần nhập 1 câu ý tưởng tiếng Việt và bấm 1 nút để hệ thống tự chạy ngầm từ A-Z, chỉ can thiệp chỉnh sửa ngoại lệ tại từng Shot qua ngăn kéo `Inspector`[cite: 10, 11].

---

## 2. Hệ sinh thái Mô hình AI & Quy tắc Tối ưu Credit trên Google Flow
Khi kiểm tra code gọi model trong thư mục `services/`, cần đảm bảo tuân thủ đúng cơ chế của Google Flow:
1. **`Gemini Omni 1.1 Flash`** (hệ thống tự động nâng cấp mọi yêu cầu từ `Omni Flash` lên `Omni 1.1 Flash`[cite: 10, 11]):
   - Vai trò 1: Đạo diễn kịch bản (`scriptDirector` / `actionDirector`), dịch câu lệnh tiếng Việt tự nhiên sang Prompt điện ảnh tiếng Anh, tách Shot và quyết định chế độ chuyển cảnh[cite: 1, 2, 10, 11].
   - Vai trò 2: Giám khảo chấm điểm chất lượng tự động (`MLLM Judge / VQQA`) chấm điểm độ đồng nhất DNA (hiển thị % trên từng thẻ Shot như `94%`, `91%`)[cite: 10, 11].
   - Vai trò 3: Tạo video nháp siêu tốc (4s, 6s, 8s, 10s) và chỉnh sửa video bằng hội thoại (Video-to-Video Edit).
2. **`Nano Banana Pro`**:
   - Đúc bảng thiết kế nhân vật 4 góc nhìn (`front`, `side_profile`, `three_quarter`, `back`)[cite: 1, 3], đúc đa trạng thái (Multi-State DNA)[cite: 3] và dựng bối cảnh trường quay tĩnh[cite: 2, 3].
   - **Bước Đệm Vàng (Master Keyframe Synthesis):** Hợp nhất các thẻ ảnh tham chiếu rời rạc (`[IMAGE 1: Nhân vật]` + `[IMAGE 2: Vũ khí/Chiêu thức]` + `[IMAGE 3: Bối cảnh]`) thành 1 bức ảnh `Master Start Keyframe` (và `End Keyframe` nếu dùng chế độ kẹp đầu-đuôi `A_TO_B_BRIDGE`) trước khi gửi sang mô hình tạo video[cite: 6, 7].
3. **`Veo 3.1 Fast` / `Veo 3.1 Lite`**:
   - Dùng để quay nháp kiểm tra chuyển động vật lý (tốn ~10 credits/shot với Veo 3.1 Fast trên gói Ultra, độ phân giải 720p)[cite: 5] hoặc kéo dài cảnh (+8s Extend).
4. **`Veo 3.1 Quality`**:
   - Chỉ gọi khi người dùng bấm nâng cấp cảnh quan trọng lên **4K Master** trong `ShotInspectorDrawer` (~100 credits/shot, có âm thanh vật lý gốc Native Audio)[cite: 5, 8, 10, 11].

---

## 3. Cấu trúc Mã nguồn Thực tế trong Dự án

### 3.1. Kiến trúc tham chiếu ban đầu (`CineFlow Studio` - Đã chạy ổn định[cite: 1, 2])
Danh sách file trong `CineFlow Studio` dùng để đối chiếu hàm gọi API nội bộ của Google Flow:
- `types.ts`: Định nghĩa `CharacterRole`, `TurnaroundAngle`, `CharacterAngleView`, `CharacterActionPose`, `CharacterSkill` (lưu ảnh qua `mediaId?: string`, `base64?: string`, `mimeType?: string`)[cite: 1].
- `services/ffmpegService...`, `services/scriptDirector.ts`, `services/frameExtractor...`, `services/entityGenerator...`, `services/asyncWorkerP...`, `services/characterVault...`, `services/movieAutoCo...`[cite: 1].
- `components/`: `StageNav.tsx`, `ScriptAnalyzer.tsx`, `Character...`, `Environment...`, `Storyboard...`, `MovieAssembler.tsx`, `AutoBatch...` và `App.tsx`[cite: 1].

### 3.2. Kiến trúc hiện tại cần kiểm tra (`Hyperion Studio OS` - 16 Files)
Danh sách 16 tệp hiện có trong workspace[cite: 11]:
1. `types/cinemaCore.ts`[cite: 11]
2. `services/creditTelemetr...` (`creditTelemetry.ts`)[cite: 11]
3. `services/actionDirector...` (`actionDirectorEngine.ts`)[cite: 11]
4. `services/productionPipe...` (`productionPipeline.ts`)[cite: 11]
5. `services/timelineComp...` (`timelineComposer.ts`)[cite: 11]
6. `services/promptCinema...` (`promptCinematic.ts`)[cite: 11]
7. `services/autoBindIngre...` (`autoBindIngredients.ts`)[cite: 11]
8. `constants/starterTempl...` (`starterTemplates.ts`)[cite: 11]
9. `components/TopStudio...`[cite: 11]
10. `components/WorldBibl...` (`WorldBibleVault.tsx`)[cite: 11]
11. `components/DirectorSt...`[cite: 11]
12. `components/MasterTim...`[cite: 11]
13. `components/DirectorM...` (`DirectorMatrix.tsx`)[cite: 11]
14. `components/Productio...` (`ProductionDeck.tsx`)[cite: 11]
15. `components/Mastering...` (`MasteringStudio.tsx`)[cite: 11]
16. `App.tsx`[cite: 11]

### 3.3. Nội dung đầu file `types/cinemaCore.ts` hiện tại[cite: 11]:
```typescript
export type ProductionGenre = 'action_scifi' | 'tvc_commercial' | 'short_entertainment';

export type PipelineRunningMode = 'draft_ultrafast' | 'master_cinematic';

export type ProductionStep =
  | 'idle'
  | 'extracting_script'
  | 'forging_dna'
  | 'compositing_keyframes'
  | 'rendering_video_takes'
  | 'judging_quality'
  | 'assembling_master'
  | 'completed';

export type UserExperienceMode = 'easy_autopilot' | 'director_pro';

export type EntityCategory = 'hero' | 'mecha_robot' | 'kaiju_monster' | 'weapon_artifact' | 'vehicle';

export type EntityConditionState = 'pristine_normal' | 'combat_mode' | 'battle_damaged' | 'awakened_overdrive';

export type CameraTransitionType = 'HARD_CUT_NEW_ANGLE' | 'CONTINUOUS_MATCH_FRAME' | 'A_TO_B_BRIDGE';

export type ActionPacingStyle = 'slow_suspense' | 'martial_arts_fast' | 'epic_mecha_scale';

export type LensPreset = ...
```

---

## 4. Các Tính năng Cốt lõi Đã Thiết kế Trong UI & Logic
1. **3 Chế độ Chuyển cảnh Thông minh (`CameraTransitionType`)[cite: 4, 11]:**
   - `HARD_CUT_NEW_ANGLE`: Đổi góc máy mới hoàn toàn từ DNA gốc + Bối cảnh (tránh lỗi mờ ảnh khi lấy frame cuối liên tiếp)[cite: 4].
   - `CONTINUOUS_MATCH_FRAME`: Tự động trích xuất Frame cuối của Shot `N-1` làm `Start Frame` cho Shot `N` ở các pha hành động liên hoàn[cite: 4].
   - `A_TO_B_BRIDGE`: Kẹp cả `Start Keyframe` (Ảnh A) và `End Keyframe` (Ảnh B) cho cảnh biến hình/bay lượn[cite: 4, 7].
2. **Bộ Nhớ Thị Giác Liên Tục (`CANVAS Memory` & `DNA SHIFT`)[cite: 10]:**
   - Tự động phát hiện thay đổi trạng thái vật lý trong kịch bản (ví dụ: Shot #2 cơ giáp trúng tên lửa EMP bị xé giáp ngực -> tự gắn cờ `DNA SHIFT` và chuyển trạng thái từ `combat_mode` sang `battle_damaged` cho các cảnh tiếp theo)[cite: 3, 4, 10, 11].
3. **Phòng Biên tập & Âm thanh 3 Kênh (`Master Cut`)[cite: 8, 9, 10]:**
   - Tự động khử khựng điểm nối (`Adaptive Micro-Trimming`: cắt ~0.05s - 0.1s ở đầu/cuối mỗi shot)[cite: 2, 8, 9, 10].
   - Bàn trộn âm thanh 3 kênh chuẩn AAC 48kHz Stereo: Kênh 1 (Foley & SFX gốc từ Veo 3.1), Kênh 2 (Voiceover có Auto-Ducking tự hạ 40% BGM khi có thoại), Kênh 3 (Cinematic BGM tự động Fade-in 1.5s / Fade-out 2.0s)[cite: 8, 9].
   - Xuất file qua `Flow.download()` và xuất gói `EpisodeContinuityPack` sang tập tiếp theo[cite: 8, 9].

---

## 5. VẤN ĐỀ HIỆN TẠI & NHIỆM VỤ CHO ANTIGRAVITY (CODE AUDIT CHECKLIST)

### Triệu chứng trên giao diện (Hình ảnh thực tế):
- Trên màn hình `Single-Screen Workspace`, khi bấm nút chạy tự động, nút chuyển sang trạng thái `🔄 HỆ THỐNG ĐANG TỰ HÀNH...`, thanh trạng thái báo `PIPELINE: EXTRACTING SCRIPT` (`CANVAS Memory: Đang phân tích ngữ cảnh hành động & quyết định chế độ chuyển cảnh...`)[cite: 10].
- Tuy nhiên, bên dưới phần `INTERACTIVE STORYBOARD & TIMELINE STRIP`, các ô `SHOT #1` và `SHOT #2` vẫn dừng ở hộp đen ghi chữ `"Chờ chạy tự động"`, màn hình giữa ghi `"CHƯA CÓ VIDEO HOÀN CHỈNH ĐỂ PHÁT"` và dữ liệu trên màn hình vẫn hiển thị mẫu mặc định (`ARES-09 EXODUS`)[cite: 10].

### Yêu cầu Antigravity kiểm tra và sửa trực tiếp trong Code:
1. **Kiểm tra `App.tsx` và `services/productionPipeline.ts`[cite: 11]:**
   - Tìm hàm xử lý sự kiện khi bấm nút `"SẢN XUẤT TỰ ĐỘNG TOÀN BỘ PHIM"` / `"HỆ THỐNG ĐANG TỰ HÀNH..."`[cite: 10].
   - Kiểm tra xem chuỗi state `ProductionStep` (`'extracting_script'` -> `'forging_dna'` -> `'compositing_keyframes'` -> `'rendering_video_takes'` -> `'judging_quality'` -> `'assembling_master'` -> `'completed'`)[cite: 11] có đang bị viết giả lập bằng `setTimeout` hoặc bị kẹt không chuyển tiếp sang bước tiếp theo hay không.
2. **Đấu nối API thật của Google Flow (Đối chiếu với code của `CineFlow Studio` nếu có):**
   - Kiểm tra `services/actionDirectorEngine.ts`, `services/productionPipeline.ts`: Đảm bảo các hàm gọi `Omni 1.1 Flash`, `Nano Banana Pro` và `Veo 3.1` sử dụng đúng SDK/API nội bộ của môi trường Google Flow (lấy `mediaId`, `base64` hoặc `videoUrl` thật)[cite: 1, 11], xóa bỏ toàn bộ dữ liệu cứng (hardcoded mock data của `ARES-09 EXODUS`) khi người dùng nhập kịch bản mới[cite: 3, 10].
3. **Kiểm tra `services/autoBindIngredients.ts`[cite: 11]:**
   - Đảm bảo sau khi bước `'forging_dna'` tạo xong ảnh nhân vật và bối cảnh, ảnh phải được gán tự động vào mảng `referenceImages` (`[IMAGE 1]`, `[IMAGE 2]`, `[IMAGE 3]`) của từng Shot trước khi bước `'compositing_keyframes'` và `'rendering_video_takes'` chạy[cite: 6, 11].
4. **Cơ chế xử lý lỗi (Error Handling & Fallback):**
   - Thêm `try / catch` rõ ràng ở từng bước trong `productionPipeline.ts`[cite: 11] và hiển thị thông báo lỗi cụ thể lên UI nếu một API call bị timeout hoặc sai tham số, không để UI treo vô hạn ở trạng thái `"HỆ THỐNG ĐANG TỰ HÀNH..."`[cite: 10].


---

# 8. HỆ THỐNG TRI THỨC 3 TRỤ CỘT (`AGENT.MD` + `CONTEXT.MD` + `MEMORY.MD`) & 6 QUY CHUẨN VÀNG GOOGLE FLOW CINEMA

Hệ thống tri thức của dự án được tổ chức theo mô hình 3 Trụ cột Chuẩn Siêu Trợ Lý AI:
1. **[AGENT.md](file:///d:/myProject/test-AI/AGENT.md) (`= Sổ tay nhân viên`)**: Định nghĩa văn hóa làm việc, giọng văn chuyên nghiệp và Quy trình chuẩn 6 bước (SOP) khi đạo diễn phim AI.
2. **[context.md](file:///d:/myProject/test-AI/context.md) (`= Kho tài liệu chuyên sâu & Hồ sơ dự án`)**: Lưu trữ kiến trúc kỹ thuật nặng đô, thông số `flow-sdk`, kinh tế học Credit và hồ sơ các dự án phim.
3. **[MEMORY.md](file:///d:/myProject/test-AI/MEMORY.md) (`= Trí nhớ thực chiến của AI`)**: Ghi nhớ tới từng chân tơ kẽ tóc các quy tắc bất di bất dịch, bài học xương máu và nhật ký khắc phục lỗi (`MEM-01` -> `MEM-05`).

## 8.1. Sáu Quy Chuẩn Vàng Tạo Video Điện Ảnh Nhất Quán Trên Google Flow (Step-by-Step)

| Quy Chuẩn | Kỹ Thuật Cốt Lõi Trên Google Flow | Lý Do Kỹ Thuật & Điện Ảnh |
| :--- | :--- | :--- |
| **1. Bảng Tham Chiếu Nhân Vật 3 Góc Độ (`3-Panel Character Sheet`)** | Tạo 1 khung hình `16:9` chứa **3 panels**: `(1) Cận cảnh khuôn mặt`, `(2) Toàn thân phía trước`, `(3) Toàn thân góc 3/4 phía sau` trên **nền xám phẳng (`#808080`), không có bóng đổ**. | Giúp AI nắm trọn cấu trúc 3D của nhân vật từ mọi góc quay; nền xám phẳng không đổ bóng ngăn AI sao chép ánh sáng sai lệch vào các cảnh sau (`[01:54 - 02:45]`). |
| **2. Khóa Môi Trường "Sạch" (`Clean Environment Lock`)** | Dùng `🍌 Nano Banana Pro` tạo ảnh tham chiếu bối cảnh `16:9` **hoàn toàn trống (tuyệt đối không có người / nhân vật)**. | Tránh xung đột dữ liệu giữa ảnh nhân vật và người trong bối cảnh (ngăn lỗi nhầm lẫn danh tính) và giữ không gian cố định xuyên suốt bộ phim (`[03:06 - 03:42]`). |
| **3. Storyboard 6 Khung Hình Độ Phân Giải Đầy Đủ & Gắn Nhãn (`Character Tagging`)** | Tạo từng khung hình Storyboard riêng lẻ (tối thiểu 6 khung) ở độ phân giải tối đa (không gộp chung vào 1 ảnh lưới) và **gắn nhãn tên nhân vật** (`[CHARACTER: <Tên>]`). | Đảm bảo mỗi khung hình đủ độ nét để làm `Start Frame` (`firstFrameImageMediaId`) và kéo chính xác khuôn mặt từ Character Sheet vào bối cảnh (`[03:43 - 04:56]`). |
| **4. Ưu Tiên Mô Hình `Veo 3.1` Cho Độ Nhất Quán Cao Nhất** | Chọn **`Veo 3.1` (`Veo 3.1 - Fast` / `Lite` / `Quality`)** làm mô hình chủ lực cho các dự án cần sự ổn định cao; dùng `Omni 1.1 Flash` khi cần linh hoạt thời lượng hoặc sửa V2V. | Thực nghiệm đối chiếu cho thấy **Veo 3.1 giữ nhân vật và bối cảnh ổn định hơn hẳn, ít lỗi hiển thị (glitches) hơn Omni Flash** (`[05:09 - 08:16]`). |
| **5. Kiểm Soát Điểm Đầu & Điểm Cuối (`First Frame + Last Frame`)** | Truyền đồng thời cả **`firstFrameImageMediaId` (Khung đầu)** và **`lastFrameImageMediaId` (Khung cuối)** cho các cảnh chuyển động phức tạp (`A_TO_B_BRIDGE`). | AI tự động nội suy chuyển động trung gian mượt mà kết nối chính xác 2 trạng thái mà không cần cắt ghép hậu kỳ thủ công (`[08:17 - 10:05]`). |
| **6. Chỉnh Sửa Video Hiện Có (`Video-to-Video VFX Edit`)** | Tải lên video tự quay hoặc chọn video có sẵn (`Flow.media.select({ filter: 'video' })`) và gọi `Flow.generate.video` với `sourceVideoMediaId` + `sourceVideoMode: 'edit'`. | Thêm hiệu ứng thời tiết/VFX (như tuyết rơi, mưa bão, ánh sáng) trong khi vẫn bảo toàn nguyên vẹn thành phần và chuyển động gốc của video (`[10:06 - 11:15]`). |
