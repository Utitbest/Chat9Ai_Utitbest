// import './style.css'
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-javascript.js';
import { auth, provider, signInWithPopup, signOut, db, collection, addDoc, getDocs, query, orderBy, limit,  doc, deleteDoc} from './firebase';
import { renderAIReply } from './AIReplyRenderer.js';
import {ErrorHandler} from './utils/ErrorHandler.js';
import {saveMessageToFirestore} from './utils/SendingcodeFirsbase.js';
import {userNameInChatContain} from './utils/UserName.js'
import {createCopyButton1} from './utils/ButtonToCopyCode.js'

const signInBtn = document.getElementsByClassName('singine')[0];
const userPicture = document.getElementById('suerimge');
const asideView = document.getElementsByTagName('aside')[0];
const previewAside = document.getElementsByClassName('menu-iconx')[0];
const userPictureSpan = document.getElementsByClassName('useriocn')[0]
const userrealphoto = document.getElementsByClassName('userrealphoto')[0]
const userEmail = document.getElementsByClassName('userEmail')[0]
const userDetails = document.getElementsByClassName('userDetails')[0]
const signoutbudd = document.getElementsByClassName('signoutbudd')[0]
const chatcontainer = document.getElementsByClassName('chatcontainer')[0]
const MessageContent = document.getElementById('MessageContent')
const SendButton = document.getElementById('SendButton')
const App = document.getElementById('app');
const previous_ChatContainer = document.getElementsByClassName('previous-data')[0]
const NewChatIcon = document.getElementById('NewChatIcon')
let activeThreadId = null;
const hideit = document.getElementsByClassName('tohide')[0]
const deleTe = document.getElementsByClassName('deleTe')[0];


function initApp(){
  auth.onAuthStateChanged((user) => {
  if (user) {
      WhenUserIsAuthenticated(user)
      FetchRecentChat(user)
      AbigailDeleteMessage(user)
      userNameInChatContain()
      showDeleteButton()
  } else {  
      NonAuthenticatedUser()
      userNameInChatContain()
    }
  });
}
function WhenUserIsAuthenticated(user){
  signInBtn.style.display = 'none'
  userPicture.style.display = 'flex'
  userPicture.src= user.photoURL;
  userrealphoto.src = user.photoURL
  userEmail.innerHTML = user.displayName +'</br>'+ user.email;


  previewAside.style.display = 'flex';
  previewAside.style.visibility = 'visible';
  document.querySelectorAll('.others span').forEach((el) => el.style.display = 'flex')
  document.querySelector('.chatoptions .menu-icon').style.display = 'flex';   
}

async function FetchRecentChat(params) {
  const userId = params.uid;
  const threadsRef = collection(db, "users", userId, "threads");
  const q = query(threadsRef, orderBy("createdAt", "asc"));
  try {
    const querySnapshot = await getDocs(q);
    const threads = [];
    querySnapshot.forEach((doc) => {
      threads.push({
        id: doc.id,          
        ...doc.data()        
      });
    });
    
    threads.forEach((element, id) => {
     addThreadToSidebar(threads[id].id, threads[id].title, userId)
    });

  } catch (err) {
    console.error("Error fetching threads:", err);
    return [];
  }
}

function UniqueId(){
  const timeStamp = Date.now()
  const randomBumber = Math.random()
  const heximatic = randomBumber.toString(20);
  const randomNumberId = `${timeStamp}-${heximatic}`;
  return randomNumberId;
}

function NonAuthenticatedUser(){
    signInBtn.style.display = 'flex'
    signInBtn.textContent = 'Sign In With Google Account';
    userPicture.style.display = 'none'
    document.querySelector('.chatoptions .menu-icon').style.display = 'none'
    document.querySelectorAll('.others span').forEach((el) => el.style.display = 'none')
}


