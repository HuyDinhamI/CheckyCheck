FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Sao chép tất cả các file dự án vào thư mục root của nginx
COPY . .

# Cổng mặc định của nginx là 80
EXPOSE 80

# Nginx sẽ tự động khởi động khi container chạy
CMD ["nginx", "-g", "daemon off;"]
