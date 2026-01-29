import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser as updateUserAction } from '../features/authSlice';
import toast from 'react-hot-toast';
import {
  useUpdateUser,
  useUpdateWorkspace,
  useDeleteWorkspace,
} from '../hooks/useMutations';
import { useWorkspaceContext } from '../context/workspaceContext';
import { useNavigate } from 'react-router-dom';

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const Settings = () => {
  const dispatch = useDispatch();
  const { currentWorkspace, setCurrentWorkspaceId } = useWorkspaceContext();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { mutateAsync: updateWorkspace, isPending: workspacePending } =
    useUpdateWorkspace();
  const { mutateAsync: deleteWorkspace, isPending: deletePending } =
    useDeleteWorkspace();
  const { mutateAsync: updateUser, isPending: userPending } = useUpdateUser();

  const isAdmin = useMemo(() => {
    const role = currentWorkspace?.members?.find(
      (m) => m.user.id === user?.id
    )?.role;
    return user?.role === 'ADMIN' || role === 'ADMIN';
  }, [currentWorkspace, user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: currentWorkspace?.name || '',
    slug: currentWorkspace?.slug || '',
    description: currentWorkspace?.description || '',
    image_url: currentWorkspace?.image_url || '',
  });
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    image: user?.image || '',
  });
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteName, setDeleteName] = useState('');
  const normalizedWorkspaceName = currentWorkspace?.name
    ? currentWorkspace.name.trim().toLowerCase()
    : '';
  const normalizedDeleteName = deleteName.trim().toLowerCase();

  useEffect(() => {
    setFormData({
      name: currentWorkspace?.name || '',
      slug: currentWorkspace?.slug || '',
      description: currentWorkspace?.description || '',
      image_url: currentWorkspace?.image_url || '',
    });
  }, [currentWorkspace]);

  useEffect(() => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      image: user?.image || '',
    });
  }, [user]);

  const hasChanges =
    formData.name !== (currentWorkspace?.name || '') ||
    formData.slug !== (currentWorkspace?.slug || '') ||
    formData.description !== (currentWorkspace?.description || '') ||
    formData.image_url !== (currentWorkspace?.image_url || '');

  const handleWorkspaceSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setIsSubmitting(true);
      await updateWorkspace({
        workspaceId: currentWorkspace.id,
        payload: {
          name: formData.name,
          slug: formData.slug || slugify(formData.name),
          description: formData.description || null,
          image_url: formData.image_url || null,
        },
      });
      toast.success('Workspace updated');
    } catch (error) {
      toast.error(error?.message || 'Failed to update workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      const updated = await updateUser({
        userId: user.id,
        workspaceId: currentWorkspace?.id,
        payload: {
          name: profileData.name,
          image: profileData.image || null,
        },
      });
      dispatch(updateUserAction(updated));
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;

    try {
      setIsSubmitting(true);
      await deleteWorkspace({ workspaceId: currentWorkspace.id });
      localStorage.removeItem('currentWorkspaceId');
      setCurrentWorkspaceId(null);
      toast.success('Workspace deleted');
      navigate('/');
    } catch (error) {
      toast.error(error?.message || 'Failed to delete workspace');
    } finally {
      setIsSubmitting(false);
      setIsDeleteOpen(false);
      setDeleteName('');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Workspace Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your profile and workspace preferences.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Profile
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Update your personal details.
        </p>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) =>
                setProfileData({ ...profileData, name: e.target.value })
              }
              className="w-full px-3 py-2 rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={profileData.email}
              className="w-full px-3 py-2 rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Avatar URL</label>
            <input
              type="url"
              value={profileData.image}
              onChange={(e) =>
                setProfileData({ ...profileData, image: e.target.value })
              }
              className="w-full px-3 py-2 rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || userPending}
              className="px-5 py-2 rounded text-sm bg-linear-to-br from-blue-500 to-blue-600 text-white disabled:opacity-50 hover:opacity-90 transition"
            >
              {isSubmitting || userPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {isAdmin && currentWorkspace && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Workspace
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Manage workspace details and branding.
            </p>

            <form onSubmit={handleWorkspaceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                      slug: prev.slug ? prev.slug : slugify(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                  disabled={!isAdmin}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Workspace Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: slugify(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                  disabled={!isAdmin}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm h-24"
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Logo URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                  disabled={!isAdmin}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Workspace ID: {currentWorkspace.id}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || workspacePending || !hasChanges}
                  className="px-5 py-2 rounded text-sm bg-linear-to-br from-blue-500 to-blue-600 text-white disabled:opacity-50 hover:opacity-90 transition"
                >
                  {isSubmitting || workspacePending
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 p-6">
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
              Danger Zone
            </h2>
            <p className="text-sm text-red-700/80 dark:text-red-300/80 mb-4">
              Deleting a workspace removes all projects, tasks, clients, and
              members.
            </p>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isSubmitting || deletePending}
              className="px-4 py-2 rounded text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isSubmitting || deletePending
                ? 'Deleting...'
                : 'Delete Workspace'}
            </button>
          </div>
        </div>
      )}

      {isDeleteOpen && currentWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Delete workspace
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              This will permanently delete{' '}
              <span className="font-bold text-zinc-900 dark:text-white">
                {currentWorkspace.name}
              </span>{' '}
              and all its data. This action cannot be undone.
            </p>
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Type{' '}
                <span className="font-bold text-zinc-900 dark:text-white">
                  {currentWorkspace.name}
                </span>{' '}
                to confirm
              </label>
              <input
                type="text"
                value={deleteName}
                onChange={(e) => setDeleteName(e.target.value)}
                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-200"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {normalizedDeleteName &&
                normalizedDeleteName === normalizedWorkspaceName
                  ? 'Name matches.'
                  : 'Enter the exact workspace name to enable deletion.'}
              </p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteName('');
                }}
                className="px-4 py-2 rounded text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteWorkspace}
                disabled={
                  isSubmitting ||
                  deletePending ||
                  normalizedDeleteName !== normalizedWorkspaceName
                }
                className="px-4 py-2 rounded text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isSubmitting || deletePending
                  ? 'Deleting...'
                  : 'Delete workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
