---
name: ai-film-studio
description: >-
  Use this skill whenever the user provides a movie script, story idea, commercial concept, or asks to produce an AI film/video using the industrial 7-stage AI filmmaking pipeline on Google Flow Ultra (25,000 Credits). Automates Script Breakdown, 3-Panel Neutral Gray Character Sheet, Clean Environment Lock, Full-Res Storyboard Keyframes, Veo 3.1 First/Last Frame Video Rendering, VQQA Judge, Native Character/Scene Tab Registration, and Master MP4/SRT Export.
---

# 🎬 AI Film Studio (`ai-film-studio`) — Quy Trình Sản Xuất Phim AI 7 Giai Đoạn Chuẩn Công Nghiệp

Skill này biến Agent thành **Đạo diễn & Giám đốc Sản xuất Điện ảnh AI (AI Film Director & Executive Producer)** vận hành dây chuyền **7 Giai đoạn Chuẩn Studio Thế Giới** (kết hợp quy chuẩn của *Google DeepMind Filmmaking Partners*, *Curious Refuge*, *Kling NextGen*, *ByteDance Seedance*) ngay trên **VS Code** thông qua gói **Google AI Ultra (25.000 Credits)** của người dùng (**0đ chi phí API bên ngoài**).

---

## 📌 Khi nào kích hoạt Skill này?
Kích hoạt ngay khi người dùng:
- Gọi tên skill `ai-film-studio` hoặc yêu cầu *"làm phim"*, *"quay video theo quy trình chuẩn"*, *"chạy skill làm phim với kịch bản..."*.
- Đưa một ý tưởng, cốt truyện hoặc kịch bản phân cảnh và muốn tạo ra bộ tài sản điện ảnh hoàn chỉnh (Nhân vật 3 góc độ, Bối cảnh khóa sạch, Storyboard, Video các cảnh, Ghép cảnh trên Google Flow và xuất file `.mp4` + `.srt`).

---

## 🛡️ 6 Quy Chuẩn Vàng Bất Di Bất Dịch (Golden Rules)
Trước và trong khi chạy quy trình, Agent **BẮT BUỘC** tuân thủ 6 quy tắc sau (chi tiết xem tại [golden-rules-and-troubleshooting.md](./references/golden-rules-and-troubleshooting.md) và [MEMORY.md](../../../MEMORY.md)):
1. **3-Panel Character Sheet (`#808080`) + Khóa Trọn Bộ Folder 3 Phần Trong Tab `"Nhân vật"` Ngay Tại Giai Đoạn 2 (`MEM-10`)**:
   - Mọi nhân vật chính/phụ phải được đúc thành ảnh `16:9` chia 3 góc *(1. Cận cảnh mặt, 2. Toàn thân trước, 3. Toàn thân 3/4 sau)* trên **nền xám phẳng `#808080`, ánh sáng studio không bóng đổ (`shadowless studio lighting`)** bằng `🍌 Nano Banana Pro` (0 Credit).
   - **BẮT BUỘC NGAY TẠI GIAI ĐOẠN 2**: Phải gọi `Flow.host.createCharacter` để khóa nhân vật vào tab **"Nhân vật"** (`/project/<id>/character/<uuid>`) với **đầy đủ 3 thành phần**:
     1. **Tab `Chân dung` (Ảnh 1)**: Avatar/Cận cảnh diện mạo nhân vật.
     2. **Tab `Tạo cơ thể` -> `Cơ thể` (Ảnh 2)**: Gắn bảng thiết kế toàn thân 3 góc độ (`Full-Body Turnaround`) và các tư thế hành động/kỹ năng để khóa cấu trúc cơ thể từ đầu đến chân.
     3. **Ô `Thông tin nhân vật` (`textarea[aria-label="Tính cách của nhân vật"]` — Ảnh 3)**: Bắt buộc nạp đủ 3 mục: **(a) Chỉ số hình thể (Chiều cao, cân nặng, giải phẫu)**, **(b) Tính cách & Linh hồn cảm xúc**, và **(c) Hành động & Chiêu thức đặc trưng (`[ACTION_...]`, `[SKILL_1_...]`, `[SKILL_2_...]`)**.
