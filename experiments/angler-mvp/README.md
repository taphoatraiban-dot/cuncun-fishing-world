# CUNCUN Fishing World — MVP thử nghiệm V1

Trang chơi riêng, dùng tài sản Blender thật. Không gọi backend hiện có, không sửa trang chính, không cấp vé/điểm máy chủ và không tích hợp thanh toán.

## Chạy

Cần Node.js 20 trở lên, không cần cài package:

```sh
node server.mjs
```

Mở `http://localhost:4178/` trên Mac. iPhone cùng Wi-Fi mở `http://<IP-của-Mac>:4178/`. Cho phép ứng dụng Node truy cập mạng nội bộ nếu macOS hỏi. Không mở trực tiếp `index.html` bằng `file://` vì trình tải GLB cần HTTP. Tất cả thư viện và asset nằm trong thư mục này, không cần CDN hoặc Blender khi chơi.

## Điều khiển

1. THẢ CÂU. Chờ phao rung/nhô nhẹ, tiếp tục đợi cú chìm rõ và thông báo CÁ CẮN.
2. GIẬT CẦN trong khoảng tín hiệu. Giật sớm hoặc muộn sẽ trượt cá.
3. Giữ nút để kéo, nhả để giảm lực căng. Kéo thanh ngang ngược hướng cá. Căng trên 97% quá 0,6 giây sẽ đứt dây.
4. Khi cá mệt và về sát sàn, trình diễn đưa cá lên/vợt/khoe cá rồi hiển thị loài, kg và điểm. Bấm CÂU TIẾP.
5. Âm bật/tắt ở góc phải. Mượt ưu tiên tốc độ, Đẹp tăng độ nét và bật bóng đổ.

Điểm lưu cục bộ theo trình duyệt. Chưa gửi điểm lên hệ thống trực tuyến. Tiến trình dừng khi trang ẩn; đổi tab hoặc mất chạm sẽ tự nhả kéo.

## Mã và khả năng mở rộng

- `game.js`: máy trạng thái độc lập với đồ họa; nhận nguồn ngẫu nhiên và phát sự kiện. Có thể thay adapter nhập liệu/đồng bộ máy chủ mà giữ cách hiển thị.
- `species.js`: 5 loài, khoảng cân nặng và quy tắc điểm riêng; dữ liệu mẫu, không phải mô phỏng sinh học/kinh tế.
- `main.js`: tải GLB, trộn clip, uốn xương cần theo lực căng, nối dây đến phao/lưỡi, chuyển động phao, sóng và hạt nước; camera dọc, LOD/culling 29 cụm rừng xa.
- `audio.js`: âm tổng hợp tự tạo bằng Web Audio, chỉ phát sau thao tác người dùng.
- `assets/`: nhân vật ngồi, hồ, thùng, 5 cá, cần, phao/lưỡi và vợt. Các file riêng dùng tái sử dụng; hồ đã chứa nhân vật/thùng nên không tải trùng hai file đó trong trang chơi.
- `fishing_spots.json`: 5 điểm neo gốc; chuẩn bị thay cơ chế chọn sàn về sau. Chưa triển khai 200 người, multiplayer, vé, TikTok LIVE hay thanh toán trong trang này.

## Kiểm thử

```sh
node --test tests/*.test.mjs
```

9 kiểm thử logic bao phủ giật sớm/muộn, đứt dây, bắt cá, chơi lại, cân nặng, cả 5 loài ở khối lượng tối đa và cơ chế nhả kéo. Báo cáo trình duyệt và ảnh chụp thực nằm trong gói bàn giao `qa/`. Tham số `?test=1` chỉ phục vụ bộ kiểm thử cục bộ, mở đối tượng điều khiển mô phỏng `window.__mvp`; không dùng nó làm cơ sở cấp thưởng thật.

Đã thử Chromium và WebKit trên Mac M4, khung 390×844 và 375×667. Chưa thử Safari trên iPhone vật lý. FPS headless trên Mac không phải FPS iPhone.

## Giới hạn đồ họa và hoạt ảnh

Các clip câu cá là bản phác bằng xương, có chuyển tiếp nhưng chưa có ràng buộc IK chuẩn cho cả hai tay, cán cần, vợt và cá chiến lợi phẩm. Mô hình cá mang tính mẫu và chuyển động đơn giản. Mặt nước dùng phản xạ môi trường PBR/normal động, vòng sóng và hạt nước; chưa có phản chiếu hình học toàn cảnh theo thời gian thực hoặc chất lỏng vật lý.

Không tuyên bố đạt chất lượng hình ảnh game thương mại hoặc đã tối ưu xong cho mọi iPhone. Cảnh vẫn cần giảm draw call, atlas vật liệu, LOD tốt hơn và đo trên thiết bị thật.

## Giấy phép

Three.js r180: MIT, tại `vendor/THREE_LICENSE.txt`. Phần nhân vật MakeHuman kế thừa: xem `MakeHuman_character_LICENSE.md`. Cá, cần, thùng và âm tổng hợp mới do lượt làm việc này dựng từ hình học/mã; không lấy tài sản của game hay thương hiệu tham khảo. Không dùng dịch vụ trả phí.
