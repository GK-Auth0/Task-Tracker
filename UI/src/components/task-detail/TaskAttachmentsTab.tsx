import { useState } from "react";

interface TaskAttachment {
  id: string;
  original_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploader?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface TaskAttachmentsTabProps {
  attachments?: TaskAttachment[];
  onAttachmentUpload: (file: File) => Promise<void>;
}

export default function TaskAttachmentsTab({
  attachments,
  onAttachmentUpload,
}: TaskAttachmentsTabProps) {
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAttachmentUploading(true);
      setAttachmentError("");
      await onAttachmentUpload(file);
    } catch (error: any) {
      setAttachmentError(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to upload attachment."
      );
    } finally {
      setAttachmentUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h3 className="text-base font-semibold text-slate-900">Attachments</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm cursor-pointer">
            <span className="material-symbols-outlined text-lg">upload</span>
            {attachmentUploading ? "Uploading..." : "Upload File"}
            <input
              type="file"
              className="hidden"
              onChange={handleAttachmentUpload}
              disabled={attachmentUploading}
            />
          </label>
        </div>
      </div>
      
      {attachmentError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {attachmentError}
        </div>
      )}

      {attachments && attachments.length > 0 ? (
        <div className="space-y-3">
          {attachments.map(attachment => (
            <a
              key={attachment.id}
              href={attachment.file_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="material-symbols-outlined text-slate-500">attach_file</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {attachment.original_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(attachment.file_size / 1024).toFixed(1)} KB
                    {attachment.uploader ? ` • ${attachment.uploader.full_name}` : ""}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400">open_in_new</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
            attach_file
          </span>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No Attachments Yet</h3>
          <p className="text-slate-500 mb-4">Upload files related to this task.</p>
          <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            {attachmentUploading ? "Uploading..." : "Upload First File"}
            <input
              type="file"
              className="hidden"
              onChange={handleAttachmentUpload}
              disabled={attachmentUploading}
            />
          </label>
        </div>
      )}
    </div>
  );
}