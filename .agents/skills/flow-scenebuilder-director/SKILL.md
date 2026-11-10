---
name: flow-scenebuilder-director
description: >-
  Use this skill whenever producing, directing, extending, or editing any video or film scene on Google Flow (flow.google.com). Enforces the SceneBuilder-First Zero-Hitch Continuous Filmmaking architecture (/project/:projectId/scene/:sceneId): using the outer project grid only for @Character, @Environment, and initial Seed Clips, then executing all direct shot editing (Tkc), continuous zero-hitch extensions (Pkc / VIDEO_EXTEND), mandatory head verification and redo/edit before auto-merge (Kkc / sZ=true), and avoiding the middle-split jump-cut trap (ukc).
---

# 🎬 Google Flow `SceneBuilder` Core Director (`flow-scenebuilder-director`)

Skill này trang bị cho Agent quy trình **Đạo Diễn & Dựng Phim Cốt Lõi Không Độ Khựng (`SceneBuilder-First Zero-Hitch Continuous Filmmaking`)** trên Google Flow (`https://flow.google.com/project/:projectId/scene/:sceneId`), dựa trên toàn bộ kho tri thức gốc của dự án:
1. [GOOGLE_FLOW_SCENEBUILDER_CORE_DIRECTING_AND_AUTO_MERGE_BIBLE.md](../../../GOOGLE_FLOW_SCENEBUILDER_CORE_DIRECTING_AND_AUTO_MERGE_BIBLE.md) *(Kiến trúc `SceneBuilder` `m38dl`: Seed Clip ➔ In-Scene Edit `Tkc` ➔ Extend `Pkc` ➔ Verify/Redo Head `Kkc` ➔ Auto-Merge)*
2. [GOOGLE_FLOW_MASTER_KNOWLEDGE_BASE.md](../../../GOOGLE_FLOW_MASTER_KNOWLEDGE_BASE.md)
3. [GOOGLE_FLOW_MASTER_EXECUTION_PIPELINE_AND_CASES.md](../../../GOOGLE_FLOW_MASTER_EXECUTION_PIPELINE_AND_CASES.md)
4. [GOOGLE_FLOW_PRODUCTION_CONTINUITY_SOP.md](../../../GOOGLE_FLOW_PRODUCTION_CONTINUITY_SOP.md)
5. [FLOW_MUSIC_MASTER_KNOWLEDGE_BASE.md](../../../FLOW_MUSIC_MASTER_KNOWLEDGE_BASE.md)

> [!CAUTION]
> **QUY TẮC KHÓA BẢO VỆ TÀI LIỆU (`AI_EDIT_MODE: OFF`)**:
> Cả 5 file `.md` kho tri thức gốc trên đều đang ở trạng thái **`AI_EDIT_MODE: OFF` (CHỈ ĐỌC — CẤM CHỈNH SỬA)**. Agent chỉ được phép đọc (`read_file`) để áp dụng quy trình, tuyệt đối không được sửa hoặc ghi đè trừ khi người dùng ra lệnh mở khóa `AI_EDIT_MODE: ON` cho từng file cụ thể (và phải khóa lại về `OFF` ngay sau khi sửa xong).

---

## 🛡️ 5 Nguyên Tắc Vàng Bắt Buộc Của `SceneBuilder-First` (Không Bao Giờ Được Vi Phạm)

1. **CẤM Tạo Hàng Loạt Shot Rời Ngoài Màn Chính Rồi Chỉ Dùng `SceneBuilder` Để Ghép Nối Cơ Học**:
   - Tạo 10–16 clip 8 giây độc lập ngoài màn `Project Grid` (`START_END_FRAMES` / `START_FRAME`) rồi xếp nối đuôi vào Scene sẽ gây **độ khựng (`v = 0` tại điểm đầu và cuối mỗi shot)** vì mỗi clip khởi động từ ảnh tĩnh và phanh về ảnh tĩnh.
   - Màn ngoài (`/project/:projectId`) **chỉ dùng để tạo**:
     1. Thực thể `@Character` khe kép (`Chân dung` + `Cơ thể 3 góc`) và `@Environment` (Ảnh tĩnh `Nano Banana Pro` `0 Credit`).
     2. **Video Mẫu Mồi (`Seed Clip` ban đầu)** để có cái đưa vào `SceneBuilder` (vì màn `SceneBuilder` không tạo được ảnh tĩnh và không thể tự khởi tạo mới một shot khi Timeline đang trống).

