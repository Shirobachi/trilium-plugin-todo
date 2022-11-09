module.exports = async function (taskNoteId) {
  const taskNote = await api.getNote(taskNoteId);

  if (!taskNote) {
    return;
  }

  const startedAt = taskNote.getLabelValue("startedAt");

  if (!startedAt) {
    return;
  }

  let spent = +(taskNote.getLabelValue("spent") || 0);
  spent += api.dayjs().diff(startedAt, "minutes");

  const timeSpent = api.dayjs.duration(spent, "minutes").format("H[h] m[m]");

  taskNote.setLabel("spent", spent);
  taskNote.setLabel("timeSpent", timeSpent);

  await taskNote.save();
};
