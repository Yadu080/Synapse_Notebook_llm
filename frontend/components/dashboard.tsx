'use client';

import { useEffect, useMemo, useState, useTransition, type ComponentType, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRightLeft,
  BrainCircuit,
  FileText,
  GraduationCap,
  Headphones,
  Lightbulb,
  Loader2,
  MessagesSquare,
  Play,
  Sparkles,
  Square,
  UploadCloud,
} from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';
import type { ChatResponse, DocumentItem } from '@/lib/types';

type TabKey = 'chat' | 'summary' | 'study' | 'insights' | 'fusion' | 'battle';

type SummaryResponse = {
  shortSummary: string;
  keyPoints: string[];
  concepts: string[];
};

type StudyResponse = {
  flashcards: { question: string; answer: string }[];
  mcqs: { question: string; options: string[]; answer: string; explanation: string }[];
  examQuestions: string[];
};

type InsightResponse = {
  insights: { title: string; insight: string; evidence: string; impact: string }[];
  themes: string[];
};

type GapsResponse = {
  readinessScore: number;
  gaps: { concept: string; whyItMatters: string; recommendedNextStep: string }[];
};

type FeedResponse = {
  feed: { title: string; type: string; summary: string; action: string }[];
  emergingQuestions: string[];
};

type FusionResponse = {
  unifiedModel: string;
  pillars: string[];
  synthesisSteps: string[];
};

type ConfusionsResponse = {
  confusions: { topic: string; whyConfusing: string; simpleExplanation: string; mentalModel: string }[];
};

type BattleResponse = {
  overview: string;
  differences: string[];
  useCases: { concept: string; bestFor: string }[];
  decisionRule: string;
};

type InsightMode = 'cross' | 'gaps' | 'feed' | 'confusions';

const tabs: { key: TabKey; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: 'chat', label: 'Thinking Chat', icon: MessagesSquare },
  { key: 'summary', label: 'Summary Engine', icon: FileText },
  { key: 'study', label: 'Study Mode', icon: GraduationCap },
  { key: 'insights', label: 'Insight Lab', icon: Lightbulb },
  { key: 'fusion', label: 'Fusion', icon: BrainCircuit },
  { key: 'battle', label: 'Concept Battle', icon: ArrowRightLeft },
];

const sectionTitleClass = 'text-sm font-medium uppercase tracking-[0.24em] text-slate-400';

