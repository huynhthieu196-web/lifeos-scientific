# Kết nối LifeOS → Power BI (cloud, tách biệt 2 tài khoản)

## Đã triển khai trong Supabase

Migration: [supabase-bi-views.sql](./supabase-bi-views.sql). Schema **`lifeos_bi`** không nằm trong phạm vi Data API công khai. Mỗi tài khoản có **6 view live read-only**:

| Nội dung | Thanh Thiệu | Cao Kỳ | Cột chính |
|---|---|---|---|
| Nhật ký khoa học | `thanh_daily` | `cao_daily` | Date, sleepHours, moderateMinutes, vigorousMinutes, paidWorkMinutes |
| Công việc + Eisenhower | `thanh_tasks` | `cao_tasks` | TaskId, Title, Status, CreatedDate, CompletedDate, DueDate, Priority, Quadrant |
| Phiên theo dõi thời gian | `thanh_sessions` | `cao_sessions` | SessionId, Date, Label, StartedAt, EndedAt, Minutes, IsPrimary |
| Thói quen | `thanh_habits` | `cao_habits` | LogId, HabitId, HabitTitle, Date, Value |
| Review | `thanh_reviews` | `cao_reviews` | ReviewId, Date, ReviewType, Mood, Energy |
| Dự án | `thanh_projects` | `cao_projects` | ProjectId, ProjectName, Status, Progress, CreatedDate, TargetDate, CompletedDate |

Các view không chứa email, mật khẩu, mã 2FA hoặc nhật ký tự do. Chỉ nhãn và thông tin người dùng đã ghi được xuất trong phần phù hợp.

Hai role `lifeos_bi_thanh` và `lifeos_bi_cao` hiện ở trạng thái **NOLOGIN**. Mỗi role chỉ được SELECT 6 view của chính mình. Đã xác minh `anon`/`authenticated` không có quyền USAGE schema; role một người không thể SELECT view người khác, không thể UPDATE bảng `public.Item` hay SELECT `public.User`.

Đây **chưa phải connection live Power BI**: chưa có Microsoft workspace, login database riêng cho BI, credential trong Power BI Service, semantic model hoặc refresh schedule.

## Thiết lập PostgreSQL connector khi Microsoft Power BI được kết nối

Tài liệu Microsoft: https://learn.microsoft.com/en-us/power-query/connectors/postgresql .
Tài liệu Supabase: https://supabase.com/docs/guides/database/connecting-to-postgres .

- **Server (Session pooler):** `aws-1-ap-south-1.pooler.supabase.com:5432`
- **Database:** `postgres`
- **Schema:** `lifeos_bi`
- **Account 1 role (chưa bật LOGIN):** `lifeos_bi_thanh.gskdxootdyzmvrzdtnzy`
- **Account 2 role (chưa bật LOGIN):** `lifeos_bi_cao.gskdxootdyzmvrzdtnzy`
- **Authentication:** Database login; mật khẩu BI riêng, ngẫu nhiên, chưa cấp
- **SSL:** Bắt buộc
- **Nguồn cloud:** Supabase PostgreSQL, không cần file Excel và không cần cài gateway địa phương nếu Power BI Service chấp nhận trực tiếp cloud source
- **Không sử dụng:** `postgres` admin login; mật khẩu Supabase của Next.js; service_role key; `6543` transaction pooler cho phiên Power Query dài hạn

### Power Query M ví dụ sau khi kích hoạt role

Tài khoản **Thanh Thiệu**:
```powerquery
let
    Source = PostgreSQL.Database(
        "aws-1-ap-south-1.pooler.supabase.com:5432",
        "postgres",
        [CreateNavigationProperties=false]
    ),
    FactDaily = Source{[Schema="lifeos_bi", Item="thanh_daily"]}[Data],
    Typed = Table.TransformColumnTypes(FactDaily, {
        {"Date", type date}, {"sleepHours", type number},
        {"moderateMinutes", Int64.Type}, {"vigorousMinutes", Int64.Type},
        {"paidWorkMinutes", Int64.Type}
    })
in
    Typed
```
Tài khoản **Cao Kỳ** dùng một connection được tạo riêng với role của Cao Kỳ và thay `thanh_daily` thành `cao_daily`. Tách riêng workspace/semantic model hoặc cấu hình quyền truy cập riêng; **không** kết hợp hai role trong một connection dùng chung.

## Mô hình, báo cáo và refresh

- Kết nối sáu view đúng account, đặt tên các bảng Power BI thành `FactDaily`, `FactTasks`, `FactSessions`, `FactHabits`, `FactReviews`, `DimProjects`.
- Quan hệ nội bộ: `FactHabits[HabitId]` liên hệ nhiều dòng cho cùng thói quen nhưng bảng danh mục thói quen chưa được tách riêng; tổng hợp theo HabitTitle và kiểm tra đổi tên nếu muốn theo dõi dài hạn. `FactTasks` không có ProjectId trong bản view hiện tại, nên biểu đồ dự án dùng DimProjects riêng chứ **không suy ra** task→project.
- Dùng measures [measures.dax](./measures.dax) để tính số giờ làm việc, vận động, hoàn thành công việc, nhóm Eisenhower. Measure chỉ trả giá trị khi đủ quan sát, không dùng 0 làm đại diện cho thiếu.
- Bố cục đề xuất: (1) tổng quan 30 ngày, (2) sức khỏe/hoạt động, (3) Eisenhower & dự án, (4) dữ liệu thiếu, (5) bằng chứng và khuyến nghị.
- Khuyến nghị hiện được **thực thi trực tiếp trong LifeOS** qua API `/api/scientific-report`, có nguồn và caveat. Power BI chưa có bảng SQL live dành cho khuyến nghị; các CSV `recommendations` và `sources` có thể lấy theo phiên đăng nhập để tham khảo, **không tự động refresh** từ URL đó trong Power BI Service.
- Bật refresh trong Power BI Service chỉ sau khi role BI được kích hoạt có mật khẩu mạnh và thử đăng nhập thành công; cần tài khoản Microsoft được cấp quyền workspace. Không dán secrets vào GitHub hoặc chat.

## Giới hạn / cảnh báo

1. Chưa hoàn tất kết nối Microsoft; không khẳng định có dashboard Power BI được publish.
2. Người dùng muốn hạn chế tối đa dung lượng máy, vì vậy ưu tiên Power BI Service và cloud PostgreSQL connector, không yêu cầu Power BI Desktop hoặc gateway cá nhân.
3. Role PostgreSQL NOLOGIN là một bước chặn có chủ đích, không phải lỗi. Chỉ cấp riêng mật khẩu + LOGIN trong một bước cấu hình an toàn khi đã có nơi lưu credential Microsoft.
4. Tất cả view dùng `security_barrier`; quyền bị giới hạn theo từng view và role PostgreSQL. Dữ liệu gốc vẫn được bảo vệ bằng RLS, không mở thành Data API công khai.
5. Để chống nhầm dữ liệu khi publish, phải kiểm thử cả hai connection riêng bằng dữ liệu mẫu trong giao dịch có rollback trước khi chia sẻ report.
