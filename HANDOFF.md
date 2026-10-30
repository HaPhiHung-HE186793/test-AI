# 🔁 HANDOFF — đọc file này TRƯỚC TIÊN ở mọi phiên / máy / AI mới

> Cập nhật lần cuối: **2026-10-30**. Người viết: Claude (phiên làm việc trên máy Windows gốc).
> Người dùng nói tiếng Việt → **luôn trả lời bằng tiếng Việt**.
> Sau khi đọc file này, đọc tiếp theo thứ tự: `AGENTS.md` → `MEMORY.md` mục **4.8 (MEM-24.1)** và **4.9 (MEM-24.2)** → `scripts/premium-proto/README.md` → `output/vscode_runs/dino_premium_v2/EDL_v6.json`.

---

## 0. TL;DR — đang ở đâu, làm gì tiếp

- **Mục tiêu của người dùng**: làm lại trận đấu 2 khủng long *từ đầu*, rồi tự kiểm tra – tự cải tiến **liên tục cho đến khi chất lượng ngang (hoặc hơn) 5 reel tham chiếu** (POMMI, reel rái cá, reel đấm bốc… — xem mục 2). Không dừng giữa chừng để hỏi, trừ khi bị chặn thật.
- **Bản phim tốt nhất hiện tại**: [`output/vscode_runs/dino_premium_v2/master_final_v6/MASTER_FINAL_v6_music.mp4`](output/vscode_runs/dino_premium_v2/master_final_v6/MASTER_FINAL_v6_music.mp4) — 30.1s, 15 cảnh, 1920x1080, -14.2 LUFS, LRA 7.5, có nhạc + âm nền + tiếng va chạm.
- **Điểm hội đồng đánh giá (thang 10, so với reel)**: vòng 2 = 4.5 → vòng 3 = 5.0 → vòng 4 = 5.5 → **vòng 5 (chấm bản v6) CHƯA CHẠY XONG** (phiên trước bị ngắt).
- **Việc làm NGAY khi nhận bàn giao** (theo thứ tự):
  1. Thiết lập máy (mục 4), mở `npm run bridge` và kiểm tra `curl http://localhost:4321/api/status` → `"ok":true`.
  2. **Chấm bản v6** bằng hội đồng 4 góc nhìn (mục 6). Có công cụ Workflow thì chạy `docs/handoff/eval-panel-workflow.js`; không có thì tự chấm theo checklist mục 6.
  3. Làm backlog ưu tiên (mục 7) theo vòng lặp mục 5, sau mỗi vòng chấm lại; dừng khi đạt Tiêu chí hoàn thành (mục 1).
  4. Sau mỗi vòng: ghi bài học mới vào `MEMORY.md` (mục 4.9+), cập nhật file HANDOFF này (mục 0, 3, 7), commit + push.

## 1. Tiêu chí hoàn thành ("Definition of Done")

Dừng vòng lặp khi **tất cả** đúng:
- Hội đồng 4 góc nhìn chấm **≥ 8/10 tổng** và **không góc nhìn nào < 7** (khán giả, kể chuyện/dựng, âm thanh, hình ảnh).
- Không còn lỗi "lộ AI" ở các nhịp then chốt của truyện (đớp hụt, quét đuôi/ngã, lao húc, tha thứ): không trôi thiết kế nhân vật (Ember phải luôn là T-rex con mũm mĩm, sọc cam chỉ ở lưng/đuôi, sẹo mày; Tide luôn mõm cá sấu dài + buồm quạt sọc xanh ngọc), không tan chảy, không thêm nhân vật/chữ, không cười sai nhịp.
- Âm thanh: -14 ±1 LUFS, LRA 7–11, tiếng va chạm nghe rõ trên loa điện thoại (dải 200 Hz–5 kHz to hơn 0.3s trước nó ≥ +3 dB).
- Một người xem Facebook bình thường sẽ hỏi "phim gì vậy?" chứ không nói "AI".

## 2. Bối cảnh: vì sao có dự án nâng cấp này

- Người dùng gửi 5 reel Facebook làm bằng AI nhưng trông như phim hoạt hình/CGI thật, trong khi phim cũ của dự án (`output/vscode_runs/dino_clash_closed_loop_v1`) "rẻ tiền, lộ AI".
- Nghiên cứu đã kiểm chứng (chi tiết + nguồn trong `MEMORY.md` mục 4.3): POMMI (50M view) là AI (YouTube gắn nhãn "Made with AI"), rất có thể Veo trên Flow; chất lượng đến từ **tay nghề** (phong cách hoạt hình 3D cách điệu, thiết kế nhân vật có dấu hiệu nhận diện, diễn xuất mặt, thoại ngắn, cắt nhanh ~2.3s/cảnh, nhạc, -14 LUFS), không phải công cụ khác. Reel chim–lừa là **sao chép video người khác** (rủi ro bản quyền) — chỉ học kỹ thuật storyboard.
- Kiểm toán code cũ: pipeline cũ bỏ qua kịch bản người dùng (template khủng long cứng), prompt 400+ chữ nhồi thuật ngữ, mọi cảnh đầy dung nham/sấm sét, Veo Lite 720p, TTS Google Translate bị cắt giữa câu, nhạc = sóng sin, -24 LUFS. Tất cả đã được thay bằng **đường Premium** (mặc định) — đường cũ chỉ còn sau `--preset dino-legacy`.

