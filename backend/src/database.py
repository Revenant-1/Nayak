from app.models.models import Base, engine, SessionLocal
Base.metadata.create_all(bind=engine)
 
db = SessionLocal()
