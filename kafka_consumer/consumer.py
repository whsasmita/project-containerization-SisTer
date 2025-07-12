import os
import json
import msgpack
from confluent_kafka import Consumer
from supabase import create_client, Client
import dotenv
from datetime import datetime

# Load environment variables
dotenv.load_dotenv()

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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

async def test_supabase_tables():
    """Test which tables exist and their structure"""
    try:
        # Test table uas
        print("Testing table: uas")
        result = supabase.table("uas").select("*").limit(1).execute()
        print(f"uas exists: {result.data}")
        
        # Test table uas
        print("Testing table: uas")
        result = supabase.table("uas").select("*").limit(1).execute()
        print(f"uas exists: {result.data}")

        # Test table uas
        print("Testing table: uas")
        result = supabase.table("uas").select("*").limit(1).execute()
        print(f"uas exists: {result.data}")
        
    except Exception as e:
        print(f"Table test error: {e}")

def simple_insert_test():
    """Test with very simple data"""
    try:
        test_data = {
            "topic": "test",
            "message": "simple test message",
            "sender": "test_sender",
            "created_at": datetime.now().isoformat(),
            "status": True
        }
        
        print(f"Testing simple insert: {test_data}")
        result = supabase.table("uas").insert([test_data]).execute()
        print(f"Simple insert successful: {result.data}")
        return True
        
    except Exception as e:
        print(f"Simple insert failed: {e}")
        
        # Try with different table name
        try:
            result = supabase.table("uas").insert([test_data]).execute()
            print(f"Simple insert to 'uas' successful: {result.data}")
            return True
        except Exception as e2:
            print(f"Simple insert to 'uas' also failed: {e2}")
            return False

print(f"Starting Kafka consumer for topic: {KAFKA_TOPIC}")
print(f"Connected to brokers: {KAFKA_BROKERS}")
print(f"Logging to Supabase: {SUPABASE_URL}")

# Test Supabase connection first
print("\n=== TESTING SUPABASE CONNECTION ===")
if simple_insert_test():
    print("✓ Supabase connection works")
else:
    print("✗ Supabase connection failed")
    exit(1)

print("\n=== STARTING KAFKA CONSUMER ===")

try:
    while True:
        msg = consumer.poll(1.0)
        
        if msg is None:
            continue
        elif msg.error():
            print(f"Kafka Error: {msg.error()}")
        else:
            try:
                # Decode message
                message_data = msgpack.unpackb(msg.value(), raw=False)
                print(f"Received message: {message_data}")

                event_type = message_data.get('event')
                purchase_data = message_data.get('data')
                
                if event_type == 'purchase' and purchase_data:
                    # Clean data
                    cleaned_data = convert_timestamps_to_string(purchase_data)
                    print(f"Cleaned data: {cleaned_data}")
                    
                    # Create very simple log entry
                    log_entry = {
                        "topic": str(KAFKA_TOPIC),
                        "message": json.dumps(cleaned_data),  # Simple JSON string
                        "sender": str(KAFKA_CLIENT_ID),
                        "created_at": datetime.now().isoformat(),
                        "status": True
                    }
                    
                    print(f"Attempting to insert: {log_entry}")
                    
                    # Try insert to uas table first
                    try:
                        result = supabase.table("uas").insert([log_entry]).execute()
                        print(f"✓ Successfully logged to uas: {result.data}")
                    except Exception as e1:
                        print(f"✗ Failed to insert to uas: {e1}")
                        
                        # Try insert to uas table
                        try:
                            result = supabase.table("uas").insert([log_entry]).execute()
                            print(f"✓ Successfully logged to uas: {result.data}")
                        except Exception as e2:
                            print(f"✗ Failed to insert to uas: {e2}")
                            
                            # Try with even simpler data
                            simple_log = {
                                "topic": "test",
                                "message": f"Purchase ID: {cleaned_data.get('id')}",
                                "sender": "consumer",
                                "created_at": datetime.now().isoformat(),
                                "status": True
                            }
                            
                            try:
                                result = supabase.table("uas").insert([simple_log]).execute()
                                print(f"✓ Simple log successful: {result.data}")
                            except Exception as e3:
                                print(f"✗ Even simple log failed: {e3}")
                                
                                # Log to file
                                with open('failed_logs.txt', 'a') as f:
                                    f.write(f"{datetime.now().isoformat()} - FAILED: {cleaned_data}\n")
                                print("Logged to file as last resort")
                    
                    print(f"Purchase processed - ID: {cleaned_data.get('id')}")
                    
                else:
                    print(f"Unknown event type: {event_type}")
                    
            except Exception as process_error:
                print(f"Message processing error: {process_error}")
                import traceback
                traceback.print_exc()

except KeyboardInterrupt:
    print("\nConsumer stopped by user")
except Exception as e:
    print(f"Consumer error: {e}")
    import traceback
    traceback.print_exc()
finally:
    consumer.close()
    print("Consumer connection closed")