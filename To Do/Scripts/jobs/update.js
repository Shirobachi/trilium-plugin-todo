(async function () {
  async function updateTasksNotesTimeLeft() {
    await api.runOnBackend(async () => {
      const tasksNotes = await api
        .getNotesWithLabel("todoItem")
        .filter((m) => m.hasLabel("dueDate"))
        .map((m) => m.noteId);

      for await (const taskNote of tasksNotes) {
        await taskUpdateTimeLeft(taskNote);
      }
    });
  }

  setInterval(async () => {
    await updateTasksNotesTimeLeft();
  }, 60000);
})();
