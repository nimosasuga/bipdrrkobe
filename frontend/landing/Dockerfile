FROM nginx:1.27-alpine

COPY index.html /usr/share/nginx/html/index.html
COPY *.jpg /usr/share/nginx/html/
COPY motion.css /usr/share/nginx/html/motion.css
COPY responsive.css /usr/share/nginx/html/responsive.css
COPY motion.js /usr/share/nginx/html/motion.js
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY sitemap.xml /usr/share/nginx/html/sitemap.xml
COPY seo-head.html /tmp/seo-head.html

RUN sed -i 's#<title>DRRKOBE BIP — Cek Kondisi Battery Forklift Sebelum Downtime</title>#<title>Battery Forklift Cepat Drop? Cek Sebelum Downtime | DRRKOBE</title>#' /usr/share/nginx/html/index.html \
    && awk '1; /<head>/{while ((getline line < "/tmp/seo-head.html") > 0) print line}' /usr/share/nginx/html/index.html > /usr/share/nginx/html/index.tmp \
    && mv /usr/share/nginx/html/index.tmp /usr/share/nginx/html/index.html \
    && rm /tmp/seo-head.html \
    && sed -i 's#</head>#  <link rel="stylesheet" href="/motion.css">\n  <link rel="stylesheet" href="/responsive.css">\n</head>#' /usr/share/nginx/html/index.html \
    && sed -i 's#</body>#  <script src="/motion.js" defer></script>\n</body>#' /usr/share/nginx/html/index.html

EXPOSE 80
