# Roll the dice

A simple dice rolling app built with HTML, CSS, and JavaScript. Roll 1–3 dice with 4, 6, 8, or 10 sides using a tap, drag, or keyboard. Settings are saved between visits; the app works offline after the first load and caching.

Application files are in `src/`.

## Development

Requires Node.js 22 or newer.

```sh
npm ci
npm start
```

Open [the app](http://127.0.0.1:4173/). The development server uses `http-server` with HTTP caching disabled.

## Tests

```sh
npm test
```

## Deployment

The included Docker Compose configuration uses Traefik for HTTPS and requires an existing `traefik` network.

```sh
docker compose up -d --build
```

Serve the app over HTTPS to enable home screen installation. After the first load and caching, it can be used offline.
