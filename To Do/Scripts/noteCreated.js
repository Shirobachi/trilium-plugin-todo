const taskNote = api.originEntity;
const taskParentNote = taskNote.getParentNotes()[0];

taskNote.addRelation("location", taskParentNote.noteId);

if (taskParentNote.hasLabel("todoDone")) {
  const today = api.dayjs().format("YYYY-MM-DD");

  taskNote.setLabel("completedDate", today);
}
