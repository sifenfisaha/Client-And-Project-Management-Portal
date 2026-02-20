import { useEffect, useMemo, useState } from 'react';
import { LinkIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useWorkspaceContext } from '../context/workspaceContext';
import { useClientIntakes } from '../hooks/useQueries';

const getLeadName = (payload = {}) =>
  payload.name ||
  payload.contact_name ||
  payload.clientName ||
  payload.company_name ||
  payload.company ||
  'Unknown';

const getBusinessModel = (payload = {}) => {
  const value = payload.business_model || payload.service_type || '';
  if (!value) return 'N/A';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const Leads = () => {
  const user = useSelector((state) => state.auth.user);
  const { currentWorkspace } = useWorkspaceContext();
  const memberRole = currentWorkspace?.members?.find(
    (member) => member.user.id === user?.id
  )?.role;
  const isAdmin = user?.role === 'ADMIN' || memberRole === 'ADMIN';

  const { data: intakes = [] } = useClientIntakes(currentWorkspace?.id);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const leads = useMemo(() => {
    return intakes
      .filter((intake) => intake.status === 'SUBMITTED')
      .map((intake) => {
        const payload = intake.payload || {};
        return {
          id: intake.id,
          payload,
          name: getLeadName(payload),
          email: payload.email || 'N/A',
          businessModel: getBusinessModel(payload),
          biggestBottleneck:
            payload.biggest_bottleneck ||
            payload.business_details?.problem_solving ||
            'N/A',
          submittedAt: intake.submittedAt,
        };
      })
      .sort((a, b) => {
        const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [intakes]);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) || null;

  useEffect(() => {
    if (!selectedLeadId) return;
    const leadStillExists = leads.some((lead) => lead.id === selectedLeadId);
    if (!leadStillExists) {
      setSelectedLeadId(null);
      setIsDetailsOpen(false);
    }
  }, [leads, selectedLeadId]);

  const publicLeadFormUrl = currentWorkspace?.id
    ? `${window.location.origin}/intake?workspaceId=${encodeURIComponent(
        currentWorkspace.id
      )}&source=public`
    : '';

  const copyLeadFormLink = async () => {
    if (!publicLeadFormUrl) {
      toast.error('Select a workspace first');
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicLeadFormUrl);
      }
      toast.success('Lead form link copied');
    } catch (error) {
      console.error(error);
      toast.error('Failed to copy link');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">Leads Access</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          Only workspace admins can manage leads.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-white">
            New Leads
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Copy your workspace form link and review submitted leads.
          </p>
        </div>
        <button
          type="button"
          onClick={copyLeadFormLink}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-200"
        >
          <LinkIcon className="size-4" />
          Copy Lead Form Link
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-500 dark:text-zinc-400 break-all">
        {publicLeadFormUrl || 'No workspace selected'}
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/70">
              <tr className="text-left text-zinc-500 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Business Model</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-zinc-500 dark:text-zinc-400"
                    colSpan={4}
                  >
                    No leads submitted yet.
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    setIsDetailsOpen(true);
                  }}
                  className={`border-t border-zinc-100 dark:border-zinc-800 cursor-pointer ${
                    selectedLead?.id === lead.id
                      ? 'bg-blue-50/70 dark:bg-blue-500/10'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    {lead.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {lead.email}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {lead.businessModel}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {formatDateTime(lead.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailsOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close lead details"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsDetailsOpen(false)}
          />

          <aside
            role="dialog"
            aria-modal="true"
            className="relative h-full w-full max-w-2xl border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Lead Details
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedLead.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="inline-flex items-center justify-center size-8 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Name</p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {selectedLead.name}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Email</p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {selectedLead.email}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Business Model
                  </p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {selectedLead.businessModel}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Submitted</p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {formatDateTime(selectedLead.submittedAt)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                  Biggest Bottleneck
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">
                  {selectedLead.biggestBottleneck}
                </p>
              </div>

              <div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                  Full Submission
                </p>
                <pre className="mt-1 p-3 rounded bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                  {JSON.stringify(selectedLead.payload, null, 2)}
                </pre>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Leads;
