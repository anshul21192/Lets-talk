package let.prep.consumer_service.config;

import let.prep.base_service.dto.ChatMessageEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableKafka
public class KafkaConfig {

    @Value("${spring.kafka.topic.dlq}")
    private String dlqTopicName;

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<String, ChatMessageEvent> template) {

        DeadLetterPublishingRecoverer recoverer =
                new DeadLetterPublishingRecoverer(template);

        FixedBackOff backOff = new FixedBackOff(2000L, 3);

        return new DefaultErrorHandler(recoverer, backOff);
    }


    @Bean
    public NewTopic createTopic() {
        return TopicBuilder
                .name(dlqTopicName)
                .partitions(2)
                .build();
    }
}