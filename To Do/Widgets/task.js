const TASK_TEMPLATE = `<style>
    .task-widget {
      display: flex;
      padding: 10px;
      border-top: 1px solid var(--main-border-color);
      contain: none;
    }

    .task-widget .task-widget-buttons {
      display: flex;
      flex-direction: row;
      justify-content: center;
      flex-grow: 0;
      flex-flow: row wrap;
    }

    .task-widget .task-widget-tags {
      display: flex;
      flex: 1;
      margin-left: 5px;
      align-items: center;
    }

    .task-widget .task-widget-tags span {
      margin-right: 5px;
      height: 18px;
    }

    .task-widget .task-widget-stats {
      display: flex;
      margin-left: auto;
      align-items: center;
    }

    .task-widget .task-widget-stats small {
      margin-right: 10px;
    }

    .button-widget.button-widget-disabled {
      display: none;
    }
  </style>

  <div class="task-widget">
    <div class="task-widget-buttons">
      <span
        id="taskStartTracking"
        class="button-widget icon-action bx bx-play-circle"
        title="Start Tracking"></span>

      <span
        id="taskStopTracking"
        class="button-widget button-widget-disabled icon-action bx bx-stop-circle"
        title="Stop Tracking"></span>

      <span
        id="taskCompleteButton"
        class="button-widget icon-action bx bx-check-double"
        title="Done"></span>

      <span
        id="taskArchiveButton"
        class="button-widget icon-action bx bx-archive"
        title="Archive"></span>

      <div class="dropdown note-actions">
        <button
          type="button"
          data-toggle="dropdown"
          title="Tags"
          class="icon-action bx bx-tag"></button>

        <div
          id="todoAvailableTags"
          class="dropdown-menu dropdown-menu-up"></div>
      </div>

      <div class="dropdown note-actions">
        <button
          type="button"
          data-toggle="dropdown"
          class="icon-action bx bx-dots-vertical-rounded"></button>

        <div class="dropdown-menu dropdown-menu-up"></div>
      </div>
    </div>

    <div class="task-widget-tags"></div>

    <div class="task-widget-stats"></div>
  </div>`;

class TodoItemWidget extends api.NoteContextAwareWidget {
  get position() {
    return 90;
  }

  get parentWidget() {
    return "center-pane";
  }

  isEnabled() {
    return (
      super.isEnabled() &&
      this.note.hasLabel("todoItem") &&
      !this.note.hasLabel("archived")
    );
  }

  doRender() {
    this.$widget = $(TASK_TEMPLATE);

    this.$taskStartTracking = this.$widget
      .find("#taskStartTracking")
      .css("color", "green")
      .click(async () => this.startTracking());

    this.$taskStopTracking = this.$widget
      .find("#taskStopTracking")
      .css("color", "red")
      .click(async () => this.stopTracking());

    this.$taskCompleteButton = this.$widget
      .find("#taskCompleteButton")
      .click(async () => this.complete());

    this.$taskArchiveButton = this.$widget
      .find("#taskArchiveButton")
      .click(async () => this.archive());

    this.$todoAvailableTags = this.$widget.find("#todoAvailableTags");

    this.$taskTags = this.$widget.find(".task-widget-tags");

    this.$taskStats = this.$widget.find(".task-widget-stats");

    return this.$widget;
  }

  async startTracking() {
    this.$taskStartTracking.toggleClass("button-widget-disabled");
    this.$taskStopTracking.toggleClass("button-widget-disabled");

    await api.runOnBackend(
      async (taskNoteId) => {
        await taskStartTracking(taskNoteId);
      },
      [this.note.noteId]
    );

    this.refresh();
  }

  async stopTracking() {
    this.$taskStopTracking.toggleClass("button-widget-disabled");
    this.$taskStartTracking.toggleClass("button-widget-disabled");

    await api.runOnBackend(
      async (taskNoteId) => {
        await taskStopTracking(taskNoteId);
      },
      [this.note.noteId]
    );

    this.refresh();
  }

  async complete() {
    await api.runOnServer(
      async (taskNoteId) => {
        const taskNote = await api.getNote(taskNoteId);
        taskNote.setLabel("completedDate", api.dayjs().format("YYYY-MM-DD"));
      },
      [this.note.noteId]
    );

    this.refresh();
  }

