import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDebounce } from "../hooks/useDebounce";

import {
  Search,
  Grid,
  List,
  Plus,
  Folder,
  File,
  Image,
  FileText,
  Download,
  Share2,
  Star,
  HardDrive,
  FolderPlus,
  RefreshCw,
  Upload,
  Mail,
  Link,
  Copy,
  History,
  RotateCcw,
  Trash2,
  Move,
} from "lucide-react";
import {
  listFiles,
  uploadFile,
  softDeleteFile,
  getDownloadUrl,
  createFolder,
  updateFile,
  shareFile,
  createPublicLink,
  listVersions,
  restoreVersion,
  type BackendFile,
} from "../services/files";
import { getPlans, createCheckout, type Plan } from "../services/billing";

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
  modifiedTimestamp: number;
  createdTimestamp: number;
  shared: boolean;
  starred: boolean;
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

const Drive = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, logout } = useAuth();

  // Capture token from Google OAuth redirect (e.g., /drive?token=...)
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
  const [sortBy, setSortBy] = useState<"name" | "size" | "created_at" | "updated_at">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Use debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: "My Drive" }]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    progress: number;
  } | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<UiFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    file: UiFile;
  } | null>(null);
  // Lazy preview modal to improve initial page load
  const LazyFilePreview = React.useMemo(() => React.lazy(() => import('../components/LazyFilePreview')), []);
  const [shareModal, setShareModal] = useState<{ file: UiFile } | null>(null);
  const [shareType, setShareType] = useState<"email" | "public">("email");
  const [shareForm, setShareForm] = useState({
    email: "",
    permissions: "view" as "view" | "edit",
  });
  const [publicLinkForm, setPublicLinkForm] = useState({
    expiresAt: "",
    generatedLink: "",
  });
  const [versionsModal, setVersionsModal] = useState<{ file: UiFile } | null>(null);
  const [fileVersions, setFileVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [moveModal, setMoveModal] = useState<{ file: UiFile } | null>(null);
  const [moveDestination, setMoveDestination] = useState<string | null>(null);
  const [currentFolders, setCurrentFolders] = useState<UiFile[]>([]);
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);


  const [plans, setPlans] = useState<Plan[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);






  const handleCheckout = async (planId: string) => {
    try {
      const url = await createCheckout(planId);
      window.location.href = url;
    } catch (e: any) {
      showNotification(e.message || "Checkout failed", "error");
    }
  };

  const currentFolderId = useMemo(
    () => breadcrumbs[breadcrumbs.length - 1]?.id ?? null,
    [breadcrumbs]
  );









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

  // Fetch files based on section
  const refreshFiles = async () => {
    try {
      setLoading(true);

      const data: BackendFile[] = await listFiles({
        deleted: false,
        parentId: currentFolderId,
        sortBy,
        sortOrder,
      });
      const mapped: UiFile[] = data.map((f) => ({
        id: String(f.id),
        name: f.name || f.original_name || "Untitled",
        type: f.is_folder ? "folder" : mapMimeToType(f.mime_type || f.type),
        sizeBytes: f.size ?? 0,
        modified: new Date(
          f.updated_at || f.created_at || Date.now()
        ).toLocaleString(),
        modifiedTimestamp: new Date(f.updated_at || f.created_at || Date.now()).getTime(),
        createdTimestamp: new Date(f.created_at || Date.now()).getTime(),
        shared: false,
        starred: !!f.is_starred,
      }));
      setFiles(mapped);
    } catch (error) {
      console.error("Error loading files:", error);
      showNotification("Failed to load files", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentFolders = async () => {
    try {
      const data: BackendFile[] = await listFiles({
        deleted: false,
        parentId: currentFolderId,
      });
      const folders: UiFile[] = data
        .filter((f) => f.is_folder)
        .map((f) => ({
          id: String(f.id),
          name: f.name || f.original_name || "Untitled",
          type: "folder",
          sizeBytes: f.size ?? 0,
          modified: new Date(
            f.updated_at || f.created_at || Date.now()
          ).toLocaleString(),
          modifiedTimestamp: new Date(f.updated_at || f.created_at || Date.now()).getTime(),
          createdTimestamp: new Date(f.created_at || Date.now()).getTime(),
          shared: false,
          starred: !!f.is_starred,
        }));
      setCurrentFolders(folders);
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  };

  // Load initial files and quota
  useEffect(() => {
    refreshFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  // Search effect
  useEffect(() => {
    if (!debouncedSearchTerm) {
      refreshFiles();
      return;
    }
    const searchFiles = async () => {
      try {
        setLoading(true);
        const data: BackendFile[] = await listFiles({
          deleted: false,
          parentId: currentFolderId,
          search: debouncedSearchTerm,
          sortBy,
          sortOrder,
        });
        const mapped: UiFile[] = data.map((f) => ({
          id: String(f.id),
          name: f.name || f.original_name || "Untitled",
          type: f.is_folder ? "folder" : mapMimeToType(f.mime_type || f.type),
          sizeBytes: f.size ?? 0,
          modified: new Date(
            f.updated_at || f.created_at || Date.now()
          ).toLocaleString(),
          modifiedTimestamp: new Date(f.updated_at || f.created_at || Date.now()).getTime(),
          createdTimestamp: new Date(f.created_at || Date.now()).getTime(),
          shared: false,
          starred: !!f.is_starred,
        }));
        setFiles(mapped);
      } catch (error) {
        console.error("Error searching files:", error);
        showNotification("Failed to search files", "error");
      } finally {
        setLoading(false);
      }
    };
    searchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);


  // Load plans for upgrade modal
  useEffect(() => {
    if (!showUpgrade) return;
    const loadPlans = async () => {
      try {
        const plansData = await getPlans();
        setPlans(plansData);
      } catch (e) {
        console.error("Failed to load plans:", e);
      }
    };
    loadPlans();
  }, [showUpgrade]);

  const handleFileUpload = async (selectedFile: File) => {
    try {
      setUploadProgress({ fileName: selectedFile.name, progress: 0 });
      await uploadFile(selectedFile, currentFolderId);
      setUploadProgress(null);
      await refreshFiles();
      showNotification("File uploaded successfully", "success");
    } catch (e: any) {
      setUploadProgress(null);
      showNotification(e.message || "Upload failed", "error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach((file) => handleFileUpload(file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach((file) => handleFileUpload(file));
    e.target.value = "";
  };

  const handleFolderClick = (file: UiFile) => {
    if (file.type === "folder") {
      setBreadcrumbs([...breadcrumbs, { id: file.id, name: file.name }]);
    } else {
      // Handle file preview/download
      handleFileAction(file, "preview");
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

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
        case "star":
          await updateFile(file.id, { starred: !file.starred });
          await refreshFiles();
          break;
        case "delete":
          await softDeleteFile(file.id);
          await refreshFiles();
          showNotification("File moved to trash", "success");
          break;
        case "share":
          setShareModal({ file });
          setShareType("email"); // Default to email sharing
          break;
        case "versions":
          setVersionsModal({ file });
          await loadFileVersions(file.id);
          break;
        case "move":
          setMoveModal({ file });
          await loadCurrentFolders();
          setMoveDestination(null);
          break;
      }
    } catch (e: any) {
      showNotification(e.message || "Action failed", "error");
    }
  };

  const handleShare = async () => {
    if (!shareModal) return;
    try {
      if (shareType === "email") {
        await shareFile(shareModal.file.id, shareForm.email, shareForm.permissions);
        setShareModal(null);
        setShareForm({ email: "", permissions: "view" });
        showNotification("File shared successfully", "success");
      } else {
        await handleCreatePublicLink();
      }
    } catch (e: any) {
      showNotification(e.message || "Share failed", "error");
    }
  };

  const handleMove = async () => {
    if (!moveModal) return;
    try {
      await updateFile(moveModal.file.id, { parentId: moveDestination });
      setMoveModal(null);
      await refreshFiles();
      showNotification("File moved successfully", "success");
    } catch (e: any) {
      showNotification(e.message || "Move failed", "error");
    }
  };

  const handleCreatePublicLink = async () => {
    if (!shareModal) return;
    try {
      const expiresAt = publicLinkForm.expiresAt ? new Date(publicLinkForm.expiresAt).toISOString() : undefined;
      const { token } = await createPublicLink(shareModal.file.id, expiresAt);
      const apiBaseUrl = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:4000/api';
      const linkUrl = `${apiBaseUrl.replace(/\/$/, '')}/shares/public/${token}`;
      setPublicLinkForm({ ...publicLinkForm, generatedLink: linkUrl });
      showNotification("Public link created successfully", "success");
    } catch (e: any) {
      showNotification(e.message || "Failed to create public link", "error");
    }
  };

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLinkForm.generatedLink);
      showNotification("Link copied to clipboard", "success");
    } catch (e) {
      showNotification("Failed to copy link", "error");
    }
  };

  const resetShareModal = () => {
    setShareType("email");
    setShareForm({ email: "", permissions: "view" });
    setPublicLinkForm({ expiresAt: "", generatedLink: "" });
    setShareModal(null);
  };

  const loadFileVersions = async (fileId: string) => {
    try {
      setLoadingVersions(true);
      const versions = await listVersions(fileId);
      setFileVersions(versions);
    } catch (e: any) {
      showNotification(e.message || "Failed to load versions", "error");
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (fileId: string, versionNumber: number) => {
    try {
      await restoreVersion(fileId, versionNumber);
      await refreshFiles();
      setVersionsModal(null);
      showNotification("File restored to selected version", "success");
    } catch (e: any) {
      showNotification(e.message || "Failed to restore version", "error");
    }
  };

  const handleCreateFolder = async () => {
    try {
      const name = prompt("Enter folder name:");
      if (name && name.trim()) {
        await createFolder(name.trim(), currentFolderId);
        await refreshFiles();
        showNotification("Folder created", "success");
      }
    } catch (e: any) {
      showNotification(e.message || "Failed to create folder", "error");
    }
  };

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      // Folders first
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;

      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "updated_at":
          cmp = a.modifiedTimestamp - b.modifiedTimestamp;
          break;
        case "created_at":
          cmp = a.createdTimestamp - b.createdTimestamp;
          break;
        case "size":
          cmp = a.sizeBytes - b.sizeBytes;
          break;
        default:
          return 0;
      }

      return sortOrder === "desc" ? -cmp : cmp;
    });
  }, [files, sortBy, sortOrder]);

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
                        onClick={() => navigate("/profile")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => setShowUpgrade(true)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Upgrade Plan
                      </button>
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
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 mb-6">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id || "root"}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`text-sm ${
                  index === breadcrumbs.length - 1
                    ? "text-gray-900 font-medium"
                    : "text-blue-600 hover:text-blue-800"
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="updated_at">Modified</option>
              <option value="size">Size</option>
              <option value="created_at">Created</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNewMenu(!showNewMenu)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </button>

              {showNewMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={handleCreateFolder}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FolderPlus className="w-4 h-4 inline mr-2" />
                      New Folder
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      Upload File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* File Grid/List */}
        <div
          className={`min-h-[400px] border-2 border-dashed rounded-lg p-8 text-center ${
            isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : sortedFiles.length === 0 ? (
            <div className="text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No files found</p>
              {searchTerm && (
                <p className="text-sm mt-2">Try adjusting your search terms</p>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sortedFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleFolderClick(file)}
                  onMouseEnter={() => setHoveredFile(file.id)}
                  onMouseLeave={() => setHoveredFile(null)}
                  className="relative group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center">
                    {getFileIcon(file.type)}
                    <p className="mt-2 text-sm font-medium text-gray-900 truncate w-full">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.type === "folder" ? "" : formatSize(file.sizeBytes)}
                    </p>
                  </div>
                  {hoveredFile === file.id && (
                    <div className="absolute top-1 right-1 flex space-x-1 bg-white border rounded p-1 shadow opacity-90">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction(file, "star");
                        }}
                        className={`p-1 rounded ${
                          file.starred ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"
                        }`}
                        title="Star"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction(file, "download");
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction(file, "share");
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Share"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                      {file.type !== "folder" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileAction(file, "versions");
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Versions"
                        >
                          <History className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction(file, "move");
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Move"
                      >
                        <Move className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction(file, "delete");
                        }}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFiles.map((file) => (
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileAction(file, "star");
                      }}
                      className={`p-1 rounded ${
                        file.starred ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"
                      }`}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileAction(file, "download");
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileAction(file, "share");
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {file.type !== "folder" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction(file, "versions");
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="View versions"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileAction(file, "move");
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Move"
                    >
                      <Move className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileAction(file, "delete");
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <Upload className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Uploading {uploadProgress.fileName}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  ></div>
                </div>
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

        {/* Lazy File Preview Modal */}
        {previewFile && (
          <React.Suspense fallback={<div>Loading preview...</div>}>
            <LazyFilePreview
              file={previewFile.file}
              onClose={() => setPreviewFile(null)}
            />
          </React.Suspense>
        )}

        {/* Share Modal */}
        {shareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Share "{shareModal.file.name}"
              </h3>

              {/* Share Type Tabs */}
              <div className="flex mb-4 border-b">
                <button
                  onClick={() => setShareType("email")}
                  className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
                    shareType === "email"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </button>
                <button
                  onClick={() => setShareType("public")}
                  className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
                    shareType === "public"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Public Link
                </button>
              </div>

              <div className="space-y-4">
                {shareType === "email" ? (
                  <>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={shareForm.email}
                      onChange={(e) => setShareForm({ ...shareForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={shareForm.permissions}
                      onChange={(e) => setShareForm({ ...shareForm, permissions: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="view">View only</option>
                      <option value="edit">Can edit</option>
                    </select>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration (optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={publicLinkForm.expiresAt}
                        onChange={(e) => setPublicLinkForm({ ...publicLinkForm, expiresAt: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {publicLinkForm.generatedLink && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Public Link
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            value={publicLinkForm.generatedLink}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                          />
                          <button
                            onClick={handleCopyPublicLink}
                            className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={resetShareModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  className={`px-4 py-2 text-white rounded-lg ${
                    shareType === "email"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : publicLinkForm.generatedLink
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  disabled={shareType === "email" && !shareForm.email}
                >
                  {shareType === "email"
                    ? "Share"
                    : publicLinkForm.generatedLink
                    ? "Create New Link"
                    : "Create Link"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Move Modal */}
        {moveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Move "{moveModal.file.name}"
              </h3>
              <div className="space-y-4">
                <select
                  value={moveDestination || ""}
                  onChange={(e) => setMoveDestination(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select destination</option>
                  <option value={null}>My Drive</option>
                  {currentFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setMoveModal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMove}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  disabled={!moveDestination && moveDestination !== null}
                >
                  Move
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Versions Modal */}
        {versionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Version History - "{versionsModal.file.name}"
              </h3>

              <div className="overflow-y-auto max-h-96">
                {loadingVersions ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading versions...</span>
                  </div>
                ) : fileVersions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No versions found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fileVersions.map((version: any) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                v{version.version_number}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Version {version.version_number}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatSize(version.size)} • {new Date(version.created_at).toLocaleString()}
                              </p>
                              {version.change_type && (
                                <p className="text-xs text-blue-600 capitalize">
                                  {version.change_type}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRestoreVersion(versionsModal.file.id, version.version_number)}
                          className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Restore</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setVersionsModal(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgrade && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-medium text-gray-900 mb-4">Upgrade Your Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900">{plan.name}</h4>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      ${plan.priceMonthly}/month
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-600">
                      <li>Storage: {formatSize(plan.storageLimitBytes)}</li>
                      <li>Files: {plan.fileCountLimit}</li>
                    </ul>
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                      Choose Plan
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowUpgrade(false)}
                className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Drive;