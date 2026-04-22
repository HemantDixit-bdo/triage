# triage

A simple Angular application scaffolded with the Angular CLI (v21).

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
        ├── app.ts          # Root standalone component
        ├── app.html
        ├── app.css
        ├── app.spec.ts
        └── app.config.ts
```

## Prerequisites

- [Node.js](https://nodejs.org/) ^20.19 or ^22.12 or >=24
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
