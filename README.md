# Security Gateway

## Requirements

* Node.js >= 16
* npm
* Apache APISIX (running)
* Access to the APISIX Admin API

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/archuser-q/security-gateway.git
cd security-gateway
```

### 2. Install dependencies

```bash
npm install
```

---

## Configuration

Create a `.env` file in the project root (if it does not exist) and configure the Admin API endpoint:

```
VITE_APISIX_ADMIN_API_URL=http://<host>:<port>
```

Example:

```
VITE_APISIX_ADMIN_API_URL=http://127.0.0.1:9180
```

Make sure APISIX is running and the Admin API is accessible from the machine running the dashboard.

---

## Run in Development Mode

```bash
npm run dev
```

By default, the application will be available at:

```
http://localhost:5173
```

---

## Build for Production

```bash
npm run build
```

After building, the `dist/` directory will be generated. Deploy the contents of this directory to a web server (e.g., Nginx, Apache, or any static file server).

---

## Project Structure

```
.
├── .github/           # CI/CD configuration
├── docs/              # Project documentation
├── public/            # Static assets
├── src/               # Application source code
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── store/
│   └── main.ts
├── .env               # Environment configuration
├── package.json
├── vite.config.ts
└── README.md
```

---

## Compatibility

* Compatible with modern versions of Apache APISIX (2.x, 3.x) via the Admin API.
* Functions as a frontend dashboard and does not modify APISIX core behavior.
* Can run on Linux, macOS, or Windows.
* Can be deployed behind a reverse proxy (e.g., Nginx) in production environments.

---

## License

Licensed under the Apache License 2.0.