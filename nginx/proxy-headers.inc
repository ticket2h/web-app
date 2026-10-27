proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
# Ghi đè, không nối thêm: gateway là proxy đầu tiên, X-Forwarded-For do trình duyệt tự gửi là giả. core giới hạn
# request theo IP này (ADR-026); nối thêm thì bot đổi IP chỉ bằng cách gửi header khác nhau.
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_connect_timeout 2s;
proxy_read_timeout 30s;
