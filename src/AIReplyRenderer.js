// import { db } from '../firebase.js'; // Adjust path as needed
// import { collection, addDoc } from 'firebase/firestore';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-javascript.js';
import { saveMessageToFirestore } from './utils/SendingcodeFirsbase.js';
import {createCopyButton} from './utils/ButtonToCopyCode.js'


export async function renderAIReply(markdownText, containerElement, threadId, userId, prompts, SendButton){
  // if(markdownText.toLowerCase().indexOf('ai:') === 0) {
  //   markdownText = markdownText.slice(3).trimStart();
  // }
  markdownText = markdownText.replace(/\bai:\b/gi, '<span style="display:none;">ai:</span>');

  const htmlText = marked.parse(markdownText);

  const loading = containerElement.querySelector('.sendo');
  const parentElemCont = containerElement.parentElement;
  if (loading) loading.remove();

  const wrapper = document.createElement('div');
  wrapper.className = 'ai-text-wrapper';
  containerElement.appendChild(wrapper);

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlText; 
  const nodes = Array.from(tempDiv.childNodes);
  async function typeNode(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) {
      const span = document.createElement('span');
      parent.appendChild(span);
      const text = node.textContent;
      for (let i = 0; i < text.length; i++) {
        span.textContent += text.charAt(i);
        // parentElemCont.scrollTop = parentElemCont.scrollHeight;
        await new Promise(r => setTimeout(r, 8));
      }
    } else {
      const el = node.cloneNode(false);
      parent.appendChild(el);

      if (el.tagName === 'PRE') {
        let codeEl = el.querySelector('code');
        if (!codeEl) {
          codeEl = document.createElement('code');
          codeEl.className = 'language-javascript';
          el.appendChild(codeEl);
        }
        const codeText = node.textContent;
        codeEl.textContent = '';
        for (let i = 0; i < codeText.length; i++) {
          codeEl.textContent += codeText.charAt(i);
          // parentElemCont.scrollTop = parentElemCont.scrollHeight;
          await new Promise(r => setTimeout(r, 8));
        }
        Prism.highlightElement(codeEl);
        createCopyButton(codeEl);
      } else if (el.tagName === 'CODE'){
        const codeText = node.textContent;
        el.textContent = '';
        if (!el.className) {
          el.className = 'language-javascript';
        }
        for (let i = 0; i < codeText.length; i++){
          el.textContent += codeText.charAt(i);
          // parentElemCont.scrollTop = parentElemCont.scrollHeight;
          await new Promise(r => setTimeout(r, 8));
        }
        Prism.highlightElement(el);
      } else if (el.tagName === 'A') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
        const get =  el.getAttribute('href')
        el.innerHTML = get
      }else {
        for (const child of node.childNodes) {
          await typeNode(child, el);
        }
      }
    }
  }

  await (async () => {
    for (const node of nodes) {
      await typeNode(node, wrapper);
      
    }
  })();
    SendButton.innerHTML = `<img src="/assets/send.png" alt="">`;
    SendButton.disabled = false;
    await saveMessageToFirestore({
    userId: userId,
    threadId: threadId,
    role: 'ai',
    html: htmlText
  });
}



