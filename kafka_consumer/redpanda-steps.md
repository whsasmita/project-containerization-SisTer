# Redpanda

## Create topic
docker exec -it redpanda-0 rpk topic create uas_sister

## Consume message
docker exec -it redpanda-0 rpk topic consume uas_sister
