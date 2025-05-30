import { auth} from '../firebase';

export function userNameInChatContain(){
    const userAppeletion = document.querySelector('.userNameDisplayer');
    if(userAppeletion){
        userAppeletion.remove()
    }
            const chatcontainer = document.getElementsByClassName('chatcontainer')[0]
            chatcontainer.innerHTML = '';

            const paren = document.createElement('div')
            paren.className = 'userNameDisplayer';
            paren.style.cssText = `
                width:100%;
                height:100%;
                display:flex;
                align-items:center;
                justify-content:center;
            `;
            const pate = document.createElement('p')
            pate.style.cssText = `
                text-align:center;
                color: transparent; 
                font-weight:600;
                font-size:2.5em;
                background-image:linear-gradient(27deg, #ff00008f, #0000ffa3, #0080009c);
                -webkit-background-clip: text;  
                background-clip: text; 
            `;
            paren.appendChild(pate)
        auth.onAuthStateChanged((user)=>{
            if(user){
                const user1 = user.displayName.split(" ")[0]
                pate.innerHTML = `Hello, ${user1}`;
            }else{
                pate.innerHTML = `Welcome, what can i help you with today?`;
            }
        })
            return chatcontainer.appendChild(paren)

}
