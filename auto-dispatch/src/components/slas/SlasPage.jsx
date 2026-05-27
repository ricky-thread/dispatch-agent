import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

const DEFAULT_RULE =
  "{{Agreement type is Managed Services and Source is Chat}}";

let nextSlaId = 4;

function createSla(name, rule = DEFAULT_RULE) {
  return { id: nextSlaId++, name, rule };
}

function cloneLists(activeIds, pendingIds) {
  return { activeIds: [...activeIds], pendingIds: [...pendingIds] };
}

function removeId(ids, id) {
  return ids.filter((x) => x !== id);
}

function insertAt(ids, id, index) {
  const next = ids.filter((x) => x !== id);
  next.splice(Math.max(0, Math.min(index, next.length)), 0, id);
  return next;
}

function DiscardDialog({ onCancel, onDiscard }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-labelledby="discard-title"
        className="w-full max-w-md rounded-xl bg-white shadow-xl border border-neutral-200 p-6"
      >
        <h3
          id="discard-title"
          className="text-lg font-semibold text-neutral-900"
        >
          Discard changes?
        </h3>
        <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
          You have unsaved changes to SLA order and placement. If you leave now,
          those changes will not be applied to live tickets.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-neutral-600 hover:text-neutral-900 px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="text-sm font-medium px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingMenu({ onEdit, onAddToActive, onDelete }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
        aria-label="SLA options"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[200px] bg-white border border-neutral-200 rounded-md shadow-lg py-1 z-30">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onEdit();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50 flex items-center gap-2"
          >
            <Pencil size={13} className="text-neutral-500" />
            Edit
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onAddToActive();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50 flex items-center gap-2"
          >
            <Plus size={13} className="text-neutral-500" />
            Add to active list...
          </button>
          <div className="my-1 border-t border-neutral-100" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onDelete();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function SlaCard({
  sla,
  editMode,
  draggable,
  onDragStart,
  onDragEnd,
  showMenu,
  onEdit,
  onAddToActive,
  onDelete,
  isDragging,
  isDragOver,
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`flex items-start gap-3 px-4 py-3.5 bg-white transition-colors ${
        isDragging ? "opacity-40" : ""
      } ${isDragOver ? "bg-emerald-50/80" : "hover:bg-neutral-50/80"}`}
    >
      {editMode && (
        <div
          className="shrink-0 pt-0.5 text-neutral-400 cursor-grab active:cursor-grabbing"
          aria-hidden
        >
          <GripVertical size={16} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-neutral-900">
          {sla.name}
        </div>
        <div className="text-xs text-neutral-500 mt-0.5 font-mono">
          {sla.rule}
        </div>
      </div>
      {showMenu && !editMode && (
        <PendingMenu
          onEdit={onEdit}
          onAddToActive={onAddToActive}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

function SlaListZone({
  zone,
  ids,
  slasById,
  editMode,
  emptyContent,
  showPriorityMarkers,
  dragState,
  onDragStart,
  onDragEnd,
  onDragOverZone,
  onDragOverItem,
  onDrop,
  renderCardExtras,
}) {
  const isActive = zone === "active";
  const isDragTarget =
    editMode && dragState.overZone === zone && !dragState.overIndex;

  return (
    <div
      className={`rounded-lg border bg-white overflow-hidden transition-shadow ${
        isDragTarget
          ? "border-emerald-400 ring-2 ring-emerald-400/25"
          : "border-neutral-200"
      }`}
      onDragOver={(e) => {
        if (!editMode) return;
        e.preventDefault();
        onDragOverZone(zone);
      }}
      onDrop={(e) => {
        if (!editMode) return;
        e.preventDefault();
        onDrop(zone, ids.length);
      }}
    >
      {showPriorityMarkers && (
        <div className="px-4 py-2 text-xs text-neutral-400 border-b border-neutral-100">
          ↑ Highest priority
        </div>
      )}

      {ids.length === 0 ? (
        <div
          className="px-4 py-8"
          onDragOver={(e) => {
            if (!editMode) return;
            e.preventDefault();
            onDragOverZone(zone);
          }}
          onDrop={(e) => {
            if (!editMode) return;
            e.preventDefault();
            onDrop(zone, 0);
          }}
        >
          {emptyContent}
        </div>
      ) : (
        ids.map((id, index) => {
          const sla = slasById[id];
          if (!sla) return null;
          const isLast = index === ids.length - 1;
          const isDragOver =
            editMode &&
            dragState.overZone === zone &&
            dragState.overIndex === index;

          return (
            <div
              key={id}
              onDragOver={(e) => {
                if (!editMode) return;
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                const insertIndex = e.clientY < mid ? index : index + 1;
                onDragOverItem(zone, insertIndex);
              }}
              onDrop={(e) => {
                if (!editMode) return;
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                const insertIndex = e.clientY < mid ? index : index + 1;
                onDrop(zone, insertIndex);
              }}
              className={!isLast ? "border-b border-neutral-100" : ""}
            >
              <SlaCard
                sla={sla}
                editMode={editMode}
                draggable={editMode}
                isDragging={dragState.draggedId === id}
                isDragOver={isDragOver}
                onDragStart={(e) => onDragStart(e, id, zone)}
                onDragEnd={onDragEnd}
                showMenu={!isActive}
                {...(renderCardExtras?.(sla) ?? {})}
              />
            </div>
          );
        })
      )}

      {showPriorityMarkers && (
        <div className="px-4 py-2 text-xs text-neutral-400 border-t border-neutral-100">
          ↓ Lowest priority
        </div>
      )}
    </div>
  );
}

function SlaEditor({ title, initialName, onBack, onSave }) {
  const [name, setName] = useState(initialName);

  return (
    <main className="flex-1 bg-[#FAF9F6] min-h-screen">
      <header className="px-8 py-4 border-b border-neutral-200 bg-white flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
      </header>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          SLA name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          placeholder="e.g. VIP response time"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Rule configuration is out of scope for this prototype.
        </p>

        <div className="flex justify-end gap-3 mt-10">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-neutral-600 hover:text-neutral-900 px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => onSave(name.trim())}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2 rounded-md shadow-sm ${
              !name.trim()
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
          >
            <Check size={14} />
            Save
          </button>
        </div>
      </div>
    </main>
  );
}

export default function SlasPage({ onRegisterNavGuard }) {
  const INITIAL_BY_ID = {
    1: { id: 1, name: "My first SLA", rule: DEFAULT_RULE },
    2: { id: 2, name: "My second SLA", rule: DEFAULT_RULE },
    3: { id: 3, name: "My third SLA", rule: DEFAULT_RULE },
  };

  const [slasById, setSlasById] = useState(INITIAL_BY_ID);
  const [activeIds, setActiveIds] = useState([1]);
  const [pendingIds, setPendingIds] = useState([3, 2]);

  const [view, setView] = useState("list");
  const [editingId, setEditingId] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [draftActiveIds, setDraftActiveIds] = useState([]);
  const [draftPendingIds, setDraftPendingIds] = useState([]);
  const snapshotRef = useRef(null);

  const [dragState, setDragState] = useState({
    draggedId: null,
    sourceZone: null,
    overZone: null,
    overIndex: null,
  });

  const [discardOpen, setDiscardOpen] = useState(false);
  const pendingNavRef = useRef(null);

  const displayActiveIds = editMode ? draftActiveIds : activeIds;
  const displayPendingIds = editMode ? draftPendingIds : pendingIds;

  const enterEditMode = useCallback((active, pending) => {
    snapshotRef.current = cloneLists(active, pending);
    setDraftActiveIds([...active]);
    setDraftPendingIds([...pending]);
    setEditMode(true);
  }, []);

  const exitEditMode = useCallback(() => {
    setEditMode(false);
    setDraftActiveIds([]);
    setDraftPendingIds([]);
    snapshotRef.current = null;
    setDragState({
      draggedId: null,
      sourceZone: null,
      overZone: null,
      overIndex: null,
    });
  }, []);

  const handleSaveOrder = () => {
    setActiveIds([...draftActiveIds]);
    setPendingIds([...draftPendingIds]);
    exitEditMode();
  };

  const handleCancelOrder = () => {
    exitEditMode();
  };

  const handleEditOrder = () => {
    enterEditMode(activeIds, pendingIds);
  };

  const handleAddToActiveAndEdit = (id) => {
    const nextActive = [...activeIds.filter((x) => x !== id), id];
    const nextPending = removeId(pendingIds, id);
    enterEditMode(nextActive, nextPending);
  };

  const applyDrop = (targetZone, insertIndex) => {
    const draggedId = dragState.draggedId;
    if (!draggedId) return;

    let nextActive = removeId(draftActiveIds, draggedId);
    let nextPending = removeId(draftPendingIds, draggedId);

    if (targetZone === "active") {
      nextActive = insertAt(nextActive, draggedId, insertIndex);
    } else {
      nextPending = insertAt(nextPending, draggedId, insertIndex);
    }

    setDraftActiveIds(nextActive);
    setDraftPendingIds(nextPending);
    setDragState({
      draggedId: null,
      sourceZone: null,
      overZone: null,
      overIndex: null,
    });
  };

  const handleDragStart = (e, id, zone) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(id));
    setDragState((s) => ({ ...s, draggedId: id, sourceZone: zone }));
  };

  const handleDragEnd = () => {
    setDragState({
      draggedId: null,
      sourceZone: null,
      overZone: null,
      overIndex: null,
    });
  };

  useEffect(() => {
    if (!editMode) {
      onRegisterNavGuard?.(null);
      return undefined;
    }

    const guard = (targetSection, proceed) => {
      pendingNavRef.current = { targetSection, proceed };
      setDiscardOpen(true);
    };
    onRegisterNavGuard?.(guard);

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      onRegisterNavGuard?.(null);
    };
  }, [editMode, onRegisterNavGuard]);

  const handleDiscardConfirm = () => {
    setDiscardOpen(false);
    const pending = pendingNavRef.current;
    pendingNavRef.current = null;
    exitEditMode();
    pending?.proceed?.();
  };

  const handleDiscardCancel = () => {
    setDiscardOpen(false);
    pendingNavRef.current = null;
  };

  const handleDeleteSla = (id) => {
    setSlasById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActiveIds((prev) => removeId(prev, id));
    setPendingIds((prev) => removeId(prev, id));
    if (editMode) {
      setDraftActiveIds((prev) => removeId(prev, id));
      setDraftPendingIds((prev) => removeId(prev, id));
    }
  };

  const handleCreateSave = (name) => {
    const sla = createSla(name);
    setSlasById((prev) => ({ ...prev, [sla.id]: sla }));
    setPendingIds((prev) => [...prev, sla.id]);
    setView("list");
  };

  const handleEditSave = (name) => {
    setSlasById((prev) => ({
      ...prev,
      [editingId]: { ...prev[editingId], name },
    }));
    setEditingId(null);
    setView("list");
  };

  if (view === "create") {
    return (
      <SlaEditor
        title="Create SLA"
        initialName=""
        onBack={() => setView("list")}
        onSave={handleCreateSave}
      />
    );
  }

  if (view === "edit" && editingId && slasById[editingId]) {
    return (
      <SlaEditor
        title="Edit SLA"
        initialName={slasById[editingId].name}
        onBack={() => {
          setEditingId(null);
          setView("list");
        }}
        onSave={handleEditSave}
      />
    );
  }

  const cardExtras = (sla) => ({
    onEdit: () => {
      setEditingId(sla.id);
      setView("edit");
    },
    onAddToActive: () => handleAddToActiveAndEdit(sla.id),
    onDelete: () => handleDeleteSla(sla.id),
  });

  return (
    <main className="flex-1 bg-[#FAF9F6] min-h-screen">
      <header className="px-8 py-4 border-b border-neutral-200 bg-white">
        <h1 className="text-lg font-semibold text-neutral-900">SLAs</h1>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-10 h-10 rounded-md bg-emerald-100 flex items-center justify-center mb-4">
            <FileText size={20} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Service Level Agreements
          </h2>
          <p className="text-sm text-neutral-500 mt-2 max-w-lg leading-relaxed">
            SLAs are applied using rules configured within each SLA. When multiple
            rules match, the first one in the list wins — so order matters. Place
            specific conditions like VIP or after-hours at the top, and general
            rules at the bottom as a fallback.
          </p>
          <button
            type="button"
            disabled={editMode}
            onClick={() => setView("create")}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md shadow-sm mt-5 ${
              editMode
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
          >
            <Plus size={15} />
            Create SLA
          </button>
        </div>

        <section className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Active</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                SLAs that are actively running on tickets
              </p>
            </div>
            {editMode ? (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  className="text-sm text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  className="text-sm font-medium px-4 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Save
                </button>
              </div>
            ) : (
              displayActiveIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleEditOrder}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 shrink-0"
                >
                  Edit order
                </button>
              )
            )}
          </div>

          <SlaListZone
            zone="active"
            ids={displayActiveIds}
            slasById={slasById}
            editMode={editMode}
            showPriorityMarkers
            dragState={dragState}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOverZone={(z) =>
              setDragState((s) => ({ ...s, overZone: z, overIndex: null }))
            }
            onDragOverItem={(z, idx) =>
              setDragState((s) => ({ ...s, overZone: z, overIndex: idx }))
            }
            onDrop={applyDrop}
            emptyContent={
              <p className="text-sm text-neutral-500 text-center leading-relaxed">
                No active SLAs yet. Add an SLA from the pending list below, or{" "}
                <button
                  type="button"
                  disabled={editMode}
                  onClick={() => setView("create")}
                  className={`font-medium ${
                    editMode
                      ? "text-neutral-400 cursor-not-allowed"
                      : "text-emerald-600 hover:text-emerald-700"
                  }`}
                >
                  create a new one
                </button>
                .
              </p>
            }
            renderCardExtras={() => ({})}
          />
        </section>

        <section>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">Pending</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              SLAs that you&apos;ve configured that are not running on tickets
            </p>
          </div>

          <SlaListZone
            zone="pending"
            ids={displayPendingIds}
            slasById={slasById}
            editMode={editMode}
            showPriorityMarkers={false}
            dragState={dragState}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOverZone={(z) =>
              setDragState((s) => ({ ...s, overZone: z, overIndex: null }))
            }
            onDragOverItem={(z, idx) =>
              setDragState((s) => ({ ...s, overZone: z, overIndex: idx }))
            }
            onDrop={applyDrop}
            emptyContent={
              <p className="text-sm text-neutral-400 text-center">
                No pending SLAs
              </p>
            }
            renderCardExtras={cardExtras}
          />
        </section>
      </div>

      {discardOpen && (
        <DiscardDialog
          onCancel={handleDiscardCancel}
          onDiscard={handleDiscardConfirm}
        />
      )}
    </main>
  );
}

