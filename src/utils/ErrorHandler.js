
function ErrorHandler(d){
  const app = document.getElementById('app')
  const exitserror = document.querySelector('.erroAlert')
  if(exitserror){
    exitserror.remove()
  }
  const errorHandler = document.createElement('div')
  errorHandler.className = 'erroAlert';
  errorHandler.innerHTML = `
     <span class="eclama">!</span>
    <p id="forheo">${d}</p>
    <span class="xIconremoce">
      <img src="/assets/close_icon.svg" alt="">
    </span>
  `
  app.append(errorHandler)
  errorHandler.querySelector('.xIconremoce').onclick = () =>{
    errorHandler.classList.add('showErrorhandle')
    setTimeout(() => errorHandler.remove(), 300);
  } 
  
}

export{ErrorHandler}