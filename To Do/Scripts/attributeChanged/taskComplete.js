module.exports = async function (noteId, completedDate) {
  const note = await api.getNote(noteId);

  if (!note) {
    return;
  }

  if (note.getParentNotes().some((m) => m.hasLabel("todoArchive"))) {
    return;
  }

  const todoDoneId = (
    await note.getParentNotes()[0].getParentNotes()[0].getChildNotes()
  ).find((m) => m.hasLabel("todoDone"))?.noteId;

  if (!todoDoneId) {
    return;
  }

  await taskStopTracking(noteId);

  const oldParentNoteId = note.getParentNotes()[0].noteId;

  await api.toggleNoteInParent(true, note.noteId, todoDoneId);

  await api.toggleNoteInParent(false, note.noteId, oldParentNoteId);

  note.removeLabel("timeLeft");

  note.removeLabel("dueDate");

  note.setRelation("location", todoDoneId);
};
