# Dockerfile per Railway sense Mise
FROM python:3.11-slim

# Carpeta de treball
WORKDIR /app

# Copiem tot el backend
COPY . /app

# Actualitzem pip
RUN python -m pip install --upgrade pip

# Instal·lem dependències
RUN pip install --no-cache-dir -r requirements.txt

# Si necessites exposar un port (només si la app té servidor)
EXPOSE 8000

# Comanda per executar el worker
CMD ["python", "worker.py"]
