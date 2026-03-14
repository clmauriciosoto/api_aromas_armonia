# Etapa 1: Build (compila el código TypeScript)
FROM node:22-alpine AS builder

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias de desarrollo
RUN npm ci

# Copiar el resto del proyecto
COPY . .

# Compilar el código TypeScript → JavaScript
RUN npm run build


# Etapa 2: Runtime (solo código compilado + dependencias de producción)
FROM node:22-alpine

WORKDIR /usr/src/app

# Copiar dist (compilado) y package.json
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar archivo .env para ejecución dentro del contenedor
COPY .env .env

# Exponer el puerto del servidor
EXPOSE 3001

# Healthcheck del contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD ["node", "-e", "const p=process.env.PORT||3001;const req=require('http').get('http://127.0.0.1:'+p+'/',res=>process.exit(res.statusCode===200?0:1));req.setTimeout(4000,()=>{req.destroy();process.exit(1)});req.on('error',()=>process.exit(1));"]

# Comando de inicio
CMD ["node", "dist/src/main.js"]