2. **Màn `SceneBuilder` (`/project/:projectId/scene/:sceneId`) Là Trung Tâm Làm Phim & Chỉnh Sửa Trực Tiếp (`Tkc` / `U3`)**:
   - Ngay khi đã đưa `Seed Clip` vào `SceneBuilder` (`oWTRd`), mọi thao tác tinh chỉnh, sửa lại hoặc tạo lại shot **đều thực hiện trực tiếp ngay trong màn `SceneBuilder`**.
   - Chỉ cần click chọn shot đó trên Timeline (`this.Ja()` = `workflowId`, `this.Tk()` = `primaryMediaId`) và gõ yêu cầu vào thanh Prompt của `SceneBuilder` (như lúc tạo shot bình thường). Hàm `Tkc` sẽ gọi `generate_video_into_workflow` (`destination: { workflowId }`) để sửa trực tiếp shot đó ngay trong Scene và lưu mọi phiên bản vào cột History (`scene.Qf.get(workflowId)`).

3. **Dùng `Kéo Dài (Extend)` Trực Tiếp Trong `SceneBuilder` Để Triệt Tiêu 100% Độ Khựng (`Pkc` / `Cfc` / `fZytfe`)**:
   - Muốn cảnh diễn biến tiếp như thế nào, chọn ngay Shot đó trên Timeline của `SceneBuilder`, bật chế độ **`Kéo dài` (`VIDEO_EXTEND`)** và nêu rõ yêu cầu hành động tiếp theo trong ô Prompt.
   - Hệ thống sẽ lấy **24 frames cuối** (`Veo 3.1 Extend`) hoặc **tối đa 240 frames / 10s cuối** (`Omni 1.2 Flash Extend`) của cảnh đang chạy để nối tiếp với cùng vector vận tốc tức thời ($\vec{v}_{\text{cuối}} = \vec{v}_{\text{đầu}}$) $\implies$ **tự động thực hiện tiếp mà hoàn toàn 0 độ khựng**.

4. **Chốt Kiểm Duyệt Đầu Ngọn (`sZ = true`) & Tạo Lại/Sửa Ngay Trước Khi `Auto-Merge` (`Kkc` / `Tkc`)**:
   - **QUY TẮC SỐNG CÒN**: Ngay sau mỗi lần bấm `Kéo dài` (Lần $N$), đoạn vừa kéo dài vẫn đang ở trạng thái **đầu ngọn (`sZ = true`)** và giữ con trỏ `ky` trỏ về video gốc trước khi kéo dài (`e = b.uc.find(_.Uv).mediaId`).
   - Phải **kiểm tra ngay lập tức** xem đoạn vừa kéo dài đã đúng logic, khớp nội dung và đủ chi tiết chưa:
     - **Nếu CHƯA chuẩn hoặc thiếu chi tiết**: Bấm vào cảnh đó ngay trong `SceneBuilder`, bấm **Tạo lại đoạn kéo dài (`BV` $\rightarrow$ `Kkc` / `SceneBuilder.redoExtend`)** hoặc **Sửa bằng Prompt bổ sung (`Tkc`)** ngay tại thời điểm đó! Hệ thống sẽ sửa đúng đoạn dài vừa thêm cho đến khi chuẩn 100%.
     - **Chỉ khi ĐÃ chuẩn 100%**: Mới được phép bấm **`Kéo dài` bước tiếp theo (Lần $N+1$)**!
   - Vì ngay khi bấm `Kéo dài` lần $N+1$, hệ thống sẽ **tự động Merge (`Auto-Merge`) đoạn kéo dài cũ ($N$) vào Shot gốc (`primaryMediaId`)**, cập nhật con trỏ `ky` mới, khiến đoạn kéo dài cũ ($N$) bị khóa cứng vào Shot gốc và **không thể sửa lẻ được nữa** (chỉ sửa được đoạn kéo dài mới nhất $N+1$).

