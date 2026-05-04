package let.prep.producer_service.controller;

import let.prep.base_service.dto.ChatMessage;
import let.prep.base_service.dto.ChatMessageEvent;
import let.prep.producer_service.service.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class Controller {

    @Autowired
    private Service service;

    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/send")
    public String sendMessage(@RequestBody ChatMessage message) {

        ChatMessageEvent event = new ChatMessageEvent();
        event.setChat(message);
        event.setStatus("sending");
        service.sendMessage(event);
        return "Message sent to Kafka topic";
    }
}
