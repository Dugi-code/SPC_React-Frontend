# React Frontend (`frontend-react`)

Standalone React app that talks to the FastAPI backend.

### Run locally

```bash
cd web-app/frontend-react
npm install
npm start
```

### Configuration

Create a local `.env` (never commit it). Template is in `.env.example`.

- **`REACT_APP_API_URL`**: backend base URL (default `http://localhost:8000`)
- **`REACT_APP_API_KEY`**: API key for `X-API-Key` header

- The frontend matches the desktop app (`main.py`) functionality exactly
- All calculations are performed by the backend API
- Results are displayed in the same format as the desktop application

