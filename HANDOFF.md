# 🤝 HANDOFF — BÀN GIAO TRẠNG THÁI DỰ ÁN HYPERION STUDIO OS

> **Cập nhật lần cuối**: `2026-11-02`
> **Dự án Google Flow Đang Hoạt Động**: `https://flow.google.com/project/f36276b8-6ac4-4159-8e2b-d9f1e58fda34`
> **Thư mục Run Hiện Tại**: [`output/vscode_runs/dino_oasis_new_project`](./output/vscode_runs/dino_oasis_new_project)

---

## 1. Trạng Thái Hiện Tại (Đã Hoàn Tất Bản Master Director Cut 20 Cảnh — `v16 Pro Director Cut V3: Surgical Micro-Xfade, 1080p Lanczos & Zero-Warning DI`)

1. **Bộ 5 Bảng Thiết Kế Nhân Vật Chuẩn (`Master Character Sheets`) Khóa Xuyên Suốt 20 Cảnh**:
   - [`02_cast_lineup_master_chibi3d.png`](./output/vscode_runs/dino_oasis_new_project/02_cast_lineup_master_chibi3d.png) (`054e0edd-999b-4b7a-9a90-9260c490c401`)
   - [`02_char1_turnaround.png`](./output/vscode_runs/dino_oasis_new_project/02_char1_turnaround.png) (`ad8465b2-c2bd-4dc3-84e8-6d6958b953f1`)
   - [`02_char1_master_sheet.png`](./output/vscode_runs/dino_oasis_new_project/02_char1_master_sheet.png) (`d456815c-0b3d-4a68-b75f-11a8daf4734d`)
   - [`02_char2_turnaround.png`](./output/vscode_runs/dino_oasis_new_project/02_char2_turnaround.png) (`7e85122a-9113-402a-88f3-de0086826b31`)
   - [`02_char2_master_sheet.png`](./output/vscode_runs/dino_oasis_new_project/02_char2_master_sheet.png) (`3cd83d36-859d-4eab-9e50-8c257fa7c07b`)