function callGemini(prompt, loadingContainer, threadRef, currentUserId, SendButton){
  fetch('/.netlify/functions/generateContent', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ prompt })
  })
  .then(async res => {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) throw new Error("No AI response returned.");
    
    renderAIReply(generatedText, loadingContainer, threadRef, currentUserId, prompt, SendButton);
  }catch (jsonErr) {
    throw new Error("Invalid JSON response from server: " + text.slice(0, 100));
  }
  })
  .catch(error => {
    SendButton.innerHTML = `<img src="/assets/send.png" alt="">`;
    SendButton.disabled = false
    loadingContainer.remove()
    console.error("Error:", error);
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      ErrorHandler("Internet connection lost. Please check your network.");
    } else {
      ErrorHandler("Oops!, Something went wrong. Reload");
    }
  });
}

function showDeleteButton(){
  const deleGet = deleTe.getAttribute('currentChat')
  if(deleGet === null || activeThreadId === null){
    deleTe.style.cssText = `
      visibility:hidden;
      opacity:0 ;
    `;
  }else{
    deleTe.style.cssText = `
      visibility: visible;
      opacity: 1;
    `;
  }
}

SendButton.addEventListener('click', async ()=>{

  const textareaValue = MessageContent.value.trim()
  if(!textareaValue) return;
  if(navigator.onLine !== true){
    ErrorHandler('No internet connection!')
    return
  }


  MessageContent.value = '';
  SendButton.innerHTML = `<img src="/assets/sendBudSpinner.gif" alt="">`;
  SendButton.disabled = true
  try {
        const user = auth.currentUser;  
        if (user) {
          const defaultDisplayed = chatcontainer.querySelector('.userNameDisplayer');
          const currentUserId = user.uid;
          if(!activeThreadId && defaultDisplayed) {
            const threadRef = await addDoc(collection(db, "users", currentUserId, "threads"), {
            createdAt: Date.now(),
            title: textareaValue.slice(0, 10) || "New Chat"
          });
          
          activeThreadId = threadRef.id;
          deleTe.setAttribute('currentChat', activeThreadId)
          showDeleteButton()
          addThreadToSidebar(activeThreadId, textareaValue.slice(0, 20), currentUserId);
        }
        
          UserMessageTag(textareaValue)
          chatcontainer.scrollTop = chatcontainer.scrollHeight;

          let finalPrompt = textareaValue;
          if (activeThreadId) {
            const previousMessages = await getContextMessages(currentUserId, activeThreadId);
            finalPrompt = buildPromptFromMessages(previousMessages, textareaValue);
          }

            const loadingContainer = responsetext();
            callGemini(finalPrompt, loadingContainer, activeThreadId, currentUserId, SendButton)

            await saveMessageToFirestore({
              userId: currentUserId,
              threadId: activeThreadId,
              role: 'user',
              text: textareaValue
            });
    }else{
      UserMessageTag(textareaValue)
      chatcontainer.scrollTop = chatcontainer.scrollHeight;
      const loadingContainer = responsetext();
      callGemini(textareaValue, loadingContainer, null, null, SendButton)
    }
    
  } catch (err) {
    const loadingContainer = responsetext()
    loadingContainer.remove()
    console.error('Failed to save message:', err);
    ErrorHandler(err)
    SendButton.innerHTML = `<img src="/assets/send.png" alt="">`;
    SendButton.disabled = false
  }
})

async function getContextMessages(userId, threadId) {
  const messagesRef = collection(db, "users", userId, "threads", threadId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "desc"), limit(5));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}

function UserMessageTag(textareaValue){
  const userNameDisplayer = document.querySelector('.userNameDisplayer')
  if(userNameDisplayer) userNameDisplayer.remove();
  
  const usermessaetage = document.createElement('p')
  const UserRequest = document.createElement('div')
  UserRequest.className = 'user-response';
  const messagediv = document.createElement('div')


  usermessaetage.innerHTML = textareaValue;
  messagediv.append(usermessaetage)
  UserRequest.append(messagediv)
  chatcontainer.append(UserRequest);
}
function buildPromptFromMessages(messages, newInput) {
  const chatHistory = messages.map(m => {
    if(m.role === 'user'){
      return `user: ${m.text}`
    }else if(m.role === 'ai'){
      const HtmlElementText = document.createElement('div');
      HtmlElementText.innerHTML = m.html
      const plainText = HtmlElementText.innerText || '';
      return plainText;
    }
  }).join("\n");
  return `${chatHistory}\nuser: ${newInput}`;
}
 
