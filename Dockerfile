FROM node:22-alpine

RUN npm install --global --no-audit --no-fund http-server@14.1.1 \
    && npm cache clean --force

WORKDIR /app
COPY src/ /app/

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["http-server", "/app", "-a", "0.0.0.0", "-p", "80", "-c-1", "-d", "false"]
