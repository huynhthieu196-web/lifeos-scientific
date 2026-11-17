# LifeOS Scientific Advisor — Phương pháp & truy xuất bằng chứng

**Mục tiêu:** giúp người dùng tự theo dõi giấc ngủ, vận động, khối lượng công việc và thói quen nghỉ ngơi dựa trên số liệu họ chủ động nhập. Không sử dụng suy đoán theo tính cách, không chẩn đoán, không áp dụng tương quan quần thể thành nguy cơ cá nhân.

## Nguồn tham khảo và giới hạn

### AASM / SRS (2015): giấc ngủ
- Watson et al., *Recommended Amount of Sleep for a Healthy Adult: A Joint Consensus Statement of the American Academy of Sleep Medicine and Sleep Research Society*, **Sleep** (2015). https://pmc.ncbi.nlm.nih.gov/articles/PMC4434546/
- Kết luận sử dụng: người trưởng thành 18–60 nên ngủ **ít nhất 7 giờ/đêm thường xuyên** để hỗ trợ sức khỏe (đồng thuận chuyên gia).
- Quy tắc LifeOS: khi có ít nhất **5 đêm** nhập thời lượng trong 7 ngày gần nhất, và ít nhất **3 đêm < 7 giờ**, hiển thị lời nhắc xem lại thói quen ngủ. **5 đêm/3 đêm là ngưỡng đủ dữ liệu + cảnh báo của ứng dụng**, không phải ngưỡng do AASM công bố hay chẩn đoán rối loạn giấc ngủ. Chất lượng giấc ngủ không được suy ra từ thời lượng.

### WHO (2020): hoạt động thể lực
- Bull et al., *World Health Organization 2020 guidelines on physical activity and sedentary behaviour*, **British Journal of Sports Medicine** (2020). https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/
- Khuyến nghị sử dụng: **150–300 phút/tuần vận động aerobic mức vừa** hoặc **75–150 phút mức mạnh**, hoặc kết hợp tương đương cho người lớn.
- Quy đổi: `moderateEquivalentMinutes = moderateMinutes + 2 × vigorousMinutes`.
- Chỉ kích hoạt nhắc nhở nếu có số liệu **cả hai trường mức vừa và mức mạnh ở đủ 7 ngày**, và tổng tương đương < 150. Nếu bỏ trống một trường, không đánh đồng với 0 và không đánh giá cả tuần.
- Không dùng chỉ tiêu một tuần để phán xét sức khỏe; người có tình trạng sức khỏe đặc biệt cần tư vấn phù hợp.

### WHO / ILO (2021): thời gian làm việc dài
- WHO/ILO Joint Estimates (2021), nghiên cứu tổng hợp về thời lượng làm việc và bệnh tim thiếu máu cục bộ / đột quỵ. WHO: https://www.who.int/news-room/questions-and-answers/item/global-regional-and-national-burdens-of-ischemic-heart-disease-and-stroke-attributable-to-exposure-to-long-working-hours-for-194-countries-2000-2016
- Đối tượng so sánh trong nghiên cứu: **≥55 giờ/tuần** so với **35–40 giờ/tuần**. Đây là liên hệ nguy cơ ở mức quần thể trong nghiên cứu dài hạn; **không** có ý nghĩa "một tuần 55 giờ gây bệnh" và không tính xác suất bệnh cá nhân.
- LifeOS chỉ tính số phút **người dùng khai là giờ làm việc** (không tự cộng giờ học, giờ rảnh hay thời gian theo dõi toàn bộ), và yêu cầu dữ liệu 7/7 ngày để tổng tuần có nghĩa.

### Micro-breaks (2022): những khoảng nghỉ ngắn
- Albulescu et al., *"Give me a break!" A systematic review and meta-analysis on the efficacy of micro-breaks for increasing well-being and performance*, **PLOS ONE** (2022). https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0272460
- Kết quả phân tích tổng hợp: tăng sinh lực và giảm mệt mỏi mức nhỏ; **không tìm thấy tác động có ý nghĩa thống kê lên hiệu suất tổng thể**.
- LifeOS có thể hiện gợi ý thử nghỉ ngắn nếu tổng phiên hoạt động chính đã ghi nhận ≥40 giờ trong 7 ngày. Ngưỡng 40 giờ là **bộ lọc hiển thị kỹ thuật**, **không phải khuyến nghị khoa học**. Phiên có thể trùng thời gian; không gọi đó là giờ lao động hay hiệu suất.

## Dữ liệu và cách đánh giá

- Nguồn số liệu: `User` (định danh riêng), `Item[type=scientific_daily_log]` (nhật ký số liệu), `Item[type=task]` (công việc), `ActivitySession` (phiên hoạt động).
- Một nhật ký / ngày / người dùng, khóa được tạo ổn định từ `ownerId + date`, API xác thực phiên và luôn kiểm tra `ownerId`. Nhật ký lưu tại Supabase PostgreSQL.
- Trường `null` = **chưa ghi nhận**, `0` = **đã ghi nhận bằng không**. Đây là điểm khác biệt bắt buộc để tránh kết luận giả.
- Cửa sổ: 7 ngày lịch gần nhất bao gồm hôm nay. Vào giữa ngày, việc chưa nhập số liệu hôm nay có thể khiến chỉ số tuần bị hoãn.
- Biểu đồ 30 ngày, thống kê đếm trạng thái công việc và phân bố 4 ô Eisenhower có tính mô tả, **không tự được coi là khoa học chứng minh** tác dụng ưu tiên nào tốt hơn.
- Thời gian hoạt động `isPrimary` được cộng mô tả; các phiên chồng lấp có thể khiến tổng cao hơn thời gian thực. Không đồng nhất với "làm việc trả lương" hoặc 24 giờ mỗi ngày.
- Nếu số bảng vượt 5.000 hàng, API đánh dấu `truncated` để UI cảnh báo các thống kê chưa đầy đủ.
- Bộ quy tắc không kết luận nhân quả, chất lượng học tập, bệnh lý tâm thần, năng suất, burnout hay công việc nào phải bỏ.
- Báo cáo Power BI đọc chính các cột khuyến nghị đã được tạo bởi backend, kèm `EvidenceId`, `Caveat`, và danh sách nguồn. Việc xuất CSV không tự làm dữ liệu "live".

## Kiểm soát bảo mật
- Thanh Thiệu và Cao Kỳ có `ownerId` riêng; mọi truy vấn của API báo cáo, nhật ký và CSV đều lọc theo id được xác minh từ cookie phiên, không lấy id từ query/URL.
- Preview còn bảo vệ bằng Vercel SSO, API không mở CORS. Không công khai báo cáo hoặc danh sách người dùng.
- Chưa bật Power BI Service refresh do cần tài khoản Microsoft và cấp quyền dữ liệu đọc tối thiểu; không dùng mật khẩu PostgreSQL quản trị cho Power BI.
- Mật khẩu đã chia sẻ trong hội thoại có nguy cơ lộ; thay đổi thành mật khẩu riêng trước khi dùng dữ liệu nhạy cảm.
