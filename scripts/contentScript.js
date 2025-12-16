const palette = document.createElement('div');
    palette.id = 'highlight-palette';
    palette.className = 'highlight-palette';
    palette.innerHTML = `
      <button id="yellowButton" style="background-color: yellow;"></button>
      <button id="greenButton" style="background-color: green;"></button>
      <button id="blueButton" style="background-color: blue;"></button>
      <button id="redButton" style="background-color: red;"></button>
      <button id="pinkButton" style="background-color: pink;"></button>
    `;

    let isShiftPressed = false;


    document.addEventListener('click', function(event) {
      if (event.target.matches('#yellowButton')) {
        highlightText('yellow');
      } else if (event.target.matches('#greenButton')) {
        highlightText('green');
      } else if (event.target.matches('#blueButton')) {
        highlightText('blue');
      } else if (event.target.matches('#redButton')) {
        highlightText('red');
      } else if (event.target.matches('#pinkButton')) {
        highlightText('pink');
      }
       
    });

   
  
    document.body.appendChild(palette);


    function handleDelete(event) {
      const note = event.target.closest('.note-page');
      if (note) {
        const noteId = parseInt(note.dataset.id);
    
        // Remove the note element from the DOM
        note.remove();
    
        removeNoteFromStorage(note);
    
        // Stop event propagation to prevent unintended behavior
        event.stopPropagation();
      }
    }

    

document.addEventListener('mouseup', function() {
    const selection = window.getSelection();
    
  
    if (selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      palette.style.top = `${rect.top + window.scrollY - 40}px`;
      palette.style.left = `${rect.left + window.scrollX}px`;
    
      palette.style.display = 'block';

      
    
    } else {
      palette.style.display = 'none';
    }
  });


  document.addEventListener('keydown', (event) => {
    if (event.key === 'Shift') {
      isShiftPressed = true;
    }
  });


  // Event listener for creating notes on Shift + click
document.addEventListener('click', (event) => {
  if (isShiftPressed) {
    const note = createNoteElement(event.clientY, event.clientX);
    saveNoteToStorage(note);

    isShiftPressed = false;

     note.querySelector('.delete-button').addEventListener('click', handleDelete)
    
  }
});

// Function to create a new note element
function createNoteElement(top, left) {
  const note = document.createElement('div');
  // note.id = 'note-' + Date.now();
  note.className = 'note-page';
  note.innerHTML = `
    <div class="header">
      <button class="delete-button">X</button>
    </div>
    <textarea></textarea>
  `;

  note.style.display = 'block';
  note.style.position = 'absolute';
  note.style.top = `${top}px`;
  note.style.left = `${left}px`;

  document.body.appendChild(note);
  return note;
}

// Function to save note id to Chrome Storage
function saveNoteToStorage(note) {
  chrome.storage.local.get('notes', (result) => {
    const notes = result.notes || [];
    const noteData = {
      id: Date.now(),
      top: note.style.top,
      left: note.style.left,
      text: note.querySelector('textarea').value,
      url: window.location.href 
    };
    notes.push(noteData);

    console.log(result.notes || []);
    chrome.storage.local.set({ 'notes': notes }, () => {
      console.log('Note saved:', noteData);
    });

    
});
}

function saveNotesToStorage() {
  const notes = [];
  document.querySelectorAll('.note-page').forEach(note => {
    notes.push({
      id: note.dataset.id,
      top: note.style.top,
      left: note.style.left,
      text: note.querySelector('textarea').value,
      url: window.location.href 
    });
  });
  chrome.storage.local.set({ notes }, () => {
    console.log('All notes saved:', notes);
  });
}

document.addEventListener('input', (event) => {
  if (event.target.closest('.note-page')) {
    saveNotesToStorage();
  }
});


// Function to restore notes from storage
function restoreNotes() {
  chrome.storage.local.get('notes', (result) => {
    const notes = result.notes || [];
    const currentUrl = window.location.href;
    console.log('Restoring notes:', notes);
    notes.filter(noteData => noteData.url === currentUrl).forEach(noteData => {
      const note = document.createElement('div');
      note.className = 'note-page';
      note.innerHTML = `
        <div class="header">
          <button class="delete-button">X</button>
        </div>
        <textarea>${noteData.text}</textarea>
      `;
      note.style.display = 'block';
      note.style.top = noteData.top;
      note.style.left = noteData.left;

      document.body.appendChild(note);
      

      note.querySelector('.delete-button').addEventListener('click', handleDelete);
    });
  });
}

// Function to remove note from storage
function removeNoteFromStorage(note) {
  chrome.storage.local.get('notes', (result) => {
    let notes = result.notes || [];
    const noteId = note.querySelector('textarea').value;
    notes = notes.filter(noteData => noteData.text !== noteId);
    chrome.storage.local.set({ 'notes': notes }, () => {
      console.log('Note removed:', noteId);
    });
  });
}

// Restore notes when the page loads
window.addEventListener("load", () => {
  restoreNotes();
  restoreHighlights();

});


  
  function highlightText(color) {
   
    const selection = window.getSelection();
    if (selection.rangeCount) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.backgroundColor = color;
      span.innerHTML = selection.toString();
      range.surroundContents(span);

      saveHighlightToStorage(span);
    }
   
    palette.style.display = 'none';
  }
  
  

  


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "convertToPDF") convertPageToPDF()
})

const scrollDownUntilEnd = () => {
  function isAtPageEnd() {
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight
  }
  function scroll() {
      const x = 0
      const y = window.scrollY + window.innerHeight

      window.scrollTo({
          top: y,
          left: x,
      })
      if (!isAtPageEnd()) {
          scroll()
      }
  }
  scroll()
}

