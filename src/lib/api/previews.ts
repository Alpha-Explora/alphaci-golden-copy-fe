import { request } from './request';

export type PreviewLifecycleStatus =
  | 'requested'
  | 'building'
  | 'deploying'
  | 'healthy'
  | 'unhealthy'
  | 'expired'
  | 'cleanup_required'
  | 'deleting'
  | 'deleted'
  | 'failed';

export type PreviewCleanupStatus = 'none' | 'pending' | 'cleanup_required' | 'deleting' | 'deleted' | 'failed';

export interface PreviewDeployment {
  id: string;
  previewUrl: string;
  repositoryFullName: string;
  pullRequestNumber: number;
  sourceBranch: string;
  commitSha: string;
  lifecycleStatus: PreviewLifecycleStatus;
  cleanupStatus: PreviewCleanupStatus;
  expiresAt: string;
  safeMessage: string | null;
}

export function listPreviewDeployments(projectId: string): Promise<PreviewDeployment[]> {
  return request<PreviewDeployment[]>(`/previews/projects/${projectId}`, {
    method: 'GET',
  });
}

export function requestPreviewCleanup(previewId: string): Promise<PreviewDeployment> {
  return request<PreviewDeployment>(`/previews/${previewId}/cleanup`, {
    method: 'POST',
  });
}
