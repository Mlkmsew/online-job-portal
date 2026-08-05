import { Camera, CheckCircle2, ChevronDown, Clock3, FileText, Mic, MicOff, MoreHorizontal, PhoneOff, Plus, Share2, Star, UserCheck, Video } from 'lucide-react';
import { useState } from 'react';

const tabs = ['Notes', 'Questions'];
const workspaceTabs = ['Interview Questions', 'Resume', 'Portfolio'];

const questionList = [
  'Tell me about a project where you improved team velocity.',
  'How do you approach debugging production issues under pressure?',
  'Describe how you would scale a React app for a growing team.',
];

const InterviewRoom = ({ interview, notes, onNotesChange, onSaveNotes, onFinishInterview, onBack }) => {
  const [activePanel, setActivePanel] = useState('Notes');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('Interview Questions');
  const [openQuestion, setOpenQuestion] = useState(0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Live Interview</h2>
          <p className="mt-1 text-sm text-slate-600">{interview?.job?.title || 'Interview in progress'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">Interview in Progress</div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700"><Clock3 className="mr-2 inline h-4 w-4" />42:15</div>
          <button type="button" onClick={onFinishInterview} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white">End Interview</button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Candidate Video</p>
                <h3 className="mt-1 text-lg font-semibold">{interview?.applicant?.firstName || 'Candidate'} {interview?.applicant?.lastName || ''}</h3>
              </div>
              <div className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-300">Live</div>
            </div>
            <div className="mt-5 flex h-72 items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/80">
              <div className="text-center">
                <Video className="mx-auto h-12 w-12 text-slate-500" />
                <p className="mt-3 text-sm text-slate-400">Simulated video stream preview</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Mute', 'Camera', 'Share Screen', 'Chat', 'Record', 'More'].map((item) => (
                <button key={item} type="button" className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">{item}</button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Candidate Workspace</h3>
              <div className="flex gap-2">
                {workspaceTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveWorkspaceTab(tab)}
                    className={`rounded-full px-3 py-1.5 text-sm ${activeWorkspaceTab === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {activeWorkspaceTab === 'Interview Questions' && (
                <div className="space-y-3">
                  {questionList.map((question, index) => (
                    <div key={question} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpenQuestion(index)}>
                        <span className="font-medium text-slate-900">{question}</span>
                        <ChevronDown className={`h-4 w-4 text-slate-500 transition ${openQuestion === index ? 'rotate-180' : ''}`} />
                      </button>
                      {openQuestion === index && <p className="mt-2 text-sm text-slate-600">Use this time to probe the candidate on collaboration, ownership, and decision making.</p>}
                    </div>
                  ))}
                </div>
              )}
              {activeWorkspaceTab === 'Resume' && <p className="text-sm text-slate-600">Resume summary and skill highlights are displayed here for quick reference.</p>}
              {activeWorkspaceTab === 'Portfolio' && <p className="text-sm text-slate-600">Recent projects and case studies can be reviewed side by side.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Interview Notes</h3>
              <button type="button" onClick={onSaveNotes} className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">Save Notes</button>
            </div>
            <div className="mt-3 flex gap-2">
              {tabs.map((tab) => (
                <button key={tab} type="button" onClick={() => setActivePanel(tab)} className={`rounded-full px-3 py-1.5 text-sm ${activePanel === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>
                  {tab}
                </button>
              ))}
            </div>
            {activePanel === 'Notes' ? (
              <textarea
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                rows="8"
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none"
                placeholder="Capture observations, follow-up questions, and key moments..."
              />
            ) : (
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {questionList.map((question) => (
                  <div key={question} className="rounded-2xl border border-slate-200 bg-white p-3">{question}</div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onBack} className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Back</button>
            <button type="button" onClick={onFinishInterview} className="flex-1 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">Finish Interview</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
