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


## Related repositories

- [inchi-identity](https://github.com/alejandraoshea/identity-levels-inchi) — Python comparison engine and CLI
- [inchi-identity-api](https://github.com/alejandraoshea/inchi-identity-api) — Flask REST backend
