(async function () {
  const archiveJobNote = await api.getNote(api.currentNote.noteId);

  const today = dayjs();
  const lastExecution = archiveJobNote.getLabelValue("lastExecution");

  if (lastExecution && !today.isAfter(dayjs(lastExecution).add(7, "day"))) {
    return;
  }

  await api.runOnServer(
    async (archiveJobNoteId) => {
      const tasksNotes = (await api.getNotesWithLabel("todoDone"))
        .flatMap((m) =>
          m.getChildNotes().filter((k) => k.hasLabel("completedDate"))
        )
        .map((m) => m.noteId);

      for await (const taskNote of tasksNotes) {
        await taskArchive(taskNote);
      }

      const archiveJobNote = await api.getNote(archiveJobNoteId);
      archiveJobNote.setLabel("lastExecution", api.dayjs());
    },
    [archiveJobNote.noteId]
  );
})();