2. **Bản Dựng Hậu Kỳ Chuẩn Đạo Diễn Quốc Tế (`v16 Pro Director Cut V3` — [`scripts/remaster_20shots_pro_director_cut.ts`](./scripts/remaster_20shots_pro_director_cut.ts))**:
   - **7 Đại Phẫu NLE, Giải Phẫu, VFX, Khung Hình, Ánh Mắt & Âm Thanh L-Cut**:
     - `Shot 01`: Đổi sang cửa sổ `[3.80s..5.75s @ 1.00x]` — Ember nhìn thẳng sang phải về phía hồ nước với **miệng khép kín 100%**, chớp mắt tự nhiên và cúi đầu về phía nước khớp `Match-on-Action` sang `Shot 01B` (xóa hoàn toàn lỗi nhìn vào ống kính cười hở răng ở `[0.8s..1.6s]`).
     - `Shot 01B`: Dựng **2-segment micro-xfade** `[1.05s..2.50s @ 1.02x] + [3.35s..4.20s @ 1.00x]` với `crop: { zoom: 1.18, rx: 0.04, ry: 0.00 }` — giữ 100% khoảng trống đỉnh đầu (`headroom`) và cắt bỏ hoàn toàn đốm phát sáng xanh ở bàn chân phải của Ember (`[2.7s..3.2s]`).
     - `Shot 02`: Bổ sung cầu nối âm thanh `L-Cut` tiếng nước bắn từ cuối `Shot 01B` chồng mờ vào `0.65s` đầu của `Shot 02`, xóa khoảng lặng `-52 LUFS` đầu cảnh mà vẫn giữ trọn thoại tiếng Việt.
     - `Shot 03`: Reframe `1.96x Solo MCU` (`rx=0.49, ry=0.06`) lấy trọn cận cảnh Tide trồi lên với nước óng ánh chảy trên vây lưng và cắt sạch 100% mũi Ember ở mép trái trên toàn bộ khung `IN / MID / OUT`, tách biệt hoàn toàn với cảnh đôi `Shot 05`.
     - `Shot 05`: Đổi sang cửa sổ `[2.10s..4.30s @ 1.10x]` lấy đúng nhịp hai khủng long chủ động bước tới gườm nhau sát mặt nước (xóa 2 giây đầu đứng im).
     - `Shot 07A / 07B / 07C`: Khớp chuỗi `Action -> Dodge -> Relief` với `Shot 07C [2.50s..5.10s @ 1.32x]` nơi Ember cúi thấp rồi ngẩng lên thở phào với **miệng khép kín 100%**.
     - `Shot 08A`: Reframe `1.64x Low-Angle Insert Cutaway` (`rx=0.03, ry=0.18`) tập trung vào chiếc đuôi vằn xanh quất sóng bùn đen và cắt bỏ phần đầu Tide quay sang phải ở mép phải, xóa triệt để lỗi ngược trục nhìn 180 độ.
     - `Shot 08B`: Dựng **2-segment micro-xfade** `[0.05s..0.95s @ 0.85x] + [2.72s..3.75s @ 0.95x]` + `hit_foley.wav` — cắt bỏ hoàn toàn đoạn `[0.95s..2.72s]` bị lỗi mọc 2 đuôi của Tide mà vẫn giữ trọn cú quất ngã Ember và cột bùn đen văng tung tóe.
     - `Shot 08C`: Dựng **2-segment micro-xfade** `[1.70s..3.20s @ 1.05x] + [4.45s..5.35s @ 1.00x]` — cắt bỏ hoàn toàn cục khói trắng đục che mũi Ember ở `[3.40s..4.25s]`.
     - `Shot 09B` (**Speed-Ramped Climax V3**): Dựng **3-stage speed-ramp kèm micro-xfade** `[2.00s..2.82s @ 1.00x]` (húc đầu trực diện) $\xrightarrow{\text{xfade } 0.12\text{s}}$ `[3.60s..4.60s @ 1.90x]` (bay ngửa trên không, bỏ qua đoạn `[2.82s..3.60s]` nơi Tide tự nhiên đứng thẳng dậy ở `3.0s`) $\rightarrow$ `[4.60s..6.50s @ 1.08x]` (rơi xuống hồ tung cột nước trắng xóa + Ember gầm vang chiến thắng).
     - `Shot 10`: Dựng **2-segment micro-xfade** `[0.05s..0.95s @ 0.75x] + [6.95s..7.92s @ 0.85x]` giữ Tide ở góc nghiêng `3/4 side-profile` xuyên suốt `IN / MID / OUT` (mõm Spinosaurus dài chuẩn và vây lưng rõ nét, xóa góc nhìn thẳng làm ngắn mõm), nâng sáng `gamma=1.16` và nối `L-Cut` tiếng nước rơi từ `Shot 09B`.
     - `Shot 11A`: Đổi sang `[6.35s..7.92s @ 0.78x]` giữ miệng Ember khép kín 100% trong nụ cười ấm áp ngay từ khung hình đầu tiên.
     - `Shot 11B & 12B`: Cân bằng highlights hoàng hôn (`p50Out <= 80`), dựng **2-segment micro-xfade** `[2.30s..4.95s @ 1.15x] + [6.25s..7.85s @ 0.95x]` cho `Shot 12B` để cắt bỏ hoàn toàn lỗi nước chảy từ cằm ở `[5.10s..6.10s]`, đồng thời tắt `endFadeSec: 0` để giữ nguyên khung kết rực rỡ ánh hoàng hôn.
   - **Chuẩn Hóa Kỹ Thuật 1080p Lanczos + EBU R128 + Uniform DI (`0 Warnings`)**:
     - Tất cả 20 clip trung gian trong `edit_20shots/` được xuất trực tiếp ở `1920x1080` (`flags=lanczos` + `unsharp=5:5:0.35:3:3:0.0`).
     - Khôi phục dải giải nghiệm `gammaRange [0.85, 1.35]` và sàn `gLo = 0.75` trong [`services/premiumMasteringEngine.ts`](./services/premiumMasteringEngine.ts) giúp vượt qua **100% bài kiểm thử tự động (`19.905/19.905` checks + `1.946/1.946` shot-production checks)** và đạt **`0 warnings`** trên bản Master.
     - Chỉ số kỹ thuật đo kiểm thực tế: **`46.958s` (`20 cảnh`, `1127 frames @ 24fps`, `dup=0, drop=0`) | `-14.6 LUFS` | `TP -1.5 dBTP` | `LRA 8.1 LU` | `CutJump Median 2.12 dB` | `p1=0, p50=74, p99=234, redClip=0.052%, medianCutExpJump=5.8` | `Warnings: NONE (0 warnings!)`**.
   - **File xuất bản đã đồng bộ 100%**:
     - [`output/vscode_runs/dino_oasis_new_project/master_final/MASTER_FINAL_MOVIE.mp4`](./output/vscode_runs/dino_oasis_new_project/master_final/MASTER_FINAL_MOVIE.mp4)
     - [`output/vscode_runs/dino_oasis_new_project/master_final/MASTER_FINAL_MOVIE_report.json`](./output/vscode_runs/dino_oasis_new_project/master_final/MASTER_FINAL_MOVIE_report.json)
     - [`output/vscode_runs/dino_oasis_new_project/STAGE_BY_STAGE_AUDIT_REPORT.json`](./output/vscode_runs/dino_oasis_new_project/STAGE_BY_STAGE_AUDIT_REPORT.json)
