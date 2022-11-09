module.exports = async function (noteId) {
  async function getChildNoteByTitle(parentNote, title) {
    let note = parentNote.getChildNotes().find((m) => m.title === title);

    if (!note) {
      note = await api.createNewNote({
        parentNoteId: parentNote.noteId,
        title: title,
        content: "",
        type: "book",
        isProtected: parentNote.isProtected,
      }).note;
    }

    return note;
  }

  const taskNote = await api.getNote(noteId);

  const todoArchiveNote = (
    await taskNote.getParentNotes()[0].getParentNotes()[0].getChildNotes()
  ).find((m) => m.hasLabel("todoArchive"));

  if (!todoArchiveNote) {
    return;
  }

  const completedDate = api.dayjs(
    taskNote.getLabelValue("completedDate") || api.dayjs()
  );

  const completedYear = completedDate.format("YYYY");

  const completedMonth = completedDate.format("MM - MMMM");

  const completedDay = completedDate.format("DD - dddd");

  const archiveYearNote = await getChildNoteByTitle(
    todoArchiveNote,
    completedYear
  );

  const archiveMonthNote = await getChildNoteByTitle(
    archiveYearNote,
    completedMonth
  );

  const archiveDayNote = await getChildNoteByTitle(
    archiveMonthNote,
    completedDay
  );

  const oldParentNoteId = taskNote.getParentNotes()[0].noteId;

  await api.toggleNoteInParent(true, taskNote.noteId, archiveDayNote.noteId);

  await api.toggleNoteInParent(false, taskNote.noteId, oldParentNoteId);

  taskNote.removeLabel("timeLeft");

  taskNote.removeLabel("dueDate");

  taskNote.setRelation("location", todoArchiveNote.noteId);
};