## 3. Bản đồ những gì quan trọng

| Thứ | Ở đâu |
| :--- | :--- |
| Quy tắc dự án (luôn bật) | `AGENTS.md`, `AGENT.md`, `context.md`, `.agents/skills/ai-film-studio/SKILL.md` |
| Bài học đã kiểm chứng (bắt buộc đọc) | `MEMORY.md` mục **4.3–4.9** (MEM-24, 24.1 = L1–L11, 24.2 = L12–L18) |
| Engine prompt Premium | `services/premiumPromptEngine.ts` (story room, prompt khung đầu/cuối/chuyển động, lint, giám khảo) |
| Engine hậu kỳ Premium | `services/premiumMasteringEngine.ts` (`masterFilm`: forceWindow/beatWindow/hflip, gain map, ambience, tone curve, -14 LUFS) |
| Nối dây Flow ↔ engine | `services/premiumShotProduction.ts`, `.agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts` (đường Premium mặc định) |
| Vòng lặp làm phim bằng tay (đã tạo ra v1→v6) | `scripts/premium-proto/*` + `scripts/premium-proto/README.md` |
| Remaster run cũ | `scripts/remaster-run.ts` (`npm run remaster -- --run <runDir>`) |
| Kiểm thử offline (0 credit) | `npm run test:premium` (~21.500 kiểm tra, phải PASS), `npx tsc --noEmit -p .` (mốc nền 201 lỗi cũ — không được tăng) |
| Run phim hiện tại | `output/vscode_runs/dino_premium_v2/` — `bible.json` (kịch bản + thứ tự cảnh), `state.json` (mediaId Flow, prompt, phán quyết giám khảo), `EDL_v6.json` (cảnh nào lấy take nào, cắt đâu), `edit_r6/` (clip đã cắt), `audio_r3/` (nhạc/âm nền/foley), `master_final_v6/` |
| Hội đồng đánh giá | `docs/handoff/eval-panel-workflow.js` (4 góc nhìn + chủ tọa), báo cáo các vòng trước tóm tắt ở mục 7 |

**Lưu ý git**: các take bị loại, ảnh kiểm tra, bản master cũ (v1–v5) **chỉ còn trên máy gốc** (bị `.gitignore`, ~1 GB). Repo giữ đủ để làm tiếp: keyframe hiện hành, take hiện hành, clip dựng v6, nhạc, master v6.

## 4. Thiết lập máy mới (Windows / Ubuntu / macOS)

```bash
git clone https://github.com/HaPhiHung-HE186793/test-AI.git && cd test-AI
git checkout <nhánh được push gần nhất — xem mục 9>
npm install                      # cài ffmpeg-static (bắt buộc cho hậu kỳ)
python --version                 # cần Python 3.10+ (proto_music_mix.py)
npm run chrome                   # mở Chrome cổng 9222 với profile chrome_ai_bot (hoặc ~/.chrome-flow-ultra-profile)
#   → đăng nhập ĐÚNG tài khoản Google AI Ultra của người dùng, mở đúng dự án Flow:
#     https://flow.google.com/project/e3841c79-a90e-405d-a255-43bb95cd64ab  (mở tool của dự án)
npm run bridge                   # cầu nối http://localhost:4321
curl http://localhost:4321/api/status    # phải có "ok":true và sandboxFrameId
npm run test:premium             # 0 credit, phải PASS
```

- `state.json` chứa **mediaId của Flow** (keyframe, bảng nhân vật, bối cảnh). Chúng chỉ dùng được khi Chrome đăng nhập **cùng tài khoản** và mở **cùng dự án Flow** ở trên. Nếu khác dự án: phải tạo lại ảnh (0 credit) bằng `proto:keyframes` sau khi xoá các key `media` tương ứng.
- **Không chuyển trang / bấm vào cửa sổ Chrome đang điều khiển Flow** khi đang tạo ảnh/video → lệnh treo. Muốn xem Flow thì mở bằng cửa sổ Chrome khác.
- Lỗi "Không tìm thấy tab Google Flow" → đưa tab tool của dự án lên lại (`curl http://127.0.0.1:9222/json/activate/<id>`), khởi động lại bridge.
- Lỗi tạm thời "Dịch vụ tạo video/văn bản không hoạt động" → thử lại (script đã tự thử lại). Prompt văn bản **kèm ảnh** phải < ~3.300 ký tự, nếu dài hơn Flow luôn báo lỗi này (không phải lỗi mạng).

