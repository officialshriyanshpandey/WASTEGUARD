import asyncio

from lib.auth import seed_demo_accounts
from lib.db import client, ensure_indexes


async def main() -> None:
    await ensure_indexes()
    await seed_demo_accounts()
    client.close()


if __name__ == "__main__":
    asyncio.run(main())