import os
import json
import msgpack
from confluent_kafka import Consumer
import dotenv
from datetime import datetime

# Load environment variables
dotenv.load_dotenv()

# Kafka configuration
KAFKA_BROKERS = os.environ.get("KAFKA_BROKERS")
KAFKA_TOPIC = os.environ.get("KAFKA_TOPIC")
KAFKA_CLIENT_ID = os.environ.get("KAFKA_CLIENT_ID")

# Consumer configuration
consumer = Consumer({
    'bootstrap.servers': KAFKA_BROKERS,
    'group.id': f'{KAFKA_CLIENT_ID}-consumer-group',
    'auto.offset.reset': 'earliest',
    'client.id': KAFKA_CLIENT_ID
})

consumer.subscribe([KAFKA_TOPIC])

def convert_timestamps_to_string(obj):
    """Convert timestamp objects to ISO string"""
    if isinstance(obj, dict):
        return {key: convert_timestamps_to_string(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_timestamps_to_string(item) for item in obj]
    elif hasattr(obj, 'seconds') and hasattr(obj, 'nanoseconds'):
        total_seconds = obj.seconds + (obj.nanoseconds / 1e9)
        return datetime.fromtimestamp(total_seconds).isoformat()
    elif isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj

def decode_from_msgpack_base64(encoded_data):
    """Decode msgpack data from base64 string (for debugging)"""
    try:
        import base64
        # Decode base64 string to bytes
        msgpack_bytes = base64.b64decode(encoded_data)
        return msgpack.unpackb(msgpack_bytes, raw=False)
    except Exception as e:
        print(f"Error decoding from msgpack: {e}")
        return None

print("=" * 60)
print("KAFKA CONSUMER - CONSUME ONLY MODE")
print("=" * 60)
print(f"📡 Kafka Topic: {KAFKA_TOPIC}")
print(f"🔗 Kafka Brokers: {KAFKA_BROKERS}")
print(f"🆔 Client ID: {KAFKA_CLIENT_ID}")
print(f"👂 Consumer Group: {KAFKA_CLIENT_ID}-consumer-group")
print("=" * 60)
print("🚀 Starting to consume messages...")
print("   (Press Ctrl+C to stop)")
print("=" * 60)

try:
    message_count = 0
    while True:
        msg = consumer.poll(1.0)
        
        if msg is None:
            continue
        elif msg.error():
            print(f"❌ Kafka Error: {msg.error()}")
        else:
            try:
                message_count += 1
                print(f"\n📨 MESSAGE #{message_count} RECEIVED")
                print(f"   ⏰ Timestamp: {datetime.now().isoformat()}")
                print(f"   🏷️  Topic: {msg.topic()}")
                print(f"   #️⃣  Partition: {msg.partition()}")
                print(f"   📍 Offset: {msg.offset()}")
                
                # Decode message dari msgpack
                message_data = msgpack.unpackb(msg.value(), raw=False)
                print(f"   📄 Raw Message: {message_data}")

                event_type = message_data.get('event')
                purchase_data = message_data.get('data')
                
                if event_type == 'purchase' and purchase_data:
                    # Clean data untuk display
                    cleaned_data = convert_timestamps_to_string(purchase_data)
                    
                    print(f"   🎯 Event Type: {event_type}")
                    print(f"   💰 Purchase Data:")
                    print(f"      • ID: {cleaned_data.get('id')}")
                    print(f"      • Price: ${cleaned_data.get('price')}")
                    print(f"      • Quantity: {cleaned_data.get('qty')}")
                    print(f"      • Total: ${cleaned_data.get('total')}")
                    print(f"      • User ID: {cleaned_data.get('user_id')}")
                    print(f"      • Purchase Date: {cleaned_data.get('purchase_date')}")
                    
                    # Log ke file lokal (optional)
                    with open('consumed_messages.log', 'a') as f:
                        f.write(f"{datetime.now().isoformat()} - CONSUMED: {json.dumps(cleaned_data)}\n")
                    
                    print(f"   ✅ Purchase ID {cleaned_data.get('id')} processed successfully")
                    
                else:
                    print(f"   ⚠️  Unknown event type: {event_type}")
                    print(f"   📊 Full message: {message_data}")
                    
                print("-" * 60)
                    
            except Exception as process_error:
                print(f"❌ Message processing error: {process_error}")
                print(f"   Raw message value: {msg.value()}")
                import traceback
                traceback.print_exc()
                print("-" * 60)

except KeyboardInterrupt:
    print(f"\n🛑 Consumer stopped by user")
    print(f"📊 Total messages consumed: {message_count}")
except Exception as e:
    print(f"❌ Consumer error: {e}")
    import traceback
    traceback.print_exc()
finally:
    consumer.close()
    print("🔌 Consumer connection closed")
    print("👋 Goodbye!")