const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions =document.querySelectorAll(".suggestion-list .suggestion")
const toggleThemeButton = document.querySelector("#toggle-theme-button")
const deleteChatButton = document.querySelector("#delete-chat-button")
console.log("TYPEDWORDS:::", typingForm)

let userMessage = null;
let isResponseGenerating = false;
//API configurations
const API_KEY = `######`;
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats")
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode")

    //Apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode"
    
    //Restore saved chats
    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0,chatList.scrollHeight)//scroll to the bottom
}
loadLocalstorageData();

// create a new message element and return it.
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

//show typing effect by displaying words one by one
const showTypingEffect = (text, textElement,incomingMessageDiv) => {

    const words = text.split(' ');
    console.log("SHOW:::::", words)
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        //Append each word to the text element with a space
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");
        
        //If all words are displayed   
        if (currentWordIndex === words.length) {
            clearInterval(typingInterval)
            isResponseGenerating = false;//setting response false after the response
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML)// Save chats to local storage       
        }
        chatList.scrollTo(0,chatList.scrollHeight)//scroll to the bottom
    }, 75)
}

//Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
    const textelement = incomingMessageDiv.querySelector(".text");
    // send a POST request to the API with the user's message
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);
        //console.log("GEMINIRESPONSE::::" + JSON.stringify(data))

        //Get the API response text and remove asterisks from it
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1');
        //console.log("APIRESSSSS::::+" + apiResponse)
        // textelement.innerText = apiResponse
        showTypingEffect(apiResponse, textelement,incomingMessageDiv);
    } catch (error) {
        isResponseGenerating = false;
        console.log("error:::" + error)
        textelement.innerText = error.message;
        textelement.classList.add("error");
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
}

//show a loading animation while waiting for the API response
const showLoadingAnimation = () => {
    const html = ` <div class="message-content">
    <img src="users/GeminiAPI.jpg" alt="Gemini Image" class="avatar">
    <p class="text"></p>
    <div class="loading-indicator">
        <div class="loading-bar">
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
        </div>
    </div>
</div>
<span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>
`;
    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);

    chatList.scrollTo(0,chatList.scrollHeight)//scroll to the bottom
    generateAPIResponse(incomingMessageDiv);
}

//copy message text to the clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done";// show tick icon
    setTimeout(() => copyIcon.innerText = "content_copy", 1000)//Revert icon after 1 second
}


//Handle sending outgoing chat messages
const handleoutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return;// exit if there is no message
    isResponseGenerating = true;
    console.log("userMessage::" + userMessage)
    const html = `<div class="message-content">
    <img src="users/user.jpg" alt="User Image" class="avatar">
    <p class="text"></p>
                  </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv)

    typingForm.reset();//clear input field
    chatList.scrollTo(0,chatList.scrollHeight)//scroll to the bottom
    document.body.classList.add("hide-header");//Hide the header once chat start
    setTimeout(showLoadingAnimation, 500);// show loading animation after a delay
}

//set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion =>{
    suggestion.addEventListener("click", ()=>{
        userMessage = suggestion.querySelector(".text").innerText;
        handleoutgoingChat();
    })
})

//Toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode")
    toggleThemeButton.innerText = islightMode ? "dark_mode" : "light_mode"
})

deleteChatButton.addEventListener("click", ()=>{
    if(confirm("Are you want to delete all messages?")){
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
})

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handleoutgoingChat();
})