2. **Clean Environment Lock (`Zero People`) + Khóa Vào Thư Viện Thực Thể (`STAGE: <Tên Bối Cảnh>`)**:
   - Ảnh tham chiếu bối cảnh bắt buộc **trống 100% không có người, không có sinh vật (`STRICTLY EMPTY ENVIRONMENT: zero people, zero creatures, no silhouettes`)** và được khóa ngay vào thư viện thực thể Flow tại Giai đoạn 2.
3. **Full-Resolution Individual Storyboard Frames + Gọi `@TênNhânVật` & Mã Chiêu Thức `[SKILL_...]`**:
   - Tại Giai đoạn 3 (Storyboard) và Giai đoạn 4 (Video), prompt bắt buộc gọi `@<TênNhânVật>` (`[CHARACTER: <Tên>]`), `@STAGE: <TênBốiCảnh>` và mã hành động/chiêu thức (`[SKILL_...]`, `[ACTION_...]`) đã lưu trong Folder Nhân vật để Google Flow tự động truy xuất cả **Chân dung + Cơ thể + Linh hồn cảm xúc + Chiêu thức** của nhân vật đó.
4. **Model Routing (`Veo 3.1` vs `Omni 1.1 Flash`)**:
   - Dùng `Omni 1.1 Flash` (0 Credit) cho bóc tách kịch bản JSON (`Flow.generate.text`), chấm điểm chất lượng VQQA và chỉnh sửa Video-to-Video (`sourceVideoMode: 'edit'`).
   - Dùng `🍌 Nano Banana Pro` (0 Credit) cho toàn bộ Character Sheet, Environment Lock, Start/End Frame Keyframes.
   - Dùng `Veo 3.1 - Lite` (50 Credits) hoặc `Veo 3.1 - Fast` (100 Credits) cho bước quay video chính thức để đảm bảo độ nhất quán nhân vật cao nhất và có âm thanh gốc đồng bộ (Native Audio/SFX).
5. **First Frame + Last Frame Control & CANVAS Memory**:
   - Cảnh nối tiếp (`CONTINUOUS_MATCH_FRAME`): Dùng khung hình cuối của cảnh trước hoặc Start Frame chuẩn làm `firstFrameImageMediaId`.
   - Cảnh chuyển trạng thái lớn (`A_TO_B_BRIDGE`): Truyền cả `firstFrameImageMediaId` + `lastFrameImageMediaId` (nếu `Veo 3.1` yêu cầu `durationSeconds: 8` cho chế độ nối 2 đầu, tự động fallback từ `4s` lên `8s` theo `MEM-07`).
   - Cảnh biến đổi ngoại hình (`isDnaStateShift`): Cập nhật mỏ neo `canvasMemoryAnchorMediaId` để vết thương/trạng thái giáp mới được giữ nguyên ở các cảnh sau (`MEM-05`).
6. **Giới hạn Kỹ thuật Ngầm của `flow-sdk`**:
   - Prompt gửi vào `Flow.generate.*` luôn cắt an toàn ở mức **`<= 3800` ký tự** (`MEM-01`).
   - Độ phân giải truyền vào `Flow.generate.video` chỉ dùng `"720p"` (cho `Veo 3.1`) hoặc `"360p"` (cho `Omni 1.1 Flash`) để tránh lỗi `Error("pl")` (`MEM-02`).
7. **Cấu trúc Kịch bản & Prompt 3 Giai Đoạn (`Khởi động/Chuẩn bị` $\rightarrow$ `Nội dung Ý chính` $\rightarrow$ `Hậu quả/Dư chấn` — `MEM-16`)**:
   - **Vĩ mô toàn bộ phim (`Macro 3-Phase`)**: Kể cả khi người dùng chỉ nhập 1 ý chính ngắn gọn, Đạo diễn AI tự động chia tổng số cảnh thành **20% Đầu (`PRE_MAIN_BUILDUP`: Khởi động / Chuẩn bị / Điềm báo trước cơn bão)** $\rightarrow$ **60% Giữa (`MAIN_CLIMAX_CONFLICT`: Nội dung Ý chính & Cao trào)** $\rightarrow$ **20% Cuối (`POST_MAIN_AFTERMATH`: Hậu quả chiến trường, thương tích, số phận kẻ bại trận & dư chấn khải hoàn)**.
   - **Vi mô từng cảnh 8 giây (`Micro 3-Beat Temporal Prompt`)**: Mọi prompt Storyboard & Video đều khóa đủ 3 nhịp vật lý: **`[0.0s-2.5s Preparation/Wind-up: preparationBeatEn]`** $\rightarrow$ **`[2.5s-5.5s Main Action/Strike: mainActionBeatEn]`** $\rightarrow$ **`[5.5s-8.0s Immediate Aftermath/Fallout: aftermathConsequenceEn]`**.
