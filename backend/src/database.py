from sqlalchemy import create_engine

DATABASE_URL = "sqlite:///./nayak.db"

engine = create_engine(DATABASE_URL)

