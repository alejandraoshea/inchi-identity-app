# InChI Identity — Web Application

Interactive web interface for the [InChI Identity](https://github.com/alejandraoshea/identity-levels-inchi) hierarchical molecular identity comparison framework. Allows researchers to compare molecular identifiers, select identity layers, upload spectral files, and visualize molecular structures directly in the browser — no programming knowledge required.

## Features

- Compare two InChI or SMILES strings across all six identity layers
- Select specific layers for targeted comparison
- Upload plain-text files for pairwise or cross-comparison of molecular identifier sets
- Upload MGF spectral files for identifier unification at a user-selected equivalence layer
- Download unified MGF output directly from the browser
- Interactive 3D molecular visualization via 3Dmol.js WebGL, with automatic 2D fallback via RDKit.js

## Requirements

This frontend requires the [InChI Identity API](https://github.com/alejandraoshea/inchi-identity-api) backend to be running and accessible.

## Configuration

The app uses the current browser origin as the backend base URL by default:

```javascript
window.API_CONFIG = {
    baseUrl: window.location.origin
};
```

Requests are sent to `/api/*`, so the recommended deployment is to serve the
frontend at `/` and proxy `/api/` to the Flask/Gunicorn backend on the same
domain.

Browser libraries used for molecule rendering are vendored under
`assets/vendor/`; the deployed frontend does not need public CDN access at
runtime.

## Deployment with Nginx

The intended test deployment is:

- Frontend: `https://metaboidentity.eps.uspceu.es/`
- Backend: proxied by Nginx under `https://metaboidentity.eps.uspceu.es/api/`
- Gunicorn backend target: `127.0.0.1:8080`
- Maximum request body size: `25m`

1. Install Nginx and copy the static frontend files:

```bash
sudo apt install nginx -y
sudo mkdir -p /var/www/inchi-identity-app
sudo rsync -a --delete /path/to/inchi-identity-app/ /var/www/inchi-identity-app/
```

2. Configure Nginx for the HTTPS domain. If TLS is managed by Certbot or
another platform tool, adapt the certificate directives to that setup.

```nginx
server {
    listen 80;
    server_name metaboidentity.eps.uspceu.es;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name metaboidentity.eps.uspceu.es;

    ssl_certificate /etc/letsencrypt/live/metaboidentity.eps.uspceu.es/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/metaboidentity.eps.uspceu.es/privkey.pem;

    root /var/www/inchi-identity-app;
    index index.html;

    client_max_body_size 25m;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

This keeps the compare page visibly at `/`; secondary pages remain available
under `/pages/`.

3. Reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

4. Start the API backend using the backend repository deployment instructions.
Set the backend `CORS_ORIGINS` to the HTTPS origin:

```bash
CORS_ORIGINS=https://metaboidentity.eps.uspceu.es
```

5. Verify the combined deployment:

```bash
curl https://metaboidentity.eps.uspceu.es/api/health
curl https://metaboidentity.eps.uspceu.es/
```

## Related repositories

- [inchi-identity](https://github.com/alejandraoshea/identity-levels-inchi) — Python comparison engine and CLI
- [inchi-identity-api](https://github.com/alejandraoshea/inchi-identity-api) — Flask REST backend
