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

1. **Giai đoạn 1 (Bóc tách Kịch bản Kỹ thuật DOP — 0 Credit)**:
   - Gọi `Flow.generate.text` (`Omni 1.1 Flash`) bóc tách nhân vật, bối cảnh và danh sách phân cảnh (`shots`).
2. **Giai đoạn 2 (Đúc 3-Panel Character Sheet & Clean Environment Lock — 0 Credit)**:
   - Gọi `Flow.generate.image` (`🍌 Nano Banana Pro`) tạo ảnh 3-Panel Character Sheet trên nền xám `#808080` và ảnh Bối cảnh sạch không người.
   - Gọi `Flow.save` để lưu ảnh vào dự án Google Flow và gọi `Flow.host.createCharacter({ name, personality, assetQuery })` để tạo nhân vật trong tab **"Nhân vật"** (Ảnh 1).
3. **Giai đoạn 3 (Vẽ Storyboard Keyframes Start/End Frame — 0 Credit)**:
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

