# 📚 Tham Chiếu Chuyên Sâu: 6 Quy Chuẩn Vàng & Bảng Khắc Phục Lỗi `flow-sdk` (`MEM-01` -> `MEM-10`)

Tài liệu này là phụ lục kỹ thuật của skill `ai-film-studio`, tổng hợp từ [AGENT.md](../../../../AGENT.md), [MEMORY.md](../../../../MEMORY.md) và [context.md](../../../../context.md).

---

## 1. Công Thức Prompt Chuẩn Cho 3 Tài Sản Cốt Lõi (0 Credit — `🍌 Nano Banana Pro`)

### A. Prompt Bảng Tham Chiếu Nhân Vật 3 Góc Độ (`3-Panel Neutral Gray Reference Sheet`)
```text
16:9 three-panel character reference sheet split into 3 views: (1) close-up portrait of face and head details, (2) full-body front view standing straight, (3) full-body three-quarter back view. Subject: <MÔ_TẢ_CHI_TIẾT_NHÂN_VẬT_TIẾNG_ANH>. Isolated on a flat neutral gray studio background (#808080) with shadowless studio lighting, zero cast shadows, identical facial features, hairstyle, mole/scar placement, and costume details across all three angles, 8k photorealistic.
```

### B. Prompt Khóa Bối Cảnh Sạch Không Người (`Clean Environment Lock`)
```text
16:9 wide cinematic establishing shot of environment: <MÔ_TẢ_CHI_TIẾT_BỐI_CẢNH_TIẾNG_ANH>. STRICTLY EMPTY ENVIRONMENT: zero people, no humans, no characters, no crowds, no silhouettes, uninhabited clean architectural space, locked lighting and atmosphere, 8k photorealistic movie set plate.
```

### C. Prompt Khung Hình Storyboard Độ Phân Giải Đầy Đủ (`Full-Res Storyboard Start/End Frame` — Gọi `@TênNhânVật` & `[SKILL_...]`)
```text
16:9 full-resolution cinematic storyboard frame (SINGLE UNSPLIT WIDESCREEN FRAME, NO GRID). @<TÊN_NHÂN_VẬT> [CHARACTER: <TÊN_NHÂN_VẬT>] (<MÔ_TẢ_NHÂN_VẬT>) inside @STAGE: <TÊN_BỐI_CẢNH> [ENVIRONMENT LOCK: <TÊN_BỐI_CẢNH>] (<MÔ_TẢ_BỐI_CẢNH>). Invoking signature character folder skill/action: [<MÃ_CHIÊU_THỨC_SKILL_HOẶC_ACTION>]. Action: <MÔ_TẢ_HÀNH_ĐỘNG_CẢNH>. Camera: <GÓC_MÁY_VÀ_ỐNG_KÍNH>. Maintain 100% character anatomy, emotional soul, and combat posture from locked Character Folders and exact environment lighting from environment plate.
```

---

## 2. Bảng Tra Cứu Nhanh 10 Quy Tắc Kỹ Thuật Ngầm (`MEM-01` -> `MEM-10`)

| Mã | Quy tắc Kỹ thuật Bắt buộc |
| :--- | :--- |
| **`MEM-01`** | Mọi `prompt` gửi vào `Flow.generate.image` hoặc `Flow.generate.video` phải `.slice(0, 3800)` vì host Google Flow ném lỗi `Error("ll")` nếu dài quá `4000` ký tự. |
| **`MEM-02`** | Tham số `resolution` trong `Flow.generate.video` chỉ được truyền `"720p"` (cho `Veo 3.1`) hoặc `"360p"` (cho `Omni 1.1 Flash`). Không truyền `"1080p"` trực tiếp để tránh lỗi `Error("pl")`. |
| **`MEM-03`** | Khi đọc JSON từ `Flow.generate.text` (`Omni 1.1 Flash`), luôn tìm vị trí dấu `{` đầu tiên và `}` cuối cùng để lọc bỏ phần văn bản dẫn nhập. |
| **`MEM-04`** | Khi gọi `Flow.generate.image` hoặc `Flow.generate.video` có tham chiếu, truyền mảng `referenceImageMediaIds: [characterSheetMediaId, cleanEnvMediaId]` (tối đa 3 ID). |
| **`MEM-05`** | Khi gặp cảnh có `isDnaStateShift: true` (nhân vật biến hình, vỡ giáp, đổi trang phục), cập nhật `canvasMemoryAnchorMediaId` bằng `startKeyframeMediaId` của cảnh đó cho toàn bộ các cảnh kế tiếp. |
| **`MEM-06`** | Khi gọi MLLM Judge chấm điểm ảnh, chỉ truyền chuỗi Base64 của ảnh PNG (`startKeyframe` hoặc `lastFrame`), tuyệt đối không truyền chuỗi Base64 của file `.mp4` với nhãn `image/png`. |
| **`MEM-07`** | Khi gọi `Flow.generate.video` với cả `firstFrameImageMediaId` + `lastFrameImageMediaId` (Interpolation) trên `Veo 3.1`, bọc `try / catch` để tự động thử lại với `durationSeconds: 8` nếu `durationSeconds: 4` bị từ chối. |
| **`MEM-08`** | Khi quay lại (Retake) cảnh có `endKeyframeMediaId`, luôn truyền kèm `lastFrameImageMediaId` để không làm mất khóa điểm cuối. |
| **`MEM-09`** | Tiền tố tỷ lệ khung hình trong prompt (`16:9` hoặc `9:16`) phải đồng bộ với tham số `aspectRatio`. |
| **`MEM-10`** | **BẮT BUỘC NGAY TẠI GIAI ĐOẠN 2**: Dùng `Flow.host.createCharacter` để khóa mỗi nhân vật vào tab **"Nhân vật"** (`/project/<id>/character/<uuid>`) với **đầy đủ 3 phần**: **(1) Tab `Chân dung`** (Avatar), **(2) Tab `Tạo cơ thể` -> `Cơ thể`** (Gắn bảng thiết kế Full-Body 3 góc độ và tư thế hành động/chiêu thức), **(3) Ô `Thông tin nhân vật`** (Ghi rõ Chiều cao, Cân nặng, Tính cách/Linh hồn cảm xúc và Mã hành động/Chiêu thức `[ACTION_...]`, `[SKILL_...]`). Ở Giai đoạn 3 & 4, prompt gọi `@TênNhânVật` kèm `[SKILL_...]` để Google Flow lấy trọn bộ Folder nhân vật ra dựng cảnh. Dùng `Flow.host.createScene` ở Giai đoạn 6 để ghép các clip vào tab **"Cảnh"** (`Scenebuilder`). |

