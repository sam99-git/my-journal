const CLIENT_ID = '83066352681-jqr0ntbuufrd3idpmfadv45u8cvueulp.apps.googleusercontent.com';
const API_KEY = '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'; // Use this for server-side APIs only
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let notesFileId = null;

// Load the Google API client
gapi.load('client:auth2', () => {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: SCOPES,
    }).then(() => {
        const authInstance = gapi.auth2.getAuthInstance();
        updateSignInStatus(authInstance.isSignedIn.get());
        authInstance.isSignedIn.listen(updateSignInStatus);

        document.getElementById('sign-in-btn').addEventListener('click', () => authInstance.signIn());
        document.getElementById('sign-out-btn').addEventListener('click', () => authInstance.signOut());
    });
});

// Update UI based on sign-in status
function updateSignInStatus(isSignedIn) {
    const authSection = document.getElementById('auth-section');
    const journalSection = document.getElementById('journal-section');

    if (isSignedIn) {
        authSection.style.display = 'none';
        journalSection.style.display = 'block';
        loadNotes();
    } else {
        authSection.style.display = 'block';
        journalSection.style.display = 'none';
    }
}

// Load notes from Google Drive
function loadNotes() {
    gapi.client.drive.files.list({
        q: "name='my_journal.json'",
        fields: 'files(id, name)',
    }).then(response => {
        const files = response.result.files;
        if (files && files.length > 0) {
            notesFileId = files[0].id;
            gapi.client.drive.files.get({
                fileId: notesFileId,
                alt: 'media',
            }).then(response => {
                const notes = JSON.parse(response.body);
                renderNotes(notes);
            });
        }
    });
}

// Save notes to Google Drive
function saveNotesToDrive(notes) {
    const fileMetadata = {
        name: 'my_journal.json',
        mimeType: 'application/json',
    };
    const media = {
        mimeType: 'application/json',
        body: JSON.stringify(notes),
    };

    if (notesFileId) {
        gapi.client.drive.files.update({
            fileId: notesFileId,
            media: media,
        }).then(() => {
            alert('Notes saved successfully.');
            renderNotes(notes); // Ensure notes are rendered after saving
        });
    } else {
        gapi.client.drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        }).then(response => {
            notesFileId = response.result.id;
            alert('Notes saved successfully.');
            renderNotes(notes); // Ensure notes are rendered after saving
        });
    }
}

// Render notes on the page
function renderNotes(notes) {
    const notesContainer = document.getElementById('notes-container');
    notesContainer.innerHTML = ''; // Clear existing notes
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        noteElement.innerHTML = `
            <time>${note.date} ${note.time}</time>
            <p>${note.text}</p>
        `;
        notesContainer.appendChild(noteElement);
    });
}

// Add a new note
document.getElementById('add-note-btn').addEventListener('click', () => {
    const noteInput = document.getElementById('note-input');
    const noteText = noteInput.value.trim();
    if (!noteText) return;

    const now = new Date();
    const note = {
        text: noteText,
        date: now.toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' }),
        time: now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Dubai' }),
    };

    // Get existing notes from Google Drive or initialize if none exist
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.push(note);

    // Save updated notes to Google Drive
    saveNotesToDrive(notes);

    noteInput.value = '';  // Clear the input field
});
