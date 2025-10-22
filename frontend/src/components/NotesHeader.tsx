const visibleItems = useMemo(() => {
  let items = notes.filter((note) => note.parentId === activeFolderId);

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      items = items.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerSearchTerm) ||
          (note.type === "file" &&
            note.content.toLowerCase().includes(lowerSearchTerm)) ||
          note.tags.some((tag) => tag.toLowerCase().includes(lowerSearchTerm))
      );
    }

     items.sort((a, b) => {
      // Always show folders first
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;

      // Then apply user's preferred sort order
      switch (preferences.defaultSortOrder) {
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "recent":
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });
    return items;
}, [notes, activeFolderId, searchTerm, preferences.defaultSortOrder]);

const NotesHeader = ()=>{
    return(
        <div
            className={
              `lg:col-span-1 flex flex-col h-full ` +
              (isMobile
                ? mobileView === "list"
                  ? "block"
                  : "hidden"
                : "block")
            }
          >
            {/* Folder Navigation */}
            {activeFolderId !== null && (
              <div className="mb-4 flex items-center">
                <Button
                  variant="ghost"
                  onClick={navigateBack}
                  className="mr-2 px-2"
                  size="sm"
                  title="navigate back"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <h3 className="font-semibold text-lg truncate">
                  {notes.find((n) => n.id === activeFolderId)?.title || "Root"}
                </h3>
              </div>
            )}

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes and folders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card shadow-card border-0 focus:shadow-glow transition-smooth"
                />
              </div>
            </div>

            {/* Folder and Note Creation Buttons */}
            <div className="flex space-x-2 mb-4">
              <Button
                onClick={createNewNote}
                disabled={isCreating}
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-spring"
                title="create note"
              >
                {isCreating ? (
                  <Spinner className="h-4 w-4 mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Note
              </Button>
              <Button
                onClick={createNewFolder}
                disabled={isCreating}
                variant="outline"
                className="flex-1 border-primary text-primary hover:bg-primary/10 transition-spring"
                title="create folder"
              >
                {isCreating ? (
                  <Spinner className="h-4 w-4 mr-1" />
                ) : (
                  <FolderPlus className="h-4 w-4 mr-1" />
                )}
                Folder
              </Button>
            </div>

            {notesLoading ? (
              <div className="flex justify-center items-center h-48">
                <Spinner />
              </div>
            ) : (
              <div className="flex-1 flex flex-col premium-sidebar rounded-2xl border-2 border-primary/30 bg-gradient-card shadow-3d overflow-hidden min-h-[400px] max-h-[calc(100vh-220px)]">
                <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4 custom-scrollbar">
                  {visibleItems.length === 0 ? (
                    <Card className="shadow-card border-0 bg-gradient-card">
                      <CardContent className="p-6 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          {notes.length === 0
                            ? "No items yet. Create your first note or folder!"
                            : "No items found in this location."}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    visibleItems.map((item) => (
                      <Card
                        key={item.id}
                        className={`cursor-pointer transition-spring shadow-card border border-primary/20 bg-gradient-card hover:shadow-glow hover:border-primary/60 rounded-xl ${
                          selectedNote?.id === item.id && item.type === "file"
                            ? "ring-2 ring-primary shadow-glow"
                            : ""
                        }`}
                        onClick={() =>
                          item.type === "folder"
                            ? openFolder(item.id)
                            : selectNote(item)
                        }
                      >
                        <CardHeader className="py-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg truncate mr-2 flex items-center">
                              {item.type === "folder" ? (
                                <Folder className="h-5 w-5 mr-2 text-yellow-500/80" />
                              ) : (
                                <FileText className="h-5 w-5 mr-2 text-primary/80" />
                              )}
                              {item.title}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNoteToDelete(item);
                              }}
                              className="text-muted-foreground hover:text-destructive transition-smooth"
                              title="delete note"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        {item.type === "file" && (
                          <CardContent className="py-2">
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                              {item.content
                                ? (() => {
                                    let preview = item.content
                                      .replace(
                                        /<li data-type="taskItem"[^>]*data-checked="true"[^>]*>/g,
                                        "☑ "
                                      )
                                      .replace(
                                        /<li data-type="taskItem"[^>]*>/g,
                                        "☐ "
                                      )
                                      .replace(/<h[1-6][^>]*>/g, "\n")
                                      .replace(/<\/h[1-6]>/g, " ")
                                      .replace(/<\/p>/g, " ")
                                      .replace(/<br\s*\/?/g, " ")
                                      .replace(/<[^>]*>/g, "")
                                      .replace(/\s+/g, " ")
                                      .trim();
                                    return (
                                      preview.substring(0, 150) || "No content"
                                    );
                                  })()
                                : "No content"}
                            </p>
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {item.tags.slice(0, 3).map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {item.tags.length > 3 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    +{item.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {item.updatedAt.toLocaleDateString()}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2 flex-wrap">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  title="previous page"
                >
                  Prev
                </Button>

                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                      title="select page"
                    >
                      {page}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  title="Next page"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
    )
}