8. **Bộ Chuyển Đổi Cảm Xúc & Độ Đã Mắt Chuẩn Studio Lớn (`Story-to-Spectacle DOP Engine` — `MEM-17`)**:
   - Tự động dịch cốt truyện chữ thông thường thành 5 lớp điện ảnh của *Pixar / Ufotable / Fortiche / DeepMind*: **(1) `Show, Don't Tell` (`visualExternalizationEn`)**, **(2) Vật chuẩn Tỷ lệ Tiền cảnh & Quán tính Khối lượng (`scaleAndInertiaEn`)**, **(3) Nén Lò Xo Cảm Xúc Sakuga & Khoảnh khắc Nghịch cảnh (`emotionalTensionMode` + `Sakuga Audio Drop`)**, **(4) Phản ứng Dây chuyền Môi trường & Ống kính (`environmentalCollateralEn`)**, và **(5) Bản đồ Màu sắc Tâm lý (`colorScriptMoodEn`)**.
9. **Giáo Trình Đạo Diễn & Bàn Dựng Trường Lớp Studio Quốc Tế (`USC / AFI / CalArts / Walter Murch / DaVinci Resolve DI` — `MEM-18`)**:
   - **Ngữ pháp Phủ Góc Máy 6 Loại Cảnh (`coverageType`)**: Luân phiên `MASTER_ESTABLISHING` $\rightarrow$ `INSERT_DETAIL_CUTAWAY` $\rightarrow$ `OTS_CONFRONTATION` $\rightarrow$ `KULESHOV_REACTION` $\rightarrow$ `POV_SUBJECTIVE` $\rightarrow$ `LOW_ANGLE_HERO_APEX`.
   - **Bố cục 3 Lớp Chiều Sâu (`depthStagingEn`)**: Chia rõ Tiền cảnh mờ bokeh (`FG`) + Trung cảnh chủ thể nét căng (`MG`) + Hậu cảnh quy mô đại ngàn (`BG`).
   - **Lời Bình Điện Ảnh Đa Tầng (`STUDIO_LITERARY_SUBTEXT_NARRATION_VI`)**: Không đọc lại hình ảnh mà khắc họa quy luật sinh tồn, xung đột số phận và cái giá của ngôi vương.
   - **Bàn Dựng Đa Góc Máy & Chỉnh Màu DI Theo Hồi (`Stage 7B`)**: Tự động cắt cận cảnh va chạm (`Hard-Cut Punch-In 1.32x + Impact Flash` tại `t=2.25s`), áp LUT màu riêng cho từng Hồi (`colorbalance` + `eq`) và đóng khung màn ảnh rộng `2.39:1 CinemaScope`.
10. **Kiến Trúc 12/12 Phòng Ban Điện Ảnh Chuẩn Marvel / DC / Disney (`services/studioDepartmentsEngine.ts` — `MEM-19`)**:
    - Bổ sung 6 Phòng ban Chuyên sâu: **(1) Chỉ đạo Võ thuật & Biên đạo Đối kháng cơ học (`buildCombatChoreographyForShot`)**, **(2) Bối cảnh Phá hủy Cấp tiến 3 Giai đoạn (`resolveStageDestructionForShot` + `03B/03C`)**, **(3) Nhạc phim Giao hưởng 3 Hồi (`buildSymphonicScoreAndLfeAeval`)**, **(4) Tiếng nổ Siêu trầm 46Hz LFE Định điểm đúng giây va chạm**, **(5) Phòng ADR Biến điệu Giọng đọc theo tâm lý 3 Hồi (`buildAdrVoiceFilterForPhase`)**, và **(6) Phòng Thiết kế Poster IMAX (`00_theatrical_imax_poster.png`), Thẻ Địa danh (`LocationCard`) & Danh đề Kết phim (`EndCredits`)**.

