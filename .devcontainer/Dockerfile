# Dev Container construido a partir de la imagen oficial de Node.js de Docker Hub.
# node:24-bookworm: Node.js 24 sobre Debian 12 (bookworm), con npm y git.
FROM node:24-bookworm

# Sin el aviso de versiones nuevas de npm en cada orden.
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# Navegadores de Playwright en una carpeta común, fuera de la del usuario.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Chromium y las librerías del sistema que necesita. Se instala como administrador (antes de USER node)
# y con la misma versión que @playwright/test en package.json.
RUN npx --yes playwright@1.63.0 install --with-deps chromium

# La imagen ya trae el usuario node (sin privilegios de administrador): se trabaja con él.
USER node
