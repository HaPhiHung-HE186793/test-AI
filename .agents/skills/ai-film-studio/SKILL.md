---
name: ai-film-studio
description: >-
  Use this skill whenever the user provides a movie script, story idea, commercial concept, or asks to produce an AI film/video using the industrial 7-stage AI filmmaking pipeline on Google Flow Ultra (25,000 Credits). Default is the MEM-24 Premium Animation path (Pixar-like stylized 3D by default): character-driven Story Room, character bible sheets with expressions, concise natural-language Veo prompts, multiple takes with a strict fail-closed judge, and an offline 1080p -14 LUFS master with dialogue-only subtitles. Also covers Clean Environment Lock, Full-Res Storyboard Keyframes, Native Character/Scene Tab Registration (MEM-10), remastering old runs, and the legacy path via --preset dino-legacy.
---

# 🎬 AI Film Studio (`ai-film-studio`) — Quy Trình Sản Xuất Phim AI 7 Giai Đoạn Chuẩn Công Nghiệp

Skill này biến Agent thành **Đạo diễn & Giám đốc Sản xuất Điện ảnh AI (AI Film Director & Executive Producer)** vận hành dây chuyền **7 Giai đoạn Chuẩn Studio Thế Giới** (kết hợp quy chuẩn của *Google DeepMind Filmmaking Partners*, *Curious Refuge*, *Kling NextGen*, *ByteDance Seedance*) ngay trên **VS Code** thông qua gói **Google AI Ultra (25.000 Credits)** của người dùng (**0đ chi phí API bên ngoài**).

---

## 📌 Khi nào kích hoạt Skill này?
Kích hoạt ngay khi người dùng:
- Gọi tên skill `ai-film-studio` hoặc yêu cầu *"làm phim"*, *"quay video theo quy trình chuẩn"*, *"chạy skill làm phim với kịch bản..."*.
- Đưa một ý tưởng, cốt truyện hoặc kịch bản phân cảnh và muốn tạo ra bộ tài sản điện ảnh hoàn chỉnh (Nhân vật 3 góc độ, Bối cảnh khóa sạch, Storyboard, Video các cảnh, Ghép cảnh trên Google Flow và xuất file `.mp4` + `.srt`).
- Muốn làm lại hậu kỳ, hoặc "nâng cấp" một phim đã có trong `output/vscode_runs/<run>` mà không tốn credit (dùng `npm run remaster`).

---

## ⭐ Chuẩn mặc định: Premium Animation (`MEM-24`, từ 2026-10-29)
Đọc [MEMORY.md](../../../MEMORY.md) mục 4 trước khi chạy. Khi các quy tắc cũ bên dưới mâu thuẫn với `MEM-24`, **`MEM-24` thắng**. Quy tắc cũ chỉ áp dụng khi chạy `--preset dino-legacy`.

Lý do: phim cũ `dino_clash_closed_loop_v1` trông như "AI rẻ tiền" vì chính pipeline gây ra. Template khủng long cứng đè kịch bản, prompt ~230–415 từ toàn nhãn và số đo, hiệu ứng chồng chất mọi cảnh, sinh vật photoreal không có diễn xuất, 1 take Lite 720p, giám khảo mặc định 95, hậu kỳ zoompan/flash giả, TTS bị cắt giữa câu, -24.1 LUFS. Các reel tham chiếu (POMMI, reel character-sheet của Shayan Sadiq) làm ngược lại ở mọi điểm.

**10 điều phải làm ở đường Premium:**
1. **Phong cách trước tiên**: `--style pixar3d` (mặc định), `graphic2d`, hoặc `photoreal` chỉ theo kiểu phim tài liệu thiên nhiên.
2. **Kịch bản** do Story Room viết, xoay quanh mong muốn của nhân vật theo 6 nhịp nhân-quả. Giữ nhân vật và thế giới của người dùng; không ép khủng long; không người dẫn chuyện.
3. **Hồ sơ nhân vật** gồm turnaround 4 góc, expression/pose sheet (6 biểu cảm + 4 tư thế) và portrait. Nền `#808080`, không chữ. Vẫn khóa Folder `MEM-10`.
4. **Prompt ngắn bằng văn xuôi** theo hướng dẫn Veo của Google: keyframe 60–120 từ, motion 40–90 từ và chỉ tả chuyển động. Không số đo, `@ID`, `[...]`, từ phủ định hay ngoặc kép quanh thoại. Mọi prompt qua `lintPremiumPrompt`.
5. **Ngân sách hiệu ứng**: mỗi cảnh ≤1 hiệu ứng; mức mạnh chỉ cho 1–2 cảnh cao trào.
6. **Coverage**: ≥35% cận mặt, ≤25% toàn cảnh, không lặp cỡ cảnh liền nhau, mỗi cảnh một hành động và một thay đổi biểu cảm.
7. **Thoại** ≤8 từ, viết `<Name> says: <line>` (dấu hai chấm, không ngoặc kép), dùng âm thanh gốc Veo. Mặc định tiếng Anh, phụ đề tiếng Việt.
8. **Nhiều take**, giám khảo nghiêm và fail-closed (`null`, không bao giờ 95 mặc định), giữ take tốt nhất.
9. **Dựng ngắn**: cửa sổ 1.2–3.2s (thoại ≤5s).
10. **Master**: -14 LUFS, 1080p, 24fps, encode một lần, phụ đề chỉ cho lời thoại. Không zoompan, không flash, không tăng saturation, không nhạc sine.

