const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion")
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat_Button");

let userMessage = null;
let isResponseGenerating = false;

// API configuration
const API_KEY = "AIzaSyC4vLu92CIEgVhfyBRKbqMDu9Kjg6iSTOg";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

const loadlocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themecolor") === "light_mode");
//apply theme to local storage
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    chatList.innerHTML = savedChats || ""; 

    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight); 
    }

    loadlocalstorageData();

//creates a new message element and return it 
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}
// shows typing effect words one by one .
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        // append each word to the text element with a space 
        textElement.innerText += (currentWordIndex === 0 ? '' : '  ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        if(currentWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML); 
           
        }
        chatList.scrollTo(0, chatList.scrollHeight); // scrool to bootm
    }, 75);
}

const generateAPIRespnose = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text"); //Get text Element

    // send a post request to the api with the user message.
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents:[{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();

        if(!response.ok) throw new Error(data.error.message);

        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
        
        
    } catch (error) {
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
        
    } finally{
        incomingMessageDiv.classList.remove("loading");
    }
}

//show a loading animations while waiting for an api response 
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                <img src="images/gemini.svg" alt="Gemini Image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "outgoing", "loading");      
    chatList.appendChild(incomingMessageDiv);

    chatList.scrollTo(0, chatList.scrollHeight); 
    generateAPIRespnose(incomingMessageDiv);
}
// copy text message to clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; //show tick icon
    setTimeout(() => 
        copyIcon.innerText = "content_copy", 1000
    ); //revert icon after 1 sec
}


// handles sending outgoing messages 
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return;

    isResponseGenerating = true;

    const html = `<div class="message-content">
                <img src="images/user.jpeg" alt="User Image" class="avatar">
                <p class="text"></p>
            </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing")         
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset();
    chatList.scrollTo(0, chatList.scrollHeight); 
    document.body.classList.add("hide-header");
    setTimeout(showLoadingAnimation, 500);
    
}


suggestions.forEach(suggestions => {
    suggestions.addEventListener("click", () => {
        userMessage = suggestions.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

// toogle betwween dark and light mode 
toggleThemeButton.addEventListener("click", () => {
   const isLightMode = document.body.classList.toggle("light_mode");
   localStorage.setItem("themecolor", isLightMode ? "light_mode" : "dark_mode")
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
})

deleteChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all chats ?")) {
        localStorage.removeItem("savedChats");
        loadlocalstorageData();
    }
})

typingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handleOutgoingChat();
});