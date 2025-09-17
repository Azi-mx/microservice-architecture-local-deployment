FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Generate Prisma client only during build
RUN npx prisma generate

EXPOSE 3003

# Create a startup script
RUN echo '#!/bin/sh\nnode index.js' > /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
