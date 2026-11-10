<!-- =========================================================================
🔒 AI EDIT LOCK GUARDRAIL (CÔNG TẮC KHÓA CHỈNH SỬA DÀNH CHO AI AGENT)
AI_EDIT_MODE: OFF
==============================================================================
QUY TẮC BẮT BUỘC TUYỆT ĐỐI CHO MỌI AI AGENT KHI ĐỌC FILE NÀY:
- Khi `AI_EDIT_MODE: OFF` (Mặc định): File này đang ở chế độ CHỈ ĐỌC (READ-ONLY).
  Dù người dùng nhắn gì hay yêu cầu thay đổi quy trình/code/kịch bản ra sao, AI Agent
  TUYỆT ĐỐI KHÔNG ĐƯỢC SỬA, XÓA HAY GHI ĐÈ (`edit_file`, `write_file`, script...) vào file này!
  AI chỉ được phép đọc (`read_file`) để lấy kiến thức tham chiếu.
- Chỉ khi người dùng ra lệnh rõ ràng: "Mở khóa cho phép sửa file GOOGLE_FLOW_MASTER_KNOWLEDGE_BASE.md"
  (hoặc bạn tự đổi `AI_EDIT_MODE: ON`), AI mới được phép chỉnh sửa nội dung. Sau khi sửa xong
  phải lập tức khóa lại về `AI_EDIT_MODE: OFF`.
========================================================================== -->

> [!CAUTION]
> **🔒 TRẠNG THÁI BẢO VỆ TRI THỨC: `AI_EDIT_MODE = OFF` (CHỈ ĐỌC — CẤM CHỈNH SỬA)**
> - **`OFF` (Hiện tại)**: Kho tri thức này đã được niêm phong. Mọi AI Agent chỉ được phép **ĐỌC (`READ-ONLY`)** để tra cứu tính năng và tối ưu quy trình, **tuyệt đối không được tự ý chỉnh sửa** dưới bất kỳ hình thức nào.
> - **`ON`**: Chỉ kích hoạt khi người dùng yêu cầu đích danh *"Cho phép sửa file GOOGLE_FLOW_MASTER_KNOWLEDGE_BASE.md"*.

# 🎬 GOOGLE FLOW MASTER KNOWLEDGE BASE (2026 — BẢN ĐẦY ĐỦ TOÀN DIỆN)
> **Tài liệu Bách Khoa Toàn Thư, Kiến Trúc Hệ Thống & Ma Trận Tối Ưu Hóa Chuyên Nghiệp cho Google Flow (`flow.google.com`)**
> - **Nguồn dữ liệu kiểm chứng trực tiếp**:
>   1. `https://flow.google.com/project/425eb708-ac40-4d8f-aa42-17f1a94e8898` (Không gian Dự án Chính `XRV0Af` + `wO1vlb`)
>   2. `https://flow.google.com/project/425eb708-ac40-4d8f-aa42-17f1a94e8898/character` & `/character/:characterId` (Phòng Studio Nhân vật `BZ3AFc` + `K975Nd`)
>   3. `https://flow.google.com/project/425eb708-ac40-4d8f-aa42-17f1a94e8898/scene/bffcf211-5bd7-4483-a04a-a42a6e2d5e8b` (Trình dựng cảnh SceneBuilder `m38dl`)
>   4. Giải mã toàn bộ **33 gói mã nguồn `AiSandboxAngularFrontend`** (351 Components, 243 mã RPC API với 81 bộ bọc `.fC`, 1.494 chuỗi giao diện tiếng Việt, danh mục `HTrJv` 19.253 dòng, danh sách 30 giọng nói chuẩn `gemini_v4s_tts_flow`) và Tài liệu Chính thống của Google Flow (Tháng 11/2026).
> - **Mục đích sử dụng**: Làm kho tri thức chuẩn xác 100% ("Single Source of Truth") để khi lên kịch bản, viết Prompt hoặc xây dựng quy trình tự động hóa (Workflow/SDK), bạn và AI Agent luôn chọn **đúng tính năng, đúng mô hình, đúng thao tác và tiết kiệm tín dụng (Credits) tối ưu nhất**.

---

