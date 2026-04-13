interface ProjectFile {
  id: string;
  original_name: string;
  file_size: number;
  created_at: string;
  file_url: string;
}

interface ProjectFilesTabProps {
  files: ProjectFile[];
  filesLoading: boolean;
  tabError: string;
  uploading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProjectFilesTab({
  files,
  filesLoading,
  tabError,
  uploading,
  onFileUpload,
}: ProjectFilesTabProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-black text-slate-900">Project Files</h3>
        <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
          <span className="material-symbols-outlined text-lg">upload</span>
          {uploading ? "Uploading..." : "Upload File"}
          <input
            type="file"
            className="hidden"
            onChange={onFileUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {filesLoading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Loading files...
        </div>
      ) : tabError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {tabError}
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No files uploaded yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
            <div key={file.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600">description</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {file.original_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {(file.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {new Date(file.created_at).toLocaleDateString()}
                </p>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