**Cập nhật `MEM-24.1` (2026-10-30, bài học render thật `dino_premium_v2`, [MEMORY.md](../../../MEMORY.md) mục 4.8). Khi mâu thuẫn với 10 điều trên, các điều dưới đây thắng:**
11. **Khung cuối cho mọi cảnh (L1)**: Nano Banana Pro **sửa khung đầu** bằng `buildEndFrameEditPrompt` ("Edit image 1. Keep the background ... Change only the poses and expressions: `<endStateEn>` ..."). Ảnh tham chiếu = [khung đầu, sheet từng nhân vật trong cảnh], tối đa 3. Giữ nguyên cỡ cảnh và bố cục. Veo nhận khung đầu + khung cuối. Lý do: chỉ có khung đầu thì Veo Quality kéo nhân vật hoạt hình về loài có thật trong 8s; vẽ lại toàn cảnh thì nền trôi; thiếu sheet thì nhân vật đổi màu.
12. **Cắt trên hành động (L4)**: Không để hai nhân vật chạm nhau trong một cảnh, không có cảnh lộ thân, không đi về phía máy. Cảnh hành động dừng **một bước trước va chạm**; cú va chạm rơi vào điểm cắt và được bán bằng âm thanh.
13. **Biểu cảm khẳng định (L5) và hiệu ứng có nguồn (L6)**: Nhịp không vui: "mouth firmly closed, lips covering the teeth, serious `<emotion>` expression"; choáng: "jaw slack, eyes unfocused". Nước chỉ xuất hiện ở chỗ thân chạm nước có sẵn ("a few droplets"). Hướng màn hình: `char1` nhìn sang phải, `char2` nhìn sang trái (ghi đè bằng `shot.facing`). Tư thế theo loài (T-rex đứng hai chân).
14. **Giám khảo khung dày + cổng cứng (L7)**: khung đầu + ≥10 khung đều + khung cuối (`denseJudgeFrameTimes`). Có 6 cổng cứng; trượt một cổng thì fail và ≤55 điểm. Giám khảo trả `beat_in/peak/out`.
15. **Cửa sổ theo nhịp diễn (L8)**: Cửa sổ cắt phải chứa `beat_peak`. Loại cửa sổ có khung giữa bị hiệu ứng phủ >40%. Override bằng tay: `forceWindow`, `hflip` (L11).
16. **Âm thanh (L9) và hình (L10)**: bản đồ gain kịch tính → crossfade 5 khung → ambience/nhạc tùy chọn → **một** gain tĩnh + limiter. Ép quá ~3 dB thì chấp nhận -15/-16 LUFS. **Không loudnorm động.** Hình dùng tone curve toe/shoulder, chuẩn hóa phơi sáng từng cảnh (p50 ~75–84) và chặn cháy đỏ.

> **Trạng thái nối dây (kiểm tra lại 2026-10-30, sau review r3)**: Điều 11–16 **đã nối** vào CLI `run-full-movie-pipeline.ts`: khung cuối L1 ở Stage 3, Veo nhận khung đầu + khung cuối ở Stage 4, giám khảo 12 khung dày + cổng cứng + `beat_in/peak/out` ở Stage 5 (prompt gọn ≤ 3.300 ký tự, nói "translucent" — Flow từ chối prompt có ảnh dài ~4.000+ ký tự và từ "see-through"; lỗi thì thử bản 8 khung, vẫn lỗi thì cảnh báo ⛔; `--resume` chấm lại bản chưa có phán quyết, 0 credit video), `beatWindow` / `forceWindow` / `hflip` / ambience ở Stage 7 (`--ambience <file>`, `--ambience-from-flow` = 1 clip Veo Lite 5 credit, `--rerender-ambience` để quay lại clip nền hỏng). Dùng pipeline trước (kể cả `--resume <run thử nghiệm>` → `pipeline_master/`); `npm run remaster` (Cách C) đọc cùng nhịp diễn đã lưu, `--overrides` chỉ để sửa tay.

**Model & credit** (mỗi lần tạo video): `Veo 3.1 - Lite` 5, `Veo 3.1 - Fast` 10, `Veo 3.1 - Quality` 100; ảnh và text = 0.
- `--quality final` (mặc định) = Quality, 2 take/cảnh: 12 cảnh ≈ 2.400 credit.
- `--quality draft` = Lite, 1 take: 12 cảnh ≈ 60 credit.
- `Veo 3.1 - Quality` không hỗ trợ Ingredients, nên chỉ dùng keyframe đầu (`MEM-13` (5)).

