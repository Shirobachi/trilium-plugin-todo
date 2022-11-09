module.exports = async function (taskNoteId) {
  const taskNote = await api.getNote(taskNoteId);

  if (!taskNote) {
    return;
  }

  let dueDate = taskNote.getLabelValue("dueDate");

  if (!dueDate) {
    taskNote.removeLabel("timeLeft");

    return;
  }

  const today = api.dayjs();

  dueDate = api.dayjs(dueDate);

  if (dueDate < today) {
    taskNote.setLabel("timeLeft", "Time is up");

    return;
  }

  taskNote.setLabel("timeLeft", api.dayjs(dueDate - today).format("D[d]"));
};
