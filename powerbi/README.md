> **Cập nhật 18/11/2026:** Đã triển khai 12 view PostgreSQL trong schema `lifeos_bi`, chia theo Thanh Thiệu và Cao Kỳ với vai trò đọc riêng NOLOGIN; đã kiểm thử các quyền truy cập chéo đều bị từ chối. Tham khảo [kết nối trực tiếp Power BI đám mây](./cloud-connection.md). Các CSV bên dưới vẫn có thể dùng theo phiên đăng nhập; **Power BI Service chưa được kết nối/xuất bản, chưa cấu hình tự động refresh**.

# LifeOS Scientific × Microsoft Power BI — triển khai dữ liệu

## Trạng thái xác nhận (2026-11)
- **Đã triển khai**: dashboard khoa học trong LifeOS, API `/api/scientific-report`, nhập số liệu hằng ngày và bộ quy tắc có trích dẫn nguồn; 5 nguồn dữ liệu Power BI dạng CSV chỉ truy cập được sau đăng nhập LifeOS và đã lọc theo từng tài khoản.
- **Sẵn sàng kết nối**: cấu trúc bảng CSV, quy tắc số liệu, danh mục nguồn, measures DAX.
- **Chưa triển khai / chưa kiểm thử trong Microsoft**: workspace, semantic model .pbix/.pbip, dataset refresh trên Power BI Service, Power BI dashboard published và iframe embedding. Không được gọi là đã đồng bộ tự động.
- **Không có quyền quản trị Microsoft Power BI/Fabric** trong môi trường triển khai này. Không thể tự tạo báo cáo trên workspace Microsoft của người dùng khi chưa có phiên đăng nhập/ủy quyền hợp lệ. Không dùng tài khoản database Supabase `postgres` để đưa vào Power BI.

## Kiến trúc

```
Đăng nhập Thanh Thiệu hoặc Cao Kỳ
   ↓
LifeOS Next.js — xác thực phiên, kiểm tra ownerId tại mọi API
   ↓
Supabase PostgreSQL — User, Item, ActivitySession
   ↓
scientific-advisor.ts — quy tắc minh bạch, chỉ kích hoạt khi đủ số liệu
   ↓
LifeOS / Phân tích khoa học (đang hoạt động)
   ↓
/api/powerbi/export?dataset=... (CSV owner-scoped, snapshot)
   ↓
Power BI semantic model (chưa đăng ký trong Microsoft)
   ↓
Reports / dashboard / scheduled refresh (chưa bật)
```

## Dữ liệu xuất qua trình duyệt đã đăng nhập

Chọn **Phân tích khoa học → Dữ liệu cho Power BI** và tải lần lượt:

| Tham số `dataset` | Tên bảng Power BI | Cột chính | Kiểu |
|---|---|---|---|
| daily | FactDaily | Date, SleepHours, ModerateMinutes, VigorousMinutes, PaidWorkMinutes | Date, Decimal, Whole number |
| tasks | FactTasks | TaskId, Title, Status, CreatedDate, CompletedDate, DueDate, Quadrant, Priority | Text, Date, Whole number |
| sessions | FactSessions | SessionId, Date, Label, StartedAt, EndedAt, Minutes, IsPrimary | Text, DateTime, Whole number, Boolean |
| recommendations | FactRecommendations | RuleId, Category, Indicator, Observed, Target, RecordedDays, ObservationVi, AdviceVi, ObservationEn, AdviceEn, EvidenceId, Basis, CaveatVi, CaveatEn, ReportDate | Mixed |
| sources | DimEvidence | EvidenceId, Year, EvidenceType, Title, Organization, SourceURL, ClaimVi, ClaimEn | Mixed |

**Chỉ** tải CSV riêng theo tài khoản đã đăng nhập. Không bao gồm username/password/ownerId trong CSV. `FactRecommendations[EvidenceId]` là khóa ngoại đến `DimEvidence[EvidenceId]`. `FactTasks[Quadrant]` = do/schedule/delegate/eliminate/unclassified.

