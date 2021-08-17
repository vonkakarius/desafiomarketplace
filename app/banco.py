# -----------------------------------------------------------------------

from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

# -----------------------------------------------------------------------

Base = declarative_base()
engine = create_engine(
    'postgresql://pjytwiewxwjiok:592c38d4744253d58c37b14c7be1abf2f790dce557cf46875a991243d4451312@ec2-54-167-152-185.compute-1.amazonaws.com:5432/d3h8ij8ug1bedm')

# -----------------------------------------------------------------------

class Produto(Base):
    __tablename__ = 'produtos'
    id = Column(Integer, primary_key=True)
    dadosjson = Column(String)

    def __repr__(self):
        return f'Produto {self.id}'

class Pedido(Base):
    __tablename__ = 'pedidos'
    id = Column(String, primary_key=True)
    dadosjson = Column(String)

    def __repr__(self):
        return f'Pedido {self.id}'

# -----------------------------------------------------------------------