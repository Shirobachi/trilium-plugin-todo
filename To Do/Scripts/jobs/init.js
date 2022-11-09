(async function () {
  const createdTodos = await api.runOnServer(async () => {
    async function createNote(
      parentId,
      isProtected,
      title,
      label,
      icon,
      type = "book"
    ) {
      const response = await api.createNewNote({
        parentNoteId: parentId,
        title: title,
        content: "",
        type: type,
        isProtected: isProtected,
      });

      response.note.addLabel(label);
      response.note.addLabel("iconClass", icon);

      return response.note;
    }

    async function createArchiveNote(
      parentId,
      isProtected,
      taskTemplate,
      taskCreateScriptNote,
      collectionViewsNote
    ) {
      const note = await createNote(
        parentId,
        isProtected,
        "Archive",
        "todoArchive",
        "bx bxs-archive-in",
        collectionViewsNote ? "render" : "book"
      );

      note.addLabel("sortableTitle", "4 - Archive");
    }

    async function createTagsNote(parentId, isProtected) {
      await createNote(
        parentId,
        isProtected,
        "Tags",
        "todoTags",
        "bx bxs-purchase-tag"
      );
    }

    async function createBacklogNote(
      parentId,
      isProtected,
      taskTemplate,
      taskCreateScriptNote,
      collectionViewsNote
    ) {
      const note = await createNote(
        parentId,
        isProtected,
        "Backlog",
        "todoBacklog",
        "bx bxs-hourglass",
        collectionViewsNote ? "render" : "book"
      );

      note.addLabel("sortableTitle", "1 - Backlog");
      note.addRelation("child:template", taskTemplate.noteId);
      note.addRelation("runOnChildNoteCreation", taskCreateScriptNote.noteId);

      if (collectionViewsNote) {
        note.addLabel(
          "query",
          `#todoItem and note.ancestors.noteId = ${note.noteId}`
        );
        note.addLabel("view", "gallery");
        note.addLabel("sort", "dueDate");
        note.addLabel("attribute", "timeLeft,prefix=⏲️");
        note.addLabel("attribute", "timeSpent,prefix=⌛");
        note.addLabel("attribute", "tag,badge");
        note.addRelation("renderNote", collectionViewsNote.noteId);
        note.type = "render";
        note.mime = "";
        note.save();
      }
    }

    async function createDoneNote(
      parentId,
      isProtected,
      taskTemplate,
      taskCreateScriptNote,
      collectionViewsNote
    ) {
      const note = await createNote(
        parentId,
        isProtected,
        "Done",
        "todoDone",
        "bx bx-check-double",
        collectionViewsNote ? "render" : "book"
      );

      note.addLabel("sortableTitle", "3 - Done");
      note.addRelation("child:template", taskTemplate.noteId);
      note.addRelation("runOnChildNoteCreation", taskCreateScriptNote.noteId);

      if (collectionViewsNote) {
        note.addLabel(
          "query",
          `#todoItem and note.ancestors.noteId = ${note.noteId}`
        );
        note.addLabel("view", "table");
        note.addLabel("sort", "!completedDate");
        note.addLabel("attribute", "dueDate,header=Due Date");
        note.addLabel("attribute", "completedDate,header=Completed Date");
        note.addLabel("attribute", "timeSpent,header=Time Spent");
        note.addLabel("attribute", "tag,header=Tags,badge");
        note.addRelation("renderNote", collectionViewsNote.noteId);
        note.type = "render";
        note.mime = "";
        note.save();
      }
    }

    async function createInProgressNote(
      parentId,
      isProtected,
      taskTemplate,
      taskCreateScriptNote,
      collectionViewsNote
    ) {
      const note = await createNote(
        parentId,
        isProtected,
        "In Progress",
        "todoInProgress",
        "bx bx-timer",
        collectionViewsNote ? "render" : "book"
      );

      note.addLabel("sortableTitle", "2 - In Progress");
      note.addRelation("child:template", taskTemplate.noteId);
      note.addRelation("runOnChildNoteCreation", taskCreateScriptNote.noteId);

      if (collectionViewsNote) {
        note.addLabel(
          "query",
          `#todoItem and note.ancestors.noteId = ${note.noteId}`
        );
        note.addLabel("view", "table");
        note.addLabel("sort", "dueDate");
        note.addLabel("attribute", "dueDate,header=Due Date");
        note.addLabel("attribute", "timeLeft,header=Time Left");
        note.addLabel("attribute", "timeSpent,header=Time Spent");
        note.addLabel("attribute", "tag,header=Tags,badge");
        note.addRelation("renderNote", collectionViewsNote.noteId);
        note.type = "render";
        note.mime = "";
        note.save();
      }
    }

    async function getTaskTemplate() {
      return (
        await (await api.getNoteWithLabel("todoTemplates")).getChildNotes()
      ).find((m) => m.hasAttribute("label", "todoItem"));
    }

    async function getTaskCreateScriptNote() {
      return api.getNoteWithLabel("todoTaskCreate");
    }

    async function getCollectionViewsNote() {
      return api.getNoteWithLabel("collectionViews");
    }

    async function createTodo(todo, collectionViewNote) {
      todo.setAttribute("label", "iconClass", "bx bx-list-ol");
      todo.removeLabel("initTodo", "");
      todo.addLabel("todo");

      if (collectionViewNote) {
        todo.addLabel(
          "query",
          `#todoItem and note.ancestors.noteId = ${todo.noteId}`
        );
        todo.addLabel("view", "board");
        todo.addLabel("groupBy", "location");
        todo.addLabel("sort", "dueDate,!title");
        todo.addLabel("workspace");
        todo.addLabel("attribute", "timeLeft,prefix=⏲️");
        todo.addLabel("attribute", "timeSpent,prefix=⌛");
        todo.addLabel("attribute", "tag,badge");
        todo.addRelation("renderNote", collectionViewNote.noteId);
        todo.type = "render";
        todo.mime = "";
        todo.save();
      }
    }

    const taskTemplate = await getTaskTemplate();
    const taskCreateScriptNote = await getTaskCreateScriptNote();
    const collectionViewsNote = await getCollectionViewsNote();

    const todos = await api.getNotesWithLabel("initTodo");

    for await (const todo of todos) {
      await createTodo(todo, collectionViewsNote);

      await createArchiveNote(
        todo.noteId,
        todo.isProtected,
        taskTemplate,
        taskCreateScriptNote
      );

      await createBacklogNote(
        todo.noteId,
        todo.isProtected,
        taskTemplate,
        taskCreateScriptNote,
        collectionViewsNote
      );

      await createDoneNote(
        todo.noteId,
        todo.isProtected,
        taskTemplate,
        taskCreateScriptNote,
        collectionViewsNote
      );

      await createInProgressNote(
        todo.noteId,
        todo.isProtected,
        taskTemplate,
        taskCreateScriptNote,
        collectionViewsNote
      );

      await createTagsNote(
        todo.noteId,
        todo.isProtected,
        taskTemplate,
        taskCreateScriptNote,
        collectionViewsNote
      );
    }

    return todos.length;
  });

  await api.waitUntilSynced();

  if (createdTodos) {
    api.showMessage(`${createdTodos} To Do created! Good session!`);
  }
})();
