function createCopyButton(preEl) {
      const button = document.createElement('button');
      button.className = 'copy-btn';
      button.textContent = '📋';
      button.addEventListener('click', async () => {
        let codeText = preEl.innerText || '';
        codeText = codeText.replace(/\s*📋\s*$/, '');
        try {
          await navigator.clipboard.writeText(codeText);
          button.textContent = '✅ Copied!';
          setTimeout(() => (button.textContent = '📋'), 1500);
        } catch (err) {
          console.error('Copy failed', err);
          ErrorHandler(err)
          SendButton.innerHTML = `<img src="/assets/send.png" alt="">`;
          SendButton.disabled = false;
          button.textContent = '❌ Failed';
        }
      });
      preEl.append(button);
}

function createCopyButton1(codeBlock) {
  const button = document.createElement("button");
  button.textContent = "📋";
  button.className = "copy-btn";

  button.onclick = () => {
    navigator.clipboard.writeText(codeBlock.textContent);
    button.textContent = "✅ Copied!";
    setTimeout(() => (button.textContent = "📋"), 1500);
  };
  codeBlock.parentElement.appendChild(button);
}

export{
    createCopyButton1,
    createCopyButton
}