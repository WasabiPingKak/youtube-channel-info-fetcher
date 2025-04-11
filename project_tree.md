
```
youtube-channel-info-fetcher
├─ backend
│  ├─ .env.example
│  ├─ app.py
│  ├─ Dockerfile
│  ├─ README_API_usage.md
│  ├─ README_deploy_gcloud.md
│  ├─ requirements.txt
│  ├─ routes
│  │  ├─ base_routes.py
│  │  ├─ cache_routes.py
│  │  ├─ category_routes.py
│  │  └─ __init__.py
│  ├─ services
│  │  ├─ cache.py
│  │  ├─ categories.py
│  │  ├─ firebase.py
│  │  ├─ youtube
│  │  │  ├─ client.py
│  │  │  ├─ fetcher.py
│  │  │  ├─ videos.py
│  │  │  └─ __init__.py
│  │  └─ __init__.py
│  └─ utils
│     ├─ categorizer.py
│     ├─ youtube_utils.py
│     └─ __init__.py
├─ deploy.sh
├─ deploy_note.txt
├─ firebase.json
├─ package-lock.json
├─ README.md
├─ vtuber-frontend
│  ├─ .env
│  ├─ firebase.json
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  ├─ src
│  │  ├─ App.tsx
│  │  ├─ env.d.ts
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  └─ firebase.ts
│  │  ├─ main.tsx
│  │  └─ pages
│  │     └─ LiveCategoryPage.tsx
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
└─ 建議的 Firestore 規則設計（正式版用）.txt

```