# triage

A simple Angular application scaffolded with the Angular CLI (v18).

## Project structure

```
.
├── angular.json            # Angular CLI workspace configuration
├── package.json            # npm dependencies and scripts
├── tsconfig*.json          # TypeScript configuration
├── public/                 # Static assets (favicon, etc.)
└── src/
    ├── index.html          # Application shell
    ├── main.ts             # Bootstrap entry point
    ├── styles.css          # Global styles
    └── app/
        ├── app.component.ts
        ├── app.component.html
        ├── app.component.css
        ├── app.component.spec.ts
        └── app.config.ts
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18.19+ or 20.11+
- npm 10+

## Getting started

Install dependencies:

```bash
npm install
```

Start the dev server (defaults to http://localhost:4200):

```bash
npm start
```

Build for production:

```bash
npm run build
```

Run unit tests:

```bash
npm test
```
