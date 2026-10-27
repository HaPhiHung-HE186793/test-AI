# 🎬 QUY TẮC TỰ ĐỘNG BẬT LUÔN LUÔN (ALWAYS-ON WORKSPACE RULES — HYPERION STUDIO OS)

Khi người dùng trò chuyện trong dự án `test-AI` này trên **bất kỳ hệ điều hành nào (Ubuntu Linux, Windows, macOS)** và ở **bất kỳ phiên trò chuyện (Session) mới nào** — kể cả khi người dùng **KHÔNG** gọi tên skill cụ thể, chỉ cần đưa ý tưởng, nội dung kịch bản, yêu cầu làm video/phim/quảng cáo hoặc chỉnh sửa dự án — Agent **BẮT BUỘC TỰ ĐỘNG**:

1. **Kích hoạt ngay Skill [`ai-film-studio`](./.agents/skills/ai-film-studio/SKILL.md)** cùng động cơ thực thi 7 giai đoạn [`run-full-movie-pipeline.ts`](./.agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts).
2. **Đọc và tuân thủ tuyệt đối bộ 3 não bộ của dự án**:
   - **Sổ tay Đạo diễn & Quy trình 7 Giai đoạn**: [`AGENT.md`](./AGENT.md)
   - **Trí nhớ Thực chiến & 10 Quy tắc Khắc phục Lỗi (`MEM-01` -> `MEM-10`)**: [`MEMORY.md`](./MEMORY.md)
   - **Hồ sơ Kiến trúc Kỹ thuật Dự án**: [`context.md`](./context.md)
3. **Tuân thủ Kỷ luật Khóa Folder Nhân vật 3 Phần ngay tại Giai đoạn 2 (`MEM-10`)**:
   - Mọi nhân vật chính/phụ sau khi tạo 3-Panel Reference Sheet (`#808080`) phải được khóa ngay vào tab **"Nhân vật"** (`/project/<id>/character/<uuid>`) bằng `Flow.host.createCharacter` với **đầy đủ 3 thành phần**:
     1. **Tab `Chân dung`**: Avatar diện mạo cận cảnh.
     2. **Tab `Tạo cơ thể` -> `Cơ thể`**: Bảng thiết kế Full-Body 3 góc độ và tư thế hành động/chiêu thức.
     3. **Ô `Thông tin nhân vật` (`textarea[aria-label="Tính cách của nhân vật"]`)**: Đầy đủ **(a) Chỉ số hình thể (Chiều cao, cân nặng, giải phẫu)**, **(b) Tính cách & Linh hồn cảm xúc**, và **(c) Mã Hành động & Chiêu thức đặc trưng (`[ACTION_...]`, `[SKILL_1_...]`, `[SKILL_2_...]`)**.
   - Bối cảnh sạch không người (`Clean Environment Lock`) phải được khóa ngay vào thư viện thực thể (`STAGE: <Tên Bối Cảnh>`).
   - Ở Giai đoạn 3 (Storyboard) & Giai đoạn 4 (Video), prompt bắt buộc gọi `@<TênNhânVật>`, `@STAGE: <TênBốiCảnh>` kèm mã chiêu thức `[SKILL_...]` để Google Flow lấy trọn bộ Folder nhân vật ra dựng cảnh.
4. **Sử dụng 100% gói Google AI Ultra (25.000 Credits)** của người dùng thông qua Cầu nối Local [`flow-ultra-bridge.mjs`](./flow-ultra-bridge.mjs) (`http://localhost:4321/api/flow`), tuyệt đối không dùng API thu phí bên ngoài.
