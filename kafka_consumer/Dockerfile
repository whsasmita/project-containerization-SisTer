# Gunakan Alpine Linux dan compile librdkafka dari source
FROM python:3.9-alpine

# Set direktori kerja di dalam container
WORKDIR /app

# Install build dependencies termasuk bash dan tools yang diperlukan
RUN apk add --no-cache \
    build-base \
    python3-dev \
    libffi-dev \
    git \
    cmake \
    pkgconfig \
    openssl-dev \
    zlib-dev \
    zstd-dev \
    lz4-dev \
    cyrus-sasl-dev \
    bash \
    autoconf \
    automake \
    libtool \
    linux-headers

# Compile dan install librdkafka dari source
RUN git clone https://github.com/confluentinc/librdkafka.git /tmp/librdkafka \
    && cd /tmp/librdkafka \
    && git checkout v2.11.0 \
    && bash ./configure --prefix=/usr/local \
    && make -j$(nproc) \
    && make install \
    && ldconfig /usr/local/lib \
    && rm -rf /tmp/librdkafka

# Set environment variables untuk pkg-config
ENV PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

# Salin file requirements.txt untuk menginstal dependensi
COPY requirements.txt ./

# Instal dependensi Python
RUN pip install --no-cache-dir -r requirements.txt

# Salin seluruh kode sumber aplikasi Anda
COPY . .

# Perintah untuk menjalankan aplikasi ketika container dimulai
CMD ["python", "consumer.py"]