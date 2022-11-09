(async function () {
  const attributeName = api.originEntity.name;
  const taskNote = api.originEntity.getNote();

  if (attributeName === "dueDate") {
    await taskUpdateTimeLeft(taskNote.noteId);

    return;
  }

  if (attributeName === "completedDate") {
    await taskComplete(taskNote.noteId);

    return;
  }
})();