## 5. Một vòng cải tiến (quy trình đã dùng cho v1 → v6)

1. **Sửa kịch bản** trong `bible.json` (mỗi cảnh: `shotSize`, `characters`, `startStateEn`, `endStateEn`, `actionEn`, `actingBeatEn`, `useStage`, `facing`…). Thứ tự phần tử trong `shots[]` = thứ tự trong phim. Cảnh cần vẽ lại: xoá file `shot_XX_start_frame.png`/`_end_frame.png` (chuyển vào `_rejected_*`) **và** xoá key `media['shot_XX_start_frame']` trong `state.json`.
2. **Vẽ khung hình (0 credit)**: `npm run proto:keyframes -- output/vscode_runs/dino_premium_v2 --shots <số cảnh> --style pixar3d`. **Tự xem từng cặp khung đầu/cuối** (ghép ảnh bằng ffmpeg rồi đọc) — hướng nhìn, đúng thiết kế, bối cảnh khớp, không cười sai nhịp. Lỗi thì sửa mô tả, xoá, vẽ lại.
3. **Render (tốn credit)**: chuyển take cũ của cảnh đó vào `_rejected_quality_rN/`, xoá `video['XX']['final']` trong `state.json`, rồi
   `npm run proto:render -- output/vscode_runs/dino_premium_v2 --tag final --model "Veo 3.1 - Fast" --takes 3 --duration 4 --parallel 2 --only <các cảnh>`.
   Báo ước tính credit cho người dùng trước (Fast 10 / Quality 100 mỗi take).
4. **Chọn đoạn bằng mắt**: xem take ở 4 fps (`ffmpeg -vf fps=4,scale=200:-2,tile=16x1`), dùng `beat_in/peak/out` của giám khảo làm gợi ý, cắt clip vào `edit_rN/` theo quy tắc trong `scripts/premium-proto/README.md`.
5. **Dựng**: `npm run proto:master -- <runDir> --tag final --out master_final_vN --override "1=edit_rN/shot_01_edit.mp4,..."` (đủ mọi cảnh theo thứ tự bible).
6. **Trộn nhạc**: lấy mốc cắt từ `master_final_vN/MASTER_FINAL_MOVIE_report.json` (cộng dồn `outSec-inSec`), chạy `proto_music_mix.py` với chỉ số cảnh: bắt đầu nhạc đánh nhau, điểm va chạm, bắt đầu nhạc kết, điểm "bẹp bùn" (xem `EDL_v6.json`). Đo lại LUFS và tiếng va chạm trên dải điện thoại.
7. **Chấm** bằng hội đồng (mục 6), ghi điểm vào mục 7 file này, ghi bài học mới vào `MEMORY.md`, commit + push.

## 6. Hội đồng đánh giá (cách "kiểm tra đạt chuẩn")

- Có công cụ Workflow (Claude Code): chạy `docs/handoff/eval-panel-workflow.js` với args giống lần trước (`master`, `report`, `run`, `evalTag`, `filmNote`, `previous`). 4 góc nhìn độc lập + chủ tọa tự kiểm chứng 6 lỗi nặng nhất, trả về điểm + kế hoạch ưu tiên.
- Không có: tự chấm theo 4 góc nhìn, **luôn kèm bằng chứng (giây, khung hình, số đo)** và so trực tiếp với khung hình của reel (POMMI: cận cảnh, ánh mắt, ~2.3s/cảnh, -14.7 LUFS LRA 9.6):
  1. **Khán giả / "lộ AI"**: xem khung 0.25s quanh mỗi điểm cắt — trôi thiết kế, tan chảy, nhân vật/chữ thừa, vật lý lơ lửng, cười sai nhịp.
  2. **Kể chuyện & dựng**: chỉ xem phim (chưa đọc bible) kể lại được câu chuyện không; mỗi nhịp có đọc được không; hướng màn hình, ánh mắt, nhịp cắt.
  3. **Âm thanh**: LUFS/LRA/true peak, nhảy âm ở điểm cắt (< 5 dB), khoảng lặng trước va chạm, va chạm trên dải điện thoại, nhạc có mặt xuyên suốt.
  4. **Hình ảnh**: độ nét (nguồn Veo 720p → upscale), phơi sáng giữa các cảnh, cháy sáng, hướng mặt trời nhất quán (KHÔNG hflip cảnh có mặt trời).
- Video tham chiếu không nằm trong repo (tải lại bằng `python -m yt_dlp https://www.facebook.com/reel/<id>` nếu cần): POMMI 1481938247140087, rái cá 923875293990577, đấm bốc 2163192597600790, kinh dị 1553224452628037, chim–lừa 1145232734859855.

