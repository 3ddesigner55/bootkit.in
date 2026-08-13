"use client";

import {
  ImagePlus,
  RefreshCw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import type {
  ImageUploaderItem,
  ImageUploaderProps,
} from "./types";
import {
  DEFAULT_IMAGE_TYPES,
  DEFAULT_MAX_FILE_SIZE_MB,
  validateImageFile,
} from "./validation";

function createItem(file: File): ImageUploaderItem {
  return {
    id:
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${file.name}-${Date.now()}`,
    url: URL.createObjectURL(file),
    name: file.name,
    file,
    progress: 0,
    status: "ready",
  };
}

export default function ImageUploader({
  value,
  onChange,
  label = "Images",
  helperText,
  multiple = false,
  maxFiles = multiple ? 8 : 1,
  acceptedTypes = DEFAULT_IMAGE_TYPES,
  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB,
  disabled = false,
  required = false,
  className = "",
}: ImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceItemId = useRef("");
  const [items, setItems] = useState<ImageUploaderItem[]>(
    value ?? []
  );
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState("");

  useEffect(() => {
    if (value !== undefined) {
      setItems(value);
    }
  }, [value]);

  const updateItems = (nextItems: ImageUploaderItem[]) => {
    setItems(nextItems);
    onChange?.(nextItems);
  };

  const releaseObjectUrl = (item: ImageUploaderItem) => {
    if (item.file && item.url.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }
  };

  const addFiles = (files: File[]) => {
    if (disabled) return;

    const validFiles = files.filter((file) => {
      const validationError = validateImageFile(
        file,
        acceptedTypes,
        maxFileSizeMB
      );

      if (validationError) {
        setError(validationError);
        return false;
      }

      return true;
    });

    if (!validFiles.length) return;

    const nextItems = validFiles.map(createItem);

    if (!multiple) {
      items.forEach(releaseObjectUrl);
      updateItems([nextItems[0]]);
      setError("");
      return;
    }

    const availableSlots = maxFiles - items.length;

    if (availableSlots <= 0) {
      nextItems.forEach(releaseObjectUrl);
      setError(`You can add up to ${maxFiles} images.`);
      return;
    }

    const acceptedItems = nextItems.slice(0, availableSlots);
    nextItems.slice(availableSlots).forEach(releaseObjectUrl);

    if (acceptedItems.length < nextItems.length) {
      setError(`Only ${maxFiles} images can be selected.`);
    } else {
      setError("");
    }

    updateItems([...items, ...acceptedItems]);
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const removeItem = (itemId: string) => {
    const item = items.find((current) => current.id === itemId);

    if (item) releaseObjectUrl(item);

    updateItems(items.filter((current) => current.id !== itemId));
    setError("");
  };

  const openReplaceDialog = (itemId: string) => {
    replaceItemId.current = itemId;
    replaceInputRef.current?.click();
  };

  const reorderItems = (targetItemId: string) => {
    if (!multiple || !draggedItemId || draggedItemId === targetItemId) {
      return;
    }

    const sourceIndex = items.findIndex((item) => item.id === draggedItemId);
    const targetIndex = items.findIndex((item) => item.id === targetItemId);

    if (sourceIndex < 0 || targetIndex < 0) return;

    const nextItems = [...items];
    const [sourceItem] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(targetIndex, 0, sourceItem);
    updateItems(nextItems);
  };

  const replaceItem = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const validationError = validateImageFile(
      file,
      acceptedTypes,
      maxFileSizeMB
    );

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    const nextItem = createItem(file);
    const nextItems = items.map((item) => {
      if (item.id !== replaceItemId.current) return item;

      releaseObjectUrl(item);
      return nextItem;
    });

    updateItems(nextItems);
    setError("");
    event.target.value = "";
  };

  const accept = acceptedTypes.join(",");
  const canAddMore = multiple
    ? items.length < maxFiles
    : items.length === 0;

  return (
    <section className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label
          htmlFor={inputId}
          className="text-xs font-bold text-[var(--text-secondary)]"
        >
          {label}
          {required && (
            <span className="ml-1 text-[var(--danger)]">*</span>
          )}
        </label>

        {multiple && (
          <span className="text-[10px] font-bold text-[var(--text-muted)]">
            {items.length}/{maxFiles}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleFileChange}
        className="sr-only"
      />

      <input
        ref={replaceInputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={replaceItem}
        className="sr-only"
      />

      {canAddMore && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled) setDragActive(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center transition ${
            dragActive
              ? "border-[var(--primary)] bg-[var(--primary-light)]"
              : "border-[var(--border)] bg-[var(--surface-soft)]"
          } ${
            disabled
              ? "cursor-not-allowed opacity-60"
              : "hover:border-[var(--primary)] hover:bg-[var(--primary-light)]"
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--primary)] shadow-[var(--shadow-xs)]">
            <UploadCloud size={19} />
          </span>
          <p className="mt-3 text-xs font-black text-[var(--text-primary)]">
            Drag and drop or click to browse
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            JPG, PNG, WebP, or AVIF up to {maxFileSizeMB} MB
          </p>
        </div>
      )}

      {helperText && (
        <p className="mt-2 text-[10px] text-[var(--text-muted)]">
          {helperText}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-bold text-[var(--danger)]">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              draggable={multiple && !disabled}
              onDragStart={() => setDraggedItemId(item.id)}
              onDragEnd={() => setDraggedItemId("")}
              onDragOver={(event) => {
                if (multiple) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                reorderItems(item.id);
                setDraggedItemId("");
              }}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
            >
              <div
                role="img"
                aria-label={item.name}
                className="h-32 bg-[var(--surface-soft)] bg-cover bg-center"
                style={{ backgroundImage: `url("${item.url}")` }}
              />

              <div className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-[var(--text-primary)]">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {item.status === "uploaded"
                        ? "Uploaded"
                        : item.status === "error"
                          ? "Upload failed"
                          : "Ready to upload"}
                    </p>
                  </div>

                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-muted)]">
                    <ImagePlus size={14} />
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <span
                    className="block h-full rounded-full bg-[var(--primary)] transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => openReplaceDialog(item.id)}
                    className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] text-[10px] font-black text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw size={13} />
                    Replace
                  </button>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!canAddMore && !multiple && items.length > 0 && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => openReplaceDialog(items[0].id)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X size={14} />
          Choose a different image
        </button>
      )}
    </section>
  );
}
