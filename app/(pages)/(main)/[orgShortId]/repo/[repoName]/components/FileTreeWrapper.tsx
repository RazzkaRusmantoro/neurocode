'use client';

import { useState, useEffect } from 'react';
import FileTree from './FileTree';

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  sha: string;
  url: string;
  downloadUrl: string | null;
  gitUrl: string;
  content?: string;
  language?: string;
}

interface FileTreeWrapperProps {
  repoFullName: string;
  orgShortId: string;
  repoUrlName: string;
  selectedBranch: string;
  currentPath?: string[];
  onPathChange?: (path: string[]) => void;
  contentsCache: Map<string, FileTreeItem[]>;
  setContentsCache: React.Dispatch<React.SetStateAction<Map<string, FileTreeItem[]>>>;
  fileCache: Map<string, FileTreeItem>;
  setFileCache: React.Dispatch<React.SetStateAction<Map<string, FileTreeItem>>>;
  onFileSelect?: (file: FileTreeItem) => void;
}

export default function FileTreeWrapper({ 
  repoFullName, 
  orgShortId, 
  repoUrlName, 
  selectedBranch,
  currentPath = [], 
  onPathChange, 
  contentsCache,
  setContentsCache,
  fileCache,
  setFileCache,
  onFileSelect 
}: FileTreeWrapperProps) {
  const [currentContents, setCurrentContents] = useState<FileTreeItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch repository contents based on current path with caching
  useEffect(() => {
    let isMounted = true;
    
    const fetchContents = async () => {
      const path = currentPath.length > 0 ? currentPath.join('/') : '';
      const cacheKey = `${selectedBranch}:${path}`;
      
      // Check cache first
      const cached = contentsCache.get(cacheKey);
      if (cached) {
        if (isMounted) {
          setCurrentContents(cached);
          setIsInitialLoading(false);
        }
        return;
      }
      
      setIsInitialLoading(true);
      try {
        const url = `/api/github/repositories/${encodeURIComponent(repoFullName)}/contents?orgShortId=${encodeURIComponent(orgShortId)}&repoUrlName=${encodeURIComponent(repoUrlName)}&ref=${encodeURIComponent(selectedBranch)}${path ? `&path=${encodeURIComponent(path)}` : ''}`;
        
        const response = await fetch(url);

        if (response.ok && isMounted) {
          const data = await response.json();
          const contents = data.contents.map((item: any) => ({
            name: item.name,
            path: item.path,
            type: item.type,
            size: item.size || 0,
            sha: item.sha,
            url: item.url,
            downloadUrl: item.downloadUrl || null,
            gitUrl: item.gitUrl,
          }));
          
          // Store in cache
          setContentsCache(prev => new Map(prev).set(cacheKey, contents));
          
          if (isMounted) {
            setCurrentContents(contents);
          }
        } else if (isMounted) {
          console.error('Failed to fetch repository contents:', response.status);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching repository contents:', error);
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    };

    if (repoFullName && selectedBranch) {
      fetchContents();
    }
    
    return () => {
      isMounted = false;
    };
  }, [repoFullName, orgShortId, repoUrlName, selectedBranch, currentPath.join('/')]);

  return (
    <FileTree 
      contents={currentContents} 
      repoFullName={repoFullName}
      orgShortId={orgShortId}
      repoUrlName={repoUrlName}
      selectedBranch={selectedBranch}
      onContentsChange={setCurrentContents}
      onPathChange={onPathChange}
      contentsCache={contentsCache}
      setContentsCache={setContentsCache}
      fileCache={fileCache}
      setFileCache={setFileCache}
      onFileSelect={onFileSelect}
      isLoading={isInitialLoading}
    />
  );
}

