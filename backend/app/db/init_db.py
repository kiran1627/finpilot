from app.db.database import engine, Base

# 🔥 Import ALL models so SQLAlchemy registers them
from app.db.models import Run, LedgerEntry, AuditLogEntry
from app.auth.models import User

def init_db():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