## 7. Lịch sử vòng & backlog ưu tiên

| Vòng | Bản | Thay đổi chính | Điểm hội đồng |
| :--- | :--- | :--- | :--- |
| 1 | nháp Veo Lite | kịch bản mới (Ember & Tide, hồ nước cuối cùng, tha thứ), phong cách Pixar 3D | — (judge 3/12 cảnh đạt) |
| 2 | v1 round2 (Quality, 2 take) | khung đầu + khung cuối dạng sửa ảnh, handle hoạt hình, máy tĩnh ở OTS | **4.5** |
| 3 | v4_music | chọn đoạn theo nhịp diễn, nhạc Veo 3 đoạn, âm nền, tiếng va chạm | **5.0** |
| 4 | v5 | tách mọi pha va chạm thành cảnh 1 nhân vật (Veo Fast, 4s, 3 take), STAGE plate, ECU tha thứ | **5.5** |
| 5 | **v6 (hiện tại)** | cảnh đối đầu 2 nhân vật không chạm, Tide uống nước (hệ quả tha thứ), bỏ cú ngã (lược), cảnh 6/10 quay lại không lật, va chạm có lớp foley trung tần | **chưa chấm** |

**Backlog ưu tiên cho vòng tiếp theo** (từ hội đồng vòng 4 + tự kiểm tra v6; đánh dấu ✅ khi xong):
1. [ ] **Chấm v6** (mục 6) và cập nhật bảng trên.
2. [ ] **Ember trôi thiết kế** (lỗi lớn nhất còn lại; hội đồng đếm ~6 "phiên bản" Ember): cảnh 2 (giống hà mã bò 4 chân), 3 (vai tiền cảnh như thú bông), 4. Quay lại bằng Veo Fast 3 take, mô tả chặt hơn ("stocky baby T-rex, big round head, short stubby legs, stands on two hind legs, orange stripes on back and tail only"). Thêm bảng thiết kế nhân vật làm ảnh tham chiếu cho **giám khảo** để bắt trôi thiết kế (gửi kèm nguyên liệu cho Veo đã thử: không giúp được).
3. [ ] **Cảnh 9 (Ember lao)**: vòng 6 trượt 3/3 (thiết kế "bật ra khỏi khung"); đang dùng bản lao ngang vòng 5 cắt còn 0.7s. Thử: cảnh chèn bàn chân đạp bùn bật đi + vệt chuyển động, hoặc 3/4 trước lao thẳng vào ống kính 0.4s.
4. [ ] **Cảnh 15 (Ember né)**: có khối bóng đen lớn ở mép trên khung — kiểm tra có trông như lỗi hình không; nếu có, quay lại với "a soft moving shadow" hoặc chèn cận hàm Tide lướt qua.
5. [ ] **Cảnh 10 (Tide bật ngửa)** chỉ 0.6s và có vệt dịch tối ở hàm ở các take khác; cân nhắc quay thêm.
6. [ ] **Độ nét**: nguồn Veo 720p upscale lanczos; tự động hoá nút "Upscale 1080p" (miễn phí) của Flow trong `flow-ultra-bridge.mjs`.
7. [ ] **Đưa vòng lặp proto vào pipeline chính**: luật L12 (story room không lên cảnh 2 thân chạm nhau; va chạm = cắt trên hành động), L13 (clip 4s), L14 (Fast cho cảnh 1 nhân vật), L15 (STAGE plate), nhạc Veo + `proto_music_mix` vào Stage 7. Sau khi đưa vào phải chạy `npm run test:premium` + tsc.
8. [ ] Lóa góc trên phải (mặt trời) vẫn sáng hơn POMMI (tỉ lệ góc/tâm ~2.0 vs 1.29) — chỉ sửa được bằng bố cục khi vẽ keyframe.

## 8. Credit

Đã dùng ~**5.940 / 25.000** credit (Quality ~4.500 ở vòng 2–4; Fast ~340 ở vòng 5–6 + thử nghiệm; nhạc/âm nền 35; ảnh 0). Hạn mức tự đặt hiện tại: **8.000** — báo người dùng nếu cần vượt. Mỗi vòng sửa bằng Veo Fast (6 cảnh × 3 take) ≈ 180 credit.

## 9. Git

- Nhánh làm việc: xem `git log` / `git branch -a` — commit gần nhất có tiêu đề "handoff" là trạng thái bàn giao này. Muốn đưa vào `main` thì merge sau khi người dùng đồng ý.
- Snapshot trước nâng cấp (chỉ trên máy gốc): `refs/backup/pre-premium-upgrade`.
- Đường cũ vẫn chạy được để đối chứng: `--preset dino-legacy`.