---

## 🚀 Quy Trình Thực Thi Tự Hành 7 Giai Đoạn (Step-by-Step Runbook)

### Bước 0: Kiểm tra & Khởi động Cầu nối Google Flow Ultra (`localhost:4321` — Đa nền tảng Ubuntu Linux & Windows)
1. Kiểm tra trạng thái cầu nối bằng lệnh:
   ```bash
   curl -s http://localhost:4321/api/status
   ```
2. Nếu cầu nối chưa chạy (`ok: true`), khởi động ngầm [`flow-ultra-bridge.mjs`](../../../flow-ultra-bridge.mjs) (với `IsDaemon: true`):
   ```bash
   node flow-ultra-bridge.mjs
   ```

---

### Cách A (Khuyên dùng): Chạy Kịch Bản Tự Động Toàn Trình Bằng Script Thực Thi Của Skill
Chạy script điều phối 7 giai đoạn [run-full-movie-pipeline.ts](./scripts/run-full-movie-pipeline.ts) truyền trực tiếp kịch bản của người dùng (hoạt động giống hệt nhau trên cả **Ubuntu Linux** và **Windows**):

```bash
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --script "<Nội dung kịch bản của người dùng>" --shots 6 --model "Veo 3.1 - Lite"
```

**Các tham số tùy chọn của script:**
- `--script "<kịch bản>"`: Nội dung kịch bản hoặc ý tưởng phim (bắt buộc).
- `--shots <số_cảnh>`: Số lượng phân cảnh Storyboard cần tạo (mặc định: `6`).
- `--model "<tên_model>"`: Mô hình tạo video (`"Veo 3.1 - Lite"` tốn 50 Credits/cảnh hoặc `"Veo 3.1 - Fast"` tốn 100 Credits/cảnh; mặc định: `"Veo 3.1 - Lite"`).
- `--resume "<đường_dẫn_thư_mục>"`: Chạy tiếp ngay từ Giai đoạn 3 (Storyboard) -> Giai đoạn 7 (Xuất MP4) nếu Giai đoạn 1 & 2 đã khóa xong nhân vật và bối cảnh.
- `--frames-only`: Chỉ chạy **Giai đoạn 1 -> Giai đoạn 3** (**0 Credit** — Tạo Kịch bản DOP + 3-Panel Character Sheet + Clean Environment Lock + Toàn bộ ảnh Storyboard Start/End Frames + Đăng ký Folder 3 Phần vào tab **"Nhân vật"**) để đạo diễn duyệt ảnh trước khi tốn Credit render video!
- `--skip-host-sync`: Bỏ qua bước đồng bộ vào tab "Nhân vật" và "Cảnh" nếu người dùng chỉ muốn lấy file trên ổ cứng VS Code.

---

### Cách B: Điều Khiển Từng Giai Đoạn & Chỉnh Sửa Thủ Công Theo Ý Đạo Diễn

Khi người dùng muốn can thiệp sâu vào từng giai đoạn, thực hiện tuần tự 7 bước sau:

1. **Giai đoạn 1 (Phòng Biên Kịch Phân Cấp 4 Tầng & Bộ Biên Dịch Kỹ Thuật DOP — `MEM-20`, 0 Credit)**:
   - Khởi tạo **Hồ sơ Xương sống Kịch bản 4 Tầng (`00_writers_room_story_bible.json`)** qua [`writersRoomEngine.ts`](../../services/writersRoomEngine.ts) theo chuẩn *Google DeepMind Dramatron, Pixar "Therefore / But" Causality, Robert McKee Value Shift & LTX Studio Visual Motif Lexicon*: khóa Tiền đề tư tưởng, Hồ sơ Tâm lý Nhân vật, 3 Vật chứng Xuyên suốt, Chuỗi Domino Nhân-Quả (`THEREFORE_CONSEQUENCE` / `BUT_COMPLICATION_TWIST`), Đảo cực Giá trị (`valueChargeShift`), và 3 nhịp hành động độc bản cho từng cảnh trước khi biên dịch sang `compiledPromptBackboneEn` cho Ban Kỹ Thuật Prompt.
   - Gọi `Flow.generate.text` (`Omni 1.1 Flash`) bóc tách nhân vật, bối cảnh và danh sách phân cảnh (`shots`).