export function Dashboard() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('chat');
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<ChatResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [study, setStudy] = useState<StudyResponse | null>(null);
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [gaps, setGaps] = useState<GapsResponse | null>(null);
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [fusion, setFusion] = useState<FusionResponse | null>(null);
  const [confusions, setConfusions] = useState<ConfusionsResponse | null>(null);
  const [battle, setBattle] = useState<BattleResponse | null>(null);
  const [conceptA, setConceptA] = useState('Supervised learning');
  const [conceptB, setConceptB] = useState('Reinforcement learning');
  const [status, setStatus] = useState<string>('');
  const [statusTone, setStatusTone] = useState<'neutral' | 'success' | 'error'>('neutral');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadStatusTone, setUploadStatusTone] = useState<'neutral' | 'success' | 'error'>('neutral');
  const [lastUploaded, setLastUploaded] = useState<DocumentItem | null>(null);
  const [activeInsightMode, setActiveInsightMode] = useState<InsightMode>('cross');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('default');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [podcastSource, setPodcastSource] = useState<string>('auto');
  const [uploading, startUpload] = useTransition();
  const [running, startRun] = useTransition();

  const refreshDocuments = async () => {
    const items = await api.listDocuments();
    setDocuments(items);
    setSelectedIds((current) => {
      if (current.length) {
        return current.filter((id) => items.some((item) => item.id === id));
      }
      return items.slice(0, 3).map((item) => item.id);
    });
  };

  useEffect(() => {
    api
      .listDocuments()
      .then((items) => {
        setDocuments(items);
        setSelectedIds(items.slice(0, 3).map((item) => item.id));
      })
      .catch((error: Error) => {
        setStatus(error.message);
        setStatusTone('error');
      });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const selectedDocuments = useMemo(
    () => documents.filter((document) => selectedIds.includes(document.id)),
    [documents, selectedIds],
  );

  const podcastOptions = useMemo(() => {
    const options: { key: string; label: string; text: string }[] = [];

    if (chat?.answer) {
      options.push({
        key: 'chat',
        label: 'Chat answer',
        text: `Here is your grounded answer. ${chat.answer}`,
      });
    }

    if (summary) {
      options.push({
        key: 'summary',
        label: 'Summary',
        text: `Here is your document briefing. ${summary.shortSummary}. Key points: ${summary.keyPoints.join('. ')}. Important concepts: ${summary.concepts.join('. ')}.`,
      });
    }

    if (fusion) {
      options.push({
        key: 'fusion',
        label: 'Knowledge fusion',
        text: `Unified understanding. ${fusion.unifiedModel}. Core pillars: ${fusion.pillars.join('. ')}. Suggested synthesis path: ${fusion.synthesisSteps.join('. ')}.`,
      });
    }

    if (battle) {
      options.push({
        key: 'battle',
        label: 'Concept battle',
        text: `Concept battle overview. ${battle.overview}. Key differences: ${battle.differences.join('. ')}. Decision rule: ${battle.decisionRule}.`,
      });
    }

    if (insights?.insights?.length) {
      options.push({
        key: 'insights',
        label: 'Insight feed',
        text: `Here are the strongest cross-document insights. ${insights.insights
          .map((item) => `${item.title}. ${item.insight}. Impact: ${item.impact}.`)
          .join(' ')}`,
      });
    }

    if (gaps?.gaps?.length) {
      options.push({
        key: 'gaps',
        label: 'Knowledge gaps',
        text: `Your readiness score is ${gaps.readinessScore} percent. Missing concepts include ${gaps.gaps
          .map((item) => `${item.concept}. Why it matters: ${item.whyItMatters}. Next step: ${item.recommendedNextStep}.`)
          .join(' ')}`,
      });
    }

    if (confusions?.confusions?.length) {
      options.push({
        key: 'confusions',
        label: 'Confusion detector',
        text: `These concepts may be confusing. ${confusions.confusions
          .map((item) => `${item.topic}. ${item.simpleExplanation}. Mental model: ${item.mentalModel}.`)
          .join(' ')}`,
      });
    }

    if (feed?.feed?.length) {
      options.push({
        key: 'auto-feed',
        label: 'Auto insight feed',
        text: `Proactive insight feed. ${feed.feed
          .map((item) => `${item.title}. ${item.summary}. Recommended action: ${item.action}.`)
          .join(' ')}`,
      });
    }

    return options;
  }, [battle, chat, confusions, feed, fusion, gaps, insights, summary]);

  const podcastScript = useMemo(() => {
    if (!podcastOptions.length) {
      return '';
    }

    if (podcastSource === 'auto') {
      return podcastOptions[0].text;
    }

    return podcastOptions.find((option) => option.key === podcastSource)?.text || podcastOptions[0].text;
  }, [podcastOptions, podcastSource]);

  const startPodcast = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatus('Text to speech is not supported in this browser.');
      setStatusTone('error');
      return;
    }

    if (!podcastScript) {
      setStatus('Generate a summary, chat answer, insight, or fusion first to create podcast audio.');
      setStatusTone('error');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(podcastScript);
    utterance.rate = 1;
    utterance.pitch = 1;

    if (selectedVoice !== 'default') {
      const voice = availableVoices.find((item) => item.voiceURI === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatus('Podcast playback started.');
      setStatusTone('success');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setStatus('Podcast playback failed in this browser.');
      setStatusTone('error');
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopPodcast = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setStatus('Podcast playback stopped.');
    setStatusTone('neutral');
  };

  const runInsightModule = (mode: InsightMode) => {
    setActiveInsightMode(mode);

    if (!requireSelection()) {
      return;
    }

    if (mode === 'cross') {
      run(async () => {
        setStatus('Finding cross-document insights...');
        setInsights(await api.crossInsights({ documentIds: selectedIds }));
        setStatus('Cross-document insights ready.');
      });
      return;
    }

    if (mode === 'gaps') {
      run(async () => {
        setStatus('Detecting knowledge gaps...');
        setGaps(await api.gaps({ documentIds: selectedIds }));
        setStatus('Knowledge gaps mapped.');
      });
      return;
    }

    if (mode === 'feed') {
      run(async () => {
        setStatus('Generating auto insight feed...');
        setFeed(await api.feed({ documentIds: selectedIds }));
        setStatus('Insight feed refreshed.');
      });
      return;
    }

    run(async () => {
      setStatus('Detecting confusions...');
      setConfusions(await api.confusions({ documentIds: selectedIds }));
      setStatus('Confusion patterns extracted.');
    });
  };

  const requireSelection = () => {
    if (!selectedIds.length) {
      setStatus('Select at least one document to activate the workspace.');
      return false;
    }
    return true;
  };

  const handleUpload = (file: File) => {
    startUpload(async () => {
      try {
        setStatus(`Ingesting ${file.name}...`);
        setStatusTone('neutral');
        setUploadStatus(`Ingesting ${file.name}...`);
        setUploadStatusTone('neutral');
        const created = await api.uploadDocument(file);
        setDocuments((current) => [created, ...current.filter((item) => item.id !== created.id)]);
        setSelectedIds((current) => Array.from(new Set([created.id, ...current])));
        setLastUploaded(created);
        await refreshDocuments();
        setStatus(`${created.title} is now indexed and ready.`);
        setStatusTone('success');
        setUploadStatus(`${created.title} uploaded and indexed successfully.`);
        setUploadStatusTone('success');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        setStatus(message);
        setStatusTone('error');
        setUploadStatus(message);
        setUploadStatusTone('error');
      }
    });
  };

  const run = (task: () => Promise<void>) => {
    startRun(async () => {
      try {
        await task();
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Something went wrong');
        setStatusTone('error');
      }
    });
  };

  return (
    <div className="min-h-screen bg-grid bg-[size:40px_40px]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 p-4 lg:p-6">
        <aside className="glass card-border hidden w-[280px] shrink-0 rounded-[28px] p-5 shadow-glow lg:flex lg:flex-col">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-sky-300">Synapse Notebook</div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white">
              AI workspace for building understanding across documents
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Upload sources, ask grounded questions, surface hidden links, and turn raw reading into usable knowledge.
            </p>
          </div>

          <div className="mt-8">
            <div className={sectionTitleClass}>Workspace</div>
            <div className="mt-3 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition',
                      activeTab === tab.key
                        ? 'bg-sky-400/15 text-white ring-1 ring-sky-300/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex-1">
            <div className={sectionTitleClass}>Indexed Documents</div>
            <div className="mt-3 space-y-3">
              {documents.map((document) => {
                const active = selectedIds.includes(document.id);
                return (
                  <button
                    key={document.id}
                    onClick={() =>
                      setSelectedIds((current) =>
                        active ? current.filter((id) => id !== document.id) : [...current, document.id],
                      )
                    }
                    className={clsx(
                      'w-full rounded-2xl border px-4 py-3 text-left transition',
                      active
                        ? 'border-sky-300/40 bg-sky-400/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{document.title}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {document.chunkCount} chunks • {document.wordCount} words
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-slate-300">
                        {document.metadata?.sourceType || 'doc'}
                      </div>
                    </div>
                  </button>
                );
              })}
              {!documents.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                  No documents yet. Upload PDFs or text files to start building a knowledge graph.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
            <div className="font-medium">Knowledge readiness</div>
            <div className="mt-2 text-3xl font-semibold">{gaps?.readinessScore ?? '--'}%</div>
            <p className="mt-2 text-xs leading-5 text-amber-50/80">
              Gap detection scores how complete the current document set is for deep understanding.
            </p>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <section className="glass card-border rounded-[28px] p-5 shadow-glow">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-gold">Knowledge Intake</div>
                <div className="mt-2 text-2xl font-semibold">Feed the workspace and activate cross-document reasoning</div>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-100">
                <UploadCloud className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload PDF or TXT'}
                <input
                  type="file"
                  accept=".pdf,.txt,text/plain,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleUpload(file);
                    }
                    event.target.value = '';
                  }}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {selectedDocuments.map((document) => (
                <div
                  key={document.id}
                  className="rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm text-sky-100"
                >
                  {document.title}
                </div>
              ))}
              {!selectedDocuments.length ? (
                <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-400">
                  Select one or more documents
                </div>
              ) : null}
            </div>

            <div
              className={clsx(
                'mt-5 rounded-[24px] border px-4 py-4',
                uploadStatusTone === 'success' && 'border-emerald-300/25 bg-emerald-300/10',
                uploadStatusTone === 'error' && 'border-rose-300/25 bg-rose-300/10',
                uploadStatusTone === 'neutral' && 'border-white/10 bg-black/20',
              )}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Upload Status</div>
                  <div className="mt-2 text-sm text-white">
                    {uploadStatus || 'Choose a PDF or TXT file to start indexing your knowledge base.'}
                  </div>
                </div>
                <div className="text-sm text-slate-300">
                  {documents.length} {documents.length === 1 ? 'document' : 'documents'} indexed
                </div>
              </div>

              {lastUploaded ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Last Uploaded</div>
                  <div className="mt-2 font-medium text-white">{lastUploaded.title}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {lastUploaded.chunkCount} chunks • {lastUploaded.wordCount} words •{' '}
                    {lastUploaded.metadata?.sourceType || 'document'}
                  </div>
                </div>
              ) : null}
            </div>

            {documents.length ? (
              <div className="mt-5">
                <div className={sectionTitleClass}>Recently Indexed</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {documents.slice(0, 4).map((document) => (
                    <div key={document.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <div className="font-medium text-white">{document.title}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {document.chunkCount} chunks • {document.wordCount} words
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 lg:hidden">
              <div className={sectionTitleClass}>Workspace</div>
              <div className="scrollbar-thin mt-3 flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={clsx(
                        'flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm transition',
                        activeTab === tab.key
                          ? 'bg-sky-400/15 text-white ring-1 ring-sky-300/30'
                          : 'border border-white/10 text-slate-300',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 lg:hidden">
              <div className={sectionTitleClass}>Select Documents</div>
              <div className="mt-3 grid gap-3">
                {documents.map((document) => {
                  const active = selectedIds.includes(document.id);
                  return (
                    <button
                      key={document.id}
                      onClick={() =>
                        setSelectedIds((current) =>
                          active ? current.filter((id) => id !== document.id) : [...current, document.id],
                        )
                      }
                      className={clsx(
                        'rounded-2xl border px-4 py-3 text-left transition',
                        active
                          ? 'border-sky-300/40 bg-sky-400/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20',
                      )}
                    >
                      <div className="font-medium text-white">{document.title}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {document.chunkCount} chunks • {document.wordCount} words
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_360px]">
            <section className="glass card-border min-h-[720px] rounded-[28px] p-5 shadow-glow">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {activeTab === 'chat' ? (
                    <div>
                      <div className="flex items-center gap-3">
                        <MessagesSquare className="h-5 w-5 text-sky-300" />
                        <div>
                          <h2 className="text-2xl font-semibold">Multi-document RAG chat</h2>
                          <p className="mt-1 text-sm text-slate-400">
                            Ask grounded questions across the entire selected corpus.
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4">
                        <textarea
                          value={question}
                          onChange={(event) => setQuestion(event.target.value)}
                          placeholder="Ask what connects these documents, where they disagree, or what matters most..."
                          className="min-h-[140px] w-full resize-none border-none bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                        />
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => {
                              if (!requireSelection() || !question.trim()) {
                                return;
                              }
                              run(async () => {
                                setStatus('Running grounded retrieval...');
                                const response = await api.chat({ question, documentIds: selectedIds });
                                setChat(response);
                                setStatus('Grounded answer ready.');
                              });
                            }}
                            className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-medium text-slate-950"
                          >
                            Ask Synapse
                          </button>
                        </div>
                      </div>
                      {chat ? (
                        <div className="mt-6 space-y-4">
                          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Answer</div>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-100">{chat.answer}</p>
                          </div>
                          <div className="grid gap-4 lg:grid-cols-2">
                            {chat.sources.map((source) => (
                              <div
                                key={source.id}
                                className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300"
                              >
                                <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-500">
                                  <span>Source</span>
                                  <span>{source.score.toFixed(3)}</span>
                                </div>
                                <p className="mt-3 line-clamp-6 leading-6">{source.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {activeTab === 'summary' ? (
                    <ActionPanel
                      title="Smart Summary Engine"
                      description="Generate executive summaries, key points, and concept maps for a single document or a full document set."
                      actionLabel="Generate summary"
                      onAction={() => {
                        if (!requireSelection()) {
                          return;
                        }
                        run(async () => {
                          setStatus('Summarizing selected knowledge...');
                          const response = await api.summarize({ documentIds: selectedIds });
                          setSummary(response);
                          setStatus('Summary generated.');
                        });
                      }}
                    >
                      {summary ? (
                        <div className="space-y-4">
                          <InfoCard title="Short summary" content={summary.shortSummary} />
                          <ListCard title="Key points" items={summary.keyPoints} />
                          <ListCard title="Important concepts" items={summary.concepts} variant="amber" />
                        </div>
                      ) : (
                        <EmptyState icon={FileText} text="Run the summary engine to compress the selected corpus into a high-signal overview." />
                      )}
                    </ActionPanel>
                  ) : null}

                  {activeTab === 'study' ? (
                    <ActionPanel
                      title="Study Mode"
                      description="Turn the current corpus into flashcards, MCQs, and high-value exam questions."
                      actionLabel="Build study pack"
                      onAction={() => {
                        if (!requireSelection()) {
                          return;
                        }
                        run(async () => {
                          setStatus('Generating study materials...');
                          const response = await api.study({ documentIds: selectedIds });
                          setStudy(response);
                          setStatus('Study pack ready.');
                        });
                      }}
                    >
                      {study ? (
                        <div className="space-y-6">
                          <section>
                            <div className={sectionTitleClass}>Flashcards</div>
                            <div className="mt-3 grid gap-4 lg:grid-cols-2">
                              {study.flashcards.map((card, index) => (
                                <motion.div
                                  key={`${card.question}-${index}`}
                                  whileHover={{ rotateY: 180 }}
                                  transition={{ duration: 0.6 }}
                                  className="preserve-3d relative h-56 rounded-[28px] border border-sky-300/20 bg-gradient-to-br from-sky-400/15 to-transparent p-5"
                                >
                                  <div className="hide-backface absolute inset-0 p-5">
                                    <div className="text-xs uppercase tracking-[0.25em] text-sky-200">Question</div>
                                    <div className="mt-4 text-xl font-medium leading-8 text-white">{card.question}</div>
                                  </div>
                                  <div className="card-face-back hide-backface absolute inset-0 p-5">
                                    <div className="text-xs uppercase tracking-[0.25em] text-gold">Answer</div>
                                    <div className="mt-4 text-sm leading-7 text-slate-100">{card.answer}</div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </section>
                          <section>
                            <div className={sectionTitleClass}>Quiz</div>
                            <div className="mt-3 space-y-4">
                              {study.mcqs.map((mcq, index) => (
                                <div key={`${mcq.question}-${index}`} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                                  <div className="text-lg font-medium text-white">{mcq.question}</div>
                                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {mcq.options.map((option: string) => (
                                      <div key={option} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300">
                                        {option}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-4 text-sm text-sky-200">Answer: {mcq.answer}</div>
                                  <div className="mt-2 text-sm text-slate-400">{mcq.explanation}</div>
                                </div>
                              ))}
                            </div>
                          </section>
                          <ListCard title="Exam questions" items={study.examQuestions} />
                        </div>
                      ) : (
                        <EmptyState icon={GraduationCap} text="Generate flashcards and quiz sets directly from your document set." />
                      )}
                    </ActionPanel>
                  ) : null}

                  {activeTab === 'insights' ? (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-2xl font-semibold">Insight Lab</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          Switch between modular AI analysis tools for relationships, missing knowledge, proactive findings, and confusion cleanup.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => runInsightModule('cross')}
                          className={clsx(
                            'rounded-2xl px-4 py-3 text-sm font-medium transition',
                            activeInsightMode === 'cross'
                              ? 'bg-sky-300 text-slate-950'
                              : 'border border-white/10 text-white hover:bg-white/[0.04]',
                          )}
                        >
                          Cross-document insights
                        </button>
                        <button
                          onClick={() => runInsightModule('gaps')}
                          className={clsx(
                            'rounded-2xl px-4 py-3 text-sm font-medium transition',
                            activeInsightMode === 'gaps'
                              ? 'bg-sky-300 text-slate-950'
                              : 'border border-white/10 text-white hover:bg-white/[0.04]',
                          )}
                        >
                          Gap detector
                        </button>
                        <button
                          onClick={() => runInsightModule('feed')}
                          className={clsx(
                            'rounded-2xl px-4 py-3 text-sm font-medium transition',
                            activeInsightMode === 'feed'
                              ? 'bg-sky-300 text-slate-950'
                              : 'border border-white/10 text-white hover:bg-white/[0.04]',
                          )}
                        >
                          Auto insight feed
                        </button>
                        <button
                          onClick={() => runInsightModule('confusions')}
                          className={clsx(
                            'rounded-2xl px-4 py-3 text-sm font-medium transition',
                            activeInsightMode === 'confusions'
                              ? 'bg-sky-300 text-slate-950'
                              : 'border border-white/10 text-white hover:bg-white/[0.04]',
                          )}
                        >
                          Confusion detector
                        </button>
                      </div>

                      <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Active Module</div>
                            <div className="mt-2 text-lg font-medium text-white">
                              {activeInsightMode === 'cross' ? 'Cross-document insights' : null}
                              {activeInsightMode === 'gaps' ? 'Knowledge gap detector' : null}
                              {activeInsightMode === 'feed' ? 'Auto insight feed' : null}
                              {activeInsightMode === 'confusions' ? 'Confusion detector' : null}
                            </div>
                          </div>
                          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                            {selectedIds.length} {selectedIds.length === 1 ? 'doc' : 'docs'} selected
                          </div>
                        </div>
                        <div className="mt-3 text-sm leading-6 text-slate-400">
                          {activeInsightMode === 'cross'
                            ? 'Reveal non-obvious connections, shared themes, and strategic relationships across the selected documents.'
                            : null}
                          {activeInsightMode === 'gaps'
                            ? 'Spot what is missing for complete understanding and recommend what to learn next.'
                            : null}
                          {activeInsightMode === 'feed'
                            ? 'Generate proactive insight cards and emerging questions without waiting for a user prompt.'
                            : null}
                          {activeInsightMode === 'confusions'
                            ? 'Identify ideas that readers commonly misinterpret and replace them with cleaner mental models.'
                            : null}
                        </div>
                        <div className="mt-5">
                          <button
                            onClick={() => runInsightModule(activeInsightMode)}
                            className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-medium text-slate-950"
                          >
                            {activeInsightMode === 'cross' ? 'Run cross-document insights' : null}
                            {activeInsightMode === 'gaps' ? 'Run gap detector' : null}
                            {activeInsightMode === 'feed' ? 'Run auto insight feed' : null}
                            {activeInsightMode === 'confusions' ? 'Run confusion detector' : null}
                          </button>
                        </div>
                      </div>

                      {activeInsightMode === 'cross' && insights ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                          {insights.insights.map((item) => (
                            <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                              <div className="text-lg font-medium text-white">{item.title}</div>
                              <div className="mt-3 text-sm leading-7 text-slate-300">{item.insight}</div>
                              <div className="mt-4 text-xs uppercase tracking-[0.22em] text-sky-200">Evidence</div>
                              <div className="mt-2 text-sm text-slate-400">{item.evidence}</div>
                              <div className="mt-4 rounded-2xl bg-sky-300/10 px-4 py-3 text-sm text-sky-100">{item.impact}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {activeInsightMode === 'feed' && feed ? <ListCard title="Emerging questions" items={feed.emergingQuestions} /> : null}

                      {activeInsightMode === 'feed' && feed?.feed ? (
                        <div className="grid gap-4 lg:grid-cols-3">
                          {feed.feed.map((item) => (
                            <div key={item.title} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.type}</div>
                              <div className="mt-2 text-lg font-medium">{item.title}</div>
                              <div className="mt-3 text-sm leading-7 text-slate-300">{item.summary}</div>
                              <div className="mt-4 text-sm text-gold">{item.action}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {activeInsightMode === 'gaps' && gaps ? (
                        <div className="rounded-[24px] border border-amber-300/20 bg-amber-300/10 p-5">
                          <div className="text-sm uppercase tracking-[0.24em] text-amber-100">Missing knowledge</div>
                          <div className="mt-4 space-y-4">
                            {gaps.gaps.map((gap) => (
                              <div key={gap.concept} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="font-medium text-white">{gap.concept}</div>
                                <div className="mt-2 text-sm text-slate-300">{gap.whyItMatters}</div>
                                <div className="mt-3 text-sm text-amber-100">{gap.recommendedNextStep}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {activeInsightMode === 'confusions' && confusions?.confusions ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                          {confusions.confusions.map((item) => (
                            <div key={item.topic} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                              <div className="font-medium text-white">{item.topic}</div>
                              <div className="mt-3 text-sm text-slate-400">{item.whyConfusing}</div>
                              <div className="mt-4 text-sm text-sky-100">{item.simpleExplanation}</div>
                              <div className="mt-3 rounded-2xl bg-white/[0.04] p-3 text-sm text-slate-300">{item.mentalModel}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {activeInsightMode === 'cross' && !insights ? (
                        <EmptyState icon={Sparkles} text="Run cross-document insights to surface hidden relationships and shared themes." />
                      ) : null}

                      {activeInsightMode === 'gaps' && !gaps ? (
                        <EmptyState icon={AlertTriangle} text="Run the gap detector to see what concepts are missing for full understanding." />
                      ) : null}

                      {activeInsightMode === 'feed' && !feed ? (
                        <EmptyState icon={Lightbulb} text="Run the auto insight feed to generate proactive cards and emerging questions." />
                      ) : null}

                      {activeInsightMode === 'confusions' && !confusions ? (
                        <EmptyState icon={BrainCircuit} text="Run the confusion detector to simplify concepts that are easy to misread." />
                      ) : null}
                    </div>
                  ) : null}

                  {activeTab === 'fusion' ? (
                    <ActionPanel
                      title="Knowledge Fusion Engine"
                      description="Unify many documents into one coherent mental model with a clear synthesis path."
                      actionLabel="Fuse knowledge"
                      onAction={() => {
                        if (!requireSelection()) {
                          return;
                        }
                        run(async () => {
                          setStatus('Fusing selected documents into one model...');
                          setFusion(await api.fusion({ documentIds: selectedIds }));
                          setStatus('Unified model generated.');
                        });
                      }}
                    >
                      {fusion ? (
                        <div className="space-y-4">
                          <InfoCard title="Unified understanding" content={fusion.unifiedModel} />
                          <ListCard title="Core pillars" items={fusion.pillars} />
                          <ListCard title="Synthesis path" items={fusion.synthesisSteps} variant="amber" />
                        </div>
                      ) : (
                        <EmptyState icon={BrainCircuit} text="Collapse the selected corpus into a single decision-ready understanding." />
                      )}
                    </ActionPanel>
                  ) : null}

                  {activeTab === 'battle' ? (
                    <div>
                      <div className="flex items-center gap-3">
                        <ArrowRightLeft className="h-5 w-5 text-sky-300" />
                        <div>
                          <h2 className="text-2xl font-semibold">Concept Battle Mode</h2>
                          <p className="mt-1 text-sm text-slate-400">
                            Compare two ideas using only what your document set supports.
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                        <input
                          value={conceptA}
                          onChange={(event) => setConceptA(event.target.value)}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                        />
                        <input
                          value={conceptB}
                          onChange={(event) => setConceptB(event.target.value)}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                        />
                        <button
                          onClick={() => {
                            if (!requireSelection()) {
                              return;
                            }
                            run(async () => {
                              setStatus('Running concept battle...');
                              setBattle(await api.battle({ conceptA, conceptB, documentIds: selectedIds }));
                              setStatus('Concept comparison ready.');
                            });
                          }}
                          className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-medium text-slate-950"
                        >
                          Compare
                        </button>
                      </div>

                      {battle ? (
                        <div className="mt-6 space-y-4">
                          <InfoCard title="Overview" content={battle.overview} />
                          <ListCard title="Key differences" items={battle.differences} />
                          <div className="grid gap-4 lg:grid-cols-2">
                            {battle.useCases.map((item) => (
                              <div key={item.concept} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                                <div className="text-lg font-medium">{item.concept}</div>
                                <div className="mt-3 text-sm leading-7 text-slate-300">{item.bestFor}</div>
                              </div>
                            ))}
                          </div>
                          <InfoCard title="Decision rule" content={battle.decisionRule} tone="amber" />
                        </div>
                      ) : (
                        <div className="mt-6">
                          <EmptyState icon={ArrowRightLeft} text="Pit two concepts against each other to get grounded tradeoffs and decision rules." />
                        </div>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </section>

            <aside className="glass card-border rounded-[28px] p-5 shadow-glow">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gold" />
                <div>
                  <div className="text-lg font-medium">AI Insight Rail</div>
                  <div className="text-sm text-slate-400">Status, corpus health, and proactive prompts.</div>
                </div>
              </div>
              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  {running || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4 text-sky-300" />}
                  <span>{status || 'Workspace ready. Upload documents or run an AI module.'}</span>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-sky-400/10 p-2 text-sky-200">
                      <Headphones className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Podcast Mode</div>
                      <div className="text-sm text-slate-400">Free browser text to speech</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <select
                      value={podcastSource}
                      onChange={(event) => setPodcastSource(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="auto">Auto pick latest insight</option>
                      {podcastOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedVoice}
                      onChange={(event) => setSelectedVoice(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="default">Default voice</option>
                      {availableVoices.map((voice, index) => (
                        <option key={`${voice.voiceURI}-${voice.lang}-${index}`} value={voice.voiceURI}>
                          {voice.name} {voice.lang ? `(${voice.lang})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-3">
                      <button
                        onClick={startPodcast}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-300 px-4 py-3 text-sm font-medium text-slate-950"
                      >
                        <Play className="h-4 w-4" />
                        Play
                      </button>
                      <button
                        onClick={stopPodcast}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white"
                      >
                        <Square className="h-4 w-4" />
                        Stop
                      </button>
                    </div>
                    <div className="text-sm leading-6 text-slate-400">
                      {isSpeaking
                        ? 'Podcast is currently playing.'
                        : podcastScript
                          ? 'Generate any AI result and play it as a podcast-style audio briefing.'
                          : 'No audio source yet. Run chat, summary, insights, fusion, or battle mode first.'}
                    </div>
                  </div>
                </div>
                <SideCard
                  icon={Lightbulb}
                  title="Cross-document thinking"
                  body="Use Insight Lab after every upload wave to keep generating relationships users would not think to ask for."
                />
                <SideCard
                  icon={AlertTriangle}
                  title="Gap-aware learning"
                  body="Gap detection spots blind spots early, which makes the study pack dramatically more useful."
                />
                <SideCard
                  icon={Sparkles}
                  title="Best flow"
                  body="Upload → Summarize → Chat → Insights → Study → Fusion. That sequence creates the strongest knowledge loop."
                />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function ActionPanel({
  title,
  description,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <button onClick={onAction} className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-medium text-slate-950">
          {actionLabel}
        </button>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function InfoCard({ title, content, tone = 'sky' }: { title: string; content: string; tone?: 'sky' | 'amber' }) {
  return (
    <div
      className={clsx(
        'rounded-[24px] border p-5',
        tone === 'sky' ? 'border-sky-300/20 bg-sky-400/10' : 'border-amber-300/20 bg-amber-300/10',
      )}
    >
      <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{title}</div>
      <div className="mt-3 text-sm leading-7 text-slate-100">{content}</div>
    </div>
  );
}

function ListCard({ title, items, variant = 'sky' }: { title: string; items: string[]; variant?: 'sky' | 'amber' }) {
  return (
    <div
      className={clsx(
        'rounded-[24px] border p-5',
        variant === 'sky' ? 'border-white/10 bg-white/[0.03]' : 'border-amber-300/20 bg-amber-300/10',
      )}
    >
      <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{title}</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-200">
            <div className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-300" />
            <div>{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-sky-300" />
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">{text}</p>
    </div>
  );
}

function SideCard({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-sky-400/10 p-2 text-sky-200">
          <Icon className="h-4 w-4" />
        </div>
        <div className="font-medium text-white">{title}</div>
      </div>
      <div className="mt-3 text-sm leading-7 text-slate-400">{body}</div>
    </div>
  );
}