const imageUrlToBase64 = (imgSrc) => {
  return new Promise((resolve, reject) => {
      // Fetch the image data as a Blob
      fetch(imgSrc, { mode: 'cors' })
          .then(response => {
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              return response.blob();
          })
          .then(blob => {
              // Read the Blob as a data URL
              const reader = new FileReader();
              reader.onload = function() {
                  resolve(reader.result);
              };
              reader.onerror = function() {
                  resolve(imgSrc)
              };
              reader.readAsDataURL(blob);
          })
          .catch(error => {
              resolve(imgSrc)
          });
  });
};

const replaceImageSourcesWithBase64 = () => {
  const images = document.querySelectorAll('img')
  Array.from(images).forEach(async img => {
      const newSource = imageUrlToBase64(img)
      img.src = newSource
      console.log('newSource', newSource)
  })
}

const convertPageToPDF = async () => {
  console.log("Converting page to PDF...")
  const title = document.querySelector('title')
  const { width } = document.body.getBoundingClientRect()

  window.scrollTo(0, 0)
  document.body.style.padding = '0 10px'

  let imagenes = document.getElementsByTagName("img");
  for (let i = 0; i < imagenes.length; i++) {
      if(imagenes[i].src.includes('://')) {
          const newSource = await imageUrlToBase64(imagenes[i].src)
          console.log(newSource)
          imagenes[i].src = newSource
      }
  }

  const marginX = (window.innerWidth - width) / 2

  console.log('width', width)
  console.log('window.innerWidth', window.innerWidth)
  var options = {
      margin: [0, 0],
      filename: `${title ? title.textContent : 'page'}.pdf`,
      image: { type: 'jpeg', quality: 0.88 },
      html2canvas: {
        //  width: document.body.scrollWidth, // Full width of the document
        // windowWidth: document.body.scrollWidth, // Full width of the document
          allowTaint: true,
          useCORS: true,
          dpi: 300
      },
      // jsPDF: {
      // margin: 5, 
      // format: 'letter', 
      // orientation: 'portrait'
      // }
  }
  html2pdf().set(options).from(document.body).save().then(() => {
      chrome.runtime.sendMessage({ action: "processComplete" })
  })
}

  function call(){
    alert("Hello");
  }




  function saveHighlightToStorage(highlight) {
    chrome.storage.local.get('highlights', (result) => {
      const highlights = result.highlights || [];
  
      highlights.push({
        color: highlight.style.backgroundColor,
        text: highlight.textContent,
        parentPath: getElementPath(highlight.parentNode),
        startOffset: getTextNodeOffset(highlight),
        url: window.location.href // Save the URL to filter highlights later
      });
  
      chrome.storage.local.set({ highlights }, () => {
        console.log('Highlight saved:', highlights);
      });
    });
  }
  
  function getTextNodeOffset(node) {
    let offset = 0;
    let sibling = node;
    while ((sibling = sibling.previousSibling) != null) {
      if (sibling.nodeType === Node.TEXT_NODE) {
        offset += sibling.textContent.length;
      }
    }
    return offset;
  }

  function restoreHighlights() {
    const currentUrl = window.location.href;
  
    chrome.storage.local.get('highlights', (result) => {
      const highlights = result.highlights || [];
      const filteredHighlights = highlights.filter(highlight => highlight.url === currentUrl);
  
      console.log('Restoring highlights for URL:', currentUrl);
      console.log('Filtered highlights:', filteredHighlights);
  
      filteredHighlights.forEach(highlight => {
        const parent = getElementByPath(highlight.parentPath);
        if (parent) {
          const textNodes = getTextNodes(parent);
          let charIndex = 0;
          let textNode, startOffset;
  
          // Find the text node and the correct offset within it
          for (let node of textNodes) {
            if (charIndex + node.textContent.length >= highlight.startOffset) {
              textNode = node;
              startOffset = highlight.startOffset - charIndex;
              break;
            }
            charIndex += node.textContent.length;
          }
  
          if (textNode) {
            const originalText = textNode.textContent;
            const beforeText = originalText.substring(0, startOffset);
            const highlightedText = highlight.text;
            const afterText = originalText.substring(startOffset + highlightedText.length);
  
            console.log('Original text:', originalText);
            console.log('Highlighted text:', highlightedText);
            console.log('Before text:', beforeText);
            console.log('After text:', afterText);
  
            // Create a span for the highlighted text
            const span = document.createElement('span');
            span.style.backgroundColor = highlight.color;
            span.textContent = highlightedText;
  
            // Update the text node
            textNode.textContent = beforeText + afterText;
  
            // Insert the highlighted span
            const afterNode = document.createTextNode(afterText);
            parent.insertBefore(afterNode, textNode.nextSibling);
            parent.insertBefore(span, afterNode);
          } else {
            console.error('Text node not found or not a text node:', highlight);
          }
        } else {
          console.error('Parent node not found:', highlight);
        }
      });
    });
  }
  
  function getTextNodes(node) {
    const textNodes = [];
    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i]);
        }
      }
    }
    traverse(node);
    return textNodes;
  }
  
  // Helper function to get the element path
  function getElementPath(element) {
    const path = [];
    while (element && element !== document.body) {  // Ensure the loop stops at the body
      const parent = element.parentNode;
      const index = Array.from(parent.childNodes).indexOf(element);
      path.unshift(index);
      element = parent;
    }
    return path;
  }
  
  // Helper function to get an element by its path
  function getElementByPath(path) {
    if (!Array.isArray(path)) {
      console.error('Invalid path:', path);
      return null;
    }
  
    let element = document.body;
    for (const index of path) {
      if (element.childNodes[index]) {
        element = element.childNodes[index];
      } else {
        console.error('Invalid index in path:', index);
        return null;  // Return null if the path is invalid
      }
    }
    return element;
  }
  
  