**Không nhập CSV qua cơ chế "legacy CSV import" cũ của Power BI Service.** Microsoft thông báo các semantic model tạo qua legacy CSV import ngừng refresh sau 31/07/2026. Khi sử dụng Power BI thật, cần dùng quy trình hỗ trợ hiện hành như Power Query, Dataflow Gen2 hoặc kết nối PostgreSQL cloud riêng có phân quyền. Tài liệu: https://learn.microsoft.com/en-us/power-bi/connect-data/refresh-data

## Semantic model và bố cục report gợi ý

Report 1 – **Tổng quan 30 ngày**: KPI công việc hoàn thành, giờ hoạt động chính theo ngày, số phiên, phân bổ Eisenhower, filter Date.

Report 2 – **Sức khỏe theo số liệu ghi nhận**: biểu đồ SleepHours theo ngày; ModerateMinutes + 2 × VigorousMinutes theo tuần *chỉ khi đủ 7 ngày có cả hai trường*; PaidWorkMinutes/60 theo tuần *chỉ khi đủ 7 ngày có số liệu*.

Report 3 – **Khuyến nghị có trích dẫn**: Table hoặc cards từ `FactRecommendations` (ObservationVi, AdviceVi, Target, RecordedDays, EvidenceId, CaveatVi). Thêm table `DimEvidence` chứa đường dẫn nguồn khoa học. Không tự đưa ngưỡng theo cảm tính vào DAX.

Report 4 – **Chất lượng dữ liệu**: số ngày có dữ liệu trên 7, tỷ lệ thiếu, lịch sử ngày bỏ trống; hiển thị "chưa đủ dữ liệu" thay vì bằng 0.

File `powerbi/measures.dax` chứa measures mô tả. Quan hệ: FactRecommendations[EvidenceId] many-to-one DimEvidence[EvidenceId]. Không cần join bằng accountId vì mỗi CSV lấy từ một phiên đã xác thực.

## Giới hạn kỹ thuật / bước còn cần trong Microsoft

1. Chủ sở hữu đăng nhập Power BI Service / Microsoft Fabric bằng tài khoản Microsoft. Tạo workspace do họ sở hữu.
2. Tạo semantic model dùng 5 bảng dữ liệu, áp dụng kiểu dữ liệu chính xác và các measure DAX.
3. Tạo biểu đồ / cards như trên. Cho phép kết nối đám mây hoặc lịch refresh **sau khi** có cơ chế cấp quyền đọc dữ liệu theo từng tài khoản, không dùng mật khẩu database quản trị.
4. Kiểm thử quyền riêng tư với **Thanh Thiệu** và **Cao Kỳ** riêng biệt trước khi phát hành hoặc chia sẻ.

Trong trạng thái hiện tại API CSV cần cookie đăng nhập và Preview Vercel còn được bảo vệ bởi SSO, nên **Power BI Service không thể tự động refresh qua URL CSV này**. Không tắt SSO hay công khai CSV để "khắc phục". Đồng bộ không cần tải máy (gatewayless PostgreSQL cloud connection) là khả thi theo Microsoft, nhưng phải thiết lập định danh Power BI với quyền SELECT tối thiểu và có tài khoản Microsoft để lưu credential một cách an toàn. Tài liệu: https://learn.microsoft.com/en-us/power-query/connectors/postgresql và https://learn.microsoft.com/en-us/power-bi/connect-data/refresh-scheduled-refresh.

## Minh bạch nguồn khoa học

Chi tiết `docs/scientific-methodology.md`. Hệ thống KHÔNG kết luận quan hệ nhân quả, không chẩn đoán bệnh và không coi số liệu thiếu là số 0. Cách tính phút vận động cường độ mạnh quy đổi tương đương với mức vừa theo khuyến nghị WHO.
