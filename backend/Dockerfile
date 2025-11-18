FROM python:3.11-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r requirements.txt

# DEBUG: mostrar estructura de carpetes
RUN ls -R /app

CMD ["python", "backend/worker.py"]