5. **Tránh Bẫy Cắt Đoạn (`Split` / `ukc`) Để Sửa Đoạn Cũ Đã Merge**:
   - Nếu đã để hệ thống Auto-Merge đoạn kéo dài cũ vào Shot gốc rồi mới dùng công cụ **Cắt đoạn (`Split` / `ukc`)** cắt khúc giữa ra để sửa bằng Prompt (`Tkc`), mô hình AI khi vẽ lại khúc giữa sẽ **không biết và không khóa cứng đồng thời cả đầu lẫn cuối với 2 cảnh trước/sau mà nó vừa cắt**, dẫn đến **bị lệch cảnh (`Jump-Cut`)** so với 2 cảnh trước và sau!

---

## 🚀 Quy Trình Thực Thi Từng Bước Khi Nhận Yêu Cầu Làm Video Trên Google Flow

1. **Bước 1 — Đọc Đầy Đủ 5 Kho Tri Thức Gốc**:
   - Đọc `GOOGLE_FLOW_SCENEBUILDER_CORE_DIRECTING_AND_AUTO_MERGE_BIBLE.md`, `GOOGLE_FLOW_MASTER_EXECUTION_PIPELINE_AND_CASES.md`, và `GOOGLE_FLOW_PRODUCTION_CONTINUITY_SOP.md`.
2. **Bước 2 — Tiền Kỳ & Tạo `Seed Clip` Ở Màn Ngoài (`/project/:projectId`)**:
   - Tạo và khóa `@Character` khe kép (`Chân dung` + `Cơ thể 3 góc`) + `@Environment` bằng `🍌 Nano Banana Pro` (`0 Credit`).
   - Tạo **1 Video mẫu mở đầu (`Seed Clip`)** cho phân cảnh và đưa ngay vào `SceneBuilder` (`/project/:projectId/scene/:sceneId` qua RPC `oWTRd`).
3. **Bước 3 — Đạo Diễn Trực Tiếp Trong `SceneBuilder` (`/scene/:sceneId`)**:
   - Kiểm tra `Seed Clip` trong `SceneBuilder`. Nếu cần tinh chỉnh, chọn `Seed Clip` trên Timeline và sửa trực tiếp qua ô Prompt của `SceneBuilder` (`Tkc`).
   - Thực hiện vòng lặp **Kéo dài liên hoàn không độ khựng**:
     - Chọn Shot trên Timeline ➔ Bật `Kéo dài (Extend)` ➔ Nhập Prompt Tiếng Anh 4 thành phần (`Camera Trajectory` + `Subject & Anatomy Lock` + `Next Action & Lighting` + `Continuous Audio`) ➔ Chạy (`Pkc` / `fZytfe`).
     - **Kiểm tra đầu ngọn (`Verify Head`)**: Xem kỹ đoạn vừa nối thêm. Nếu sai logic hoặc thiếu chi tiết ➔ Bấm vào cảnh đó trong `SceneBuilder` để **Redo Extend (`Kkc`)** hoặc **Edit (`Tkc`)** cho đến khi chuẩn 100%.
     - Khi đã chuẩn 100% ➔ Bấm `Kéo dài` nhịp tiếp theo (kích hoạt `Auto-Merge` đoạn cũ vào Shot gốc) và lặp lại cho đến khi hoàn thành trọn vẹn cảnh phim!
