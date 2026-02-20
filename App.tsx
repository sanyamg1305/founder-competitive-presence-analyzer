
import React, { useState, useMemo } from 'react';
import { 
  FREQUENCY_OPTIONS, 
  ENGAGEMENT_OPTIONS, 
  TOPIC_OPTIONS, 
  FREQUENCY_MAP, 
  ENGAGEMENT_MAP,
  ACCENT_COLOR 
} from './constants';
import { UserInput, Competitor, CalculatedData, AIAnalysisResult } from './types';
import { analyzePresence } from './services/geminiService';
import { saveAnalysisSession } from './services/supabaseService';
import { ScoreRing } from './components/ScoreRing';
import { GapChart } from './components/GapChart';

const App: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserInput>({
    frequency: '3–5',
    engagement: '50–100 likes',
    userTopics: [],
    competitorTopics: [],
    competitors: [{ id: '1', name: '', frequency: '6–10', engagement: '100–250 likes' }],
    leadInfo: { name: '', email: '', phone: '' }
  });
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

  const calculated = useMemo((): CalculatedData => {
    const userFreqScore = FREQUENCY_MAP[formData.frequency];
    const userEngScore = ENGAGEMENT_MAP[formData.engagement];
    
    const validCompetitors = formData.competitors.filter(c => c.name.trim() !== '');
    const compCount = Math.max(validCompetitors.length, 1);
    
    const compAvgFreqScore = validCompetitors.length > 0
      ? validCompetitors.reduce((acc, c) => acc + FREQUENCY_MAP[c.frequency], 0) / compCount
      : 8;
      
    const compAvgEngScore = validCompetitors.length > 0
      ? validCompetitors.reduce((acc, c) => acc + ENGAGEMENT_MAP[c.engagement], 0) / compCount
      : 150;

    const freqRatio = compAvgFreqScore === 0 ? 1 : userFreqScore / compAvgFreqScore;
    const engRatio = compAvgEngScore === 0 ? 1 : userEngScore / compAvgEngScore;

    const score = (freqRatio * 50) + (engRatio * 50);
    return {
      userFreqScore,
      userEngScore,
      compAvgFreqScore,
      compAvgEngScore,
      finalPresenceScore: Math.min(Math.max(score, 0), 100)
    };
  }, [formData]);

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      // 1. Save to Supabase
      await saveAnalysisSession(formData, calculated);
      
      // 2. Get AI Analysis
      const result = await analyzePresence(formData, calculated);
      setAnalysis(result);
      setStep(6);
    } catch (error) {
      console.error("Analysis or Save failed", error);
      alert("Something went wrong. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = () => {
    if (formData.competitors.length < 5) {
      setFormData({
        ...formData,
        competitors: [...formData.competitors, { id: Date.now().toString(), name: '', frequency: '3–5', engagement: '20–50 likes' }]
      });
    }
  };

  const removeCompetitor = (id: string) => {
    setFormData({
      ...formData,
      competitors: formData.competitors.filter(c => c.id !== id)
    });
  };

  const toggleTopic = (list: 'userTopics' | 'competitorTopics', topic: string) => {
    setFormData(prev => {
      const current = prev[list];
      if (current.includes(topic)) {
        return { ...prev, [list]: current.filter(t => t !== topic) };
      }
      return { ...prev, [list]: [...current, topic] };
    });
  };

  const isLeadFormValid = formData.leadInfo.name && formData.leadInfo.email && formData.leadInfo.phone;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#FFC947]/30">
      <nav className="border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Myntmore Logo" className="w-12 h-12 object-contain" />
            <span className="font-bold text-xl tracking-tight">Myntmore</span>
          </div>
          <div className="text-zinc-500 text-xs font-medium uppercase tracking-widest hidden sm:block">
            Founder Competitive Presence Analyzer
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {step < 6 && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={s} 
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-[#FFC947]' : 'bg-zinc-800'}`} 
                />
              ))}
            </div>

            {/* STEP 1: Your Activity */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-bold mb-2">Your Activity</h1>
                <p className="text-zinc-400 mb-10">Start with your own LinkedIn footprint in the last 30 days.</p>
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold mb-4 text-zinc-300">How many LinkedIn posts have you published?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {FREQUENCY_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setFormData({...formData, frequency: opt})}
                          className={`py-3 rounded-xl border-2 transition-all ${formData.frequency === opt ? 'border-[#FFC947] bg-[#FFC947]/10 text-white' : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-4 text-zinc-300">What is your average engagement per post?</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ENGAGEMENT_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setFormData({...formData, engagement: opt})}
                          className={`py-3 px-4 text-left rounded-xl border-2 transition-all ${formData.engagement === opt ? 'border-[#FFC947] bg-[#FFC947]/10 text-white' : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-12">
                  <button onClick={() => setStep(2)} className="w-full py-4 bg-[#FFC947] text-black font-bold rounded-xl hover:brightness-110 transition-all active:scale-[0.98]">
                    Continue to Competitors
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Competitors */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-bold mb-2">Competitors</h1>
                <p className="text-zinc-400 mb-10">Add up to 5 key competitors you're benchmarking against.</p>
                <div className="space-y-6">
                  {formData.competitors.map((comp, idx) => (
                    <div key={comp.id} className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#FFC947]">Competitor {idx + 1}</span>
                        {formData.competitors.length > 1 && (
                          <button onClick={() => removeCompetitor(comp.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Company or Founder Name"
                        value={comp.name}
                        onChange={(e) => {
                          const newComps = [...formData.competitors];
                          newComps[idx].name = e.target.value;
                          setFormData({ ...formData, competitors: newComps });
                        }}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-[#FFC947] focus:ring-1 focus:ring-[#FFC947] outline-none transition-all"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Frequency</label>
                          <select 
                            value={comp.frequency}
                            onChange={(e) => {
                              const newComps = [...formData.competitors];
                              newComps[idx].frequency = e.target.value as any;
                              setFormData({ ...formData, competitors: newComps });
                            }}
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none"
                          >
                            {FREQUENCY_OPTIONS.map(o => <option key={o} value={o}>{o} posts</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Engagement</label>
                          <select 
                            value={comp.engagement}
                            onChange={(e) => {
                              const newComps = [...formData.competitors];
                              newComps[idx].engagement = e.target.value as any;
                              setFormData({ ...formData, competitors: newComps });
                            }}
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none"
                          >
                            {ENGAGEMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {formData.competitors.length < 5 && (
                    <button onClick={addCompetitor} className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 hover:border-[#FFC947]/30 hover:text-[#FFC947] transition-all flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                      Add Another Competitor
                    </button>
                  )}
                </div>
                <div className="mt-12 flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 border border-zinc-800 text-zinc-400 font-bold rounded-xl hover:bg-zinc-900 transition-all">Back</button>
                  <button onClick={() => setStep(3)} disabled={formData.competitors.some(c => !c.name)} className="flex-[2] py-4 bg-[#FFC947] text-black font-bold rounded-xl hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all">
                    Continue to Narrative
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Content Themes */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-bold mb-2">Content Themes</h1>
                <p className="text-zinc-400 mb-10">Map out the narrative overlap and gaps.</p>
                <div className="space-y-12">
                  <div>
                    <label className="block text-sm font-semibold mb-4 text-zinc-300">What topics do you mostly post about?</label>
                    <div className="flex flex-wrap gap-3">
                      {TOPIC_OPTIONS.map(topic => (
                        <button key={topic} onClick={() => toggleTopic('userTopics', topic)} className={`px-4 py-2 rounded-full border text-sm transition-all ${formData.userTopics.includes(topic) ? 'bg-[#FFC947] border-[#FFC947] text-black font-medium' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-4 text-zinc-300">What topics do competitors mostly post about?</label>
                    <div className="flex flex-wrap gap-3">
                      {TOPIC_OPTIONS.map(topic => (
                        <button key={topic} onClick={() => toggleTopic('competitorTopics', topic)} className={`px-4 py-2 rounded-full border text-sm transition-all ${formData.competitorTopics.includes(topic) ? 'bg-[#FFC947] border-[#FFC947] text-black font-medium' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-12 flex gap-4">
                  <button onClick={() => setStep(2)} className="flex-1 py-4 border border-zinc-800 text-zinc-400 font-bold rounded-xl hover:bg-zinc-900 transition-all">Back</button>
                  <button onClick={() => setStep(4)} className="flex-[2] py-4 bg-[#FFC947] text-black font-bold rounded-xl hover:brightness-110 transition-all">
                    Review Analysis Ready
                  </button>
                </div>
              </div>
            )}

            {/* NEW STEP 4: Lead Generation Form */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-bold mb-2">Final Details</h1>
                <p className="text-zinc-400 mb-10">Where should we send your full PDF report?</p>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Jane Doe"
                      value={formData.leadInfo.name}
                      onChange={(e) => setFormData({...formData, leadInfo: {...formData.leadInfo, name: e.target.value}})}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4 focus:border-[#FFC947] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Work Email</label>
                    <input 
                      type="email" 
                      placeholder="jane@company.com"
                      value={formData.leadInfo.email}
                      onChange={(e) => setFormData({...formData, leadInfo: {...formData.leadInfo, email: e.target.value}})}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4 focus:border-[#FFC947] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      value={formData.leadInfo.phone}
                      onChange={(e) => setFormData({...formData, leadInfo: {...formData.leadInfo, phone: e.target.value}})}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4 focus:border-[#FFC947] outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="mt-12 flex gap-4">
                  <button onClick={() => setStep(3)} className="flex-1 py-4 border border-zinc-800 text-zinc-400 font-bold rounded-xl hover:bg-zinc-900 transition-all">Back</button>
                  <button 
                    disabled={!isLeadFormValid}
                    onClick={() => setStep(5)} 
                    className="flex-[2] py-4 bg-[#FFC947] text-black font-bold rounded-xl hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    Continue to Final Analysis
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Final Trigger */}
            {step === 5 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-10">
                <div className="w-24 h-24 bg-[#FFC947]/10 rounded-full flex items-center justify-center mx-auto mb-8 accent-glow">
                  <svg className="w-12 h-12 text-[#FFC947]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h1 className="text-4xl font-bold mb-4">Ready for Analysis</h1>
                <p className="text-zinc-400 max-w-md mx-auto mb-12">
                  Thanks, {formData.leadInfo.name.split(' ')[0]}. We're ready to calculate your competitive gap.
                </p>
                <button onClick={handleRunAnalysis} disabled={loading} className="w-full py-5 bg-[#FFC947] text-black text-xl font-black rounded-2xl hover:brightness-110 transition-all disabled:opacity-50 relative overflow-hidden group">
                  <span className={loading ? 'opacity-0' : 'opacity-100'}>Analyze My Competitive Presence</span>
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* DASHBOARD OUTPUT (Now Step 6) */}
        {step === 6 && analysis && (
          <div className="animate-in fade-in zoom-in-95 duration-1000 space-y-12">
            <header className="text-center mb-16">
              <h1 className="text-5xl font-black mb-4 tracking-tight">Analysis Dashboard</h1>
              <p className="text-zinc-400 text-lg">Detailed breakdown for {formData.leadInfo.name}.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center">
                <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mb-8">Founder Presence Score</h2>
                <ScoreRing score={calculated.finalPresenceScore} />
                <div className="mt-10 p-4 bg-black rounded-2xl border border-zinc-800">
                  <p className="text-zinc-300 italic text-sm leading-relaxed">"{analysis.scoreInsight}"</p>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
                  <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mb-6">Posting Frequency Comparison</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="pb-4 font-bold text-zinc-300">Company</th>
                          <th className="pb-4 font-bold text-zinc-300">Frequency</th>
                          <th className="pb-4 font-bold text-zinc-300">Avg Engagement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        <tr className="bg-[#FFC947] text-black">
                          <td className="py-4 px-3 font-bold rounded-l-xl">You</td>
                          <td className="py-4 px-3 font-medium">{formData.frequency} / mo</td>
                          <td className="py-4 px-3 font-medium rounded-r-xl">{formData.engagement}</td>
                        </tr>
                        {formData.competitors.filter(c => c.name).map(comp => (
                          <tr key={comp.id} className="text-zinc-400">
                            <td className="py-4 px-3">{comp.name}</td>
                            <td className="py-4 px-3">{comp.frequency} / mo</td>
                            <td className="py-4 px-3">{comp.engagement}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
                  <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mb-6">Engagement Gap Chart</h2>
                  <GapChart userAvg={calculated.userEngScore} compAvg={calculated.compAvgEngScore} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
                <h2 className="text-sm uppercase tracking-widest text-[#FFC947] font-bold mb-6">Key Opportunity Areas</h2>
                <ul className="space-y-4">
                  {analysis.opportunityAreas.map((area, idx) => (
                    <li key={idx} className="flex gap-3 text-zinc-300">
                      <div className="mt-1 w-5 h-5 bg-[#FFC947]/10 rounded flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-[#FFC947]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                      <span className="text-sm leading-relaxed">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
                <h2 className="text-sm uppercase tracking-widest text-[#FFC947] font-bold mb-6">Positioning Recommendation</h2>
                <p className="text-zinc-300 text-sm leading-relaxed">{analysis.narrativePositioning}</p>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
              <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mb-8 text-center">Updated Founder Headline Suggestions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Category Leadership', content: analysis.headlineSuggestions.categoryLeadership },
                  { label: 'ICP Clarity', content: analysis.headlineSuggestions.icpClarity },
                  { label: 'Bold Differentiation', content: analysis.headlineSuggestions.boldDifferentiation }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 bg-black rounded-2xl border border-zinc-800 hover:border-[#FFC947]/50 transition-colors flex flex-col justify-between group">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFC947] block mb-3">{item.label}</span>
                      <p className="text-white text-sm font-medium leading-snug">{item.content}</p>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(item.content); alert('Copied!'); }} className="mt-6 flex items-center gap-2 text-xs text-zinc-500 hover:text-[#FFC947] transition-colors">
                      Copy Headline
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <section className="mt-20">
              <div className="p-12 rounded-[2.5rem] bg-black border-2 border-[#FFC947] text-center relative overflow-hidden accent-glow">
                <h2 className="text-3xl md:text-4xl font-black mb-6">Want MyntMore to build your entire founder presence + pipeline engine?</h2>
                <button className="px-10 py-5 bg-[#FFC947] text-black font-black text-lg rounded-2xl hover:scale-105 transition-all">
                  Book a Strategy Call
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
