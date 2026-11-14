import React, { useEffect, useMemo, useRef, useState } from "react";

const WORDS = {
  Beginner: [
    { word: "Curious", type: "adjective", phonetic: "/ˈkjʊəriəs/", meaning: "Eager to know or learn something.", example: "The curious student asked thoughtful questions.", prompt: "Tell me one thing you are curious about.", accepted: ["curious"] },
    { word: "Generous", type: "adjective", phonetic: "/ˈdʒenərəs/", meaning: "Willing to give or share more than is expected.", example: "My generous neighbour helped us move.", prompt: "Describe a generous person you know.", accepted: ["generous"] },
    { word: "Reliable", type: "adjective", phonetic: "/rɪˈlaɪəbəl/", meaning: "Someone or something you can trust or depend on.", example: "A reliable teammate keeps their promises.", prompt: "What makes a person reliable?", accepted: ["reliable"] },
    { word: "Observe", type: "verb", phonetic: "/əbˈzɜːrv/", meaning: "To watch something carefully in order to notice details.", example: "Scientists observe how plants grow.", prompt: "What do you like to observe around you?", accepted: ["observe"] },
    { word: "Confident", type: "adjective", phonetic: "/ˈkɒnfɪdənt/", meaning: "Feeling sure about your abilities or decisions.", example: "She felt confident before the presentation.", prompt: "What helps you feel confident?", accepted: ["confident"] }
  ],
  Intermediate: [
    { word: "Resilient", type: "adjective", phonetic: "/rɪˈzɪliənt/", meaning: "Able to recover quickly after difficulties.", example: "The resilient team learned from the setback and tried again.", prompt: "Describe a time you had to be resilient.", accepted: ["resilient"] },
    { word: "Articulate", type: "adjective / verb", phonetic: "/ɑːrˈtɪkjələt/", meaning: "Able to express ideas clearly and effectively; or to express them clearly.", example: "He gave an articulate explanation of the proposal.", prompt: "What helps someone communicate in an articulate way?", accepted: ["articulate"] },
    { word: "Pragmatic", type: "adjective", phonetic: "/præɡˈmætɪk/", meaning: "Focused on practical solutions rather than theories or ideals.", example: "We took a pragmatic approach and fixed the biggest issue first.", prompt: "What is one pragmatic solution to a common problem?", accepted: ["pragmatic"] },
    { word: "Meticulous", type: "adjective", phonetic: "/məˈtɪkjələs/", meaning: "Very careful and attentive to small details.", example: "The editor was meticulous when checking the report.", prompt: "When is being meticulous especially important?", accepted: ["meticulous"] },
    { word: "Ambiguous", type: "adjective", phonetic: "/æmˈbɪɡjuəs/", meaning: "Having more than one possible meaning; not clear.", example: "The instructions were ambiguous, so we asked for clarification.", prompt: "Why can ambiguous instructions cause problems?", accepted: ["ambiguous"] }
  ],
  Advanced: [
    { word: "Ubiquitous", type: "adjective", phonetic: "/juːˈbɪkwɪtəs/", meaning: "Present, appearing, or found everywhere.", example: "Smartphones have become ubiquitous in modern life.", prompt: "Name something that has become ubiquitous in your field.", accepted: ["ubiquitous"] },
    { word: "Ephemeral", type: "adjective", phonetic: "/ɪˈfemərəl/", meaning: "Lasting for a very short time.", example: "The beauty of the sunset was ephemeral.", prompt: "What is something ephemeral that people often overlook?", accepted: ["ephemeral"] },
    { word: "Prudent", type: "adjective", phonetic: "/ˈpruːdənt/", meaning: "Showing good judgment and careful thought, especially about the future.", example: "It was prudent to save an emergency fund.", prompt: "What is a prudent decision when starting a new project?", accepted: ["prudent"] },
    { word: "Nuance", type: "noun", phonetic: "/ˈnuːɑːns/", meaning: "A small but important difference in meaning, feeling, or expression.", example: "A good negotiator understands the nuance in a person's response.", prompt: "Why does nuance matter in communication?", accepted: ["nuance"] },
    { word: "Juxtaposition", type: "noun", phonetic: "/ˌdʒʌkstəpəˈzɪʃən/", meaning: "The act of placing two things side by side to highlight their differences.", example: "The article uses juxtaposition to compare city and rural life.", prompt: "Give an example of juxtaposition in a film or book.", accepted: ["juxtaposition"] }
  ]
};

const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s']/g, "").replace(/\s+/g, " ").trim();

