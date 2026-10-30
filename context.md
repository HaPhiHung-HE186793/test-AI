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
   - **Đã kiểm chứng 2026-10-29**: `Veo 3.1 - Lite` = **5** credit/lần tạo (`--quality draft` của đường Premium), `Veo 3.1 - Fast` = **10**. Trong Flow, chỉ Lite hỗ trợ Extend.
4. **`Veo 3.1 Quality`**:
   - Chỉ gọi khi người dùng bấm nâng cấp cảnh quan trọng lên **4K Master** trong `ShotInspectorDrawer` (~100 credits/shot, có âm thanh vật lý gốc Native Audio)[cite: 5, 8, 10, 11].
   - **Cập nhật `MEM-24`**: Trong CLI pipeline, `Veo 3.1 - Quality` (100 credit/lần) nay là **mặc định cho bản final** (`--quality final`, 2 take/cảnh). Model này **không hỗ trợ Ingredients** (`referenceImageMediaIds`), nên độ nhất quán phải đến từ keyframe đầu do Nano Banana Pro vẽ bằng hồ sơ nhân vật (Pure First-Frame Lock, `MEM-13` (5)).
5. **Giới hạn độ phân giải & upscale**: Bridge chỉ nhận `360p`/`720p` khi gọi `Flow.generate.video` (`MEM-02`). Upscale 1080p trong giao diện Flow miễn phí, 4K tốn 50 credit, nhưng bridge **chưa tự động hóa** bước này. Stage 7 Premium upscale lanczos lên 1920x1080 / 1080x1920 và ghi cảnh báo trong report.
6. **Ngôn ngữ thoại**: Theo tài liệu Google, Omni chỉ hỗ trợ đầy đủ tiếng Anh; ngôn ngữ khác "có thể chạy nhưng kết quả dao động". Vì vậy đường Premium mặc định `--dialogue-lang en` và hiện phụ đề là bản dịch tiếng Việt.

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