**File của đường Premium:**
- [`premiumPromptEngine.ts`](../../../services/premiumPromptEngine.ts): Story Room, hồ sơ nhân vật, prompt, lint, giám khảo. Có thêm `buildEndFrameEditPrompt`, `denseJudgeFrameTimes` và `PREMIUM_JUDGE_HARD_GATES` (`MEM-24.1`).
- [`premiumShotProduction.ts`](../../../services/premiumShotProduction.ts): ảnh tham chiếu, cổng duyệt keyframe, request video (`firstFrameMediaId` + `lastFrameMediaId`), kế hoạch take.
- [`premiumMasteringEngine.ts`](../../../services/premiumMasteringEngine.ts): Stage 7 offline bằng ffmpeg (bản `premium-master-r3`: `beatWindow`, `forceWindow`, `hflip`, `fxSpans`, `ambiencePath`, gain map, tone curve).
- [`remaster-run.ts`](../../../scripts/remaster-run.ts): `npm run remaster` (có `--overrides`, `--ambience`, `--take-tag`, `--keep-work`, `--ignore-stored-beats`; tự đọc `beatWindow` / `forceWindow` / `hflip` của manifest hoặc nhịp diễn trong `state.json`).

---

## 🛡️ 6 Quy Chuẩn Vàng Bất Di Bất Dịch (Golden Rules)
Trước và trong khi chạy quy trình, Agent **BẮT BUỘC** tuân thủ 6 quy tắc sau (chi tiết xem tại [golden-rules-and-troubleshooting.md](./references/golden-rules-and-troubleshooting.md) và [MEMORY.md](../../../MEMORY.md)).

> **Đọc cùng mục ⭐ ở trên**: Quy tắc 1, 2 và 5 vẫn hiệu lực, với cách viết prompt theo `MEM-24`. Quy tắc 3 (gọi `@ID` / `[SKILL_...]` trong prompt) và các quy tắc 7–10 (prompt 3 nhịp có mốc giây, `Story-to-Spectacle`, punch-in/flash/LUT theo hồi, 12 phòng ban với nhạc sine/LFE/ADR) **chỉ dùng với `--preset dino-legacy`**. Ở đường Premium, chúng được thay bằng các điều trong mục ⭐. Nội dung của `references/golden-rules-and-troubleshooting.md` cũng xếp sau `MEM-24`.
1. **3-Panel Character Sheet (`#808080`) + Khóa Trọn Bộ Folder 3 Phần Trong Tab `"Nhân vật"` Ngay Tại Giai Đoạn 2 (`MEM-10`)**:
   - Mọi nhân vật chính/phụ phải được đúc thành ảnh `16:9` chia 3 góc *(1. Cận cảnh mặt, 2. Toàn thân trước, 3. Toàn thân 3/4 sau)* trên **nền xám phẳng `#808080`, ánh sáng studio không bóng đổ (`shadowless studio lighting`)** bằng `🍌 Nano Banana Pro` (0 Credit).
   - **BẮT BUỘC NGAY TẠI GIAI ĐOẠN 2**: Phải gọi `Flow.host.createCharacter` để khóa nhân vật vào tab **"Nhân vật"** (`/project/<id>/character/<uuid>`) với **đầy đủ 3 thành phần**:
     1. **Tab `Chân dung` (Ảnh 1)**: Avatar/Cận cảnh diện mạo nhân vật.
     2. **Tab `Tạo cơ thể` -> `Cơ thể` (Ảnh 2)**: Gắn bảng thiết kế toàn thân 3 góc độ (`Full-Body Turnaround`) và các tư thế hành động/kỹ năng để khóa cấu trúc cơ thể từ đầu đến chân.
     3. **Ô `Thông tin nhân vật` (`textarea[aria-label="Tính cách của nhân vật"]` — Ảnh 3)**: Bắt buộc nạp đủ 3 mục: **(a) Chỉ số hình thể (Chiều cao, cân nặng, giải phẫu)**, **(b) Tính cách & Linh hồn cảm xúc**, và **(c) Hành động & Chiêu thức đặc trưng (`[ACTION_...]`, `[SKILL_1_...]`, `[SKILL_2_...]`)**.
2. **Clean Environment Lock (`Zero People`) + Khóa Vào Thư Viện Thực Thể (`STAGE: <Tên Bối Cảnh>`)**:
   - Ảnh tham chiếu bối cảnh bắt buộc **trống 100% không có người, không có sinh vật (`STRICTLY EMPTY ENVIRONMENT: zero people, zero creatures, no silhouettes`)** và được khóa ngay vào thư viện thực thể Flow tại Giai đoạn 2.
3. **[LEGACY — đường Premium gọi nhân vật bằng tên hiển thị + `(image N)`, xem mục ⭐] Full-Resolution Individual Storyboard Frames + Gọi `@TênNhânVật` & Mã Chiêu Thức `[SKILL_...]`**:
   - Tại Giai đoạn 3 (Storyboard) và Giai đoạn 4 (Video), prompt bắt buộc gọi `@<TênNhânVật>` (`[CHARACTER: <Tên>]`), `@STAGE: <TênBốiCảnh>` và mã hành động/chiêu thức (`[SKILL_...]`, `[ACTION_...]`) đã lưu trong Folder Nhân vật để Google Flow tự động truy xuất cả **Chân dung + Cơ thể + Linh hồn cảm xúc + Chiêu thức** của nhân vật đó.
