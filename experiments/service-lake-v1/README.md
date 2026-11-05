# Hồ dịch vụ CUNCUN — giai đoạn 2

Trang thử riêng từ nhánh kế hoạch `feature/practice-fishing-mvp-20261104`. Nhân vật, thùng và cảnh có file Blender thật trong gói bàn giao. Không phải bản phát hành V1.0 hoàn chỉnh.

## Mở

Từ gốc repository: `npm run preview:lake` (hoặc `node experiments/service-lake-v1/server.mjs`). Mở `http://localhost:4180/`. iPhone cùng mạng mở `http://<IP-Mac>:4180/`. Preview này chỉ phục vụ file trò chơi và module EXP dùng chung, không có API giao dịch.

Backend hiện có cũng phục vụ `/experiments/service-lake-v1/` bằng route đọc riêng; các API cũ giữ nguyên. Chưa deploy production hoặc staging công khai.

## Chơi

1. Trong Bộ đồ câu, chọn cần, dây trục/thẻo, phao, chì, lưỡi và Lắp bộ đồ. Thẻo phải nhỏ hơn trục, chì phải phù hợp phao.
2. Chọn hai nguyên liệu và lượng nước, Trộn mồi, Xả ổ nếu muốn tăng nhịp cá ghé.
3. Đo đáy, đặt độ sâu và Cân/chỉnh phao. Sai quá 15 cm phải chỉnh lại.
4. Ra điểm câu, Thả câu. Chờ rung/nhô, chỉ giật khi phao chìm và báo cá cắn.
5. Giữ để kéo, nhả khi căng; có thể kéo ngang trên nút hoặc dùng thanh hướng để dìu ngược chiều cá.
6. Cá về gần sẽ được vợt, cân và hiện EXP/xu tập. Chụp chiến lợi phẩm tạo ảnh PNG từ khung 3D thật.

Giải trí có bộ chuẩn bị sẵn và cửa sổ giật dài hơn; Chân thực yêu cầu chuẩn bị hợp lệ. Cả hai dùng cùng máy trạng thái. Mồi ưu tiên loài theo các ID trong danh mục cá cũ. Dây/chiều dài cần thay đổi lực và khoảng cách mô phỏng.

Có 5 sàn; đổi sàn phải đo/chỉnh phao lại. Dạo bờ hồ cho phép đi trên một vòng lối đi giới hạn; giữ thanh hướng (hoặc A/D, phím trái/phải trên máy tính), ngồi ở sàn gần nhất để câu. Đây chưa phải thế giới tự do có va chạm hoàn chỉnh.

Đồ họa Thấp/Vừa/Cao, Bình minh/Hoàng hôn/Ban đêm, camera người chơi/từ mắt/toàn cảnh và LIVE 9:16 có letterbox đúng tỷ lệ. Nhịp khung thấp kéo dài sẽ tự giảm xuống Thấp khi chưa chọn thủ công. LIVE là camera mô phỏng, chưa kết nối TikTok.

## Dữ liệu và tài sản

- `session.js` nhập và dùng trực tiếp `../../fishing-progression.js`; không thay thế EXP cũ.
- 25 ID cá và 14 mồi được chụp từ catalog hiện có; hiện chỉ có 5 loài có mẫu GLB. Không thay catalog server.
- EXP, xu tập, bộ đồ và ảnh chỉ ở phiên demo; không tiêu vé, không ghi tài khoản, không gửi giao dịch, không đổi xu thành tiền.
- `world.js` dùng môi trường GLB, các cụm cây/hoa/chòi instancing và LOD thùng xa. Avatar giữ 52 xương; 14 clip là bản phác có chỉnh tay/thở/chớp mắt.
- Bản Blender hồ: `CUNCUN_Service_Lake_V3.blend`. LOD thùng: `CUNCUN_Box_V1_Distant_LOD.blend`. Tài sản gốc được giữ và sao lưu.

## Kiểm thử

`npm run test:progression` và `npm run test:lake`. Bài browser: `node tests/service-lake-browser.mjs` sau khi chạy backend thử; có thể đặt `PRACTICE_V1_URL`, `PW_ENGINE=webkit`, `QA_DIR`.

Đã chạy trong Chromium/WebKit trên Mac ở kích thước iPhone ngang, không đồng nghĩa đã đo trên iPhone thật. Chưa xác nhận sức tải 200 người.

## Còn thiếu

Tay/ngón/vợt và cá đã gắn theo xương tay nhưng chưa có IK và va chạm hoàn chỉnh; clip đi/chạy là bản phác, không có foot IK. Trộn/xả mồi hiện là thao tác UI và luật chơi, chưa có hoạt ảnh tay trộn mồi. Nước phản xạ bầu trời gần đúng bằng shader, không phản chiếu toàn cảnh theo thời gian thực. Nhân vật nữ, hoàn thiện mặt/tóc ở mức thương mại, sông, hub, shop/garage, kinh tế có lưu, thời tiết ảnh hưởng cá và multiplayer/TikTok thật thuộc các bước sau.
