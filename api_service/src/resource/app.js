// PERBAIKAN: dotenv.config() dengan explicit path
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import msgpack from "msgpack5"; // Tambahkan import msgpack

// Inisialisasi msgpack
const mp = msgpack();

// Test msgpack functionality
console.log("Testing msgpack functionality...");
try {
  const testData = { test: "msgpack", number: 123, array: [1, 2, 3] };
  const encoded = mp.encode(testData);
  const decoded = mp.decode(encoded);
  console.log("✓ msgpack test successful:", decoded);
} catch (error) {
  console.error("✗ msgpack test failed:", error);
}

// Dapatkan current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug: Tampilkan current working directory dan path ke .env
console.log("Current working directory:", process.cwd());
console.log("Current file directory:", __dirname);
console.log("Looking for .env at:", path.join(__dirname, "../..", ".env"));

// Load .env dengan explicit path yang benar
// Dari src/resource/app.js ke api_service/.env = ../../.env
const envPath = path.join(__dirname, "../../", ".env");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Error loading .env file:", result.error);
  console.log("Trying alternative paths...");

  // Coba beberapa path alternatif berdasarkan struktur folder
  const alternativePaths = [
    path.join(__dirname, "../../", ".env"), // dari src/resource/ ke root
    path.join(__dirname, "../", ".env"), // dari src/resource/ ke src/
    path.join(__dirname, ".env"), // di resource/
    path.join(process.cwd(), ".env"), // dari working directory
    ".env", // relative path
  ];

  let loaded = false;
  for (const altPath of alternativePaths) {
    console.log(`Trying path: ${altPath}`);
    const altResult = dotenv.config({ path: altPath });
    if (!altResult.error) {
      console.log(`Successfully loaded .env from: ${altPath}`);
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    console.error("Could not load .env file from any path");
    console.log("Please check if .env file exists and is readable");

    // Tampilkan semua environment variables yang ada
    console.log("Available environment variables:");
    Object.keys(process.env)
      .filter((key) => key.includes("SUPABASE"))
      .forEach((key) => {
        console.log(`${key}: ${process.env[key]}`);
      });
  }
} else {
  console.log("Successfully loaded .env file");
}

import express from "express";
import {
  kafka,
  pool,
  producer,
  testConnection,
  testNetworkConnectivity,
} from "../database/connect.js";
import { createPurchasesTable } from "../database/table.js";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
// import { kafka } from '../database/connect.js';

const app = express();
const PORT = process.env.PORT || 3000;

// DEBUG LOGS (lebih detail)
console.log("=== ENVIRONMENT VARIABLES DEBUG ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PWD:", process.env.PWD);
console.log("SUPABASE_URL from process.env:", process.env.SUPABASE_URL);
console.log(
  "SUPABASE_KEY from process.env:",
  process.env.SUPABASE_KEY ? "[REDACTED]" : "undefined"
);
console.log("All SUPABASE related env vars:");
Object.keys(process.env)
  .filter((key) => key.includes("SUPABASE"))
  .forEach((key) => {
    console.log(
      `${key}: ${key.includes("KEY") ? "[REDACTED]" : process.env[key]}`
    );
  });
console.log("=== END DEBUG ===");

// Inisialisasi Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

