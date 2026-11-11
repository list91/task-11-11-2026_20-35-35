# Оформление билетов

Стек: FastAPI + asyncio + SQLAlchemy (async) + Pydantic + PostgreSQL + Alembic + Redis; Next.js + React + TypeScript + Tailwind.

Запуск: `docker compose up --build` → http://localhost:3000 (API: http://localhost:8000/docs)

- Места резервируются атомарным `UPDATE ... WHERE seats_left >= n` (без гонок); нехватка → 409 `sold_out`.
- Redis: кэш события (5 с) и идемпотентность `POST /api/orders` по `Idempotency-Key`.
- Правила (клиент + сервер): 1–4 участника, 2000 ₽ от 14 лет, 1000 ₽ младше 14 только с участником 18+, один email на заказ.
- Демо «места закончились»: кнопка «Раскупить все места» внизу страницы, затем подтвердить заказ.