function addThreadToSidebar(id, title, currentUserId){
 
  const item = document.createElement("span");
  item.textContent = title;
  item.dataset.threadId = id;

  if(activeThreadId === id){
    item.classList.add('sidebar')
  }
  
  item.addEventListener('click', async()=>{
    document.querySelectorAll('.previous-data span').forEach(el =>{
      el.classList.remove('sidebar')
    })
    item.classList.add('sidebar')

    chatcontainer.innerHTML = `<div class="sendo2"><div class="loading-man"><span></span><span></span><span></span></div></div>`; 
    activeThreadId = id
    deleTe.setAttribute('currentChat', id)
    try{
      await LoadPreviousChat(activeThreadId, currentUserId)
      showDeleteButton()
    }catch(error){
      console.log(error)
      ErrorHandler(error)
    }
  })
  previous_ChatContainer.prepend(item);
}

async function LoadPreviousChat(threadId, userId) {
  const messagesRef = collection(db, "users", userId, "threads", threadId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const querySnapshot = await getDocs(q);
  const messages = querySnapshot.docs.map(doc => doc.data());
  if(chatcontainer.innerHTML !== ''){
    chatcontainer.innerHTML = '';
  }

  for (const msg of messages) {
    if (msg.role === "user") {
      UserMessageTag(msg.text); 
    } else if (msg.role === "ai") {
      const container = document.createElement("div");
      container.innerHTML = msg.html || '';
      container.className = "ai-text-wrapper"; 
      chatcontainer.appendChild(container);
      const CodeBlock = container.querySelectorAll("pre code, code")
      CodeBlock.forEach(block => {
        if (block && block.textContent) {
          const isBlock = block.parentElement && block.parentElement.tagName.toLowerCase() === "pre";
           if (isBlock && !block.parentElement.querySelector(".copy-btn")) {
              createCopyButton1(block);
            }
          Prism.highlightElement(block);
        }
      });
      
    }
  }

}

function AbigailDeleteMessage(currentuser){
    const currentUserDetail = currentuser.uid
    
  deleTe.addEventListener('click', async()=>{
    const eachdata = deleTe.getAttribute('currentChat')
    if(eachdata === null || activeThreadId === null) return;
    deleteElementCreatedAndDeleted(eachdata, currentUserDetail)
  })
}

async function deleteElementCreatedAndDeleted(thread, currentManOn){
    const promt = document.querySelector('.akpanudo')
    if(document.body.contains(promt)){
      promt.remove()
    }

    const parentDelete = document.createElement('div');
    parentDelete.className = 'akpanudo';
    parentDelete.style.cssText = `
      backdrop-filter: blur(1px);
      width:100%;
      height:100%;
      display:flex;
      align-items:center;
      position: fixed;
      overflow:hidden;
      z-index:600;
      justify-content: center;
      background-color:#919191bd;
    `;
    const divdelete = document.createElement('div')
    divdelete.style.cssText = `
      display:flex;
      width:280px;
      border-radius:1em;
      align-items:center;
      overflow:hidden;
      background-color:#fff;
    `;
    const smallparent = document.createElement('div')
    smallparent.style.cssText =`
      width:100%;
      height:100%;
      display:flex;
      gap:.7em;
      justify-content:space-around;
      flex-direction:column;
      margin: 1em;
    `;
    const divimage = document.createElement('div');
    divimage.style.cssText = `
      width:100%;
      display:flex;
      justify-content: center;
      align-items:center;
      padding-top:.5em;
    `;
    divimage.innerHTML = '<img src="/assets/icons8-delete.gif" alt="">';
    const WarningTag = document.createElement('p')
    WarningTag.style.cssText = `
      width:100%;
      display:flex;
      text-align:center;
    `;
    WarningTag.innerHTML = `Are you sure you want to delete the current chat!?`
    const mainwaringdiv = document.createElement('div')
    mainwaringdiv.style.cssText = `
      width:100%;
      display:flex;
      align-items:center;
      justify-content: space-evenly;
    `;
    const confirmBuds = document.createElement('span');
    confirmBuds.innerText = 'Confirm';
    confirmBuds.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:center;
      background-color:tomato;
      color:#fff;
      padding:.7em;
      border-radius:.4em;
      cursor:pointer;
    `;
    const cancelBud = document.createElement('span');
    cancelBud.innerText = 'Cancel';
    cancelBud.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:center;
      background-color:var(--skyblue);
      color:blue;
      border-radius:.4em;
      padding:.7em;
      cursor:pointer;
    `;
    cancelBud.addEventListener('click', ()=>{
      parentDelete.remove()
    })

    mainwaringdiv.append(confirmBuds, cancelBud)
    smallparent.append(divimage, WarningTag, mainwaringdiv)
    divdelete.append(smallparent)
    parentDelete.append(divdelete)
    App.append(parentDelete)
    
    
    confirmBuds.addEventListener('click', async ()=>{

      try {
        confirmBuds.innerHTML = `<img src="/assets/sendBudSpinner.gif" alt="">`;
        confirmBuds.style.backgroundColor = '#fff';
        const messagesRef = collection(db, "users", currentManOn, "threads", thread, "messages");
        const messageSnapshots = await getDocs(messagesRef);

        const deletePromises = messageSnapshots.docs.map(docSnap =>
          deleteDoc(docSnap.ref)
        );
        await Promise.all(deletePromises);

        const threadDocRef = doc(db, "users", currentManOn, "threads", thread);
        await deleteDoc(threadDocRef);

        if(activeThreadId === thread) {
          chatcontainer.innerHTML = "";
          deleTe.setAttribute('currentChat', '')
          activeThreadId = null
        }

        const threadElement = document.querySelector(`[data-thread-id="${thread}"]`);
        if(threadElement) threadElement.remove();
        userNameInChatContain()
        parentDelete.remove()
        ErrorHandler('Chat Deleted Successfully!')
        showDeleteButton()
      }catch (error) {
        console.error(error)
        ErrorHandler(error)
        parentDelete.remove()
      }
    })

}

function responsetext(){ 
  const aIReplys = document.createElement('div');
  aIReplys.innerHTML = `<div class="sendo" style="display:block;">
        <div class="loading-dots"><span></span><span></span><span></span></div>
      </div>`;
  chatcontainer.append(aIReplys);
  return aIReplys;
}
signInBtn.addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log(user)
      console.log("Signed in as:", user.displayName);
    })
    .catch((error) => {
      console.error("Sign-in error:", error);
    })
    // .finally(()=>{location.reload()})
})

