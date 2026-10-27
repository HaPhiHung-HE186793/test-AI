# 🎬 Hyperion Studio OS — AI Film Studio (7-Stage Industrial Pipeline on Google Flow Ultra)

Hệ thống sản xuất phim AI công nghiệp **7 giai đoạn** vận hành trực tiếp trên **VS Code / Antigravity** (hỗ trợ đồng bộ 100% trên **Ubuntu Linux**, **Windows**, **macOS**), kết nối sang gói **Google AI Ultra (25.000 Credits)** của bạn thông qua Cầu nối Local RPC (`flow-ultra-bridge.mjs`).

---

## 🧠 Tự Động Nạp Toàn Bộ Quy Trình & Skill Khi Mở Session Mới (Ubuntu & Windows)

Dự án đã tích hợp sẵn **Cơ chế Tự Động Kích Hoạt Luôn Luôn (Always-On Workspace Rules + Auto-Discovered Skills)** ngay trong Git repo:
- **[`AGENTS.md`](./AGENTS.md)** & **[`.agents/rules/always-on-film-studio.md`](./.agents/rules/always-on-film-studio.md)**: Quy tắc tự bật ở **mọi cửa sổ chat (Session) mới** mà không cần gọi tên skill.
- **[`.agents/skills/ai-film-studio/SKILL.md`](./.agents/skills/ai-film-studio/SKILL.md)**: Bộ Skill điều phối 7 giai đoạn chuẩn Studio thế giới.
- **[`.agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts`](./.agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts)**: Động cơ thực thi tự động từ Kịch bản -> Khóa Folder Nhân vật 3 Phần (`Chân dung` + `Tạo cơ thể` + `Thông tin/Chiêu thức`) -> Khóa Bối cảnh sạch -> Vẽ Storyboard -> Quay Video `Veo 3.1` -> Ghép vào tab `"Cảnh"` (`Scenebuilder`) -> Xuất `.MP4` & `.SRT`.
- **Bộ 3 Não Bộ Cốt Lõi**:
  1. **[`AGENT.md`](./AGENT.md)**: Sổ tay Đạo diễn & Quy trình SOP 7 giai đoạn.
  2. **[`MEMORY.md`](./MEMORY.md)**: 10 quy tắc khắc phục lỗi ngầm của `flow-sdk` (`MEM-01` -> `MEM-10`).
  3. **[`context.md`](./context.md)**: Hồ sơ kiến trúc kỹ thuật dự án.

---

## 🐧 Hướng Dẫn Kéo Về & Chạy Ngay Trên Máy Ubuntu Linux Ở Công Ty (3 Bước)

### Bước 1: Clone dự án & cài đặt tự động (Tự cài Global Skill + `ffmpeg` cho Ubuntu)
```bash
git clone https://github.com/HaPhiHung-HE186793/test-AI.git
cd test-AI
npm install
```
*(Khi chạy `npm install`, script [`scripts/setup-cross-platform.mjs`](./scripts/setup-cross-platform.mjs) sẽ **tự động** copy bộ skill `ai-film-studio` vào `~/.gemini/config/skills/ai-film-studio` và `~/.gemini/antigravity/skills/ai-film-studio` trên máy Ubuntu của bạn, đồng thời cấp quyền thực thi `chmod +x` cho `ffmpeg`).*

### Bước 2: Mở trình duyệt Chrome ở cổng Debug `9222` & Đăng nhập Google Flow Ultra
```bash
npm run chrome
```
*(Hoặc chạy trực tiếp trên terminal Ubuntu: `google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.chrome-flow-ultra-profile" https://flow.google.com &` — đăng nhập tài khoản Google AI Ultra và mở dự án có công cụ `Hyperion Studio OS`).*

### Bước 3: Mở thư mục `test-AI` bằng VS Code / Antigravity và Chat trực tiếp!
Khi bạn mở cửa sổ trò chuyện (Session) mới trong thư mục `test-AI` và nhắn yêu cầu làm phim:
- AI sẽ **tự động đọc `AGENTS.md`, `AGENT.md`, `MEMORY.md`, `context.md` và kích hoạt skill `ai-film-studio`**.
- AI sẽ tự động bật cầu nối `npm run bridge` (`http://localhost:4321`) và chạy toàn bộ quy trình 7 giai đoạn (tạo đủ 3 phần của Folder Nhân vật: `Chân dung` + `Tạo cơ thể` + `Thông tin nhân vật & Chiêu thức [SKILL_...]`).

---

## ⚡ Bảng Lệnh Nhanh (Ubuntu Linux & Windows)

| Lệnh | Chức năng |
| :--- | :--- |
| `npm run setup` | Đồng bộ lại Skill `ai-film-studio` vào thư mục Global của máy hiện tại |
| `npm run chrome` | Mở Google Chrome ở cổng Debug `9222` trỏ tới `https://flow.google.com` |
| `npm run bridge` | Khởi động Cầu nối Local RPC (`http://localhost:4321/api/flow`) |
| `npm run skill:storyboard -- --script "Kịch bản..." --shots 6` | Chạy Giai đoạn 1 -> 3 (**0 Credit** — Tạo Kịch bản + Khóa Folder Nhân vật 3 Phần + Bối cảnh + Storyboard) |
| `npm run skill:movie -- --script "Kịch bản..." --shots 6 --model "Veo 3.1 - Lite"` | Chạy trọn vẹn Giai đoạn 1 -> 7 và xuất file `MASTER_FINAL_MOVIE.mp4` + `.SRT` |
