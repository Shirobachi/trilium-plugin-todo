(async function () {
  const taskNote = api.originEntity.getNote();
  const taskParentNote = await api.getNote(api.originEntity.parentNoteId);

  const tasksParentsLabels = [
    "todoDone",
    "todoArchive",
    "todoInProgress",
    "todoBacklog",
  ];

  if (!tasksParentsLabels.some((m) => taskParentNote.hasLabel(m))) {
    return;
  }

  taskNote.setRelation("location", taskParentNote.noteId);

  if (taskParentNote.hasLabel("todoDone")) {
    const today = api.dayjs().format("YYYY-MM-DD");

    taskNote.setLabel("completedDate", today);
  }

  if (taskParentNote.hasLabel("todoInProgress")) {
    await taskStartTracking(taskNote.noteId);

    return;
  }

  if (taskParentNote.hasLabel("todoArchive")) {
    await taskArchive(taskNote.noteId);

    return;
  }
})();
