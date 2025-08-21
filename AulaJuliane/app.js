var stompClient = null;
var username = null;

function enterChatRoom() {
    username = document.getElementById("username").value.trim();
    if (!username) {
        alert("Por favor, insira um nickname.");
        return;
    }

    document.getElementById("welcome-form").style.display = "none";
    document.getElementById("chat-container").style.display = "flex";

    connect();
}

function connect() {
    var socket = new SockJS('https://67e1c8dd9c1a.ngrok-free.app/chat-websocket');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log("Conectado: " + frame);

        stompClient.subscribe("/topic/public", function (messageOutput) {
            var message = JSON.parse(messageOutput.body);
            showMessage(message);
        });

        stompClient.send("/app/addUser", {}, JSON.stringify({ sender: username, type: 'JOIN' }));
    });
}

function sendMessage() {
    var input = document.getElementById("message-input");
    var content = input.value.trim();

    if (content && stompClient) {
        var chatMessage = {
            sender: username,
            content: content,
            type: 'CHAT'
        };
        stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        input.value = "";
    }
}

function showMessage(message) {
    var messagesContainer = document.getElementById("chat-messages");
    var messageElement = document.createElement("div");

    if (message.type === "JOIN") {
        messageElement.className = "message notice";
        messageElement.textContent = message.sender + " entrou no chat.";
    } else if (message.type === "LEAVE") {
        messageElement.className = "message notice";
        messageElement.textContent = message.sender + " saiu do chat.";
    } else {
        var isSelf = message.sender === username;
        messageElement.className = isSelf ? "message self" : "message other";

        var time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        if (isSelf) {
            messageElement.innerHTML = `
                <span class="content">${message.content}</span>
                <span class="time">${time}</span>
            `;
        } else {
            messageElement.innerHTML = `
                <span class="sender">${message.sender}</span>
                <span class="content">${message.content}</span>
                <span class="time">${time}</span>
            `;
        }
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function leaveChat() {
    if (stompClient && username) {
        stompClient.send("/app/leaveUser", {}, JSON.stringify({
            sender: username,
            type: 'LEAVE'
        }));

        stompClient.disconnect();
    }

    document.getElementById("chat-container").style.display = "none";
    document.getElementById("welcome-form").style.display = "block";
    document.getElementById("chat-messages").innerHTML = "";
    document.getElementById("username").value = "";
    username = null;
}