4. **Model Routing (`Veo 3.1` vs `Omni 1.1 Flash`)**:
   - Dùng `Omni 1.1 Flash` (0 Credit) cho bóc tách kịch bản JSON (`Flow.generate.text`), chấm điểm chất lượng VQQA và chỉnh sửa Video-to-Video (`sourceVideoMode: 'edit'`).
   - Dùng `🍌 Nano Banana Pro` (0 Credit) cho toàn bộ Character Sheet, Environment Lock, Start/End Frame Keyframes.
   - Dùng `Veo 3.1 - Lite` (5 Credits), `Veo 3.1 - Fast` (10 Credits) hoặc `Veo 3.1 - Quality` (100 Credits, mặc định của `--quality final`) cho bước quay video chính thức để đảm bảo độ nhất quán nhân vật cao nhất và có âm thanh gốc đồng bộ (Native Audio/SFX).
5. **First Frame + Last Frame Control & CANVAS Memory**:
   - Cảnh nối tiếp (`CONTINUOUS_MATCH_FRAME`): Dùng khung hình cuối của cảnh trước hoặc Start Frame chuẩn làm `firstFrameImageMediaId`.
   - Cảnh chuyển trạng thái lớn (`A_TO_B_BRIDGE`): Truyền cả `firstFrameImageMediaId` + `lastFrameImageMediaId` (nếu `Veo 3.1` yêu cầu `durationSeconds: 8` cho chế độ nối 2 đầu, tự động fallback từ `4s` lên `8s` theo `MEM-07`).
   - Cảnh biến đổi ngoại hình (`isDnaStateShift`): Cập nhật mỏ neo `canvasMemoryAnchorMediaId` để vết thương/trạng thái giáp mới được giữ nguyên ở các cảnh sau (`MEM-05`).
6. **Giới hạn Kỹ thuật Ngầm của `flow-sdk`**:
   - Prompt gửi vào `Flow.generate.*` luôn cắt an toàn ở mức **`<= 3800` ký tự** (`MEM-01`).
   - Độ phân giải truyền vào `Flow.generate.video` chỉ dùng `"720p"` (cho `Veo 3.1`) hoặc `"360p"` (cho `Omni 1.1 Flash`) để tránh lỗi `Error("pl")` (`MEM-02`).
7. **[LEGACY — chỉ `--preset dino-legacy`; Premium dùng 6 nhịp và 1 hành động mỗi cảnh, không mốc giây] Cấu trúc Kịch bản & Prompt 3 Giai Đoạn (`Khởi động/Chuẩn bị` $\rightarrow$ `Nội dung Ý chính` $\rightarrow$ `Hậu quả/Dư chấn` — `MEM-16`)**:
   - **Vĩ mô toàn bộ phim (`Macro 3-Phase`)**: Kể cả khi người dùng chỉ nhập 1 ý chính ngắn gọn, Đạo diễn AI tự động chia tổng số cảnh thành **20% Đầu (`PRE_MAIN_BUILDUP`: Khởi động / Chuẩn bị / Điềm báo trước cơn bão)** $\rightarrow$ **60% Giữa (`MAIN_CLIMAX_CONFLICT`: Nội dung Ý chính & Cao trào)** $\rightarrow$ **20% Cuối (`POST_MAIN_AFTERMATH`: Hậu quả chiến trường, thương tích, số phận kẻ bại trận & dư chấn khải hoàn)**.
   - **Vi mô từng cảnh 8 giây (`Micro 3-Beat Temporal Prompt`)**: Mọi prompt Storyboard & Video đều khóa đủ 3 nhịp vật lý: **`[0.0s-2.5s Preparation/Wind-up: preparationBeatEn]`** $\rightarrow$ **`[2.5s-5.5s Main Action/Strike: mainActionBeatEn]`** $\rightarrow$ **`[5.5s-8.0s Immediate Aftermath/Fallout: aftermathConsequenceEn]`**.
8. **[LEGACY — chỉ `--preset dino-legacy`; Premium dùng ngân sách hiệu ứng `fxLevel`] Bộ Chuyển Đổi Cảm Xúc & Độ Đã Mắt Chuẩn Studio Lớn (`Story-to-Spectacle DOP Engine` — `MEM-17`)**:
   - Tự động dịch cốt truyện chữ thông thường thành 5 lớp điện ảnh của *Pixar / Ufotable / Fortiche / DeepMind*: **(1) `Show, Don't Tell` (`visualExternalizationEn`)**, **(2) Vật chuẩn Tỷ lệ Tiền cảnh & Quán tính Khối lượng (`scaleAndInertiaEn`)**, **(3) Nén Lò Xo Cảm Xúc Sakuga & Khoảnh khắc Nghịch cảnh (`emotionalTensionMode` + `Sakuga Audio Drop`)**, **(4) Phản ứng Dây chuyền Môi trường & Ống kính (`environmentalCollateralEn`)**, và **(5) Bản đồ Màu sắc Tâm lý (`colorScriptMoodEn`)**.
