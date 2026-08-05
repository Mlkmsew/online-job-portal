import { Camera, Mic, MonitorUp, MessageSquare, NotebookPen, Play, Square, Video } from 'lucide-react';

const LiveInterview = ({ interview, notes, onNotesChange, onSaveNotes, onEndInterview, onBack }) => {
  return (
    <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Live Interview</h2>
          <p className="mt-1 text-sm text-slate-400">{interview?.job?.title || 'Candidate interview'}</p>
        </div>
        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">In Progress</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{interview?.applicant?.firstName || 'Candidate'} {interview?.applicant?.lastName || ''}</h3>
              <p className="mt-1 text-sm text-slate-400">Large candidate video placeholder</p>
            </div>
            <div className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">00:18:42</div>
          </div>

          <div className="mt-6 flex h-64 items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-800/70">
            <div className="text-center">
              <Video className="mx-auto h-12 w-12 text-slate-500" />
              <p className="mt-3 text-sm text-slate-400">Live video preview will appear here.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm">Mute</button>
            <button type="button" className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm"><Camera className="mr-2 inline h-4 w-4" />Camera</button>
            <button type="button" className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm"><MonitorUp className="mr-2 inline h-4 w-4" />Share Screen</button>
            <button type="button" className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm"><MessageSquare className="mr-2 inline h-4 w-4" />Chat</button>
            <button type="button" className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm"><Play className="mr-2 inline h-4 w-4" />Record</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Interview Notes</h3>
              <button type="button" onClick={onSaveNotes} className="rounded-full bg-sky-600 px-3 py-1.5 text-sm text-white">Save Notes</button>
            </div>
            <textarea
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              rows="8"
              className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none"
              placeholder="Write interview notes here..."
            />
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="font-semibold">Questions</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-800/80 p-3">1. Describe your approach to debugging React issues.</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-800/80 p-3">2. How do you handle working under tight deadlines?</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-800/80 p-3">3. What excites you about this role?</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onBack} className="flex-1 rounded-full border border-slate-700 px-3 py-2 text-sm">Back</button>
            <button type="button" onClick={onEndInterview} className="flex-1 rounded-full bg-rose-600 px-3 py-2 text-sm">End Interview</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveInterview;