2. **Giai đoạn 2 (Đúc 3-Panel Character Sheet & Clean Environment Lock — 0 Credit)**:
   - Gọi `Flow.generate.image` (`🍌 Nano Banana Pro`) tạo ảnh 3-Panel Character Sheet trên nền xám `#808080` và ảnh Bối cảnh sạch không người.
   - Gọi `Flow.save` để lưu ảnh vào dự án Google Flow và gọi `Flow.host.createCharacter({ name, personality, assetQuery })` để tạo nhân vật trong tab **"Nhân vật"** (Ảnh 1).
3. **Giai đoạn 3 (Previs Không Gian 3D, Vẽ Storyboard Keyframes Start/End Frame & Kiểm Định `T2V-CompBench` — `MEM-21`, 0 Credit)**:
   - Khởi tạo **Hồ sơ Tiền Trực Quan Hóa Không Gian 3D (`spatialPrevisDossier`)** và chạy **Vòng lặp Kiểm định 8 Tiêu chí `T2V-CompBench` (`auditAndHealShotPromptsInLoop`)** trong [`spatialPrevisAndPromptCompiler.ts`](../../services/spatialPrevisAndPromptCompiler.ts) để tách đôi **`spatialLayoutImagePromptEn`** (chuyên dựng khung tĩnh 3D) và **`frontLoadedMotionVideoPromptEn`** (đẩy Camera MotionCtrl + Skeletal Kinematics lên 22 từ đầu tiên cho `Veo 3.1`, đạt 100/100 điểm kiểm định tại `00B_prompt_engineering_audit_report.json`).
   - Với mỗi cảnh, gọi `Flow.generate.image` (`🍌 Nano Banana Pro`) kèm `referenceImageMediaIds: [characterMediaId, envMediaId]` để vẽ Start Frame (và End Frame nếu `cameraTransitionType === 'A_TO_B_BRIDGE'`).
   - Hiển thị toàn bộ ảnh Storyboard cho người dùng xem. Nếu chạy chế độ `--frames-only`, hỏi người dùng có muốn chỉnh sửa khung hình nào trước khi bấm máy quay video không.
4. **Giai đoạn 4 (Bấm máy Quay Video — `Veo 3.1`)**:
   - Gọi `Flow.generate.video` với `firstFrameImageMediaId` (và `lastFrameImageMediaId` nếu có) cùng `referenceImageMediaIds`.
   - Tự động lưu từng file `.mp4` về thư mục `d:\myProject\test-AI\output\vscode_runs\<project_slug>\`.
5. **Giai đoạn 5 (Kiểm định Chất lượng VQQA & Quay Bổ sung — 0 Credit)**:
   - Dùng `Flow.generate.text` chấm điểm từng cảnh (Anatomy, Identity Consistency, Lighting).
   - Nếu người dùng muốn thêm hiệu ứng (mưa, tuyết, khói lửa) lên video đã quay mà giữ nguyên chuyển động gốc, gọi `Flow.generate.video` với `sourceVideoMediaId` + `sourceVideoMode: 'edit'`.
6. **Giai đoạn 6 (Ghép Cảnh vào Tab "Cảnh" / Scenebuilder trên Google Flow)**:
   - Gọi `Flow.host.createScene({ clipCount })` (`npm run create-scene`) để gom các đoạn video vừa quay vào tab **"Cảnh"** (Ảnh 2) của Google Flow.
7. **Giai đoạn 7 (Xuất Phụ đề `.SRT`, Hồ sơ `.JSON` & Ghép Video Master `.MP4`)**:
   - Xuất file phụ đề `.srt`, manifest `.json` và nối các đoạn video `.mp4` thành bản phim hoàn chỉnh trong thư mục xuất bản, sau đó báo cáo kết quả kèm đường dẫn click được cho người dùng.

