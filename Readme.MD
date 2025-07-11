# Cara Meng-clone dan Menjalankan Proyek
Ikuti langkah-langkah ini untuk menjalankan proyek secara lokal:

## Clone Repository
```bash
git clone https://github.com/whsasmita/project-containerization-SisTer.git
```

## Navigate to the project folder
```bash
cd project-containerization-SisTe
```

## Create `.env` in api_service
```bash
MYSQL_HOST="localhost"
MYSQL_USER="root"
MYSQL_PASSWORD=""
MYSQL_DATABASE="sister_db"
PORT=5000
KAFKA_BROKER_HOST=
KAFKA_TOPIC=
```

## Create `.env` in kafka_consumer
```bash
KAFKA_NETWORK=
TOPIC_NAME=
SUPABASE_ID=gocmlalussfvexvukpaq
SUPABASE_URL=https://gocmlalussfvexvukpaq.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY21sYWx1c3NmdmV4dnVrcGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNTU1MDEsImV4cCI6MjA2NzczMTUwMX0.6wqux9NhdoZddE_z8c_6zT2FP8fBa4ppDt-6flC_-CM
```

## Install local depedencies
### Api_Service
```bash
cd api_service
npm install
```
### Kafka_Consumer
```bash
cd kafka_consumer
pip install -r requirements.txt
```

## Run with Docker Compose
```bash
docker-compose up --build
```
