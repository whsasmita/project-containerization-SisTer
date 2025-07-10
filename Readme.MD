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

```

## Create `.env` in kafka_consumer
```bash
KAFKA_NETWORK=
TOPIC_NAME=
SUPABASE_ID=
SUPABASE_URL=
SUPABASE_KEY=
```

## Install local depedencies
### Api_Service
```bash
cd api_service
npm install
cd ..
```
### Kafka_Consumer
```bash
cd kafka_consumer
python3 -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..
```

## Run with Docker Compose
```bash
docker-compose up --build
```
