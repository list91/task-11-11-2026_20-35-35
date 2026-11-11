import os
import redis.asyncio as aioredis
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select, update

from .db import SessionLocal
from .models import Event, Order, Participant
from .schemas import EventOut, OrderIn, OrderOut, ParticipantOut, price_for

app = FastAPI(title="Tickets API")
rds = aioredis.from_url(os.environ["REDIS_URL"], decode_responses=True)
EVENT_ID = 1
CACHE_KEY = "event:1"


async def load_event() -> EventOut:
    cached = await rds.get(CACHE_KEY)
    if cached:
        return EventOut.model_validate_json(cached)
    async with SessionLocal() as s:
        e = (await s.execute(select(Event).where(Event.id == EVENT_ID))).scalar_one()
    out = EventOut(title=e.title, capacity=e.capacity, seats_left=e.seats_left)
    await rds.set(CACHE_KEY, out.model_dump_json(), ex=5)
    return out


@app.get("/api/event", response_model=EventOut)
async def get_event():
    return await load_event()


@app.post("/api/orders", response_model=OrderOut, status_code=201)
async def create_order(body: OrderIn, idempotency_key: str | None = Header(default=None)):
    if idempotency_key:
        done = await rds.get(f"idem:{idempotency_key}")
        if done:
            return JSONResponse(OrderOut.model_validate_json(done).model_dump(), status_code=201)
    n = len(body.participants)
    async with SessionLocal() as s, s.begin():
        # атомарное резервирование: гонки за последние места невозможны
        res = await s.execute(
            update(Event)
            .where(Event.id == EVENT_ID, Event.seats_left >= n)
            .values(seats_left=Event.seats_left - n)
            .returning(Event.seats_left)
        )
        if res.first() is None:
            left = (await s.execute(select(Event.seats_left).where(Event.id == EVENT_ID))).scalar_one()
            await rds.delete(CACHE_KEY)
            raise HTTPException(409, {"code": "sold_out", "seats_left": left, "requested": n})
        parts = [Participant(name=p.name.strip(), age=p.age, price=price_for(p.age)) for p in body.participants]
        order = Order(event_id=EVENT_ID, email=body.email, total=sum(p.price for p in parts), participants=parts)
        s.add(order)
    await rds.delete(CACHE_KEY)
    out = OrderOut(
        id=order.id, email=order.email, total=order.total,
        participants=[ParticipantOut(name=p.name, age=p.age, price=p.price) for p in order.participants],
    )
    if idempotency_key:
        await rds.set(f"idem:{idempotency_key}", out.model_dump_json(), ex=600)
    return out


# --- демо-ручки для показа сценария «места закончились» ---
@app.post("/api/demo/sell-out", response_model=EventOut)
async def demo_sell_out():
    async with SessionLocal() as s, s.begin():
        await s.execute(update(Event).where(Event.id == EVENT_ID).values(seats_left=0))
    await rds.delete(CACHE_KEY)
    return await load_event()


@app.post("/api/demo/reset", response_model=EventOut)
async def demo_reset():
    async with SessionLocal() as s, s.begin():
        await s.execute(update(Event).where(Event.id == EVENT_ID).values(seats_left=Event.capacity))
    await rds.delete(CACHE_KEY)
    return await load_event()
