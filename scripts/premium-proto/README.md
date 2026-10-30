# `scripts/premium-proto/` — vòng lặp làm phim Premium bằng tay (đã kiểm chứng trên render thật)

Các script này là "dây chuyền thử nghiệm" đã tạo ra bản phim `output/vscode_runs/dino_premium_v2` (v1 → v6).
Chúng dùng **cùng engine** với pipeline chính (`services/premiumPromptEngine.ts`, `services/premiumMasteringEngine.ts`)
nhưng cho phép làm từng vòng nhỏ: sửa vài cảnh, quay lại vài take, chọn đoạn bằng mắt, dựng lại.
Đọc `HANDOFF.md` ở gốc dự án trước khi dùng.

Mọi đường dẫn là tương đối với gốc dự án → chạy được trên Windows / Ubuntu / macOS sau `npm install`.

| Script | Việc | Tốn credit? |
| :--- | :--- | :--- |
| `proto_stage123.ts <runDir> [--shots N] [--style pixar3d] [--only-keyframes 1,2]` | Story room (nếu chưa có `bible.json`) → bảng nhân vật → ảnh bối cảnh → khung đầu + khung cuối (sửa từ khung đầu) cho mọi cảnh trong `bible.json`. Ảnh nào đã có (file + mediaId trong `state.json`) thì bỏ qua. | 0 (Nano Banana Pro) |
| `proto_stage47.ts <runDir> --tag final --model "Veo 3.1 - Fast" --takes 3 --duration 4 [--only 9,10] [--parallel 2] [--master-only]` | Render video từ khung đầu + khung cuối, giám khảo khung dày (prompt gọn < 3.300 ký tự) chọn take tốt nhất → `shot_XX_<tag>_best.mp4`, rồi dựng master tự động. `--master-only` = không render mới, chỉ chấm lại take chưa có phán quyết + dựng. | Fast 10 / Quality 100 mỗi take |
| `proto_master.ts <runDir> --tag final --out <thư_mục> --override "1=edit_r6/shot_01_edit.mp4,..."` | Dựng master từ các clip đã cắt tay (khoá cứng `forceWindow`), giữ đúng thứ tự `bible.json`. | 0 |
| `proto_music_mix.py <runDir> <master.mp4> <out.mp4> "<mốc cắt>" <idxNhạcĐánh> <idxVaChạm> <idxNhạcKết> [<idxBẹpBùn>]` | Trộn nhạc 3 đoạn + âm nền + tiếng va chạm nhiều lớp + khoảng lặng trước va chạm lên stem Veo, gain tĩnh về -14 LUFS. | 0 |
| `proto_audio.ts <runDir>` | Tạo âm nền + 3 đoạn nhạc bằng Veo (render bối cảnh trống, prompt `Music: ...`). | ~35 |
| `proto_stage_plate.ts <runDir>` | Tạo "STAGE plate" (bối cảnh khoá cho chuỗi hành động) bằng cách SỬA ảnh bối cảnh gốc. | 0 |

Lệnh npm tương ứng: `npm run proto:keyframes|proto:render|proto:master|proto:audio|proto:stage-plate|proto:mix -- <tham số>`.

**Quy tắc cắt clip dựng tay** (để `proto_master` khoá đúng đoạn): `ffmpeg -ss (in-0.25) -t (out-in+0.7) -i <take> ... edit_rN/shot_XX_edit.mp4`
(đặt `-t` TRƯỚC `-i`; nếu muốn giữ khung cuối thêm thì `-vf tpad=stop_mode=clone:stop_duration=1.4 -af apad=pad_dur=1.4`).
Bảng quyết định dựng của bản hiện hành: `output/vscode_runs/dino_premium_v2/EDL_v6.json`.

**Không chạy 2 script cùng lúc trên một runDir** — cả hai cùng ghi `state.json` và sẽ ghi đè lẫn nhau.
**Không thao tác trên cửa sổ Chrome đang điều khiển Flow** trong lúc render (tab bị chuyển → lệnh treo).
