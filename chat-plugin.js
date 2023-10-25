// Display a "typing" indicator in the chat history
function displayTypingIndicator() {
  const chatHistory = chatWindow.querySelector(".chat-history");
  const typingMessage = createBotMessageElement("typing", true);
  chatHistory.insertAdjacentHTML("beforeend", typingMessage);
  chatHistory.scrollTo(0, chatHistory.scrollHeight);
}

// Get all nesscary details from script
let session_id = null;
const user = document.querySelector("#bot-script").getAttribute("user");

// Constants
const body = document.body;
const chatIcon = createChatIcon();
const chatWindow = createChatWindow();

// Create chat icon element
function createChatIcon() {
  const chatIcon = document.createElement("div");
  chatIcon.className = "chat-icon";
  chatIcon.innerHTML = `<img src="https://chat-plugin-demo.netlify.app/logo.png" /> `;
  return chatIcon;
}

// Create chat window element
function createChatWindow() {
  const chatWindow = document.createElement("div");
  chatWindow.id = "chat-window";
  chatWindow.className = "chat-window";
  chatWindow.style.display = "none";

  chatWindow.innerHTML = `
    <div class="chat-header">
      <img class="logo" src="https://chat-plugin-demo.netlify.app/pp.png">
      
      </img>
      <div class="header-info">
        <div>TalkBot</div>
        <p>Powered by Tailor-Talk</p>
      </div>
      <button class="btn close-button material-symbols-outlined" >close</button>
    </div> 
    <div class="chat-history">
      <div class="intro-message">
        Ask question about our product, service or booking some appointments.
      </div>
    </div>
    <div class="message-container">
      <input class="message-input" placeholder="Type your message...">
      <span class="material-symbols-rounded send-button">send</span>
    </div>
  `;
  return chatWindow;
}

// Toggle chat window visibility
function toggleChatWindow() {
  const chatWindow = document.getElementById("chat-window");
  const chatIcon = document.querySelector(".chat-icon");

  if (chatWindow.style.display === "none" || chatWindow.style.display === "") {
    chatWindow.style.display = "flex";
    setTimeout(() => {
      chatWindow.style.transform = "translateY(0)";
    }, 0);
    chatIcon.style.display = "none";
  } else {
    chatWindow.style.transform = "translateY(100%)";
    setTimeout(() => {
      chatWindow.style.display = "none";
      chatIcon.style.display = "flex";
    }, 500);
  }
}

// Close the chat window
function closeChatWindow() {
  chatWindow.style.transform = "translateY(100%)";
  setTimeout(() => {
    chatWindow.style.display = "none";
    chatIcon.style.display = "flex";
  }, 500);
}

// Send a user message and handle the bot response
function sendMessage() {
  const inputField = chatWindow.querySelector(".message-input");
  const chatHistory = chatWindow.querySelector(".chat-history");
  const userMessage = inputField.value;

  if (!userMessage) return;

  const userMessageEle = createUserMessageElement(userMessage);
  chatHistory.insertAdjacentHTML("beforeend", userMessageEle);

  inputField.value = "";
  displayTypingIndicator();

  generateResponse(userMessage);
}

// Create a user message element
function createUserMessageElement(userMessage) {
  return `
    <div class="user-message-container">
      <div class="user-message">
        ${userMessage}
      </div>
    </div>
  `;
}

// Create a bot message element
function createBotMessageElement(botMessage, typing = false) {
  if (typing === true) {
    return `
    <div class="bot-message-container" >
    
    <svg height="40" width="40" class="loader">
        <circle class="dot" cx="10" cy="20" r="3" style="fill:grey;" />
        <circle class="dot" cx="20" cy="20" r="3" style="fill:grey;" />
        <circle class="dot" cx="30" cy="20" r="3" style="fill:grey;" />
      </svg> </div>`;
  }
  return `
    <div class="bot-message-container">
      <div class="bot-message">
        ${botMessage}
      </div>
    </div>
  `;
}

// Function to append streaming data to the last bot message
function appendToBotLastMessage(content) {
  content = content.replace(/\n/g, "<br>"); // Replace newlines with <br> tags
  content = content.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;"); // Replace tabs with non-breaking spaces

  const chatHistory = chatWindow.querySelector(".chat-history");
  const lastBotMessageContainer = chatHistory.querySelector(
    ".bot-message-container:last-child .bot-message"
  );

  if (lastBotMessageContainer) {
    const textWithLinks = lastBotMessageContainer.innerHTML + content;

    // Create a regular expression to match links
    const linkRegex = /\[([^\]]+)]\((https?:\/\/[^\s\)]+)\)/g;

    // Replace links with anchor tags
    const textWithAnchors = textWithLinks.replace(
      linkRegex,
      '$1 <a href="$2" target="__blank">$2</a>'
    );

    // console.log(textWithAnchors);

    lastBotMessageContainer.innerHTML = textWithAnchors;
    chatHistory.scrollTo(0, chatHistory.scrollHeight);
  }
  // if (lastBotMessageContainer) {
  //   const urlRegex = /(https?:\/\/[^\s]+)/;
  //   const botMessage = lastBotMessageContainer.innerHTML + content;
  //   const botMessageWithLinks = botMessage.replace(
  //     urlRegex,
  //     `<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>`
  //   );
  //   lastBotMessageContainer.innerHTML = botMessageWithLinks;
  //   chatHistory.scrollTo(0, chatHistory.scrollHeight);
  // }
}

// Generate a response from the server
function generateResponse(userMessage) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams();
    params.set("user", user);
    if (session_id) params.set("session", session_id);
    params.set("message", userMessage);

    const url = `https://tailortalk-production.up.railway.app/maestro_chat/v1/chat/stream?${params.toString()}`;

    const eventSource = new EventSource(url);

    let combinedContent = "";

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.session_id) {
        session_id = data.session_id;
      }

      if (data.role) {
        const chatHistory = chatWindow.querySelector(".chat-history");
        const lastBotMessage = chatHistory.querySelector(
          ".bot-message-container:last-child"
        );

        if (lastBotMessage) {
          lastBotMessage.remove();
        }

        const botMessageEle = createBotMessageElement("");
        chatHistory.insertAdjacentHTML("beforeend", botMessageEle); //MOVE UP
      }

      if (data.content) {
        appendToBotLastMessage(data.content);
        combinedContent += data.content;
      }

      if (data.success) {
        eventSource.close(); // Close the connection
        resolve(combinedContent);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource encountered an error:", error);
      eventSource.close(); // Close the connection
      reject(error); // Reject the promise in case of an error
    };
  });
}

// Initialize
body.appendChild(chatIcon);
body.appendChild(chatWindow);

// Event Listeners
chatIcon.addEventListener("click", toggleChatWindow);
document
  .getElementsByClassName("close-button")[0]
  .addEventListener("click", closeChatWindow);

const sendButton = document.querySelector(".send-button");
const inputField = document.querySelector(".message-input");
sendButton.addEventListener("click", sendMessage);
inputField.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});
