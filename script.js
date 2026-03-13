const API_URL = 'https://silent-assistant-backend-pui1.vercel.app';

const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const duplicateWarning = document.getElementById('duplicateWarning');
const similarFileName = document.getElementById('similarFileName');
const questionInput = document.getElementById('questionInput');
const askBtn = document.getElementById('askBtn');
const chatHistory = document.getElementById('chatHistory');

let selectedFile = null;

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        document.querySelector('.upload-text').textContent = selectedFile.name;
        uploadBtn.disabled = false;
        
        // Hide previous warnings/status
        duplicateWarning.classList.add('hidden');
        uploadStatus.classList.add('hidden');
    }
});

uploadBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Processing...';
    uploadStatus.classList.remove('hidden');
    uploadStatus.textContent = 'Extracting and embedding text...';
    uploadStatus.style.color = '#9ca3af';

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            uploadStatus.textContent = `Success! Processed ${data.chunks_processed} sections.`;
            uploadStatus.style.color = '#34d399';
            
            // Enable QA
            questionInput.disabled = false;
            askBtn.disabled = false;
            
            // Check for duplicates
            if (data.duplicate_warning) {
                similarFileName.textContent = data.similar_file;
                duplicateWarning.classList.remove('hidden');
            }

            addMessage("system", `Document "${selectedFile.name}" has been processed. Silent Assistant is ready for questions.`);
        } else {
            uploadStatus.textContent = `Error: ${data.detail}`;
            uploadStatus.style.color = '#ef4444';
        }
    } catch (error) {
        uploadStatus.textContent = `Connection error: ${error.message}`;
        uploadStatus.style.color = '#ef4444';
    } finally {
        uploadBtn.textContent = 'Process Document';
        uploadBtn.disabled = false;
    }
});

function addMessage(role, text, context = []) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'user' ? 'user-msg' : 'system-msg'}`;
    
    let avatar = role === 'user' ? '👤' : '🤖';
    
    msgDiv.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="msg-content">
            <div>${text}</div>
        </div>
    `;
    
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

askBtn.addEventListener('click', async () => {
    const query = questionInput.value.trim();
    if (!query) return;

    // Show user msg
    addMessage('user', query);
    questionInput.value = '';
    
    askBtn.disabled = true;
    questionInput.disabled = true;
    questionInput.placeholder = "Thinking...";

    const formData = new FormData();
    formData.append('query', query);

    try {
        const response = await fetch(`${API_URL}/ask`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            addMessage('system', data.answer, data.context);
        } else {
            addMessage('system', `Error: ${data.detail}`);
        }
    } catch (error) {
        addMessage('system', `Connection error: ${error.message}`);
    } finally {
        askBtn.disabled = false;
        questionInput.disabled = false;
        questionInput.placeholder = "Ask a question about the document...";
        questionInput.focus();
    }
});

// Allow Enter to send chat
questionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !askBtn.disabled) {
        askBtn.click();
    }
});