9. **[LEGACY — chỉ `--preset dino-legacy`; Premium dùng `planCoverage` + `masterFilm`, không punch-in/flash/LUT theo hồi] Giáo Trình Đạo Diễn & Bàn Dựng Trường Lớp Studio Quốc Tế (`USC / AFI / CalArts / Walter Murch / DaVinci Resolve DI` — `MEM-18`)**:
   - **Ngữ pháp Phủ Góc Máy 6 Loại Cảnh (`coverageType`)**: Luân phiên `MASTER_ESTABLISHING` $\rightarrow$ `INSERT_DETAIL_CUTAWAY` $\rightarrow$ `OTS_CONFRONTATION` $\rightarrow$ `KULESHOV_REACTION` $\rightarrow$ `POV_SUBJECTIVE` $\rightarrow$ `LOW_ANGLE_HERO_APEX`.
   - **Bố cục 3 Lớp Chiều Sâu (`depthStagingEn`)**: Chia rõ Tiền cảnh mờ bokeh (`FG`) + Trung cảnh chủ thể nét căng (`MG`) + Hậu cảnh quy mô đại ngàn (`BG`).
   - **Lời Bình Điện Ảnh Đa Tầng (`STUDIO_LITERARY_SUBTEXT_NARRATION_VI`)**: Không đọc lại hình ảnh mà khắc họa quy luật sinh tồn, xung đột số phận và cái giá của ngôi vương.
   - **Bàn Dựng Đa Góc Máy & Chỉnh Màu DI Theo Hồi (`Stage 7B`)**: Tự động cắt cận cảnh va chạm (`Hard-Cut Punch-In 1.32x + Impact Flash` tại `t=2.25s`), áp LUT màu riêng cho từng Hồi (`colorbalance` + `eq`) và đóng khung màn ảnh rộng `2.39:1 CinemaScope`.
10. **[LEGACY — chỉ `--preset dino-legacy`; Premium dùng stem gốc Veo + `--music` có bản quyền, không nhạc sine/LFE/ADR] Kiến Trúc 12/12 Phòng Ban Điện Ảnh Chuẩn Marvel / DC / Disney (`services/studioDepartmentsEngine.ts` — `MEM-19`)**:
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
# 1) Duyệt hình 0 credit (Story Room + hồ sơ nhân vật + env plate + keyframe + Folder Nhân vật MEM-10)
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --script "<Nội dung kịch bản của người dùng>" --frames-only

# 2) Bản final sau khi người dùng duyệt hình (Quality, 2 take/cảnh; 12 cảnh ≈ 2.400 credit)
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --resume output/vscode_runs/<run> --quality final

# Bản nháp rẻ để thử chuyển động (Lite, 1 take; 12 cảnh ≈ 60 credit).
# Chạy trên một bản sao thư mục run, vì --resume bỏ qua cảnh đã có shot_XX_video.mp4.
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --resume output/vscode_runs/<run>_draft --quality draft