### 3.4. Đường Premium của CLI pipeline (`MEM-24`, 2026-10-29)
CLI [`run-full-movie-pipeline.ts`](file:///d:/myProject/test-AI/.agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts) (chạy bằng `node --experimental-strip-types`) mặc định đi theo đường Premium. `--preset dino-legacy` giữ nguyên hành vi cũ của Stage 1–4 và Stage 7 cũ. Ba file mới, đều chỉ dùng TypeScript "erasable" (không `enum` / `namespace`), import tương đối có đuôi `.ts`, và không thêm npm dependency:

| File | Vai trò | API chính |
| :--- | :--- | :--- |
| [`services/premiumPromptEngine.ts`](file:///d:/myProject/test-AI/services/premiumPromptEngine.ts) | Bộ não Stage 1–5: story bible, hồ sơ nhân vật, prompt keyframe/motion, lint, giám khảo take. Hàm thuần: không import, không I/O, không gọi Flow. | `STYLE_PRESETS` (`pixar3d` / `graphic2d` / `photoreal`), `buildStoryRoomPrompt`, `normalizeStoryBible`, `buildFallbackStoryBible`, `planCoverage`, `buildCharacterSheetPrompts`, `buildEnvironmentPlatePrompt`, `buildKeyframePrompt`, `buildMotionPrompt`, `lintPremiumPrompt`, `buildTakeJudgePrompt`, `parseJudgeVerdict`, `pickBestTake`, `toLegacyShotFields`, `estimateCredits`. Kiểu dữ liệu: `PremiumStoryBible`, `PremiumCharacter`, `PremiumEnvironment`, `PremiumShot`, `PremiumShotSize`.<br>**Mới (`MEM-24.1`)**: `buildEndFrameEditPrompt({ style, shot, characters, referenceOrder?, environment? })`, `denseJudgeFrameTimes(durationSec, { count?, fps? })`, `PREMIUM_JUDGE_HARD_GATES`, `PREMIUM_JUDGE_GATE_FAIL_CAP` (55), `hasContactAction`, `KEYFRAME_MAX_WORDS` (130) / `MOTION_MAX_WORDS` (100) / `END_FRAME_MAX_WORDS` (150). Kiểu `PremiumPromptKind` có thêm `'edit'`. `PremiumShot` có thêm `endStateEn?` và `facing?`. `PremiumJudgeVerdict` có thêm `hardGates?`, `failedGates?`, `beatInSec?` / `beatPeakSec?` / `beatOutSec?`. Tham số tùy chọn mới: `buildMotionPrompt({ withEndFrame })`, `buildTakeJudgePrompt({ referenceFrames, style, durationSec })`, `parseJudgeVerdict(text, { requireHardGates, durationSec })`. |
| [`services/premiumShotProduction.ts`](file:///d:/myProject/test-AI/services/premiumShotProduction.ts) | Trợ giúp Stage 3–5 cho pipeline: kế hoạch ảnh tham chiếu, cổng duyệt keyframe, request video, kế hoạch take. | `planShotReferences`, `buildKeyframeGatePrompt` / `parseKeyframeGateVerdict`, `buildPremiumVideoRequest({ firstFrameMediaId, lastFrameMediaId?, ... })`, `takeFrameTimes` (3 khung, kiểu cũ; `MEM-24.1` dùng `denseJudgeFrameTimes`), `planTakeActions`, `buildTakeJudgePromptWithReferences`, `selectBestTake`, `buildPromptLintReport`. |
| [`services/premiumMasteringEngine.ts`](file:///d:/myProject/test-AI/services/premiumMasteringEngine.ts) | Stage 7 offline, chỉ dùng ffmpeg (`node_modules/ffmpeg-static`, không cần ffprobe). | `masterFilm(shots, opts) → MasterReport`, `selectBestWindow`, `probeMedia`, `measureLoudness`, `resolveFfmpegPath`, `splitCaption`, `resolveCanvas`.<br>**Mới (`MEM-24.1`, `MASTER_ENGINE_VERSION = 'premium-master-r3'`)**:<br>• `MasterShotInput` có thêm (tùy chọn): `beatWindow { inSec, peakSec, outSec }`, `forceWindow { inSec, outSec }`, `hflip`, `fxSpans[]`, `actingBeat`, `action`, `dialogueText`, `gainOffsetDb`.<br>• `MasterOptions` có thêm (tùy chọn): `ambiencePath`, `ambienceBelowStemLu`, `audioCrossfadeFrames`, `gainMap`, `maxLimiterGainReductionDb`, `limiterSlackDb`, `minIntegratedLufs`, `lraRange`, `exposureNormalize`, `exposureTargetP50`, `toneCurve`, `endFadeSec`, `maxMidFxFrac`.<br>• Hàm mới: `chooseWindowFromAnalysis`, `audioEnergyWeight`, `beatGainOffsetDb`, `solveGainMap`, `planAudioMix`, `planExposure`, `measurePicture`, `measureCutJumps`, `fileMd5`, `DEFAULT_TONE_CURVE`. |
| [`scripts/remaster-run.ts`](file:///d:/myProject/test-AI/scripts/remaster-run.ts) | CLI dựng lại master của một run có sẵn, 0 credit. Nguồn shot theo thứ tự: manifest → `bible.json` + `shot_XX_<take-tag>_best.mp4` → `shot_XX_video.mp4`. | `npm run remaster -- --run <runDir> [--aspect 16:9\|9:16] [--pacing viral-reel\|cinema\|fast] [--subtitles none\|dialogue] [--music file] [--ambience file] [--narration none\|vo] [--out-subdir premium_master] [--manifest file] [--out-name MASTER_PREMIUM] [--overrides file.json] [--take-tag final] [--no-grain] [--keep-work]` |

Dữ liệu mới trong run (đường Premium):
- `01_director_blueprint.json`: thêm `premiumBible`. Mỗi shot giữ các trường cũ (qua `toLegacyShotFields`) và thêm `premium`.
- Stage 2: `02_character_N_expression_sheet.png` và `02_character_N_portrait.png`.
- Mỗi shot có `promptLint`, `takes=[{path, verdict}]` và `vqqaScore` (điểm thật hoặc `null`).
- Video: `shot_XX_take_K.mp4`, cùng `shot_XX_video.mp4` (take tốt nhất).
- `00B_prompt_engineering_audit_report.json` chứa kết quả lint thật.
- Master: `MASTER_FINAL_MOVIE.mp4`, `MASTER_DIRECTORS_CUT.mp4` (bản sao), `master_subtitles.srt/.ass` và report JSON.
- **`MEM-24.1` (2026-10-30)**:
  - Mỗi shot trong bible có `endStateEn`: trạng thái cuối, cùng cỡ cảnh và bố cục với khung đầu; với cảnh va chạm là một bước trước khi chạm. Có thể có thêm `facing` (hướng màn hình).
  - Verdict của giám khảo có `hardGates`, `failedGates`, `beatInSec` / `beatPeakSec` / `beatOutSec`.
  - Report master đặt theo tên bản (`<outBaseName>_report.json`) và có thêm `engineVersion`, `sources[]` (md5 + bytes của từng clip nguồn), `shots[]` (cửa sổ, `forced`, `hflip`, `beatPeakInWindow`, `fxMid`, gain, crossfade/J-L cut, phơi sáng), `audio` (`policy`, `goalLufs`, `goalSearch`, limiter, `cutJumps`) và `picture` (p50, `redClipPct`, `cornerCentreRatio`, chênh phơi sáng ở điểm cắt).
  - File `--overrides` (JSON) chỉnh từng cảnh khi remaster: `{ "shots": { "04": { "forceWindow" | "beatWindow" | "hflip" | "fxSpans" | "videoPath" | "skip" | "gainOffsetDb" ... } }, "options": { "ambiencePath", "endFadeSec", "limiterSlackDb", ... } }`. Mẫu đầy đủ: [MEMORY.md](file:///d:/myProject/test-AI/MEMORY.md) mục 4.8.
- **Trạng thái nối dây (kiểm tra lại 2026-10-30, sau review r3)**: Pipeline CLI **đã nối**: Stage 3 tạo khung cuối L1 cho mọi cảnh (`buildEndFrameEditPrompt` + giám khảo khung cuối, prompt ≤ `PREMIUM_GATE_PROMPT_MAX_CHARS`); Stage 4 gửi khung đầu + khung cuối (`setEndFrameLock` giữ câu khoá thiết kế đúng khung thực gửi); Stage 5 giám khảo 12 khung dày 480px + tham chiếu JPEG 480px, cổng cứng, `beat_in/peak/out`, prompt gọn ≤ `PREMIUM_JUDGE_PROMPT_MAX_CHARS` (3.300 ký tự, "translucent" — Flow từ chối ~4.000+ ký tự kèm ảnh và từ "see-through"), lỗi → bản gọn 8 khung, vẫn lỗi → cảnh báo ⛔, `--resume` chấm lại bản chưa có phán quyết (0 credit video); Stage 7 truyền `beatWindow` / `actingBeat` / `action` / `forceWindow` / `hflip` + `--ambience` / `--ambience-from-flow` (5 credit Veo Lite, `--rerender-ambience` để quay lại clip nền hỏng). `--resume <run thử nghiệm>` dựng blueprint từ `bible.json` + `state.json` và master vào `pipeline_master/`. `npm run remaster` đọc cùng dữ liệu đã lưu (manifest: `beatWindow`/`forceWindow`/`hflip`; run thử nghiệm: phán quyết `<tag>_best` trong `state.json`), `--overrides` thắng, `--ignore-stored-beats` bỏ qua.

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
3. **[MEMORY.md](file:///d:/myProject/test-AI/MEMORY.md) (`= Trí nhớ thực chiến của AI`)**: Ghi nhớ tới từng chân tơ kẽ tóc các quy tắc bất di bất dịch, bài học xương máu và nhật ký khắc phục lỗi (`MEM-01` -> `MEM-24`). **`MEM-24` (Premium Animation Standard) là chuẩn mặc định**, cùng `MEM-24.1` (bài học render thật 2026-10-30, mục 4.8); các mục bị đánh dấu `SUPERSEDED` chỉ còn dùng với `--preset dino-legacy`.

## 8.1. Sáu Quy Chuẩn Vàng Tạo Video Điện Ảnh Nhất Quán Trên Google Flow (Step-by-Step)

| Quy Chuẩn | Kỹ Thuật Cốt Lõi Trên Google Flow | Lý Do Kỹ Thuật & Điện Ảnh |
| :--- | :--- | :--- |
| **1. Bảng Tham Chiếu Nhân Vật 3 Góc Độ (`3-Panel Character Sheet`)** | Tạo 1 khung hình `16:9` chứa **3 panels**: `(1) Cận cảnh khuôn mặt`, `(2) Toàn thân phía trước`, `(3) Toàn thân góc 3/4 phía sau` trên **nền xám phẳng (`#808080`), không có bóng đổ**.<br>**Premium (`MEM-24`)**: 3 ảnh riêng, không chữ: turnaround 4 góc + expression/pose sheet (6 biểu cảm + 4 tư thế) + portrait. | Giúp AI nắm trọn cấu trúc 3D của nhân vật từ mọi góc quay; nền xám phẳng không đổ bóng ngăn AI sao chép ánh sáng sai lệch vào các cảnh sau (`[01:54 - 02:45]`). |
| **2. Khóa Môi Trường "Sạch" (`Clean Environment Lock`)** | Dùng `🍌 Nano Banana Pro` tạo ảnh tham chiếu bối cảnh `16:9` **hoàn toàn trống (tuyệt đối không có người / nhân vật)**.<br>**Premium (`MEM-24`)**: Viết bằng câu tích cực, không dùng chuỗi phủ định. Một nguồn sáng có động cơ + một họ màu. | Tránh xung đột dữ liệu giữa ảnh nhân vật và người trong bối cảnh (ngăn lỗi nhầm lẫn danh tính) và giữ không gian cố định xuyên suốt bộ phim (`[03:06 - 03:42]`). |
| **3. Storyboard 6 Khung Hình Độ Phân Giải Đầy Đủ & Gắn Nhãn (`Character Tagging`)** | Tạo từng khung hình Storyboard riêng lẻ (tối thiểu 6 khung) ở độ phân giải tối đa (không gộp chung vào 1 ảnh lưới) và **gắn nhãn tên nhân vật** (`[CHARACTER: <Tên>]`).<br>**Premium (`MEM-24`)**: Không dùng nhãn hay `@ID` trong prompt. Gọi bằng tên hiển thị + một cụm ngoại hình + `(image N)`. | Đảm bảo mỗi khung hình đủ độ nét để làm `Start Frame` (`firstFrameImageMediaId`) và kéo chính xác khuôn mặt từ Character Sheet vào bối cảnh (`[03:43 - 04:56]`). |
| **4. Ưu Tiên Mô Hình `Veo 3.1` Cho Độ Nhất Quán Cao Nhất** | Chọn **`Veo 3.1` (`Veo 3.1 - Fast` / `Lite` / `Quality`)** làm mô hình chủ lực cho các dự án cần sự ổn định cao; dùng `Omni 1.1 Flash` khi cần linh hoạt thời lượng hoặc sửa V2V. | Thực nghiệm đối chiếu cho thấy **Veo 3.1 giữ nhân vật và bối cảnh ổn định hơn hẳn, ít lỗi hiển thị (glitches) hơn Omni Flash** (`[05:09 - 08:16]`). |
| **5. Kiểm Soát Điểm Đầu & Điểm Cuối (`First Frame + Last Frame`)** | Truyền đồng thời cả **`firstFrameImageMediaId` (Khung đầu)** và **`lastFrameImageMediaId` (Khung cuối)** cho các cảnh chuyển động phức tạp (`A_TO_B_BRIDGE`). | AI tự động nội suy chuyển động trung gian mượt mà kết nối chính xác 2 trạng thái mà không cần cắt ghép hậu kỳ thủ công (`[08:17 - 10:05]`).<br>**`MEM-24.1` (render thật 2026-10-30)**: Ở đường Premium, **mọi** cảnh cần khung cuối, không chỉ cảnh phức tạp. Lý do: chỉ có khung đầu thì Veo Quality kéo nhân vật hoạt hình về loài có thật trong 8s. Khung cuối phải **sửa từ khung đầu** (`buildEndFrameEditPrompt`), không vẽ lại từ đầu. |
| **6. Chỉnh Sửa Video Hiện Có (`Video-to-Video VFX Edit`)** | Tải lên video tự quay hoặc chọn video có sẵn (`Flow.media.select({ filter: 'video' })`) và gọi `Flow.generate.video` với `sourceVideoMediaId` + `sourceVideoMode: 'edit'`. | Thêm hiệu ứng thời tiết/VFX (như tuyết rơi, mưa bão, ánh sáng) trong khi vẫn bảo toàn nguyên vẹn thành phần và chuyển động gốc của video (`[10:06 - 11:15]`). |

## 8.2. Thông số kỹ thuật của chuẩn Premium Animation (`MEM-24`, mặc định từ 2026-10-29)

Các thông số này được rút ra từ việc đo phim cũ `dino_clash_closed_loop_v1` và 5 reel tham chiếu (POMMI, ba reel character-sheet của Shayan Sadiq, reel "Master Storyboard"), đối chiếu với hướng dẫn Veo chính thức của Google. Lý do và số đo chi tiết: [MEMORY.md](file:///d:/myProject/test-AI/MEMORY.md) mục 4.

| Hạng mục | Thông số bắt buộc | Nơi thực thi |
| :--- | :--- | :--- |
| Phong cách | `pixar3d` (mặc định), `graphic2d`, hoặc `photoreal` chỉ theo kiểu phim tài liệu thiên nhiên | `STYLE_PRESETS`, cờ `--style` |
| Kịch bản | 6 nhịp nhân-quả, nhân vật có mong muốn, giữ thế giới của người dùng, không người dẫn chuyện | `buildStoryRoomPrompt`, `normalizeStoryBible` |
| Coverage | ≥35% `CU/MCU/ECU`, ≤25% `WS/EWS`, không lặp cỡ cảnh liền nhau, mỗi cảnh một hành động | `planCoverage` |
| Hiệu ứng | ≤1 mỗi cảnh; 0 ở `setup`/`resolution`; mức 2 chỉ cho 1–2 cảnh `climax` | `fxLevel` / `fxEn` |
| Prompt ảnh | 60–120 từ, văn xuôi; không số đo, ID, ngoặc vuông hay phủ định. **`MEM-24.1`**: trần 130 từ; nhịp không vui có "mouth firmly closed, lips covering the teeth, serious `<emotion>` expression" (choáng: "jaw slack, eyes unfocused"); có hướng màn hình và tư thế loài; nước chỉ ở chỗ có nước ("a few droplets") | `buildKeyframePrompt`, `lintPremiumPrompt` |
| Khung cuối (`MEM-24.1`, L1) | **Mọi** cảnh. Nano Banana Pro **sửa khung đầu**: giữ nền, ánh sáng, góc máy, ống kính, phong cách; chỉ đổi tư thế và biểu cảm sang `endStateEn`. Ảnh tham chiếu [khung đầu, sheet từng nhân vật], tối đa 3. Cùng cỡ cảnh, cùng vị trí. Cảnh va chạm: một bước trước khi chạm, có khe hở (L4). Lint `'edit'` 40–160 từ | `buildEndFrameEditPrompt` |
| Prompt video | 40–90 từ, chỉ tả chuyển động; thoại dạng `<Name> says: <line>` không ngoặc kép; có `SFX:` và `Ambient noise:`. **`MEM-24.1`**: trần 100 từ; Veo nhận khung đầu + khung cuối; tên nhân vật ngoài khung thay bằng "a point just off-screen" (L2); không push-in trên `OTS` hay toàn cảnh có di chuyển (L3) | `buildMotionPrompt({ withEndFrame })`, `buildPremiumVideoRequest` |
| Take & giám khảo | 2 take/cảnh với bản final; fail-closed (`null`, không mặc định 95); lỗi nặng giới hạn 50 điểm; `pass` từ 70 điểm. **`MEM-24.1` (L7)**: khung dày (khung đầu + ≥10 khung đều + khung cuối); 6 cổng cứng (`keyActionVisible`, `bodyIntact`, `expressionMatchesBeat`, `identityOnModel`, `facingCorrect`, `cleanFrame`), trượt một cổng thì fail và ≤55 điểm; trả `beat_in/peak/out` | `denseJudgeFrameTimes`, `buildTakeJudgePrompt`, `parseJudgeVerdict`, `pickBestTake` |
| Dựng | `viral-reel`: 1.2–3.2s mỗi cảnh, thoại ≤5s; bỏ 0.25s đầu và 0.4s cuối clip; cắt đúng khung. **`MEM-24.1` (L8)**: ưu tiên `forceWindow` > `beatWindow` (bắt buộc chứa `beat_peak`) > thoại > chuyển động/âm thanh; loại cửa sổ có khung giữa bị hiệu ứng phủ >40% | `selectBestWindow`, `chooseWindowFromAnalysis` |
| Âm thanh | Stem gốc Veo là kênh chính; `--music` có ducking. **`MEM-24.1` (L9)** thay loudnorm 2 pass bằng: bản đồ gain kịch tính (setup -2.5, mercy -3, climax +2 dB) → crossfade 5 khung ở mọi điểm cắt → ambience tùy chọn (~16 LU dưới stem) → nhạc tùy chọn (duck) → **một** gain tĩnh + limiter true-peak. Mục tiêu -14 LUFS, TP ≤ -1.5 dBTP; ép quá ~3 dB thì chấp nhận -15/-16. LRA 8–11, median nhảy tiếng ở điểm cắt < 5 dB. Không loudnorm động | `masterFilm`, `solveGainMap`, `planAudioMix` |
| Hình & xuất bản | 1920x1080 / 1080x1920, 24fps CFR, grain nhẹ, `concat` filter, một lần encode `libx264 slow crf16` + AAC 192k. **`MEM-24.1` (L10)**: tone curve toe/shoulder `0/0 0.09/0.04 0.5/0.48 0.85/0.84 1/0.95` thay `eq=contrast`; chuẩn hóa phơi sáng từng cảnh (p50 ~75–84); chặn cháy kênh đỏ | `masterFilm`, `planExposure`, `measurePicture` |
| Override & report (`MEM-24.1`, L11) | `forceWindow` / `hflip` / `beatWindow` / `fxSpans` từng cảnh qua `--overrides`. Report theo tên bản master, có md5 nguồn, không ghi đè report của bản khác | `remaster-run --overrides --out-name` |
| Phụ đề | Chỉ cho lời thoại; 1 dòng ≤42 ký tự; cỡ chữ ~4.3% chiều cao; lề dưới ~6% | `masterFilm` (ASS + SRT) |

## 8.3. Kinh tế credit & lệnh chạy chuẩn

- **Credit mỗi lần tạo video** (gói Ultra, 25.000 credit/tháng): `Veo 3.1 - Lite` 5, `Veo 3.1 - Fast` 10, `Veo 3.1 - Quality` 100. Ảnh Nano Banana Pro và text = 0.
- **Công thức**: `số cảnh × số take × credit/lần`. Pipeline in ước tính này lúc khởi động.
- **Ví dụ với 12 cảnh**: `--quality draft` ≈ 60; Fast 2 take ≈ 240; `--quality final` ≈ 2.400.
- **`--resume`**: Đường sản xuất do blueprint của run quyết định (có `premiumBible` → Premium, không có → `dino-legacy`). Run Premium giữ `model`/`takes` đã khóa trong blueprint (chỉ `--model`/`--takes`/`--quality` gõ lại mới đổi, kèm cảnh báo). Run cũ muốn bản Premium thì dùng `npm run remaster`, hoặc `--resume <run cũ> --master-only`: cả hai chỉ ghi vào `<run>/premium_master/`, không đụng file gốc.

```bash
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --script "<kịch bản>" --frames-only    # 0 credit, duyệt hình
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --resume output/vscode_runs/<run> --quality final
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --resume output/vscode_runs/<run> --master-only   # hậu kỳ offline (run legacy -> <run>/premium_master/)
npm run remaster -- --run output/vscode_runs/<run>                                                                                            # remaster run cũ -> <run>/premium_master/
npm run remaster -- --run output/vscode_runs/<run> --out-subdir master_r4 --out-name MASTER_R4 --overrides <file.json> --ambience <file>       # MEM-24.1: override từng cảnh + ambience
npm run test:premium -- --skip-media                                                                                                          # tự kiểm engine offline, 0 credit
node --experimental-strip-types .agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts --script "<kịch bản>" --preset dino-legacy     # đường cũ, chỉ để đối chứng
```

**Lưu ý bản quyền**: Prompt "MASTER STORYBOARD PROMPT" của Reel #4 yêu cầu model sao chép một video có sẵn của người khác, nên không dùng. Ý tưởng "lưới storyboard trước, animate từng ô sau" chỉ áp dụng cho truyện gốc.
