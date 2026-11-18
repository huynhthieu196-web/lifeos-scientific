# LifeOS Native Analytics (không cần Power BI)

## Trạng thái

**Đã triển khai trong mã nguồn**: Dashboard hiện có `src/components/life-os/views/dashboard-view.tsx` được bổ sung một `AnalyticsDashboardPanel` (không sửa menu, không thay các phân hệ cũ). Phía server là `/api/analytics?days=7|30|90`; các biểu đồ dùng Recharts; các khuyến nghị khoa học từ API `/api/scientific-report`.

**Không dùng Power BI**: người dùng đã thay đổi yêu cầu. Không có phụ thuộc Microsoft. API Power BI xuất dữ liệu cũ vẫn giữ để tương thích, nhưng nút export không còn nằm trong trang Scientific Insights.

## Nội dung Dashboard

- Chọn 7 / 30 / 90 ngày, mọi biểu đồ thống kê cập nhật theo khoảng này.
- KPI: số công việc được tạo, hoàn thành theo timestamp, việc đang mở, thời gian ghi nhận và số lượt tick thói quen.
- Công việc: các cột công việc tạo/hoàn thành mỗi ngày, không nhầm tỷ lệ hoàn thành với số việc tạo trong cùng khoảng.
- Thời gian: tổng thời gian theo ngày và biểu đồ donut phân bổ **theo nguyên nhãn hoạt động người dùng nhập**. Chỉ tính những phiên `isPrimary=true` và thời lượng hợp lệ; phiên có thể chồng lấp, do đó không gọi là tổng thời gian thực.
- Ma trận Eisenhower: 4 ô I-IV + chưa phân loại cho công việc chưa hoàn thành.
- Thói quen: lượt check-in có giá trị >0 theo ngày + lịch nhiệt. Ngày không ghi không bị coi là thất bại.
- Sức khỏe: thời lượng ngủ và tâm trạng đã khai báo theo ngày, dữ liệu thiếu biểu diễn null, không suy đoán 0.
- Khuyến nghị: do bộ máy `scientific-advisor.ts` tính, hiển thị quan sát, hành động đề xuất, caveat và URL nguồn. **Khuyến nghị khoa học luôn dùng 7 ngày gần nhất**, bộ lọc 7/30/90 ngày chỉ áp dụng biểu đồ.

## Chính sách số liệu / an toàn

1. Mọi truy vấn API xác thực bằng `currentUserId(req)`, tất cả nguồn ghi `ownerId` hoặc `userId`; không có tham số chọn tài khoản.
2. Mọi phản hồi dùng `private, no-store` để không cache công khai.
3. Dữ liệu bị cắt bởi `take` có dấu `truncated` trong response và UI cảnh báo kết quả có thể chưa đầy đủ.
4. Không dùng dữ liệu giả trên giao diện; khi trống cần hiển thị hướng dẫn nhập liệu.
5. Tương quan/biểu đồ mô tả không chứng minh quan hệ nhân quả hoặc chẩn đoán bệnh.
6. Dữ liệu ghi qua Supabase hiện có, không cần tệp Excel, Power BI hoặc lưu máy.
7. Mỗi lần thay đổi công việc, habit log hoặc review qua React Query mutation, tự làm mới analytics; trang dashboard cũng refresh khi người dùng quay lại tab và định kỳ khi mở.

## Code và kiểm thử

- `src/lib/lifeos-analytics.ts`: pure aggregator sử dụng 7/30/90 ngày theo múi giờ Asia/Ho_Chi_Minh.
- `src/app/api/analytics/route.ts`: query Supabase/Prisma có scope theo phiên.
- `src/components/life-os/analytics-dashboard-panel.tsx`: KPI, bar, line, donut, heatmap và khuyến nghị.
- `tests/lifeos-analytics.test.ts`: case thiếu dữ liệu, số 0 thực, timestamp hoàn thành, việc quá hạn, lọc ngày, phân loại hoạt động và habit log.
- `docs/scientific-methodology.md`: bảng nguồn WHO / AASM / WHO–ILO / PLOS ONE và giới hạn của từng lời khuyên.

Trạng thái Vercel Preview chỉ được gọi **đã triển khai** sau khi Vercel báo READY. Bản chạy vẫn có lớp bảo vệ Vercel Authentication (không được tắt để lấy link công khai).