# Reel dọc, phong cách 2D
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --script "<kịch bản>" --aspect 9:16 --style graphic2d --quality final
```

Lúc khởi động, pipeline in ước tính credit = `số cảnh × số take × (Lite 5 / Fast 10 / Quality 100)`. **Luôn báo con số này cho người dùng trước khi bấm máy.**

**Các tham số của script (mặc định in đậm):**
- `--script "<kịch bản>"`: Nội dung kịch bản hoặc ý tưởng phim (bắt buộc với run mới).
- `--style` **`pixar3d`** | `graphic2d` | `photoreal`: Phong cách toàn phim. `photoreal` chỉ dùng theo kiểu phim tài liệu thiên nhiên.
- `--preset dino-legacy`: Chạy lại đúng đường cũ (template khủng long, prompt kiểu bảng thông số, Stage 7 cũ). Bỏ trống thì chạy đường Premium.
- `--quality` **`final`** | `draft`: `final` = `Veo 3.1 - Quality` + 2 take; `draft` = `Veo 3.1 - Lite` + 1 take.
- `--model "<tên_model>"`: Ghi đè model (`"Veo 3.1 - Lite"` 5, `"Veo 3.1 - Fast"` 10, `"Veo 3.1 - Quality"` 100 credit mỗi lần tạo).
- `--takes <1-4>`: Số take mỗi cảnh. Giám khảo chọn take tốt nhất.
- `--shots <số_cảnh>`: Số cảnh (Premium mặc định **12**, legacy 8).
- `--dialogue-lang` **`en`** | `vi`: Ngôn ngữ Veo nói thoại. Phụ đề hiện bản dịch tiếng Việt.
- `--subtitles` **`dialogue`** | `none`: Chỉ phụ đề lời thoại, một dòng ≤42 ký tự.
- `--narration` **`none`** | `vo`: `vo` dùng giọng TTS cũ, chỉ dùng câu vừa cửa sổ, không cắt cụt.
- `--music <file>`: Nhạc nền người dùng có bản quyền, tự duck dưới thoại.
- `--pacing` **`viral-reel`** | `cinema` | `fast`: Độ dài cửa sổ cắt.
- `--aspect` **`16:9`** | `9:16`: Tỉ lệ khung. Master xuất 1920x1080 hoặc 1080x1920.
- `--resume "<đường_dẫn_thư_mục>"`: Chạy tiếp một run có sẵn. Cảnh đã có `shot_XX_video.mp4` sẽ được bỏ qua.
  - Đường sản xuất do blueprint của run quyết định: có `premiumBible` thì chạy Premium, không có thì tự chuyển `dino-legacy`.
  - Run Premium giữ nguyên phong cách, số cảnh, kịch bản và ngôn ngữ thoại đã khóa ở Giai đoạn 1.
  - Với run cũ, muốn bản Premium thì dùng Cách C (`npm run remaster`).
- `--master-only` (dùng kèm `--resume`): Chỉ dựng lại Stage 7, offline, không cần bridge, 0 credit. Với run legacy, bản Premium chỉ ghi vào `<run>/premium_master/` (file gốc của run giữ nguyên); thêm `--preset dino-legacy` nếu muốn hậu kỳ cũ.
- `--rerender-shots 3,7`: Quay lại các cảnh chỉ định (cờ này cũng vẽ lại keyframe của các cảnh đó).
- `--max-stage <1-7>`: Dừng sau một giai đoạn (vòng lặp đóng `MEM-22`).
- `--frames-only`: Chỉ chạy **Giai đoạn 1 -> Giai đoạn 3** (**0 Credit** — Tạo Kịch bản DOP + 3-Panel Character Sheet + Clean Environment Lock + Toàn bộ ảnh Storyboard Start/End Frames + Đăng ký Folder 3 Phần vào tab **"Nhân vật"**) để đạo diễn duyệt ảnh trước khi tốn Credit render video! Ở đường Premium, các ảnh hồ sơ gồm turnaround, expression sheet và portrait.
- `--skip-host-sync`: Bỏ qua bước đồng bộ vào tab "Nhân vật" và "Cảnh" nếu người dùng chỉ muốn lấy file trên ổ cứng VS Code.

---

### Cách C: Remaster Một Run Có Sẵn (0 Credit, Offline)
Biến một run cũ (kể cả run legacy như `dino_clash_closed_loop_v1`) thành bản master Premium mà không gọi Flow. Script chỉ ghi vào `<run>/<out-subdir>/` (mặc định `premium_master/`), không đụng file khác của run:

```bash
npm run remaster -- --run output/vscode_runs/dino_clash_closed_loop_v1
npm run remaster -- --run output/vscode_runs/<run> --aspect 9:16 --pacing viral-reel --subtitles none --music <file nhạc có bản quyền>
```

- **Cờ**: `--aspect`, `--pacing`, `--subtitles` (run legacy mặc định `none` vì `subtitleVi` cũ là lời bình dài), `--music`, `--narration`, `--out-subdir`, `--manifest`, `--out-name` (mặc định `MASTER_PREMIUM`), `--no-grain`.
  - **Mới (`MEM-24.1`)**:
    - `--overrides <file.json>`: chỉnh từng cảnh. Trường cho mỗi cảnh: `forceWindow { inSec, outSec }`, `beatWindow { inSec, peakSec, outSec }` (lấy từ `beat_in/peak/out` của giám khảo), `hflip`, `fxSpans`, `videoPath`, `skip`, `gainOffsetDb`, `beat`, `shotSize`, `actingBeat`, `action`. Khối `options` nhận `ambiencePath`, `endFadeSec`, `limiterSlackDb`, ...
    - `--ambience <file>`: nền ambience liên tục, ~16 LU dưới stem.
    - `--take-tag final`: đọc `bible.json` + `shot_XX_<tag>_best.mp4` (run dạng proto).
    - `--keep-work`: giữ file trung gian.
    - Mẫu overrides: [MEMORY.md](../../../MEMORY.md) mục 4.8.
- **Kết quả**: `<out-name>.mp4`, phụ đề và `<out-name>_report.json`. Report đặt theo tên bản master nên không ghi đè report của bản khác. Report ghi LUFS, true peak, LRA, kích thước, ASL, các cửa sổ cắt và cảnh báo, kèm md5 nguồn, gain từng cảnh, nhảy tiếng ở điểm cắt, p50 luma, cháy đỏ.
- **Đã kiểm chứng trên `dino_clash_closed_loop_v1`**: 1920x1080, 24fps, ASL 2.14s, -14.0 LUFS, -1.8 dBTP, 0 khung lặp.
- **Đã kiểm chứng trên `dino_premium_v2` (`MEM-24.1`, `master_r3_engine_test/MASTER_R3`)**:
  - Loudness: -15.8 LUFS (dừng ở đây vì giới hạn limiter ~3 dB), LRA 9.1, -1.6 dBTP.
  - Nhảy tiếng ở điểm cắt: median 3.53 dB (bản trước: 5.68 dB).
  - Hình: cháy đỏ 0.004% (bản trước: 1.29%), p50 luma 78.9 (bản trước: 91.1).

```bash
npm run remaster -- --run output/vscode_runs/<run> --out-subdir master_r4 --out-name MASTER_R4 --overrides <file.json> --ambience <file ambience> --take-tag final
```
- **Tự kiểm engine offline** (không gọi Flow, 0 credit): `npm run test:premium`. Thêm `-- --skip-media` để bỏ phần đo bằng ffmpeg.

---

### Cách B: Điều Khiển Từng Giai Đoạn & Chỉnh Sửa Thủ Công Theo Ý Đạo Diễn

Khi người dùng muốn can thiệp sâu vào từng giai đoạn, thực hiện tuần tự 7 bước sau:

1. **Giai đoạn 1 (Phòng Biên Kịch Phân Cấp 4 Tầng & Bộ Biên Dịch Kỹ Thuật DOP — `MEM-20`, 0 Credit)**:
   - Khởi tạo **Hồ sơ Xương sống Kịch bản 4 Tầng (`00_writers_room_story_bible.json`)** qua [`writersRoomEngine.ts`](../../services/writersRoomEngine.ts) theo chuẩn *Google DeepMind Dramatron, Pixar "Therefore / But" Causality, Robert McKee Value Shift & LTX Studio Visual Motif Lexicon*: khóa Tiền đề tư tưởng, Hồ sơ Tâm lý Nhân vật, 3 Vật chứng Xuyên suốt, Chuỗi Domino Nhân-Quả (`THEREFORE_CONSEQUENCE` / `BUT_COMPLICATION_TWIST`), Đảo cực Giá trị (`valueChargeShift`), và 3 nhịp hành động độc bản cho từng cảnh trước khi biên dịch sang `compiledPromptBackboneEn` cho Ban Kỹ Thuật Prompt.
   - Gọi `Flow.generate.text` (`Omni 1.1 Flash`) bóc tách nhân vật, bối cảnh và danh sách phân cảnh (`shots`).
   - **Premium (`MEM-24`)**: Thay hai bước trên bằng chuỗi `buildStoryRoomPrompt` → `Flow.generate.text` → `normalizeStoryBible` (lỗi thì dùng `buildFallbackStoryBible`). Lưu kết quả vào `blueprint.premiumBible` và đặt `blueprint.shots = bible.shots.map(toLegacyShotFields)`. Không gọi `enrichShotWithStudioSpectacle` và không dùng template 23 cảnh.
2. **Giai đoạn 2 (Đúc 3-Panel Character Sheet & Clean Environment Lock — 0 Credit)**:
   - Gọi `Flow.generate.image` (`🍌 Nano Banana Pro`) tạo ảnh 3-Panel Character Sheet trên nền xám `#808080` và ảnh Bối cảnh sạch không người.
   - Gọi `Flow.save` để lưu ảnh vào dự án Google Flow và gọi `Flow.host.createCharacter({ name, personality, assetQuery })` để tạo nhân vật trong tab **"Nhân vật"** (Ảnh 1).
   - **Premium**: Tạo ảnh bằng `buildCharacterSheetPrompts` (turnaround + `02_character_N_expression_sheet.png` + `02_character_N_portrait.png`) và `buildEnvironmentPlatePrompt`. Gatekeeper tham số hóa theo loài/phong cách và giữ bản tốt nhất. Folder `MEM-10` vẫn đủ 3 phần, ô `Thông tin nhân vật` nạp `personalityVi`.
