package let.prep.producer_service.service;

import let.prep.base_service.dto.ChatMessageEvent;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;

@org.springframework.stereotype.Service
@Slf4j
public class Service {

    @Autowired
    private NewTopic topic;

    @Autowired
    private KafkaTemplate<String, ChatMessageEvent> kafkaTemplate;

    public void sendMessage(ChatMessageEvent event) {
        log.info("Sending Message to Kafka topic {}",event);

        kafkaTemplate.send(topic.name(), event.getChat().getRoomId(), event);

    }
}
