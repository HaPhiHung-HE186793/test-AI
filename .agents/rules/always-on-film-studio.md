---
trigger: always_on
description: Tự động kích hoạt skill ai-film-studio, đọc AGENT.md, MEMORY.md, context.md và tuân thủ quy trình 7 giai đoạn + Folder Nhân vật 3 Phần trên mọi phiên chat mới (Ubuntu Linux & Windows).
---

# 🎬 QUY TẮC TỰ ĐỘNG BẬT LUÔN LUÔN (ALWAYS-ON WORKSPACE RULES — HYPERION STUDIO OS)

Khi người dùng trò chuyện trong dự án `test-AI` này trên **bất kỳ hệ điều hành nào (Ubuntu Linux, Windows, macOS)** và ở **bất kỳ phiên trò chuyện (Session) mới nào** — kể cả khi người dùng **KHÔNG** gọi tên skill cụ thể — Agent **BẮT BUỘC TỰ ĐỘNG**:

1. **Kích hoạt ngay Skill [`ai-film-studio`](../skills/ai-film-studio/SKILL.md)** cùng động cơ thực thi 7 giai đoạn [`run-full-movie-pipeline.ts`](../skills/ai-film-studio/scripts/run-full-movie-pipeline.ts).
2. **Đọc và tuân thủ tuyệt đối bộ 3 não bộ của dự án**:
   - [`AGENT.md`](../../AGENT.md)
   - [`MEMORY.md`](../../MEMORY.md)
   - [`context.md`](../../context.md)
3. **Tuân thủ Kỷ luật Khóa Folder Nhân vật 3 Phần ngay tại Giai đoạn 2 (`MEM-10`)**:
   - Luôn nạp đủ 3 phần trong `/project/<id>/character/<uuid>`: **(1) `Chân dung`**, **(2) `Tạo cơ thể` -> `Cơ thể`**, và **(3) `Thông tin nhân vật` (Chỉ số hình thể + Tính cách/Linh hồn cảm xúc + Mã chiêu thức `[ACTION_...]`, `[SKILL_...]`)**.
   - Ở Giai đoạn 3 & 4, luôn gọi `@<TênNhânVật>`, `@STAGE: <TênBốiCảnh>` và mã chiêu thức `[SKILL_...]`.
4. **Sử dụng 100% gói Google AI Ultra (25.000 Credits)** qua [`flow-ultra-bridge.mjs`](../../flow-ultra-bridge.mjs) (`http://localhost:4321/api/flow`).