3. **Giai đoạn 3 (Previs Không Gian 3D, Vẽ Storyboard Keyframes Start/End Frame & Kiểm Định `T2V-CompBench` — `MEM-21`, 0 Credit)**:
   - Khởi tạo **Hồ sơ Tiền Trực Quan Hóa Không Gian 3D (`spatialPrevisDossier`)** và chạy **Vòng lặp Kiểm định 8 Tiêu chí `T2V-CompBench` (`auditAndHealShotPromptsInLoop`)** trong [`spatialPrevisAndPromptCompiler.ts`](../../services/spatialPrevisAndPromptCompiler.ts) để tách đôi **`spatialLayoutImagePromptEn`** (chuyên dựng khung tĩnh 3D) và **`frontLoadedMotionVideoPromptEn`** (đẩy Camera MotionCtrl + Skeletal Kinematics lên 22 từ đầu tiên cho `Veo 3.1`, đạt 100/100 điểm kiểm định tại `00B_prompt_engineering_audit_report.json`).
   - Với mỗi cảnh, gọi `Flow.generate.image` (`🍌 Nano Banana Pro`) kèm `referenceImageMediaIds: [characterMediaId, envMediaId]` để vẽ Start Frame (và End Frame nếu `cameraTransitionType === 'A_TO_B_BRIDGE'`).
   - Hiển thị toàn bộ ảnh Storyboard cho người dùng xem. Nếu chạy chế độ `--frames-only`, hỏi người dùng có muốn chỉnh sửa khung hình nào trước khi bấm máy quay video không.
   - **Premium**: Bỏ previs số đo và audit tự chấm. Keyframe dùng `buildKeyframePrompt` (trạng thái đầu cảnh). Ảnh tham chiếu = sheet của nhân vật có mặt (+ expression sheet cho `CU/MCU/ECU`) + env plate. `lintPremiumPrompt` ghi kết quả vào `s.promptLint`, và `00B` chứa kết quả lint thật.
   - **`MEM-24.1` (L1)**: Mỗi cảnh thêm **khung cuối** bằng `buildEndFrameEditPrompt` (sửa khung đầu, chỉ đổi tư thế/biểu cảm sang `endStateEn`, ảnh tham chiếu [khung đầu, sheet từng nhân vật] ≤3, lint loại `'edit'`). Cho người dùng duyệt **cặp** khung đầu/cuối: nền giống hệt, cùng cỡ cảnh, màu đúng sheet, đúng hướng màn hình, cảnh va chạm còn khe hở, nhịp không vui thì miệng khép.
