import React, { useEffect, useState } from "react";
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
  Download,
  Share2,
  RefreshCw,
  HardDrive,
} from "lucide-react";
import {
  listSharedWithMe,
  getDownloadUrl,
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
  sharedBy?: string;
  permissions?: string;
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

const Shared = () => {
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
  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<UiFile[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    file: UiFile;
  } | null>(null);

  // Lazy preview modal to improve initial page load
  const LazyFilePreview = React.useMemo(() => React.lazy(() => import('../components/LazyFilePreview')), []);

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
        return <Folder className="w-5 h-5 text-blue-500" />;
      case "image":
        return <Image className="w-5 h-5 text-green-500" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "document":
        return <FileText className="w-5 h-5 text-blue-600" />;
      case "spreadsheet":
        return <FileText className="w-5 h-5 text-green-600" />;
      case "presentation":
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  // Fetch shared files
  const refreshFiles = async () => {
    try {
      setLoading(true);
      const { shares } = await listSharedWithMe();
      const mapped: UiFile[] = shares.map((record) => ({
        id: String(record.files!.id),
        name: record.files!.name || (record.files as any)?.original_name || "Untitled",
        type: (record.files as any)?.is_folder ? "folder" : mapMimeToType(record.files!.mime_type || record.files!.type),
        sizeBytes: record.files!.size ?? 0,
        modified: new Date(
          (record.files as any)?.updated_at || record.files!.created_at || Date.now()
        ).toLocaleString(),
        shared: true,
        starred: !!((record.files as any)?.is_starred),
        sharedBy: record.profiles?.email || "Unknown",
        permissions: record.permissions,
      }));
      setFiles(mapped);
    } catch (error) {
      console.error("Error loading shared files:", error);
      showNotification("Failed to load shared files", "error");
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
        case "download":
          const downloadUrl = await getDownloadUrl(file.id);
          window.open(downloadUrl, "_blank");
          break;
        case "preview":
          setPreviewFile({ file });
          break;
      }
    } catch (e: any) {
      showNotification(e.message || "Action failed", "error");
    }
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
                onClick={() => navigate("/starred")}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Starred
              </button>
              <button
                onClick={() => navigate("/trash")}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Trash
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
          <h2 className="text-2xl font-bold text-gray-900">Shared with Me</h2>
          <p className="text-gray-600">Files and folders shared with you by others</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search shared files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
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
              <span className="ml-2 text-gray-600">Loading shared files...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No shared files</p>
              <p className="text-gray-400 text-sm mt-2">
                Files shared with you will appear here
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleFileAction(file, "preview")}
                  className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center">
                    {getFileIcon(file.type)}
                    <p className="mt-2 text-sm font-medium text-gray-900 truncate w-full">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.type === "folder" ? "" : formatSize(file.sizeBytes)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Shared by {file.sharedBy}
                    </p>
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
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatSize(file.sizeBytes)} • {file.modified}
                      </p>
                      <p className="text-xs text-blue-600">
                        Shared by {file.sharedBy} • {file.permissions} access
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileAction(file, "download");
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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

        {/* Lazy File Preview Modal */}
        {previewFile && (
          <React.Suspense fallback={<div>Loading preview...</div>}>
            <LazyFilePreview
              file={previewFile.file}
              onClose={() => setPreviewFile(null)}
            />
          </React.Suspense>
        )}
      </main>
    </div>
  );
};

export default Shared;