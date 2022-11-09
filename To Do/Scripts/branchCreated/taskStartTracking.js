module.exports = async function (taskNoteId) {
  const taskNote = await api.getNote(taskNoteId);

  if (!taskNote) {
    return;
  }

  taskNote.removeLabel("timeSpent");
  taskNote.setLabel("startedAt", api.dayjs().toString());
  taskNote.setLabel("cssClass", "tracking");

  await taskNote.save();
};
