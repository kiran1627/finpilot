# test_sqlite.py

from sqlalchemy import inspect
from app.db.database import engine
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.auth.models import User
from app.db.models import Run, LedgerEntry

def integrity_test():
    db = SessionLocal()

    print("\n🔎 Running integrity checks...\n")

    # 1️⃣ Check if runs reference valid users
    runs = db.query(Run).all()
    users = {u.id for u in db.query(User).all()}

    for run in runs:
        if run.user_id not in users:
            print(f"❌ Run {run.run_id} has invalid user_id")

    print("✔ Runs user linkage checked.")

    # 2️⃣ Check ledger references
    ledgers = db.query(LedgerEntry).all()
    run_ids = {r.run_id for r in runs}

    for entry in ledgers:
        if entry.run_id not in run_ids:
            print(f"❌ Ledger entry {entry.id} has invalid run_id")

    print("✔ Ledger linkage checked.")

    db.close()

def inspect_database():
    inspector = inspect(engine)

    print(f"\n📦 Connected Database: {engine.url}\n")

    tables = inspector.get_table_names()

    if not tables:
        print("❌ No tables found.")
        return

    print("📋 Tables Found:")
    for table in tables:
        print(f" - {table}")

    print("\n🔎 Detailed Schema:\n")

    for table in tables:
        print(f"🗂 TABLE: {table}")
        print("-" * 50)

        columns = inspector.get_columns(table)

        for col in columns:
            print(
                f"Column: {col['name']}\n"
                f"  Type: {col['type']}\n"
                f"  Nullable: {col['nullable']}\n"
                f"  Default: {col.get('default')}\n"
            )

        pk = inspector.get_pk_constraint(table)
        print(f"🔑 Primary Key: {pk.get('constrained_columns')}")

        fks = inspector.get_foreign_keys(table)
        if fks:
            print("🔗 Foreign Keys:")
            for fk in fks:
                print(
                    f"  Column: {fk['constrained_columns']} "
                    f"→ {fk['referred_table']}.{fk['referred_columns']}"
                )
        else:
            print("🔗 Foreign Keys: None")

        print("\n")

if __name__ == "__main__":
    inspect_database()
