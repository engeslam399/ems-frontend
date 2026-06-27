# Employee Management System (EMS) - Angular Frontend

[![Angular Version](https://img.shields.io/badge/Angular-v22.x-red.svg)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%2F%206.x-blue.svg)](https://www.typescriptlang.org/)
[![Testing](https://img.shields.io/badge/Testing-Vitest-yellow.svg)](https://vitest.dev/)
[![Code Style](https://img.shields.io/badge/Code%20Style-Prettier-ff69b4.svg)](https://prettier.io/)

This repository contains the interactive user interface for the **Employee Management System (EMS)**. Built with **Angular**, **TypeScript**, and styled with custom modern CSS, this frontend application provides a highly responsive SPA (Single Page Application) to manage employees and company departments.

It integrates seamlessly with the backend REST API to perform full CRUD actions, profile image uploading, and advanced filtering.

---

## 🚀 Key Features

- **Dashboard / Employee Directory**: View employee lists with full data representation (profiles, department details, salaries, contact info).
- **Search & Filter Panel**: Real-time filtering by search query (name or employee code), department selection, and dynamic salary ranges.
- **Dynamic Employee Form**: Add and edit employee details. Includes a custom profile picture upload widget supporting drag-and-drop/file browsing.
- **Department Setup**: Add new company departments instantly.
- **Global Notifications**: Toast style notices (success/error alerts) feedback using a centralized Notification Service.
- **API Interceptor Integration**: Automatically prepends base API paths to outgoing requests and handles error responses uniformly.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Angular v22.x | Single Page Application framework (Zoneless change detection enabled) |
| **Language** | TypeScript | Type-safe JavaScript extension |
| **Styling** | Vanilla CSS | Custom modern UI variables, layouts, and interactive animations |
| **Routing** | Angular Router | Dynamic lazy-loaded component routes |
| **Testing** | Vitest & JSDOM | Lightning-fast unit testing framework |
| **Formatter** | Prettier | Code formatter for consistent style guidelines |

---

## 📁 Directory Structure

The project code is organized according to clean Angular development standards:

```
ems-frontend/
├── angular.json                  # Angular CLI configurations
├── package.json                  # Frontend dependencies and npm scripts
├── tsconfig.json                 # TypeScript build/compiler options
└── src/
    ├── index.html                # Entry HTML document
    ├── main.ts                   # Bootstrapping script
    ├── styles.css                # Global custom stylesheets & CSS variables
    └── app/
        ├── app.ts                # App root component
        ├── app.html              # Core layout (header, router-outlet)
        ├── app.routes.ts         # Lazy-loaded route mappings
        ├── app.config.ts         # App settings & API_URL providers
        ├── tokens.ts             # Custom injection tokens (e.g. API_URL)
        ├── components/           # Component modules
        │   ├── department-form/  # Creation form for departments
        │   ├── employee-form/    # Unified creation/edit form with file upload
        │   └── employee-list/    # Employee directory with search/filters
        ├── interceptors/         # HttpInterceptor (appends base URL)
        ├── models/               # TypeScript interfaces for Employee and Department
        └── services/             # HTTP Client communications & messaging services
```

---

## ⚙️ Configuration & Connection

The frontend is configured to communicate with the Spring Boot backend running on `localhost:8080`.

The backend API URL configuration is stored inside [app.config.ts](src/app/app.config.ts) through Angular's dependency injection container:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    { provide: API_URL, useValue: 'http://localhost:8080/api' }
  ]
};
```

If your backend is hosted on a different address, modify the value associated with the `API_URL` token here.

---

## 🏃 Getting Started

### Prerequisites
- **Node.js** (v18.x or newer is recommended)
- **npm** package manager (comes bundled with Node.js)

### 1. Install Dependencies
Navigate to the root of the frontend project and install the packages:

```bash
npm install
```

### 2. Start the Development Server
Launch the Angular development server locally:

```bash
npm start
```
*Alternatively, run `ng serve`.*

Once running, open your browser and navigate to `http://localhost:4200`. The application will hot-reload automatically if you edit any source files.

### 3. Production Build
Compile and bundle the project assets for deployment:

```bash
npm run build
```
The compiled output will be created inside the `dist/` directory, fully optimized and ready for production hosting.

---

## 🧪 Running Tests
The project uses **Vitest** as its test runner for lightning-fast test execution. To launch the test runner:

```bash
npm test
```
*This starts Vitest in watch mode. Any local source code changes will rerun the matching specifications.*
