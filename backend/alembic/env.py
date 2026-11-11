import asyncio, os
from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine
from app.db import Base
from app import models  # noqa

target_metadata = Base.metadata


def do_run(conn):
    context.configure(connection=conn, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run():
    engine = create_async_engine(os.environ["DATABASE_URL"])
    async with engine.connect() as c:
        await c.run_sync(do_run)
    await engine.dispose()


asyncio.run(run())