export default function App() {
  const [level, setLevel] = useState("Intermediate");
  const [index, setIndex] = useState(0);
  const [learned, setLearned] = useState([]);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const recognitionRef = useRef(null);
  const word = WORDS[level][index % WORDS[level].length];
  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = (text, rate = 0.92) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  const introduce = () => speak(`Today's word is ${word.word}. ${word.word}. It is a ${word.type}. ${word.meaning} For example: ${word.example}`);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedback({ kind: "info", title: "Voice input isn't supported here", body: "Try Google Chrome or Microsoft Edge, or type your answer below." });
      return;
    }
    if (recognitionRef.current) recognitionRef.current.abort();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setListening(true);
    setFeedback(null);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAnswer(transcript);
      setListening(false);
      evaluate(transcript);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setFeedback({ kind: "info", title: "I couldn't hear that clearly", body: event.error === "not-allowed" ? "Microphone permission was blocked. Allow microphone access in your browser settings." : "Please try again, speak a little more clearly, or type your response." });
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const evaluate = (text) => {
    const clean = normalize(text);
    if (!clean) {
      setFeedback({ kind: "info", title: "Let's try that again", body: "Say or type a sentence using the new word." });
      return;
    }
    const includesWord = clean.split(" ").includes(normalize(word.word));
    if (includesWord && clean.split(" ").length >= 3) {
      setFeedback({ kind: "success", title: "Great use of the word!", body: "You used the target word in a sentence. That's how vocabulary becomes part of your everyday language." });
      setLearned((prev) => prev.includes(`${level}-${word.word}`) ? prev : [...prev, `${level}-${word.word}`]);
    } else if (includesWord) {
      setFeedback({ kind: "info", title: "Good start — add a little more", body: "You included the word. Try using it in a complete sentence so I can understand the context." });
    } else {
      setFeedback({ kind: "try", title: "You're close. Let's practise.", body: `Try again and include “${word.word}” in a sentence. For example: “${word.example}”` });
    }
  };

  const nextWord = () => {
    setIndex((i) => (i + 1) % WORDS[level].length);
    setAnswer("");
    setFeedback(null);
    setShowHint(false);
  };

  const changeLevel = (next) => {
    setLevel(next);
    setIndex(0);
    setAnswer("");
    setFeedback(null);
    setShowHint(false);
  };

  const total = Object.values(WORDS).flat().length;
  const progress = Math.round((learned.length / total) * 100);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="VoxLearn home"><span className="brand-mark">V</span><span>voxlearn</span></a>
        <div className="top-actions">
          <span className="live-pill"><i /> VOICE COACH</span>
          <button className={`sound-toggle ${voiceEnabled ? "on" : ""}`} onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) window.speechSynthesis?.cancel(); }} aria-pressed={voiceEnabled}>{voiceEnabled ? "🔊 Sound on" : "🔇 Sound off"}</button>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <div className="eyebrow">YOUR PERSONAL VOCABULARY COACH</div>
          <h1>Speak better.<br /><em>One word at a time.</em></h1>
          <p className="hero-copy">Build a stronger vocabulary through real conversations, not memorisation.</p>
          <div className="stats-row">
            <div className="stat"><strong>{learned.length}</strong><span>WORDS PRACTISED</span></div>
            <div className="stat-divider" />
            <div className="stat"><strong>{progress}%</strong><span>LIBRARY PROGRESS</span></div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          </div>
        </section>

        <section className="workspace">
          <aside className="side-panel">
            <div className="panel-label">LEARNING PATH</div>
            <p className="side-title">Choose your level</p>
            <div className="level-list">
              {["Beginner", "Intermediate", "Advanced"].map((item, i) => (
                <button key={item} className={`level-option ${level === item ? "selected" : ""}`} onClick={() => changeLevel(item)}>
                  <span className="level-number">0{i + 1}</span><span>{item}</span>{level === item && <span className="check">✓</span>}
                </button>
              ))}
            </div>
            <div className="coach-note">
              <div className="coach-icon">✦</div>
              <strong>A little every day.</strong>
              <p>Practise using new words in your own sentences. That's the secret to remembering them.</p>
            </div>
          </aside>

          <section className="lesson-card">
            <div className="lesson-top">
              <span className="lesson-tag">TODAY'S WORD</span>
              <span className="word-count">WORD {index + 1} <b>/</b> {WORDS[level].length}</span>
            </div>
            <div className="word-heading">
              <div>
                <h2>{word.word}</h2>
                <div className="word-meta"><span>{word.phonetic}</span><i /> <span>{word.type}</span></div>
              </div>
              <button className="pronounce-btn" onClick={() => speak(word.word)} aria-label="Hear pronunciation">🔊</button>
            </div>
            <div className="definition">
              <span className="definition-label">THE MEANING</span>
              <p>{word.meaning}</p>
            </div>
            <div className="example-box">
              <span className="definition-label">IN A SENTENCE</span>
              <p>“{word.example}”</p>
            </div>

            <div className="conversation">
              <div className="conversation-heading"><span className="spark">✳</span><div><strong>Let's make it yours</strong><small>Speak or type a sentence using this word.</small></div></div>
              <div className="prompt">“{word.prompt}”</div>
              <div className="input-wrap">
                <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your sentence goes here..." rows="2" aria-label="Your sentence" />
                <button className={`mic-btn ${listening ? "listening" : ""}`} onClick={startListening} disabled={listening} aria-label="Start speaking">{listening ? <><span className="pulse" /> Listening</> : "🎙 Speak"}</button>
              </div>
              <div className="response-actions">
                <button className="text-btn" onClick={() => { setShowHint(v => !v); }}>{showHint ? "Hide hint" : "Need a hint?"}</button>
                <button className="submit-btn" onClick={() => evaluate(answer)} disabled={!answer.trim()}>Check my sentence <span>→</span></button>
              </div>
              {showHint && <div className="hint-box">Try starting with: “I think being {word.word.toLowerCase()} means...”</div>}
              {feedback && <div className={`feedback ${feedback.kind}`} role="status"><strong>{feedback.title}</strong><p>{feedback.body}</p></div>}
            </div>

            <div className="lesson-footer">
              <span>TAKE YOUR TIME · THERE'S NO WRONG WAY TO LEARN</span>
              <button onClick={nextWord}>Next word <span>→</span></button>
            </div>
          </section>
        </section>
        <footer className="footer"><span>VOXLEARN</span><span>Learn it. Say it. Own it.</span><span>Made for curious minds ✦</span></footer>
      </main>
    </div>
  );
}