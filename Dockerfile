# Orator File Translation
# Production image for file format conversion (image + PDF page extraction)
#
# Ubuntu is preferred over Alpine for PDF rendering because:
#   - poppler-utils has better font rendering with glibc
#   - More complete font packages for accurate PDF rasterization
#   - sharp (libvips) builds more reliably on Debian-based images
#   - pdftk-java is readily available
#
# Build:
#   docker build -t orator-conversion .
#
# Run:
#   docker run -p 8765:8765 orator-conversion
#
# Test:
#   curl -X POST --data-binary @photo.jpg \
#     -H "Content-Type: application/octet-stream" \
#     http://localhost:8765/conversion/1.0/image/jpg-to-png -o photo.png

FROM node:22-bookworm-slim

LABEL maintainer="steven velozo <steven@velozo.com>"
LABEL description="Orator File Translation - file format conversion service"

# Install system dependencies for PDF rendering and image processing
#   poppler-utils  - provides pdftoppm for PDF page rasterization
#   pdftk-java     - provides pdftk for PDF page extraction
#   fonts-dejavu   - base fonts for PDF rendering
#   fontconfig     - font configuration for consistent rendering
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		poppler-utils \
		pdftk-java \
		fonts-dejavu-core \
		fontconfig \
	&& rm -rf /var/lib/apt/lists/*

# Rebuild the font cache so pdftoppm can find system fonts
RUN fc-cache -f -v

WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package.json ./

# Install all dependencies (including devDependencies needed for the harness)
RUN npm install --production=false

# Copy application source
COPY source/ ./source/
COPY debug/Harness.js ./debug/Harness.js

EXPOSE 8765

# Health check against one of the conversion endpoints
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD node -e "const h=require('http');const r=h.request({hostname:'127.0.0.1',port:8765,path:'/conversion/1.0/image/jpg-to-png',method:'POST',timeout:3000},(s)=>{process.exit(s.statusCode===400?0:1)});r.on('error',()=>process.exit(1));r.end();"

CMD ["node", "debug/Harness.js"]
