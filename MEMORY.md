# 🧠 MEMORY.MD — TRÍ NHỚ THỰC CHIẾN CỦA AI (HYPERION STUDIO OS)

> **Vai trò của file này (`MEMORY.MD = Trí nhớ của AI`)**: Lưu giữ **tới từng chân tơ kẽ tóc** các quy tắc bất di bất dịch, bài học xương máu từ thực chiến tạo phim trên Google Flow, các ràng buộc kỹ thuật ngầm của `flow-sdk`, và các lỗi đã khắc phục để không bao giờ lặp lại sai lầm trong các phiên làm việc tiếp theo.
> - Kết nối cùng: **[AGENT.md](file:///d:/myProject/test-AI/AGENT.md)** *(Sổ tay nhân viên & SOP 6 bước)* và **[context.md](file:///d:/myProject/test-AI/context.md)** *(Kho tài liệu chuyên sâu & Hồ sơ dự án)*.

---

## ✅ 1. CÁC QUY TẮC VÀNG BẤT DI BẤT DỊCH KHI DÙNG GOOGLE FLOW (CHECKLIST THỰC CHIẾN)

- [x] **1. Ảnh Tham Chiếu Nhân Vật (`Character Reference Sheet`) BẮT BUỘC là bố cục 3 Góc Độ trên Nền Xám Phẳng (`#808080`) Không Bóng Đổ**:
  - **Kinh nghiệm xương máu**: Nếu tạo ảnh nhân vật đơn lẻ hoặc đặt trên nền có đèn màu / bóng đổ mạnh, mô hình AI sẽ **sao chép nguyên xi ánh sáng và bóng đổ đó** vào mọi cảnh quay sau (kể cả cảnh có điều kiện ánh sáng khác).
  - **Công thức chuẩn**: Tạo 1 ảnh `16:9` chứa **3 panels**: `(1) Cận cảnh khuôn mặt (Close-up face)` + `(2) Toàn thân phía trước (Full-body front)` + `(3) Toàn thân góc 3/4 phía sau (Full-body 3/4 back)` trên **nền xám phẳng trung tính, không đổ bóng (`flat neutral gray background #808080, shadowless studio lighting`)**. Giữ nguyên vị trí các chi tiết nhỏ (nốt ruồi, kiểu tóc, vết sẹo, hoa văn giáp) ở cả 3 góc.
- [x] **2. Ảnh Tham Chiếu Bối Cảnh (`Environment Lock`) BẮT BUỘC Phải "Sạch" 100% (Tuyệt Đối Không Có Người)**:
  - **Kinh nghiệm xương máu**: Nếu ảnh bối cảnh có xuất hiện người hoặc bóng người, khi ghép chung với ảnh tham chiếu nhân vật, AI sẽ có **2 phiên bản người khác nhau** -> Gây **nhầm lẫn danh tính (Identity Confusion)**, làm xuất hiện sai nhân vật hoặc làm biến đổi môi trường ngẫu nhiên giữa các đoạn video.
  - **Công thức chuẩn**: Dùng `🍌 Nano Banana Pro` tạo ảnh bối cảnh `16:9` với khóa cứng: `STRICTLY EMPTY ENVIRONMENT: zero people, no humans, no characters, no silhouettes, uninhabited clean architectural space`.
- [x] **3. Storyboard Phải Tạo Từng Khung Hình Riêng Lẻ ở Độ Phân Giải Đầy Đủ (Tối thiểu 6 Khung) & Gắn Nhãn Tên Nhân Vật**:
  - **Kinh nghiệm xương máu**: Tuyệt đối **không** bảo AI tạo tất cả các cảnh trong 1 bức ảnh chia ô (grid) duy nhất vì mỗi ô sẽ bị vỡ nét và không thể nạp làm `firstFrameImageMediaId` (Start Frame) cho mô hình video.
  - **Công thức chuẩn**: Tạo từng khung Storyboard một ở độ phân giải đầy đủ `16:9`. Trong mỗi khung, **gắn nhãn (tag) tên nhân vật** (ví dụ: `[CHARACTER: Yuri]` hoặc `[CHARACTER: THIÊN VƯƠNG-09]`) để hệ thống kéo trực tiếp khuôn mặt từ ảnh tham chiếu nhân vật vào bối cảnh đã khóa.
- [x] **4. Ưu Tiên `Veo 3.1` Cho Độ Nhất Quán Cao Nhất (`Veo 3.1` > `Omni 1.1 Flash` về độ ổn định)**:
  - **Kinh nghiệm thực nghiệm**: Qua so sánh trực tiếp trên Google Flow (`[05:09 - 08:15]`), **`Veo 3.1` (`Veo 3.1 - Fast` / `Lite` / `Quality`) cho kết quả nhất quán hơn hẳn với rất ít lỗi hiển thị (glitches)** so với `Omni 1.1 Flash`.
  - **Khi nào dùng `Omni 1.1 Flash`**: Dùng khi cần phân tích kịch bản văn bản (`Flow.generate.text`), chấm điểm VQQA Judge, linh hoạt thời lượng nháp hoặc chạy **Video-to-Video Edit (`sourceVideoMode: 'edit'`)**.
- [x] **5. Dùng Cặp `First Frame` + `Last Frame` Để Khóa Chuyển Động Phức Tạp Không Cần Hậu Kỳ**:
  - **Kinh nghiệm xương máu**: Với các cảnh biến hình, bay vọt hoặc chuyển trạng thái lớn, chỉ truyền Start Frame sẽ khiến nửa cuối video dễ bị trôi. Khi truyền cả **`firstFrameImageMediaId` (Khung đầu)** và **`lastFrameImageMediaId` (Khung cuối)**, AI sẽ tự động nội suy chuyển động trung gian mượt mà nối liền 2 trạng thái.
- [x] **6. Chỉnh Sửa Video Có Sẵn (`Video-to-Video VFX Edit`) Thay Vì Quay Lại Từ Đầu**:
  - **Kinh nghiệm thực chiến**: Có thể tải video tự quay hoặc video đã tạo lên (`Flow.media.select({ filter: 'video' })`) và dùng `sourceVideoMediaId` + `sourceVideoMode: 'edit'` để yêu cầu AI thêm hiệu ứng (như tạo cảnh tuyết rơi, mưa axit, khói lửa) trong khi vẫn giữ nguyên bố cục và chuyển động gốc của video.

---

## 🛠️ 2. NHẬT KÝ CÁC GIỚI HẠN NGẦM CỦA `FLOW-SDK` & LỖI KỸ THUẬT ĐÃ KHẮC PHỤC

| Mã Nhớ | Vấn đề / Lỗi từng gặp trong Code & Host SDK | Nguyên nhân gốc rễ (Root Cause) | Giải pháp Kỹ thuật đã khóa vào Bộ nhớ |
| :--- | :--- | :--- | :--- |
| **`MEM-01`** | Lỗi `Error("ll")` khi gọi `Flow.generate.image` hoặc `Flow.generate.video` với prompt dài | Hàm kiểm duyệt `Hnc` trong gói host `m=wO1vlb` của Google Flow kiểm tra cứng `if (a.length > 4E3) throw Error("ll")`. | Mọi hàm tạo prompt trong `actionDirectorEngine.ts` và `productionPipeline.ts` bắt buộc phải cắt an toàn ở mức **`<= 3800` ký tự**. |
| **`MEM-02`** | Lỗi `Error("pl")` khi truyền `resolution: "1080p"` trực tiếp vào `Flow.generate.video` | Hàm `Lnc` (`jkc`) trong `m=wO1vlb` chỉ cho phép `c === 4` (`"360p"`) hoặc `c === 1` (`"720p"`) ở lệnh gọi `generate.video`. | Khi gọi `Flow.generate.video`, chỉ truyền `"360p"` (cho `Omni 1.1 Flash`) hoặc `"720p"` (cho `Veo 3.1`). Việc nâng cấp lên `1080p Full HD` / `4K` thực hiện ở bước xuất bản hậu kỳ. |
| **`MEM-03`** | Kẹt tiến trình ở bước `extracting_script` (`SyntaxError: Unexpected token`) | `Omni 1.1 Flash` đôi khi trả lời thêm câu dẫn tiếng Việt trước hoặc sau khối ` ```json ... ``` `. | Bắt buộc dùng hàm [`extractJsonObject(rawText)`](file:///d:/myProject/test-AI/services/actionDirectorEngine.ts#L24-L44) tìm vị trí dấu `{` đầu tiên và `}` cuối cùng kèm khử dấu phẩy thừa. |
| **`MEM-04`** | Mất khe tham chiếu `[IMAGE 2]` & `[IMAGE 3]` khi chạy tự hành | Code cũ gọi `setEntities` bất đồng bộ rồi ghi đè `shot.referenceSlots` về mảng 1 phần tử. | Truyền trực tiếp mảng `updatedEntities` và `updatedStages` vừa đúc xong vào [`buildAutoBoundReferenceSlots`](file:///d:/myProject/test-AI/services/autoBindIngredients.ts#L15-L79) để giữ đủ 3 khe tham chiếu. |
| **`MEM-05`** | Giáp nhân vật bị "lành lặn lại như mới" sau cảnh bị thương nổ giáp | Không cập nhật ảnh tham chiếu nhân vật sau cảnh biến cố (`isDnaStateShift`). | Khi `shot.isDnaStateShift === true`, lập tức lấy `mediaId` của Keyframe cảnh đó gán vào `canvasMemoryAnchorMediaId` để truyền làm mỏ neo cho toàn bộ các cảnh kế tiếp (**CANVAS Persistent Visual Memory**). |
| **`MEM-06`** | Lỗi `MLLM Judge` trong `App.tsx` truyền nhầm chuỗi Base64 của Video MP4 nhưng khai báo `renderedMimeType: 'image/png'` | `masterTake.videoUrl.startsWith('data:')` luôn đúng với chuỗi `data:video/mp4;base64,...`, dẫn tới gửi nhị phân MP4 vào hàm kiểm định ảnh PNG. | Bắt buộc trích xuất Base64 từ ảnh PNG thực tế: `const frameUrlForJudge = masterTake?.lastFrameUrl || s.startKeyframeUrl || ''` trước khi `.split(',')[1]`. |
| **`MEM-07`** | Xung đột `CONTINUOUS_MATCH_FRAME` và `durationSeconds` khi chạy Interpolation (`First Frame` + `Last Frame`) trên `Veo 3.1` | Điều kiện `|| i % 2 === 1` trong `App.tsx` ép các cảnh lẻ tạo `endKeyframeMediaId`, làm mất nối mượt Match Frame và có thể gây lỗi khi `Veo 3.1` yêu cầu `durationSeconds: 8` cho Interpolation. | Chỉ tạo `endKeyframeMediaId` khi `cameraTransitionType === 'A_TO_B_BRIDGE'`, đồng thời bọc `try / catch` tự động fallback sang `durationSeconds: 8` nếu `Veo 3.1` từ chối thời lượng 4s ở chế độ Interpolation. |
| **`MEM-08`** | Sửa cảnh tiếng Việt / Nâng cấp 4K trong `ShotInspectorDrawer.tsx` bỏ quên `lastFrameImageMediaId` | Lệnh gọi `Flow.generate.video` trong Drawer chỉ truyền `firstFrameImageMediaId` mà thiếu `lastFrameImageMediaId`, làm mất Khung Cuối người dùng đã khóa. | Luôn truyền kèm `...(shot.endKeyframeMediaId ? { lastFrameImageMediaId: shot.endKeyframeMediaId } : {})` và bổ sung nút bấm trực tiếp **"🎬 Quay lại Video theo Start + End Frame"**. |
| **`MEM-09`** | Tiền tố cứng `"16:9"` trong hàm tạo prompt 3-Panel & Clean Environment Lock | Hàm `buildCharacterSheetPrompt` và `buildCleanEnvironmentPrompt` ghi cứng chuỗi `"16:9"` kể cả khi người dùng chọn tỷ lệ dọc `'9:16'`. | Truyền biến `${aspectRatio}` động vào tất cả các hàm khởi tạo prompt tham chiếu. |
| **`MEM-10`** | Cấu trúc chuẩn **Folder Nhân Vật 3 Thành Phần** trên Google Flow (`Chân dung` + `Tạo cơ thể` + `Thông tin nhân vật`) & **Tab Cảnh (`Scenebuilder`)** | Nếu chỉ gắn 1 ảnh vào `Chân dung` mà bỏ trống tab `Tạo cơ thể` (Ảnh 2) và sơ sài ở `Thông tin nhân vật` (Ảnh 3), Flow sẽ thiếu mô hình Full-Body, các tư thế hành động/chiêu thức và cái hồn cảm xúc của nhân vật. | Mỗi khi tạo nhân vật bằng `Flow.host.createCharacter(...)` trong [`flow-ultra-bridge.mjs`](file:///d:/myProject/test-AI/flow-ultra-bridge.mjs), bắt buộc hoàn thiện đủ **3 thành phần trong Folder Nhân Vật**:<br>1. **`Chân dung` (Ảnh 1)**: Avatar / Portrait cận cảnh.<br>2. **`Tạo cơ thể -> Cơ thể` (Ảnh 2)**: Gắn/tạo mô hình Full-Body 3 góc độ + các tư thế hành động, chiêu thức, kỹ năng.<br>3. **`Thông tin nhân vật` (Ảnh 3)**: Ghi rõ Chỉ số hình thể (Chiều cao, Cân nặng), Tính cách & Linh hồn cảm xúc, và Mã định danh các Hành động/Chiêu thức (`[ACTION_...]`, `[SKILL_1_...]`) để gọi chính xác khi tạo ảnh Storyboard và Video. |

---

## 👤 3. SỞ THÍCH & YÊU CẦU ĐẶC BIỆT CỦA ĐẠO DIỄN (USER PREFERENCES)

- **Ngôn ngữ giao tiếp**: Tiếng Việt chuyên nghiệp, súc tích, có đầy đủ liên kết file click được (`[tên_file](file:///...)`).
- **Tiêu chuẩn chất lượng**: Chuẩn công nghiệp làm phim AI của các studio hàng đầu Trung Quốc (Seedance, Kling Director, Hailuo, Vidu) kết hợp quy trình chuẩn Google Flow Ultra.
- **Tính năng ưu tiên**: Tự hành khép kín A–Z chỉ với 1 cú nhấp chuột, nhưng vẫn cho phép mở **Ngăn kéo Chỉnh sửa Nhanh (`ShotInspectorDrawer`)** ở từng cảnh để kiểm soát **First/Last Frame**, sửa cảnh bằng tiếng Việt và chỉnh sửa **Video-to-Video VFX Edit**.

