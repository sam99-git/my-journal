const notesContainer = document.getElementById('notes-container');
const noteInput = document.getElementById('note-input');

function addNote() {
    const note = noteInput.value.trim();
    if (note) {
        const noteElement = document.createElement('p');
        noteElement.textContent = note;
        notesContainer.appendChild(noteElement);
        noteInput.value = '';
    }
}
