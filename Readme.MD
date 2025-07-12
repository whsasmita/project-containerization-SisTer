# Cara Meng-clone dan Menjalankan Proyek
Ikuti langkah-langkah ini untuk menjalankan proyek secara lokal:

## Clone Repository
```bash
git clone https://github.com/whsasmita/project-containerization-SisTer.git
```

## Navigate to the project folder
```bash
cd project-containerization-SisTer
```

## Create `.env` in api_service
```bash
MYSQL_HOST=mysql_db
MYSQL_USER=k4
MYSQL_PASSWORD=klpk4_sister
MYSQL_DATABASE=sister_db
MYSQL_PORT=3306

PORT=5000

KAFKA_BROKER_HOST=redpanda-0:9092
KAFKA_TOPIC=uas_sister
```

## Create `.env` in kafka_consumer
```bash
KAFKA_NETWORK=
TOPIC_NAME=uas_sister
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
make sure Docker Desktop is open
```bash
docker-compose up --build
```

## Open New Terminal
### Check Log Api_Service
```bash
docker-compose logs -f api_service
```

## Open New Terminal
### Check Log MySql
```bash
docker-compose logs -f mysql
```

## Open New Terminal
### Enter Into Mysql CLI
```bash
docker exec -it mysql_db mysql -u k4 -pklpk4_sister sister_db
```
