import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDebounce } from "../hooks/useDebounce";

import {
  Search,
  Grid,
  List,
  Folder,
  File,
  Image,
  FileText,
  Trash2,
  HardDrive,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import {
  listFiles,
  restoreFile,
  permanentDeleteFile,
  type BackendFile,
} from "../services/files";

type UiFile = {
  id: string;
  name: string;
  type:
    | "folder"
    | "image"
    | "pdf"
    | "document"
    | "spreadsheet"
    | "presentation"
    | "file";
  sizeBytes: number;
  modified: string;
  shared: boolean;
  starred: boolean;
  deletedAt?: string;
};

function formatSize(bytes: number): string {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function mapMimeToType(mime?: string | null): UiFile["type"] {
  if (!mime) return "file";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("presentation") || mime.includes("powerpoint"))
    return "presentation";
  if (mime.includes("spreadsheet") || mime.includes("excel"))
    return "spreadsheet";
  if (
    mime.includes("msword") ||
    mime.includes("document") ||
    mime.includes("wordprocessingml")
  )
    return "document";
  return "file";
}

const Trash = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, logout } = useAuth();

  // Capture token from Google OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth", "true");
      navigate("/drive", { replace: true });
    }
  }, [location.search, navigate]);

  // Derive display fields from authenticated user
  const displayName =
    authUser?.firstName || authUser?.lastName
      ? [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ")
      : authUser?.email?.split("@")[0] || "User";
  const displayEmail = authUser?.email || "";
  const initial = (displayEmail || displayName || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<UiFile[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);

  // Use debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const showNotification = (
    message: string,
    type: "info" | "success" | "error" = "info"
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getFileIcon = (type: UiFile["type"]) => {
    switch (type) {
      case "folder":
        return <Folder className="w-5 h-5 text-blue-500 opacity-50" />;
      case "image":
        return <Image className="w-5 h-5 text-green-500 opacity-50" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500 opacity-50" />;
      case "document":
        return <FileText className="w-5 h-5 text-blue-600 opacity-50" />;
      case "spreadsheet":
        return <FileText className="w-5 h-5 text-green-600 opacity-50" />;
      case "presentation":
        return <FileText className="w-5 h-5 text-orange-500 opacity-50" />;
      default:
        return <File className="w-5 h-5 text-gray-500 opacity-50" />;
    }
  };

  // Fetch trash files
  const refreshFiles = async () => {
    try {
      setLoading(true);
      const data: BackendFile[] = await listFiles({ deleted: true });
      const mapped: UiFile[] = data.map((f) => ({
        id: String(f.id),
        name: f.name || f.original_name || "Untitled",
        type: f.is_folder ? "folder" : mapMimeToType(f.mime_type || f.type),
        sizeBytes: f.size ?? 0,
        modified: new Date(
          f.updated_at || f.created_at || Date.now()
        ).toLocaleString(),
        shared: false,
        starred: !!f.is_starred,
        deletedAt: f.deleted_at ? new Date(f.deleted_at).toLocaleString() : undefined,
      }));
      setFiles(mapped);
    } catch (error) {
      console.error("Error loading trash files:", error);
      showNotification("Failed to load trash", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load initial files
  useEffect(() => {
    refreshFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search effect
  useEffect(() => {
    if (!debouncedSearchTerm) {
      refreshFiles();
      return;
    }
    const filteredFiles = files.filter(file =>
      file.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
    setFiles(filteredFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  const handleFileAction = async (file: UiFile, action: string) => {
    try {
      switch (action) {
        case "restore":
          await restoreFile(file.id);
          await refreshFiles();
          showNotification("File restored", "success");
          break;
        case "delete":
          await permanentDeleteFile(file.id);
          await refreshFiles();
          showNotification("File permanently deleted", "success");
          break;
      }
    } catch (e: any) {
      showNotification(e.message || "Action failed", "error");
    }
  };

  const handleBulkRestore = async () => {
    try {
      await Promise.all(selected.map(id => restoreFile(id)));
      setSelected([]);
      await refreshFiles();
      showNotification(`${selected.length} files restored`, "success");
    } catch (e: any) {
      showNotification(e.message || "Bulk restore failed", "error");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selected.map(id => permanentDeleteFile(id)));
      setSelected([]);
      await refreshFiles();
      showNotification(`${selected.length} files permanently deleted`, "success");
    } catch (e: any) {
      showNotification(e.message || "Bulk delete failed", "error");
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await Promise.all(files.map(file => permanentDeleteFile(file.id)));
      await refreshFiles();
      setShowEmptyTrashConfirm(false);
      showNotification("Trash emptied", "success");
    } catch (e: any) {
      showNotification(e.message || "Failed to empty trash", "error");
    }
  };

  const toggleSelection = (fileId: string) => {
    setSelected(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAll = () => {
    setSelected(selected.length === files.length ? [] : files.map(f => f.id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center mr-3">
                <HardDrive className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">DriveCloud</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/drive")}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                My Drive
              </button>
              <button
                onClick={() => navigate("/shared")}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Shared
              </button>
              <button
                onClick={() => navigate("/starred")}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Starred
              </button>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {initial}
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500">{displayEmail}</p>
                      </div>
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Trash2 className="w-6 h-6 text-gray-500 mr-2" />
            Trash
          </h2>
          <p className="text-gray-600">Files are automatically deleted after 30 days</p>
        </div>

        {/* Bulk Actions */}
        {selected.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selected.length} item{selected.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkRestore}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  <RotateCcw className="w-4 h-4 inline mr-1" />
                  Restore
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search trash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {files.length > 0 && (
              <>
                <button
                  onClick={selectAll}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg text-sm"
                >
                  {selected.length === files.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={() => setShowEmptyTrashConfirm(true)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Empty Trash
                </button>
              </>
            )}
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* File Grid/List */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading trash...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">Trash is empty</p>
              <p className="text-gray-400 text-sm mt-2">
                Deleted files will appear here
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(file.id)}
                      onChange={() => toggleSelection(file.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    {getFileIcon(file.type)}
                    <p className="mt-2 text-sm font-medium text-gray-900 truncate w-full">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.type === "folder" ? "" : formatSize(file.sizeBytes)}
                    </p>
                    <div className="flex space-x-1 mt-2">
                      <button
                        onClick={() => handleFileAction(file, "restore")}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" />
                        Restore
                      </button>
                      <button
                        onClick={() => handleFileAction(file, "delete")}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        <Trash2 className="w-3 h-3 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(file.id)}
                      onChange={() => toggleSelection(file.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatSize(file.sizeBytes)} • Deleted {file.deletedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFileAction(file, "restore")}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      <RotateCcw className="w-4 h-4 mr-1 inline" />
                      Restore
                    </button>
                    <button
                      onClick={() => handleFileAction(file, "delete")}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4 mr-1 inline" />
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty Trash Confirmation Modal */}
        {showEmptyTrashConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Empty Trash?
              </h3>
              <p className="text-gray-600 mb-6">
                This will permanently delete all files in trash. This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEmptyTrashConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmptyTrash}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Empty Trash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div
            className={`fixed bottom-4 left-4 px-4 py-2 rounded-lg text-white ${
              notification.type === "success"
                ? "bg-green-500"
                : notification.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
          >
            {notification.message}
          </div>
        )}
      </main>
    </div>
  );
};

export default Trash;