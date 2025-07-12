import os
import json
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

print(f"Starting Kafka consumer for topic: {KAFKA_TOPIC}")
print(f"Connected to brokers: {KAFKA_BROKERS}")
print(f"Logging to Supabase: {SUPABASE_URL}")

try:
    while True:
        msg = consumer.poll(1.0)
        
        if msg is None:
            continue
        elif msg.error():
            print(f"Kafka Error: {msg.error()}")
        else:
            try:
                message_data = json.loads(msg.value().decode('utf-8'))
                print(f"Received message: {message_data}")

                event_type = message_data.get('event')
                purchase_data = message_data.get('data')
                
                if event_type == 'purchase' and purchase_data:
                    log_data = {
                        "topic": KAFKA_TOPIC,
                        "message": json.dumps(purchase_data),
                        "sender": KAFKA_CLIENT_ID,
                        "created_at": datetime.now().isoformat(),
                        "status": True
                    }
                    
                    try:
                        result = supabase.table("uas").insert(log_data).execute()
                        print(f"Successfully logged to Supabase: {result.data}")
                        
                        print(f"Purchase processed - ID: {purchase_data.get('id')}, "
                              f"Total: {purchase_data.get('total')}, "
                              f"User: {purchase_data.get('user_id')}")
                              
                    except Exception as supabase_error:
                        print(f"Supabase error: {str(supabase_error)}")
                        print(f"Debug - Data yang dikirim: {log_data}")
                        
                        try:
                            simple_data = {
                                "topic": KAFKA_TOPIC,
                                "message": f"Purchase ID: {purchase_data.get('id')}, Total: {purchase_data.get('total')}",
                                "sender": KAFKA_CLIENT_ID,
                                "created_at": datetime.now().isoformat(),
                                "status": True
                            }
                            result = supabase.table("uas_sister").insert(simple_data).execute()
                            print(f"Simple insert successful: {result.data}")
                        except Exception as simple_error:
                            print(f"Simple insert also failed: {str(simple_error)}")
                        
                else:
                    print(f"Unknown event type or missing data: {event_type}")
                    
            except json.JSONDecodeError as json_error:
                print(f"JSON decode error: {str(json_error)}")
            except Exception as process_error:
                print(f"Message processing error: {str(process_error)}")

except KeyboardInterrupt:
    print("\nConsumer stopped by user")
except Exception as e:
    print(f"Consumer error: {str(e)}")
finally:
    # Close the consumer connection
    consumer.close()
    print("Consumer connection closed")