// Validasi environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "ERROR: SUPABASE_URL or SUPABASE_KEY is not defined in environment variables"
  );
  console.error("Current SUPABASE_URL:", supabaseUrl);
  console.error(
    "Current SUPABASE_KEY:",
    supabaseAnonKey ? "[REDACTED]" : "undefined"
  );

  // Coba hardcode untuk testing (HANYA UNTUK DEBUG - JANGAN DIGUNAKAN DI PRODUCTION)
  console.log("Attempting to use hardcoded values for debugging...");
  const hardcodedUrl = "https://gocmlalussfvexvukpaq.supabase.co";
  const hardcodedKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY21sYWx1c3NmdmV4dnVrcGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNTU1MDEsImV4cCI6MjA2NzczMTUwMX0.6wqux9NhdoZddE_z8c_6zT2FP8fBa4ppDt-6flC_-CM";

  console.log("WARNING: Using hardcoded Supabase credentials for debugging");
  console.log("Please fix .env file loading for production use");

  // Gunakan hardcoded values jika env vars tidak tersedia
  const finalUrl = supabaseUrl || hardcodedUrl;
  const finalKey = supabaseAnonKey || hardcodedKey;

  var supabase = createClient(finalUrl, finalKey);
} else {
  var supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Helper function untuk encode data ke msgpack
function encodeToMsgpack(data) {
  try {
    const encoded = mp.encode(data);
    return encoded.toString("base64"); // Convert to base64 untuk storage
  } catch (error) {
    console.error("Error encoding to msgpack:", error);
    throw error;
  }
}

// Helper function untuk decode data dari msgpack
function decodeFromMsgpack(encodedData) {
  try {
    const buffer = Buffer.from(encodedData, "base64");
    return mp.decode(buffer);
  } catch (error) {
    console.error("Error decoding from msgpack:", error);
    throw error;
  }
}

// Tambahkan fungsi helper untuk Kafka
async function ensureKafkaConnection() {
  let retryCount = 0;
  const maxRetries = 5;

  while (retryCount < maxRetries) {
    try {
      // Cek environment variables dulu
      if (!process.env.KAFKA_BROKERS) {
        throw new Error("KAFKA_BROKERS environment variable is not defined");
      }

      // Cek apakah producer sudah connect
      const admin = kafka.admin();
      await admin.connect();
      await admin.listTopics(); // Test connection
      await admin.disconnect();

      // Jika admin berhasil, coba connect producer
      if (!producer.isConnected) {
        await producer.connect();
        console.log("Kafka Producer connected successfully!");
      }
      return true;
    } catch (error) {
      retryCount++;
      console.error(
        `Kafka connection attempt ${retryCount} failed:`,
        error.message
      );

      if (retryCount < maxRetries) {
        console.log(`Retrying in 3 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  console.error("Failed to connect to Kafka after maximum retries");
  return false;
}

// Fungsi untuk publish dengan retry
async function publishToKafka(topic, messageData, maxRetries = 3) {
  // Cek apakah Kafka dikonfigurasi
  if (!process.env.KAFKA_BROKERS) {
    console.warn("KAFKA_BROKERS not configured, skipping message publish");
    return false;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Pastikan producer connected
      if (!producer.isConnected) {
        console.log("Producer disconnected, attempting to reconnect...");
        await producer.connect();
      }

      // Encode data ke msgpack buffer
      const msgpackBuffer = mp.encode(messageData);

      await producer.send({
        topic: topic,
        messages: [{ value: msgpackBuffer }], // Kirim sebagai buffer
      });

      console.log(
        `Message published to Kafka topic ${topic} (msgpack format):`,
        messageData
      );
      return true;
    } catch (error) {
      console.error(`Kafka publish attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        console.log(`Retrying in 2 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Disconnect dan reconnect producer
        try {
          await producer.disconnect();
          await producer.connect();
        } catch (reconnectError) {
          console.error("Error during reconnection:", reconnectError.message);
        }
      }
    }
  }

  console.error("Failed to publish to Kafka after maximum retries");
  return false;
}

async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...");
    const { data, error } = await supabase.from("uas").select("*").limit(1);
    if (error) {
      console.error("Supabase connection test failed:", error);
      return false;
    }
    console.log("Supabase connection successful!");
    return true;
  } catch (error) {
    console.error("Supabase connection test error:", error);
    return false;
  }
}

// Middleware
app.use(express.json());
app.use(cors());

// --- Function untuk retry database connection ---
async function waitForDatabase(maxAttempts = 30, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(
      `Attempting to connect to database... (${attempt}/${maxAttempts})`
    );

    const networkOk = await testNetworkConnectivity();
    if (!networkOk) {
      console.log("Network connectivity failed, retrying...");
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      continue;
    }

    const isConnected = await testConnection();
    if (isConnected) {
      console.log("Database connection established successfully!");
      return true;
    }

    if (attempt < maxAttempts) {
      console.log(`Database connection failed, retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.error("Failed to connect to database after maximum attempts");
  return false;
}

// --- Health check endpoint ---
app.get("/health", async (req, res) => {
  try {
    const isConnected = await testConnection();
    const supabaseOk = await testSupabaseConnection();

    if (isConnected && supabaseOk) {
      res.status(200).json({
        status: "healthy",
        database: "connected",
        supabase: "connected",
        msgpack: "enabled",
      });
    } else {
      res.status(503).json({
        status: "unhealthy",
        database: isConnected ? "connected" : "disconnected",
        supabase: supabaseOk ? "connected" : "disconnected",
      });
    }
  } catch (error) {
    res.status(503).json({ status: "unhealthy", error: error.message });
  }
});

// --- Endpoint POST API Sederhana ---
// Fixed purchase endpoint dengan proper date handling
app.post("/api/purchase", async (req, res) => {
  let transactionStatus = false;
  const kafkaTopic = process.env.KAFKA_TOPIC || "uas_sister";
  const senderName = process.env.SENDER_NAME || "api_service_klpk4";

  try {
    const { price, qty } = req.body;

    if (
      typeof price !== "number" ||
      typeof qty !== "number" ||
      price <= 0 ||
      qty <= 0
    ) {
      const invalidInputData = {
        original_request: req.body,
        error: "Invalid input: price and qty must be positive numbers.",
        timestamp: new Date().toISOString(), // Gunakan toISOString()
      };

      const invalidInputLog = {
        topic: kafkaTopic,
        message: encodeToMsgpack(invalidInputData),
        sender: senderName,
        created_at: new Date().toISOString(), // Gunakan toISOString()
        status: false,
      };

      await supabase.from("uas").insert([invalidInputLog]);
      return res.status(400).json({
        error: "Invalid input: price and qty must be positive numbers.",
      });
    }

    const total = price * qty;
    const userId = uuidv4();
    const purchaseDate = new Date();

    const purchaseData = {
      price,
      qty,
      total,
      user_id: userId,
      purchase_date: purchaseDate, // Akan dikonversi di MySQL
    };

    // --- 1. Simpan data ke MySQL ---
    const [mysqlResult] = await pool.execute(
      "INSERT INTO purchases (price, qty, total, user_id, purchase_date) VALUES (?, ?, ?, ?, ?)",
      [
        purchaseData.price,
        purchaseData.qty,
        purchaseData.total,
        purchaseData.user_id,
        purchaseData.purchase_date,
      ]
    );
    console.log("Data saved to MySQL:", mysqlResult);
    transactionStatus = true;

    // --- 2. Publish data ke Redpanda (Kafka) ---
    // PENTING: Konversi Date ke string untuk Kafka
    const kafkaMessageData = {
      event: "purchase",
      data: {
        id: mysqlResult.insertId,
        price: purchaseData.price,
        qty: purchaseData.qty,
        total: purchaseData.total,
        user_id: purchaseData.user_id,
        purchase_date: purchaseData.purchase_date.toISOString(), // Konversi ke string ISO
      },
    };

    const kafkaPublished = await publishToKafka(kafkaTopic, kafkaMessageData);
    if (!kafkaPublished) {
      console.warn("Failed to publish to Kafka, but continuing...");
    }

    // --- 3. Log aktivitas ke Supabase dengan msgpack ---
    const logDataForMsgpack = {
      event: "purchase",
      mysql_result: {
        insertId: mysqlResult.insertId,
        affectedRows: mysqlResult.affectedRows,
      },
      purchase_data: {
        ...purchaseData,
        purchase_date: purchaseData.purchase_date.toISOString(), // Konversi ke string
      },
      kafka_published: kafkaPublished,
      timestamp: new Date().toISOString(), // Gunakan toISOString()
    };

    const logData = {
      topic: kafkaTopic,
      message: encodeToMsgpack(logDataForMsgpack),
      sender: senderName,
      created_at: new Date().toISOString(), // Gunakan toISOString()
      status: transactionStatus,
    };

    const { data: logResult, error: logError } = await supabase
      .from("uas")
      .insert([logData]);

    if (logError) {
      console.error("Error inserting log to Supabase:", logError);
    } else {
      console.log("Log inserted to Supabase with msgpack format:", logResult);
    }

    // Respon API
    res.status(201).json({
      price: purchaseData.price,
      qty: purchaseData.qty,
      total: purchaseData.total,
      user_id: purchaseData.user_id,
      id: mysqlResult.insertId,
    });
  } catch (error) {
    console.error("Error processing purchase:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });

    try {
      const errorData = {
        original_request: req.body,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(), // Gunakan toISOString()
      };

      const errorLogData = {
        topic: kafkaTopic,
        message: encodeToMsgpack(errorData),
        sender: senderName,
        created_at: new Date().toISOString(), // Gunakan toISOString()
        status: false,
      };

      const { error: logError } = await supabase
        .from("uas")
        .insert([errorLogData]);
      if (logError) {
        console.error("Error inserting error log to Supabase:", logError);
      }
    } catch (supabaseError) {
      console.error("Error logging to Supabase:", supabaseError);
    }
  }
});

// Get all purchases endpoint
app.get("/api/purchases", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM purchases ORDER BY purchase_date DESC"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Endpoint untuk mendapatkan logs dari Supabase dan decode msgpack
app.get("/api/logs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("uas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching logs from Supabase:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch logs", details: error.message });
    }

    // Decode msgpack data (karena semua data sekarang menggunakan msgpack)
    const decodedLogs = data.map((log) => {
      try {
        return {
          ...log,
          decoded_message: decodeFromMsgpack(log.message),
        };
      } catch (decodeError) {
        console.error("Error decoding msgpack for log:", log.id, decodeError);
        // Jika gagal decode msgpack, mungkin masih JSON lama
        try {
          return {
            ...log,
            decoded_message: JSON.parse(log.message),
          };
        } catch (jsonError) {
          return {
            ...log,
            decoded_message: null,
            decode_error: decodeError.message,
          };
        }
      }
    });

    res.status(200).json(decodedLogs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start server dengan database connection check
async function startServer() {
  try {
    console.log("Starting API Service with msgpack support...");

    // Test Supabase connection
    const supabaseOk = await testSupabaseConnection();
    if (!supabaseOk) {
      console.warn("Warning: Supabase connection failed, but continuing...");
    }

    const dbReady = await waitForDatabase();
    if (!dbReady) {
      console.error("Cannot start server: Database is not available");
      process.exit(1);
    }

    try {
      const kafkaConnected = await ensureKafkaConnection();
      if (!kafkaConnected) {
        console.warn("Warning: Kafka connection failed, but continuing...");
      }
    } catch (kafkaConnectError) {
      console.error(
        "Failed to connect Kafka Producer:",
        kafkaConnectError.message
      );
    }

    await createPurchasesTable();

    app.listen(PORT, () => {
      console.log(`API Service with msgpack support running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(
        `Purchase endpoint: http://localhost:${PORT}/api/purchase (POST)`
      );
      console.log(
        `Get purchases: http://localhost:${PORT}/api/purchases (GET)`
      );
      console.log(
        `Get logs (decoded): http://localhost:${PORT}/api/logs (GET)`
      );
      console.log(`Redpanda Console: http://localhost:8080`);
      console.log(`MySQL Workbench: Connect to localhost:3306`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    if (producer) {
      await producer
        .disconnect()
        .catch((err) =>
          console.error(
            "Error during producer disconnect on startup failure:",
            err
          )
        );
    }
    process.exit(1);
  }
}

// Disconnect Kafka Producer saat aplikasi berhenti
process.on("SIGTERM", async () => {
  console.log("\nSIGTERM received, disconnecting Kafka Producer...");
  await producer.disconnect();
  console.log("Kafka Producer disconnected.");
  process.exit(0);
});
process.on("SIGINT", async () => {
  console.log("\nSIGINT received, disconnecting Kafka Producer...");
  await producer.disconnect();
  console.log("Kafka Producer disconnected.");
  process.exit(0);
});

startServer();
