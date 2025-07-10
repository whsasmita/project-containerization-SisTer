# Redpanda

## Create topic
docker exec -it <container_name_redpanda> rpk topic create <topic_name>
eg:
  docker exec -it redpanda-0 rpk topic create chat-trpl-ilkom

## Produce message
docker exec -it <container_name> rpk topic produce <topic_name>
eg:
  docker exec -it redpanda-0 rpk topic produce chat-trpl-ilkom

## Consume message
docker exec -it <container_name> rpk topic consume <topic_name>
eg:
  docker exec -it redpanda-0 rpk topic consume chat-trpl-ilkom