4. **Giai đoạn 4 (Bấm máy Quay Video — `Veo 3.1`)**:
   - Gọi `Flow.generate.video` với `firstFrameImageMediaId` (và `lastFrameImageMediaId` nếu có) cùng `referenceImageMediaIds`.
   - Tự động lưu từng file `.mp4` về thư mục `d:\myProject\test-AI\output\vscode_runs\<project_slug>\`.
   - **Premium**: Prompt dùng `buildMotionPrompt` (chỉ tả chuyển động + thoại `<Name> says:` + `SFX:` / `Ambient noise:`). Model theo `--quality` / `--model`; quay `--takes` take mỗi cảnh, lưu `shot_XX_take_K.mp4`. Với `Veo 3.1 - Quality` chỉ truyền `firstFrameImageMediaId`, vì model này không hỗ trợ Ingredients.
   - **`MEM-24.1`**: Truyền thêm `lastFrameImageMediaId` = khung cuối của **chính cảnh đó** (`buildPremiumVideoRequest({ lastFrameMediaId })`, `buildMotionPrompt({ withEndFrame: true })`). Không dùng khung đầu của cảnh sau cho mục đích này (`--bridge-next-frame` là cơ chế cũ). Cảnh va chạm dừng một bước trước khi chạm.
5. **Giai đoạn 5 (Kiểm định Chất lượng VQQA & Quay Bổ sung — 0 Credit)**:
   - Dùng `Flow.generate.text` chấm điểm từng cảnh (Anatomy, Identity Consistency, Lighting).
   - **Premium**: Trích 3 khung mỗi take (0.5s, giữa, cuối−0.5s), rồi chạy `buildTakeJudgePrompt` → `parseJudgeVerdict` → `pickBestTake`. `parseJudgeVerdict` trả `null` khi không đọc được và không bao giờ mặc định 95. Take thắng được chép thành `shot_XX_video.mp4`; lưu `s.takes` và `s.vqqaScore`.
   - **`MEM-24.1` (L7)**: 3 khung là không đủ, vì giám khảo bỏ sót cảnh tan chảy giữa các mẫu và cho đậu take mà ghi chú tự nhận thiếu hành động. Thay bằng `denseJudgeFrameTimes` (khung đầu + ≥10 khung đều + khung cuối), đặt ảnh tham chiếu (khung đầu/cuối, sheet) trước các khung của take, rồi `parseJudgeVerdict(text, { requireHardGates: true, durationSec })`. Trượt một trong 6 cổng (`keyActionVisible`, `bodyIntact`, `expressionMatchesBeat`, `identityOnModel`, `facingCorrect`, `cleanFrame`) thì fail và ≤55 điểm. Lưu `beatInSec` / `beatPeakSec` / `beatOutSec` để Stage 7 dùng làm `beatWindow`.
   - Nếu người dùng muốn thêm hiệu ứng (mưa, tuyết, khói lửa) lên video đã quay mà giữ nguyên chuyển động gốc, gọi `Flow.generate.video` với `sourceVideoMediaId` + `sourceVideoMode: 'edit'`.
6. **Giai đoạn 6 (Ghép Cảnh vào Tab "Cảnh" / Scenebuilder trên Google Flow)**:
   - Gọi `Flow.host.createScene({ clipCount })` (`npm run create-scene`) để gom các đoạn video vừa quay vào tab **"Cảnh"** (Ảnh 2) của Google Flow.
7. **Giai đoạn 7 (Xuất Phụ đề `.SRT`, Hồ sơ `.JSON` & Ghép Video Master `.MP4`)**:
   - Xuất file phụ đề `.srt`, manifest `.json` và nối các đoạn video `.mp4` thành bản phim hoàn chỉnh trong thư mục xuất bản, sau đó báo cáo kết quả kèm đường dẫn click được cho người dùng.
   - **Premium**: `masterFilm` trong [`premiumMasteringEngine.ts`](../../../services/premiumMasteringEngine.ts) xuất `MASTER_FINAL_MOVIE.mp4` (+ bản sao `MASTER_DIRECTORS_CUT.mp4`), `master_subtitles.srt/.ass` và `MASTER_FINAL_MOVIE_report.json`. Báo cho người dùng: LUFS, true peak, độ phân giải, ASL, điểm giám khảo từng cảnh (nêu rõ cảnh `null`), credit đã dùng và các cảnh báo. Lệnh `--resume <run> --master-only` chạy offline, không cần bridge.
   - **`MEM-24.1`**:
     - Truyền cho mỗi cảnh `beatWindow` (từ giám khảo), `actingBeat`, `action`, và khi cần thì `forceWindow` / `hflip` / `fxSpans`.
     - Có thể thêm `ambiencePath` và `musicPath`.
     - Engine tự làm: bản đồ gain kịch tính, crossfade 5 khung, một gain tĩnh + limiter (không loudnorm động), tone curve, chuẩn hóa phơi sáng.
     - Báo thêm cho người dùng: LRA, nhảy tiếng ở điểm cắt, p50 luma, cháy đỏ. Nếu master dừng ở -15/-16 LUFS vì giới hạn limiter thì nêu rõ.
     - Hiện pipeline chỉ truyền `musicPath`; các trường còn lại dùng qua Cách C (`--overrides`, `--ambience`).