## MỤC LỤC
1. [Sơ Đồ Kiến Trúc Toàn Bộ Các Đường Dẫn (Routes) & Trạng Thái Dự Án Thực Tế](#1-sơ-đồ-kiến-trúc-toàn-bộ-các-đường-dẫn-routes--trạng-thái-dự-án-thực-tế)
2. [Danh Mục Toàn Bộ Mô Hình (Models), Thông Số & Bảng Giá Credits Chi Tiết](#2-danh-mục-toàn-bộ-mô-hình-models-thông-số--bảng-giá-credits-chi-tiết)
3. [Khám Phá Chi Tiết URL 1: Không Gian Dự Án Chính (`/project/:projectId`)](#3-khám-phá-chi-tiết-url-1-không-gian-dự-án-chính-projectprojectid)
4. [Khám Phá Chi Tiết URL 2: Phòng Studio Nhân Vật & Giọng Nói (`/project/:projectId/character`)](#4-khám-phá-chi-tiết-url-2-phòng-studio-nhân-vật--giọng-nói-projectprojectidcharacter)
5. [Hệ Thống 8 Loại Thành Phần (Ingredients) & Quy Tắc Phối Hợp Nhất Quán](#5-hệ-thống-8-loại-thành-phần-ingredients--quy-tắc-phối-hợp-nhất-quán)
6. [Trình Chỉnh Sửa Đơn Lẻ (Single-Media Editor: Video & Image `/edit/:workflowId`)](#6-trình-chỉnh-sửa-đơn-lẻ-single-media-editor-video--image-editworkflowid)
7. [Trình Dựng Cảnh Đa Clip (SceneBuilder `/scene/:sceneId`)](#7-trình-dựng-cảnh-đa-clip-scenebuilder-scenesceneid)
8. [Tác Nhân Sáng Tạo AI (Flow Creative Agent - Thanh Chat Bên Phải)](#8-tác-nhân-sáng-tạo-ai-flow-creative-agent---thanh-chat-bên-phải)
9. [Hệ Sinh Thái Công Cụ Tùy Chỉnh (Flow Tools / Applets `/tools` & `/create-tool`)](#9-hệ-sinh-thái-công-cụ-tùy-chỉnh-flow-tools--applets-tools--create-tool)
10. [Ma Trận Quyết Định & Quy Trình Chuẩn Chuyên Nghiệp ("Khi Nào Dùng Gì?")](#10-ma-trận-quyết-định--quy-trình-chuẩn-chuyên-nghiệp-khi-nào-dùng-gì)
11. [Những Giới Hạn Kỹ Thuật Bắt Buộc Phải Nhớ (Constraints & Guardrails)](#11-những-giới-hạn-kỹ-thuật-bắt-buộc-phải-nhớ-constraints--guardrails)
12. [Bảng Tra Cứu Toàn Bộ 38 Mã RPC API Nội Bộ (`batchexecute`) Cho Tự Động Hóa SDK](#12-bảng-tra-cứu-toàn-bộ-38-mã-rpc-api-nội-bộ-batchexecute-cho-tự-động-hóa-sdk)

---

## 1. Sơ Đồ Kiến Trúc Toàn Bộ Các Đường Dẫn (Routes) & Trạng Thái Dự Án Thực Tế

### 1.1. Bảng Định Tuyến (Angular Router Table) Của Google Flow
Tất cả các màn hình chức năng của một dự án đều nằm dưới nhánh cha `/project/:projectId` (Module khung `wO1vlb`):

| Đường dẫn URL (Route) | Mã Module | Component Chính | Chức năng Chuyên biệt |
| :--- | :---: | :--- | :--- |
| `/projects` | `rZcQQd` | `flow-projects-page` | Quản lý danh sách dự án, tạo mới, đổi tên, đặt ảnh bìa, chia sẻ quyền. |
| `/search` | `EGX9lb` | `flow-search-page` | Tìm kiếm toàn cục xuyên dự án theo câu lệnh, nhân vật, loại media. |
| **`/project/:projectId`** | `XRV0Af` | `flow-project-page` | **Không gian làm việc chính**: Lưới Media, Bộ sưu tập, Ô nhập câu lệnh, Thanh Ingredients, Tác nhân AI bên phải. |
| `/project/:projectId/collection/:collectionId` | `XRV0Af` | `flow-project-page` | Không gian làm việc bên trong một Bộ sưu tập (Thư mục con). |
| **`/project/:projectId/character`** | `BZ3AFc` | `flow-character-page` | **Trang Khởi tạo Nhân vật mới**: 6 Khuôn mẫu (Archetypes), tạo bằng Prompt, tải ảnh lên hoặc lấy ảnh từ dự án. |
| **`/project/:projectId/character/:characterId`** | `K975Nd` | `flow-character-edit-page` | **Phòng Studio Chỉnh sửa Nhân vật**: Quản lý 2 Slot (`Chân dung` & `Cơ thể` 3 góc), gắn Giọng nói, ghi chú Tính cách và Nhật ký phiên bản. |
| `/project/:projectId/collection/:id/character` | `BZ3AFc` | `flow-character-page` | Tạo nhân vật mới nằm trực tiếp bên trong một Bộ sưu tập cụ thể. |
| **`/project/:projectId/scene/:sceneId`** | `m38dl` | `flow-scene-builder` | **Trình dựng cảnh đa clip (SceneBuilder)**: Cắt tỉa Trim, Tách Split, Kéo dài Extend trên timeline, Lưu khung hình, Xuất MP4/YouTube. |
| `/project/:projectId/edit/:workflowId` | `wj3Fuc` | `flow-video-editor` / `flow-image-editor` | **Trình chỉnh sửa đơn lẻ**: Edit video 0đ, Extend, Camera Reshoot, Insert/Remove vật thể, Khoanh vùng Box/Lasso & Vẽ Doodle trên ảnh. |
| `/project/:projectId/tools` | `dQNZcf` | `flow-tools-page` | Thư viện Công cụ tùy chỉnh (Flow Tools / Applets) của dự án & cộng đồng. |
| `/project/:projectId/create-tool` | `avz50e` | `flow-create-tool-page` | Trình tạo ứng dụng AI riêng bằng ngôn ngữ tự nhiên (0 Credit). |
| `/project/:projectId/tool/:appletId` | `Y34QFd` | `flow-applet-view-page` | Giao diện chạy & chỉnh sửa một Công cụ tùy chỉnh cụ thể. |
| `/project/:projectId/trash` | `XRV0Af` | `flow-project-page` | Thùng rác dự án (Khôi phục hàng loạt hoặc xóa vĩnh viễn). |

---

### 1.2. Trạng thái Thực tế của Project `425eb708-ac40-4d8f-aa42-17f1a94e8898` (`Zzl0ze` & `nzlxg`)
- **Hạng tài khoản**: **Google AI Ultra** (`paygateTier: 2` ➔ hưởng mức giá ưu đãi cao nhất `Tier 3`).
- **Số dư Tín dụng**: **`24.596` / `25.000` Credits**.
- **Cấu hình Mặc định**: Ảnh = `nano_banana_pro` (**0 Credit**, 2 kết quả/lần); Video = `macaron_cookie` (**Omni 1.2 Flash**); Âm thanh/TTS = `gemini_v4s_tts_flow` (**Gemini TTS — 0 Credit**).
- **Tài sản trong Dự án**: **21 Workflows**, **51 Media items**, **30 Giọng nói đặt sẵn (`Preset Voices`)** được nạp sẵn, **2 Scenes** (trong đó Scene `bffcf211-5bd7-4483-a04a-a42a6e2d5e8b` gồm **4 đoạn Clip** khủng long tổng dài **~56,87s**), chưa tạo thư mục Collection hay thực thể Character riêng (hiện bảng xoay Spinosaurus đang lưu dưới dạng Image Tile trên lưới).

---

## 2. Danh Mục Toàn Bộ Mô Hình (Models), Thông Số & Bảng Giá Credits Chi Tiết

### 2.1. Các Mô Hình Tạo & Chỉnh Sửa Video (`HTrJv`)

#### A. **Omni 1.2 Flash (`macaron_cookie_*`)** — *Mô hình Đa phương thức Chủ lực Mới nhất*
- **Thời lượng linh hoạt từng giây**: Hỗ trợ mọi số nguyên giây từ **`3s` đến `15s`** (`3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 giây`) cho `T2V`, `I2V`, `R2V` (Ingredients); và từ **`3s` đến `10s`** cho `Start+End Keyframes (FL)` và `Extend`.
- **Chế độ Chỉnh sửa Video bằng câu lệnh (`macaron_cookie_edit` & `macaron_cookie_edit_360p`)**: **HOÀN TOÀN MIỄN PHÍ (`0 Credit`)** trên mọi hạng tài khoản! Xuất ra video `15s` đã chỉnh sửa.
- **Bảng giá theo độ phân giải**:
  - **Bản 360p Nháp Siêu Tốc (`_360p`)**: Từ `3s` đến `10s` chỉ tốn **`1 Credit / giây`** (`3cr` – `10cr`); `11s=12cr`, `12s=14cr`, `13s=16cr`, `14s=18cr`, `15s=20cr`.
  - **Bản 720p Tiêu Chuẩn**: Từ `3s` đến `10s` tốn **`3 Credits / giây`** (`9cr` – `30cr`); `11s=36cr`, `12s=42cr`, `13s=48cr`, `14s=54cr`, `15s=60cr`.

#### B. **Veo 3.1 Family (`veo_3_1_*`)** — *Dòng Mô hình Vật lý Điện ảnh Cao cấp (`4s, 6s, 8s`)*

| Phân khúc Veo 3.1 | Các chế độ hỗ trợ | Giá Credit (Gói Pro) | Giá Credit (**Gói Ultra**) | Ứng dụng Tối ưu |
| :--- | :--- | :---: | :---: | :--- |
| **Veo 3.1 - Lite (Lower Priority)** | `T2V`, `I2V`, `Start+End`, `Ingredients (R2V)`, `Extend` | Không hỗ trợ | **`0 Credit` (Miễn phí!)** | Chạy nháp hàng loạt cảnh Veo 3.1 không tốn Credits. |
| **Veo 3.1 - Lite** | `T2V`, `I2V`, `Start+End`, `Ingredients (R2V)`, `Extend` | `10 Credits` | **`5 Credits`** | Tạo nhanh cảnh phụ với chất lượng ánh sáng Veo 3.1. |
| **Veo 3.1 - Fast** | `T2V`, `I2V`, `Start+End`, `Ingredients (R2V)`, `Extend` | `20 Credits` | **`10 Credits`** | **Mặc định cho cảnh Master** cần ghép 3 ảnh Ingredients hoặc khóa `Start+End`. |
| **Veo 3.1 - Quality** | `T2V`, `I2V`, `Start+End`, `Extend` *(Không có R2V)* | `100 Credits` | **`100 Credits`** | Chỉ dùng cho **Hero Shot** đòi hỏi vật lý cực kỳ phức tạp. |

---

### 2.2. Các Mô Hình Ảnh, Âm Thanh TTS & Nâng Cấp Độ Phân Giải (Upsamplers)

| Phân loại | Tên Mô hình | Mã Nội Bộ (`modelKey`) | Giá Credit (Ultra) | Ghi chú Kỹ thuật |
| :--- | :--- | :--- | :---: | :--- |
| **Ảnh** | **🍌 Nano Banana Pro** | `GEM_PIX_2` (`nano_banana_pro`) | **`0 Credit`** | Hỗ trợ **4 mức Thinking Levels**, **14 tỷ lệ khung hình** (`8:1` đến `1:8`), sửa ảnh hội thoại, khoanh vùng & Doodle. |
| **Ảnh** | **🍌 Nano Banana 2 / Imagen 3.5** | `NARWHAL` / `IMAGEN_3_5` | **`0 Credit`** | Tạo biến thể tốc độ cao & nhiếp ảnh chân thực. |
| **Giọng nói** | **Gemini TTS (Flow Voices)** | `gemini_v4s_tts_flow` (`gemini_tts`) | **`0 Credit`** | Tạo giọng nói tùy chỉnh (`Custom Voice` 24kHz 16-bit WAV) & 30 giọng đặt sẵn. |
| **Upscale Ảnh** | **Nano Banana Upsampler 2K / 4K** | `GEM_PIX_2_UPSAMPLE_2K` / `_4K` | **`0 Credit`** | Nâng cấp ảnh tĩnh lên **2K** hoặc **4K** sắc nét tuyệt đối. |
| **Upscale Video** | **Omni Upsampler (360p ➔ 720p)** | `omni_upsampler_360p` | **`0 Credit`** | Nâng cấp video Omni 360p (dài `<= 60s`) lên **720p HD** miễn phí. |
| **Upscale Video** | **Veo 3.1 Upsampler 1080p** | `veo_3_1_upsampler_1080p` | **`0 Credit`** | Nâng cấp video (dài `<= 60s`) lên **1080p Full HD** miễn phí. |
| **Upscale Video** | **Veo 3.1 Upsampler 4K** | `veo_3_1_upsampler_4k` | **`50 Credits`** | Nâng cấp video (dài `<= 60s`) lên **4K UHD**. |

---

## 3. Khám Phá Chi Tiết URL 1: Không Gian Dự Án Chính (`/project/:projectId`)

Đường dẫn `https://flow.google.com/project/425eb708-ac40-4d8f-aa42-17f1a94e8898` là trung tâm điều khiển toàn bộ dự án (`flow-project-page`). Dưới đây là **toàn bộ các tính năng ẩn và hiện** trên trang này:

### 3.1. Bố Cục 5 Thành Phần Trên Trang Chính Dự Án
1. **Thanh Điều Hướng Bên Trái (`flow-project-sidenav-container` & `flow-project-nav-list`)**:
   - Chuyển nhanh giữa: **Tất cả nội dung nghe nhìn (`All Media`)**, **Cảnh (`Scenes`)**, **Nhân vật (`Characters`)**, **Được yêu thích (`Favorites`)**, **Bộ sưu tập (`Collections` — cây thư mục đa cấp)**, **Công cụ (`Tools`)**, và **Thùng rác (`Trash` — có vùng kéo thả `flow-trash-drop-zone` để kéo ô bất kỳ thả thẳng vào thùng rác!)**.
2. **Khu Vực Bộ Sưu Tập Ghim Đầu Trang (`flow-pinned-collections-section`)**:
   - Hiển thị các thẻ thư mục (`flow-collection-tile`) kèm bộ đếm chi tiết trên từng thư mục: **Số lượng Ảnh (`imageCount`)**, **Số lượng Video (`videoCount`)**, **Số lượng Cảnh (`sceneCount`)**, và **Số lượng Nhân vật (`characterCount`)**.
   - Hỗ trợ kéo-thả (Drag & Drop) các ô ảnh/video/nhân vật trên lưới thả trực tiếp vào thẻ Bộ sưu tập!
3. **Thanh Công Cụ Lọc, Tìm Kiếm & Cài Đặt Hiển Thị (`flow-tile-view-header` & `flow-tile-view-settings`)**:
   - **Nút `+` Thêm mới (`addMenu`)**: *Tải tệp lên (`Upload`)*, *Tạo bộ sưu tập mới (`New Collection`)*, *Tạo cảnh mới (`New Scene`)*, *Tạo nhân vật mới (`Create Character` ➔ mở `/character`)*.
   - **Nút Chia sẻ dự án (`person_add`)**: Phân quyền đồng nghiệp làm `Owner` hoặc `Editor`.
   - **Nút Cài đặt Lưới (`settings_2` — `flow-tile-view-settings`)** gồm **2 nhóm chuyển đổi + 4 công tắc vàng**:
     - **Chế độ xem (`View Mode`)**: `Lưới (Grid)` (hiển thị từng ô rời) vs `Theo nhóm (Batch / Grouped)` (gom các kết quả cùng 1 lần tạo và hiển thị câu lệnh chung bên cạnh qua `flow-batch-info`).
     - **Kích thước lưới (`Grid Size`)**: Thu nhỏ / Phóng to kích thước thẻ.
     - **Công tắc 1 — `Âm thanh khi di chuột (Sound on hover)`**: Tự phát tiếng video khi rê chuột qua ô.
     - **Công tắc 2 — `Trả về video không có âm thanh (Return silent videos)`**:
       > **💡 Bí quyết hoàn tiền (Credit Refund Guard)**: Nếu **TẮT** công tắc này, mỗi khi mô hình AI tạo video bị lỗi mất âm thanh, **Flow sẽ chặn video đó và KHÔNG TRỪ CREDITS của bạn** (*"Flow sẽ chặn các video không có âm thanh. Bạn sẽ không bị trừ tín dụng đối với những video có âm thanh bị lỗi."*). Nếu **BẬT**, Flow vẫn trả về video câm nhưng sẽ trừ Credits bình thường!
     - **Công tắc 3 — `Hiện thông tin chi tiết về ô (Show tile details)`**: Luôn hiển thị tên và câu lệnh dưới chân mỗi ô.
     - **Công tắc 4 — `Xoá câu lệnh sau khi gửi (Clear prompt on submit)`**: Tự động xóa trống ô nhập lệnh sau khi bấm Tạo (hoặc giữ lại câu lệnh cũ nếu tắt).
   - **Menu Tuỳ chọn khác (`flow-more-options-menu`)**: Cho phép **Tải xuống toàn bộ Dự án hoặc Bộ sưu tập dưới dạng tệp `.ZIP`** (tự động chia thành từng phần `_part_1.zip`, `_part_2.zip` nếu tổng dung lượng vượt quá `1 GB`!).

---

### 3.2. Các Thao Tác Trên Từng Loại Ô (Tile Hotbars & Context Menus)
Khi rê chuột lên một ô (`flow-tile-hover-footer`) hoặc nhấp chuột phải vào ô trên lưới, mỗi loại tài sản có bộ công cụ riêng:
- **Ô Hình ảnh (`flow-image-tile` / `flow-image-context-menu-items`)**:
  - `Tạo ảnh động (Animate)`: Đưa bức ảnh đó xuống thẳng ô Prompt làm `Start Frame` để biến thành video!
  - `Thêm vào câu lệnh (Add to Prompt)`: Đính kèm ảnh làm `Reference Ingredient`.
  - `Sử dụng lại câu lệnh (Reuse Prompt)`: Chép lại câu lệnh và cấu hình đã tạo ra bức ảnh đó.
  - `Tải xuống (Download)`: Tải `Kích thước gốc`, `Tăng độ phân giải 2K (UPSAMPLE_IMAGE_RESOLUTION_2K)` hoặc `4K (UPSAMPLE_IMAGE_RESOLUTION_4K)`.
  - `Đặt ảnh bìa dự án (Set Project Cover)` / `Đặt ảnh bìa bộ sưu tập (Set Collection Cover)`.
  - `Chia sẻ (Share)` / `Tạo bản sao (Copy)` / `Đổi tên (Rename)` / `Di chuyển ra khỏi bộ sưu tập` / `Chuyển vào thùng rác`.
- **Ô Video (`flow-video-tile` / `flow-video-context-menu-items`)**:
  - `Thêm vào cảnh (Add to Scene)` / `Thêm vào cảnh mới (Add to New Scene)`: Đẩy thẳng video vào **SceneBuilder**!
  - `Tải xuống (Download)`: Tải bản gốc, `Tăng độ phân giải 720p / 1080p / 4K`, hoặc xuất thành **`Ảnh GIF động (Animated GIF)`**!
  - `Xuất bản lên YouTube (Publish to YouTube)`: Mở hộp thoại đăng thẳng video lên kênh YouTube.
  - Đầy đủ các nút: `Thêm vào câu lệnh`, `Sử dụng lại câu lệnh`, `Đặt làm ảnh bìa`, `Chia sẻ`, `Sao chép`, `Đổi tên`, `Xoá`.
- **Ô Nhân vật (`flow-character-tile` / `flow-character-hotbar`)**:
  - Click vào ô sẽ mở `/project/:projectId/character/:characterId`.
  - Menu nhanh: `Thêm vào câu lệnh (@Character)`, `Tạo bản sao nhân vật (Copy Character)`, `Yêu thích`, `Đổi tên`, `Di chuyển`, `Chuyển vào thùng rác`.
- **Chọn Hàng Loạt Bằng Kéo Chuột (`Drag Multi-Select` / `PINHOLE_MULTISELECT`)**:
  - Nhấn giữ chuột trái trên khoảng trống của lưới và kéo khung chữ nhật qua nhiều ô để chọn hàng loạt ➔ Bấm `Thêm # mục vào câu lệnh`, `Tải xuống hàng loạt (.ZIP)`, `Di chuyển vào bộ sưu tập`, hoặc `Chuyển hàng loạt vào thùng rác`.

---

### 3.3. Bảng Đầy Đủ 26 Phím Tắt Bàn Phím (`_.jU` Keyboard Shortcuts) Trên Trang Dự Án
Giải mã trực tiếp từ hàm bắt phím `_.jU(a)` trong `mod_XRV0Af.js`:

| Phím tắt | Mã Hành động Nội bộ | Tác dụng Thực tế |
| :--- | :--- | :--- |
| **`Shift + A`** | `toggleAgentMode` | **Bật / Tắt bảng điều khiển Tác nhân AI (Flow Creative Agent) bên phải** |
| **`Shift + :`** | `focusPromptBox` | **Đưa con trỏ chuột nhảy thẳng vào Ô nhập câu lệnh (Prompt Box)** |
| **`Mũi tên Lên / Xuống`** *(trong ô Prompt)* | `historyPrev` / `historyNext` | **Duyệt ngược/xuôi lại các câu lệnh (Prompts) bạn đã gửi trước đó** (như Terminal!) |
| **`G`** hoặc **`Shift + G`** | `toggleViewMode` | Chuyển đổi nhanh giữa **Chế độ xem Lưới (`Grid`)** và **Theo nhóm (`Batch`)** |
| **`Shift + I`** | `filterImages` | Bật/tắt bộ lọc chỉ hiển thị **Hình ảnh** |
| **`Shift + V`** | `filterVideos` | Bật/tắt bộ lọc chỉ hiển thị **Video** |
| **`Shift + U`** | `filterUploads` | Bật/tắt bộ lọc chỉ hiển thị **Tệp đã tải lên** |
| **`Shift + F`** | `filterFavorites` | Bật/tắt bộ lọc chỉ hiển thị **Mục yêu thích** |
| **`Shift + X`** | `filterAllTypes` | Xóa sạch mọi bộ lọc, hiển thị lại toàn bộ dự án |
| **`Ctrl/Cmd + G`** | `groupSelected` | **Gom tất cả các ô đang chọn vào một Bộ sưu tập (Collection) mới** |
| **`Ctrl/Cmd + U`** | `openUploadDialog` | Mở cửa sổ tải tệp (Ảnh/Video) từ máy tính lên |
| **`Ctrl/Cmd + D`** | `download` | Tải xuống (Download) các mục đang chọn |
| **`Ctrl/Cmd + F`** hoặc **`/`** | `focusSearch` | Nhảy vào thanh Tìm kiếm trong dự án |
| **`Ctrl/Cmd + A`** | `selectAll` | Chọn tất cả các ô trên lưới hiện tại |
| **`Ctrl/Cmd + C`** / **`Ctrl/Cmd + V`** | `copy` / `paste` | Sao chép các ô đang chọn và Dán vào dự án / bộ sưu tập |
| **`Ctrl/Cmd + Z`** / **`Ctrl/Cmd + Shift + Z`** | `undo` / `redo` | Hoàn tác / Làm lại thao tác vừa thực hiện trên dự án |
| **`Enter`** hoặc **`Space`** | `openSelected` / `togglePlayPause` | Mở mục đang chọn vào Trình chỉnh sửa (hoặc mở Collection/Scene/Character) |
| **`X`** | `toggleSelection` | Đánh dấu chọn / bỏ chọn ô đang đứng |
| **`C`** | `activateCropTool` | Kích hoạt nhanh công cụ Cắt ảnh (Crop) |
| **`U`** | `returnToGrid` | Quay trở lại lưới dự án chính |
| **`H / J / K / L`** hoặc **`4 phím Mũi tên`** | `navigatePrevious/Down/Up/Next` | Di chuyển vùng chọn qua từng ô trên lưới (hỗ trợ cả chuẩn Vim `HJKL`) |
| **`Shift + Mũi tên Trái / Phải`** | `videoPrevFrame` / `videoNextFrame` | Nhích từng khung hình video sang trái / phải |
| **`+` (`=`)** / **`-`** / **`0`** | `gridSizeIncrease/Decrease/Reset` | Phóng to / Thu nhỏ / Đặt lại kích thước các ô trên lưới |
| **`Delete`** hoặc **`Backspace`** | `delete` | Chuyển các mục đang chọn vào Thùng rác (hoặc xóa vĩnh viễn nếu đang ở Thùng rác) |
| **`Escape`** | `deselectAll` / `blurInput` | Bỏ chọn toàn bộ các ô hoặc thoát khỏi ô nhập chữ |

---

## 4. Khám Phá Chi Tiết URL 2: Phòng Studio Nhân Vật & Giọng Nói (`/project/:projectId/character`)

Hệ thống Nhân vật của Google Flow được chia thành **2 màn hình chuyên biệt** (`BZ3AFc` và `K975Nd`) nhằm đảm bảo nhân vật giữ nguyên khuôn mặt, trang phục, tỷ lệ cơ thể và giọng nói xuyên suốt hàng trăm cảnh quay.

### 4.1. Màn hình 1: Khởi Tạo Nhân Vật Mới (`/project/:projectId/character` — Module `BZ3AFc`)
Khi bạn truy cập `https://flow.google.com/project/425eb708-ac40-4d8f-aa42-17f1a94e8898/character`, giao diện hiển thị:

1. **Băng chuyền 6 Khuôn Mẫu Nhân Vật (`flow-character-preset-carousel` — RPC `eAenfb`)**:
   Khi bấm vào bất kỳ thẻ nào trong 6 thẻ dưới đây, hệ thống gọi RPC `eAenfb` (`GENERATE_CHARACTER_PROMPT`) với mã Enum tương ứng để AI sáng tác ngẫu nhiên một bản mô tả nhân vật hoàn chỉnh và tự động gõ chữ (typewriter effect) vào ô câu lệnh:

   | Tên Khuôn Mẫu (UI) | Mã Nội Bộ (`Archetype`) | Mã Enum RPC | Mô tả Phong cách Nhân vật |
   | :--- | :--- | :---: | :--- |
   | **Nhân vật quen thuộc** | `THE_FAMILIAR` | `1` | Chân thực và gần gũi, tạo sự đồng cảm cho câu chuyện bạn kể. |
   | **Kẻ lập dị** | `THE_ECCENTRIC` | `2` | Những con người kỳ lạ, tạo ấn tượng khó quên với vẻ lôi cuốn độc đáo. |
   | **Kẻ phản diện** | `THE_WICKED` | `3` | Những nhân vật phản diện quyền lực chiếm trọn khung hình. |
   | **Nhân vật kỳ ảo** | `THE_FANTASTICAL` | `4` | Những sinh vật huyền ảo như trong mơ, hoà quyện giữa con người và thần thoại. |
   | **Nhân vật chuyên nghiệp** | `THE_PROFESSIONAL` | `5` | Ngoại hình chỉn chu, nói năng lưu loát, có năng lực. |
   | **Nhân vật biến hoá** | `THE_WILDCARD` | `6` | Không chỉ con người mà bất cứ thứ gì (đồ vật, quái thú, sinh vật) cũng có thể là nhân vật. |

2. **3 Con Đường Khởi Tạo Nhân Vật ở Thanh Đáy (`flow-create-character-footer`)**:
   - **Cách 1 — Tạo từ Câu lệnh (`flow-character-prompt-box`)**:
     - Nhập mô tả nhân vật (có thể kèm ảnh tham khảo), chọn mô hình ảnh (`Nano Banana Pro` / `Nano Banana 2` / `Imagen 3.5`).
     - **Nút `Định dạng (Format)` (`flow-format-prompt-button` — RPC `eAenfb`)**: Khi bạn gõ một ý tưởng ngắn (VD: *"Chiến binh khủng long Spinosaurus mặc giáp cổ đại"*) rồi bấm **`Định dạng`**, AI sẽ tự động viết lại thành một câu lệnh thiết kế chân dung nhân vật chuyên nghiệp, chi tiết.
     - Khi bấm Tạo: Hệ thống gọi `create_entity` (RPC `C4BZMd`) tạo thực thể nhân vật mới, tạo ảnh vào **Slot 0 (`Chân dung`)** và tự động chuyển trang sang `/project/:projectId/character/:characterId`.
   - **Cách 2 — Nút `Tải lên (Upload)`**: Tải một bức ảnh có sẵn từ máy tính của bạn lên thẳng **Slot 0 (`Chân dung`)** của nhân vật mới.
   - **Cách 3 — Nút `Thêm từ dự án (Add from Project)`**: Mở hộp thoại chọn bất kỳ bức ảnh nào bạn đã tạo trước đó trong dự án (ví dụ: chọn bức ảnh khủng long Spinosaurus bạn đã tạo trên lưới!) để biến nó thành một **Thực thể Nhân vật (`@Character`)** chính thức!

---

### 4.2. Màn hình 2: Phòng Studio Chỉnh Sửa Chi Tiết Nhân Vật (`/project/:projectId/character/:characterId` — Module `K975Nd`)
Sau khi khởi tạo xong (hoặc khi bấm vào một ô nhân vật trên lưới), bạn vào phòng Studio `flow-character-edit-page` với **4 cơ chế thông minh**:

#### Cơ chế 1: Hệ thống 2 Slot Hình ảnh (`Chân dung` + `Cơ thể`) & Tự Động Tham Chiếu Chéo
Mỗi nhân vật có 2 ngăn (Slot) hình ảnh độc lập được chuyển đổi qua 2 nút chip (`flow-slot-chip-button`):
- **Slot `0` — `Chân dung (portrait)`**: Lưu ảnh cận mặt / bán thân để khóa chi tiết khuôn mặt, mắt, sẹo, biểu cảm.
- **Slot `1` — `Cơ thể (body)`**: Lưu ảnh toàn thân hoặc **Bảng xoay 3 góc (`3-view turnaround sheet`)**.
- **🔥 Cơ chế Tự động hóa Cực Hay trong Mã nguồn (`O2b` & `R0b`)**:
  1. Ngay khi bạn đã có ảnh ở tab **`Chân dung`** và bạn bấm chuyển sang tab **`Cơ thể`** (lúc đang trống), hệ thống **TỰ ĐỘNG đính kèm bức ảnh `Chân dung` xuống ô Prompt làm ảnh tham chiếu (`source: "AUTOMATIC"`)** để đảm bảo cơ thể mới tạo ra khớp 100% với cái đầu ở tab Chân dung!
  2. Khi đang ở tab **`Cơ thể`**, nếu bạn bấm nút **`Định dạng (Format)`**, hệ thống sẽ tự động chèn tiền tố lệnh chuẩn Studio vào đầu câu lệnh của bạn:
     > *"Ảnh bộ ba toàn thân, ba góc nhìn riêng biệt: nhìn thẳng, nhìn nghiêng 3/4 và nhìn từ phía sau. Độ phân giải cao, ánh sáng chuyên nghiệp, tỷ lệ cơ thể nhất quán ở mọi góc nhìn, nền trắng trơn."*

#### Cơ chế 2: Chỉnh Sửa Hội Thoại Trực Tiếp Trên Từng Slot (`Bạn muốn thay đổi điều gì?`)
- Khi một Slot (`Chân dung` hoặc `Cơ thể`) đã có ảnh, ô nhập lệnh ở đáy tự động chuyển sang chế độ **Chỉnh sửa ảnh (`Bạn muốn thay đổi điều gì?`)**.
- Bạn chỉ cần gõ điểm muốn sửa (VD: *"Thêm vết sẹo phát sáng màu đỏ trên mắt trái"*) ➔ Flow tự lấy bức ảnh hiện tại của Slot đó làm gốc để sửa mà giữ nguyên các chi tiết còn lại.
- Nút **`Hiện nhật ký (History)`** ở góc phải trên sẽ mở bảng lịch sử (`flow-editor-history-panel`) chứa tất cả các phiên bản ảnh bạn đã thử nghiệm ở Slot đó. Bạn có thể:
  - Bấm chọn bất kỳ ảnh nào trong lịch sử để đặt làm ảnh chính của Slot (`set_character_slot_primary_media`).
  - Bấm **`Lưu vào dự án (Save to Project)`** để xuất riêng một bức ảnh trong lịch sử nhân vật ra ngoài lưới Media Grid chính.

#### Cơ chế 3: Hồ Sơ Tính Cách (`Tính cách của nhân vật` — `personalityNotes`)
- Ô văn bản `Mô tả tính cách của nhân vật...` ở cột bên trái được lưu qua mutation `set_character_personality_notes` (RPC `rzMKMb`).
- **Tác dụng thực tế**: Khi bạn gọi `@TênNhânVật` trong câu lệnh hoặc trò chuyện với **Flow Creative Agent**, Agent sẽ tự động đọc phần `Tính cách` này (VD: *"Hung dữ, cổ đại, di chuyển nặng nề uy nghiêm, luôn gầm trước khi lao tới"*) để tự động bổ sung mô tả hành vi và biểu cảm vào câu lệnh quay video!

#### Cơ chế 4: Gắn Giọng Nói Cố Định Cho Nhân Vật (`Chọn giọng nói` — `flow-character-voice-button`)
- Ở cột trái của nhân vật, bấm **`Chọn giọng nói`** (`set_character_audio_references`) để gắn cố định 1 giọng nói cho nhân vật đó. Khi nhân vật được gọi vào cảnh quay có thoại, hệ thống tự động dùng đúng giọng nói đã gắn!

---

### 4.3. Danh Sách Đầy Đủ 30 Giọng Nói Đặt Sẵn (`Preset Voices`) & Cách Tạo Giọng Nói Tùy Chỉnh (`0 Credit`)

#### A. Bảng Tra Cứu 30 Giọng Nói Đặt Sẵn (`voices/<id>`) Trong Dự Án Của Bạn
Được trích xuất trực tiếp từ trường `Field 4` (`project_full.json`) của máy chủ Google Flow:

| # | Mã ID (`voiceId`) | Tên Giọng | Giới tính | Âm sắc & Phong cách (Tone) | Cao độ (Pitch) | Link Nghe Thử Mẫu (`.wav` Chính Thống) |
| :-: | :--- | :--- | :---: | :--- | :---: | :--- |
| 1 | `achernar` | **Achernar** | Nữ | Dịu dàng, mềm mại (*Soft*) | Cao (*High*) | [Achernar.wav](https://gstatic.com/aitestkitchen/voices/samples/Achernar.wav) |
| 2 | `achird` | **Achird** | Nam | Thân thiện (*Friendly*) | Trung (*Mid*) | [Achird.wav](https://gstatic.com/aitestkitchen/voices/samples/Achird.wav) |
| 3 | `algenib` | **Algenib** | Nam | Khàn, gai góc (*Gravelly*) | Trầm (*Low*) | [Algenib.wav](https://gstatic.com/aitestkitchen/voices/samples/Algenib.wav) |
| 4 | `algieba` | **Algieba** | Nam | Thoải mái, tự nhiên (*Easy-going*) | Trung-Trầm | [Algieba.wav](https://gstatic.com/aitestkitchen/voices/samples/Algieba.wav) |
| 5 | `alnilam` | **Alnilam** | Nam | Đanh thép, dứt khoát (*Firm*) | Trung-Trầm | [Alnilam.wav](https://gstatic.com/aitestkitchen/voices/samples/Alnilam.wav) |
| 6 | `aoede` | **Aoede** | Nữ | Thanh thoát, nhẹ nhàng (*Breezy*) | Trung (*Mid*) | [Aoede.wav](https://gstatic.com/aitestkitchen/voices/samples/Aoede.wav) |
| 7 | `autonoe` | **Autonoe** | Nữ | Tươi sáng (*Bright*) | Trung (*Mid*) | [Autonoe.wav](https://gstatic.com/aitestkitchen/voices/samples/Autonoe.wav) |
| 8 | `callirrhoe` | **Callirrhoe** | Nữ | Thư thái, gần gũi (*Easy-going*) | Trung (*Mid*) | [Callirrhoe.wav](https://gstatic.com/aitestkitchen/voices/samples/Callirrhoe.wav) |
| 9 | `charon` | **Charon** | Nam | Chững chạc, thuyết minh (*Informative*) | Trầm (*Lower*) | [Charon.wav](https://gstatic.com/aitestkitchen/voices/samples/Charon.wav) |
| 10 | `despina` | **Despina** | Nữ | Mượt mà, êm ái (*Smooth*) | Trung (*Mid*) | [Despina.wav](https://gstatic.com/aitestkitchen/voices/samples/Despina.wav) |
| 11 | `enceladus` | **Enceladus** | Nam | Trầm khàn, nhiều hơi (*Breathy*) | Trầm (*Lower*) | [Enceladus.wav](https://gstatic.com/aitestkitchen/voices/samples/Enceladus.wav) |
| 12 | `erinome` | **Erinome** | Nữ | Rõ ràng, sắc nét (*Clear*) | Trung (*Mid*) | [Erinome.wav](https://gstatic.com/aitestkitchen/voices/samples/Erinome.wav) |
| 13 | `fenrir` | **Fenrir** | Nam | Sôi nổi, hào hứng (*Excitable*) | Trẻ (*Younger*) | [Fenrir.wav](https://gstatic.com/aitestkitchen/voices/samples/Fenrir.wav) |
| 14 | `gacrux` | **Gacrux** | Nữ | Trưởng thành, từng trải (*Mature*) | Trung (*Mid*) | [Gacrux.wav](https://gstatic.com/aitestkitchen/voices/samples/Gacrux.wav) |
| 15 | `iapetus` | **Iapetus** | Nam | Rõ chữ, điềm tĩnh (*Clear*) | Trung-Trầm | [Iapetus.wav](https://gstatic.com/aitestkitchen/voices/samples/Iapetus.wav) |
| 16 | `kore` | **Kore** | Nữ | Kiên quyết, mạnh mẽ (*Firm*) | Trung (*Mid*) | [Kore.wav](https://gstatic.com/aitestkitchen/voices/samples/Kore.wav) |
| 17 | `laomedeia` | **Laomedeia** | Nữ | Vui tươi, năng động (*Upbeat*) | Trung-Cao | [Laomedeia.wav](https://gstatic.com/aitestkitchen/voices/samples/Laomedeia.wav) |
| 18 | `leda` | **Leda** | Nữ | Trẻ trung (*Youthful*) | Trung-Cao | [Leda.wav](https://gstatic.com/aitestkitchen/voices/samples/Leda.wav) |
| 19 | `orus` | **Orus** | Nam | Vững chãi, uy lực (*Firm*) | Trung-Trầm | [Orus.wav](https://gstatic.com/aitestkitchen/voices/samples/Orus.wav) |
| 20 | `puck` | **Puck** | Nam | Hoạt bát, vui nhộn (*Upbeat*) | Trung (*Mid*) | [Puck.wav](https://gstatic.com/aitestkitchen/voices/samples/Puck.wav) |
| 21 | `pulcherrima` | **Pulcherrima** | Trung tính | Trực diện, hiện đại (*Forward*) | Trung-Cao | [Pulcherrima.wav](https://gstatic.com/aitestkitchen/voices/samples/Pulcherrima.wav) |
| 22 | `rasalgethi` | **Rasalgethi** | Nam | Kể chuyện, dẫn chương trình (*Informative*) | Trung (*Mid*) | [Rasalgethi.wav](https://gstatic.com/aitestkitchen/voices/samples/Rasalgethi.wav) |
| 23 | `sadachbia` | **Sadachbia** | Nam | Sống động, hào sảng (*Lively*) | Trầm (*Low*) | [Sadachbia.wav](https://gstatic.com/aitestkitchen/voices/samples/Sadachbia.wav) |
| 24 | `sadaltager` | **Sadaltager** | Nam | Uyên bác, tri thức (*Knowledgeable*) | Trung (*Mid*) | [Sadaltager.wav](https://gstatic.com/aitestkitchen/voices/samples/Sadaltager.wav) |
| 25 | `schedar` | **Schedar** | Nam | Đều đặn, cân bằng (*Even*) | Trung-Trầm | [Schedar.wav](https://gstatic.com/aitestkitchen/voices/samples/Schedar.wav) |
| 26 | `sulafat` | **Sulafat** | Nữ | Ấm áp, truyền cảm (*Warm*) | Trung (*Mid*) | [Sulafat.wav](https://gstatic.com/aitestkitchen/voices/samples/Sulafat.wav) |
| 27 | `umbriel` | **Umbriel** | Nam | Trầm ấm, mượt mà (*Smooth*) | Trầm (*Lower*) | [Umbriel.wav](https://gstatic.com/aitestkitchen/voices/samples/Umbriel.wav) |
| 28 | `vindemiatrix` | **Vindemiatrix** | Nữ | Hiền dịu, nhẹ nhàng (*Gentle*) | Trung (*Mid*) | [Vindemiatrix.wav](https://gstatic.com/aitestkitchen/voices/samples/Vindemiatrix.wav) |
| 29 | `zephyr` | **Zephyr** | Nữ | Trong trẻo, rạng rỡ (*Bright*) | Trung-Cao | [Zephyr.wav](https://gstatic.com/aitestkitchen/voices/samples/Zephyr.wav) |
| 30 | `zubenelgenubi` | **Zubenelgenubi** | Nam | Đời thường, tự nhiên (*Casual*) | Trung-Trầm | [Zubenelgenubi.wav](https://gstatic.com/aitestkitchen/voices/samples/Zubenelgenubi.wav) |

#### B. Cách Thiết Kế Giọng Nói Tùy Chỉnh (`Custom Voice` — RPC `no0P6` & `lt8g5` — **`0 Credit`**)
Ngoài 30 giọng trên, trong bảng chọn `Giọng nói` (`flow-voice-preview-pane`), bạn có thể chọn bất kỳ giọng gốc nào rồi bấm **Tuỳ chỉnh đặc điểm giọng nói**:
1. **Mô tả kiểu đặc điểm giọng nói (`Ss`)**: Nhập yêu cầu chất giọng (VD: *"Giọng ông lão thông thái, nói chậm rãi, âm vang huyền bí như vọng ra từ hang động"*).
2. **Hội thoại mẫu (`Iv`)**: Nhập câu thoại tiếng Việt hoặc tiếng Anh để nghe thử (Mặc định: *"Chào bạn! Chúng tôi sẽ giới thiệu một tính năng mới giúp đọc to nội dung này bằng giọng nói tự nhiên, giống như giọng nói của con người."*).
3. **Bấm Xem trước (`GENERATE_VOICE_PREVIEW` - RPC `no0P6`)**: Mô hình `gemini_v4s_tts_flow` sẽ sinh ra file âm thanh chuẩn `WAV 24kHz 16-bit` hoàn toàn **miễn phí (`0 Credit`)**.
4. **Đặt Tên & Bấm `Lưu giọng nói mới` (`SAVE_CUSTOM_VOICE` - RPC `lt8g5`)**: Giọng nói đó sẽ được lưu vào danh mục `Giọng nói tuỳ chỉnh` của dự án để gắn cho Nhân vật hoặc gọi bằng `@TênGiọng`!

---

## 5. Hệ Thống 8 Loại Thành Phần (Ingredients) & Quy Tắc Phối Hợp Nhất Quán

Khi gõ phím **`@`** hoặc bấm nút **`+`** trên thanh câu lệnh (`flow-ingredient-bar`), bạn có thể kết hợp **8 loại Ingredients** (tối đa 100 thành phần trong bộ chọn):
1. **`CHARACTER` (`@TênNhânVật`)**: Tự động truyền cả ảnh Chân dung, ảnh Cơ thể 3 góc, ghi chú Tính cách và Giọng nói đã gắn.
2. **`IMAGE` (`@TênẢnh`)**: Truyền tối đa **3 ảnh tham chiếu** vào chế độ `Ingredients to Video (R2V)` của `Veo 3.1` hoặc `Omni 1.2 Flash` (có công cụ cắt ảnh `flow-ingredient-crop-dialog`: `Lấp đầy khung hình (Fill)` hoặc `Vừa với khung hình (Fit)`).
3. **`FIRST_FRAME` & `LAST_FRAME` (`Khung hình Bắt đầu / Kết thúc`)**: Khóa chính xác frame đầu và frame cuối của cảnh video (có nút `Hoán đổi khung hình đầu tiên và cuối cùng`).
4. **`AUDIO` (`@TênGiọngNói`)**: Đính kèm Giọng nói đặt sẵn hoặc Giọng nói tùy chỉnh vào câu lệnh tạo video.
5. **`LIKENESS` (`@me` — `Hình đại diện của tôi`)**: Đưa khuôn mặt & giọng nói thật của bạn (đã đăng ký qua `flow-likeness-dialog-panel`) vào đóng vai trong video.
6. **`VIDEO` (`Thành phần Video`)**: Dùng làm nguồn cho chế độ `Edit` hoặc `Extend` (hỗ trợ cắt lại đoạn video nguồn bằng `ingredient_retrim`).
7. **`STYLE` (`Kiểu` — 8 Style Presets + 4 Bảng màu)**: *Medieval Goth Core, Studio Ramp, Soft 3D, Not Cyberpunk, Surreal 70mm, Ink Brush, 90s Console, Vintage Camera*.
8. **`FILE` (`Tệp đính kèm`)**: Đính kèm kịch bản/tài liệu khi trò chuyện với **Flow Creative Agent**.

---

## 6. Trình Chỉnh Sửa Đơn Lẻ (Single-Media Editor: Video & Image `/edit/:workflowId`)

### 6.1. 5 Chế Độ Chỉnh Sửa Video (`/edit/:workflowId` — `flow-video-editor`)
1. **Chỉnh sửa Video bằng câu lệnh (`EDIT_VIDEO` / `macaron_cookie_edit` — **`0 Credit`!**)**:
   - Mô tả thay đổi bằng tiếng Việt hoặc tiếng Anh để sửa hành động, thay đổi kết cục pha đánh nhau, thêm hiệu ứng, đổi bối cảnh trên clip hiện tại (xuất ra clip `15s` mới với giá **`0 Credit`**).
2. **Kéo dài Video (`VIDEO_EXTEND` — `3s..10s` với Omni 1.2 hoặc `4s/6s/8s` với Veo 3.1)**:
   - Nối tiếp hành động dựa trên 24 frame cuối. Hỗ trợ `Tự động cắt (Auto-Trim)` hoặc cắt thủ công qua `flow-video-trimmer-dialog` nếu clip gốc dài quá giới hạn.
3. **Điều chỉnh Góc máy & Chuyển động Camera (`VIDEO_CAMERA` / `Reshoot` — `10–20 Credits`)**:
   - **7 Vị trí đặt máy (`_.w7a`)**: `CENTER` (Giữa), `LEFT` (Trái), `RIGHT` (Phải), `HIGH` (Góc cao), `LOW` (Góc thấp), `CLOSER` (Gần hơn - Cận cảnh), `FURTHER` (Xa hơn - Toàn cảnh).
   - **8 Chuyển động máy quay (`_.x7a`)**: `DOLLY_IN` (Đẩy máy vào gần), `DOLLY_OUT` (Kéo máy ra xa), `ORBIT_LEFT` (Xoay quanh từ phải sang trái), `ORBIT_RIGHT` (Xoay quanh từ trái sang phải), `ORBIT_UP` (Xoay hướng lên), `ORBIT_DOWN` (Xoay hướng xuống), `DOLLY_IN_ZOOM_OUT` (Vertigo tiến vào thu nhỏ), `DOLLY_OUT_ZOOM_IN` (Vertigo lùi ra phóng to).
4. **Chèn Đối Tượng (`VIDEO_INSERT` — `20 Credits`)**: Khoanh vùng `Hộp (Box)` hoặc `Chọn vùng tự do (Lasso)` trên video để thêm nhân vật/đạo cụ/hiệu ứng mới vào cảnh.
5. **Xóa Đối Tượng (`VIDEO_REMOVE` — `20 Credits`)**: Khoanh vùng vật thể thừa hoặc lỗi AI để xóa sạch và tái tạo nền tự động.

### 6.2. 4 Chế Độ Chỉnh Sửa Ảnh (`flow-image-editor` — **`0 Credit`**)
- Sửa ảnh hội thoại đa lượt + Khoanh vùng `Box` / `Lasso` + Vẽ tay `Doodle` trực tiếp lên ảnh + Cắt/Mở rộng khung hình (`Crop / Fit / Fill Outpainting`).

---

## 7. Trình Dựng Cảnh Đa Clip (SceneBuilder `/scene/:sceneId`)

1. **Quản lý nhiều Scene trong 1 Project**: Tạo, đổi tên, nhân bản (`copy_scene`), xóa Scene.
2. **Thêm & Kéo thả sắp xếp thứ tự Clip** trên thanh Timeline (`flow-scene-timeline`).
3. **Cắt tỉa Đầu/Cuối Không Phá Hủy (`Trim Start / End`)**: Kéo 2 đầu mút của clip để cắt gọn phần thừa mà vẫn giữ nguyên video gốc.
4. **Tách Đôi Clip Tại Con Trỏ (`Split Clip` — `split_scene`)**: Chia 1 clip dài thành 2 clip tại vị trí thanh Playhead để chèn cảnh cắt (Cutaway) vào giữa.
5. **Kéo Dài Clip Trực Tiếp Trên Timeline (`In-Timeline Extend` — `extend_scene_clip`)**: Bấm `Kéo dài` ngay trên dòng thời gian, tự tạo khối chờ và nối thẳng vào clip đang dựng.
6. **Chuyển Đổi Phiên Bản Lịch Sử Của Từng Clip (`set_scene_clip_primary_media`)**: Chọn lại phiên bản khác trong lịch sử chỉnh sửa của từng clip ngay trên bàn dựng.
7. **📸 Lưu Khung Hình Hiện Tại Thành Ảnh (`Save Video Frame` — RPC `jeNy9c`)**: Trích xuất chính xác khung hình tại vị trí con trỏ thành 1 bức ảnh mới trong dự án (*"Khung hình đã lưu từ {NAME}"*) — dùng làm `Start Frame` cho cảnh tiếp theo để nối cảnh mượt 100% không bị giảm chất lượng!
8. **Xuất File Master `.MP4` Toàn Cảnh (`GjQLTd` + `IxdSwd`), Xuất `.GIF` hoặc Đăng Thẳng Lên YouTube (`flow-youtube-publish-dialog`)**.

---

## 8. Tác Nhân Sáng Tạo AI (Flow Creative Agent - Thanh Chat Bên Phải)

Mở nhanh bằng phím tắt **`Shift + A`**:
- **Tiền kỳ tự động**: Lên ý tưởng, viết câu lệnh chuẩn, tạo `Moodboard`, `Concept Art`, `Storyboard`.
- **Tạo hàng loạt (`Batch Generation`)**: Tạo nhiều ảnh và video cùng lúc từ 1 yêu cầu.
- **Quản trị dự án tự động**: Ra lệnh *"Đổi tên các thành phần của tôi"* hoặc *"Sắp xếp lưới của tôi thành các bộ sưu tập"* (`update_collection_membership`, `rename_collection`).
- **Bộ nhớ dự án (`Bộ nhớ` / `flow-memory-section`) & 3 Nguyên tắc Chỉ dẫn (`Chỉ dẫn cho tác nhân` — tối đa 3 nguyên tắc kèm ảnh mẫu)**: Lưu quy tắc bất di bất dịch của bộ phim để Agent tự tuân thủ.
- **Chế độ Phê duyệt Tín dụng (`Xác nhận trước khi tạo`)**: Chọn `Luôn luôn (Always)` hoặc `Không bao giờ (Never)` (cho phép Agent tự động chạy chuỗi sản xuất không cần hỏi lại).

---

## 9. Hệ Sinh Thái Công Cụ Tùy Chỉnh (Flow Tools / Applets `/tools` & `/create-tool`)

- **Tự tạo ứng dụng AI riêng (`0 Credit` khi tạo Tool)**: Mô tả công cụ bạn cần ➔ AI tự viết code React `App.tsx` tích hợp `Flow.generate.image()`, `Flow.generate.video()`, `Flow.generate.text()`.
- **6 Công cụ Có Sẵn Cực Mạnh**:
  1. **🎵 Mondo Sónico**: Phòng hòa âm **3 lớp (Ambiance + Foley + SFX)** với bộ trộn Cross-layer Fade.
  2. **🎙️ Giọng Lồng Tiếng (`Voiceover ADR Studio`)**: Timeline 2 rãnh thu âm giọng đọc trực tiếp khớp hình (tự động tắt tiếng video gốc khi thu).
  3. **💬 CaptionCast**: Đóng phụ đề nghệ thuật đa ngôn ngữ.
  4. **⚡ Speed & Framerate Controller**: Chỉnh tốc độ Slow-motion / Speed-ramp và FPS.
  5. **🎨 SwissFlow Studio & CollageMotion Pro**: Đồ họa chuyển động HUD & cắt dán nghệ thuật.
  6. **🖼️ ThumbnailForge**: Thiết kế ảnh bìa Thumbnail YouTube/TikTok.

---

## 10. Ma Trận Quyết Định & Quy Trình Chuẩn Chuyên Nghiệp ("Khi Nào Dùng Gì?")

| Bước Sản Xuất / Bài Toán Thực Tế | Giải Pháp Tối Ưu Nhất Trên Google Flow | Chi Phí (Ultra) |
| :--- | :--- | :---: |
| **1. Đúc Nhân vật đồng nhất 100% (Khuôn mặt + Cơ thể + Giọng nói)** | Vào `/project/:id/character` (hoặc lấy ảnh có sẵn từ dự án bằng nút **`Thêm từ dự án`**) ➔ Tạo **Slot 1 (`Chân dung`)** ➔ Chuyển sang **Slot 2 (`Cơ thể`)** (Flow tự đính kèm ảnh Chân dung làm mẫu!) ➔ Bấm nút **`Định dạng`** để chèn lệnh Bảng xoay 3 góc ➔ Chọn **Giọng nói (`Achernar..Zubenelgenubi` hoặc `Custom Voice` 0đ)** + điền **Tính cách**. | **`0 Credit`** |
| **2. Tạo Bối cảnh & Keyframes Đầu/Cuối sắc nét** | Dùng **🍌 Nano Banana Pro** (`Thinking Level: Extra thorough` hoặc `Follows prompt literally`) + **Upscale 2K/4K**. Nếu cần cảnh lia máy rộng/dọc, chọn tỷ lệ `21:9`, `4:1`, `8:1` hoặc `1:4`, `1:8`. | **`0 Credit`** |
| **3. Sửa chi tiết sai trên ảnh Keyframe trước khi quay** | Mở ảnh vào `/edit/:workflowId` ➔ Khoanh vùng **`Box` / `Lasso`** hoặc vẽ tay **`Doodle`** + lệnh sửa. | **`0 Credit`** |
| **4. Thử nghiệm chuyển động video không tốn tiền / siêu rẻ** | Dùng **Veo 3.1 Lite (Lower Priority)** (**`0 Credit`**) hoặc **Omni 1.2 Flash 360p** (**`1 Credit/giây`**). Nhớ **TẮT** công tắc `Trả về video không có âm thanh` trong cài đặt lưới để được hoàn tiền tự động nếu âm thanh lỗi! | **`0 cr`** hoặc **`1 cr/s`** |
| **5. Sửa hành động / diễn biến bị sai trong Video đã tạo** | Mở video vào `/edit/:workflowId` ➔ Chọn **Chỉnh sửa video (`EDIT_VIDEO` - Omni 1.2 Edit)** ➔ Nhập câu lệnh mô tả lại pha hành động cần sửa. | **`0 Credit`** |
| **6. Quay cảnh hành động Master ghép Nhân vật (`@Character`) + Bối cảnh (`@Image`)** | Dùng **Veo 3.1 - Fast (`veo_3_1_r2v_fast_*_ultra`)** chế độ **Ingredients (`R2V`)** hoặc khóa 2 đầu **`Start + End Frame`**. Nếu cần cú máy dài `10s–15s` hoặc số giây lẻ (`3s, 5s, 7s, 9s, 13s`), dùng **Omni 1.2 Flash 720p**. | **`10 Credits`** (Veo Fast)<br>`3 cr/s` (Omni 720p) |
| **7. Tạo góc máy thứ 2 (Cận cảnh / Góc thấp / Orbit / Dolly Zoom) từ cảnh đã có** | Mở video vào `/edit/:workflowId` ➔ Chọn **Camera (`Reshoot`)** ➔ Chọn 1 trong **7 Vị trí** + **8 Chuyển động máy quay**. | **`10–20 Credits`** |
| **8. Nối dài cảnh (`20s–60s`) mà KHÔNG bị mờ nhòe hay biến dạng mặt** | Dừng ở khung hình đẹp nhất cuối clip trong SceneBuilder ➔ Bấm **Lưu khung hình (`Save Frame` - RPC `jeNy9c`)** ➔ Dùng ảnh vừa lưu làm `Start Frame` kèm `@Character` cho clip mới (thay vì bấm `Extend` liên tục quá 3 lần trên 1 clip). | **`0 Credit`** (Lưu frame) |
| **9. Nâng cấp độ nét Full HD / 4K & Hòa âm 3 lớp** | Bấm **Upscale 720p (`omni_upsampler_360p` = `0 cr`)** ➔ **Upscale 1080p (`veo_3_1_upsampler_1080p` = `0 cr`)** cho từng clip trước khi ghép trên SceneBuilder ➔ Phối âm bằng **Mondo Sónico** / **Voiceover Studio** trong `/tools`. | **`0 Credit`** (1080p) |

---

## 11. Những Giới Hạn Kỹ Thuật Bắt Buộc Phải Nhớ (Constraints & Guardrails)

1. **`Insert`, `Remove` và `Camera Reshoot` chỉ chạy trên clip đơn lẻ gốc**: Không áp dụng được trên clip đã bấm `Extend`. Hãy thực hiện `Insert/Remove/Camera` trước khi `Extend`, hoặc dùng `Save Frame` để tách thành clip mới.
2. **Giới hạn thời lượng khi Upscale Video**: Tối đa **`60 giây`** (`dur <= 60s`) cho các bộ Upsampler `720p/1080p/4K` (riêng một số biến thể cũ giới hạn `8s` hoặc `40s`). Do đó **luôn Upscale từng clip thành phần trước khi nối trong SceneBuilder**.
3. **Quy tắc Khung hình Cuối (`MISSING_PAIRED_FRAME`)**: Bắt buộc phải có `Start Frame` thì mới gắn được `End Frame`.
4. **Quy tắc Thành phần Âm thanh (`MISSING_VISUAL_INGREDIENT`)**: Giọng nói (`@Voice`) không thể dùng một mình và không dùng cho tạo ảnh; phải đi kèm ít nhất 1 thành phần hình ảnh (`@Character` hoặc `@Image`).
5. **Quy tắc Nhân vật (`INVALID_CHARACTER_NO_IMAGES`)**: Một thực thể `@Character` bắt buộc phải có ít nhất 1 bức ảnh (ở Slot Chân dung) thì mới đưa vào câu lệnh được, và hiện chưa hỗ trợ copy/paste trực tiếp thực thể nhân vật sang một Project khác (`Hiện không hỗ trợ dán các nhân vật giữa các dự án`).
6. **Giới hạn Bộ sưu tập (`Collections`)**: Tối đa **50 bộ sưu tập** trong một cấp thư mục.

---

## 12. Bảng Tra Cứu Toàn Bộ 38 Mã RPC API Nội Bộ (`batchexecute`) Cho Tự Động Hóa SDK

Tất cả các thao tác trên giao diện Google Flow đều được thực thi qua endpoint:
`POST https://flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute`
*(Có thể gọi trực tiếp từ Node.js qua lớp [`FlowUltraSdk`](file:///d:/myProject/test-AI/flow-ultra-sdk.mjs) trong dự án của bạn)*.

### 12.1. Nhóm RPC Tài Khoản, Cấu Hình & Dự Án (`Project & Catalog`)
| Mã RPC (`rpcid`) | Ký hiệu Nội bộ | Chức năng Chi tiết |
| :--- | :---: | :--- |
| **`nzlxg`** | `getCreditBalance` | Kiểm tra số dư Credits (`24.596`), hạng gói cước (`Ultra`) và ngày reset. |
| **`HTrJv`** | `Bob` / `Cob` | Lấy toàn bộ Danh mục Model Video, Ảnh, Upsampler, Audio TTS (`gemini_v4s_tts_flow`) và bảng giá. |
| **`yBhWQ`** | `Hob` / `Iob` | Kiểm tra trạng thái hoạt động (`MODEL_STATUSES`) của các mô hình. |
| **`Zzl0ze`** | `Dob` / `Eob` | **Tải toàn bộ dữ liệu Dự án (`projects/<id>`)**: Workflows, Media, 30 Preset Voices, Collections, Characters, Scenes & SceneClips. |
| **`cPZSdc`** / **`ngNC2`** | `Apb` | Lấy/cập nhật Model Video và Model Ảnh mặc định của dự án. |
| **`as29s`** | `_.ecb` / `_.ngb` | Lấy thông tin chi tiết và URL tải xuống của 1 Media (`GetMedia`). |
| **`heTLee`** | `JQb` / `KQb` | Tìm kiếm Media & Thành phần trong dự án (`SearchMedia`). |
| **`syFRRe`** | `Pfb` / `_.Qfb` | Kiểm tra quyền truy cập dự án (`Owner` / `Editor`). |
| **`uhRpkc`** | `_.MSb` / `hmc` | Chia sẻ dự án với người dùng khác (`SHARE_PROJECT`). |
| **`J2mwWb`** | `_.B8b` / `c9b` | Tạo đường link chia sẻ công khai cho Media/Scene (`ShareMedia`). |
| **`Docasf`** | `rZb` / `sZb` | Gửi báo cáo / gắn cờ phản hồi chất lượng kết quả (`SubmitFeedback`). |

### 12.2. Nhóm RPC Phòng Studio Nhân Vật & Giọng Nói (`Character & Voice Studio`)
| Mã RPC (`rpcid`) | Ký hiệu Nội bộ | Chức năng Chi tiết |
| :--- | :---: | :--- |
| **`C4BZMd`** | `wqb` / `xqb` | **Tạo Thực thể Nhân vật mới (`create_entity`, `PY: 1`)** trong dự án hoặc bộ sưu tập. |
| **`YIBQMe`** | `pqb` / `qqb` | **Đọc chi tiết Hồ sơ Nhân vật (`getEntity`)**: Lấy dữ liệu Slot Chân dung, Slot Cơ thể, Tính cách, Giọng nói. |
| **`rzMKMb`** | `arb` / `brb` | **Cập nhật Hồ sơ Nhân vật (`updateEntity`)**: Đổi tên, lưu Tính cách (`personality_notes`), gắn Giọng nói (`audio_references`), đổi ảnh đại diện từng Slot (`set_character_slot_primary_media`), xóa Slot (`clear_character_reference_slot`), hoặc Yêu thích. |
| **`LXpojc`** | `Dqb` / `Eqb` | **Nhân bản Nhân vật (`copy_character`)** trong dự án. |
| **`eAenfb`** | `_.Jqb` / `_.O0b` | **AI Tạo & Định dạng Câu lệnh Nhân vật**: Gửi `[1..6]` để tạo prompt theo 6 Khuôn mẫu (`GENERATE_CHARACTER_PROMPT`), hoặc gửi `[null, "mô tả"]` để viết lại prompt chân dung chuẩn (`FORMAT_CHARACTER_PROMPT`). |
| **`no0P6`** | `Tyb` / `Uyb` | **Tạo Bản nghe thử Giọng nói Tùy chỉnh (`GENERATE_VOICE_PREVIEW` / `BatchGenerateAudio`)** bằng `gemini_v4s_tts_flow` (**0 Credit**, trả về WAV 24kHz 16-bit). |
| **`lt8g5`** | `Xyb` / `Yyb` | **Lưu Giọng nói Tùy chỉnh mới (`SAVE_CUSTOM_VOICE`)** vào thư viện dự án. |

### 12.3. Nhóm RPC Tạo & Chỉnh Sửa Hình Ảnh, Video, Upscale (`Generation & Editing`)
| Mã RPC (`rpcid`) | Ký hiệu Nội bộ | Chức năng Chi tiết |
| :--- | :---: | :--- |
| **`Z9cAtf`** | `Snb` | **Tạo hoặc Chỉnh sửa Hình ảnh (`GENERATE_IMAGE`)** với Nano Banana Pro / Imagen 3.5 (bao gồm cả tạo ảnh vào Slot Nhân vật `generate_image_into_entity`). |
| **`SPrCad` / `LcEY2c`** | `dpb` / `Pnb` | **Nâng cấp độ phân giải Ảnh lên 2K / 4K (`UPSAMPLE_IMAGE` — 0 Credit)**. |
| **`YhhmEf`** | `rpb` / `spb` | **Tạo Video từ Văn bản (`TEXT` — T2V)**. |
| **`eb1hJf`** | `ppb` / `qpb` | **Tạo Video từ Khung hình Đầu (`START_FRAME` — I2V)**. |
| **`nprQif`** | `npb` / `opb` | **Tạo Video từ Khung hình Đầu + Cuối (`START_END_FRAMES` — FL)**. |
| **`MZZa6b`** | `lpb` / `mpb` | **Tạo Video từ Thành phần Tham chiếu (`REFERENCES` — R2V: `@Character`, `@Image`, `@Voice`, `@me`)**. |
| **`jIps6`** | `fpb` / `gpb` | **Chỉnh sửa Video bằng Câu lệnh (`EDIT_VIDEO` — `macaron_cookie_edit` 0 Credit!)**. |
| **`fZytfe`** | `jpb` / `kpb` | **Kéo dài Video (`EXTEND_VIDEO` — Omni 1.2 Extend 3s–10s / Veo 3.1 Extend)**. |
| **`p0UkFb`** | `tpb` / `upb` | **Nâng cấp độ phân giải Video (`UPSAMPLE_VIDEO` — 720p / 1080p 0 Credit / 4K 50 Credits)**. |
| **`IJhj9c`** | `hpb` / `ipb` | Tạo Video chế độ Thử nghiệm (`EXPERIMENTAL`). |
| **`jwpduf`** | `vpb` / `wpb` | **Kiểm tra tiến độ tạo Video/Audio bất đồng bộ (`Poll Status`)**. |
| **`jeNy9c`** | `Kob` | **Trích xuất & Lưu 1 Khung hình Video thành Ảnh tĩnh (`SAVE_VIDEO_FRAME`)**. |
| **`iVqlKd`** | `Xob` / `Yob` | Lưu điểm cắt tỉa thời lượng trên một Video đơn lẻ (`set_video_trim_seconds`). |

### 12.4. Nhóm RPC Quản Lý SceneBuilder, Bộ Sưu Tập, Thùng Rác & Flow Tools
| Mã RPC (`rpcid`) | Ký hiệu Nội bộ | Chức năng Chi tiết |
| :--- | :---: | :--- |
| **`v93Y7c` / `ff8k9b` / `B6L7K`** | `create/rename/deleteScene` | Tạo Scene mới, Đổi tên Scene, Xóa Scene. |
| **`BpMsoe`** | `Wob` / `eR` | Cập nhật trạng thái Yêu thích / Thùng rác của Scene (`scene_metadata`). |
| **`dtQlBe`** | `Rob` / `Sob` | Cập nhật 1 Clip trên dòng thời gian SceneBuilder (`scene_clip_mutation`: Trim In/Out hoặc đổi phiên bản clip). |
| **`GoMJte`** | `Uob` / `Vob` | Cập nhật danh sách & thứ tự toàn bộ các Clip trong Scene (`scene_reorder_clip_mutation` / `add_workflows_to_scene`). |
| **`GjQLTd` / `IxdSwd`** | `Epb` / `Cpb` | Kết xuất (Render nối file trên server) và tải xuống toàn bộ Scene thành 1 file `.MP4`. |
| **`O2COMe`** | `Pob` / `cR` | Cập nhật Bộ sưu tập (`COLLECTION`: Đổi tên, Yêu thích, Đặt ảnh bìa). |
| **`mYWVGd`** | `Zob` / `_.gR` | Cập nhật Workflow đơn lẻ (`IMAGE` / `VIDEO` / `VOICE`: Đổi tên, Yêu thích). |
| **`XKxtXb` / `Sc7aEb`** | `tob` / `nob` | Nhân bản Workflow (`copy_workflow`) hoặc Sao chép Media ra dự án (`copy_project_media`). |
| **`kVdhHf`** | `gob` / `hob` | Di chuyển hàng loạt mục vào Bộ sưu tập (`batch_move_to_collection`). |
| **`pGCYOe`** | `job` / `kob` | Chuyển hàng loạt mục vào Thùng rác / Khôi phục (`batch_set_tiles_trashed`). |
| **`cz8Z4b`** | `Ynb` / `Znb` | Xóa vĩnh viễn hàng loạt mục khỏi dự án (`batch_delete_tiles`). |
| **`tRARke` / `qJcgMc` / `sd0GXe`** | `oVb` / `qVb` / `r_` | Quản lý danh sách Công cụ tùy chỉnh (`APPLETS`), công cụ đã lưu và ảnh thu nhỏ của công cụ. |
