const URL_LINK = "https://tailortalk.netlify.app//";

const link = document.createElement("link");
link.rel = "stylesheet";
link.href = `${URL_LINK}/chat-plugin.css`;
document.head.appendChild(link);

// Display a "typing" indicator in the chat history
function displayTypingIndicator() {
  const chatHistory = chatWindow.querySelector(".chat-history");
  const typingMessage = createBotMessageElement("typing", "typing");
  chatHistory.insertAdjacentHTML("beforeend", typingMessage);
  chatHistory.scrollTo(0, chatHistory.scrollHeight);
}

// Get all nesscary details from script
let session_id = null;
const user = document.querySelector("#bot-script").getAttribute("user");
const org = document.querySelector("#bot-script").getAttribute("org_id");
const bot = document.querySelector("#bot-script").getAttribute("bot_id");
const chatWindowPrimaryColor = document
  .querySelector("#bot-script")
  .getAttribute("primary_color");
const defaultMessage = document
  .querySelector("#bot-script")
  .getAttribute("default_message");
const botName = document.querySelector("#bot-script").getAttribute("bot_name");
const heightAttribute = document
  .querySelector("#bot-script")
  .getAttribute("bot_height");
const widthAttribute = document
  .querySelector("#bot-script")
  .getAttribute("bot_width");
const whiteLabel =
  document.querySelector("#bot-script").getAttribute("white_label") === "false";
const textColor = document
  .querySelector("#bot-script")
  .getAttribute("text_color");

// Constants
const body = document.body;
const chatIcon = createChatIcon();
const chatWindow = createChatWindow();

if (chatWindowPrimaryColor)
  document.documentElement.style.setProperty(
    "--chat-window-primary-color",
    chatWindowPrimaryColor
  );
if (heightAttribute) {
  chatWindow.style.height = heightAttribute;
}
if (widthAttribute) {
  chatWindow.style.width = widthAttribute;
}

// Create chat icon element
function createChatIcon() {
  const chatIcon = document.createElement("div");
  chatIcon.className = "chat-icon";
  chatIcon.innerHTML = `<img src="${URL_LINK}/logo.png" alt="icon"/> `;
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
    <img class="chat-logo" src="${URL_LINK}/pp.png">
      
      </img>
      <div class="header-info">
        <div>${botName ? botName : "TalkBot"}</div>
        ${whiteLabel ? "" : "<p>Powered by Tailor-Talk</p>"}
      </div>
      <button class="btn close-button material-symbols-outlined" >close</button>
    </div> 
    <div class="chat-history">
    ${
      defaultMessage ? `<div class="intro-message">${defaultMessage}</div>` : ""
    }
    </div>
    <div class="suggestion-strip"></div>
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

  generateResponse(userMessage)
    .then((response) => {
      // Handle the resolved promise here
    })
    .catch((error) => {
      // Handle the rejected promise here
      const chatHistory = chatWindow.querySelector(".chat-history");
      const lastBotMessage = chatHistory.querySelector(
        ".bot-message-container:last-child"
      );

      if (lastBotMessage) {
        lastBotMessage.remove();
      }

      console.log(error);
      const botMessageEle = createBotMessageElement(
        "Something went wrong, Please try again later!",
        "error"
      );
      chatHistory.insertAdjacentHTML("beforeend", botMessageEle); //MOVE UP
    });
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
function createBotMessageElement(botMessage, type = "false") {
  if (type === "error") {
    return `<div class="bot-message-container">
    
    <div class="error-message">
      ${botMessage}
    </div>
  </div>`;
  }
  if (type === "typing") {
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
    const linkRegex = /\[([^\]]+)]\((https?:\/\/[^\s\)]+)\)/g;

    const textWithAnchors = textWithLinks.replace(
      linkRegex,
      '$1 <a href="$2" target="__blank">$2</a>'
    );

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
    params.set("org", org);
    params.set("bot", bot);
    params.set("user", "default");
    if (session_id) params.set("session", session_id);
    params.set("message", userMessage);

    // https://tailortalk-preview.up.railway.app/maestro_chat/v1/chat/stream?org=xuper_mall&bot=b5c5a444-7b87-44eb-9394-d407027098f9&user=akashanand.iitd%40gmail.com&message=Hello
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
        chatHistory.insertAdjacentHTML("beforeend", botMessageEle);
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

if (textColor) {
  document.querySelector(".chat-header").style.color = textColor;
  document.querySelector(".close-button").style.color = textColor;
}

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

const suggestionStrip = chatWindow.querySelector(".suggestion-strip");

function updateSuggestions(suggestions) {
  suggestionStrip.innerHTML = suggestions
    .map((suggestion) => `<div class="suggestion_item">${suggestion}</div>`)
    .join("");
}

suggestionStrip.addEventListener("click", (event) => {
  const clickedSuggestion = event.target.textContent;
  if (clickedSuggestion) {
    chatWindow.querySelector(".message-input").value = clickedSuggestion;
    sendMessage();
  }
});

async function fetchSuggestions() {
  const orgId = "ef9c504e-d483-49c2-90e1-eb70230dabd8"; // Assuming org is defined in your code
  const botId = "tootly"; // Assuming bot is defined in your code
  const userEmail = "default";

  const url =
    "https://tailortalk-production.up.railway.app/maestro_chat/asset/v1/suggestions";
  const headers = {
    "X-Org-Chat-Bot-Id": botId,
    "X-Org-Id": orgId,
    "X-User-Email": userEmail,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch suggestions. Status: ${response.status}`
      );
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [
      "Hi",
      "Hello",
      "How are you",
      "Tell me about org",
      "Provide contact no.",
      "Is it free?",
    ];
  }
}

fetchSuggestions().then((initialSuggestions) => {
  updateSuggestions(initialSuggestions);
});
