FROM node:22-alpine

WORKDIR /app

# Copy package manifests first for efficient caching
COPY package.json package-lock.json* ./

# Cài đặt dependencies hoàn toàn bên trong sandbox Linux
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Mở cổng 3000 cho Next.js
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Chạy ở chế độ dev với Hot-Reload
CMD ["npm", "run", "dev"]
