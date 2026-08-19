from app.Model.models import Base, engine, SessionLocal
Base.metadata.create_all(bind=engine)
 
db = SessionLocal()