signoutbudd.addEventListener('click', () => {
  signOut(auth)
    .then(() => {
      console.log("User signed out");
    })
    .catch((error) => {
      console.error("Sign-out error:", error);
    })
    // .finally(()=>{location.reload()})
});

async function ButtonsAreas(){
  NewChatIcon.addEventListener('click', ()=>{
    if(document.body.contains(chatcontainer)){
      userNameInChatContain()
      activeThreadId = null;
      deleTe.setAttribute('currentChat', '')
      document.querySelectorAll('.previous-data span').forEach(el =>{
        el.classList.remove('sidebar')
      })
    }
    showDeleteButton()
  })
  userPictureSpan.addEventListener('click', ()=>{
      userDetails.classList.toggle('sh')
  })
  previewAside.onclick = ()=>{
    asideView.classList.toggle('asideView')
  }
  MessageContent.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault()
      SendButton.click()
    }
  })
  hideit.addEventListener('click', ()=>{
    if(asideView.classList.contains('asideView')){
      asideView.classList.remove('asideView')
    }
  })
  document.addEventListener('click', (event)=>{
    
    if(window.innerWidth < 930 && asideView.classList.contains('asideView')){

      if(!previewAside.contains(event.target) && !asideView.contains(event.target)){
        asideView.classList.remove('asideView');
      }

    }
  })

 
}
ButtonsAreas()
document.addEventListener('DOMContentLoaded', initApp)





