FROM nginx:1.27-alpine

COPY index.html /usr/share/nginx/html/index.html
COPY *.jpg /usr/share/nginx/html/
COPY motion.css /usr/share/nginx/html/motion.css
COPY motion.js /usr/share/nginx/html/motion.js

RUN sed -i 's#</head>#  <link rel="stylesheet" href="/motion.css">\n</head>#' /usr/share/nginx/html/index.html \
    && sed -i 's#</body>#  <script src="/motion.js" defer></script>\n</body>#' /usr/share/nginx/html/index.html

EXPOSE 80
