Dựa trên thông tin từ repository GitHub, tôi có thể thấy cấu trúc thư mục thực tế. Đây là README đã được cập nhật với cấu trúc project chính xác:

---

# Security Gateway

## Requirements

* Node.js >= 16
* npm hoặc pnpm
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
# hoặc
pnpm install
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
├── .actions/              # GitHub Actions workflows
├── .devcontainer/         # Dev container configuration
├── .github/               # GitHub configuration
├── .vscode/               # VSCode settings
├── docs/                  # Project documentation
│   └── en/                # English documentation
├── e2e/                   # End-to-end tests
├── src/                   # Application source code
├── .asf.yaml              # Apache Software Foundation config
├── .dockerignore          # Docker ignore file
├── .gitignore             # Git ignore file
├── .gitmodules            # Git submodules
├── .licenserc.yaml        # License check configuration
├── .markdownlint.yml      # Markdown linting rules
├── .yamllint              # YAML linting rules
├── CODE_OF_CONDUCT.md     # Code of conduct
├── CONTRIBUTING.md        # Contributing guidelines
├── LICENSE                # Apache License 2.0
├── NOTICE                 # License notices
├── README.md              # Project README
├── eslint.config.ts       # ESLint configuration
├── index.html             # Main HTML entry point
├── netlify.toml           # Netlify deployment config
├── package.json           # NPM dependencies and scripts
├── playwright.config.ts   # Playwright test configuration
├── pnpm-lock.yaml         # PNPM lock file
├── tsconfig.app.json      # TypeScript app configuration
├── tsconfig.json          # TypeScript base configuration
├── tsconfig.node.json     # TypeScript Node configuration
├── vite-plugin-i18n-progress.ts  # Custom Vite plugin for i18n
└── vite.config.ts         # Vite build configuration
```

---

## Compatibility

* Compatible with modern versions of Apache APISIX (2.x, 3.x) via the Admin API.
* Functions as a frontend dashboard and does not modify APISIX core behavior.
* Can run on Linux, macOS, or Windows.
* Can be deployed behind a reverse proxy (e.g., Nginx) in production environments.

---