import { CalendarDays, Clock3, FileText, Link2, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';

const InterviewDetailsModal = ({ interview, onClose }) => {
  if (!interview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Interview Details</h3>
            <p className="mt-1 text-sm text-slate-600">Complete interview overview for this candidate.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-500">Close</button>
        </div>

        <div className="mt-6 space-y-3 text-sm text-slate-700">
          <div><span className="font-semibold text-slate-900">Candidate:</span> {`${interview.applicant?.firstName || ''} ${interview.applicant?.lastName || ''}`.trim()}</div>
          <div><span className="font-semibold text-slate-900">Email:</span> {interview.applicant?.email || 'Not provided'}</div>
          <div><span className="font-semibold text-slate-900">Phone:</span> {interview.applicant?.phone || 'Not provided'}</div>
          <div><span className="font-semibold text-slate-900">Position:</span> {interview.job?.title || 'Applied position'}</div>
          <div><span className="font-semibold text-slate-900">Interview Type:</span> {interview.type || 'To be confirmed'}</div>
          <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-500" /><span>Interview Date: {interview.scheduledDate ? format(new Date(interview.scheduledDate), 'MMM d, yyyy') : 'Not scheduled'}</span></div>
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-500" /><span>Interview Time: {interview.scheduledDate ? format(new Date(interview.scheduledDate), 'h:mm a') : 'Not scheduled'}</span></div>
          <div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-slate-500" /><span>Meeting / Location: {interview.meetingLink || interview.location || 'To be confirmed'}</span></div>
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-500" /><span>Employer Notes: {interview.note || 'No notes added yet.'}</span></div>
          <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-500" /><span>Current Status: {interview.status || 'scheduled'}</span></div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailsModal;
