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

Before running, set the backend URL in `config.js`:

```javascript
window.API_CONFIG = {
    baseUrl: "http://127.0.0.1:5000"
};
```

By default the app connects to `http://127.0.0.1:5000`.

## Deployment with Nginx (WSL2)

To serve this frontend locally using Nginx on Windows via WSL2:

1. Open WSL2 (Ubuntu) and install Nginx:

```bash
sudo apt install nginx -y
sudo service nginx start
```

2. Copy the frontend files to the Nginx web root:

```bash
sudo cp -r /path/to/inchi-identity-app/* /var/www/html/
```

3. Edit `/etc/nginx/sites-available/default` and set:

```nginx
root /var/www/html;
index pages/compare.html;

location / {
    try_files $uri $uri/ /pages/compare.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

4. Reload Nginx:

```bash
sudo nginx -t && sudo service nginx reload
```

5. Start the API backend (see [inchi-identity-api](https://github.com/alejandraoshea/inchi-identity-api)).

6. Open `http://localhost` in your browser.

## Related repositories

- [inchi-identity](https://github.com/alejandraoshea/identity-levels-inchi) — Python comparison engine and CLI
- [inchi-identity-api](https://github.com/alejandraoshea/inchi-identity-api) — Flask REST backend