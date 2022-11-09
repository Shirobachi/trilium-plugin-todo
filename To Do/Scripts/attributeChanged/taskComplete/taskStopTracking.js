module.exports = async function (taskNoteId) {
  const taskNote = await api.getNote(taskNoteId);

  if (!taskNote) {
    return;
  }

  await taskUpdateTimeSpent(taskNoteId);

  taskNote.removeLabel("startedAt");
  taskNote.removeLabel("cssClass", "tracking");

  await taskNote.save();
};