  async archive() {
    await api.runOnServer(
      async (taskNoteId) => {
        await taskArchive(taskNoteId);
      },
      [this.note.noteId]
    );

    this.refresh();
  }

  async refreshWithNote(note) {
    await this.updateTags(note);
    await this.updateAvailableTags(note);
    await this.updateStats(note);
    await this.updateTrackingStatus(note);
  }

  async entitiesReloadedEvent({ loadResults }) {
    if (loadResults.isNoteContentReloaded(this.noteId)) {
      this.refresh();
    }
  }

  async updateStats(taskNote) {
    this.$taskStats.html("");

    const timeLeft = taskNote.getLabelValue("timeLeft");

    if (timeLeft) {
      this.$taskStats.append($("<small />").text("⏲️ " + timeLeft));
    }

    const startedAt = taskNote.getLabelValue("startedAt");

    const timeSpent = taskNote.getLabelValue("timeSpent");

    if (timeSpent && !startedAt) {
      this.$taskStats.append($("<small />").text("⌛ " + timeSpent));
    }
  }

  async updateTags(taskNote) {
    this.$taskTags.html("");

    const tags = await api.runOnServer(
      async (taskNoteId) => {
        return (await api.getNote(taskNoteId))
          .getAttributes("relation", "tag")
          .map((rel) => {
            const targetNote = rel.targetNote;

            return {
              title: targetNote.title,
              iconClass: targetNote.getLabelValue("iconClass"),
              background: targetNote.getLabelValue("badgeBackground"),
              color: targetNote.getLabelValue("badgeColor"),
            };
          });
      },
      [taskNote.noteId]
    );

    tags?.forEach((tag) => {
      this.$taskTags.append(
        $("<span />")
          .addClass("badge badge-secondary")
          .text(tag.title)
          .css("background", tag.background)
          .css("color", tag.color)
          .prepend($("<i />").addClass(tag.iconClass))
      );
    });
  }

  async toggleTag(taskNoteId, tagId) {
    const taskNote = await api.getNote(taskNoteId);

    const tagExist = !!taskNote
      .getAttributes("relation", "tag")
      .find((attribute) => attribute.value == tagId);

    await api.runOnServer(
      async (noteId, tagId, tagExist) => {
        const taskNote = await api.getNote(noteId);

        tagExist
          ? taskNote.removeRelation("tag", tagId)
          : taskNote.addRelation("tag", tagId);

        await taskNote.save();
      },
      [taskNoteId, tagId, tagExist]
    );

    this.refresh();
  }

  async updateTrackingStatus(taskNote) {
    const startedAt = taskNote.getLabelValue("startedAt");

    const wereStarted = !!startedAt;

    this.$taskStartTracking.toggleClass("button-widget-disabled", wereStarted);

    this.$taskStopTracking.toggleClass("button-widget-disabled", !wereStarted);

    if (startedAt) {
      this.$taskStats.append(
        $("<small />")
          .css("font-weight", "bold")
          .css("color", "green")
          .text(`In Progress since ${dayjs(startedAt).fromNow(true)} ago...`)
      );
    }
  }

  async updateAvailableTags(taskNote) {
    this.$todoAvailableTags.html("");

    const todoTagsParentNote = (
      await taskNote.getParentNotes()[0].getParentNotes()[0].getChildNotes()
    ).find((m) => m.hasLabel("todoTags"));

    if (!todoTagsParentNote) {
      return;
    }

    (await todoTagsParentNote.getChildNotes()).forEach((tag) =>
      this.$todoAvailableTags.append(
        $("<a />")
          .addClass("dropdown-item")
          .click(async (e) => {
            $(e.currentTarget).parent().toggleClass("show");

            await this.toggleTag(taskNote.noteId, tag.noteId);
          })
          .append(
            $("<span />")
              .addClass("badge badge-secondary")
              .text(tag.title)
              .css("background", tag.getLabelValue("badgeBackground"))
              .css("color", tag.getLabelValue("badgeColor"))
              .prepend($("<i />").addClass(tag.getLabelValue("iconClass")))
          )
      )
    );
  }
}

module.exports = new TodoItemWidget();
