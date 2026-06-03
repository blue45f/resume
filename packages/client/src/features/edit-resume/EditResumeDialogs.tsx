import AttachmentPanel from '@/components/AttachmentPanel';
import VersionPanel from '@/components/VersionPanel';
import AllowedViewersDialog from '@/components/AllowedViewersDialog';

interface EditResumeDialogsProps {
  id: string | undefined;
  showAttachments: boolean;
  showVersions: boolean;
  showAllowedViewers: boolean;
  onCloseAttachments: () => void;
  onCloseVersions: () => void;
  onCloseAllowedViewers: () => void;
  onRestoreVersion: () => void;
}

export default function EditResumeDialogs({
  id,
  showAttachments,
  showVersions,
  showAllowedViewers,
  onCloseAttachments,
  onCloseVersions,
  onCloseAllowedViewers,
  onRestoreVersion,
}: EditResumeDialogsProps) {
  return (
    <>
      {showAttachments && id && <AttachmentPanel resumeId={id} onClose={onCloseAttachments} />}
      {showVersions && id && (
        <VersionPanel resumeId={id} onClose={onCloseVersions} onRestore={onRestoreVersion} />
      )}
      {showAllowedViewers && id && (
        <AllowedViewersDialog resumeId={id} onClose={onCloseAllowedViewers} />
      )}
    </>
  );
}
