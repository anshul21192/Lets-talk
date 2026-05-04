package let.prep.consumer_service.service;

import let.prep.base_service.dto.ChatMessageEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@org.springframework.stereotype.Service
@Slf4j
public class Service {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "${spring.kafka.topic.name}"
            , groupId = "chat-consumer-group")
    public void consumeMessage(ChatMessageEvent message) {


        // Simulate failure
        if (message.getChat().getContent().contains("fail")) {
            throw new RuntimeException("Simulated failure");
        }

        log.info("Received Message from Kafka topic {}",message);

        messagingTemplate.convertAndSend(
                "/topic/" + message.getChat().getRoomId(),
                message
        );
    }

    @KafkaListener(topics = "${spring.kafka.topic.dlq}", groupId = "chat-dlt-group")
    public void consumeDLQ(ChatMessageEvent message) {
        System.out.println("DLQ message: " + message);
    }
}
