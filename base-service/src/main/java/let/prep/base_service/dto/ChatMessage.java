package let.prep.base_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    private String sender;
    private String content;
    private String roomId;
    private String type;
    private long timestamp;

}
