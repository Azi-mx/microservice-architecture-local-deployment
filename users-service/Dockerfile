FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

# Create a simple startup script file
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'node seed-data.js' >> /app/start.sh && \
    echo 'node index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/bin/sh", "/app/start.sh"]
