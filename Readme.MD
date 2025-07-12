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
# Database Configuration (sesuaikan dengan yang digunakan di code)
DB_HOST=mysql_db
DB_USER=k4
DB_PASSWORD=klpk4_sister
DB_NAME=sister_db
DB_PORT=3306

# Port aplikasi
PORT=5000

# Kafka Configuration
KAFKA_BROKERS=redpanda-0:9092
KAFKA_TOPIC=uas_sister
KAFKA_CLIENT_ID=api_service_klpk4
KAFKAJS_NO_PARTITIONER_WARNING=1

# Supabase Configuration
SUPABASE_URL=https://gocmlalussfvexvukpaq.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY21sYWx1c3NmdmV4dnVrcGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNTU1MDEsImV4cCI6MjA2NzczMTUwMX0.6wqux9NhdoZddE_z8c_6zT2FP8fBa4ppDt-6flC_-CM

# Sender name
SENDER_NAME=api_service_klpk4
```

## Create `.env` in kafka_consumer
```bash
# Environment Variables for Kafka Consumer
KAFKA_BROKERS=localhost:19092
KAFKA_TOPIC=uas_sister
KAFKA_CLIENT_ID=api_service_klpk4
KAFKAJS_NO_PARTITIONER_WARNING=1

# Supabase Configuration
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
docker-compose up -d --build
```

## Create RedPanda Topic
```bash
docker exec -it redpanda-0 rpk topic create uas_sister
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

## Insert Data Using Postman
1. download the postman collection [here](collection/UAS_SisTer.postman_collection.json)
2. export to the postman
3. start testing

## Consume Message
```bash
docker exec -it redpanda-0 rpk topic consume uas_sister
```
